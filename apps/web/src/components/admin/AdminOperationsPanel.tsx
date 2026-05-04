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
  externalSurveys: ExternalSurveyData[];
}

interface ExternalSurveyData {
  id: string;
  label: string;
  url: string | null;
  visible: boolean;
}

const DEFAULT_EXTERNAL_SURVEYS: ExternalSurveyData[] = [
  {
    id: "survey-1",
    label: "1차 설문지",
    url: "https://forms.gle/ZoLxWPdwid1F94FE8",
    visible: true,
  },
  {
    id: "survey-2",
    label: "2차 설문지",
    url: "https://forms.gle/LvFmEZHkGM3MMLQ8A",
    visible: true,
  },
  {
    id: "survey-3",
    label: "3차 설문지",
    url: "https://forms.gle/fNUX6qDjXR5wXoGt7",
    visible: true,
  },
];

type CharacterImageTone =
  | "neutral"
  | "calm"
  | "joyful"
  | "anxious"
  | "tired"
  | "sad";

interface CharacterImagesData {
  version: string;
  images: Record<CharacterImageTone, string>;
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
  mascotObjectPath: "assets/penguin-nurse/app/neutral.png",
  mascotSourceFileName: "neutral.png",
  mascotAltText: "펭귄 간호사",
  surveyFormUrl: DEFAULT_EXTERNAL_SURVEYS[0]?.url ?? null,
  externalSurveys: DEFAULT_EXTERNAL_SURVEYS,
};

function normalizeBrandingData(data: Partial<BrandingData>): BrandingData {
  const surveysById = new Map(
    Array.isArray(data.externalSurveys)
      ? data.externalSurveys.map((survey) => [survey.id, survey])
      : [],
  );
  const externalSurveys = DEFAULT_EXTERNAL_SURVEYS.map((fallback) => ({
    ...fallback,
    ...(surveysById.get(fallback.id) ?? {}),
  }));

  return {
    ...DEFAULT_BRANDING,
    ...data,
    surveyFormUrl:
      data.surveyFormUrl ??
      externalSurveys.find((survey) => survey.visible && survey.url)?.url ??
      null,
    externalSurveys,
  };
}

const CHARACTER_IMAGE_TONES: Array<{
  key: CharacterImageTone;
  label: string;
}> = [
  { key: "neutral", label: "기본" },
  { key: "calm", label: "차분" },
  { key: "joyful", label: "기쁨" },
  { key: "anxious", label: "걱정" },
  { key: "tired", label: "피곤" },
  { key: "sad", label: "슬픔" },
];

const DEFAULT_CHARACTER_IMAGES: CharacterImagesData = {
  version: "gcs-penguin-nurse-v1",
  images: Object.fromEntries(
    CHARACTER_IMAGE_TONES.map(({ key }) => [
      key,
      `https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/${key}.png`,
    ]),
  ) as Record<CharacterImageTone, string>,
};

