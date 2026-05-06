# 태그 네임스페이스 초안

작성일: 2026-04-24
상태: 제안 (승인 대기) — **v2 재해석 적용**
상위 문서: `docs/active/2026-04-23-admin-hierarchy-replan.md` §2.4 (v2), §4.7
관련 TaskList: #5 — 태그 네임스페이스 확정

> **v2 정정 (2026-04-24 후반)**: 본 문서의 네임스페이스·value 집합은 유효합니다. 단, **Postgres `content.tags` 테이블 시드**가 아니라 **Schift 벡터스토어 document metadata의 tag 문자열**로 쓰입니다. 예: `["surface:rag", "week:18", "topic:nutrition"]`. 문서 하단 시드 SQL 섹션은 폐기 상태이며, 네임스페이스 value 집합만 참고하세요.

---

## 0. 목적

상위 문서 §2.4 는 모든 정적 콘텐츠를 단일 `content.content_items` 버킷 + `content.tags` 네임스페이스 태그로 통합합니다. §2.4.2 에서 6종 네임스페이스(`week`, `surface`, `topic`, `mood`, `scenario`, `lang`)를 제안했으나 각 네임스페이스의 허용 value 집합과 한글 display_label 은 미정이었습니다.

본 문서는 현재 코드베이스에서 실제로 쓰이는 값만을 근거로 6종 네임스페이스의 초기 value 집합·display_label·open/closed 정책을 확정하고, `content.tags` 시드 SQL 을 제공합니다.

---

## 1. 네임스페이스 6종 확정안

### 1.1 `week` — 임신 주차

- **value 범위**: `"1"` ~ `"40"` (정수 문자열)
- **display_label**: `"N주차"` 형식 (예: `"18주차"`)
- **정책**: **closed enum**. 41+ 요청 시 마이그레이션으로만 확장.
- **근거**:
  - `legacyBackend/migrations/20260331172420_move_content_to_public_and_drop_allowlist.sql:27` — `CHECK (week_number BETWEEN 1 AND 40)`
  - `legacyBackend/migrations/drizzle/0000_wet_mattie_franklin.sql:162` — `CHECK ("pregnancy_weeks"."week_number" BETWEEN 1 AND 40)`
  - `legacyBackend/migrations/20260417143000_add_content_paraphrase_tables.sql:72-73` — `CHECK (source_week_number BETWEEN 1 AND 40)`
- **예외 허용**: 태명 변경 안내·일반 홈 카피·언어 사전 등은 `week` 태그 없이 저장 가능. UI 필터에서 "주차 없음" 옵션 제공.

### 1.2 `surface` — 사용처/기능

상위 문서 §2.4.3 매핑 표에 따라 8종.

| value | display_label | 기존 소스 | 근거 | 비고 |
|---|---|---|---|---|
| `rag` | 참조 문서 | `content.content_pregnancy_documents` | `apps/web/src/lib/admin/adapters/cloud-sql-admin-content-port.ts:309-327` | 임베딩 소유 |
| `note` | 지식 안내문 | `content.content_knowledge_items` | `cloud-sql-admin-content-port.ts:300-302` | 정적 안내, 임베딩 없음 |
| `week` | 주차별 콘텐츠 | `content.content_pregnancy_week_data` + `content_pregnancy_day_contents` | 상위 문서 §2.4.3 | Day/Section 트리는 `metadata` jsonb |
| `week_checklist` | 주차별 체크리스트 | `content.content_week_checklists` | 상위 문서 §2.4.3 | `week` 태그와 병행 |
| `week_question` | 주차별 질문 | `content.content_week_questions` | 상위 문서 §2.4.3 | `week` 태그와 병행 |
| `home_copy` | 홈/진입 문구 | `system_config.home_copy` | `apps/web/src/lib/admin/home-copy-config.ts:21-33` | placement 단위 |
| `mood_variation` | 기분별 응답 변주 | (신규) | 상위 문서 §4.1, §2.4.3 | `mood` + `scenario` 병행 |
| `lexicon` | 자유 검색 사전 | (신규) | 상위 문서 §2.4.3, 유저 요구 #6 | 동의어·오타 매핑 |

- **정책**: **closed enum**. 새 사용처 생기면 본 문서 + 시드 SQL 개정.
- **검토된 후보 중 제외**: `onboarding_copy`, `error_copy` 는 현재 코드에 해당 테이블/필드가 없어 포함하지 않습니다. 필요 시 `home_copy` 의 `metadata.placement` 값으로 `onboarding`, `error` 를 쓰면 동일 네임스페이스로 수용 가능합니다.

