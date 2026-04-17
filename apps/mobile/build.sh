#!/bin/bash
set -euo pipefail

PLATFORM="${1:-}"
PROFILE="${2:-production}"
SKIP_SUBMIT="${SKIP_SUBMIT:-}"

# ── Colors ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}▸${NC} $1"; }
ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
err()  { echo -e "${RED}✗${NC} $1" >&2; }

# ── Usage ───────────────────────────────────────────────
usage() {
  echo "Usage: ./build.sh <aos|ios> [profile]"
  echo ""
  echo "Profiles:"
  echo "  preview      내부 배포 (Android: APK, iOS: Ad Hoc)"
  echo "  production   스토어 배포 (Android: AAB, iOS: App Store)"
  echo ""
  echo "Examples:"
  echo "  ./build.sh aos              # Android production 빌드 + 업로드"
  echo "  ./build.sh ios              # iOS production 빌드 + 업로드"
  echo "  ./build.sh aos preview      # Android preview APK 빌드"
  echo ""
  echo "Environment:"
  echo "  SKIP_SUBMIT=1 ./build.sh aos   # 빌드만, 업로드 생략"
  exit 1
}

if [[ -z "$PLATFORM" ]]; then
  usage
fi

# ── Validate ────────────────────────────────────────────
if [[ "$PLATFORM" != "aos" && "$PLATFORM" != "ios" ]]; then
  err "Unknown platform: $PLATFORM (aos 또는 ios)"
  exit 1
fi

if [[ "$PROFILE" != "preview" && "$PROFILE" != "production" ]]; then
  err "Unknown profile: $PROFILE (preview 또는 production)"
  exit 1
fi

SI_CACHE_ROOT="${SI_CACHE_ROOT:-$HOME/.cache/si-build}"
export npm_config_cache="${npm_config_cache:-$SI_CACHE_ROOT/npm}"
export EXPO_HOME="${EXPO_HOME:-$SI_CACHE_ROOT/expo}"
export CP_HOME_DIR="${CP_HOME_DIR:-$SI_CACHE_ROOT/cocoapods}"
# Keep EAS temp working directory so node_modules/Pods persist across builds.
# Platform-specific to avoid iOS/Android collisions when run in parallel.
export EAS_LOCAL_BUILD_SKIP_CLEANUP="${EAS_LOCAL_BUILD_SKIP_CLEANUP:-1}"
export EAS_LOCAL_BUILD_WORKINGDIR="${EAS_LOCAL_BUILD_WORKINGDIR:-$SI_CACHE_ROOT/eas-workingdir-$PLATFORM}"
export npm_config_prefer_offline="${npm_config_prefer_offline:-true}"
mkdir -p "$npm_config_cache" "$EXPO_HOME" "$CP_HOME_DIR" "$EAS_LOCAL_BUILD_WORKINGDIR"

if [[ "$PLATFORM" == "aos" ]]; then
  export GRADLE_USER_HOME="${GRADLE_USER_HOME:-$SI_CACHE_ROOT/gradle}"
  mkdir -p "$GRADLE_USER_HOME"

  DEFAULT_ANDROID_SDK="$HOME/Library/Android/sdk"
  if [[ -z "${ANDROID_HOME:-}" && -d "$DEFAULT_ANDROID_SDK" ]]; then
    export ANDROID_HOME="$DEFAULT_ANDROID_SDK"
  fi
  if [[ -z "${ANDROID_SDK_ROOT:-}" && -d "$DEFAULT_ANDROID_SDK" ]]; then
    export ANDROID_SDK_ROOT="$DEFAULT_ANDROID_SDK"
  fi
fi

if [[ "$PLATFORM" == "ios" ]]; then
  # Xcode export invokes /usr/bin/rsync with Apple-specific extended-attribute
  # flags. Keep Apple system tools ahead of Homebrew so the rsync server side
  # does not resolve to GNU/Homebrew rsync and fail IPA packaging.
  export PATH="/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin:/opt/homebrew/sbin:$PATH"
fi

# ── Read version info ──────────────────────────────────
APP_VERSION=$(node -e "console.log(require('./app.json').expo.version)")
EAS_PLATFORM=$([[ "$PLATFORM" == "aos" ]] && echo "android" || echo "ios")
EAS_EXT=$([[ "$PLATFORM" == "aos" ]] && echo "$([[ "$PROFILE" == "preview" ]] && echo "apk" || echo "aab")" || echo "ipa")

