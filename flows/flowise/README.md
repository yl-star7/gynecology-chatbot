# Flowise Assets

이 디렉터리는 Flowise에서 내보낸 chatflow/agentflow JSON을 Git으로 버전 관리하기 위한 위치입니다.

현재 기본 규칙은 아래와 같습니다.

1. 운영에 반영할 flow는 `chatflows/` 아래에 JSON으로 보관합니다.
2. 수정 전 export를 먼저 저장하고, 변경 후 export를 같은 경로에 다시 커밋합니다.
3. DB에는 현재 활성 flow의 메타데이터와 외부 Flow ID를 저장하고, 실제 정의 원본은 Git에서 이력을 관리합니다.
