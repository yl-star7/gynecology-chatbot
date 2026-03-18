# Admin Carbon And Mobile Web Test Design

## Goal

`apps/web`의 관리자 화면을 IBM Carbon 라이트 운영 콘솔 톤으로 정리하고, 웹에서 모바일 뷰 구조를 검증할 수 있는 최소 테스트 경로를 확보한다.

## Scope

- 관리자 로그인 화면을 `운영 콘솔 인증 게이트`로 재구성한다.
- 관리자 대시보드를 Carbon식 정보 밀도와 섹션 우선순위로 재구성한다.
- `signup` 의미가 남던 관리자 액션 라벨을 운영자 관점 언어로 교체한다.
- 웹 라우트와 모바일 웹 쉘이 테스트 가능하도록 route composition 테스트와 shell 구조 테스트를 추가한다.

## Visual Direction

- IBM Carbon `Gray 10` 라이트 팔레트 사용
- `IBM Plex Sans` 중심 타이포
- 둥근 카드와 소프트 그림자 대신 얇은 경계선과 레이어 대비 중심
- 강조 색상은 Carbon 기본 `productive blue`
- 관리자 첫 화면 우선순위:
  1. 운영 상태
  2. 계정 조치 큐
  3. 운영 감사 로그
  4. 지식 문서 관리
  5. 응답 정책
  6. 실시간 사용자 이벤트
  7. 상담 세션 감사

## Testing Direction

- 관리자 UI 렌더 테스트
- 관리자 액션 라벨 매핑 테스트
- 웹 루트와 온보딩 route composition 테스트
- 모바일 웹 `MobileShell` 구조 테스트

## Notes

- visual companion 서버는 현재 로컬 Node ESM/CJS 충돌로 사용하지 않았다.
- 관리자만 색상 변경 범위에 포함했고, 모바일 웹 테마는 이번 변경 범위에서 제외했다.