# Get next version code from EAS remote
log "버전 정보 조회 중..."
REMOTE_VERSION=$(npx eas-cli build:version:get --platform "$EAS_PLATFORM" --json 2>/dev/null || echo "{}")
if [[ "$PLATFORM" == "aos" ]]; then
  CURRENT_VC=$(echo "$REMOTE_VERSION" | node -e "try{const d=require('fs').readFileSync(0,'utf8');console.log(JSON.parse(d).versionCode||0)}catch{console.log(0)}")
else
  CURRENT_VC=$(echo "$REMOTE_VERSION" | node -e "try{const d=require('fs').readFileSync(0,'utf8');console.log(JSON.parse(d).buildNumber||0)}catch{console.log(0)}")
fi

if [[ "$PROFILE" == "production" ]]; then
  NEXT_VC=$((CURRENT_VC + 1))
else
  NEXT_VC=$((CURRENT_VC + 1))
fi

# ── Output path ─────────────────────────────────────────
BUILD_DIR="./builds/${EAS_PLATFORM}"
mkdir -p "$BUILD_DIR"
OUTPUT_FILE="${BUILD_DIR}/agaya-v${APP_VERSION}-vc${NEXT_VC}-${PROFILE}.${EAS_EXT}"

echo ""
echo -e "${CYAN}┌─────────────────────────────────────┐${NC}"
echo -e "${CYAN}│${NC}  아가야 로컬 빌드                    ${CYAN}│${NC}"
echo -e "${CYAN}├─────────────────────────────────────┤${NC}"
echo -e "${CYAN}│${NC}  Platform : ${YELLOW}${PLATFORM}${NC} (${EAS_PLATFORM})"
echo -e "${CYAN}│${NC}  Profile  : ${YELLOW}${PROFILE}${NC}"
echo -e "${CYAN}│${NC}  Version  : ${GREEN}${APP_VERSION}${NC} (vc${NEXT_VC})"
echo -e "${CYAN}│${NC}  Output   : ${GREEN}${OUTPUT_FILE}${NC}"
echo -e "${CYAN}│${NC}  Submit   : $([[ -n "$SKIP_SUBMIT" ]] && echo "${RED}건너뜀${NC}" || echo "${GREEN}자동 업로드${NC}")"
echo -e "${CYAN}└─────────────────────────────────────┘${NC}"
echo ""

# ── Build ───────────────────────────────────────────────
log "로컬 빌드 시작... (${EAS_PLATFORM} / ${PROFILE})"
BUILD_START=$(date +%s)

npx eas-cli build --local \
  --platform "$EAS_PLATFORM" \
  --profile "$PROFILE" \
  --output "$OUTPUT_FILE" \
  --non-interactive

BUILD_END=$(date +%s)
BUILD_DURATION=$(( BUILD_END - BUILD_START ))
BUILD_MIN=$(( BUILD_DURATION / 60 ))
BUILD_SEC=$(( BUILD_DURATION % 60 ))

if [[ ! -f "$OUTPUT_FILE" ]]; then
  err "빌드 실패: ${OUTPUT_FILE} 파일이 생성되지 않았습니다"
  exit 1
fi

FILE_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)
ok "빌드 완료! (${BUILD_MIN}분 ${BUILD_SEC}초, ${FILE_SIZE})"
echo "   → ${OUTPUT_FILE}"

# ── Submit ──────────────────────────────────────────────
if [[ -n "$SKIP_SUBMIT" ]]; then
  warn "SKIP_SUBMIT 설정됨 — 업로드 생략"
  exit 0
fi

if [[ "$PROFILE" == "preview" ]]; then
  warn "preview 프로필은 스토어 업로드 대상이 아닙니다"
  log "내부 배포가 필요하면 수동으로 공유하세요: ${OUTPUT_FILE}"
  exit 0
fi

echo ""
log "스토어 업로드 시작... (${EAS_PLATFORM})"

npx eas-cli submit \
  --platform "$EAS_PLATFORM" \
  --path "$OUTPUT_FILE" \
  --profile production \
  --non-interactive

ok "업로드 완료!"

if [[ "$PLATFORM" == "aos" ]]; then
  echo -e "   → Google Play Console (internal track)"
else
  echo -e "   → App Store Connect (TestFlight)"
fi

echo ""
ok "전체 완료! 🎉"
