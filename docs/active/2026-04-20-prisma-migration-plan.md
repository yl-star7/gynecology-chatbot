# legacyBackend REST → Prisma (Cloud SQL) 정식 이관 계획

작성: 2026-04-20
대상 브랜치: `main`
기준 DB: `agaya-2026:asia-northeast3:agaya-db` (Postgres 16, 31 tables + 4 views)

## 0. 목표

- 모든 `legacyBackendSelect / legacyBackendInsert / legacyBackendUpdate / legacyBackendDelete / legacyBackendRpc` 호출을 **Prisma Client** 기반 쿼리로 교체
- legacyBackend JS SDK 의존(`@legacyBackend/legacyBackend-js`, `@legacyBackend/ssr`)을 DB 쿼리 레이어에서 완전히 제거
- 단, **Storage** (이미지 업로드/다운로드)는 당장은 legacyBackend Storage 유지 → 별도 트랙 (추후 GCS 이관)

## 1. 현황 스캔

### 1.1 callsite 범위

총 **456 callsites** / **47 파일** (tests 제외).

#### 상위 10 파일 (핫팟)

| 파일 | count | 비고 |
|---|---|---|
| `apps/web/src/lib/admin/adapters/legacyBackend-admin-dashboard-port.ts` | 31 | admin 대시보드 adapter |
| `packages/mobile-api/src/chat/chat-repository.ts` | 30 | 채팅 저장/조회 핵심 |
| `apps/web/app/api/mobile/records/route.ts` | 19 | records API |
| `apps/api/src/routes/mobile/records.ts` | 19 | records API (Cloud Run 포트) |
| `packages/mobile-api/src/auth.ts` | 18 | 인증 로직 |
| `apps/web/src/lib/admin/adapters/legacyBackend-admin-content-port.ts` | 17 | content adapter |
| `apps/web/src/lib/db/repositories/week-content-repository.ts` | 16 | 주차 콘텐츠 repo |
| `apps/web/app/api/mobile/today/route.ts` / `apps/api/src/routes/mobile/today.ts` | 15 each | today API 양쪽 |
| `apps/web/app/api/admin/analytics/route.ts` | 12 | analytics |
| `apps/web/app/api/mobile/chat/route.ts` / `apps/api/src/routes/mobile/chat.ts` | 8 each | chat API 양쪽 |

### 1.2 파일 분류

- **공용 도메인 로직** (`packages/mobile-api/src/*`): 11 파일
- **apps/api** (Cloud Run, Hono): 11 파일
- **apps/web** (Cloud Run, Next.js): 25 파일 (mobile API 미러 + admin API + repositories)

### 1.3 특수 처리 필요 포인트

- **벡터 검색** (`content.pregnancy_documents.embedding`, `vector(768)`):
  - 현재 `legacyBackendRpc("match_pregnancy_documents", ...)` 사용 중
  - Prisma는 `vector` 네이티브 지원 없음 → `$queryRaw` + `pgvector` 문법 직접 사용
  - 파일: `packages/mobile-api/src/rag.ts`
- **뷰 조회** (`v_chat_session_activity_dates` 등 4개):
  - Prisma `views` preview 기능으로 모델 생성됨 → readonly 모델로 쿼리 가능
- **PostgREST 특수 필터 표현**:
  - `.not(col, "is", "null")` / `.is(col, null)` / `.in(col, [...])` / `.order(col, { ascending: false, nullsFirst: false })` / `.limit(n)` / `.gte/lte/gt/lt(col, v)`
  - → Prisma `where`, `orderBy`, `take`, `skip`로 1:1 매핑 (표 하단)
- **`or` / `and` 필터 문자열**:
  - `legacyBackendSelect("tbl?or=(a.eq.1,b.eq.2)&...")`
  - → `prisma.tbl.findMany({ where: { OR: [{ a: 1 }, { b: 2 }] } })`
- **RPC 호출** (`legacyBackendRpc`): 벡터 검색 외에 있다면 모두 `$queryRaw`/`$executeRaw`
- **`on_conflict` + `ignoreDuplicates`** (upsert 유사):
  - `prisma.tbl.upsert({ where: ..., create: ..., update: ... })` 또는 `createMany({ data, skipDuplicates: true })`
