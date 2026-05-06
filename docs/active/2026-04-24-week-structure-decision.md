# 주차 콘텐츠 저장 구조 결정안

작성일: 2026-04-24
상태: **대부분 폐기 (v2 재해석)**
상위 문서: `docs/active/2026-04-23-admin-hierarchy-replan.md` §2.4 (v2), §4.8
결정 사항: `content_items.metadata` 에 Day/Section jsonb 트리로 저장(A) vs 별도 테이블 분해 유지(B) vs 하이브리드(C) 중 택일

> **v2 정정 (2026-04-24 후반)**: DB 마이그레이션(`content_items` 신설)이 전제에서 빠졌으므로 본 문서의 A/B/C 비교는 의미가 없어졌습니다. **현 Postgres 주차 스키마는 그대로 유지**합니다. 본 문서에서 수집된 "checklist/question row 기반 편집 경로 분석"은 현 구조 유지의 근거로 유효하며, 후속 결정(Schift ingest 단위 등)에 참고만 하세요.

---

## 0. 요약

상위 문서 §2.4.3은 주차별 Day × Section × Asset 3중 계층을 **`content_items.metadata` jsonb 트리로 통째 저장**하는 방향을 기본값으로 제안했습니다. §4.8은 이를 열린 결정 사항으로 남겨 두었습니다. 본 문서는 실제 스키마·편집 플로우·읽기 경로·데이터 규모를 조사해 다음 세 옵션을 비교하고 **옵션 C(하이브리드)**를 권장합니다.

핵심 근거 두 가지:
1. **관계형 FK가 이미 존재합니다.** `public.user_checklist_events.checklist_id` → `content_week_checklists.id`, `user_question_events.question_id` → `content_week_questions.id` (`legacyBackend/migrations/20260331172420_move_content_to_public_and_drop_allowlist.sql:317-323`). 이 두 자식 테이블을 jsonb 배열로 접어 올리면 유저 이벤트 FK가 깨집니다. 합성 ID를 쓰면 무결성 보장이 사라집니다.
2. **읽기 경로가 날(per-day/per-checklist) 단위입니다.** 모바일 today/profile/records API는 `week_data_id + day_number` 조합으로 매우 좁은 select를 수행합니다(예: `apps/web/app/api/mobile/today/route.ts:157-204`). jsonb를 사용하면 뷰 층에서 매 요청마다 `jsonb_array_elements`를 풀어야 하며, 인덱스 활용도가 현재 대비 약해집니다.

---

## 1. 현재 구조 (증거)

### 1.1 테이블 관계도 (파일:라인)

`legacyBackend/migrations/20260331172420_move_content_to_public_and_drop_allowlist.sql:12-94`:

```
content_pregnancy_week_data (id, week_number UNIQUE, title, baby/mother_summary, warning_signs, recommended_actions, checklist_intro, question_intro, status)
 ├── content_pregnancy_day_contents (id, week_data_id FK CASCADE, day_number 1..7, title, baby_development_payload jsonb, baby_message, mother_changes_payload jsonb, display_order)
 ├── content_week_checklists (id, week_data_id FK CASCADE, day_content_id FK CASCADE NULLABLE, day_number, code, title, description, checklist_payload jsonb, display_order, is_required, is_active)
 ├── content_week_questions (id, week_data_id FK CASCADE, day_content_id FK CASCADE NULLABLE, day_number, code, question_text, question_type CHECK, help_text, question_payload jsonb, display_order, is_required, is_active)
 └── content_pregnancy_week_media (id, week_data_id FK CASCADE, day_content_id FK CASCADE NULLABLE, day_number, media_scope CHECK, bucket_id, object_path, media_role, alt_text, source_file_name, display_order)

public.user_checklist_events.checklist_id  -> content_week_checklists.id (ON DELETE CASCADE)   [line 317-319]
public.user_question_events.question_id    -> content_week_questions.id  (ON DELETE CASCADE)   [line 321-323]
```

특이점:
- `day_number` 유효 범위는 **1..7** 체크 제약(`day_number_range` CHECK).
- `checklist_payload` / `question_payload` 는 이미 jsonb입니다. 즉 "섹션의 세부 옵션"은 jsonb, "섹션 자체"는 row로 두는 이중 구조입니다.
- week_media 는 `media_scope in ('week','day')` 두 스코프를 지원합니다.

