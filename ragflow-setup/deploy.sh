#!/bin/bash

# RAGFlow 부인과 챗봇 배포 스크립트
set -e

DEPLOYMENT_DIR="/home/$USER/ragflow-minimal"

echo "🚀 RAGFlow 부인과 챗봇 배포 시작..."

# 배포 디렉토리로 이동
cd $DEPLOYMENT_DIR

# API 키 확인
echo "🔑 API 키 확인..."
if grep -q "your_gemini_api_key_here" .env; then
    echo "❌ Gemini API 키가 설정되지 않았습니다!"
    echo "   .env 파일에서 GEMINI_API_KEY를 설정하세요."
    exit 1
fi

if grep -q "your_openai_api_key_here" .env; then
    echo "❌ OpenAI API 키가 설정되지 않았습니다!"
    echo "   .env 파일에서 OPENAI_API_KEY를 설정하세요."
    exit 1
fi

# Docker 컨테이너 정리
echo "🧹 기존 컨테이너 정리..."
docker-compose -f docker-compose.minimal.yml down -v || true

# Docker 이미지 최신화
echo "📦 Docker 이미지 업데이트..."
docker-compose -f docker-compose.minimal.yml pull

# 서비스 시작
echo "▶️  RAGFlow 서비스 시작..."
docker-compose -f docker-compose.minimal.yml up -d

# 서비스 상태 확인
echo "⏳ 서비스 시작 대기 (60초)..."
sleep 60

# 헬스체크
echo "🏥 서비스 상태 확인..."
echo "1. Docker 컨테이너 상태:"
docker-compose -f docker-compose.minimal.yml ps

echo ""
echo "2. MySQL 연결 확인:"
docker exec ragflow-mysql mysqladmin ping -h localhost -u root -pinfiniflow || echo "❌ MySQL 연결 실패"

echo ""
echo "3. Redis 연결 확인:"
docker exec ragflow-redis redis-cli ping || echo "❌ Redis 연결 실패"

echo ""
echo "4. Elasticsearch 상태 확인:"
curl -s http://localhost:9200/_cluster/health | grep -o '"status":"[^"]*"' || echo "❌ Elasticsearch 연결 실패"

echo ""
echo "5. RAGFlow API 상태 확인:"
sleep 30  # API 서버 추가 대기
if curl -s http://localhost:9380/health | grep -q "ok\|healthy\|running"; then
    echo "✅ RAGFlow API 정상 동작"
else
    echo "❌ RAGFlow API 응답 없음"
    echo "API 로그 확인:"
    docker logs ragflow-api --tail 20
fi

# 의료 문서 업로드 안내
echo ""
echo "📚 의료 문서 업로드 준비:"
echo "documents/ 디렉토리에 PDF 파일을 업로드하세요."
echo ""
echo "업로드 예시:"
echo "curl -X POST http://localhost:9380/api/v1/documents/upload \\"
echo "  -F \"file=@documents/임신가이드라인.pdf\" \\"
echo "  -F \"category=pregnancy\" \\"
echo "  -F \"source=대한산부인과학회\""

# 테스트 명령어 안내
echo ""
echo "🧪 테스트 명령어:"
echo "# 문서 검색 테스트"
echo "curl -X POST http://localhost:9380/api/v1/search \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -d '{\"query\": \"임신 초기 엽산 복용량\", \"top_k\": 5, \"include_citations\": true}'"

echo ""
echo "✅ RAGFlow 배포 완료!"
echo "🌐 API 엔드포인트: http://$(curl -s ifconfig.me):9380"
echo "📊 모니터링: docker logs -f ragflow-api"