### 1.3 `topic` — 주제

`content.content_pregnancy_documents.category` / `content.content_knowledge_items.category` 는 `varchar(100) NOT NULL` 자유 입력입니다(`legacyBackend/migrations/drizzle/0000_wet_mattie_franklin.sql:99`, `apps/web/prisma/schema.prisma:239,259`). 그러나 실제 코드에서 사용되는 값은 encyclopedia paraphrase 파이프라인의 `ALLOWED_SECTION_CATEGORIES` 뿐입니다.

근거 — `scripts/generate-weekly-encyclopedia-paraphrases.mjs:12-18`:

```js
const ALLOWED_SECTION_CATEGORIES = new Set([
  "baby_development",
  "mother_body",
  "life_guide",
  "caution",
  "faq",
]);
```

그리고 추가 파생값(`overview`, `reflection_question`, `emotional_note`)이 `scripts/generate-weekly-encyclopedia-paraphrases.mjs:319, 338, 381`, `scripts/content-paraphrase-sync.mjs:80, 113, 130` 에서 발견됩니다.

**초기 value 집합 (closed whitelist)**:

| value | display_label | 근거 | 비고 |
|---|---|---|---|
| `baby_development` | 아기 발달 | `generate-weekly-encyclopedia-paraphrases.mjs:13` | |
| `mother_body` | 엄마 몸 변화 | 같은 파일:14 | |
| `life_guide` | 생활 가이드 | 같은 파일:15 | |
| `caution` | 주의 사항 | 같은 파일:16 | |
| `faq` | 자주 묻는 질문 | 같은 파일:17 | |
| `overview` | 주차 개요 | 같은 파일:319 | paraphrase 파이프라인 |
| `reflection_question` | 돌아보기 질문 | 같은 파일:381 | day 단위 |
| `emotional_note` | 감정 메모 | 같은 파일:206, 227 | 1~2문장 요약 |

- **정책**: **closed whitelist** 권장. 상위 문서 §4.7 에서 "운영자 멘탈 모델 고정"을 위해 closed 를 우선 선택지로 제안했고, 현재 코드 어디에도 위 8개 이외 값이 사용된 흔적이 없습니다.
- **확장 절차**: §4 참조. RAG 문서 카테고리도 이 whitelist 로 정규화합니다. 기존 `varchar(100)` 의 자유 입력 값은 Step 2.5 마이그레이션 시 `topic` 태그로 매핑하며, 매핑 실패하는 row 는 운영자 확인 후 수동 보정합니다.

### 1.4 `mood` — 사용자 감정

- **value 집합**: `calm`, `joyful`, `anxious`, `tired`, `sad` (5종)
- **display_label**: `차분` / `기쁨` / `불안` / `피곤` / `슬픔`
- **정책**: **closed enum**. AI 응답 스키마의 union 타입과 엄격히 일치시킵니다.
- **근거**:
  - `packages/mobile-api/src/workflows/maternal-nursing.yaml:95` — `characterTone: 'calm' | 'joyful' | 'anxious' | 'tired' | 'sad'`
  - 같은 파일:95 — `lastCharacterTone`, `lastEmotionTone`, `nextProfileMemory.lastEmotionTone` 모두 같은 union
  - `packages/mobile-api/src/workflows/subworkflows/letter-reflection.yaml:20` — `"characterTone": "calm" | "sad" | "anxious" | "joyful" | "tired"`
  - `packages/mobile-api/src/workflows/maternal-nursing.yaml:509` — `static_mood_intake` 의 20개 mood prompt 는 전부 위 5개 tone 중 하나로 매핑됨

### 1.5 `scenario` — 대화 시나리오

AI 응답 스키마(`packages/mobile-api/src/workflows/maternal-nursing.yaml:95`)의 `scenario?` union 을 1차 기준으로 삼습니다. 여기에 `static_mood_intake` 및 `static_week_info_opt_in` 상수에서 사용되는 `mood_intake`, `week_info_opt_in` 을 포함합니다(같은 파일:509, 512).

