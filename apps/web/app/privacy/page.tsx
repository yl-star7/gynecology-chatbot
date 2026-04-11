export const metadata = {
  title: "개인정보 처리방침 — 아가야",
};

export default function PrivacyPolicyPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "sans-serif",
        lineHeight: 1.8,
        color: "#333",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 32 }}>개인정보 처리방침</h1>

      <p style={{ marginBottom: 16, color: "#666" }}>시행일: 2026년 4월 11일</p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          1. 수집하는 개인정보 항목
        </h2>
        <p>본 서비스는 다음과 같은 개인정보를 수집합니다.</p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>전화번호 (본인 인증 및 로그인 목적)</li>
          <li>
            임신 관련 정보 (출산 예정일, 임신 주차 — 맞춤 콘텐츠 제공 목적)
          </li>
          <li>상담 대화 내용 (서비스 제공 및 기록 보관 목적)</li>
          <li>기기 푸시 토큰 (알림 발송 목적)</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          2. 개인정보의 수집 및 이용 목적
        </h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>회원 식별 및 본인 인증</li>
          <li>임신 주차에 맞는 맞춤 건강 정보 제공</li>
          <li>AI 기반 상담 서비스 제공</li>
          <li>서비스 이용 통계 및 품질 개선</li>
          <li>푸시 알림 발송</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          3. 개인정보의 보유 및 이용 기간
        </h2>
        <p>
          이용자의 개인정보는 서비스 이용 기간 동안 보유하며, 회원 탈퇴 시 즉시
          파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안
          보관합니다.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          4. 개인정보의 제3자 제공
        </h2>
        <p>
          본 서비스는 이용자의 개인정보를 원칙적으로 제3자에게 제공하지
          않습니다. 다만, 법령에 의해 요구되는 경우에는 예외로 합니다.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          5. 개인정보의 안전성 확보 조치
        </h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>전화번호는 암호화하여 저장합니다.</li>
          <li>인증번호는 해시 처리 후 비교하며, 원문을 저장하지 않습니다.</li>
          <li>모든 통신은 HTTPS(TLS)를 통해 암호화됩니다.</li>
          <li>접근 권한을 최소화하여 관리합니다.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>6. 이용자의 권리</h2>
        <p>
          이용자는 언제든지 자신의 개인정보에 대해 다음 권리를 행사할 수
          있습니다.
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>개인정보 열람 요청</li>
          <li>개인정보 정정 및 삭제 요청</li>
          <li>개인정보 처리 정지 요청</li>
          <li>회원 탈퇴</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          7. 개인정보 보호 책임자
        </h2>
        <p>이메일: yllee@catholic.ac.kr</p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>8. 변경 사항 고지</h2>
        <p>
          본 개인정보 처리방침이 변경되는 경우, 앱 내 공지 또는 본 페이지를 통해
          안내합니다.
        </p>
      </section>
    </main>
  );
}
