#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from dataclasses import dataclass, field
from pathlib import Path

import psycopg
from docx import Document


WEEK_RE = re.compile(r"^(\d{1,2})주차_7일간$")
DAY_RE = re.compile(r"^✅\s*DAY?\s*(\d)$", re.IGNORECASE)

SECTION_PATTERNS = {
    "fetal": re.compile(r"(태아\s*발달\s*정보)"),
    "maternal": re.compile(r"(모체\s*변화\s*정보)"),
    "checklist": re.compile(r"(생활\s*체크리스트)"),
    "question": re.compile(r"(태교\s*질문)"),
}


@dataclass
class DayContent:
    fetal_lines: list[str] = field(default_factory=list)
    maternal_lines: list[str] = field(default_factory=list)
    checklist_lines: list[str] = field(default_factory=list)
    question_lines: list[str] = field(default_factory=list)


@dataclass
class WeekContent:
    week_number: int
    prelude_lines: list[str] = field(default_factory=list)
    days: dict[int, DayContent] = field(default_factory=dict)


def normalize_text(value: str) -> str:
    return " ".join(value.strip().split())


def detect_section(value: str) -> str | None:
    stripped = re.sub(r"^[①②③④\d\)\.\s]+", "", value).rstrip(":")
    for key, pattern in SECTION_PATTERNS.items():
        if pattern.search(stripped):
            return key
    return None


def extract_baby_message(lines: list[str]) -> tuple[list[str], str | None]:
    rest: list[str] = []
    baby_message: str | None = None
    for line in lines:
        if line.startswith("👶"):
            baby_message = line
        else:
            rest.append(line)
    return rest, baby_message


def first_or_none(lines: list[str]) -> str | None:
    return lines[0] if lines else None


def parse_docx(path: Path) -> list[WeekContent]:
    doc = Document(str(path))
    weeks: dict[int, WeekContent] = {}
    current_week: WeekContent | None = None
    current_day: int | None = None
    current_section: str | None = None

    for paragraph in doc.paragraphs:
        text = normalize_text(paragraph.text)
        if not text:
            continue

        week_match = WEEK_RE.match(text)
        if week_match:
            week_number = int(week_match.group(1))
            current_week = weeks.setdefault(week_number, WeekContent(week_number))
            current_day = None
            current_section = None
            continue

        day_match = DAY_RE.match(text)
        if day_match and current_week is not None:
            current_day = int(day_match.group(1))
            current_week.days.setdefault(current_day, DayContent())
            current_section = None
            continue

        section = detect_section(text)
        if section and current_week is not None and current_day is not None:
            current_section = section
            continue

        if current_week is None:
            continue

        if current_day is None:
            current_week.prelude_lines.append(text)
            continue

        day_content = current_week.days.setdefault(current_day, DayContent())
        if current_section == "fetal":
            day_content.fetal_lines.append(text)
        elif current_section == "maternal":
            day_content.maternal_lines.append(text)
        elif current_section == "checklist":
            day_content.checklist_lines.append(text)
        elif current_section == "question":
            day_content.question_lines.append(text)

    return [weeks[number] for number in sorted(weeks)]


def build_summary(week: WeekContent) -> tuple[str | None, str | None]:
    source_day = week.days.get(7) or week.days.get(1)
    if not source_day:
        return None, None

    fetal_lines, _ = extract_baby_message(source_day.fetal_lines)
    return first_or_none(fetal_lines), first_or_none(source_day.maternal_lines)


