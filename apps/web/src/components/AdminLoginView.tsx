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
      <section className={styles.loginPanel}>
        <div className={styles.loginCard}>
          <div>
            <h1 className={styles.panelTitle}>관리자 로그인</h1>
          </div>

          <form className={styles.formGrid} onSubmit={handleSubmit}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>전화번호</span>
              <input
                className={styles.fieldInput}
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
              />
            </label>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>비밀번호</span>
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
              {isSubmitting ? "로그인 중" : "로그인"}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
