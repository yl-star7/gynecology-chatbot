"use client";

import { useEffect, useState } from "react";

import styles from "./AdminConsoleLayout.module.css";

interface ScheduleData {
  dailyCheckEnabled: boolean;
  dailyCheckTime: string;
  weeklyMilestoneEnabled: boolean;
  weeklyMilestoneTime: string;
  weeklyMilestoneDay: number;
  checkupReminderEnabled: boolean;
  checkupReminderTime: string;
}

interface BrandingData {
  mascotBucketId: string | null;
  mascotObjectPath: string | null;
  mascotSourceFileName: string | null;
  mascotAltText: string | null;
  surveyFormUrl: string | null;
}

interface SchiftCollection {
  id: string;
  name: string;
  vector_count: number;
  model: string;
  dimension: number;
}

interface SchiftWorkflow {
  id: string;
  name: string;
  description: string;
  status: string;
  block_count: number;
  updated_at: string;
}

interface SchiftStatus {
  collections: SchiftCollection[];
  workflows: SchiftWorkflow[];
}

interface SchiftRunResult {
  run: {
    run_id: string;
    status: string;
    outputs: Record<string, unknown>;
    error: string | null;
  };
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const DEFAULT_SCHEDULE: ScheduleData = {
  dailyCheckEnabled: false,
  dailyCheckTime: "09:00",
  weeklyMilestoneEnabled: false,
  weeklyMilestoneTime: "10:00",
  weeklyMilestoneDay: 1,
  checkupReminderEnabled: false,
  checkupReminderTime: "08:00",
};

const DEFAULT_BRANDING: BrandingData = {
  mascotBucketId: "pregnancy-content",
  mascotObjectPath: "assets/penguin-nurse/expressions/happy.png",
  mascotSourceFileName: "happy.png",
  mascotAltText: "펭귄 간호사",
  surveyFormUrl: null,
};

export function AdminOperationsPanel() {
  // Panel 1: Push notification
  const [pushLoading, setPushLoading] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Panel 2: RAG Provider
  const [ragProvider, setRagProvider] = useState<
    "schift" | "supabase" | "auto"
  >("auto");
  const [ragLoading, setRagLoading] = useState(true);
  const [ragSaving, setRagSaving] = useState(false);
  const [ragResult, setRagResult] = useState<string | null>(null);
  const [ragError, setRagError] = useState<string | null>(null);

  // Panel 4: Schedule
  const [schedule, setSchedule] = useState<ScheduleData>(DEFAULT_SCHEDULE);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingResult, setBrandingResult] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);

  // Panel 6: Schift RAG status
  const [schiftStatus, setSchiftStatus] = useState<SchiftStatus | null>(null);
  const [schiftLoading, setSchiftLoading] = useState(true);
  const [schiftError, setSchiftError] = useState<string | null>(null);
  const [schiftQuery, setSchiftQuery] = useState("");
  const [schiftRunning, setSchiftRunning] = useState(false);
  const [schiftRunResult, setSchiftRunResult] = useState<SchiftRunResult | null>(null);
  const [schiftRunError, setSchiftRunError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSchedule() {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const res = await fetch("/api/admin/schedule");
        if (!res.ok) {
          throw new Error(`서버 오류 (${res.status})`);
        }
        const data: ScheduleData = await res.json();
        if (!cancelled) {
          setSchedule(data);
        }
      } catch (err) {
        if (!cancelled) {
          setScheduleError(
            err instanceof Error
              ? err.message
              : "스케줄을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setScheduleLoading(false);
        }
      }
    }

    async function fetchRagProvider() {
      setRagLoading(true);
      try {
        const res = await fetch("/api/admin/rag-provider");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setRagProvider(data.ragProvider ?? "auto");
        }
      } catch {
      } finally {
        if (!cancelled) setRagLoading(false);
      }
    }

    async function fetchBranding() {
      setBrandingLoading(true);
      try {
        const res = await fetch("/api/admin/branding");
        if (res.ok) {
          const data: BrandingData = await res.json();
          if (!cancelled) setBranding(data);
        }
      } catch {
      } finally {
        if (!cancelled) setBrandingLoading(false);
      }
    }

    async function fetchSchiftStatus() {
      setSchiftLoading(true);
      setSchiftError(null);
      try {
        const res = await fetch("/api/admin/schift");
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        const data = await res.json();
        if (!cancelled) setSchiftStatus(data);
      } catch (err) {
        if (!cancelled) setSchiftError(err instanceof Error ? err.message : "Schift 상태를 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setSchiftLoading(false);
      }
    }

    void fetchRagProvider();
    void fetchSchedule();
    void fetchBranding();
    void fetchSchiftStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSendPush() {
    setPushLoading(true);
    setPushResult(null);
    setPushError(null);
    try {
      const res = await fetch("/api/admin/push/send", { method: "POST" });
      if (!res.ok) {
        throw new Error(`서버 오류 (${res.status})`);
      }
      const data: { count: number } = await res.json();
      setPushResult(`${data.count}명에게 발송 완료`);
    } catch (err) {
      setPushError(err instanceof Error ? err.message : "발송에 실패했습니다.");
    } finally {
      setPushLoading(false);
    }
  }

  async function handleSaveSchedule() {
    setScheduleSaving(true);
    setScheduleResult(null);
    setScheduleError(null);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      if (!res.ok) {
        throw new Error(`서버 오류 (${res.status})`);
      }
      setScheduleResult("스케줄이 저장되었습니다.");
    } catch (err) {
      setScheduleError(
        err instanceof Error ? err.message : "저장에 실패했습니다.",
      );
    } finally {
      setScheduleSaving(false);
    }
  }

  async function handleUploadMascot(file: File) {
    setBrandingSaving(true);
    setBrandingResult(null);
    setBrandingError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("bucketId", "branding-assets");
      formData.set("mediaScope", "week");
      formData.set("weekNumber", "0");

      const uploadRes = await fetch("/api/admin/content/media/upload", {
        method: "POST",
        body: formData,
      });
      const uploadPayload = (await uploadRes.json()) as {
        error?: string;
        bucketId?: string;
        objectPath?: string;
        sourceFileName?: string;
        signedUrl?: string;
        contentType?: string;
      };

      if (
        !uploadRes.ok ||
        !uploadPayload.bucketId ||
        !uploadPayload.objectPath ||
        !uploadPayload.signedUrl
      ) {
        throw new Error(
          uploadPayload.error ?? "마스코트 업로드에 실패했습니다.",
        );
      }

      const signedUploadResponse = await fetch(uploadPayload.signedUrl, {
        method: "PUT",
        headers: {
          "content-type": uploadPayload.contentType ?? file.type,
          "x-upsert": "true",
        },
        body: file,
      });

      if (!signedUploadResponse.ok) {
        throw new Error("signed URL 업로드에 실패했습니다.");
      }

      const nextBranding: BrandingData = {
        mascotBucketId: uploadPayload.bucketId,
        mascotObjectPath: uploadPayload.objectPath,
        mascotSourceFileName: uploadPayload.sourceFileName ?? file.name,
        mascotAltText: branding.mascotAltText ?? "마스코트",
        surveyFormUrl: branding.surveyFormUrl ?? null,
      };

      const saveRes = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextBranding),
      });
      const savePayload = (await saveRes.json()) as { error?: string };
      if (!saveRes.ok) {
        throw new Error(savePayload.error ?? "마스코트 저장에 실패했습니다.");
      }

      setBranding(nextBranding);
      setBrandingResult("FAB 마스코트를 저장했습니다.");
    } catch (error) {
      setBrandingError(
        error instanceof Error
          ? error.message
          : "FAB 마스코트 저장에 실패했습니다.",
      );
    } finally {
      setBrandingSaving(false);
    }
  }

  async function handleSaveSurveyFormUrl() {
    setBrandingSaving(true);
    setBrandingResult(null);
    setBrandingError(null);
    try {
      const saveRes = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...branding,
          surveyFormUrl: branding.surveyFormUrl?.trim() || null,
        }),
      });
      const savePayload = (await saveRes.json()) as { error?: string };
      if (!saveRes.ok) {
        throw new Error(savePayload.error ?? "설문 링크 저장에 실패했습니다.");
      }

      setBranding((current) => ({
        ...current,
        surveyFormUrl: current.surveyFormUrl?.trim() || null,
      }));
      setBrandingResult("설문 링크를 저장했습니다.");
    } catch (error) {
      setBrandingError(
        error instanceof Error
          ? error.message
          : "설문 링크 저장에 실패했습니다.",
      );
    } finally {
      setBrandingSaving(false);
    }
  }

  async function handleSchiftRun(workflowId: string) {
    if (!schiftQuery.trim()) return;
    setSchiftRunning(true);
    setSchiftRunResult(null);
    setSchiftRunError(null);
    try {
      const res = await fetch(`/api/admin/schift/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: schiftQuery }),
      });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data: SchiftRunResult = await res.json();
      setSchiftRunResult(data);
    } catch (err) {
      setSchiftRunError(err instanceof Error ? err.message : "워크플로우 실행에 실패했습니다.");
    } finally {
      setSchiftRunning(false);
    }
  }

  return (
    <div className={styles.panelGrid}>
      {/* Panel 1: Push/SMS notification */}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>알림 발송</h2>
          </div>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void handleSendPush()}
            disabled={pushLoading}
            aria-busy={pushLoading}
          >
            {pushLoading ? "발송 중..." : "알림 보내기"}
          </button>
        </div>

        {pushResult && (
          <p
            className={styles.opsPanelSuccess}
            role="status"
            aria-live="polite"
          >
            {pushResult}
          </p>
        )}
        {pushError && (
          <p className={styles.opsPanelError} role="alert">
            {pushError}
          </p>
        )}
      </section>

      {/* Panel 2: Schedule settings */}
      <section className={`${styles.panel} ${styles.opsPanelWide}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>알림 스케줄 설정</h2>
          </div>
        </div>

        {scheduleLoading && (
          <div
            className={styles.analyticsLoading}
            role="status"
            aria-live="polite"
          >
            스케줄을 불러오는 중...
          </div>
        )}

        {!scheduleLoading && (
          <div className={styles.opsScheduleRows}>
            {/* Row 1: Daily check */}
            <div className={styles.opsScheduleRow}>
              <label className={styles.opsToggleLabel}>
                <input
                  type="checkbox"
                  className={styles.opsToggle}
                  checked={schedule.dailyCheckEnabled}
                  onChange={(e) =>
                    setSchedule((prev) => ({
                      ...prev,
                      dailyCheckEnabled: e.target.checked,
                    }))
                  }
                />
                <span className={styles.fieldLabel}>매일 안부 체크</span>
              </label>
              <input
                type="time"
                className={`${styles.fieldInput} ${styles.opsTimeInput}`}
                value={schedule.dailyCheckTime}
                onChange={(e) =>
                  setSchedule((prev) => ({
                    ...prev,
                    dailyCheckTime: e.target.value,
                  }))
                }
                aria-label="매일 안부 체크 시각"
              />
            </div>
          </div>
        )}

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void handleSaveSchedule()}
            disabled={scheduleSaving || scheduleLoading}
            aria-busy={scheduleSaving}
          >
            {scheduleSaving ? "저장 중..." : "스케줄 저장"}
          </button>
        </div>

        {scheduleResult && (
          <p
            className={styles.opsPanelSuccess}
            role="status"
            aria-live="polite"
          >
            {scheduleResult}
          </p>
        )}
        {scheduleError && !scheduleLoading && (
          <p className={styles.opsPanelError} role="alert">
            {scheduleError}
          </p>
        )}
      </section>

      <section className={`${styles.panel} ${styles.opsPanelWide}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>FAB 마스코트</h2>
          </div>
        </div>

        {brandingLoading ? (
          <div
            className={styles.analyticsLoading}
            role="status"
            aria-live="polite"
          >
            마스코트 설정을 불러오는 중...
          </div>
        ) : (
          <div className={styles.opsScheduleRows}>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>설문 링크</span>
              <input
                className={styles.fieldInput}
                type="url"
                inputMode="url"
                placeholder="https://forms.gle/... 또는 https://docs.google.com/forms/..."
                value={branding.surveyFormUrl ?? ""}
                onChange={(event) =>
                  setBranding((current) => ({
                    ...current,
                    surveyFormUrl: event.target.value,
                  }))
                }
                aria-label="설문 링크"
              />
            </label>
            <div className={styles.actionRow}>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => void handleSaveSurveyFormUrl()}
                disabled={brandingSaving}
                aria-busy={brandingSaving}
              >
                {brandingSaving ? "저장 중..." : "설문 링크 저장"}
              </button>
            </div>
            <label className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>마스코트 업로드</span>
              <input
                className={styles.fieldInput}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void handleUploadMascot(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {branding.mascotObjectPath ? (
              <p className={styles.formHint}>
                현재 파일:{" "}
                {branding.mascotSourceFileName ?? branding.mascotObjectPath}
              </p>
            ) : (
              <p className={styles.formHint}>
                현재 설정된 FAB 마스코트가 없습니다.
              </p>
            )}
            <p className={styles.formHint}>
              마이페이지에서 설문 화면을 열 때 이 링크를 사용해요.
            </p>
          </div>
        )}

        {brandingResult && (
          <p
            className={styles.opsPanelSuccess}
            role="status"
            aria-live="polite"
          >
            {brandingResult}
          </p>
        )}
        {brandingError && (
          <p className={styles.opsPanelError} role="alert">
            {brandingError}
          </p>
        )}
        {brandingSaving ? (
          <p className={styles.formHint}>마스코트를 저장하는 중입니다.</p>
        ) : null}
      </section>

      {/* Panel 6: Schift RAG 현황 */}
      <section className={`${styles.panel} ${styles.opsPanelWide}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>Schift RAG 현황</h2>
          </div>
        </div>

        {schiftLoading ? (
          <div className={styles.analyticsLoading} role="status" aria-live="polite">
            Schift 상태를 불러오는 중...
          </div>
        ) : schiftError ? (
          <p className={styles.opsPanelError} role="alert">{schiftError}</p>
        ) : schiftStatus ? (
          <>
            {/* Collections */}
            <div className={styles.opsScheduleRows}>
              <p className={styles.fieldLabel} style={{ margin: 0 }}>컬렉션</p>
              {schiftStatus.collections.map((col) => (
                <div key={col.id} className={styles.opsScheduleRow}>
                  <span className={styles.fieldLabel}>{col.name}</span>
                  <span className={`${styles.statusBadge} ${styles.tagAccent}`}>
                    {col.vector_count} vectors
                  </span>
                  <span className={styles.formHint} style={{ margin: 0 }}>
                    {col.model} · dim {col.dimension}
                  </span>
                </div>
              ))}
            </div>

            {/* Workflows */}
            {schiftStatus.workflows.length > 0 && (
              <div className={styles.opsScheduleRows} style={{ marginTop: 16 }}>
                <p className={styles.fieldLabel} style={{ margin: 0 }}>워크플로우</p>
                {schiftStatus.workflows.map((wf) => (
                  <div key={wf.id} className={styles.opsScheduleRow} style={{ flexDirection: "column", alignItems: "stretch" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className={styles.fieldLabel}>{wf.name}</span>
                      <span className={`${styles.statusBadge} ${wf.status === "published" ? styles.tagAccent : ""}`}>
                        {wf.status}
                      </span>
                      <span className={styles.formHint} style={{ margin: 0 }}>
                        {wf.block_count}블록 · {new Date(wf.updated_at).toLocaleDateString("ko-KR")}
                      </span>
                    </div>
                    {wf.description && (
                      <p className={styles.formHint} style={{ margin: "4px 0 0" }}>{wf.description}</p>
                    )}
                    {wf.status === "published" && (
                      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                        <input
                          type="text"
                          className={styles.fieldInput}
                          placeholder="테스트 질문 입력..."
                          value={schiftQuery}
                          onChange={(e) => setSchiftQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !schiftRunning) void handleSchiftRun(wf.id);
                          }}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className={styles.primaryButton}
                          disabled={schiftRunning || !schiftQuery.trim()}
                          aria-busy={schiftRunning}
                          onClick={() => void handleSchiftRun(wf.id)}
                        >
                          {schiftRunning ? "실행 중..." : "테스트"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Run result */}
            {schiftRunResult && (
              <div style={{ marginTop: 12 }}>
                <p className={styles.opsPanelSuccess} role="status">
                  상태: {schiftRunResult.run.status}
                  {schiftRunResult.run.run_id && ` · ${schiftRunResult.run.run_id.slice(0, 12)}...`}
                </p>
                {Object.keys(schiftRunResult.run.outputs).length > 0 && (
                  <pre className={styles.formHint} style={{ margin: "8px 0 0", whiteSpace: "pre-wrap", fontSize: 13 }}>
                    {JSON.stringify(schiftRunResult.run.outputs, null, 2)}
                  </pre>
                )}
                {schiftRunResult.run.error && (
                  <p className={styles.opsPanelError} role="alert">{schiftRunResult.run.error}</p>
                )}
              </div>
            )}
            {schiftRunError && (
              <p className={styles.opsPanelError} role="alert" style={{ marginTop: 12 }}>{schiftRunError}</p>
            )}
          </>
        ) : null}
      </section>

      {/* Panel: RAG Provider (bottom) */}
      <section className={`${styles.panel} ${styles.opsPanelWide}`}>
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle}>벡터 검색 설정</h2>
          </div>
          <span className={`${styles.statusBadge} ${styles.tagAccent}`}>
            {ragProvider}
          </span>
        </div>

        {ragLoading ? (
          <div
            className={styles.analyticsLoading}
            role="status"
            aria-live="polite"
          >
            설정을 불러오는 중...
          </div>
        ) : (
          <div className={styles.opsScheduleRows}>
            {(["schift", "supabase", "auto"] as const).map((option) => (
              <label key={option} className={styles.opsToggleLabel}>
                <input
                  type="radio"
                  name="ragProvider"
                  className={styles.opsToggle}
                  checked={ragProvider === option}
                  onChange={() => setRagProvider(option)}
                />
                <span className={styles.fieldLabel}>
                  {option === "schift"
                    ? "Schift (벡터 DB)"
                    : option === "supabase"
                      ? "Supabase (pgvector)"
                      : "Auto (Schift 우선)"}
                </span>
              </label>
            ))}
          </div>
        )}

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={ragSaving || ragLoading}
            aria-busy={ragSaving}
            onClick={async () => {
              setRagSaving(true);
              setRagResult(null);
              setRagError(null);
              try {
                const res = await fetch("/api/admin/rag-provider", {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ragProvider }),
                });
                if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
                setRagResult("저장되었습니다.");
              } catch (err) {
                setRagError(
                  err instanceof Error ? err.message : "저장에 실패했습니다.",
                );
              } finally {
                setRagSaving(false);
              }
            }}
          >
            {ragSaving ? "저장 중..." : "저장"}
          </button>
        </div>

        {ragResult && (
          <p className={styles.opsPanelSuccess} role="status">
            {ragResult}
          </p>
        )}
        {ragError && (
          <p className={styles.opsPanelError} role="alert">
            {ragError}
          </p>
        )}
      </section>
    </div>
  );
}
