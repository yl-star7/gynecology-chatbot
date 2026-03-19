# Pregnancy DOCX Import Coverage

기준 원본:
- `/Users/jskang/Downloads/임신 주수 별 발달정보(0319_room).docx`

기준 스키마:
- `content.pregnancy_week_data`
- `content.pregnancy_day_contents`
- `content.week_checklists`
- `content.week_questions`

현재 원격 DB 상태:
- `content.pregnancy_week_data`: `draft 17`, `published 23`
- `content.pregnancy_day_contents`: `161`
- `content.week_checklists`: `530`
- `content.week_questions`: `387`
- `published` 주차 범위: `13~35주`
- `draft` 유지 주차: `1~12주`, `36~40주`

## 현재 DB에 들어간 것

- `13~35주` day별 본문 텍스트
  - `태아 발달 정보`
  - `👶 아기의 말`
  - `모체 변화 정보`
  - `생활 체크리스트`
  - `태교 질문`
- 각 day별 체크리스트 항목
- 각 day별 질문 항목
- 주차 요약용 `baby_summary`, `mother_summary`

## 아직 완전 반영되지 않은 것

- 주차별 이미지 매핑
  - 전제: 이미지는 Storage에 있고, 주차별 매칭이다.
  - 아직 현재 원격 데이터에는 주차 이미지 메타데이터가 canonical하게 정리되어 있지 않다.
  - 주차 이미지 메타는 `content.pregnancy_week_media` 또는 현재 원격에 남아 있는 `content.pregnancy_day_media` 정리 후 일관되게 넣어야 한다.
- `baby_size_label`, `baby_size_compare_object`
  - 전제: 이 값은 주차별 매칭이다.
  - 전용 DOCX 기준으로 `5~40주` 값은 채울 수 있다.
  - 다만 `1~4주`는 현재 확인된 source가 없다.
- 주차 시작 전 `prelude` 성격 문장
  - 파서 내부에서 수집 가능한 구조는 있으나 현재 DB 컬럼으로 저장하지 않는다.
- 문서 서식 자체
  - 번호 스타일, 강조, 줄바꿈 뉘앙스, 레이아웃
- 질문 구조화
  - 현재 import된 질문은 사실상 대부분 `question_type='text'`
  - `single_choice`, `yes_no` 등으로 재분류는 아직 안 했다.

## 운영 판단

지금 상태는 아래처럼 보는 게 정확하다.

- `13~35주`의 핵심 텍스트 콘텐츠는 DB화됨
- 하지만 DOCX의 모든 정보를 1:1 완전 이관한 상태는 아님
- 특히 남은 핵심은 `주차 이미지 매핑`이다.

## 다음 반영 우선순위

1. 주차별 이미지 메타 canonical 테이블 확정
2. Storage object path를 주차별로 연결
3. 필요하면 `prelude`용 컬럼 또는 별도 block 추가

## TODO

- 관리자 페이지에서 주차 콘텐츠를 더 편하게 수정할 수 있게 개선
  - 현재는 주차 단위 편집은 가능하지만, day별 본문 편집은 별도 UI가 없다.
- 주차별 이미지 매핑 완성
  - Storage의 실제 이미지와 주차 메타데이터를 canonical 테이블로 연결해야 한다.
- day별 세밀 편집 UI 추가
  - `content.pregnancy_day_contents`
  - `content.week_checklists`
  - `content.week_questions`
  를 week 단위가 아니라 day 단위로 열고 수정할 수 있어야 한다.
- 질문 구조화
  - 현재 대부분 `question_type='text'`라서 필요 시 `yes_no`, `single_choice` 등으로 재분류 필요

## 확인 기준

완전 반영이라고 부르려면 최소한 아래가 충족되어야 한다.

- `13~35주` 각 주차에 대해
  - 주차 요약 있음
  - `Day 1~7` 본문 있음
  - 체크리스트 있음
  - 질문 있음
  - 주차 이미지 메타 있음
  - `baby_size_label`, `baby_size_compare_object` 있음