| value | display_label | 근거 |
|---|---|---|
| `mood_intake` | 기분 선택 | `maternal-nursing.yaml:509`, `load-workflow-yaml.test.ts:87` |
| `week_info_opt_in` | 주차 정보 제안 | `maternal-nursing.yaml:512`, `load-workflow-yaml.test.ts:112` |
| `baby_info_offer` | 아기 정보 제안 | `maternal-nursing.yaml:95`, `subworkflows/general.yaml:54`, `load-workflow-yaml.test.ts:132` |
| `baby_info` | 아기 정보 | `maternal-nursing.yaml:95`, `subworkflows/baby-info.yaml:7` |
| `mother_info` | 엄마 정보 | `maternal-nursing.yaml:95`, 같은 파일:496 |
| `week_info` | 주차 정보 | `maternal-nursing.yaml:95`, 같은 파일:320 |
| `symptom_counsel` | 증상 상담 | `maternal-nursing.yaml:95`, 같은 파일:321 |
| `emotion_checkin` | 감정 체크인 | `maternal-nursing.yaml:95`, 같은 파일:319 |
| `emotion_reason` | 감정 이유 | `maternal-nursing.yaml:95`, 같은 파일:347 |
| `attachment_question` | 모아애착 질문 | `maternal-nursing.yaml:95`, 같은 파일:506 |
| `letter_reflection` | 편지 회신 | `maternal-nursing.yaml:95`, `subworkflows/letter-reflection.yaml:9` |
| `daily_followup` | 오늘 후속 대화 | `maternal-nursing.yaml:95`, 같은 파일:76 |
| `empathy_chat` | 공감 대화 | `maternal-nursing.yaml:95`, 같은 파일:76 |
| `general` | 일반 | `maternal-nursing.yaml:95`, `subworkflows/general.yaml:7`, `subworkflows/free-chat.yaml:7` |

- **정책**: **closed enum**. YAML 의 AI 응답 스키마가 이 집합을 검증합니다. 태그 집합이 YAML union 과 어긋나면 Schift 응답이 guardrail 에 걸릴 수 있으므로 **동기화 유지가 필수**입니다.
- **주의**: 상위 문서 §2.4.2 예시는 `baby_info_offer`, `letter_reflection`, `attachment_question`, `general` 4개만 예시로 들었으나, 실제 코드에서는 위 14개가 모두 사용됩니다. 변주 대상 시나리오는 운영 초기에는 stage=2 회귀 금지 목록(`maternal-nursing.yaml:76` — `baby_info_offer`, `emotion_checkin`, `mood_intake` 제외) 이후 대상만 우선적으로 채워 넣는 것을 권장합니다.

### 1.6 `lang` — 언어

- **value 집합**: `ko` (단일)
- **display_label**: `한국어`
- **정책**: **closed enum**. 현재 전수 한국어 콘텐츠. 다국어 확장은 마이그레이션으로만.
- **근거**: 코드베이스 전수 grep 결과 콘텐츠·워크플로우 어느 곳에서도 `en`, `ja` 등 다른 locale 값은 사용되지 않습니다. CLAUDE.md 문구 톤 규칙("영문 eyebrow/라벨 금지 — 모두 한국어") 과도 일치합니다.
- **향후 확장**: `en` 추가 시 Schift 컬렉션 필터에서 `tags contains "lang:ko"` 를 기본으로 붙이고, 운영자 UI 에서 언어별 분할 뷰 추가.

---

## 2. open / closed 정책 요약

| namespace | 정책 | 확장 난이도 | 이유 |
|---|---|---|---|
| `week` | closed (1..40) | 마이그레이션 필요 | DB CHECK 제약과 연동. 41+ 는 임신 기간 정의 변화가 있어야 함. |
| `surface` | closed | 문서 + 시드 SQL 개정 | 운영자 IA 안정성. 사용처별 UI·어댑터 변경을 동반. |
| `topic` | closed whitelist | 문서 + 시드 SQL 개정 | 운영자 멘탈 모델 고정(§4.7). paraphrase 파이프라인 검증과 연결. |
| `mood` | closed | 코드 수정 필요 | YAML 의 `characterTone` union 과 1:1 대응. 추가 시 프롬프트 재튜닝 필요. |
| `scenario` | closed | 코드 수정 필요 | YAML 의 `scenario` union 과 1:1 대응. 응답 검증에 영향. |
| `lang` | closed | 마이그레이션 필요 | 현재 단일 언어. 다국어는 별도 프로젝트. |

**전 네임스페이스가 closed 인 배경**: 상위 문서 §4.7 에서 "초기 합의로 운영자 멘탈 모델을 고정하는 것이 중요" 하며, open-ended 태그는 운영 중 값이 난립하여 필터가 쓸모 없어지는 패턴이 잦습니다. 확장 수요는 §4 의 절차로 흡수합니다.

