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

## 배포 전 체크리스트

- [x] `push_token` 컬럼 마이그레이션 적용 (2026-03-20 완료)
- [ ] pg_cron 설정 배포 (`supabase/pg_cron_setup.sql`의 URL/키 교체)
- [ ] Proactive Edge Function 배포 (`supabase/functions/proactive-chat/`)
- [ ] Expo push notification 인증서 설정 (iOS APNs, Android FCM)
- [ ] Gemini API 키 프로덕션 설정 확인

## P3 (다음 스프린트)

- [ ] API rate limiting (채팅 엔드포인트 분당 제한)
- [ ] 오프라인 지원 (서비스워커 / 로컬 캐시)
- [ ] 설문 템플릿 어드민 CRUD (체크리스트/질문 직접 편집)
- [ ] 다국어 지원 (i18n)