### 1.2 현재 row 수 / 깊이 추정

`legacyBackend/examples/week_24_seed_example.sql` (전체 274줄, 7.5KB)에서 한 주차가 생성하는 row 수:
- week_data: **1 row** / 주
- day_contents: 최대 **7 row** / 주 (day 1..7)
- week_checklists: 24주차 시드 기준 **3 row** (`week_24_seed_example.sql:59-85`), 전 주차 평균 3~5 row 추정
- week_questions: 주차별 1~3 row
- week_media: hero/compare + day별 이미지, 주차당 2~10 row

정리하면 **한 주차 전체 row 수 ≈ 15~25**, 40주차 기준 총 row 수 ≈ **600~1,000**. 작은 규모입니다. 한 주차 payload를 jsonb로 직렬화하면 이미지 경로/옵션 텍스트 포함 약 **8~30KB** 규모로 추정됩니다(week_24 시드 7.5KB는 SQL 오버헤드 포함이므로 순 payload는 더 작습니다).

### 1.3 편집 단위 (overlay 분석)

`apps/web/src/components/admin/content/AdminWeekOverlay.tsx` 1,102줄 컴포넌트가 드러내는 편집 인터페이스:

props 기준 편집 조작 (`AdminWeekOverlay.tsx:14-76`):
- 주차 레벨 필드 변경: `onWeekFieldChange`, `onWeekStatusChange`
- Day 레벨: `onWeekDayChange`, `onAddWeekDay`, `onMoveWeekDay(±1)`, `onRemoveWeekDay`
- Section(Checklist) 레벨: `onWeekSectionChange`, `onAddWeekSection`, `onMoveWeekSection`, `onRemoveWeekSection`
- Asset(Question) 레벨: 동일 4개 조작
- Media 레벨: 동일 4개 조작 + `onUploadWeekMedia`
- 커버 이미지: `onUploadWeekCoverImage`
- 최종 `onSaveWeek`, `onPublishWeek`

82개 이벤트 핸들러 prop 중 add/remove/move/change가 대부분을 차지합니다. 즉 **UI는 주차 단위 오버레이지만, 조작 단위는 섹션/에셋 1개**입니다.

저장 경로(`apps/api/src/routes/admin/weeks.ts:287-456`)는:
1. PATCH 한 번으로 전체 주차 payload 전송
2. 서버가 `current` detail과 diff
3. 없어진 id는 `delete`, 새 id는 `create`, 나머지는 `update`

즉 **클라이언트 UI는 per-row 조작을 로컬 상태에 누적한 뒤, 저장 시 전체 트리를 한 번에 PATCH**합니다. 이 "bulk save diff" 패턴은 jsonb 저장과도 관계형 저장과도 모두 호환됩니다.

### 1.4 모바일 읽기 접근 패턴

**읽기는 철저하게 좁은 범위**입니다.

- `apps/web/app/api/mobile/today/route.ts:131-204`: 현재 주차 1개 + 오늘 day 1개 + 그 day의 checklist만 select. `select: { id, baby_summary, mother_summary }` 처럼 컬럼 프로젝션까지 최소화.
- `apps/web/app/api/mobile/records/route.ts:259-387`: 주차 1개 → 체크리스트/질문 find many.
- `apps/web/app/api/mobile/chat/route.ts:663`: `question_id` 하나로 question row 단건 조회(Flowise 응답 매칭용).
- `apps/web/app/api/mobile/profile/route.ts:228-260`: 주차 단위 + 특정 질문 단건.
- `apps/web/app/api/mobile/weeks/route.ts:271`: 전 주차 summary만.
- `apps/api/src/routes/admin/weeks.ts:216-253`: admin detail은 4개 테이블 병렬 find many.

호출 키 조합: `(week_data_id, day_number)`, `(week_data_id, day_number, is_active)`, `(id)` 단건이 전부입니다. 인덱스도 이 키들로 자연스럽게 설정됩니다.

또한 **ID 참조가 읽기 결과에 그대로 실립니다**. `today/route.ts:218`에서 checklist id를 꺼낸 뒤 `user_checklist_events`와 조인하는 흐름이 있습니다(`user_checklist_events.findMany where checklist_id in (...)`, 같은 파일 220-336). 이 id가 row pk가 아니라 jsonb 인덱스나 합성키라면 이벤트 테이블과의 관계가 성립하지 않습니다.

---

