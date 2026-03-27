"use client";

import {
  DEFAULT_MOBILE_THEME_KEY,
  MOBILE_THEME_OPTIONS,
  resolveMobileThemeKey,
  type MobileThemeKey,
} from "@gynecology-chatbot/app-core";
import type { MobileProfileViewData } from "@gynecology-chatbot/app-core";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  fetchHome,
  fetchMobileProfile,
  fetchSessions,
  resolveMobileUserId,
  submitProfileSurveyAnswer,
  updateMobileProfile,
} from "@/lib/mobile/web-mobile-api";
import {
  clearMobileSession,
  readStoredMobileThemeKey,
  storeMobileProfile,
  storeMobileThemeKey,
} from "@/lib/mobile/mobile-session";
import { applyMobileTheme } from "@/lib/mobile/themes";
import {
  MobileCard,
  mobileFieldClassName,
  MobileFormField,
  MobileNotice,
  MobileSectionIntro,
  MobileSkeletonBlock,
} from "./MobilePrimitives";
import { MobileShell } from "./MobileShell";
import { MobileThemePresetButtons } from "./MobileThemePresetButtons";
import { getWeekBabyImagePath } from "./week-baby-images";
import { useMobileSessionGuard } from "./useMobileSessionGuard";

const TONE_OPTIONS = [
  { value: "calm", label: "차분하게" },
  { value: "detailed", label: "자세하게" },
  { value: "reassuring", label: "안심 중심으로" },
];

function resolveToneLabel(value?: string | null) {
  return (
    TONE_OPTIONS.find((option) => option.value === value)?.label ??
    value ??
    "미설정"
  );
}

