"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import styles from "./admin/AdminConsoleLayout.module.css";

export default function AdminLoginView() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phoneNumber, password }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? "관리자 로그인에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className={styles.loginRoot}>
      <section className={styles.loginInfo}>
        <div>
          <p className={styles.loginEyebrow}>IBM Carbon Admin</p>
          <h1 className={styles.loginHeading}>운영 콘솔 인증</h1>
          <p className={styles.loginCopy}>
            권한이 확인된 운영 계정만 접근할 수 있습니다.
          </p>
        </div>

        <div className={styles.loginChecklist}>
          <div className={styles.checkRow}>
            <strong>권한 기반 진입</strong>
            <span className={styles.loginCopy}>
              신규 가입이 아니라 운영자 인증을 통과한 계정만 진입합니다.
            </span>
          </div>
          <div className={styles.checkRow}>
            <strong>조치 큐 우선</strong>
            <span className={styles.loginCopy}>
              계정 조치와 감사 로그를 첫 화면에서 바로 확인합니다.
            </span>
          </div>
          <div className={styles.checkRow}>
            <strong>Carbon 정보 밀도</strong>
            <span className={styles.loginCopy}>
              둥근 카드 대신 얇은 경계선과 표 밀도로 운영 콘솔 톤을 맞춥니다.
            </span>
          </div>
        </div>
      </section>

      <section className={styles.loginPanel}>
        <div className={styles.loginCard}>
          <div>
            <p className={styles.eyebrow}>Operator Access</p>
            <h2 className={styles.panelTitle}>권한 확인</h2>
            <p className={styles.panelDescription}>
              인증 후 관리자 콘솔로 바로 이동합니다.
            </p>
          </div>

          <form className={styles.formGrid} onSubmit={handleSubmit}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>운영 계정 전화번호</span>
              <input
                className={styles.fieldInput}
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
            </label>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>운영 비밀번호</span>
              <input
                className={styles.fieldInput}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            {error ? <p className={styles.formHint}>{error}</p> : null}
            <button
              className={styles.primaryButton}
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "권한 확인 중" : "권한 확인"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
