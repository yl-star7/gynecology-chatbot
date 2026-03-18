# 연구용 계정/배포 셋업 가이드

> 최종 확인: 2026-03-18  
> 범위: `Twilio Verify`, `Google Play Console`, `Apple Developer / TestFlight`

## 1. 목적

이 문서는 연구용 프로토타입을 기준으로, 실제 공개 배포 없이도 필요한 계정과 테스트 배포를 최소 비용과 최소 절차로 정리한 가이드다.

핵심 질문은 아래 3가지다.

- `Twilio`에서 전화번호 인증을 어디까지 trial로 처리할 수 있는가
- `Google Play`에서 공개 출시 없이 어떻게 테스트 배포할 것인가
- `Apple`에서 꼭 `Apple Developer Program`까지 가입해야 하는가

## 2. 결론 요약

현재 가정:

- 연구 대상자는 `최대 100명`
- 실제 공개 출시가 아니라 `연구 참여자 대상 배포`
- 대면 세팅이 일부 가능하지만, 전원 수기 설치를 전제로 하기는 어려움

이 조건이면 아래 경로가 가장 현실적이다.

- `Twilio`: 우선 `trial + Verify Service`로 시작한다.
- `Android`: `Google Play Internal testing`만 사용한다.
- `iPhone`: `Apple Developer Program + TestFlight`를 기본 경로로 본다.
- `무료 Apple Account + Xcode Personal Team` 직접 설치는 소수 현장 파일럿에만 한정한다.

즉, 연구용 최소 경로는 다음과 같다.

| 영역 | 추천 경로 | 비용 | 공개 배포 필요 |
| --- | --- | --- | --- |
| 전화번호 인증 | Twilio Verify trial | 초기 0원 가능 | 없음 |
| Android 테스트 | Play Console Internal testing | 등록비 1회 | 없음 |
| iPhone 테스트 | Apple Developer + TestFlight | 연 $99 | App Store 공개는 불필요 |
| iPhone 소수 현장 설치 | 무료 Apple Account + Xcode Personal Team | 0원 | 없음 |

## 3. 100명 연구 기준으로 안 해도 되는 것

- `Google Play` 공개 출시
- `Apple App Store` 실제 심사 제출
- `Twilio`용 일반 발신 번호 구매
- `Google Play open testing`

단, 아래 상황이 오면 경로가 바뀐다.

- 연구 참여자가 자주 바뀌고 `Twilio` 인증 대상 번호가 계속 늘어남
- iPhone 참여자를 `App Store Connect` 내부 사용자로 관리할 수 없음
- 연구 참여자에게 원격으로 설치 링크를 보내야 함

주의:

- `Apple TestFlight internal testing`은 최대 `100명`이지만, 내부 테스터는 `App Store Connect` 사용자여야 한다.
- 실제 연구 참여자 100명을 대상으로 할 때는 보통 `TestFlight external testing`이 더 현실적이다.
- 즉, `Apple Developer Program`은 사실상 필요하고, 경우에 따라 `Beta App Review`까지 감안해야 한다.

## 4. 서비스별 권장 전략

### 4.1 Twilio Verify

연구용 초기 단계에서는 `Twilio Verify trial`로 시작할 수 있다.

- Twilio 가입 시 본인 휴대폰 번호 인증이 필요하다.
- `Verify`는 일반 SMS 발신처럼 Twilio 번호를 따로 구매하지 않아도 된다.
- 대신 `trial` 계정은 OTP를 보내려는 `non-Twilio phone number`를 미리 검증해야 한다.
- 즉, 연구 참여자 번호가 소수이거나 고정이면 `trial`로 버틸 수 있다.
- 하지만 `최대 100명` 규모에서 참여자 번호가 수시로 바뀌면 `trial`은 운영이 금방 번거로워진다.
- 이 규모에서는 `trial로 시작`은 가능하지만, 실제 모집이 시작되면 유료 전환 가능성을 미리 열어두는 게 맞다.

실무 판단:

- `고정된 1~5명 내외 테스트`: `trial` 유지
- `최대 100명 모집이 예정됨`: 초기에만 `trial`, 본운영 전 유료 전환 검토
- `실험자가 현장에서 직접 번호 입력`: trial로도 시작 가능하지만 번호 추가 절차가 번거롭다

### 4.2 Google Play Console

연구용 Android 배포는 `Internal testing`이 정답에 가깝다.

- 최대 `100명`까지 내부 테스터를 이메일로 관리할 수 있다.
- 새 `AAB`를 올리면 보통 `몇 분 내` 테스터에게 배포된다.
- 앱 설정이 아직 완전히 끝나지 않아도 내부 테스트를 시작할 수 있다.
- 내부 테스트는 일반적인 공개 정책/보안 리뷰를 덜 타고, 공개 스토어 노출도 없다.
- `100명 이하` 연구 참여자 관리와도 규모가 잘 맞는다.

