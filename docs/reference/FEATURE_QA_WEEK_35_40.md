# 기능 QA 보고서 - 35~40주 콘텐츠 노출

작성일: 2026-03-29
대상 기능: 모바일/채팅에서 사용하는 주차 콘텐츠(오늘 정보, 체크리스트, 질문) 노출 기능
검증 환경: Remote Postgres (`SUPABASE_REMOTE_DATABASE_URL`)

## QA 범위
- 주차 데이터 publish 상태
- Day 1~7 콘텐츠 존재 여부
- Day별 체크리스트/질문 노출 가능 여부
- API가 참조하는 public view 데이터 정합성
- 비교대상 object(`baby_size_compare_object`) 저장 여부

## 테스트 케이스

### TC-01 주차 publish 상태 확인
기준: `35~40주` 모두 `published`

결과:
- 35~40주 전부 `published`
- Verdict: PASS

### TC-02 Day 콘텐츠 완전성 확인
기준: 각 주차에 Day 1~7 콘텐츠가 모두 존재

결과:
- 35~40주 모든 주차에서 `day_count=7`
- Day별 `has_day_content=true` (총 42개 모두 true)
- Verdict: PASS

### TC-03 Day별 체크리스트/질문 노출 가능성 확인
기준: 각 Day에 체크리스트/질문이 최소 1개 이상 존재

결과(요약):
- 35주: checklist 13 / question 12
- 36주: checklist 11 / question 13
- 37주: checklist 9 / question 12
- 38주: checklist 14 / question 13
- 39주: checklist 10 / question 13
- 40주: checklist 22 / question 14
- Day 레벨 검증에서 모든 Day(1~7)가 checklist>=1, question>=1
- Verdict: PASS

### TC-04 API view 정합성 확인
기준: API 소비 view(`v_pregnancy_week_data`, `v_pregnancy_day_contents`, `v_week_checklists`, `v_week_questions`)에서도 동일 범위가 노출

결과:
- `v_pregnancy_week_data`: 35~40주 모두 published
- `v_pregnancy_day_contents`: 주차별 7행
- `v_week_checklists`/`v_week_questions`: 주차별 집계가 본 테이블과 일치
- Verdict: PASS

### TC-05 비교대상 object 확인
기준: `baby_size_compare_object` 값 존재

결과:
- 35: 허니듀 멜론
- 36: 로메인 상추
- 37: 대파
- 38: 무
- 39: 수박
- 40: 호박
- Verdict: PASS

## 결론
- 35~40주 콘텐츠 노출 기능 기준 QA 항목은 모두 PASS입니다.
- 현재 데이터 기준으로 모바일 Today/기록/채팅 컨텍스트에서 필요한 주차-일차 콘텐츠가 모두 조회 가능한 상태입니다.

## 실행 근거 SQL
- `/tmp/feature_qa_week_35_40_summary.sql`
- `/tmp/feature_qa_week_35_40_day_level.sql`
- `/tmp/feature_qa_week_35_40_views.sql`
- `/tmp/feature_qa_week_35_40_view_counts.sql`
