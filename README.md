# gynecology-chatbot

Docker 로컬 개발과 Cloud SQL/Postgres 운영을 기준으로 한 모노레포입니다.

현재 제품 책임은 아래처럼 고정합니다.

- `apps/web`: 관리자 전용 대시보드와 서버 API
- `apps/mobile`: Expo 사용자 앱 작업 공간
- `packages/app-core`: 공용 도메인 계약, 포트, DI용 테스트 어댑터
- `packages/db`: Prisma/DB 클라이언트와 스키마 기준
- `packages/mobile-api`: 모바일/API 공용 서버 로직
- `db`: SQL migration과 데이터베이스 보조 자료
- `docs`: active/reference/archive/tools 문서 묶음

## Hierarchy

```text
gynecology-chatbot/
├── apps/
│   ├── web/                    # admin dashboard + server routes
│   │   └── src/
│   │       ├── app/            # Next app routes
│   │       ├── components/     # admin UI
│   │       └── lib/            # admin composition + server helpers
│   └── mobile/                 # Expo user app workspace
│       ├── app/                # expo-router entry
│       └── hooks/              # native push registration hooks
├── packages/
│   ├── app-core/               # domain contracts, ports, mock adapters
│   ├── db/                     # Prisma schema/client helpers
│   ├── mobile-api/             # shared server-side mobile API logic
│   └── types/                  # legacy shared types, phased out
├── db/
│   ├── migrations/             # active SQL migration history
│   └── migrations_legacy/      # historical SQL reference
├── docs/
│   ├── active/                # 현재 바로 쓰는 문서
│   ├── reference/             # 제품 기준 문서
│   ├── archive/               # 과거 계약/견적/원본
│   └── tools/                 # 문서 생성 스크립트
├── pnpm-workspace.yaml
└── turbo.json
```

## Current Direction

- `apps/web`는 관리자 화면과 모바일 사용자 웹/API를 함께 제공한다.
- `apps/mobile`은 WebView 기반 Expo 래퍼 앱이다.
- 서버 데이터 소스는 `SERVER_DATA_PROVIDER=docker`를 명시한다.
- 관리자 데이터 포트는 `ADMIN_DATA_PROVIDER=backend|mock`으로 고른다.
- AI 키는 코드에 하드코딩하지 않고 환경변수로만 주입한다.
- 기존 코드보다 PRD와 계층 문서가 우선한다.

## Environment

개발 모드는 두 개로 고정합니다.

```bash
pnpm dev:d   # 로컬 Docker Postgres + 로컬 시드 데이터
```

핵심 환경 변수는 아래입니다.

```env
SERVER_DATA_PROVIDER=docker
ADMIN_DATA_PROVIDER=backend
DATABASE_URL=
GEMINI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3005
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
ADMIN_API_BASE_URL=http://localhost:8080
EXPO_PUBLIC_WEB_URL=http://localhost:3005
NEXT_PUBLIC_DEV_USER_ID=local-user-demo
EXPO_PUBLIC_DEV_USER_ID=local-user-demo
```

## Commands

```bash
pnpm install
pnpm dev:d
pnpm --filter @gynecology-chatbot/mobile start
pnpm --filter @gynecology-chatbot/app-core type-check
pnpm --filter @gynecology-chatbot/web type-check
pnpm --filter @gynecology-chatbot/mobile exec tsc --noEmit
```

## Database Migrations

현재 `db/migrations/`는 운영 Postgres에 적용할 active SQL migration history입니다.

과거 date-only migration들은 `db/migrations_legacy/pre-remote-baseline-20260417/`에 보관합니다. 이 파일들은 운영 DB에 다시 push하지 않습니다.

새 migration은 반드시 `YYYYMMDDHHMMSS_description.sql` 형식으로 만듭니다.

핵심 문서:
- [PRD.md](/Users/jskang/si/gynecology-chatbot/docs/reference/PRD.md)
- [PRD_CHECKLIST.md](/Users/jskang/si/gynecology-chatbot/docs/reference/PRD_CHECKLIST.md)
- [DATABASE_SCHEMA.md](/Users/jskang/si/gynecology-chatbot/docs/reference/DATABASE_SCHEMA.md)
