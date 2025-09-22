#!/bin/bash

# 의료 문서 업로드 스크립트
set -e

RAGFLOW_API_URL="http://localhost:9380"
DOCUMENTS_DIR="./documents"

echo "📚 의료 문서 업로드 시작..."

# API 서버 상태 확인
echo "🔍 RAGFlow API 서버 상태 확인..."
if ! curl -s "$RAGFLOW_API_URL/health" > /dev/null; then
    echo "❌ RAGFlow API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인하세요."
    exit 1
fi

echo "✅ API 서버 연결 확인됨"

# 문서 디렉토리 확인
if [ ! -d "$DOCUMENTS_DIR" ]; then
    echo "📁 문서 디렉토리 생성: $DOCUMENTS_DIR"
    mkdir -p "$DOCUMENTS_DIR"
fi

# 의료 문서 업로드 함수
upload_document() {
    local file_path="$1"
    local category="$2"
    local source="$3"
    local description="$4"

    if [ ! -f "$file_path" ]; then
        echo "❌ 파일을 찾을 수 없습니다: $file_path"
        return 1
    fi

    echo "📄 업로드 중: $(basename "$file_path")"

    # 파일 업로드 API 호출
    response=$(curl -s -w "%{http_code}" -X POST "$RAGFLOW_API_URL/api/v1/documents/upload" \
        -F "file=@$file_path" \
        -F "category=$category" \
        -F "source=$source" \
        -F "description=$description" \
        -F "confidence_threshold=0.7" \
        -F "enable_citations=true")

    http_code="${response: -3}"
    response_body="${response%???}"

    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "✅ 업로드 성공: $(basename "$file_path")"
        echo "   응답: $response_body"
    else
        echo "❌ 업로드 실패: $(basename "$file_path") (HTTP $http_code)"
        echo "   오류: $response_body"
    fi

    echo ""
}

# 샘플 의료 문서 생성 (PDF가 없는 경우)
create_sample_docs() {
    echo "📝 샘플 의료 문서 생성..."

    # 임신 초기 가이드라인 텍스트 파일
    cat > "$DOCUMENTS_DIR/임신초기_가이드라인.txt" << 'EOL'
임신 초기 관리 가이드라인

1. 엽산 복용
- 임신 계획 시부터 임신 12주까지 매일 400-800μg 복용
- 신경관 결함 예방에 필수적
- 임신 전 최소 1개월 전부터 복용 시작 권장

2. 초기 증상
- 입덧: 임신 6-8주부터 시작, 대부분 12주경 호전
- 가슴 팽만감 및 압통
- 피로감 증가
- 소변 횟수 증가

3. 산전 검사
- 첫 산전진료: 임신 6-8주
- 초음파 검사로 태아심박동 확인
- 혈액검사: 혈액형, 빈혈, 감염질환 검사
- 자궁경부암 검사

4. 주의사항
- 알코올, 흡연 금지
- 생선회, 덜 익힌 고기 피하기
- 카페인 하루 200mg 이하 제한
- 격렬한 운동 피하기

출처: 대한산부인과학회 임신 가이드라인 2023
EOL

    # 임신 중 영양관리 텍스트 파일
    cat > "$DOCUMENTS_DIR/임신중_영양관리.txt" << 'EOL'
임신 중 영양관리 지침

1. 필수 영양소
- 엽산: 400-800μg/일 (녹색채소, 보충제)
- 철분: 임신 후반기 30mg/일 추가 필요
- 칼슘: 1000mg/일 (우유, 유제품, 뼈째먹는 생선)
- 오메가-3: 태아 뇌 발달에 중요 (등푸른 생선)

2. 체중 증가 관리
- 정상 체중: 11.5-16kg 증가
- 저체중: 12.5-18kg 증가
- 과체중: 7-11.5kg 증가
- 비만: 5-9kg 증가

3. 피해야 할 음식
- 생선회, 생굴 등 날것
- 덜 익힌 육류, 계란
- 알코올
- 카페인 과다 섭취
- 상어, 고등어 등 수은 함량 높은 생선

4. 권장 음식
- 신선한 과일과 채소
- 통곡물
- 저지방 단백질
- 저지방 유제품
- 충분한 수분 섭취

출처: 보건복지부 모성건강관리 가이드 2023
EOL

    # 산전 검사 일정 텍스트 파일
    cat > "$DOCUMENTS_DIR/산전검사_일정.txt" << 'EOL'
산전 검사 일정 가이드

1. 임신 초기 (4-12주)
- 6-8주: 첫 산전진료
  * 초음파로 태아심박동 확인
  * 혈액검사 (혈액형, Rh, 빈혈, 매독, B형간염, HIV)
  * 소변검사
  * 자궁경부암 검사

- 11-13주: 1차 기형아 검사
  * 목덜미 투명대 측정
  * 혈액검사 (PAPP-A, free β-hCG)

2. 임신 중기 (13-28주)
- 15-20주: 2차 기형아 검사
  * 트리플/쿼드러플 검사
  * 양수검사 (고위험군)

- 18-22주: 정밀 초음파
  * 태아 기형 검사
  * 성별 확인 가능

- 24-28주: 임신성 당뇨 검사
  * 50g 당부하 검사

3. 임신 후기 (28주 이후)
- 28주: Rh 음성인 경우 항체검사
- 32-36주: 태아 성장 상태 확인
- 35-37주: B군 연쇄상구균 검사
- 36주 이후: 분만 준비 상담

출처: 대한산부인과학회 산전관리 가이드라인 2023
EOL

    echo "✅ 샘플 문서 생성 완료"
}

