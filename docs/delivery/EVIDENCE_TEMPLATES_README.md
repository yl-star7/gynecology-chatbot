# 운영 증빙 템플릿 세트

이 문서는 제출용 증빙 패키지를 실제로 채울 때 사용할 기본 템플릿 세트입니다.

## 포함 항목

- `evidence-package-template/00_index/README.md`
- `evidence-package-template/00_index/manifest.csv`
- `evidence-package-template/00_index/acceptance-summary.csv`
- `evidence-package-template/01_ac/*/memo.md`
- `evidence-package-template/02_lim/*/*.md`
- `evidence-package-template/03_operations/submission-note.md`
- `evidence-package-template/99_signoff/reviewer-feedback-template.md`

## 사용 방법

1. `evidence-package-template/` 폴더를 복사해 실제 제출본 폴더명(`evidence-package-YYYYMMDD/`)으로 변경합니다.
2. 각 AC/LIM 폴더에 실제 캡처, JSON, CSV, PDF 파일을 넣습니다.
3. `manifest.csv`에 파일명과 설명을 기입합니다.
4. `acceptance-summary.csv`에 판정과 증빙 위치를 연결합니다.
5. 모든 민감정보를 마스킹한 뒤 압축합니다.

## 주의사항

- 본 템플릿에는 실제 비밀값, 실데이터, 개인정보를 넣지 않습니다.
- 실행 일시, 실행자, 환경(운영/스테이징)은 반드시 남깁니다.
- AC-007, LIM-001~006은 운영 증빙 없이는 최종 판정이 불완전합니다.