export function AdminOperationsPanel() {
  // Panel 1: Push notification
  const [pushLoading, setPushLoading] = useState(false);
  const [pushResult, setPushResult] = useState<string | null>(null);
  const [pushError, setPushError] = useState<string | null>(null);

  // Panel 2: RAG Provider
  const [ragProvider, setRagProvider] = useState<"schift">("schift");
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
  const [characterImages, setCharacterImages] = useState<CharacterImagesData>(
    DEFAULT_CHARACTER_IMAGES,
  );
  const [characterImagesLoading, setCharacterImagesLoading] = useState(true);
  const [characterImagesSavingTone, setCharacterImagesSavingTone] =
    useState<CharacterImageTone | null>(null);

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
          if (!cancelled) setRagProvider("schift");
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
          const data: Partial<BrandingData> = await res.json();
          if (!cancelled) setBranding(normalizeBrandingData(data));
        }
      } catch {
      } finally {
        if (!cancelled) setBrandingLoading(false);
      }
    }

    async function fetchCharacterImages() {
      setCharacterImagesLoading(true);
      try {
        const res = await fetch("/api/admin/branding/character-images");
        if (res.ok) {
          const data: CharacterImagesData = await res.json();
          if (!cancelled) setCharacterImages(data);
        }
      } catch {
      } finally {
        if (!cancelled) setCharacterImagesLoading(false);
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
    void fetchCharacterImages();
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
      formData.set("bucketId", "pregnancy-content");
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
        externalSurveys: branding.externalSurveys,
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

  async function handleUploadCharacterImage(
    tone: CharacterImageTone,
    file: File,
  ) {
    setCharacterImagesSavingTone(tone);
    setBrandingResult(null);
    setBrandingError(null);
    try {
      const objectPath = `assets/penguin-nurse/app/${tone}.png`;
      const formData = new FormData();
      formData.set("file", file);
      formData.set("bucketId", "pregnancy-content");
      formData.set("mediaScope", "asset");
      formData.set("objectPath", objectPath);

      const uploadRes = await fetch("/api/admin/content/media/upload", {
        method: "POST",
        body: formData,
      });
      const uploadPayload = (await uploadRes.json()) as {
        error?: string;
        bucketId?: string;
        objectPath?: string;
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
          uploadPayload.error ?? "캐릭터 이미지 업로드에 실패했습니다.",
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

      const nextImages = {
        ...characterImages.images,
        [tone]: `https://storage.googleapis.com/${uploadPayload.bucketId}/${uploadPayload.objectPath}`,
      };
      const saveRes = await fetch("/api/admin/branding/character-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: nextImages }),
      });
      const savePayload = (await saveRes.json()) as {
        error?: string;
        config?: CharacterImagesData;
      };
      if (!saveRes.ok || !savePayload.config) {
        throw new Error(
          savePayload.error ?? "캐릭터 이미지 설정 저장에 실패했습니다.",
        );
      }

      setCharacterImages(savePayload.config);
      setBrandingResult("캐릭터 이미지 cache를 갱신했습니다.");
    } catch (error) {
      setBrandingError(
        error instanceof Error
          ? error.message
          : "캐릭터 이미지 저장에 실패했습니다.",
      );
    } finally {
      setCharacterImagesSavingTone(null);
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
          externalSurveys: branding.externalSurveys.map((survey) => ({
            ...survey,
            label: survey.label.trim(),
            url: survey.url?.trim() || null,
          })),
        }),
      });
      const savePayload = (await saveRes.json()) as { error?: string };
      if (!saveRes.ok) {
        throw new Error(savePayload.error ?? "설문 링크 저장에 실패했습니다.");
      }

      setBranding((current) => ({
        ...current,
        surveyFormUrl: current.surveyFormUrl?.trim() || null,
        externalSurveys: current.externalSurveys.map((survey) => ({
          ...survey,
          label: survey.label.trim(),
          url: survey.url?.trim() || null,
        })),
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
            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>외부 설문 노출</span>
              {branding.externalSurveys.map((survey) => (
                <div className={styles.actionRow} key={survey.id}>
                  <input
                    className={styles.fieldInput}
                    aria-label={`${survey.label} 이름`}
                    value={survey.label}
                    onChange={(event) => {
                      const label = event.target.value;
                      setBranding((current) => ({
                        ...current,
                        externalSurveys: current.externalSurveys.map((item) =>
                          item.id === survey.id ? { ...item, label } : item,
                        ),
                      }));
                    }}
                  />
                  <input
                    className={styles.fieldInput}
                    aria-label={`${survey.label} 링크`}
                    type="url"
                    inputMode="url"
                    value={survey.url ?? ""}
                    onChange={(event) => {
                      const url = event.target.value;
                      setBranding((current) => ({
                        ...current,
                        externalSurveys: current.externalSurveys.map((item) =>
                          item.id === survey.id ? { ...item, url } : item,
                        ),
                      }));
                    }}
                  />
                  <label className={styles.fieldLabel}>
                    <input
                      type="checkbox"
                      checked={survey.visible}
                      onChange={(event) => {
                        const visible = event.target.checked;
                        setBranding((current) => ({
                          ...current,
                          externalSurveys: current.externalSurveys.map((item) =>
                            item.id === survey.id ? { ...item, visible } : item,
                          ),
                        }));
                      }}
                    />
                    보임
                  </label>
                </div>
              ))}
            </div>
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

            <div className={styles.panelHeader}>
              <div>
                <h3 className={styles.panelTitle}>간호사 캐릭터 cache</h3>
              </div>
            </div>
            {characterImagesLoading ? (
              <div
                className={styles.analyticsLoading}
                role="status"
                aria-live="polite"
              >
                캐릭터 이미지를 불러오는 중...
              </div>
            ) : (
              <div className={styles.opsScheduleRows}>
                {CHARACTER_IMAGE_TONES.map(({ key, label }) => (
                  <label className={styles.fieldGroup} key={key}>
                    <span className={styles.fieldLabel}>
                      {label} 이미지
                    </span>
                    <input
                      className={styles.fieldInput}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      aria-label={`${label} 이미지`}
                      disabled={characterImagesSavingTone === key}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        void handleUploadCharacterImage(key, file);
                        event.currentTarget.value = "";
                      }}
                    />
                    <span className={styles.formHint}>
                      {characterImages.images[key]}
                    </span>
                  </label>
                ))}
                <p className={styles.formHint}>
                  앱은 시작할 때 version을 비교하고 바뀐 경우에만 이 cache를
                  다시 받아요. 현재 version: {characterImages.version}
                </p>
              </div>
            )}
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
	                        {wf.block_count}블록 · {new Date(wf.updated_at).toLocaleDateString("ko-KR", {
	                          timeZone: "Asia/Seoul",
	                        })}
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
            <div className={styles.opsToggleLabel}>
              <span className={styles.fieldLabel}>Schift (벡터 DB)</span>
            </div>
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