- **스키마 분리**: `content.*` 테이블은 Prisma 모델 이름에 `@@schema("content")` 포함 → 자동 라우팅. 단 `public.content_*`는 legacy mirror로 공존. 중장기 정리 필요

## 2. 매핑 규칙 (치트시트)

### SELECT

```ts
// BEFORE
await legacyBackendSelect<UserRow[]>(
  `users?select=id,role,phone_number_blind_index&phone_number_blind_index=eq.${idx}&limit=1`,
);

// AFTER
await prisma.users.findFirst({
  where: { phone_number_blind_index: idx },
  select: { id: true, role: true, phone_number_blind_index: true },
});
```

### INSERT

```ts
// BEFORE
await legacyBackendInsert("chat_sessions", { user_id, title, status: "active" });

// AFTER
await prisma.chat_sessions.create({
  data: { user_id, title, status: "active" },
});
```

### UPDATE

```ts
// BEFORE
await legacyBackendUpdate(`users?id=eq.${id}`, { last_login_at: now });

// AFTER
await prisma.users.update({
  where: { id },
  data: { last_login_at: now },
});
```

### UPSERT (on_conflict)

```ts
// BEFORE
await legacyBackendInsert(
  "calendar_logs",
  { user_id, date, entry_type, payload },
  { onConflict: "user_id,date,entry_type", ignoreDuplicates: false },
);

// AFTER (단건)
await prisma.calendar_logs.upsert({
  where: { user_id_date_entry_type: { user_id, date, entry_type } },
  create: { user_id, date, entry_type, payload },
  update: { payload },
});

// AFTER (배치, 중복 무시)
await prisma.calendar_logs.createMany({
  data: rows,
  skipDuplicates: true,
});
```

### DELETE

```ts
// BEFORE
await legacyBackendDelete(`auth_sessions?id=eq.${id}`);

// AFTER
await prisma.auth_sessions.delete({ where: { id } });
```

### 필터 변환 표

| PostgREST | Prisma `where` |
|---|---|
| `col=eq.v` | `{ col: v }` |
| `col=neq.v` | `{ col: { not: v } }` |
| `col=gt.v` | `{ col: { gt: v } }` |
| `col=gte.v` | `{ col: { gte: v } }` |
| `col=lt.v` | `{ col: { lt: v } }` |
| `col=lte.v` | `{ col: { lte: v } }` |
| `col=is.null` | `{ col: null }` |
| `col=not.is.null` | `{ col: { not: null } }` |
| `col=in.(a,b,c)` | `{ col: { in: [a,b,c] } }` |
| `col=like.%v%` | `{ col: { contains: "v" } }` |
| `col=ilike.%v%` | `{ col: { contains: "v", mode: "insensitive" } }` |
| `order=col.desc.nullslast` | `{ orderBy: { col: { sort: "desc", nulls: "last" } } }` |
| `limit=N` | `{ take: N }` |
| `offset=N` | `{ skip: N }` |
| `select=a,b,c` | `{ select: { a: true, b: true, c: true } }` |

### 벡터 검색 (rag.ts)

```ts
// BEFORE (legacyBackendRpc)
await legacyBackendRpc("match_pregnancy_documents", {
  query_embedding: embedding,
  match_count: 5,
  current_week: week,
});

// AFTER ($queryRaw + pgvector)
const rows = await prisma.$queryRaw<
  Array<{ id: string; title: string; content: string; similarity: number }>
>`
  SELECT id, title, content,
         1 - (embedding <=> ${embedding}::vector) AS similarity
  FROM content.pregnancy_documents
  WHERE (pregnancy_week IS NULL OR ${week}::int BETWEEN pregnancy_week - 1 AND pregnancy_week + 1)
  ORDER BY embedding <=> ${embedding}::vector
  LIMIT ${matchCount}
`;
```

## 3. 단계 (5 phase × 11 작업 단위)

### Phase A — 인프라 (0.5일)