## 2. 두 옵션 비교

### 2.1 옵션 A: jsonb 트리 (§2.4.3 기본 권장)

`content_items (surface=week, week=N)` 단일 row + `metadata` 에 Day/Section/Asset 전체 트리를 인라인 저장. week_checklists/week_questions/day_contents 테이블은 제거.

```sql
{
  "week_number": 24,
  "checklist_intro": "...",
  "question_intro": "...",
  "days": [
    { "day_number": 1, "title": "...", "baby_message": "...", "sections": [
      { "id": "ck-uuid-1", "code": "uterine-tightening", "title": "...",
        "items": [...], "is_required": true, "is_active": true, "display_order": 1 }
    ], "assets": [...] }
  ]
}
```

**장점**
- 주차 1개 = row 1개. 전체 로드가 단일 select.
- admin PATCH 저장 시 단일 update로 완결, diff 로직 제거 가능.
- 새 섹션 타입 추가가 스키마 변경 없이 가능.
- `content_items` 단일 버킷 원칙(§2.4)과 정합.

**단점**
- `user_checklist_events.checklist_id` FK 유지 불가. 합성 ID(`ck-uuid-1` 등)를 앱 층에서 보증해야 하며, **cascade delete가 깨집니다**(`20260331172420_move_content_to_public_and_drop_allowlist.sql:317-323` 의 존재 이유 소멸).
- 모바일 today 쿼리가 `day_number`로 좁게 select하던 것이 전체 jsonb fetch + 앱 필터 또는 뷰 층 `jsonb_array_elements`로 바뀝니다. 인덱스 활용 약화.
- `display_order` 같은 부분 필드 갱신 시 동시 편집 충돌 가능성 상승(전체 row update).
- Prisma 타입 생성이 `content_pregnancy_week_data` 등 5개 모델에서 `content_items` 1개로 바뀌며, 현재 10+ API 파일에서 쓰는 타입이 전부 교체 대상입니다. 회귀 표면이 넓습니다(`apps/web/app/api/mobile/*/route.ts` 7개 + `apps/api/src/routes/admin/*.ts` 3개 확인).

**쿼리 예시**

읽기(현재 day):
```sql
-- 현재 (관계형)
select * from content_pregnancy_day_contents where week_data_id=$1 and day_number=$2;

-- 옵션 A
select day from content_items i,
       lateral jsonb_array_elements(i.metadata->'days') as day
where i.id=$1 and (day->>'day_number')::int = $2;
```

편집(섹션 1개 수정):
```sql
-- 옵션 A
update content_items
set metadata = jsonb_set(
  metadata,
  '{days,0,sections,2,title}',
  '"새 타이틀"'::jsonb
)
where id=$1;
```
→ 섹션 위치 인덱스를 알아야 하므로 서버 측 로직 복잡도 증가.

### 2.2 옵션 B: 관계형 분해 유지

현재 5개 테이블을 그대로 두고, `content_items` 통합 대상에서 **주차 콘텐츠만 예외 처리**. 태그는 `content_pregnancy_week_data` 에 연결(별도 조인 테이블) 또는 주차 단위만 `content_items`에 라이트 row로 병행 생성.

**장점**
- FK/CASCADE/체크 제약 전부 유지. `user_checklist_events` FK 무변경(`20260331172420_*:317-323`).
- 모바일 per-day/per-section select와 인덱스 그대로 유지. 회귀 표면 최소.
- Prisma 스키마/타입/쿼리 전부 무변경. admin API(`apps/api/src/routes/admin/weeks.ts`)도 재작성 불필요.
- 마이그레이션 비용 사실상 0.

**단점**
- §2.4의 "단일 버킷" 비전과 부분 이탈. 주차 콘텐츠가 `content_items` 밖에 있게 됨.
- 통합 검색(예: "18주차 불안 변주")에서 주차 콘텐츠를 별도 뷰로 매핑해야 함.
- 새 섹션 타입 추가 시 테이블/컬럼 변경 필요.

**스키마(요약)**
```
content_items (title, body_md, metadata, embedding, tags)  -- rag/note/home_copy/lexicon/mood_variation만
content_pregnancy_week_data                                -- 유지
  ├── content_pregnancy_day_contents                       -- 유지
  ├── content_week_checklists                              -- 유지
  ├── content_week_questions                               -- 유지
  └── content_pregnancy_week_media                         -- 유지

content_week_tags (week_data_id, tag_id)                   -- 신규, 필요 시
```