def import_weeks(database_url: str, weeks: list[WeekContent]) -> None:
    with psycopg.connect(database_url) as conn:
        with conn.cursor() as cur:
            for week in weeks:
                baby_summary, mother_summary = build_summary(week)

                cur.execute(
                    """
                    INSERT INTO content.pregnancy_week_data (
                      week_number,
                      title,
                      baby_summary,
                      mother_summary,
                      status,
                      updated_at
                    )
                    VALUES (%s, %s, %s, %s, 'published', timezone('utc', now()))
                    ON CONFLICT (week_number) DO UPDATE
                    SET
                      title = EXCLUDED.title,
                      baby_summary = EXCLUDED.baby_summary,
                      mother_summary = EXCLUDED.mother_summary,
                      status = 'published',
                      updated_at = timezone('utc', now())
                    RETURNING id
                    """,
                    (
                        week.week_number,
                        f"{week.week_number}주차 몸 상태 점검",
                        baby_summary,
                        mother_summary,
                    ),
                )
                week_data_id = cur.fetchone()[0]

                cur.execute(
                    "SELECT id FROM content.pregnancy_day_contents WHERE week_data_id = %s",
                    (week_data_id,),
                )
                day_content_ids = [row[0] for row in cur.fetchall()]

                if day_content_ids:
                    cur.execute(
                        "DELETE FROM content.pregnancy_day_media WHERE day_content_id = ANY(%s)",
                        (day_content_ids,),
                    )

                cur.execute(
                    "DELETE FROM content.week_checklists WHERE week_data_id = %s",
                    (week_data_id,),
                )
                cur.execute(
                    "DELETE FROM content.week_questions WHERE week_data_id = %s",
                    (week_data_id,),
                )
                cur.execute(
                    "DELETE FROM content.pregnancy_day_contents WHERE week_data_id = %s",
                    (week_data_id,),
                )

                for day_number in sorted(week.days):
                    day = week.days[day_number]
                    fetal_lines, baby_message = extract_baby_message(day.fetal_lines)
                    maternal_lines = day.maternal_lines

                    cur.execute(
                        """
                        INSERT INTO content.pregnancy_day_contents (
                          week_data_id,
                          day_number,
                          title,
                          baby_development_payload,
                          baby_message,
                          mother_changes_payload,
                          display_order,
                          updated_at
                        )
                        VALUES (%s, %s, %s, %s::jsonb, %s, %s::jsonb, %s, timezone('utc', now()))
                        RETURNING id
                        """,
                        (
                            week_data_id,
                            day_number,
                            f"Day {day_number}",
                            json.dumps({"items": fetal_lines}),
                            baby_message,
                            json.dumps({"items": maternal_lines}),
                            day_number,
                        ),
                    )
                    day_content_id = cur.fetchone()[0]

                    for idx, line in enumerate(day.checklist_lines, start=1):
                        cur.execute(
                            """
                            INSERT INTO content.week_checklists (
                              week_data_id,
                              day_content_id,
                              day_number,
                              code,
                              title,
                              description,
                              checklist_payload,
                              display_order,
                              is_required,
                              is_active,
                              updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb, %s, %s, true, timezone('utc', now()))
                            """,
                            (
                                week_data_id,
                                day_content_id,
                                day_number,
                                f"w{week.week_number}d{day_number}-check-{idx}",
                                line[:200],
                                line,
                                json.dumps({"rawText": line}),
                                day_number * 100 + idx,
                                idx == 1,
                            ),
                        )

                    for idx, line in enumerate(day.question_lines, start=1):
                        cur.execute(
                            """
                            INSERT INTO content.week_questions (
                              week_data_id,
                              day_content_id,
                              day_number,
                              code,
                              question_text,
                              question_type,
                              help_text,
                              question_payload,
                              display_order,
                              is_required,
                              is_active,
                              updated_at
                            )
                            VALUES (%s, %s, %s, %s, %s, 'text', NULL, %s::jsonb, %s, %s, true, timezone('utc', now()))
                            """,
                            (
                                week_data_id,
                                day_content_id,
                                day_number,
                                f"w{week.week_number}d{day_number}-question-{idx}",
                                line,
                                json.dumps({"rawText": line}),
                                day_number * 100 + idx,
                                idx == 1,
                            ),
                        )

        conn.commit()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("docx_path")
    parser.add_argument("--database-url", required=True)
    args = parser.parse_args()

    weeks = parse_docx(Path(args.docx_path))
    if not weeks:
      raise SystemExit("No weeks found in document.")

    import_weeks(args.database_url, weeks)
    print(
        json.dumps(
            {
                "imported_weeks": [week.week_number for week in weeks],
                "count": len(weeks),
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
