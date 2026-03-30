# Pregnancy Week 35-40 QA Report

작성일: 2026-03-29
범위: `content.pregnancy_week_data`, `content.pregnancy_day_contents`, `content.week_checklists`, `content.week_questions`

## 목적
`35~40주` 데이터가 원문 기준으로 DB에 정상 반영되었는지 검증합니다.

## 기준 문서
- 1차 기준(실제 대조에 사용):
  - `/Users/jskang/Downloads/임신 주수 별 발달정보(0320_room).docx`
- 참고:
  - 요청하신 "HTML 완성 문서" 파일은 현재 워크스페이스/Downloads에서 확인되지 않아, 우선 원문 DOCX 기준으로 QA 수행

## 검증 방법
- DOCX 파싱 기준
  - 주차 헤더: `^(\d{1,2})주(?:차)?_7일간$`
  - Day 헤더: `^✅\s*DAY?\s*(\d)$`
- DB 집계 기준
  - 주차별 `day_count`, `checklist_count`, `question_count`
  - 주차 상태(`status`)와 비교 대상 컬럼(`baby_size_compare_object`)

## 결과 요약
| Week | DOCX Day | DB Day | DOCX Checklist | DB Checklist | DOCX Question | DB Question | Status | Verdict |
|---|---:|---:|---:|---:|---:|---:|---|---|
| 35 | 7 | 7 | 13 | 13 | 12 | 12 | published | PASS |
| 36 | 7 | 7 | 11 | 11 | 13 | 13 | published | PASS |
| 37 | 7 | 7 | 9 | 9 | 12 | 12 | published | PASS |
| 38 | 7 | 7 | 14 | 14 | 13 | 13 | published | PASS |
| 39 | 7 | 7 | 10 | 10 | 13 | 13 | published | PASS |
| 40 | 7 | 7 | 22 | 22 | 14 | 14 | published | PASS |

## baby_size_compare_object 확인
| Week | baby_size_label | baby_size_compare_object |
|---|---|---|
| 35 | 허니듀 멜론 | 허니듀 멜론 |
| 36 | 로메인 상추 | 로메인 상추 |
| 37 | 대파 | 대파 |
| 38 | 무 | 무 |
| 39 | 수박 | 수박 |
| 40 | 호박 | 호박 |

## 결론
- `35~40주`는 원문(DOCX) 집계와 DB 집계가 모두 일치합니다.
- 주차 상태는 모두 `published`이며, 비교 대상 object(`baby_size_compare_object`)도 정상 저장되어 있습니다.

## 후속 권장
- HTML 완성 문서 경로가 공유되면, 동일 리포트에 "HTML 원문 vs DB" 텍스트 단위 diff 섹션을 추가해 2차 QA를 완료합니다.