주의할 점:

- Play Console 계정 생성에는 `US$25` 1회 등록비가 든다.
- 신규 `personal` 계정은 향후 공개 배포 시 추가 테스트 요건과 Android 기기 확인 요건이 붙을 수 있다.
- 하지만 연구용으로 `internal testing`만 쓰는 단계에서는 공개 출시까지 갈 필요가 없다.

권장 계정 타입:

- 특별한 법인 명의 요구가 없으면 `Personal`
- 연구 계약상 기관/법인 명의가 필요할 때만 `Organization`

### 4.3 Apple

Apple은 `100명 연구` 기준으로 보면 사실상 우선순위가 갈린다.

- 기본 추천: `Apple Developer Program + TestFlight`
- 예외적 대안: `무료 Apple Account + Xcode Personal Team`

#### 옵션 A. 무료 Apple Account + Xcode Personal Team

소수 인원 현장 테스트면 이게 가장 가볍다.

- 무료 Apple Account만으로도 온디바이스 테스트가 가능하다.
- 다만 `Personal Team`은 제약이 크다.
- App ID는 최대 `10개`, 테스트 기기는 플랫폼별 `3대`, 프로비저닝은 `7일` 단위로 만료된다.
- 따라서 장기 운영에는 불편하고, `최대 100명` 연구 배포 경로로는 사실상 부적합하다.

추천 상황:

- 현장에서 직접 설치 가능
- 테스트 기기 수가 매우 적음
- 사전 파일럿이나 1차 리허설만 필요함

#### 옵션 B. Apple Developer Program + TestFlight

`최대 100명` 연구 참여자를 상대하려면 이 경로가 사실상 기본이다.

- 연 `99 USD`
- `TestFlight` 내부 테스터는 최대 `100명`
- `TestFlight` 외부 테스터는 최대 `10,000명`
- 외부 테스터를 쓰면 첫 빌드는 `Beta App Review` 성격의 검토가 필요할 수 있다
- 내부 테스터는 `App Store Connect` 사용자여야 한다

실무 판단:

- 연구 참여자가 실제 피험자/대상자라면 보통 `internal`보다 `external`이 맞다.
- 이유는 참여자 100명을 `App Store Connect` 사용자로 관리하는 건 운영상 비현실적이기 때문이다.
- 따라서 `iPhone 최대 100명 연구`는 사실상 `Apple Developer Program + TestFlight external`까지 염두에 둬야 한다.

추가로, 개인 계정으로 가입해도 `App Store Connect`에는 최대 `50명`의 추가 사용자를 초대할 수 있다.  
즉, 계정 주인이 가입만 끝내면 이후 운영자/개발자를 별도로 초대해서 같이 관리할 수 있다.

권장 판단:

- `현장 설치만 하면 됨`: 무료 Apple Account
- `원격 테스터 초대 필요`: Apple Developer + TestFlight
- `외부 일반 사용자 링크 배포 필요`: Apple Developer + TestFlight external

## 5. 대면으로 같이 해야 하는 것

아래는 거의 모두 `계정 주인 본인 인증`이 필요한 단계라서 대면 때 같이 하는 게 맞다.

### 5.1 공통

- 영구적으로 쓸 이메일/계정 로그인
- `2FA / OTP` 수신
- 정부 발급 신분증 확인이 필요한 경우 촬영/제출
- 결제 카드 입력
- 공개될 연락처와 비공개 운영 연락처 구분 결정

### 5.2 Twilio

- Twilio 계정 생성
- 본인 휴대폰 번호 인증
- Twilio Console 접속
- Verify Service 생성
- 연구에서 실제로 쓸 테스트 번호 목록 확인

대면 권장 이유:

- 본인 문자 수신이 필요함
- trial 제한 때문에 어떤 번호를 먼저 검증할지 바로 정해야 함

### 5.3 Google Play

- Google 계정 로그인
- Play Console 등록
- `US$25` 결제
- `Personal` vs `Organization` 결정
- 필요 시 신분증/법인 정보 제출
- 필요 시 Android 기기 접근 확인

대면 권장 이유:

- 계정 유형을 잘못 고르면 나중에 귀찮아진다
- 본인 명의 확인과 결제가 들어간다
- 공개 개발자 프로필에 어떤 연락처를 둘지 그 자리에서 정하는 게 안전하다

### 5.4 Apple

- Apple Account 로그인
- `2FA` 통과
- `Apple Developer Program` 가입 여부 결정
- 유료 가입 시 `Apple Developer app` 또는 웹에서 본인 확인
- 결제
- 필요 시 App Store Connect 사용자 초대

대면 권장 이유:

