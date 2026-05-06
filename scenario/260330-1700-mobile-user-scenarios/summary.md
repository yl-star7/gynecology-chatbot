# 유저 앱 시나리오 탐색 요약

- 기준: SOW_PRD_검���패키지_v1.1.docx + docs/reference/PRD.md + sow-prd-coverage.html
- ���짜: 2026-03-30
- 범위: PRD 5.1.x 유�� 앱 기능 전체
- ���색: 25 iterations, 12/12 dimensions

## Coverage Matrix

| Dimension | Count | Severity (max) |
|---|---|---|
| happy_path | 3 | - |
| error_path | 3 | HIGH |
| edge_case | 3 | HIGH |
| data_variation | 1 | LOW |
| permission | 3 | CRITICAL |
| temporal | 2 | MEDIUM |
| state_transition | 2 | HIGH |
| integration | 2 | HIGH |
| concurrent | 1 | MEDIUM |
| abuse | 2 | CRITICAL |
| scale | 1 | MEDIUM |
| recovery | 2 | HIGH |

## 수정 결과 (2026-03-30)

### 이미 OK (수정 불필요 4건)

| # | 시나리오 | 이유 |
|---|---------|------|
| #12 | IDOR 타인 세션 접근 | `requireMobileSession` + `user_id=eq.${userId}` 쿼리 필터 이미 적용 |
| #4 | OTP brute-force | 60초당 5회(인증 요청)/10회(로그인) rate limit 이미 적용 |
| #19 | Push fallback SMS | push token 없으면 Twilio SMS fallback 이미 작동 |
| #25 | 비밀번호 복구 | OTP 인증 아키텍처라 비밀번호 자체가 없음, 해당사항 없음 |

### 코드 수정 완료 (14건)

| # | 시나리오 | 수정 파일 | 수정 내용 |
|---|---------|----------|----------|
| **#21** | Jailbreak 방어 | `chat/route.ts` | system prompt 2곳에 역할 고정 + 변형 거절 지시 추가 |
| **#5** | AI 타임아웃 | `mobileApi.ts` | sendChatMessage에 30초 AbortController timeout 추가 |
| **#6** | 네트워크 끊김 | `PatientConversationScreen.tsx` | catch 블록 + 에러 메시지 UI 추가 |
| **#7** | 주차 0/42+ 경계 | `buildPatientHomeViewModel.ts`, `today/route.ts` | clamp(1~42), postDue 처리, 동적 재계산 |
| **#8** | 온보딩 빈 입력 | `onboarding/route.ts` | 서버측 주차 1~42 범위 + 날짜 형식 검증 추가 |
| **#9** | 초장문 메시지 | `chat/route.ts`, `PatientConversationScreen.tsx` | 서버 3000자 제한 + 앱 maxLength={3000} |
| **#11** | 세션 401 처리 | `mobileApi.ts` | SessionExpiredError 클래스 + parseJson 401 분기 |
| **#13** | 미인증 딥링크 | `(tabs)/_layout.tsx` | 탭 레이아웃에 세션/온보딩 체크 가드 추가 |
| **#14** | 자정 타임존 | `today/route.ts` | UTC→KST 날짜 기준 통일 (getKstDate 헬퍼) |
| **#15** | 주차 동적 갱신 | `today/route.ts` | due_date 기반 현재 주차 매번 재계산 |
| **#17** | 백그라운드 복귀 | `PatientConversationScreen.tsx` | AppState 리스너로 포그라운드 복귀 시 세션 재fetch |
| **#22** | Rate limit UX | `mobileApi.ts`, `PatientConversationScreen.tsx` | RateLimitError 클래스 + 429 시 한국어 안내 UI |

### 미수정 (설계 변경 필요 3건)

| # | 시나리오 | 이유 |
|---|---------|------|
| #16 | 온보딩 중간 이탈 | step 상태 영속화 필요 — AsyncStorage 또는 서버측 저장 설계 필요 |
| #20 | 다중 기기 동시 쓰기 | optimistic locking 설계 필요 — 현재 다중 로그인은 허용됨 |
| #24 | 저장 실패 일관성 | legacyBackend REST는 트랜잭션 미지원 — DB function 또는 RPC 설계 필요 |

### 검증

- `pnpm type-check` — 5/5 pass
- `pnpm test` — 59 suites, 145 tests pass (3 skipped)
