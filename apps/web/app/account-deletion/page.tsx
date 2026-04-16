export const metadata = {
  title: "계정 삭제 안내 — 아가야",
};

export default function AccountDeletionPage() {
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
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>아가야 계정 삭제 안내</h1>
      <p style={{ marginBottom: 32, color: "#666" }}>
        아가야 앱 계정 삭제를 원하시면 아래 절차에 따라 요청해 주세요.
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>삭제 요청 방법</h2>
        <ol style={{ paddingLeft: 20 }}>
          <li>
            이메일 제목에 &quot;아가야 계정 삭제 요청&quot;을 적어 주세요.
          </li>
          <li>가입에 사용한 전화번호를 함께 보내 주세요.</li>
          <li>
            아래 이메일로 보내 주시면 본인 확인 후 계정 삭제를 진행해 드립니다.
          </li>
        </ol>
        <p style={{ marginTop: 12 }}>
          문의 이메일: <strong>yllee@catholic.ac.kr</strong>
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>삭제되는 데이터</h2>
        <ul style={{ paddingLeft: 20 }}>
          <li>전화번호 등 계정 식별 정보</li>
          <li>임신 관련 프로필 정보</li>
          <li>상담 대화 및 저장 기록</li>
          <li>푸시 알림 토큰</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>보관되는 데이터</h2>
        <p>
          관련 법령에 따라 보관이 필요한 정보가 있는 경우에는 해당 법정 보관
          기간 동안만 분리 보관한 뒤 삭제합니다. 법령상 보관 의무가 없는 정보는
          계정 삭제 처리 후 즉시 삭제합니다.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>처리 안내</h2>
        <p>
          계정 삭제 요청이 접수되면 확인 후 순차적으로 처리해 드립니다. 추가
          확인이 필요한 경우 이메일로 안내해 드립니다.
        </p>
      </section>
    </main>
  );
}
