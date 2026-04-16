export const metadata = {
  title: "고객 지원 — 아가야",
};

export default function SupportPage() {
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
      <h1 style={{ fontSize: 24, marginBottom: 32 }}>고객 지원</h1>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>서비스 소개</h2>
        <p>
          아가야는 임산부와 가임기 사용자를 위한 AI 기반 건강 상담 서비스입니다.
          임신 주차에 맞는 맞춤 정보, 감정 기록, 건강 체크리스트를 제공합니다.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>문의하기</h2>
        <p>
          서비스 이용 중 문제가 발생하거나 건의 사항이 있으시면 아래로 연락해
          주세요.
        </p>
        <ul style={{ paddingLeft: 20, marginTop: 8, listStyle: "none" }}>
          <li>이메일: yllee@catholic.ac.kr</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>계정 삭제 요청 방법</h2>
        <ol style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>이메일 제목에 "아가야 계정 삭제 요청"을 적어 주세요.</li>
          <li>가입에 사용한 전화번호를 함께 보내 주세요.</li>
          <li>
            위 이메일로 보내 주시면 본인 확인 후 순차적으로 처리해 드립니다.
          </li>
        </ol>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>
          삭제되는 데이터와 보관 정보
        </h2>
        <ul style={{ paddingLeft: 20, marginTop: 8 }}>
          <li>삭제되는 데이터: 전화번호 등 계정 식별 정보</li>
          <li>삭제되는 데이터: 임신 관련 프로필 정보</li>
          <li>삭제되는 데이터: 상담 대화 및 저장 기록</li>
          <li>삭제되는 데이터: 푸시 알림 토큰</li>
          <li>
            보관 정보: 관련 법령에 따라 보관이 필요한 정보만 법정 보관 기간 동안
            분리 보관한 뒤 삭제합니다.
          </li>
          <li>그 외 정보는 계정 삭제 처리 후 즉시 삭제합니다.</li>
        </ul>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>자주 묻는 질문</h2>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600 }}>인증번호가 오지 않아요.</p>
          <p style={{ color: "#666" }}>
            전화번호를 다시 확인해 주세요. 잠시 후 다시 시도하시면 됩니다.
            문제가 지속되면 위 이메일로 문의해 주세요.
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600 }}>계정을 삭제하고 싶어요.</p>
          <p style={{ color: "#666" }}>
            이메일로 회원 탈퇴를 요청해 주시면 확인 후 처리해 드립니다.
          </p>
        </div>

        <div style={{ marginBottom: 16 }}>
          <p style={{ fontWeight: 600 }}>앱이 정상적으로 동작하지 않아요.</p>
          <p style={{ color: "#666" }}>
            앱을 최신 버전으로 업데이트해 주세요. 문제가 지속되면 이메일로
            문의해 주세요.
          </p>
        </div>
      </section>
    </main>
  );
}
