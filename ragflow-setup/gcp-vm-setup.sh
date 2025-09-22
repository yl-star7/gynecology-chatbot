#!/bin/bash

# RAGFlow 부인과 챗봇용 GCP VM 설정 스크립트
# Ubuntu 20.04 LTS 기준

set -e

echo "🚀 RAGFlow 부인과 챗봇용 GCP VM 설정 시작..."

# 시스템 업데이트
echo "📦 시스템 패키지 업데이트..."
sudo apt-get update
sudo apt-get upgrade -y

# Docker 설치
echo "🐳 Docker 설치..."
sudo apt-get install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Docker Compose 설치 (v2.26.1+)
echo "🔧 Docker Compose 설치..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.26.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Docker 사용자 권한 설정
sudo usermod -aG docker $USER

# 방화벽 설정 (RAGFlow API 포트)
echo "🔥 방화벽 설정..."
sudo ufw allow 9380/tcp  # RAGFlow API
sudo ufw allow ssh
sudo ufw --force enable

# 프로젝트 디렉토리 생성
echo "📁 프로젝트 디렉토리 설정..."
mkdir -p /home/$USER/ragflow-minimal
cd /home/$USER/ragflow-minimal

# 환경 변수 파일 생성
echo "⚙️ 환경 변수 설정..."
cat > .env << 'EOL'
# RAGFlow 환경 변수 설정
RAGFLOW_VERSION=latest

# API 키 설정 (수동으로 입력 필요)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# 데이터베이스 설정
MYSQL_ROOT_PASSWORD=infiniflow
MYSQL_DATABASE=ragflow

# MinIO 설정
MINIO_ROOT_USER=root
MINIO_ROOT_PASSWORD=password

# 포트 설정
RAGFLOW_API_PORT=9380
MYSQL_PORT=3306
REDIS_PORT=6379
MINIO_PORT=9000
ELASTICSEARCH_PORT=9200

# 메모리 설정 (GCP VM 사양에 맞게 조정)
ES_JAVA_OPTS=-Xms2g -Xmx2g

# 보안 설정
JWT_SECRET=gynecology-chatbot-secret-key
API_RATE_LIMIT=100

# 의료 문서 설정
DOCUMENT_MAX_SIZE=50MB
ALLOWED_FILE_TYPES=pdf,doc,docx,txt,md
EOL

# 의료 문서 디렉토리 생성
echo "📚 의료 문서 디렉토리 생성..."
mkdir -p documents

# 시스템 리소스 확인
echo "💻 시스템 리소스 확인..."
echo "CPU 코어: $(nproc)"
echo "메모리: $(free -h | grep '^Mem:' | awk '{print $2}')"
echo "디스크 공간: $(df -h / | tail -1 | awk '{print $4}')"

# VM 최적화 설정
echo "⚡ VM 성능 최적화..."
# 스왑 생성 (메모리 부족 대비)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 파일 시스템 한계 증가
echo "fs.file-max = 1000000" | sudo tee -a /etc/sysctl.conf
echo "vm.max_map_count = 262144" | sudo tee -a /etc/sysctl.conf  # Elasticsearch용
sudo sysctl -p

# 로그 설정
echo "📊 로그 디렉토리 설정..."
mkdir -p logs

echo "✅ GCP VM 설정 완료!"
echo ""
echo "🔧 다음 단계:"
echo "1. .env 파일에서 API 키 설정"
echo "2. Docker Compose 파일 업로드"
echo "3. RAGFlow 서비스 시작: docker-compose -f docker-compose.minimal.yml up -d"
echo ""
echo "⚠️  주의사항:"
echo "- VM 재부팅 후 Docker 그룹 권한이 적용됩니다"
echo "- Elasticsearch를 위해 최소 8GB RAM 권장"
echo "- GCP 방화벽에서 9380 포트 열기 필요"
echo ""
echo "🌐 서비스 확인 URL: http://[VM_EXTERNAL_IP]:9380/health"