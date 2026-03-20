# Expo Push Notifications Setup Guide

임신 상담 앱을 위한 Expo Push Notification 인증서 설정 가이드입니다.

## Prerequisites

- **Expo Account**: [expo.dev](https://expo.dev) 가입 및 로그인
- **iOS**: Apple Developer Program 멤버십 ($99/year)
- **Android**: Firebase 프로젝트 (무료)

---

## 1. iOS - APNs 인증서 생성

### 1.1 Apple Developer Portal에서 APNs Key 생성

1. [Apple Developer](https://developer.apple.com/account) 접속 → Certificates, Identifiers & Profiles
2. **Keys** 섹션 선택
3. **+** 버튼 클릭 → "Create a new key"
4. **Key Name**: 예) "Pregnancy App Push"
5. **Capabilities**: "Apple Push Notifications service (APNs)" 체크
6. **Register** → **Download** (.p8 파일)
   - ⚠️ **중요**: .p8 파일은 한 번만 다운로드 가능. 안전한 곳에 보관
7. **Key ID**와 **Team ID** (Account 페이지) 메모

### 1.2 Expo에 업로드

**CLI 사용:**
```bash
cd apps/mobile
eas credentials
```

- 프로젝트 선택 → iOS
- "Push Notifications" 선택
- "Upload Apple Push Notifications Key"
- .p8 파일, Key ID, Team ID 입력

**또는 대시보드:**
1. [Expo Dashboard](https://expo.dev) → 프로젝트 선택
2. **Credentials** → **iOS** → **Push Notifications**
3. **Upload APNs Key** → 파일 및 정보 입력

---

## 2. Android - FCM 설정

### 2.1 Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com) 접속
2. **Create a new project** → 프로젝트명 입력 (예: "pregnancy-app")
3. Google Analytics 필요시 활성화 → **Create project**

### 2.2 Android 앱 추가

1. Firebase 프로젝트 대시보드 → **+** (앱 추가)
2. **Android** 선택
3. **Package name**: `com.gynecology.chatbot` (app.json의 android.package)
4. 앱 등록 → **google-services.json** 다운로드
5. `apps/mobile/` 디렉토리에 **google-services.json** 배치

### 2.3 FCM Server Key 획득

1. Firebase 프로젝트 → **⚙️ 설정** → **Project Settings**
2. **Cloud Messaging** 탭
3. **Server Key** 복사

### 2.4 Expo에 업로드

**CLI 사용:**
```bash
cd apps/mobile
eas credentials
```

- 프로젝트 선택 → Android
- "Push Notifications" 선택
- "Upload FCM Server Key"
- Server Key 붙여넣기

**또는 대시보드:**
1. [Expo Dashboard](https://expo.dev) → 프로젝트 선택
2. **Credentials** → **Android** → **Push Notifications**
3. **Upload FCM Server Key** → 키 입력

---

## 3. 프로젝트 설정 확인

### 3.1 app.json 검증

`apps/mobile/app.json`에 다음이 포함되어 있는지 확인:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "color": "#d76c57"
        }
      ]
    ]
  }
}
```

### 3.2 EAS 설정 (필요시)

EAS Build를 처음 사용하는 경우:

```bash
cd apps/mobile
eas build:configure
```

`projectId`가 app.json에 자동 추가됩니다.

---

## 4. 테스트

### 4.1 개발 클라이언트 빌드

```bash
cd apps/mobile
eas build --profile development --platform ios
# 또는 Android의 경우
eas build --profile development --platform android
```

### 4.2 테스트 기기

- **iOS/Android 시뮬레이터**: Push tokens 미지원
- **물리 기기 필수**: 실제 iOS/Android 디바이스에서만 테스트 가능

### 4.3 Expo Notification 도구

1. [Expo Push Tool](https://expo.dev/notifications)
2. 프로젝트 선택 → 디바이스에서 얻은 push token 입력
3. Test message 전송 → 기기에서 수신 확인

---

## 5. 앱 코드에서 Push Token 등록

앱 로그인 후 push token을 등록하여 `pregnancy_profiles` 테이블에 저장합니다.

**예시 (Expo Notifications):**
```javascript
import * as Notifications from 'expo-notifications';

// 현재 push token 가져오기
const { data } = await Notifications.getLastNotificationResponseAsync();
const token = (await Notifications.getExpoPushTokenAsync()).data;

// Supabase에 저장
await supabase
  .from('pregnancy_profiles')
  .update({ push_token: token })
  .eq('id', userId);
```

---

## 6. Production Checklist

- [ ] APNs key (.p8) Expo에 업로드 완료
- [ ] FCM Server Key Expo에 업로드 완료
- [ ] google-services.json을 `apps/mobile/`에 배치
- [ ] app.json의 `expo-notifications` 플러그인 설정 확인
- [ ] 물리 기기에서 개발 빌드 테스트 완료
- [ ] Push token이 `pregnancy_profiles.push_token`에 저장되는지 확인
- [ ] Production 빌드 배포 전 최종 테스트

---

## 트러블슈팅

### 문제: "Invalid APNs key"
- .p8 파일이 올바른지 확인
- Key ID와 Team ID가 정확한지 확인
- Expo에 올바른 버전의 키가 업로드되었는지 확인

### 문제: "FCM Server Key 거부됨"
- Firebase 프로젝트의 Server Key (Cloud Messaging 탭)인지 확인
- API Key가 아닌 Server Key 사용

### 문제: 시뮬레이터에서 토큰 미수신
- 정상 동작. 물리 기기 필수

### 문제: Token 등록 실패
- 로그인 상태 확인
- Supabase RLS 정책 확인
- `pregnancy_profiles` 테이블의 `push_token` 컬럼 존재 여부 확인

---

## 참고 링크

- [Expo Notifications Docs](https://docs.expo.dev/guides/using-notifications/)
- [Apple APNs Key Setup](https://developer.apple.com/documentation/usernotifications/setting_up_a_remote_notification_server)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
