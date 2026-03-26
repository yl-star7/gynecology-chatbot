#!/usr/bin/env python3
"""Parse 임신 주수 별 발달정보 docx → SQL migration for content schema."""

import re
import sys
import json
from docx import Document

DOCX_PATH = sys.argv[1] if len(sys.argv) > 1 else "/Users/jskang/Downloads/임신 주수 별 발달정보(0320_room).docx"
OUTPUT_PATH = sys.argv[2] if len(sys.argv) > 2 else "/Users/jskang/Projects/si/supabase/migrations/20260324_seed_pregnancy_week_content.sql"

# Reference numbers like (1)(2)(3) to strip
REF_PATTERN = re.compile(r"\s*(\(\d+\))+\s*$")


def strip_refs(text: str) -> str:
    """Remove trailing reference markers like (1)(3)(5)."""
    return REF_PATTERN.sub("", text).strip()


def parse_docx(path: str):
    doc = Document(path)
    paragraphs = [p.text.strip() for p in doc.paragraphs]

    weeks = {}
    current_week = None
    current_day = None
    current_section = None

    for line in paragraphs:
        if not line:
            continue

        # Week header: "5주차_7일간"
        m = re.match(r"(\d+)주차_7일간", line)
        if m:
            current_week = int(m.group(1))
            weeks[current_week] = {"days": {}}
            current_day = None
            current_section = None
            continue

        if current_week is None:
            continue

        # Day header: "✅ Day 1"
        m = re.match(r"✅\s*Day\s*(\d+)", line)
        if m:
            current_day = int(m.group(1))
            weeks[current_week]["days"][current_day] = {
                "baby_development": [],
                "baby_message": None,
                "mother_changes": [],
                "checklists": [],
                "questions": [],
            }
            current_section = None
            continue

        if current_day is None:
            continue

        day = weeks[current_week]["days"][current_day]

        # Section headers
        if line.startswith("① 태아 발달정보"):
            current_section = "baby"
            continue
        elif line.startswith("② 모체 변화정보"):
            current_section = "mother"
            continue
        elif line.startswith("③ 생활 체크리스트"):
            current_section = "checklist"
            continue
        elif line.startswith("④ 태교 질문"):
            current_section = "question"
            continue

        # Content lines
        if current_section == "baby":
            if line.startswith("👶") or "아기의 말" in line:
                msg = line
                # Strip emoji prefix variants
                for prefix in ["👶 아기의 말:", "👶 아기의 말: ", '👶 아기의 말":', '👶 아기의 말": ']:
                    if msg.startswith(prefix):
                        msg = msg[len(prefix):]
                        break
                msg = msg.strip().strip('"').strip('"').strip('"')
                day["baby_message"] = strip_refs(msg)
            else:
                cleaned = strip_refs(line)
                if cleaned:
                    day["baby_development"].append(cleaned)
        elif current_section == "mother":
            cleaned = strip_refs(line)
            if cleaned:
                day["mother_changes"].append(cleaned)
        elif current_section == "checklist":
            cleaned = strip_refs(line)
            if cleaned:
                day["checklists"].append(cleaned)
        elif current_section == "question":
            cleaned = strip_refs(line)
            if cleaned:
                day["questions"].append(cleaned)

    return weeks


def escape_sql(text: str) -> str:
    return text.replace("'", "''") if text else ""