export function MobileProfileView({
  userId,
  mode = "summary",
}: {
  userId?: string | null;
  mode?: "summary" | "settings";
}) {
  const resolvedUserId = useMobileSessionGuard(
    resolveMobileUserId(userId ?? null),
  );
  const router = useRouter();
  const homeHref = resolvedUserId
    ? `/?userId=${encodeURIComponent(resolvedUserId)}`
    : "/";
  const profileHref = resolvedUserId
    ? `/profile?userId=${encodeURIComponent(resolvedUserId)}`
    : "/profile";
  const settingsHref = resolvedUserId
    ? `/profile/settings?userId=${encodeURIComponent(resolvedUserId)}`
    : "/profile/settings";
  const backHref = mode === "settings" ? profileHref : homeHref;
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [notificationTime, setNotificationTime] = useState("08:30");
  const [themeKey, setThemeKey] = useState(
    () => readStoredMobileThemeKey() ?? DEFAULT_MOBILE_THEME_KEY,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activityDays, setActivityDays] = useState<number[]>([]);
  const [recentSessions, setRecentSessions] = useState<Array<{ id: string; title: string; preview: string; updatedAtLabel: string }>>([]);
  const [pendingSurveys, setPendingSurveys] = useState<
    NonNullable<MobileProfileViewData["pendingSurveys"]>
  >([]);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  const [submittingSurveyId, setSubmittingSurveyId] = useState<string | null>(null);

  useEffect(() => {
    const storedThemeKey = readStoredMobileThemeKey();
    if (storedThemeKey) {
      setThemeKey(storedThemeKey);
      applyMobileTheme(storedThemeKey);
    }
  }, []);

  useEffect(() => {
    if (!resolvedUserId) {
      return;
    }

    let cancelled = false;

    Promise.all([
      fetchMobileProfile(resolvedUserId),
      fetchHome(resolvedUserId),
      fetchSessions(resolvedUserId),
    ])
      .then(([payload, homePayload, sessionsPayload]) => {
        if (cancelled) {
          return;
        }

        const nextThemeKey = resolveMobileThemeKey(
          readStoredMobileThemeKey() ?? payload.profile.themeKey,
        );

        setProfile(payload.profile);
        setDisplayName(payload.profile.displayName);
        setDueDate(payload.profile.dueDate ?? "");
        setTonePreference(payload.profile.tonePreference ?? "");
        setBabyNickname(payload.profile.babyNickname ?? "");
        setHospitalName(payload.profile.hospitalName ?? "");
        setNotificationTime(payload.profile.notificationTime ?? "08:30");
        setThemeKey(nextThemeKey);
        setPendingSurveys(payload.profile.pendingSurveys ?? []);
        setActivityDays(
          homePayload.home.calendarDays
            .filter((day) => day.hasChat || Boolean(day.emotionTone))
            .map((day) => Number(day.dayLabel)),
        );
        setRecentSessions(sessionsPayload.sessions.slice(0, 5));
        storeMobileProfile({
          userId: payload.profile.userId,
          displayName: payload.profile.displayName,
          phoneNumber: payload.profile.phoneNumber,
          pregnancyWeekLabel: payload.profile.pregnancyWeekLabel,
          themeKey: nextThemeKey,
        });
        applyMobileTheme(nextThemeKey);
        setError(null);
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "설정을 불러오지 못했어요.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [resolvedUserId]);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resolvedUserId || !displayName.trim() || !tonePreference.trim()) {
      setError("이름과 상담 분위기는 비워둘 수 없어요.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const payload = await updateMobileProfile({
        userId: resolvedUserId,
        displayName: displayName.trim(),
        dueDate: dueDate || null,
        tonePreference: tonePreference.trim(),
        babyNickname: babyNickname.trim() || null,
        hospitalName: hospitalName.trim() || null,
        notificationTime,
        themeKey,
      });

      const refreshed = await fetchMobileProfile(payload.user.id);
      const nextThemeKey = resolveMobileThemeKey(
        refreshed.profile.themeKey ?? themeKey,
      );
      setProfile(refreshed.profile);
      setDisplayName(refreshed.profile.displayName);
      setDueDate(refreshed.profile.dueDate ?? "");
      setTonePreference(refreshed.profile.tonePreference ?? "");
      setBabyNickname(refreshed.profile.babyNickname ?? "");
      setHospitalName(refreshed.profile.hospitalName ?? "");
      setNotificationTime(refreshed.profile.notificationTime ?? "08:30");
      setThemeKey(nextThemeKey);
      setPendingSurveys(refreshed.profile.pendingSurveys ?? []);
      storeMobileProfile({
        userId: refreshed.profile.userId,
        displayName: refreshed.profile.displayName,
        phoneNumber: refreshed.profile.phoneNumber,
        pregnancyWeekLabel: refreshed.profile.pregnancyWeekLabel,
        themeKey: nextThemeKey,
      });
      applyMobileTheme(nextThemeKey);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "설정을 저장하지 못했어요.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmitSurveyAnswer(questionId: string, answer: string) {
    if (!resolvedUserId || !answer.trim()) {
      setError("설문 답변을 비워둘 수 없어요.");
      return;
    }

    setSubmittingSurveyId(questionId);
    setError(null);

    try {
      await submitProfileSurveyAnswer({
        userId: resolvedUserId,
        questionId,
        answer: answer.trim(),
      });
      setPendingSurveys((current) =>
        current.filter((survey) => survey.id !== questionId),
      );
      setSurveyAnswers((current) => {
        const next = { ...current };
        delete next[questionId];
        return next;
      });
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "설문 답변을 저장하지 못했어요.",
      );
    } finally {
      setSubmittingSurveyId(null);
    }
  }

  function handleThemeSelect(nextThemeKey: MobileThemeKey) {
    setThemeKey(nextThemeKey);
    storeMobileThemeKey(nextThemeKey);
    applyMobileTheme(nextThemeKey);
  }

  const calendarDays = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const result: Array<number | null> = [];

    for (let index = 0; index < firstDay.getDay(); index += 1) {
      result.push(null);
    }

    for (let day = 1; day <= lastDay.getDate(); day += 1) {
      result.push(day);
    }

    return result;
  }, []);
  const babyImagePath = getWeekBabyImagePath(profile?.pregnancyWeekLabel);

  return (
    <MobileShell
      title={mode === "settings" ? "정보 설정" : "마이페이지"}
      description={
        mode === "settings"
          ? "태명과 예정일, 알림과 대화 분위기를 여기에서 바꿔요."
          : "아기 정보와 활동 흐름을 한 곳에서 정리해요."
      }
      userId={resolvedUserId}
      backHref={backHref}
      showTitleBlock={false}
      showChatFab
      pageTone="plain"
    >
      <div className="grid gap-5">
        <MobileCard className="px-5 py-6">
          <MobileSectionIntro
            eyebrow="내 정보"
            title={babyNickname || "우리 아기"}
            description={
              profile
                ? `${profile.pregnancyWeekLabel} · 임신 ${profile.pregnancyDayCount}일째예요.`
                : "아기 정보와 활동 흐름을 한 곳에서 정리해요."
            }
          />
          <div className="mt-5 flex justify-center">
            <div className="flex h-[132px] w-[132px] items-center justify-center rounded-full bg-[#f5f5f7]">
              <div className="h-[108px] w-[108px] overflow-hidden rounded-full bg-[#ececf0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={babyImagePath}
                  alt={`${profile?.pregnancyWeekLabel ?? "현재"} 태아 이미지`}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-muted)] p-4">
              <p className="text-sm text-[var(--text-soft)]">이름</p>
              {profile ? (
                <p className="mt-2 text-xl font-semibold text-[var(--text)]">
                  {profile.displayName}
                </p>
              ) : (
                <MobileSkeletonBlock className="mt-2 h-7 w-28" />
              )}
            </div>
            <div className="rounded-[22px] border border-[var(--line)] bg-[var(--accent-soft)] p-4">
              <p className="text-sm text-[var(--text-soft)]">예정 출산일</p>
              {profile ? (
                <p className="mt-2 text-xl font-semibold text-[var(--text)]">
                  {profile.dueDate ?? "미설정"}
                </p>
              ) : (
                <MobileSkeletonBlock className="mt-2 h-7 w-36 bg-white/70" />
              )}
            </div>
          </div>
        </MobileCard>

        {mode === "summary" ? (
          <MobileCard className="px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
              활동 캘린더
            </p>
            <div className="mt-5 grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => (
                <div
                  key={`calendar-${index}`}
                  className={`flex aspect-square items-center justify-center rounded-[12px] ${
                    day && activityDays.includes(day)
                      ? "bg-[#d48ea5] text-white"
                      : "bg-[#f3f3f5] text-[var(--text-soft)]"
                  }`}
                >
                  <span className="text-[12px] font-semibold">{day ?? ""}</span>
                </div>
              ))}
            </div>
          </MobileCard>
        ) : null}

        {mode === "summary" ? (
          <MobileCard className="px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            이전 기록
          </p>
          <div className="mt-4 grid gap-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-[22px] border border-[var(--line)] bg-[#fffafc] px-4 py-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-[var(--text)]">{session.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#776873]">{session.preview}</p>
                  </div>
                  <span className="text-xs text-[#b87089]">{session.updatedAtLabel}</span>
                </div>
              </div>
            ))}
            {recentSessions.length === 0 ? (
              <p className="rounded-[20px] border border-dashed border-[var(--line)] p-4 text-sm text-[var(--text-soft)]">
                아직 이전 기록이 없어요.
              </p>
            ) : null}
          </div>
          </MobileCard>
        ) : null}

        {mode === "summary" && pendingSurveys.length > 0 ? (
          <MobileCard className="px-5 py-6">
            <MobileSectionIntro
              eyebrow="오늘 설문"
              title="프로필에서 바로 답해요"
              description="채팅으로 들어가지 않아도 지금 필요한 질문에 바로 답할 수 있어요."
            />
            <div className="mt-4 grid gap-4">
              {pendingSurveys.map((survey) => {
                const currentAnswer = surveyAnswers[survey.id] ?? "";
                const isSubmitting = submittingSurveyId === survey.id;
                const supportsFreeText =
                  survey.questionType === "text" ||
                  survey.questionType === "number" ||
                  survey.choices.length === 0;

                return (
                  <div
                    key={survey.id}
                    className="rounded-[22px] border border-[var(--line)] bg-[#fffafc] p-4"
                  >
                    <p className="text-base font-semibold text-[var(--text)]">
                      {survey.questionText}
                    </p>
                    {survey.helpText ? (
                      <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                        {survey.helpText}
                      </p>
                    ) : null}

                    {supportsFreeText ? (
                      <div className="mt-4 grid gap-3">
                        <input
                          value={currentAnswer}
                          onChange={(event) =>
                            setSurveyAnswers((current) => ({
                              ...current,
                              [survey.id]: event.target.value,
                            }))
                          }
                          className={mobileFieldClassName}
                          placeholder="답변을 적어주세요"
                        />
                        <button
                          type="button"
                          disabled={isSubmitting || !currentAnswer.trim()}
                          onClick={() =>
                            void handleSubmitSurveyAnswer(survey.id, currentAnswer)
                          }
                          className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          {isSubmitting ? "저장 중" : "답변 저장"}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {survey.choices.map((choice) => (
                          <button
                            key={choice.id}
                            type="button"
                            disabled={isSubmitting}
                            onClick={() =>
                              void handleSubmitSurveyAnswer(survey.id, choice.label)
                            }
                            className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] disabled:opacity-60"
                          >
                            {choice.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </MobileCard>
        ) : null}

        <MobileCard as="section" className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-soft)]">
            {mode === "settings" ? "정보 설정" : "아기 정보"}
          </p>
          {mode === "settings" ? (
            <form className="mt-4 grid gap-3" onSubmit={handleSave}>
              <MobileFormField label="이름">
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className={mobileFieldClassName}
                  placeholder="이름"
                />
              </MobileFormField>
              <MobileFormField label="태명">
                <input
                  value={babyNickname}
                  onChange={(event) => setBabyNickname(event.target.value)}
                  className={mobileFieldClassName}
                  placeholder="예: 튼튼이"
                />
              </MobileFormField>
              <MobileFormField label="예정 출산일">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className={mobileFieldClassName}
                />
              </MobileFormField>
              <MobileFormField label="주 진료 병원">
                <input
                  value={hospitalName}
                  onChange={(event) => setHospitalName(event.target.value)}
                  className={mobileFieldClassName}
                  placeholder="예: 산단여성병원"
                />
              </MobileFormField>
              <MobileThemePresetButtons
                label="테마"
                onSelect={handleThemeSelect}
                selectedThemeKey={themeKey}
              />
              <MobileFormField label="매일 알림 시간">
                <input
                  type="time"
                  value={notificationTime}
                  onChange={(event) => setNotificationTime(event.target.value)}
                  className={mobileFieldClassName}
                />
              </MobileFormField>
              <MobileFormField label="채팅 톤">
                <select
                  value={tonePreference}
                  onChange={(event) => setTonePreference(event.target.value)}
                  className={mobileFieldClassName}
                >
                  {TONE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </MobileFormField>
              {error ? <MobileNotice>{error}</MobileNotice> : null}
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSaving ? "저장 중" : "저장하기"}
              </button>
            </form>
          ) : (
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                <p className="text-sm text-[var(--text-soft)]">태명</p>
                <p className="mt-2 text-base font-semibold text-[var(--text)]">
                  {babyNickname || "아직 정하지 않았어요."}
                </p>
              </div>
              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                <p className="text-sm text-[var(--text-soft)]">예정 출산일</p>
                <p className="mt-2 text-base font-semibold text-[var(--text)]">
                  {dueDate || "아직 입력하지 않았어요."}
                </p>
              </div>
              <div className="rounded-[22px] border border-[var(--line)] bg-[var(--panel-muted)] p-4">
                <p className="text-sm text-[var(--text-soft)]">매일 알림 시간</p>
                <p className="mt-2 text-base font-semibold text-[var(--text)]">
                  {notificationTime || "08:30"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => router.push(settingsHref)}
                className="rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
              >
                정보 설정 열기
              </button>
            </div>
          )}
        </MobileCard>

        <MobileCard className="p-5">
          <MobileSectionIntro
            eyebrow="계정"
            eyebrowTone="muted"
            size="section"
            title="로그아웃"
            description="다른 기기에서 사용하거나 계정을 전환할 때 로그아웃하세요."
          />
          <button
            type="button"
            onClick={() => {
              clearMobileSession();
              router.replace("/auth/login");
            }}
            className="mt-4 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-white"
          >
            로그아웃
          </button>
        </MobileCard>
      </div>
    </MobileShell>
  );
}
