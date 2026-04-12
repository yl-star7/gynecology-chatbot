"""
docx 전체 재파싱 + baby_message 3인칭 변환 + SQL 마이그레이션 생성

1. docx에서 전체 콘텐츠 파싱
2. baby_message를 Gemini로 3인칭 변환
3. SQL UPDATE 마이그레이션 생성
"""

import json
import os
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from import_pregnancy_docx_to_sql import parse_docx, escape_sql

from google import genai
from google.genai import types

DOCX_PATH = "/Users/jskang/Downloads/임신 주수 별 발달정보(0320_room).docx"
OUTPUT_SQL = Path(__file__).parent.parent / "supabase" / "migrations" / "20260412_reimport_pregnancy_content.sql"
OUTPUT_JSON = Path(__file__).parent / "reimport_results.json"

SYSTEM_PROMPT = """\
당신은 임산부 대상 모성간호 앱의 콘텐츠 에디터입니다.

아기의 발달 정보를 1인칭(아기 시점) → 3인칭(관찰자 시점)으로 변환합니다.

## 변환 규칙

1. "엄마," "엄마!" 등 호칭 제거
2. "내", "나", "나의", "저", "저는", "제" → 삭제하거나 "아가" 주어로 대체
3. 주어를 "아가는" 또는 "아가의"로 시작
4. -어요/-해요 존댓말 유지
5. 이모지(👶 등) 제거
6. "아기의 말:" 같은 프레임 제거
7. 따뜻하고 정보 전달 중심의 톤 유지
8. 원래 내용의 의학적/발달 정보는 그대로 보존
9. [주차 일차] 같은 라벨을 결과에 포함하지 마세요

## 변환 예시

입력: "엄마, 내 심장이 오늘부터 콩닥거리기 시작했어요!"
출력: "아가는 심장이 오늘부터 콩닥거리기 시작했어요."

입력: "엄마 뱃속이 나만의 아늑한 물침대 같아요!"
출력: "아가는 엄마 뱃속의 아늑한 양수 속에서 편안히 지내고 있어요."

입력: '👶 아기의 말": "엄마! 나 여기 있다는 증거를 보여줬어요."'
출력: "아가는 초음파에서 작은 모습을 보여주기 시작했어요."
"""


def collect_messages(weeks: dict) -> list[dict]:
    """모든 baby_message를 수집합니다."""
    messages = []
    for week_num in sorted(weeks.keys()):
        days = weeks[week_num]["days"]
        for day_num in sorted(days.keys()):
            msg = days[day_num].get("baby_message") or ""
            messages.append({
                "week": week_num,
                "day": day_num,
                "label": f"{week_num}주 {day_num}일차",
                "original": msg,
            })
    return messages