### 2.3 옵션 C: 하이브리드 (권장)

**경계선**: "외래 참조가 있는 것은 row 유지, 외래 참조가 없는 것은 jsonb로 흡수".

| 현재 테이블 | C안 처리 | 근거 |
|---|---|---|
| `content_pregnancy_week_data` | **`content_items (surface=week)` 로 편입**. `week_number`/`title`/`status` 는 컬럼 또는 metadata. | 외래 참조 없음. |
| `content_pregnancy_day_contents` | **jsonb 로 흡수** (`content_items.metadata.days[]`). day row를 외부에서 참조하는 곳 없음. `day_content_id` FK 는 checklists/questions/media에서만 쓰이고 전부 NULLABLE. | `20260331172420_*:48,65,83` 모두 NULLABLE + 중복 키(`day_number`)가 이미 있음. |
| `content_week_checklists` | **row 유지** (`content_week_checklists` 존치). 단, `week_data_id` 를 `content_items.id` 로 재타겟팅. | `user_checklist_events.checklist_id` FK 필수(`20260331172420_*:317-319`). |
| `content_week_questions` | **row 유지** 동일 이유. | `user_question_events.question_id` FK(`20260331172420_*:321-323`). |
| `content_pregnancy_week_media` | **row 유지**. §2.4.3 에서도 이미 별도 테이블 유지 명시(`2026-04-23-admin-hierarchy-replan.md:352`). | binary 자산 오디팅 + object_path 유일성. |

결과 스키마:
```
content_items (id, title, body_md, status, metadata jsonb, embedding, ...)
  - surface=week 인 row: metadata = { week_number, checklist_intro, question_intro, days: [{ day_number, title, baby_message, baby_development: [...], mother_changes: [...] }] }

content_week_checklists.week_item_id -> content_items.id          (기존 week_data_id 컬럼 이름만 변경)
content_week_questions.week_item_id   -> content_items.id
content_pregnancy_week_media.week_item_id -> content_items.id

content_tags / content_content_tags                               (§2.4.1 그대로)
```

**장점**
- `user_checklist_events` / `user_question_events` FK 100% 보존. 무결성·cascade 무변경.
- Day 콘텐츠(순수 텍스트)만 jsonb로 접기 때문에 편집성과 단일 버킷 비전을 동시에 만족. 상위 문서 §2.4 목표 달성.
- 모바일 today 쿼리: day 1개는 jsonb `->` 접근(`metadata->'days'->N`)으로 가능, checklists/questions는 기존 인덱스 그대로.
- 검색·임베딩은 `content_items` 공통 경로. `tags` N:M 모델과 호환.
- 마이그레이션 중 호환 뷰(`v_pregnancy_day_contents`)를 jsonb_array_elements로 깔아 두면 기존 모바일 API 무변경 가능.

**단점**
- 모델이 완벽히 순수하지 않음(Day는 jsonb, Section은 row). 경계를 문서화해야 함.
- 마이그레이션이 A/B 중간 난이도.

**쿼리 예시**

읽기(오늘):
```sql
select
  (i.metadata->'days'->((:day_number)::int - 1)) as day,
  ck.*
from content_items i
left join content_week_checklists ck
  on ck.week_item_id = i.id and ck.day_number = :day_number and ck.is_active
where i.id = :week_item_id;
```

섹션 개별 수정(기존과 동일):
```sql
update content_week_checklists set title=:t where id=:id;
```

Day 텍스트 수정(jsonb):
```sql
update content_items
set metadata = jsonb_set(metadata, '{days,2,baby_message}', to_jsonb(:msg))
where id = :id;
```

---

## 3. 평가 매트릭스

| 기준 | A (jsonb 전체) | B (관계형 유지) | C (하이브리드) |
|---|---|---|---|
| 편집성 (admin PATCH) | ◎ 단일 update | △ 5 테이블 diff | ○ 1 update + 2~3 upsert |
| 읽기 성능 (모바일 today) | △ jsonb 풀기 필요 | ◎ 인덱스 그대로 | ○ day는 jsonb, 섹션은 인덱스 |
| 검색성 (크로스 태그) | ◎ 단일 버킷 | △ 별도 뷰 필요 | ◎ 단일 버킷 |
| FK 무결성 (user events) | × 깨짐 | ◎ 유지 | ◎ 유지 |
| 마이그레이션 비용 | 상 (타입·API 10+ 파일 교체) | 하 (거의 없음) | 중 (week_data → content_items 매핑 + FK rename) |
| 회귀 리스크 | 높음 | 낮음 | 중간 |
| 미래 유연성 (새 섹션 타입) | ◎ 자유 추가 | × 스키마 변경 | ○ Day 레벨은 자유, Section은 기존 패턴 |
| §2.4 단일 버킷 비전 적합도 | ◎ | △ | ◎ |