# PDF 파일이 없으면 샘플 텍스트 파일 생성
pdf_count=$(find "$DOCUMENTS_DIR" -name "*.pdf" 2>/dev/null | wc -l)
if [ "$pdf_count" -eq 0 ]; then
    echo "📋 PDF 파일이 없어 샘플 텍스트 파일을 생성합니다..."
    create_sample_docs
fi

# 문서 업로드 실행
echo "📤 문서 업로드 시작..."

# 텍스트 파일 업로드
for file in "$DOCUMENTS_DIR"/*.txt; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .txt)
        case "$filename" in
            "임신초기_가이드라인")
                upload_document "$file" "pregnancy_early" "대한산부인과학회" "임신 초기 관리 및 주의사항"
                ;;
            "임신중_영양관리")
                upload_document "$file" "nutrition" "보건복지부" "임신 중 필수 영양소 및 식이 가이드"
                ;;
            "산전검사_일정")
                upload_document "$file" "prenatal_care" "대한산부인과학회" "임신 기간별 산전 검사 일정"
                ;;
            *)
                upload_document "$file" "general" "의료기관" "부인과 관련 의료 문서"
                ;;
        esac
        sleep 2  # API 호출 간격 조절
    fi
done

# PDF 파일 업로드
for file in "$DOCUMENTS_DIR"/*.pdf; do
    if [ -f "$file" ]; then
        filename=$(basename "$file" .pdf)
        upload_document "$file" "medical_pdf" "의료기관" "PDF 형태의 의료 문서"
        sleep 2
    fi
done

echo "📊 업로드 결과 확인..."

# 업로드된 문서 수 확인
echo "📈 업로드된 문서 통계:"
curl -s "$RAGFLOW_API_URL/api/v1/documents/count" | grep -o '"total":[0-9]*' || echo "문서 수 확인 API 없음"

echo ""
echo "🧪 검색 테스트 실행..."

# 검색 테스트
test_queries=("임신 초기 엽산 복용량" "산전 검사 일정" "임신 중 피해야 할 음식")

for query in "${test_queries[@]}"; do
    echo "🔍 검색어: $query"
    response=$(curl -s -X POST "$RAGFLOW_API_URL/api/v1/search" \
        -H "Content-Type: application/json" \
        -d "{\"query\": \"$query\", \"top_k\": 3, \"include_citations\": true}")

    if [ -n "$response" ]; then
        echo "✅ 검색 결과 있음"
        echo "$response" | head -c 200
        echo "..."
    else
        echo "❌ 검색 결과 없음"
    fi
    echo ""
    sleep 1
done

echo "✅ 의료 문서 업로드 및 테스트 완료!"
echo ""
echo "📋 다음 단계:"
echo "1. 더 많은 의료 PDF 문서를 documents/ 디렉토리에 추가"
echo "2. RAGFlow API를 Next.js 챗봇에 통합"
echo "3. 출처 표시 UI 구현"