def batch_rewrite(messages: list[dict], batch_size: int = 25) -> list[dict]:
    """Gemini API로 배치 변환합니다."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY 또는 GOOGLE_API_KEY 필요")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    # 빈 메시지는 스킵
    non_empty = [m for m in messages if m["original"].strip()]
    empty = [m for m in messages if not m["original"].strip()]
    for m in empty:
        m["rewritten"] = ""

    total = len(non_empty)
    results = []

    for i in range(0, total, batch_size):
        batch = non_empty[i: i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (total + batch_size - 1) // batch_size
        print(f"  [{batch_num}/{total_batches}] {len(batch)}개 변환 중...")

        items = [f'{j + 1}. {msg["original"]}' for j, msg in enumerate(batch)]

        user_prompt = (
            "다음 아기 발달 메시지들을 3인칭으로 변환해주세요.\n"
            "JSON 배열로 응답: [\"변환1\", \"변환2\", ...]\n"
            "라벨이나 번호를 결과에 포함하지 마세요.\n\n"
            + "\n".join(items)
        )

        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=SYSTEM_PROMPT + "\n\n" + user_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,
                    response_mime_type="application/json",
                ),
            )

            parsed = json.loads(response.text)
            if len(parsed) != len(batch):
                print(f"    경고: 요청 {len(batch)}개, 응답 {len(parsed)}개")
                while len(parsed) < len(batch):
                    parsed.append(batch[len(parsed)]["original"])
                parsed = parsed[:len(batch)]

            # Clean up any remaining label prefixes
            for j, (msg, rewritten) in enumerate(zip(batch, parsed)):
                cleaned = re.sub(r"^\[\d+주 \d+일차\]\s*", "", rewritten)
                cleaned = re.sub(r"^\d+\.\s*", "", cleaned)
                msg["rewritten"] = cleaned
                results.append(msg)

        except Exception as e:
            print(f"    오류: {e}")
            for msg in batch:
                msg["rewritten"] = msg["original"]
                results.append(msg)

        if i + batch_size < total:
            time.sleep(1.5)

    return results + empty


def generate_migration(weeks: dict, msg_lookup: dict) -> str:
    """전체 콘텐츠 UPDATE 마이그레이션 생성."""
    lines = [
        "-- docx 전체 재임포트 + baby_message 3인칭 변환",
        "-- 유산 시 아기 직접 말투가 상처가 될 수 있어 관찰자 시점으로 변경",
        "",
        "BEGIN;",
        "",
    ]

    for week_num in sorted(weeks.keys()):
        days = weeks[week_num]["days"]

        # Week-level summary update
        day1 = days.get(1, {})
        baby_summary = "; ".join(day1.get("baby_development", [])[:2]) if day1 else ""
        mother_summary = "; ".join(day1.get("mother_changes", [])[:2]) if day1 else ""

        if baby_summary or mother_summary:
            lines.append(f"-- ===== Week {week_num} =====")
            lines.append(
                f"UPDATE content.pregnancy_week_data SET "
                f"baby_summary = '{escape_sql(baby_summary[:500])}', "
                f"mother_summary = '{escape_sql(mother_summary[:500])}', "
                f"updated_at = timezone('utc', now()) "
                f"WHERE week_number = {week_num};"
            )
            lines.append("")

        for day_num in sorted(days.keys()):
            day = days[day_num]
            baby_dev = json.dumps({"items": day["baby_development"]}, ensure_ascii=False)
            mother_ch = json.dumps({"items": day["mother_changes"]}, ensure_ascii=False)

            key = f"{week_num}-{day_num}"
            baby_msg = msg_lookup.get(key, "")

            lines.append(f"-- {week_num}주 {day_num}일차")
            lines.append(
                f"UPDATE content.pregnancy_day_contents SET "
                f"baby_development_payload = '{escape_sql(baby_dev)}'::jsonb, "
                f"mother_changes_payload = '{escape_sql(mother_ch)}'::jsonb, "
                f"baby_message = '{escape_sql(baby_msg)}', "
                f"updated_at = timezone('utc', now()) "
                f"WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = {week_num}) "
                f"AND day_number = {day_num};"
            )
            lines.append("")

    lines.append("COMMIT;")
    lines.append("")
    return "\n".join(lines)


def main():
    print("=== docx 전체 재파싱 + baby_message 3인칭 변환 ===\n")

    # 1. Parse docx
    print("1. docx 파싱...")
    weeks = parse_docx(DOCX_PATH)
    total_days = sum(len(w["days"]) for w in weeks.values())
    print(f"   {len(weeks)}개 주차, {total_days}개 일차\n")

    # 2. Collect messages
    messages = collect_messages(weeks)
    non_empty = [m for m in messages if m["original"].strip()]
    print(f"2. baby_message 수집: 전체 {len(messages)}개, 비어있지 않은 것 {len(non_empty)}개\n")

    # 3. Gemini 변환
    print("3. Gemini 3인칭 변환...")
    results = batch_rewrite(messages)

    # 4. Build lookup
    msg_lookup = {}
    for r in results:
        key = f"{r['week']}-{r['day']}"
        msg_lookup[key] = r.get("rewritten", "")

    # 5. 샘플 확인
    print("\n--- 변환 샘플 ---")
    shown = 0
    for r in results:
        if r["original"].strip() and shown < 8:
            print(f"  [{r['label']}]")
            print(f"    전: {r['original'][:80]}")
            print(f"    후: {r['rewritten'][:80]}")
            shown += 1
    print()

    # 6. 마이그레이션 생성
    migration = generate_migration(weeks, msg_lookup)
    OUTPUT_SQL.write_text(migration)
    print(f"마이그레이션: {OUTPUT_SQL}")

    # 7. JSON 백업
    with open(OUTPUT_JSON, "w") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"검수용 JSON: {OUTPUT_JSON}")

    # 8. QA
    issues = 0
    for r in results:
        if r["original"].strip() and not r["rewritten"].strip():
            print(f"  경고: {r['label']} 변환 결과 빈 값")
            issues += 1
    print(f"\nQA: 문제 {issues}개")


if __name__ == "__main__":
    main()