- Apple은 계정 본인 확인 흐름이 상대적으로 민감하다
- 무료 계정으로 갈지, 바로 유료로 갈지 현장에서 목적에 맞게 결정하는 게 빠르다

## 6. 내가 미리 해둘 수 있는 것

계정 주인 인증이 필요 없는 작업은 미리 진행 가능하다.

- Twilio Verify 연동 코드/환경 변수 구조 정리
- Google Play 내부 테스트용 `applicationId`, 앱 이름, 아이콘, 테스트용 설명 정리
- Android `AAB` / iOS `IPA` 또는 Xcode 설치 흐름 준비
- App Store Connect / Play Console에서 나를 초대할 때 필요한 권한 목록 정리
- 테스터 이메일 목록 CSV 준비
- 현장 세팅 체크리스트와 순서표 준비

## 7. 대면 전 준비물

아래는 미리 준비해두면 당일 시간이 짧아진다.

- 주 계정으로 쓸 `Google Account`
- 주 계정으로 쓸 `Apple Account`
- 본인 명의 결제 카드
- 본인 휴대폰
- `Apple Developer app` 설치된 iPhone 또는 iPad
- Android 기기 1대
- 테스트용 iPhone 1~3대
- 테스터 이메일 목록
- 공개 가능한 지원용 이메일 주소
- 필요하면 연구 전용 전화번호

## 8. 30~60분 대면 세팅 추천 순서

### 빠른 최소 세팅

1. `Twilio` 계정 생성 후 본인 번호 인증
2. `Twilio Verify Service` 생성
3. `Google Play Console` 가입 및 결제
4. `Play Internal testing` 트랙 생성
5. Android 테스트 계정 이메일 추가
6. iPhone은 소수 파일럿만 `무료 Apple Account + Xcode Personal Team`으로 직접 설치

이 경로는 `사전 리허설`에는 맞지만 `100명 운영` 기준 최종 경로는 아니다.

### 100명 연구 운영 기준 세팅

1. `Twilio` 계정 생성 및 trial 번호 정책 확인
2. `Google Play Console` 가입, 내부 테스트 트랙 준비
3. `Apple Developer Program` 가입
4. `App Store Connect` 사용자 초대
5. `TestFlight` 빌드 업로드
6. 연구 참여자 배포 방식에 맞춰 `internal` 또는 `external` 그룹 준비
7. 실제 참여자 대상이면 `external testing` 기준으로 운영

## 9. 권장 의사결정

현재 조건이 `연구용`, `실 배포 불필요`, `대면 세팅 가능`, `최대 100명`이라면 아래 조합을 추천한다.

- `Twilio`: trial로 시작하되, 참여자 모집 시작 전에 유료 전환 가능성 검토
- `Android`: Play Console Internal testing
- `iPhone`: Apple Developer Program + TestFlight
- `Apple 무료 계정 직접 설치`: 사전 파일럿 또는 당일 리허설 전용

즉, `100명 규모`에서는 Apple도 초기에 가입하는 쪽이 현실적이다.  
Android만 스토어형 테스트로 가고 iPhone만 무료 직접 설치로 버티는 방식은 운영 피로도가 너무 크다.

## 10. 운영 메모

- Google Play는 계정 주인이 만든 뒤 `Admin`을 초대할 수 있고, 초대받는 사용자는 등록비를 다시 낼 필요가 없다.
- Apple도 계정 주인이 가입한 뒤 `Users and Access`에서 운영자를 초대할 수 있다.
- Twilio는 연구 참여자 번호가 계속 바뀌면 trial 운영 피로도가 높아진다.
- Apple 무료 계정은 `7일` 주기 재설치 이슈가 있어서 `100명` 연구 운영에는 부적합하다.
- 사람 대상 연구라도 스토어 정책 자체가 면제되는 것은 아니다.

## 11. 공식 참고 링크

### Twilio

- [Verifications | Twilio](https://www.twilio.com/docs/verify/api/verification)
- [Verify Go Quickstart | Twilio](https://www.twilio.com/docs/verify/quickstarts/go)

### Google Play

- [Get started with Play Console](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en)
- [Required information to create a Play Console developer account](https://support.google.com/googleplay/android-developer/answer/13628312?hl=en-IN)
- [Set up an open, closed, or internal test](https://support.google.com/googleplay/android-developer/answer/9845334?hl=en)
- [Add developer account users and manage permissions](https://support.google.com/googleplay/android-developer/answer/9844686?hl=en-GB)

### Apple

- [Choosing a Membership](https://developer.apple.com/support/compare-memberships/)
- [TestFlight overview](https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/)
- [Add internal testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers)
- [Invite external testers](https://developer.apple.com/help/app-store-connect/test-a-beta-version/invite-external-testers)
- [Add and edit users](https://developer.apple.com/help/app-store-connect/manage-your-team/add-and-edit-users)