범례: ◎ 우수 / ○ 양호 / △ 제한적 / × 부적합

---

## 4. 권장: **옵션 C (하이브리드)**

근거:

1. **FK 보존 우선**. `user_checklist_events` / `user_question_events` 는 제품 핵심 동작 — 유저가 체크한 항목, 답한 질문의 기록입니다. 이 FK를 끊고 합성 ID로 대체하면 `ON DELETE CASCADE` 보증을 앱 층 트랜잭션이 떠안아야 하고, 현재 없는 고아 row 정합 버그가 새로 들어올 수 있습니다. 관계형 유지의 이익이 단일 버킷의 기호적 순수성보다 큽니다.

2. **읽기 패턴이 per-day/per-checklist 인덱스를 요구합니다**. `apps/web/app/api/mobile/today/route.ts:157-204` 는 `(week_data_id, day_number, is_active)` 로 좁혀 select + 이후 `user_checklist_events` 조인을 합니다. 이 경로를 jsonb 풀기로 바꾸면 쿼리 planner 가 체크리스트 활성 필터를 인덱스로 못 태웁니다. row 유지가 실용적입니다.

3. **Day 본문은 외부 참조가 없습니다**. `day_contents.id` 를 다른 테이블이 참조하지 않으며(5개 자식 테이블의 `day_content_id` 는 전부 NULLABLE + `day_number` 로도 접근 가능), 콘텐츠 텍스트 7개(day 1..7)를 row로 분해해 얻는 이점이 거의 없습니다. 여기는 jsonb가 자연스럽습니다.

4. **편집성 개선이 실제로 일어납니다**. AdminWeekOverlay의 82개 핸들러 중 Day 본문(baby_message, baby_development_payload, mother_changes_payload, title, display_order) 조작은 jsonb_set 1회로 통일되며, 섹션/질문은 기존 CRUD가 그대로 유지되어 서버 코드 변경이 국소적입니다.

5. **§2.4 "단일 버킷" 비전 충족**. 주차 row 가 `content_items` 로 들어오면 태그·임베딩·검색이 나머지 콘텐츠와 동일 경로를 공유합니다. 체크리스트/질문은 "week_item의 자식"으로 자연스럽게 위치합니다.

A가 매력적이지만 **FK 깨짐 비용이 단일 버킷 미학보다 크고**, B는 안전하지만 **§2.4의 존재 이유가 희석**됩니다. C가 양쪽 실익을 확보합니다.

---

## 5. 영향도

### 5.1 마이그레이션 스크립트 복잡도 (옵션 C 기준)

중간. 단계:
1. `content.content_items` 신설 (§2.4.1).
2. `content_pregnancy_week_data` + 연결된 `content_pregnancy_day_contents` 행을 읽어 **한 주차 = 1 content_items row** 로 조립. `metadata.days[]` 로 day 행을 직렬화. `(surface, week=N)` 태그 부여.
3. `content_week_checklists` / `content_week_questions` / `content_pregnancy_week_media` 에 `week_item_id uuid` 컬럼 추가, 기존 `week_data_id` 와 동일 uuid로 값 채움(동일 PK 재사용 가능). 이후 `week_data_id` 는 deprecated 처리.
4. FK rename: `user_checklist_events_checklist_id_fkey` 변경 불필요(대상 테이블 유지).
5. 호환 뷰 재작성:
   - `v_pregnancy_week_data`: `content_items (surface=week)` → 기존 컬럼 매핑.
   - `v_pregnancy_day_contents`: `jsonb_array_elements(metadata->'days')` 로 flatten.
   - `v_week_checklists` / `v_week_questions`: `week_item_id` 기준 join.
6. `content_pregnancy_week_data` / `content_pregnancy_day_contents` 는 **drop 하지 않고 read-only freeze** (상위 문서 §3 Step 2.5 원칙).