def generate_sql(weeks: dict) -> str:
    lines = [
        "-- Auto-generated from 임신 주수 별 발달정보 docx",
        "-- Covers weeks: " + ", ".join(str(w) for w in sorted(weeks.keys())),
        "",
        "BEGIN;",
        "",
    ]

    for week_num in sorted(weeks.keys()):
        week = weeks[week_num]
        days = week["days"]

        # Collect week-level summaries from day 1
        day1 = days.get(1, {})
        baby_summary = "; ".join(day1.get("baby_development", [])[:2]) if day1 else ""
        mother_summary = "; ".join(day1.get("mother_changes", [])[:2]) if day1 else ""

        lines.append(f"-- ===== Week {week_num} =====")
        lines.append(f"""
INSERT INTO content.pregnancy_week_data (week_number, title, baby_summary, mother_summary, checklist_intro, question_intro, status, updated_at)
VALUES (
  {week_num},
  '{escape_sql(f"{week_num}주차 발달 정보")}',
  '{escape_sql(baby_summary[:500])}',
  '{escape_sql(mother_summary[:500])}',
  '오늘 함께 해 봐요',
  '아기와 나누는 마음',
  'published',
  timezone('utc', now())
)
ON CONFLICT (week_number) DO UPDATE SET
  title = EXCLUDED.title,
  baby_summary = EXCLUDED.baby_summary,
  mother_summary = EXCLUDED.mother_summary,
  checklist_intro = EXCLUDED.checklist_intro,
  question_intro = EXCLUDED.question_intro,
  status = EXCLUDED.status,
  updated_at = EXCLUDED.updated_at;
""")

        # Day contents
        for day_num in sorted(days.keys()):
            day = days[day_num]
            baby_dev = json.dumps({"items": day["baby_development"]}, ensure_ascii=False)
            mother_ch = json.dumps({"items": day["mother_changes"]}, ensure_ascii=False)
            baby_msg = day.get("baby_message") or ""

            lines.append(f"""INSERT INTO content.pregnancy_day_contents (week_data_id, day_number, title, baby_development_payload, mother_changes_payload, baby_message, display_order, updated_at)
SELECT pwd.id, {day_num}, '{escape_sql(f"{week_num}주 {day_num}일차")}',
  '{escape_sql(baby_dev)}'::jsonb,
  '{escape_sql(mother_ch)}'::jsonb,
  '{escape_sql(baby_msg)}',
  {day_num},
  timezone('utc', now())
FROM content.pregnancy_week_data pwd WHERE pwd.week_number = {week_num}
ON CONFLICT (week_data_id, day_number) DO UPDATE SET
  baby_development_payload = EXCLUDED.baby_development_payload,
  mother_changes_payload = EXCLUDED.mother_changes_payload,
  baby_message = EXCLUDED.baby_message,
  updated_at = EXCLUDED.updated_at;
""")

        # Checklists
        checklist_values = []
        for day_num in sorted(days.keys()):
            day = days[day_num]
            for idx, item in enumerate(day["checklists"]):
                code = f"w{week_num}-d{day_num}-cl-{idx+1}"
                payload = json.dumps({"items": [{"id": code, "label": item}]}, ensure_ascii=False)
                checklist_values.append(
                    f"    ({day_num}, '{escape_sql(code)}', '{escape_sql(item)}', '{escape_sql(item)}', "
                    f"'{escape_sql(payload)}'::jsonb, "
                    f"{idx+1}, true)"
                )

        if checklist_values:
            lines.append(f"""WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = {week_num})
INSERT INTO content.week_checklists (week_data_id, day_number, code, title, description, checklist_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.title, v.description, v.checklist_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
{",\n".join(checklist_values)}
) AS v(day_number, code, title, description, checklist_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  title = EXCLUDED.title, description = EXCLUDED.description,
  checklist_payload = EXCLUDED.checklist_payload, display_order = EXCLUDED.display_order,
  is_required = EXCLUDED.is_required, is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;
""")

        # Questions
        question_values = []
        for day_num in sorted(days.keys()):
            day = days[day_num]
            for idx, item in enumerate(day["questions"]):
                code = f"w{week_num}-d{day_num}-q-{idx+1}"
                question_values.append(
                    f"    ({day_num}, '{escape_sql(code)}', '{escape_sql(item)}', 'text', "
                    f"'편하게 적어 주세요.', '{{}}'::jsonb, {idx+1}, false)"
                )

        if question_values:
            lines.append(f"""WITH wd AS (SELECT id FROM content.pregnancy_week_data WHERE week_number = {week_num})
INSERT INTO content.week_questions (week_data_id, day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required, is_active, updated_at)
SELECT wd.id, v.day_number, v.code, v.question_text, v.question_type, v.help_text, v.question_payload, v.display_order, v.is_required, true, timezone('utc', now())
FROM wd CROSS JOIN (VALUES
{",\n".join(question_values)}
) AS v(day_number, code, question_text, question_type, help_text, question_payload, display_order, is_required)
ON CONFLICT (week_data_id, day_number, code) DO UPDATE SET
  question_text = EXCLUDED.question_text, question_type = EXCLUDED.question_type,
  help_text = EXCLUDED.help_text, question_payload = EXCLUDED.question_payload,
  display_order = EXCLUDED.display_order, is_required = EXCLUDED.is_required,
  is_active = EXCLUDED.is_active, updated_at = EXCLUDED.updated_at;
""")

    lines.append("COMMIT;")
    return "\n".join(lines)


if __name__ == "__main__":
    print(f"Parsing {DOCX_PATH}...")
    weeks = parse_docx(DOCX_PATH)
    print(f"Parsed {len(weeks)} weeks: {sorted(weeks.keys())}")

    total_days = sum(len(w["days"]) for w in weeks.values())
    total_checklists = sum(len(d["checklists"]) for w in weeks.values() for d in w["days"].values())
    total_questions = sum(len(d["questions"]) for w in weeks.values() for d in w["days"].values())
    print(f"  Days: {total_days}, Checklists: {total_checklists}, Questions: {total_questions}")

    sql = generate_sql(weeks)
    with open(OUTPUT_PATH, "w") as f:
        f.write(sql)
    print(f"SQL written to {OUTPUT_PATH} ({len(sql)} bytes)")
