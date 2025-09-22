# 부인과 AI 챗봇 (Gynecology AI Chatbot)

> 전문의와 함께하는 건강한 임신 여정을 위한 AI 기반 상담 서비스

![License](https://img.shields.io/badge/license-MIT-green.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)
![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC.svg)

## 🌟 주요 기능

- **🤖 AI 기반 상담**: Google Gemini API와 Vertex AI RAG를 활용한 전문적인 부인과 상담
- **💬 실시간 채팅**: Vercel AI SDK를 이용한 스트리밍 채팅 인터페이스
- **📱 모바일 최적화**: 임산부를 위한 모바일 퍼스트 디자인
- **🎨 Maternal Design**: 따뜻하고 안정감 있는 임신부 친화적 UI/UX
- **🔐 안전한 인증**: Supabase Auth를 통한 보안 강화
- **📊 대화 기록**: 이전 상담 내역 저장 및 관리
- **🌐 반응형 디자인**: 모든 디바이스에서 최적화된 경험

## 🏗️ 기술 스택

### Frontend
- **Next.js 15** - App Router, Server Components
- **TypeScript** - 타입 안전성
- **Tailwind CSS 4** - 스타일링
- **Vercel AI SDK** - AI 채팅 인터페이스
- **Radix UI** - 접근성 있는 UI 컴포넌트
- **Lucide React** - 아이콘

### Backend & AI
- **Supabase** - 데이터베이스 및 인증
- **Google Gemini API** - AI 응답 생성
- **Vertex AI RAG** - 의료 지식 검색
- **Edge Runtime** - 서버리스 API

### Development & Testing
- **Jest** - 테스트 프레임워크
- **Testing Library** - 컴포넌트 테스트
- **ESLint & Prettier** - 코드 품질
- **GitHub Actions** - CI/CD

## 🚀 빠른 시작

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd gynecology-chatbot
npm install
```

### 2. 자동 설정 스크립트 실행

```bash
chmod +x setup.sh
./setup.sh
```

### 3. 환경변수 설정

`.env.local` 파일에 실제 API 키들을 입력하세요:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google AI 설정
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
VERTEX_AI_PROJECT_ID=your_vertex_project_id
VERTEX_AI_LOCATION=us-central1

# 앱 설정
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_key
```

### 4. 개발 서버 시작

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📁 프로젝트 구조

```
gynecology-chatbot/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 페이지
│   │   ├── chat/              # 채팅 인터페이스
│   │   ├── api/               # API 라우트
│   │   └── profile/           # 사용자 프로필
│   ├── components/            # React 컴포넌트
│   │   ├── ui/                # 기본 UI 컴포넌트
│   │   ├── chat/              # 채팅 관련 컴포넌트
│   │   ├── drawer/            # 드로워 컴포넌트
│   │   └── layout/            # 레이아웃 컴포넌트
│   ├── hooks/                 # 커스텀 React 훅
│   ├── lib/                   # 유틸리티 및 설정
│   └── types/                 # TypeScript 타입 정의
├── .github/workflows/         # CI/CD 설정
├── jest.config.js             # 테스트 설정
└── tailwind.config.js         # 스타일 설정
```

## 🛠️ 개발 명령어

```bash
# 개발
npm run dev              # 개발 서버 시작
npm run build            # 프로덕션 빌드
npm run start            # 프로덕션 서버 시작

# 코드 품질
npm run lint             # ESLint 실행
npm run lint:fix         # ESLint 자동 수정
npm run type-check       # TypeScript 타입 체크

# 테스트
npm run test             # 테스트 실행
npm run test:watch       # 테스트 감시 모드
npm run test:coverage    # 커버리지 포함 테스트

# 유틸리티
npm run clean            # 빌드 캐시 정리
npm run check-all        # 모든 검사 실행
```

## 🎨 UI/UX 디자인 시스템

### 색상 팔레트
- **Primary**: 따뜻한 코랄 톤 (`#f28b5c`)
- **Secondary**: 부드러운 라벤더 (`#a67fb5`)
- **Accent**: 민트 그린 (`#6ee7b7`)
- **Neutral**: 따뜻한 베이지 톤

### 컴포넌트 특징
- **둥근 모서리**: 날카로운 요소 최소화
- **부드러운 그라데이션**: 자연스러운 색상 전환
- **큰 터치 영역**: 임신 중 손가락 부종 고려
- **읽기 쉬운 폰트**: 최소 16px 크기

## 🔧 API 엔드포인트

### 인증 API
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃

### 사용자 API
- `GET /api/user/profile` - 프로필 조회
- `PUT /api/user/profile` - 프로필 수정
- `DELETE /api/user/profile` - 계정 삭제

### AI 채팅 API
- `POST /api/chat` - AI 채팅 요청
- `POST /api/rag` - RAG 지식 검색

## 📊 데이터베이스 스키마

### 주요 테이블
- `user_profiles` - 사용자 프로필 정보
- `conversations` - 대화 세션
- `messages` - 채팅 메시지
- `medical_knowledge` - RAG 지식베이스

## 🔐 보안 및 개인정보

- **HIPAA 준수**: 의료 데이터 보호 기준 적용
- **개인정보 암호화**: 민감한 데이터 암호화 저장
- **익명 세션**: 선택적 익명 상담 지원
- **데이터 최소화**: 필요한 정보만 수집

## 🚀 배포

### Vercel 배포 (권장)

1. Vercel 계정에 프로젝트 연결
2. 환경변수 설정
3. 자동 배포 확인

```bash
# Vercel CLI 사용
npm i -g vercel
vercel --prod
```

## 🧪 테스트

### 테스트 유형
- **Unit Tests**: 개별 컴포넌트 및 함수
- **Integration Tests**: API 엔드포인트
- **E2E Tests**: 사용자 플로우 (추후 추가)

### 커버리지 목표
- **Functions**: 70% 이상
- **Lines**: 70% 이상
- **Branches**: 70% 이상

## 🤝 기여하기

1. 저장소 포크
2. 피처 브랜치 생성 (`git checkout -b feature/amazing-feature`)
3. 변경사항 커밋 (`git commit -m 'Add amazing feature'`)
4. 브랜치 푸시 (`git push origin feature/amazing-feature`)
5. Pull Request 생성

## 🆘 문제 해결

### 자주 발생하는 문제들

**1. 환경변수 오류**
```bash
# .env.local 파일 확인
cp .env.local.template .env.local
# 실제 API 키 입력 필요
```

**2. 빌드 실패**
```bash
# 캐시 정리 후 재빌드
npm run clean
npm run build
```

**3. 타입 오류**
```bash
# 타입 정의 재생성
npm run type-check
```

---

**면책조명**: 이 서비스는 의료 참고용으로만 사용되며, 실제 의료 진단이나 치료를 대체하지 않습니다. 응급상황 시에는 반드시 의료진과 상담하시기 바랍니다.
