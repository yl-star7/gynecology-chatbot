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

export function AdminOperationsPanel() {
  // Panel 1: Push notification
  const [pushLoading, setPushLoading] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Panel 2: Proactive message
  const [proactiveLoading, setProactiveLoading] = useState(false);
  const [proactiveResult, setProactiveResult] = useState<string | null>(null);
  const [proactiveError, setProactiveError] = useState<string | null>(null);

  // Panel 3: RAG Provider
  const [ragProvider, setRagProvider] = useState<"schift" | "supabase" | "auto">("auto");
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
            err instanceof Error ? err.message : "스케줄을 불러오지 못했습니다.",
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
      } catch {} finally {
        if (!cancelled) setRagLoading(false);
      }
    }

    void fetchRagProvider();
    void fetchSchedule();
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

  async function handleTriggerProactive() {
    setProactiveLoading(true);
    setProactiveResult(null);
    setProactiveError(null);
    try {
      const res = await fetch("/api/admin/proactive/trigger", { method: "POST" });
      if (!res.ok) {
        throw new Error(`서버 오류 (${res.status})`);
      }
      const data: { count: number } = await res.json();
      setProactiveResult(`${data.count}명에게 예약 완료`);
    } catch (err) {
      setProactiveError(
        err instanceof Error ? err.message : "트리거에 실패했습니다.",
      );
    } finally {
      setProactiveLoading(false);
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

  return (
    <div className={styles.panelGrid}>
      {/* Panel 1: Push notification */}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Push Notifications</p>
            <h2 className={styles.panelTitle}>푸시 알림 발송</h2>
            <p className={styles.panelDescription}>
              푸시 수신 동의 사용자 전체에게 즉시 알림을 발송합니다.
            </p>
          </div>
          <span className={`${styles.statusBadge} ${styles.tagAccent}`}>
            Broadcast
          </span>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void handleSendPush()}
            disabled={pushLoading}
            aria-busy={pushLoading}
          >
            {pushLoading ? "발송 중..." : "푸시 알림 보내기"}
          </button>
        </div>

        {pushResult && (
          <p className={styles.opsPanelSuccess} role="status" aria-live="polite">
            {pushResult}
          </p>
        )}
        {pushError && (
          <p className={styles.opsPanelError} role="alert">
            {pushError}
          </p>
        )}
      </section>

      {/* Panel 2: Proactive message */}
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Proactive Messaging</p>
            <h2 className={styles.panelTitle}>Proactive 메시지</h2>
            <p className={styles.panelDescription}>
              안부 메시지를 수동으로 트리거하여 대상 사용자에게 예약합니다.
            </p>
          </div>
          <span className={`${styles.statusBadge} ${styles.tagActive}`}>
            Trigger
          </span>
        </div>

        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => void handleTriggerProactive()}
            disabled={proactiveLoading}
            aria-busy={proactiveLoading}
          >
            {proactiveLoading ? "처리 중..." : "안부 메시지 트리거"}
          </button>
        </div>

        {proactiveResult && (
          <p className={styles.opsPanelSuccess} role="status" aria-live="polite">
            {proactiveResult}
          </p>
        )}
        {proactiveError && (
          <p className={styles.opsPanelError} role="alert">
            {proactiveError}
          </p>
        )}
      </section>

      {/* Panel 3: RAG Provider */}
      <section className={`${styles.panel} ${styles.opsPanelWide}`}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>RAG Backend</p>
            <h2 className={styles.panelTitle}>벡터 검색 설정</h2>
            <p className={styles.panelDescription}>
              채팅 RAG 검색에 사용할 백엔드를 선택합니다.
            </p>
          </div>
          <span className={`${styles.statusBadge} ${styles.tagAccent}`}>
            {ragProvider}
          </span>
        </div>

        {ragLoading ? (
          <div className={styles.analyticsLoading} role="status" aria-live="polite">
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
                  {option === "schift" ? "Schift (벡터 DB)" : option === "supabase" ? "Supabase (pgvector)" : "Auto (Schift 우선)"}
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
                setRagError(err instanceof Error ? err.message : "저장에 실패했습니다.");
              } finally {
                setRagSaving(false);
              }
            }}
          >
            {ragSaving ? "저장 중..." : "저장"}
          </button>
        </div>

        {ragResult && <p className={styles.opsPanelSuccess} role="status">{ragResult}</p>}
        {ragError && <p className={styles.opsPanelError} role="alert">{ragError}</p>}
      </section>

      {/* Panel 4: Schedule settings — spans full width */}
      <section className={`${styles.panel} ${styles.opsPanelWide}`}>
        <div className={styles.panelHeader}>
          <div>
            <p className={styles.eyebrow}>Notification Schedule</p>
            <h2 className={styles.panelTitle}>알림 스케줄 설정</h2>
            <p className={styles.panelDescription}>
              자동 알림 발송 시각과 활성화 여부를 구성합니다.
            </p>
          </div>
          <span className={`${styles.statusBadge} ${styles.statusBadge}`}>
            Config
          </span>
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

            {/* Row 2: Weekly milestone */}
            <div className={styles.opsScheduleRow}>
              <label className={styles.opsToggleLabel}>
                <input
                  type="checkbox"
                  className={styles.opsToggle}
                  checked={schedule.weeklyMilestoneEnabled}
                  onChange={(e) =>
                    setSchedule((prev) => ({
                      ...prev,
                      weeklyMilestoneEnabled: e.target.checked,
                    }))
                  }
                />
                <span className={styles.fieldLabel}>주간 마일스톤</span>
              </label>
              <input
                type="time"
                className={`${styles.fieldInput} ${styles.opsTimeInput}`}
                value={schedule.weeklyMilestoneTime}
                onChange={(e) =>
                  setSchedule((prev) => ({
                    ...prev,
                    weeklyMilestoneTime: e.target.value,
                  }))
                }
                aria-label="주간 마일스톤 시각"
              />
              <select
                className={`${styles.fieldSelect} ${styles.opsDaySelect}`}
                value={schedule.weeklyMilestoneDay}
                onChange={(e) =>
                  setSchedule((prev) => ({
                    ...prev,
                    weeklyMilestoneDay: Number(e.target.value),
                  }))
                }
                aria-label="주간 마일스톤 요일"
              >
                {DAY_LABELS.map((label, index) => (
                  <option key={index} value={index}>
                    {label}요일
                  </option>
                ))}
              </select>
            </div>

            {/* Row 3: Checkup reminder */}
            <div className={styles.opsScheduleRow}>
              <label className={styles.opsToggleLabel}>
                <input
                  type="checkbox"
                  className={styles.opsToggle}
                  checked={schedule.checkupReminderEnabled}
                  onChange={(e) =>
                    setSchedule((prev) => ({
                      ...prev,
                      checkupReminderEnabled: e.target.checked,
                    }))
                  }
                />
                <span className={styles.fieldLabel}>검진 리마인더</span>
              </label>
              <input
                type="time"
                className={`${styles.fieldInput} ${styles.opsTimeInput}`}
                value={schedule.checkupReminderTime}
                onChange={(e) =>
                  setSchedule((prev) => ({
                    ...prev,
                    checkupReminderTime: e.target.value,
                  }))
                }
                aria-label="검진 리마인더 시각"
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
          <p className={styles.opsPanelSuccess} role="status" aria-live="polite">
            {scheduleResult}
          </p>
        )}
        {scheduleError && !scheduleLoading && (
          <p className={styles.opsPanelError} role="alert">
            {scheduleError}
          </p>
        )}
      </section>
    </div>
  );
}