1. **A1** Prisma Client 싱글톤 (`packages/db/src/prisma.ts`) 완료 ✅
2. **A2** DATABASE_URL env 스키마 통합 (개발 / prod / Cloud Run unix socket 3종)
3. **A3** `packages/mobile-api`에서 `@gynecology-chatbot/db` workspace dep 추가
4. **A4** `apps/api` 및 `apps/web` 에서 `@gynecology-chatbot/db` workspace dep 추가
5. **A5** `apps/api` Dockerfile에 `prisma generate` 빌드 스텝 삽입
6. **A6** Cloud Run 배포 설정에 `--add-cloudsql-instances=agaya-2026:asia-northeast3:agaya-db` 추가

### Phase B — 어댑터 deprecate 준비 (0.5일)

7. **B1** `packages/mobile-api/src/legacyBackend/admin-client.ts`를 **deprecation shim**으로 전환
   - 내부에서 PostgREST DSL → SQL parse 후 Prisma `$queryRawUnsafe` / `$executeRawUnsafe` 실행
   - 새 매개변수 없이 기존 시그니처 유지
   - `console.warn("[deprecated] use Prisma directly")` 호출 시마다 출력 (개발 모드만)
   - 456 callsite 무수정으로 **동작은 유지**
8. **B2** `local-postgres.ts`의 PostgREST parser를 shim 내부로 이관 (`DATABASE_URL` + Prisma pool 공유)

### Phase C — 핫팟 파일 수동 이관 (2일)

우선순위 상위 파일 10개를 Prisma direct로 전환. 각 파일 리뷰/테스트 포함:

9. **C1** `packages/mobile-api/src/chat/chat-repository.ts` (30 callsites, 채팅 핵심) — 1명일
10. **C2** `packages/mobile-api/src/auth.ts` (18) — 0.5일
11. **C3** `apps/api/src/routes/mobile/records.ts` + `today.ts` + `chat.ts` + `home.ts` + `sessions.ts` + `profile.ts` + `push.ts` + `weeks.ts` + `branding.ts` + `content-items.ts` + `link.ts` (11개) — 1일
12. **C4** `apps/web/src/lib/admin/adapters/legacyBackend-admin-dashboard-port.ts` (31) — 0.5일
13. **C5** `apps/web/src/lib/admin/adapters/legacyBackend-admin-content-port.ts` (17) — 0.3일
14. **C6** `apps/web/src/lib/db/repositories/week-content-repository.ts` (16) — 0.3일

### Phase D — 나머지 일괄 이관 (1일)

15. **D1** 나머지 30여 파일 (각 1~12 callsites). 병렬 subagent로 파일 단위 처리
    - 공용 매핑 치트시트 (이 문서 §2) 제공
    - 각 파일 커밋 단위로 타입체크 통과 확인

### Phase E — 정리 + 컷오버 (1일)

16. **E1** B1의 admin-client shim 삭제. 모든 파일이 Prisma direct 사용 확인 (grep `legacyBackendSelect` = 0 hit)
17. **E2** `@legacyBackend/legacyBackend-js`, `@legacyBackend/ssr` 의존성 — DB 관련 부분 제거. Storage 관련만 유지 (`apps/web` 어드민 이미지 업로드)
18. **E3** Cloud Run 재배포 + 스모크 테스트 (`/api/mobile/chat`, `/api/mobile/today`, `/api/mobile/auth/login` 등)
19. **E4** `apps/web` Cloud Run 쪽 mobile route도 동시 동작 확인 (`SERVER_DATA_PROVIDER` 은 unused로 전환)
20. **E5** EAS `EXPO_PUBLIC_API_BASE_URL`을 Cloud Run URL로 교체 → 새 TestFlight 빌드 배포
21. **E6** 관찰 3일 → legacyBackend 프로젝트 pause (DB 쪽만. Storage는 유지)

### Phase F — Storage 이관 (별도 스프린트, 미반영)

22. 추후: legacyBackend Storage → GCS 이관. branding-assets, pregnancy-content 버킷 각각 migrate. 클라이언트 URL 변경 TestFlight 재빌드 필요.

## 4. 작업 병렬화 전략

### 전제