---

## 3. display_label 규칙

CLAUDE.md 문구 톤 규칙 준수:

- 어드민 대상이므로 **"-습니다" 체 허용**. 단, 태그 라벨은 명사형(`"18주차"`, `"불안"`)이 기본. 문장형 라벨은 사용하지 않습니다.
- **영문 eyebrow/라벨 금지**. 관리자 UI 에 노출되는 라벨은 모두 한국어 명사형.
- 개발자 용어(scenario, surface 등) 금지. 운영자에게 보이는 것은 display_label 이지 value 가 아닙니다.
- `week` 네임스페이스는 `"N주차"` 형식 고정(숫자 + "주차"). 공백·0-padding 없음.
- `mood` 네임스페이스는 감정 명사 한 단어(`"차분"`, `"기쁨"`, `"불안"`, `"피곤"`, `"슬픔"`). 형용사형(`"차분한"`) 사용하지 않습니다.
- `scenario` 라벨은 사용자가 아닌 운영자에게 보이므로 2~6자의 명사구(예: `"아기 정보 제안"`).
- `topic` 라벨은 백과 섹션과 동일한 단어(`"아기 발달"`, `"엄마 몸 변화"` 등) — paraphrase 파이프라인의 한글 타이틀과 1:1 대응을 유지합니다.

---

## 4. 확장 절차

closed 네임스페이스에 새 value 를 추가할 때 거쳐야 하는 절차입니다.

1. **제안 PR**: 본 문서(`2026-04-24-tag-namespaces-proposal.md`) 개정 + 추가 value 의 근거 제시(사용처·사용 이유).
2. **시드 SQL**: `legacyBackend/migrations/` 에 `YYYYMMDD_add_tag_<namespace>_<value>.sql` 마이그레이션으로 `content.tags` INSERT.
3. **코드 반영** (네임스페이스별):
   - `mood` / `scenario`: `packages/mobile-api/src/workflows/*.yaml` 의 union 타입에 추가 + 프롬프트 재튜닝.
   - `surface`: Admin UI 프리셋 필터 + 어댑터 매핑 추가.
   - `topic`: `scripts/generate-weekly-encyclopedia-paraphrases.mjs:ALLOWED_SECTION_CATEGORIES` 에 추가.
   - `week`: DB CHECK 제약 변경 마이그레이션 필수.
4. **시드 데이터 이관**: 기존 legacy `category` 값이 새 value 로 매핑될 필요가 있다면 데이터 백필 스크립트 동반.
5. **승인**: 상위 문서 §4.7 원칙에 따라 유저(제품 오너) 승인 후 머지.

---

## 5. 시드 SQL

Step 2.5 초기 마이그레이션에서 실행합니다. `content.tags` 테이블은 상위 문서 §2.4.1 스키마를 전제로 합니다. `content.tags_namespace_value_key`(unique (namespace, value)) 제약에 맞춰 `ON CONFLICT DO NOTHING` 으로 멱등성을 확보합니다.

