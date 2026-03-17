"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <p className="eyebrow">Admin Login</p>
        <h1>관리자 콘솔 로그인</h1>
        <p className="login-copy">관리자 또는 슈퍼 관리자 계정만 접근할 수 있습니다.</p>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="field-label">
            <span>전화번호</span>
            <input className="field-input" value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} />
          </label>
          <label className="field-label">
            <span>비밀번호</span>
            <input className="field-input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <p className="inline-feedback">{error}</p> : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "로그인 중" : "로그인"}
          </button>
        </form>
      </section>
    </main>
  );
}
