# Monorepo Hierarchy

## 목적
현재 저장소를 "관리자 웹 + 사용자 모바일 앱 + 공용 도메인 패키지 + Supabase" 구조로 유지하기 위한 기준 문서다.

## 최상위 책임

### `apps/web`
- 관리자 전용 대시보드
- 서버 API route
- 관리자용 composition root

### `apps/mobile`
- Expo React Native 사용자 앱
- 홈, 임신수첩, 임신 지식, 채팅, 내부 링크 화면
- 모바일용 composition root

### `packages/app-core`
- 도메인 타입
- 포트 인터페이스
- 뷰 모델 계약
- in-memory adapter

### `supabase`
- `migrations/`: linked Supabase remote history와 맞는 active migration chain
- `migrations_legacy/`: remote baseline 이전 historical SQL 보관
- 함수
- 데이터 기준

### `docs/reference`
- PRD
- UI spec
- 구현 방향 문서
- 저장소 계층 문서

## 금지할 혼합
- 웹 관리자와 사용자 앱 UI를 같은 앱 안에 섞지 않음
- 앱을 WebView 래퍼로 되돌리지 않음
- 공용 패키지에 프레임워크 의존 UI를 넣지 않음
- `packages/types`에 신규 도메인 책임을 계속 누적하지 않음

## 권장 의존 방향

```text
apps/web ------\
                > packages/app-core
apps/mobile ---/

apps/web -----> supabase
apps/mobile --> apps/web API 또는 별도 backend endpoint
```

## 작업 순서 원칙
1. PRD와 hierarchy 문서 갱신
2. `packages/app-core` 계약 수정
3. web/mobile composition root 반영
4. UI 구현
5. Supabase adapter 연결

## 현재 기준
- 웹은 관리자 전용
- 모바일은 사용자 전용
- Supabase 기준. migration은 `YYYYMMDDHHMMSS_description.sql` 형식으로 생성하고 `db push --dry-run` clean 상태를 유지
- 모노레포 유지
- 오프라인 모드 제외