```sql
-- legacyBackend/migrations/YYYYMMDD_seed_tag_namespaces.sql
-- Tag namespaces and initial values.
-- Source: docs/active/2026-04-24-tag-namespaces-proposal.md §1

begin;

-- 1.1 week (1..40)
insert into content.tags (namespace, value, display_label, description)
select 'week', n::text, n::text || '주차', '임신 주차 ' || n::text
from generate_series(1, 40) as n
on conflict (namespace, value) do nothing;

-- 1.2 surface
insert into content.tags (namespace, value, display_label, description) values
  ('surface', 'rag',            '참조 문서',           'RAG 임베딩 대상 문서'),
  ('surface', 'note',           '지식 안내문',         '정적 안내문 (임베딩 없음)'),
  ('surface', 'week',           '주차별 콘텐츠',       '주차별 아기/엄마 본문'),
  ('surface', 'week_checklist', '주차별 체크리스트',   '주차별 체크리스트 항목'),
  ('surface', 'week_question',  '주차별 질문',         '주차별 돌아보기 질문'),
  ('surface', 'home_copy',      '홈/진입 문구',        '홈 화면·진입 카피'),
  ('surface', 'mood_variation', '기분별 응답 변주',    '감정 × 시나리오별 톤 변주'),
  ('surface', 'lexicon',        '자유 검색 사전',      '동의어·오타·유사 표현 매핑')
on conflict (namespace, value) do nothing;

-- 1.3 topic
insert into content.tags (namespace, value, display_label, description) values
  ('topic', 'baby_development',    '아기 발달',      '태아 성장·발달 주제'),
  ('topic', 'mother_body',         '엄마 몸 변화',   '산모 신체 변화'),
  ('topic', 'life_guide',          '생활 가이드',    '식생활·수면·운동 등'),
  ('topic', 'caution',             '주의 사항',      '경고·진료 기준'),
  ('topic', 'faq',                 '자주 묻는 질문', '빈도 높은 질의'),
  ('topic', 'overview',            '주차 개요',      '주차 요약'),
  ('topic', 'reflection_question', '돌아보기 질문',  '일 단위 성찰 질문'),
  ('topic', 'emotional_note',      '감정 메모',      '짧은 감정 코멘트')
on conflict (namespace, value) do nothing;

-- 1.4 mood
insert into content.tags (namespace, value, display_label, description) values
  ('mood', 'calm',    '차분', '안정된 감정'),
  ('mood', 'joyful',  '기쁨', '긍정적 감정'),
  ('mood', 'anxious', '불안', '걱정·긴장 감정'),
  ('mood', 'tired',   '피곤', '신체 피로·졸림'),
  ('mood', 'sad',     '슬픔', '우울·외로움')
on conflict (namespace, value) do nothing;

-- 1.5 scenario
insert into content.tags (namespace, value, display_label, description) values
  ('scenario', 'mood_intake',         '기분 선택',        'stage=0 감정 입력'),
  ('scenario', 'week_info_opt_in',    '주차 정보 제안',   '주차 정보 열람 opt-in'),
  ('scenario', 'baby_info_offer',     '아기 정보 제안',   '태아 발달 정보 제안'),
  ('scenario', 'baby_info',           '아기 정보',        '태아 발달 본문'),
  ('scenario', 'mother_info',         '엄마 정보',        '산모 정보 본문'),
  ('scenario', 'week_info',           '주차 정보',        '주차별 정보 본문'),
  ('scenario', 'symptom_counsel',     '증상 상담',        '증상 설명 + 진료 기준'),
  ('scenario', 'emotion_checkin',     '감정 체크인',      '공감 + 주차 정보 안내'),
  ('scenario', 'emotion_reason',      '감정 이유',        '감정 심화 대화'),
  ('scenario', 'attachment_question', '모아애착 질문',    '오늘의 질문 제시'),
  ('scenario', 'letter_reflection',   '편지 회신',        '답변에 대한 회신'),
  ('scenario', 'daily_followup',      '오늘 후속 대화',   '오늘 활동 후속'),
  ('scenario', 'empathy_chat',        '공감 대화',        '자유 공감 대화'),
  ('scenario', 'general',             '일반',             '기타 일반 응답')
on conflict (namespace, value) do nothing;

-- 1.6 lang
insert into content.tags (namespace, value, display_label, description) values
  ('lang', 'ko', '한국어', '기본 언어')
on conflict (namespace, value) do nothing;

commit;
```

- 실행 후 `select namespace, count(*) from content.tags group by namespace` 결과는 week=40, surface=8, topic=8, mood=5, scenario=14, lang=1 = **총 76 row**.
- 본 시드는 **멱등**합니다. 재실행해도 동일 결과.

---

## 6. 열린 이슈

운영 중 재검토가 필요한 항목입니다. 본 문서 승인 시점에는 정답이 없습니다.

