# Current Product Checklist

> 기준일: 2026-03-19

## 1. 인증

| 항목 | 상태 | 메모 |
|---|---|---|
| 전화번호 OTP 로그인 | 완료 | 비밀번호 사용자 인증 제거 |
| 허용 번호 화이트리스트 | 완료 | 관리자 CRUD 가능 |
| 1년 서버 세션 발급 | 완료 | `auth_sessions` 사용 |
| 웹 세션 복원 | 완료 | session token 기준 복원 |
| 네이티브 앱 재시작 후 세션 유지 | 부분 | 영속 저장 수단 부재 |

## 2. 사용자 앱

| 항목 | 상태 | 메모 |
|---|---|---|
| 온보딩 저장 | 완료 | `pregnancy_profiles` 사용 |
| 홈 화면 | 완료 | 세션 인증 기준 조회 |
| 세션 기반 채팅 | 완료 | `chat_sessions`, `chat_messages` |
| 캘린더 저장 로그 | 완료 | `calendar_logs` 사용 |
| 감정 전용 테이블 | 제외 | `emotion_logs` 운영 안 함 |
| 정적 문헌 목록 탐색 | 완료 | `knowledge` / `notebook` 탭 연결 |
| 단건 문헌 상세 보기 | 완료 | 내부 링크 화면 연결 |

## 3. 관리자 웹

| 항목 | 상태 | 메모 |
|---|---|---|
| 관리자 로그인 | 완료 | 관리자 세션 쿠키 사용 |
| 허용 번호 CRUD | 완료 | 연구 참여 번호 화이트리스트 |
| 사용자 전화번호 변경 | 완료 | 감사 로그 기록 |
| 사용자 세션 초기화 | 완료 | `reset-session` 경로 사용 |
| `content_knowledge_items` CRUD | 완료 | public mirror 테이블 기준 |
| RAG 문헌 업로드 | 완료 | `content_pregnancy_documents` 기준 |
| 주차별 데이터 CRUD | 완료 | `content_pregnancy_week_data` + day/checklist/question 테이블 기준 |

## 4. 데이터/스키마

| 항목 | 상태 | 메모 |
|---|---|---|
| `users` 인증 전용화 | 완료 | 전화번호 중심 |
| `pregnancy_profiles` 프로필 통합 | 완료 | 이름/태명/테마 포함 |
| public mirror 콘텐츠 테이블 | 완료 | 운영 REST API 기준 |
| `user_persona_signals` | 완료 | 상담 성향 신호 누적 |
| `emotion_logs` 제거 방향 | 완료 | 별도 운영 테이블 없이 memory/persona signal로 대체 |

## 5. 남은 실무 리스크

1. 네이티브 세션 토큰 영속 저장 수단 필요
2. 과거 참고용 레거시 SQL 파일은 저장소에 남아 있음