### 5.2 호환 뷰 작성 난이도

중~낮음. day_contents 가 `jsonb_array_elements` 한 번으로 풀립니다. LATERAL 패턴은 이미 §2.4.5 예시와 동형. 기존 `published_pregnancy_weeks`, `v_pregnancy_day_contents` 의 컬럼 시그니처를 동일하게 유지하면 모바일 API 코드 변경 0.

### 5.3 관리자 UI 변경 범위

- AdminWeekOverlay.tsx: props 시그니처 유지. 내부 상태 관리는 바꾸지 않아도 동작. Day 저장 경로만 "`day_contents.update`" 대신 "`content_items.update(metadata)`" 로 교체.
- `apps/api/src/routes/admin/weeks.ts:287-456` PATCH 핸들러: day 처리 루프(`weeks.ts:336-353`)를 jsonb 조립으로 바꾸고, sections/assets/media 루프는 `week_data_id` → `week_item_id` 리네임만. 변경 국소.
- Mobile API 10+ 파일: 뷰 이름 유지 전제하에 무변경 가능.

### 5.4 테스트 영향

- `apps/web/app/api/mobile/today/route.test.ts:401-519`, `apps/web/app/api/mobile/weeks/route.test.ts:16-231`, `apps/web/app/api/mobile/records/route.test.ts:316+`, `apps/web/app/api/mobile/profile/route.test.ts:148-272` 등 기존 테스트는 REST 경로 문자열을 기대합니다. 테이블명이 뷰명으로 바뀌는 케이스(현재 Prisma 직접 호출)는 모킹 수정 필요. 영향 파일 약 8~10개.

---

## 6. 열린 이슈

1. **day_contents 의 `id` 를 jsonb 안에 보존할지** — 현재 `content_pregnancy_day_contents.id` 는 외부 참조가 없으므로 jsonb 전환 시 버려도 됩니다. 과거 로그/감사에서 day id 를 썼다면 `metadata.days[].legacy_id` 로 남길 수 있습니다. 감사 목적 외 필요 없음 (`apps/api/src/routes/admin/weeks.ts:432-447` 는 count 집계만 기록).

2. **`checklist_payload` / `question_payload` 이중 jsonb** — 이미 jsonb인 payload 가 row 안에 있습니다. C안에서는 그대로 유지되며 변경 없음. A/B/C 모두 영향 없음.

3. **`week_media` 통합 여부** — 상위 문서 §2.4.3 에서 이미 별도 유지로 결정(`2026-04-23-admin-hierarchy-replan.md:352`). 본 결정에서도 동일.

4. **호환 뷰 유지 기간** — 최소 1 릴리스 사이클 유지 후 `content_pregnancy_week_data` / `content_pregnancy_day_contents` 물리 drop 여부를 별도 결정. 현 시점에서는 freeze만.

5. **C안의 `week_item_id` 네이밍** — `week_data_id` 유지도 가능합니다(컬럼명을 바꾸지 않으면 FK/인덱스 재작성이 불필요). 물리적 컬럼명은 그대로 두고, 참조 대상만 `content_items(id)` 로 변경하는 것이 최소 변경안입니다. 네이밍 일관성과 마이그레이션 비용을 저울질해서 결정 필요.

6. **Admin 편집에서 섹션 day 재배치** — 섹션의 `day_number` 를 바꿀 때 `day_content_id` FK 도 재매핑해야 합니다(현재 코드: `weeks.ts:357-373`). C안에서는 `day_content_id` 컬럼 자체를 드롭(Day 가 row 가 아니므로) 하고 `day_number` 만 유지. 단순화됩니다.

---

## 7. 다음 스텝 (승인 후)

1. 본 문서 유저 승인.
2. `docs/active/2026-04-23-admin-hierarchy-replan.md` §2.4.3 테이블을 옵션 C 반영으로 개정(체크리스트/질문/미디어를 "별도 테이블 유지"로 명시).
3. `legacyBackend/migrations/YYYYMMDD_week_content_items_hybrid.sql` 초안 작성 — 위 5.1 단계 반영.
4. 호환 뷰 SQL 작성 후 staging 에서 모바일 today/profile/records API 회귀 테스트.
5. `apps/api/src/routes/admin/weeks.ts` PATCH 핸들러 리팩터 + Prisma 타입 재생성.

끝.