1. **`surface=week` 과 세부 `week_*` 분리의 이점**. 현재는 본문/체크리스트/질문을 별도 `surface` 로 나눴지만, 한 주차 편집이 `week` 단일 row 로 가능하다면 `week_checklist`/`week_question` 을 `metadata` 키로 흡수할 수 있습니다. Step 2.5 마이그레이션 단계에서 실제 편집 UX 를 보고 재결정.
2. **legacy `category` 자유 입력값의 미매핑 row**. `content_pregnancy_documents.category` 는 `varchar(100) NOT NULL` 자유 입력이라 whitelist 외 값이 있을 수 있습니다. Step 2.5 dry-run 리포트에서 미매핑 row 를 운영자 확인 후 처리.
3. **`scenario=mood_intake` 를 태그로 둘지**. `mood_intake` 는 정적 상수에서만 사용되며 응답 스키마 union(`maternal-nursing.yaml:95`)의 `scenario?` 에는 포함되지 않습니다(`maternal-nursing.yaml:76` stage=2 금지 목록). 변주 저장 수요가 없다면 scenario 태그에서 제외해도 무방합니다.
4. **`mood` 와 `topic` 교차 필터 사용 빈도**. 기분별 변주(§4.1) 운영 중 mood × scenario 외에 `mood × topic` 조합도 필요할지 관찰 필요. 필요하면 태그 설계가 아닌 Schift 메타필터 레벨 문제로 해소.
5. **`lang` 네임스페이스의 현 필요성**. 지금은 단일 값(`ko`)뿐이라 네임스페이스 자체가 잉여로 보일 수 있습니다. 다만 향후 `lang=en` 추가를 위해 **태그 구조만 미리 자리잡아 두는 쪽**을 권장합니다. 초기 시드는 모든 row 에 자동으로 `lang=ko` 를 붙이는 트리거나 덤프 스크립트에서 처리.
6. **`mood_variation` / `lexicon` 의 value 충돌**. 이 두 value 는 `surface` 네임스페이스와 `mood` / (없음) 네임스페이스 양쪽에 동일 개념이 등장할 수 있습니다. 운영자가 `mood=anxious` 와 `surface=mood_variation` 을 한 row 에 동시에 붙이도록 문서화·툴팁으로 가이드 필요.
7. **`topic` whitelist 이탈 요청 처리**. 운영자가 "임신 당뇨", "태동" 등 세부 주제를 원한다면 `topic` 에 추가할지, `metadata.subtopic` 자유 필드로 흡수할지 결정 필요. 현재는 §4 확장 절차를 따르는 closed whitelist 를 기본값으로 제안.

---

## 부록 A — 근거 파일 인덱스

| 주제 | 파일 | 라인 |
|---|---|---|
| 상위 기획 (단일 버킷 + 태그 모델) | `docs/active/2026-04-23-admin-hierarchy-replan.md` | §2.4, §4.7 |
| week 범위 제약 | `legacyBackend/migrations/20260331172420_move_content_to_public_and_drop_allowlist.sql` | 27 |
| week 범위 제약 (drizzle) | `legacyBackend/migrations/drizzle/0000_wet_mattie_franklin.sql` | 162 |
| paraphrase week 제약 | `legacyBackend/migrations/20260417143000_add_content_paraphrase_tables.sql` | 72-73 |
| pregnancy_documents.category 스키마 | `legacyBackend/migrations/drizzle/0000_wet_mattie_franklin.sql` | 99, 223 |
| prisma category 모델 | `apps/web/prisma/schema.prisma` | 239, 259 |
| topic whitelist | `scripts/generate-weekly-encyclopedia-paraphrases.mjs` | 12-18 |
| topic 확장값 (overview 등) | `scripts/generate-weekly-encyclopedia-paraphrases.mjs` | 319, 338, 381 |
| topic 확장값 (sync) | `scripts/content-paraphrase-sync.mjs` | 80, 113, 130 |
| mood/characterTone union | `packages/mobile-api/src/workflows/maternal-nursing.yaml` | 95 |
| mood union (서브워크플로우) | `packages/mobile-api/src/workflows/subworkflows/letter-reflection.yaml` | 20 |
| mood intake 20개 프롬프트 | `packages/mobile-api/src/workflows/maternal-nursing.yaml` | 509 |
| scenario union | `packages/mobile-api/src/workflows/maternal-nursing.yaml` | 95 |
| scenario 분기 기준 | `packages/mobile-api/src/workflows/maternal-nursing.yaml` | 318-322 |
| scenario stage=2 금지 | `packages/mobile-api/src/workflows/maternal-nursing.yaml` | 76 |
| scenario static 상수 | `packages/mobile-api/src/workflows/maternal-nursing.yaml` | 509, 512 |
| 서브워크플로우 scenario 선언 | `packages/mobile-api/src/workflows/subworkflows/*.yaml` | 각 파일 상단 |
| workflow 로더 테스트 | `packages/mobile-api/src/workflows/load-workflow-yaml.test.ts` | 87, 112, 132 |
| home_copy 저장 위치 | `apps/web/src/lib/admin/home-copy-config.ts` | 21-33 |
| RAG/note 어댑터 매핑 | `apps/web/src/lib/admin/adapters/cloud-sql-admin-content-port.ts` | 300-327 |

---

## 부록 B — Task 상태

TaskList #5 "태그 네임스페이스 초안" — **완료** (본 문서로 산출).
