# 모바일 앱 빌드 및 배포 가이드

> 최종 갱신: 2026-03-30
> 대상: 운영자/개발자 — EAS Build를 통한 iOS/Android 빌드, 스토어 제출, 푸시 알림 설정

---

## 1. 전제 조건

### 1-1. 계정

| 서비스 | 계정 | 용도 |
|--------|------|------|
| Expo (EAS) | `yl-star7` / yllee@catholic.ac.kr | 빌드 서버, OTA 업데이트 |
| Apple Developer | Yaelim Lee (MQSM39UXYJ) | iOS 인증서, TestFlight, App Store |
| Google Play Console | ylstar7 | Android 내부 테스트, Play Store |
| Firebase | agaya-2026 | FCM 푸시 알림 (Android + iOS) |

### 1-2. 로컬 환경

```bash
# 필수 CLI
node -v          # >= 20
eas --version    # >= 12.0.0  (npm i -g eas-cli)
```

### 1-3. 인증 토큰

```bash
# EAS 토큰 (CI/자동화용)
export EXPO_TOKEN=<.env.local 의 EXPO_TOKEN 값>

# 또는 대화형 로그인
eas login
```

---

## 2. 프로젝트 구조

```
apps/mobile/
  app.json              # Expo 앱 메타데이터
  eas.json              # 빌드 프로필 (development / preview / production)
  GoogleService-Info.plist   # iOS Firebase 설정
  google-services.json       # Android Firebase 설정
  ios/                  # 네이티브 iOS 프로젝트
  android/              # 네이티브 Android 프로젝트
```

### 2-1. eas.json 빌드 프로필

| 프로필 | 용도 | 배포 방식 |
|--------|------|-----------|
| `development` | 개발 클라이언트 (시뮬레이터) | 내부 |
| `preview` | QA 테스트 빌드 | 내부 배포 |
| `production` | 스토어 제출용 | App Store / Play Store |

`production` 프로필은 `autoIncrement: true`가 설정되어 있어, 빌드할 때마다 `buildNumber` (iOS) / `versionCode` (Android)가 자동 증가합니다.

---

## 3. 빌드

### 3-1. Android 프로덕션 빌드

```bash
cd apps/mobile
eas build --platform android --profile production --no-wait
```

- 출력 형식: `.aab` (Android App Bundle)
- Play Store 제출에 필요한 형식
- 빌드 소요: 약 10~15분

### 3-2. iOS 프로덕션 빌드

```bash
cd apps/mobile
eas build --platform ios --profile production --no-wait
```

- 첫 빌드 시 Apple Developer 로그인 필요 (Apple ID + 비밀번호 + 2FA)
- EAS가 자동으로 Distribution Certificate, Provisioning Profile 생성
- 출력 형식: `.ipa`
- 빌드 소요: 약 20~30분

### 3-3. 빌드 상태 확인

```bash
# 목록 조회
eas build:list --platform ios --limit 3
eas build:list --platform android --limit 3

# 특정 빌드 상태
eas build:view <build-id>
```

### 3-4. 빌드 결과물 다운로드

빌드 완료 후 EAS 대시보드 또는 CLI에서 다운로드 URL 확인:

```bash
eas build:list --platform android --limit 1 --json | python3 -c "
import json, sys
b = json.load(sys.stdin)[0]
print(f\"Status: {b['status']}\")
print(f\"URL: {b.get('artifacts', {}).get('buildUrl', 'N/A')}\")
"
```

---

## 4. 스토어 제출

### 4-1. Android — Google Play Console

#### 내부 테스트 (Internal Testing)

