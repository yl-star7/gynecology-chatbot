# TODO

## 완료 (2026-03-20)

- [x] 홈 히어로에서 사용자 이름 중복 노출 제거
- [x] `지금 상담하기` CTA 문구 재정의 → FAB "상담하기"
- [x] 홈 첫 카드 우선순위를 `오늘 상태 / 아기 변화 / 오늘 할 일` 기준으로 재설계 → accent 히어로 카드 + 캘린더 + 숏컷 2열
- [x] 프로필 진입을 탭 텍스트 대신 보조 진입으로 축소 → 헤더 아바타 버튼
- [x] 홈 화면 전반의 UI hierarchy 재정리 → 디자인 토큰 시스템 (space, radii, typo, shadows)
- [x] 채팅 상단과 홈 상단의 정보 밀도 재조정 → 채팅 헤더 minimal, 홈은 eyebrow+title+subtitle
- [x] 날짜/주차/기록 정보의 시각적 반복 최소화 → 히어로 카드 하나로 통합
- [x] 의료 상담 제품다운 tone and manner로 카피 전면 점검 → 모바일+웹 전체 -어요 통일
- [x] 감정 체크인 플로우 (API + 모바일 UI + 캘린더 연동)
- [x] AI 톤 동적 반영 (사용자 tonePreference → 시스템 프롬프트)
- [x] 푸시 알림 풀스택 (토큰 저장/hook 연결/Expo SDK 발송/어드민 트리거/마이그레이션)
- [x] 어드민 분석 대시보드 (API 6개 메트릭 + UI)
- [x] Proactive 대화 내재화 (Edge Function → Next.js API)
- [x] 알림 스케줄 관리자 설정 (system_config + GET/PUT API)
- [x] API rate limiting (채팅 20회/분, in-memory 슬라이딩 윈도우)
- [x] 설문 템플릿 어드민 CRUD (체크리스트 + 질문 독립 관리)
- [x] 디자인 시스템 문서화 (AGENTS.md)
- [x] Expo 푸시 인증서 발급 절차 문서 (docs/PUSH_SETUP.md)

## 배포 전 체크리스트

- [x] `push_token` 컬럼 마이그레이션 적용 (2026-03-20)
- [x] `system_config` 테이블 마이그레이션 적용 (2026-03-20)
- [x] Gemini API 키 프로덕션 설정 확인
- [ ] `SCHIFT_API_KEY` 유효값 재설정 및 workflow 기반 채팅 응답 실검
- [ ] Expo push notification 인증서 설정 (docs/PUSH_SETUP.md 참조)
- [ ] pg_cron에 proactive trigger URL 교체 (내재화된 `/api/admin/proactive/trigger` 사용)

## P2 — 메인 워크플로우 관리 (현황 확인)

- 메인 응답 경로는 이미 Schift workflow(`maternal-nursing.yaml` → GCS `agaya-workflow-config/`)로 서버 관리 중. route.ts는 workflow 호출 + Schift 장애 시 mobile-local Gemini fallback만 담당. 이관 불필요.
- 추가 튜닝이 필요할 경우 `packages/mobile-api/src/workflows/maternal-nursing.yaml`의 `prompts.system` / `prompts.template` 수정 후 GCS 업로드 → `refreshWorkflowFromStorage()` 또는 5분 TTL 경과로 반영.

## P3

없음. 오프라인/i18n은 현 제품 범위에서 불필요.
