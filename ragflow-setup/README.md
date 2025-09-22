# RAGFlow 경량 구성 (부인과 챗봇용)

## 🏗️ 구성 개요
- **웹 UI 제거**: API만 사용하는 경량 구성
- **필수 서비스만**: MySQL, Redis, MinIO, Elasticsearch, API 서버
- **의료 특화**: 출처 표시, 신뢰도 임계값 설정

## 📋 시스템 요구사항
- **CPU**: 4코어 이상
- **RAM**: 8GB 이상 (Elasticsearch 포함)
- **디스크**: 30GB 이상
- **Docker**: 24.0.0+, Docker Compose 2.26.1+

## 🚀 설치 및 실행

### 1. 환경 변수 설정
```bash
# .env 파일에서 API 키 설정
GEMINI_API_KEY=your_actual_gemini_api_key
OPENAI_API_KEY=your_actual_openai_api_key
```

### 2. 서비스 시작
```bash
docker-compose -f docker-compose.minimal.yml up -d
```

### 3. 상태 확인
```bash
# 모든 서비스 상태 확인
docker-compose -f docker-compose.minimal.yml ps

# API 서버 로그 확인
docker logs ragflow-api

# API 엔드포인트 테스트
curl http://localhost:9380/health
```

## 📚 의료 문서 업로드

### 1. 문서 준비
```
documents/
├── 대한산부인과학회_임신가이드라인.pdf
├── 질병관리청_모성건강관리.pdf
├── 보건복지부_출산준비.pdf
└── WHO_임신중영양관리.pdf
```

### 2. API를 통한 업로드
```bash
# 문서 업로드
curl -X POST http://localhost:9380/api/v1/documents/upload \
  -F "file=@documents/임신가이드라인.pdf" \
  -F "category=pregnancy" \
  -F "source=대한산부인과학회"
```

## 🔍 RAG 검색 API 사용

### 1. 문서 검색
```bash
curl -X POST http://localhost:9380/api/v1/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "임신 초기 엽산 복용량",
    "top_k": 5,
    "include_citations": true
  }'
```

### 2. 응답 예시
```json
{
  "results": [
    {
      "content": "임신 초기에는 엽산 400μg을 매일 복용하는 것이 권장됩니다.",
      "source": "대한산부인과학회_임신가이드라인.pdf",
      "page": 15,
      "confidence": 0.92,
      "citation": "대한산부인과학회. 임신 가이드라인. 2023. p.15"
    }
  ]
}
```

## 🛠️ Next.js 통합

### 1. 환경 변수 설정
```bash
# .env.local에 RAGFlow URL 추가
NEXT_PUBLIC_RAGFLOW_URL=http://localhost:9380
RAGFLOW_API_KEY=
```

### 2. RAGFlow 클라이언트 사용
```typescript
// 이미 구현된 클라이언트 사용
import { createRAGFlowClient } from '@/lib/ragflow-client';

const ragClient = createRAGFlowClient();
const searchResults = await ragClient.search({
  query: '임신 초기 엽산 복용량',
  top_k: 5,
  include_citations: true
});
```

### 3. 채팅에서 출처 표시
```typescript
// 출처가 포함된 메시지 표시
import { CitationSources } from '@/components/chat/citation-sources';

// 메시지와 함께 출처 표시
{message.role === 'assistant' && message.citations && (
  <CitationSources citations={message.citations} />
)}
```

## 📊 모니터링

### 로그 확인
```bash
# API 서버 로그
docker logs -f ragflow-api

# Elasticsearch 상태
curl http://localhost:9200/_cluster/health

# 저장된 문서 수 확인
curl http://localhost:9380/api/v1/documents/count
```

## 🔧 트러블슈팅

### 메모리 부족 시
- `docker-compose.minimal.yml`에서 ES_JAVA_OPTS 조정
- 불필요한 문서 삭제

### API 응답 느림
- Elasticsearch 인덱스 최적화
- 청크 크기 조정 (service_conf.yaml)

### 검색 결과 품질 개선
- confidence_threshold 조정
- 더 많은 의료 문서 추가
- 임베딩 모델 변경 고려