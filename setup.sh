#!/bin/bash

# 부인과 AI 챗봇 개발환경 설정 스크립트
echo "🏥 부인과 AI 챗봇 개발환경 설정을 시작합니다..."

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수들
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Node.js 버전 확인
print_status "Node.js 버전을 확인합니다..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION 설치됨"
else
    print_error "Node.js가 설치되지 않았습니다. https://nodejs.org에서 설치해주세요."
    exit 1
fi

# npm 버전 확인
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm $NPM_VERSION 설치됨"
else
    print_error "npm이 설치되지 않았습니다."
    exit 1
fi

# 의존성 설치
print_status "의존성을 설치합니다..."
npm install
if [ $? -eq 0 ]; then
    print_success "의존성 설치 완료"
else
    print_error "의존성 설치 실패"
    exit 1
fi

# 환경변수 파일 생성
print_status "환경변수 파일을 설정합니다..."
if [ ! -f ".env.local" ]; then
    cp .env.local.template .env.local
    print_warning ".env.local 파일이 생성되었습니다. 실제 값들을 입력해주세요."
else
    print_success ".env.local 파일이 이미 존재합니다."
fi

# Git hooks 설정
print_status "Git hooks를 설정합니다..."
if [ -d ".git" ]; then
    # Pre-commit hook 생성
    cat > .git/hooks/pre-commit << 'EOF'
#!/bin/sh
echo "🔍 Pre-commit 검사를 실행합니다..."

# 린팅 검사
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ 린팅 오류가 발생했습니다."
    exit 1
fi

# 타입 검사
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ 타입 오류가 발생했습니다."
    exit 1
fi

echo "✅ Pre-commit 검사 완료"
EOF
    chmod +x .git/hooks/pre-commit
    print_success "Git pre-commit hook 설정 완료"
else
    print_warning "Git repository가 초기화되지 않았습니다."
fi

# 개발 도구 확인
print_status "개발 도구를 확인합니다..."

# TypeScript 컴파일러 확인
if command -v tsc &> /dev/null; then
    print_success "TypeScript 설치됨"
else
    print_warning "TypeScript가 글로벌로 설치되지 않았습니다."
fi

# Supabase CLI 확인
if command -v supabase &> /dev/null; then
    print_success "Supabase CLI 설치됨"
else
    print_warning "Supabase CLI가 설치되지 않았습니다. 'npm i -g supabase'로 설치해주세요."
fi

# 빌드 테스트
print_status "빌드 테스트를 실행합니다..."
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "빌드 테스트 성공"
    # 빌드 파일 정리
    rm -rf .next
else
    print_warning "빌드 테스트 실패 (환경변수 설정 후 다시 시도하세요)"
fi

# 테스트 실행
print_status "테스트를 실행합니다..."
npm test > /dev/null 2>&1
if [ $? -eq 0 ]; then
    print_success "모든 테스트 통과"
else
    print_warning "일부 테스트 실패"
fi

echo ""
print_success "🎉 개발환경 설정이 완료되었습니다!"
echo ""
print_status "다음 단계:"
echo "  1. .env.local 파일에 실제 API 키들을 입력하세요"
echo "  2. Supabase 프로젝트를 설정하세요"
echo "  3. Google Cloud 프로젝트를 설정하세요"
echo "  4. 'npm run dev'로 개발 서버를 시작하세요"
echo ""
print_status "유용한 명령어들:"
echo "  npm run dev          - 개발 서버 시작"
echo "  npm run build        - 프로덕션 빌드"
echo "  npm run test         - 테스트 실행"
echo "  npm run test:watch   - 테스트 감시 모드"
echo "  npm run lint         - 코드 린팅"
echo "  npm run type-check   - 타입 검사"
echo "  npm run check-all    - 모든 검사 실행"
echo ""
print_success "즐거운 개발되세요! 🚀"