1. [Google Play Console](https://play.google.com/console) 접속
2. 앱 만들기 > 앱 이름: `아가야`, 패키지: `com.gynecology.chatbot`
3. **테스트 > 내부 테스트** > 새 릴리스 만들기
4. EAS에서 다운로드한 `.aab` 파일 업로드
5. 테스터 이메일 목록 추가 (최대 100명)
6. 릴리스 검토 > 내부 테스트에 출시

#### EAS Submit (자동 제출)

```bash
eas submit --platform android --latest
```

- 첫 실행 시 Google Play Service Account JSON 키 필요
- `eas.json`에 `submit.production.android` 설정 추가 가능

### 4-2. iOS — App Store Connect / TestFlight

#### TestFlight 배포 (연구용 권장)

1. EAS에서 자동 제출:

```bash
eas submit --platform ios --latest
```

2. 첫 실행 시 Apple 인증 필요 (ASC API Key 또는 Apple ID 로그인)
3. App Store Connect에서 TestFlight > 빌드 확인
4. 내부 테스터 추가 (최대 100명, ASC 사용자 필요)
5. 외부 테스트 시 Beta App Review 필요 (1~2일 소요)

#### App Store 정식 출시

1. App Store Connect > 앱 정보 입력
   - 앱 이름, 설명, 스크린샷, 카테고리
   - 개인정보 처리방침 URL
   - 연령 등급 설정
2. 빌드 선택 > 심사 제출
3. App Review 소요: 보통 1~3일

---

## 5. 푸시 알림 설정

### 5-1. 현재 구성

| 플랫폼 | 방식 | 상태 |
|--------|------|------|
| Android | FCM V1 (Google Service Account) | 설정 완료 |
| iOS | APNs 인증 키 (.p8) | 설정 완료 |

### 5-2. Android — FCM V1

**Firebase Console 설정:**
- 프로젝트: `agaya-2026`
- 발신자 ID: `495836766254`
- Service Account Key가 EAS credentials에 업로드됨

**앱 설정 파일:**
- `apps/mobile/google-services.json` — Android Firebase 설정
- `app.json`의 `android.googleServicesFile`로 참조

### 5-3. iOS — APNs

**Apple Developer 설정:**
- APNs Key Name: `Agaya APNs Key`
- Key ID: `95C982SX53`
- Environment: Sandbox & Production
- Team ID: `MQSM39UXYJ`

**Firebase Console 설정:**
- Cloud Messaging > Apple 앱 구성 > 프로덕션 APNs 인증 키 등록됨
- 키 파일: `AuthKey_95C982SX53.p8` (다운로드 후 안전한 곳에 백업 필수, 재다운로드 불가)

**앱 설정 파일:**
- `apps/mobile/GoogleService-Info.plist` — iOS Firebase 설정 (IS_GCM_ENABLED: true)
- `app.json`의 `ios.googleServicesFile`로 참조

### 5-4. Expo Push Token 흐름

```
앱 시작 → Expo Push Token 발급 → 서버에 토큰 저장
서버에서 알림 전송 → Expo Push Service → FCM/APNs → 디바이스
```

서버 측 푸시 전송은 `apps/web/src/lib/mobile/push-sender.ts`에서 Expo Push API를 통해 처리됩니다.

---

## 6. Credentials 관리

### 6-1. 현재 iOS Credentials

```bash
# 조회
eas credentials --platform ios
```

| 항목 | 값 |
|------|-----|
| Distribution Certificate | Serial 197818E8500E8BB3EB13C86696D2AF11, 만료 2027-03-30 |
| Provisioning Profile | ID 34ZCJLVN7P, active, 만료 2027-03-30 |
| Push Key | EAS에서 자동 생성, 할당 완료 |

### 6-2. 현재 Android Credentials

```bash
# 조회
eas credentials --platform android
```

| 항목 | 값 |
|------|-----|
| FCM V1 Service Account | firebase-adminsdk-fbsvc@agaya-2026.iam.gserviceaccount.com |
| Keystore | EAS 관리 (EAS에서 자동 생성) |

### 6-3. Credentials 갱신

- iOS Distribution Certificate: 1년 유효 (2027-03-30 만료)
- iOS Provisioning Profile: Certificate와 동일 주기
- APNs Key: 만료 없음 (분실 시 Apple Developer에서 재생성 필요)
- Android Keystore: EAS 관리 시 자동, 분실 시 앱 업데이트 불가하므로 백업 권장

```bash
# Android Keystore 백업
eas credentials --platform android
# > Download Keystore 선택
```

---

## 7. 버전 관리

### 7-1. 버전 체계

- `appVersion` (사용자 표시): `app.json`의 `version` 필드 → `1.0.0`
- `buildNumber` (iOS) / `versionCode` (Android): EAS remote에서 자동 관리

### 7-2. 버전 올리기

```bash
# app.json의 version 수동 변경 (메이저/마이너 업데이트 시)
# buildNumber/versionCode는 production 빌드 시 자동 증가
```

스토어 신규 버전 제출 시에는 `app.json`의 `version`을 올려야 합니다.

---

## 8. 문제 해결

### 8-1. iOS 빌드 실패 — Credentials 미설정

```
Credentials are not set up. Run this command again in interactive mode.
```

해결: `--no-wait` 없이 interactive 모드로 실행하여 Apple 로그인 후 인증서 생성

### 8-2. Apple 계정 잠김

여러 번 잘못된 비밀번호 입력 시 발생. [iforgot.apple.com](https://iforgot.apple.com)에서 해제.

### 8-3. Android AAB가 Play Console에서 거부됨

- 서명 키 불일치: EAS 관리 키스토어 사용 시 Play App Signing 활성화 필요
- versionCode 중복: `eas.json`의 `autoIncrement`가 활성화되어 있는지 확인

### 8-4. 푸시 알림이 오지 않음

1. Expo Push Token이 서버에 저장되었는지 확인
2. Firebase Console > Cloud Messaging에서 FCM V1 API 활성화 여부 확인
3. iOS: APNs 키가 Firebase에 등록되었는지 확인
4. Android: `google-services.json`의 `project_id`가 Firebase 프로젝트와 일치하는지 확인

---

## 9. 운영 체크리스트

### 빌드 전

- [ ] `pnpm type-check` 통과
- [ ] `pnpm test` 통과
- [ ] `app.json` 버전 확인
- [ ] Firebase 설정 파일 최신 상태 확인

### 스토어 제출 전

- [ ] 앱 아이콘, 스플래시 이미지 확인
- [ ] 개인정보 처리방침 URL 준비
- [ ] 스크린샷 준비 (iPhone 6.7", 5.5" / Android phone, tablet)
- [ ] 앱 설명 (한국어) 준비
- [ ] 연령 등급 설정

### 제출 후

- [ ] TestFlight / Internal Testing 테스터 추가
- [ ] 푸시 알림 수신 테스트
- [ ] 로그인/회원가입 플로우 테스트
- [ ] 채팅 기능 테스트