- Phase A (인프라), Phase B (shim) 는 **직렬** 수행 필수
- Phase C (핫팟) 는 파일 경계로 나누어 **최대 4 subagent 병렬**
- Phase D (꼬리) 는 파일 경계로 **최대 8 subagent 병렬**
- 각 subagent 입력: (파일 경로, 매핑 치트시트 복사본, Prisma 스키마 경로)
- 각 subagent 출력: 수정된 파일 + `pnpm --filter <pkg> type-check` 통과 증명

### 충돌 방지

- 파일 단위 소유권. subagent 간 파일 공유 없음
- 공용 lib(`admin-client.ts`, `local-postgres.ts`) 은 Phase E의 단일 에이전트가 담당

### 마일스톤

- M1 (Day 1): Phase A + B 완료 → shim 동작 확인
- M2 (Day 3): Phase C 핫팟 4개 이관 완료
- M3 (Day 4): 모든 callsite = Prisma direct
- M4 (Day 5): Cloud Run + TestFlight 컷오버

총 예상 기간: **5 영업일** (1명) / **2~3 영업일** (subagent 병렬)

## 5. 테스트 전략

1. **타입체크**: 각 파일 수정 직후 `pnpm --filter <pkg> type-check` 통과
2. **단위 테스트**: 기존 Jest 테스트들이 DB 없이 돌아가도록 mock 구조 유지. Prisma Client는 `jest.mock('@gynecology-chatbot/db/prisma')` 으로 스텁
3. **통합 테스트**: Cloud SQL 테스트 전용 프로젝트/DB 생성 (선택) 또는 로컬 Postgres 17 + schema.prisma `db push`
4. **스모크**: Cloud Run 배포 후 `curl` 로 주요 엔드포인트 응답 코드 + 핵심 필드 검증
5. **사용자 트래픽 매칭**: TestFlight 3명 사용자가 동일 기능(채팅, today, calendar) 확인 후 confirm

## 6. 위험 요소

| 위험 | 완화책 |
|---|---|
| Prisma가 `vector` 네이티브 미지원 | `Unsupported("vector")` 타입 + `$queryRaw` 전용 헬퍼 `vectorSearch.ts` 분리 |
| `public.content_*` 미러 테이블과 `content.*` 원본 동시 존재 | Phase C에서 점진적으로 `content.*` 모델만 사용하도록 수정. 미러는 drop 전 sync trigger 유지 가능 |
| `on_conflict`의 다중 컬럼 unique 인덱스 이름 매핑 누락 | Prisma `@@unique` 이름 확인 후 `where` 복합키 정확히 지정 |
| Cloud SQL 커넥션 풀 고갈 (Prisma default = 호스트 CPU × 2 + 1) | Cloud Run min=0 특성상 cold-start마다 새 pool. `connection_limit` 파라미터 DATABASE_URL에 추가 |
| JSON 컬럼 shape 불일치 | Prisma 생성 타입 + zod 런타임 검증 혼용 |

## 7. 진행 체크리스트

- [ ] A1 Prisma client 싱글톤
- [ ] A2 DATABASE_URL env 정리
- [ ] A3 mobile-api ↔ db workspace 링크
- [ ] A4 apps/api, apps/web ↔ db workspace 링크
- [ ] A5 Dockerfile에 prisma generate
- [ ] A6 Cloud Run Cloud SQL 연결 옵션
- [ ] B1 admin-client shim 전환
- [ ] B2 local-postgres parser 이관
- [ ] C1~C6 핫팟 파일 이관
- [ ] D1 꼬리 파일 병렬 이관
- [ ] E1 shim 삭제
- [ ] E2 @legacyBackend/legacyBackend-js DB import 제거
- [ ] E3 Cloud Run 재배포 + 스모크
- [ ] E4 Cloud Run web 미러 검증
- [ ] E5 EAS 재빌드 + TestFlight
- [ ] E6 legacyBackend DB pause
- [ ] F Storage 이관 (별도)

## 8. 참고 자료

- Prisma `views` preview: https://www.prisma.io/docs/orm/prisma-schema/data-model/views
- pgvector + Prisma: https://github.com/prisma/prisma/issues/18442
- Cloud Run + Cloud SQL connector: https://cloud.google.com/sql/docs/postgres/connect-run
- 본 저장소 기존 PostgREST parser 구현: `packages/mobile-api/src/local-postgres.ts`
