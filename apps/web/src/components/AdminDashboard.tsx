"use client";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";
import { useMemo, useState } from "react";

interface AdminDashboardProps {
  dashboard: AdminDashboardData;
  adminDisplayName: string;
}

export default function AdminDashboard({ dashboard, adminDisplayName }: AdminDashboardProps) {
  const [managedUsers, setManagedUsers] = useState(dashboard.managedUsers);
  const [focusedUserId, setFocusedUserId] = useState(dashboard.historyUsers[0]?.id ?? dashboard.managedUsers[0]?.id ?? "");
  const [selectedUserId, setSelectedUserId] = useState(dashboard.managedUsers[0]?.id ?? "");
  const [phoneNumber, setPhoneNumber] = useState(dashboard.managedUsers[0]?.phoneNumber ?? "");
  const [reason, setReason] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ragDocuments, setRagDocuments] = useState(dashboard.ragDocuments);
  const [ragTitle, setRagTitle] = useState("");
  const [ragCategory, setRagCategory] = useState("");
  const [ragWeek, setRagWeek] = useState("");
  const [ragContent, setRagContent] = useState("");

  const focusedHistoryUser = useMemo(
    () => dashboard.historyUsers.find((user) => user.id === focusedUserId) ?? dashboard.historyUsers[0],
    [dashboard.historyUsers, focusedUserId],
  );

  function syncSelectedUser(userId: string) {
    setSelectedUserId(userId);
    const nextUser = managedUsers.find((user) => user.id === userId);
    setPhoneNumber(nextUser?.phoneNumber ?? "");
  }

  async function handleUpdatePhoneNumber() {
    setIsSubmitting(true);
    setActionMessage(null);

    const response = await fetch("/api/admin/users/update-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId, phoneNumber, reason }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setActionMessage(payload.error ?? "전화번호 변경에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    setManagedUsers((current) =>
      current.map((user) => (user.id === selectedUserId ? { ...user, phoneNumber, latestIssue: "전화번호 변경 완료" } : user)),
    );
    setReason("");
    setActionMessage("전화번호를 변경했습니다.");
    setIsSubmitting(false);
  }

  async function handleResetPassword() {
    setIsSubmitting(true);
    setActionMessage(null);

    const response = await fetch("/api/admin/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId, reason: reason || "운영자 수동 초기화" }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setActionMessage(payload.error ?? "비밀번호 초기화에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    setManagedUsers((current) =>
      current.map((user) => (user.id === selectedUserId ? { ...user, latestIssue: "비밀번호 초기화 요청 처리" } : user)),
    );
    setReason("");
    setActionMessage("비밀번호 초기화 요청을 처리했습니다.");
    setIsSubmitting(false);
  }

  async function handleUploadRagDocument() {
    setIsSubmitting(true);
    setActionMessage(null);

    const response = await fetch("/api/admin/rag/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: ragTitle,
        category: ragCategory,
        pregnancyWeek: ragWeek ? Number(ragWeek) : null,
        content: ragContent,
      }),
    });

    const payload = (await response.json()) as { error?: string; id?: string | null };
    if (!response.ok) {
      setActionMessage(payload.error ?? "RAG 문서 업로드에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    setRagDocuments((current) => [
      {
        id: payload.id ?? `rag-${Date.now()}`,
        title: ragTitle,
        pregnancyWeekLabel: ragWeek ? `${ragWeek}주차` : "공통",
        category: ragCategory,
        chunkCount: 1,
        updatedAt: "방금 전",
        status: "ready",
      },
      ...current,
    ]);
    setRagTitle("");
    setRagCategory("");
    setRagWeek("");
    setRagContent("");
    setActionMessage("RAG 문서를 업로드했습니다.");
    setIsSubmitting(false);
  }

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <div className="brand-block">
          <p className="brand-kicker">Admin Console</p>
          <h1>부인과 상담 운영</h1>
          <p className="brand-copy">운영 대시보드, RAG 데이터 설정, 워크플로우 설정, 유저 히스토리 조회를 한 화면에 정리했습니다.</p>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active" type="button">Dashboard</button>
          <button className="nav-item" type="button">RAG Settings</button>
          <button className="nav-item" type="button">Workflow Settings</button>
          <button className="nav-item" type="button">User History</button>
        </nav>

        <div className="sidebar-card">
          <span className="eyebrow">Scope</span>
          <strong>관리자 전용</strong>
          <p>사용자 검색, 계정 복구, RAG 데이터 운영, AI 워크플로우 점검, 세션 히스토리 조회</p>
        </div>

        <div className="sidebar-stack">
          <span className="badge badge-success">Supabase First</span>
          <span className="badge badge-accent">DI Runtime</span>
          <span className="badge badge-neutral">Admin Web</span>
        </div>
      </aside>

      <section className="app-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h2>운영 현황</h2>
          </div>
          <div className="topbar-actions">
            <span className="badge badge-neutral">{adminDisplayName}</span>
            <button className="ghost-chip" type="button" onClick={handleLogout}>로그아웃</button>
          </div>
        </header>

        <section className="stats-grid">
          {dashboard.metrics.map((metric) => (
            <article key={metric.id} className="stat-card">
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
              <span>{metric.changeLabel}</span>
            </article>
          ))}
        </section>

        <section className="panel-grid panel-grid-two">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Users</p>
                <h2>계정 운영</h2>
              </div>
              <span className="badge badge-neutral">Recovery</span>
            </div>
            <div className="table-list">
              {managedUsers.map((user) => (
                <button key={user.id} className="table-row table-row-button" type="button" onClick={() => syncSelectedUser(user.id)}>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.phoneNumber}</span>
                  </div>
                  <div>
                    <span className={`badge ${user.status === "active" ? "badge-success" : "badge-warning"}`}>
                      {user.status}
                    </span>
                    <span>{user.latestIssue}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Actions</p>
                <h2>최근 계정 복구 작업</h2>
              </div>
              <span className="badge badge-accent">Audit</span>
            </div>
            <div className="table-list">
              {dashboard.recoveryActions.map((action) => (
                <div key={action.id} className="table-row">
                  <div>
                    <strong>{action.userName}</strong>
                    <span>{action.action}</span>
                  </div>
                  <div>
                    <span className={`badge ${action.status === "completed" ? "badge-success" : "badge-warning"}`}>
                      {action.status}
                    </span>
                    <span>{action.requestedAt}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="admin-form">
              <label className="field-label">
                <span>대상 사용자</span>
                <select value={selectedUserId} onChange={(event) => syncSelectedUser(event.target.value)} className="field-input">
                  {managedUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} · {user.phoneNumber}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field-label">
                <span>새 전화번호</span>
                <input value={phoneNumber} onChange={(event) => setPhoneNumber(event.target.value)} className="field-input" />
              </label>
              <label className="field-label">
                <span>사유</span>
                <textarea value={reason} onChange={(event) => setReason(event.target.value)} className="field-input field-textarea" />
              </label>
              <div className="action-row">
                <button className="primary-button" type="button" onClick={handleUpdatePhoneNumber} disabled={isSubmitting}>
                  전화번호 변경
                </button>
                <button className="ghost-chip" type="button" onClick={handleResetPassword} disabled={isSubmitting}>
                  비밀번호 초기화
                </button>
              </div>
              {actionMessage ? <p className="inline-feedback">{actionMessage}</p> : null}
            </div>
          </section>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">RAG Settings</p>
              <h2>임신 주차별 문서 운영</h2>
            </div>
            <span className="badge badge-success">pgvector</span>
          </div>
          <div className="profile-card profile-card-wide">
            <div className="profile-stack">
              <span>문서 수</span>
              <strong>{ragDocuments.length}</strong>
            </div>
            <div className="profile-stack">
              <span>Ready 문서</span>
              <strong>{ragDocuments.filter((document) => document.status === "ready").length}</strong>
            </div>
            <div className="profile-stack">
              <span>Draft 문서</span>
              <strong>{ragDocuments.filter((document) => document.status === "draft").length}</strong>
            </div>
            <div className="profile-stack">
              <span>최근 업데이트</span>
              <strong>{ragDocuments[0]?.updatedAt ?? "-"}</strong>
            </div>
          </div>
          <div className="admin-form">
            <label className="field-label">
              <span>문서 제목</span>
              <input className="field-input" value={ragTitle} onChange={(event) => setRagTitle(event.target.value)} />
            </label>
            <div className="action-row">
              <label className="field-label field-flex">
                <span>카테고리</span>
                <input className="field-input" value={ragCategory} onChange={(event) => setRagCategory(event.target.value)} />
              </label>
              <label className="field-label field-flex">
                <span>주차</span>
                <input className="field-input" inputMode="numeric" value={ragWeek} onChange={(event) => setRagWeek(event.target.value)} />
              </label>
            </div>
            <label className="field-label">
              <span>문서 내용</span>
              <textarea className="field-input field-textarea" value={ragContent} onChange={(event) => setRagContent(event.target.value)} />
            </label>
            <div className="action-row">
              <button className="primary-button" type="button" onClick={handleUploadRagDocument} disabled={isSubmitting}>
                RAG 문서 업로드
              </button>
            </div>
          </div>
          <div className="table-list">
            {ragDocuments.map((document) => (
              <div key={document.id} className="table-row">
                <div>
                  <strong>{document.title}</strong>
                  <span>{document.pregnancyWeekLabel} · {document.category}</span>
                </div>
                <div>
                  <span className={`badge ${document.status === "ready" ? "badge-success" : "badge-warning"}`}>
                    {document.status}
                  </span>
                  <span>{document.chunkCount} chunks · {document.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Workflow Settings</p>
              <h2>AI 응답 워크플로우</h2>
            </div>
            <span className="badge badge-accent">Routing</span>
          </div>
          <div className="table-list">
            {dashboard.workflowRules.map((rule) => (
              <div key={rule.id} className="table-row">
                <div>
                  <strong>{rule.name}</strong>
                  <span>{rule.trigger}</span>
                </div>
                <div>
                  <span className={`badge ${rule.status === "active" ? "badge-success" : "badge-warning"}`}>
                    {rule.status}
                  </span>
                  <span>{rule.retrievalScope} · {rule.modelName}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">User History</p>
              <h2>유저별 상담 히스토리 조회</h2>
            </div>
            <span className="badge badge-neutral">Sessions</span>
          </div>

          <div className="panel-grid panel-grid-history">
            <div className="table-list compact-list">
              {dashboard.historyUsers.map((user) => (
                <button key={user.id} className="table-row table-row-button" type="button" onClick={() => setFocusedUserId(user.id)}>
                  <div>
                    <strong>{user.name}</strong>
                    <span>{user.phoneNumber} · {user.pregnancyWeekLabel}</span>
                  </div>
                  <div>
                    <span className="badge badge-neutral">최근 세션</span>
                    <span>{user.latestSessionLabel}</span>
                  </div>
                </button>
              ))}
            </div>

            {focusedHistoryUser ? (
              <div className="history-detail">
                <div className="profile-card profile-card-wide">
                  <div className="profile-stack">
                    <span>선택 사용자</span>
                    <strong>{focusedHistoryUser.name}</strong>
                  </div>
                  <div className="profile-stack">
                    <span>전화번호</span>
                    <strong>{focusedHistoryUser.phoneNumber}</strong>
                  </div>
                  <div className="profile-stack">
                    <span>임신 주차</span>
                    <strong>{focusedHistoryUser.pregnancyWeekLabel}</strong>
                  </div>
                  <div className="profile-stack">
                    <span>최근 상담</span>
                    <strong>{focusedHistoryUser.latestSessionLabel}</strong>
                  </div>
                </div>

                <div className="panel-grid panel-grid-two">
                  {focusedHistoryUser.sessions.map((session) => (
                    <section key={session.id} className="panel inset-panel">
                      <div className="panel-header">
                        <div>
                          <p className="eyebrow">Session</p>
                          <h2>{session.title}</h2>
                        </div>
                        <span className="badge badge-accent">{session.pregnancyWeekLabel}</span>
                      </div>
                      <div className="table-list compact-list">
                        {session.messages.map((message) => (
                          <div key={message.id} className="table-row">
                            <div>
                              <strong>{message.role}</strong>
                              <span>{message.summary}</span>
                            </div>
                            <div>
                              <span className={`badge ${message.role === "assistant" ? "badge-success" : "badge-neutral"}`}>
                                {message.role}
                              </span>
                              <span>{message.createdAtLabel}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
