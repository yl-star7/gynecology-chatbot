"""
baby_message 1인칭 → 3인칭 일괄 변환 스크립트

기존: "엄마, 내 심장이 오늘부터 콩닥거리기 시작했어요!"
변환: "아가는 심장이 오늘부터 콩닥거리기 시작했어요."

사용법:
  export GEMINI_API_KEY=your-key
  python3 scripts/rewrite_baby_messages.py
"""

import json
import os
import re
import sys
import time
from pathlib import Path

try:
    from google import genai
    from google.genai import types
except ImportError:
    print("google-genai 패키지가 필요합니다.")
    print("pip install google-genai")
    sys.exit(1)

SQL_PATH = Path(__file__).parent.parent / "supabase" / "migrations" / "20260324_seed_pregnancy_week_content.sql"
OUTPUT_PATH = Path(__file__).parent.parent / "supabase" / "migrations" / "20260412_rewrite_baby_messages.sql"

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

## 변환 예시

입력: "엄마, 내 심장이 오늘부터 콩닥거리기 시작했어요!"
출력: "아가는 심장이 오늘부터 콩닥거리기 시작했어요."

입력: "엄마 뱃속이 나만의 아늑한 물침대 같아요!"
출력: "아가는 엄마 뱃속의 아늑한 양수 속에서 편안히 지내고 있어요."

입력: '👶 아기의 말": "엄마! 나 여기 있다는 증거를 보여줬어요."'
출력: "아가는 초음파에서 작은 모습을 보여주기 시작했어요."

입력: "엄마, 나는 지금 폭풍처럼 자라고 있어요."
출력: "아가는 지금 아주 빠르게 자라고 있어요."
"""


def extract_messages(sql_text: str) -> list[dict]:
    """SQL에서 baby_message와 week/day 정보를 추출합니다."""
    # Each INSERT block: SELECT pwd.id, DAY, 'TITLE', dev_payload, mom_payload, baby_message, order, ts
    # FROM content.pregnancy_week_data pwd WHERE pwd.week_number = WEEK
    pattern = re.compile(
        r"SELECT pwd\.id,\s*(\d+),\s*'(\d+)주 (\d+)일차',"
        r"(.*?)"
        r"FROM content\.pregnancy_week_data pwd WHERE pwd\.week_number = (\d+)",
        re.DOTALL,
    )

    results = []
    for match in pattern.finditer(sql_text):
        day_num = int(match.group(1))
        week_label = int(match.group(2))
        day_label = int(match.group(3))
        block = match.group(4)
        week_num = int(match.group(5))

        # Extract baby_message: appears after second ::jsonb, and before the display_order integer
        msg_match = re.search(
            r"::jsonb,\s*\n\s*('(?:[^'\\]|\\.)*'|'[^']*'),\s*\n\s*\d+,",
            block,
        )
        if msg_match:
            raw = msg_match.group(1)
            # Strip outer single quotes
            msg = raw[1:-1]
            results.append({
                "week": week_num,
                "day": day_num,
                "label": f"{week_label}주 {day_label}일차",
                "original": msg,
                "raw_sql": raw,
            })

    return results


def batch_rewrite(messages: list[dict], batch_size: int = 20) -> list[dict]:
    """Gemini API로 배치 변환합니다."""
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY 또는 GOOGLE_API_KEY 환경변수를 설정해주세요.")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    results = []
    total = len(messages)

    for i in range(0, total, batch_size):
        batch = messages[i : i + batch_size]
        batch_num = i // batch_size + 1
        total_batches = (total + batch_size - 1) // batch_size
        print(f"[{batch_num}/{total_batches}] {len(batch)}개 변환 중...")

        # Build prompt with numbered items
        items = []
        for j, msg in enumerate(batch):
            items.append(f"{j + 1}. [{msg['label']}] {msg['original']}")

        user_prompt = (
            "다음 아기 발달 메시지들을 3인칭으로 변환해주세요.\n"
            "각 항목의 번호를 유지하고, 변환된 텍스트만 출력하세요.\n"
            "JSON 배열로 응답해주세요: [\"변환1\", \"변환2\", ...]\n\n"
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
                print(f"  경고: 요청 {len(batch)}개, 응답 {len(parsed)}개 — 불일치!")
                # Pad or truncate
                while len(parsed) < len(batch):
                    parsed.append(batch[len(parsed)]["original"])
                parsed = parsed[: len(batch)]

            for msg, rewritten in zip(batch, parsed):
                msg["rewritten"] = rewritten
                results.append(msg)

        except Exception as e:
            print(f"  오류: {e}")
            # Keep originals on error
            for msg in batch:
                msg["rewritten"] = msg["original"]
                results.append(msg)

        # Rate limit
        if i + batch_size < total:
            time.sleep(2)

    return results


def generate_migration(results: list[dict]) -> str:
    """UPDATE SQL 마이그레이션을 생성합니다."""
    lines = [
        "-- 아기 메시지 1인칭 → 3인칭 변환",
        "-- 유산 시 아기 직접 말투가 상처가 될 수 있어 관찰자 시점으로 변경",
        "",
        "BEGIN;",
        "",
    ]

    for r in results:
        # Escape single quotes in rewritten text
        escaped = r["rewritten"].replace("'", "''")
        original_escaped = r["original"].replace("'", "''")
        lines.append(f"-- {r['label']}: {r['original'][:60]}")
        lines.append(
            f"UPDATE content.pregnancy_day_contents "
            f"SET baby_message = '{escaped}', updated_at = timezone('utc', now()) "
            f"WHERE week_data_id = (SELECT id FROM content.pregnancy_week_data WHERE week_number = {r['week']}) "
            f"AND day_number = {r['day']};"
        )
        lines.append("")

    lines.append("COMMIT;")
    lines.append("")
    return "\n".join(lines)


def main():
    print("=== baby_message 3인칭 변환 스크립트 ===\n")

    # 1. SQL 파싱
    sql_text = SQL_PATH.read_text()
    messages = extract_messages(sql_text)
    print(f"추출된 메시지: {len(messages)}개\n")

    if not messages:
        print("메시지를 찾지 못했습니다.")
        sys.exit(1)

    # 샘플 출력
    print("--- 샘플 (처음 3개) ---")
    for m in messages[:3]:
        print(f"  {m['label']}: {m['original']}")
    print()

    # 2. Gemini 변환
    results = batch_rewrite(messages)

    # 3. 결과 확인
    print("\n--- 변환 결과 샘플 ---")
    for r in results[:5]:
        print(f"  [{r['label']}]")
        print(f"    전: {r['original']}")
        print(f"    후: {r['rewritten']}")
        print()

    # 4. 마이그레이션 생성
    migration = generate_migration(results)
    OUTPUT_PATH.write_text(migration)
    print(f"마이그레이션 생성 완료: {OUTPUT_PATH}")

    # 5. JSON 백업 (검수용)
    backup_path = Path(__file__).parent / "baby_message_rewrite_results.json"
    with open(backup_path, "w") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"검수용 JSON: {backup_path}")


if __name__ == "__main__":
    main()
