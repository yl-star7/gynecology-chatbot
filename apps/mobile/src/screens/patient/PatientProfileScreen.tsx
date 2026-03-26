// @ts-nocheck
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import type { HomeViewData, MobileProfileViewData, RecentChatSummary } from "@gynecology-chatbot/app-core";
import { Button, Card, LabeledInput, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientTodayTabs } from "../../components/patient/PatientTodayTabs";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";
import { buildProfileCalendarModel } from "./patientProfileCalendar";
import { getWeekBabyImageSource } from "./week-baby-images";

export function PatientProfileScreen() {
  const { currentUser, signOut } = useMobileAppSession();
  const { profilePort, homePort, chatPort } = useMobileServices();
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [notificationTime, setNotificationTime] = useState("08:30");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  const [submittingSurveyId, setSubmittingSurveyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("records");

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    Promise.all([
      profilePort.getProfile(),
      homePort.getHomeView(),
      chatPort.listRecentChats(),
    ]).then(([nextProfile, nextHome, nextSessions]) => {
      setProfile(nextProfile);
      setHome(nextHome);
      setRecentSessions(nextSessions);
      setDisplayName(nextProfile.displayName);
      setDueDate(nextProfile.dueDate ?? "");
      setTonePreference(nextProfile.tonePreference ?? "");
      setBabyNickname(nextProfile.babyNickname ?? "");
      setHospitalName(nextProfile.hospitalName ?? "");
      setNotificationTime(nextProfile.notificationTime ?? "08:30");
    }).catch((nextError) => {
      setError(nextError instanceof Error ? nextError.message : "내 정보를 불러오지 못했어요.");
    });
  }, [chatPort, currentUser, homePort, profilePort]);

  async function handleSave() {
    if (!currentUser) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await profilePort.updateProfile({
        userId: currentUser.id,
        displayName: displayName.trim(),
        dueDate: dueDate || null,
        tonePreference: tonePreference.trim(),
        babyNickname: babyNickname.trim() || null,
        hospitalName: hospitalName.trim() || null,
        notificationTime,
      });
      const refreshed = await profilePort.getProfile();
      setProfile(refreshed);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace("/auth/login");
  }

  async function handleSubmitSurveyAnswer(questionId: string, answer: string) {
    if (!currentUser || !answer.trim()) {
      setError("설문 답변을 비워둘 수 없어요.");
      return;
    }

    setSubmittingSurveyId(questionId);
    setError(null);

    try {
      await profilePort.submitSurveyAnswer({
        userId: currentUser.id,
        questionId,
        answer: answer.trim(),
      });
      const refreshed = await profilePort.getProfile();
      setProfile(refreshed);
      setSurveyAnswers((current) => {
        const next = { ...current };
        delete next[questionId];
        return next;
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "설문 답변을 저장하지 못했어요.");
    } finally {
      setSubmittingSurveyId(null);
    }
  }

  const calendarModel = useMemo(
    () => buildProfileCalendarModel(home?.calendarDays),
    [home?.calendarDays],
  );
  const isoDateByDay = useMemo(
    () =>
      new Map(
        (home?.calendarDays ?? []).map((day) => [Number(day.dayLabel), day.isoDate]),
      ),
    [home?.calendarDays],
  );
  const babyName = profile?.babyNickname?.trim() || "아기";
  const babyImageSource = getWeekBabyImageSource(profile?.pregnancyWeekLabel);

  return (
    <PatientShell activeTab="profile" title="마이페이지" showProfileButton={false} pageTone="plain">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.avatarCircle}>
                <Image source={babyImageSource} style={styles.avatarImage} resizeMode="cover" />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.title}>{babyName}</Text>
                <Text style={styles.description}>
                  {profile ? `${profile.pregnancyWeekLabel} · 임신 ${profile.pregnancyDayCount}일째예요.` : "아기와 함께한 시간을 정리해보세요."}
                </Text>
                <Text style={styles.heroMeta}>
                  {profile?.dueDate ? `예정일 ${profile.dueDate}` : "출산 예정일을 입력하면 더 정확히 보여드려요."}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.calendarCard}>
            <Text style={styles.sectionTitle}>활동 캘린더</Text>
            <Text style={styles.sectionDescription}>
              {home?.currentMonthLabel
                ? `${home.currentMonthLabel}에 활동이 있었던 날을 보여드려요.`
                : "활동이 있었던 날을 한눈에 볼 수 있어요."}
            </Text>
            <View style={styles.weekdayRow}>
              {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
                <Text key={label} style={styles.weekdayLabel}>{label}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarModel.gridDays.map((day, index) => {
                const isActive = day ? calendarModel.activeDays.has(day) : false;
                const isoDate = day ? isoDateByDay.get(day) : null;

                if (!day || !isoDate) {
                  return (
                    <View
                      key={`day-${index}`}
                      style={[
                        styles.calendarCell,
                        { width: calendarModel.columnWidth },
                      ]}
                    >
                      <View style={styles.calendarCellInner}>
                        <Text style={styles.calendarLabel} />
                      </View>
                    </View>
                  );
                }

                return (
                  <Pressable
                    key={`day-${index}`}
                    style={[
                      styles.calendarCell,
                      { width: calendarModel.columnWidth },
                    ]}
                    onPress={() =>
                      router.push(
                        `/records/${encodeURIComponent(isoDate)}?returnTo=profile`,
                      )
                    }
                    accessibilityLabel={`${day}일 기록 보기`}
                  >
                    <View
                      style={[
                        styles.calendarCellInner,
                        isActive ? styles.calendarCellActive : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.calendarLabel,
                          isActive ? styles.calendarLabelActive : null,
                        ]}
                      >
                        {String(day)}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card style={styles.historySectionCard}>
            <Text style={styles.sectionTitle}>이전 기록</Text>
            <PatientTodayTabs
              sections={[
                { id: "records", label: "체크리스트" },
                { id: "reflections", label: "대화" },
              ]}
              activeSection={activeTab}
              onChange={setActiveTab}
            />
            {activeTab === "records" ? (
              <View style={styles.historyList}>
                {(home?.calendarDays ?? []).filter((day) => day.hasChat || day.emotionTone).slice(0, 5).map((day) => (
                  <Pressable
                    key={day.isoDate}
                    style={[styles.historyCard, shadows.card]}
                    onPress={() =>
                      router.push(
                        `/records/${encodeURIComponent(day.isoDate)}?returnTo=profile`,
                      )
                    }
                  >
                    <Text style={styles.historyDate}>{day.isoDate}</Text>
                    <Text style={styles.historyBody}>{day.summary ?? "이 날의 기록을 다시 볼 수 있어요."}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {activeTab === "reflections" ? (
              <View style={styles.historyList}>
                {recentSessions.slice(0, 5).map((session) => (
                  <Pressable
                    key={session.id}
                    style={[styles.historyCard, shadows.card]}
                    onPress={() => router.replace(`/chat/${session.id}`)}
                  >
                    <Text style={styles.historyDate}>{session.updatedAtLabel}</Text>
                    <Text style={styles.historyTitle}>{session.title}</Text>
                    <Text style={styles.historyBody}>{session.preview}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </Card>

          <Card variant="muted">
            {(profile?.pendingSurveys?.length ?? 0) > 0 ? (
              <>
                <Text style={styles.sectionTitle}>오늘 설문</Text>
                <Text style={styles.sectionDescription}>프로필에서 바로 답하고 오늘 기록에 남길 수 있어요.</Text>
                <View style={styles.surveyList}>
                  {(profile?.pendingSurveys ?? []).map((survey) => {
                    const currentAnswer = surveyAnswers[survey.id] ?? "";
                    const supportsFreeText =
                      survey.questionType === "text" ||
                      survey.questionType === "number" ||
                      survey.choices.length === 0;
                    const isSubmitting = submittingSurveyId === survey.id;

                    return (
                      <View key={survey.id} style={styles.surveyCard}>
                        <Text style={styles.surveyQuestion}>{survey.questionText}</Text>
                        {survey.helpText ? (
                          <Text style={styles.surveyHelp}>{survey.helpText}</Text>
                        ) : null}

                        {supportsFreeText ? (
                          <View style={styles.surveyForm}>
                            <LabeledInput
                              label="답변"
                              value={currentAnswer}
                              onChangeText={(value) =>
                                setSurveyAnswers((current) => ({
                                  ...current,
                                  [survey.id]: value,
                                }))
                              }
                              placeholder="답변을 적어주세요"
                            />
                            <Button
                              label={isSubmitting ? "저장 중이에요..." : "답변 저장"}
                              onPress={() => handleSubmitSurveyAnswer(survey.id, currentAnswer)}
                              disabled={isSubmitting || !currentAnswer.trim()}
                            />
                          </View>
                        ) : (
                          <View style={styles.surveyChoiceRow}>
                            {survey.choices.map((choice) => (
                              <Pressable
                                key={choice.id}
                                style={styles.surveyChoice}
                                onPress={() => handleSubmitSurveyAnswer(survey.id, choice.label)}
                                disabled={isSubmitting}
                              >
                                <Text style={styles.surveyChoiceLabel}>{choice.label}</Text>
                              </Pressable>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            ) : null}

            <Text style={styles.sectionTitle}>아기 정보 관리</Text>
            <Text style={styles.sectionDescription}>태명, 예정일, 알림과 상담 분위기를 조절할 수 있어요.</Text>
            <View style={styles.form}>
              <LabeledInput label="이름" value={displayName} onChangeText={setDisplayName} />
              <LabeledInput label="태명" value={babyNickname} onChangeText={setBabyNickname} placeholder="우리 아기 별명" />
              <LabeledInput label="출산 예정일" value={dueDate} onChangeText={setDueDate} placeholder="2026-08-01" />
              <LabeledInput label="병원" value={hospitalName} onChangeText={setHospitalName} placeholder="다니는 병원 이름" />
              <LabeledInput label="알림 시간" value={notificationTime} onChangeText={setNotificationTime} placeholder="08:30" />
              <LabeledInput label="상담 분위기" value={tonePreference} onChangeText={setTonePreference} placeholder="차분하게, 따뜻하게" />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Button label={isSaving ? "저장 중이에요..." : "저장하기"} onPress={handleSave} disabled={isSaving} />
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>계정</Text>
            <Text style={styles.sectionDescription}>기기를 바꾸거나 다른 계정으로 들어갈 때 로그아웃하세요.</Text>
            <View style={styles.accountRow}>
              <Button label="로그아웃" variant="text" onPress={handleLogout} />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 140,
    gap: space.xl,
  },
  heroCard: {
    paddingVertical: space.xxl,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
  },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: radii.full,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  heroText: {
    flex: 1,
  },
  title: {
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  description: {
    marginTop: space.xs,
    ...typo.body,
    color: surface.textSecondary,
  },
  heroMeta: {
    marginTop: space.sm,
    ...typo.caption,
    color: surface.textSecondary,
  },
  calendarCard: {
    paddingTop: space.xl,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  sectionDescription: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
  weekdayRow: {
    marginTop: space.lg,
    flexDirection: "row",
  },
  weekdayLabel: {
    width: "14.285714%",
    textAlign: "center",
    ...typo.caption,
    color: surface.textSecondary,
  },
  calendarGrid: {
    marginTop: space.md,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  calendarCell: {
    aspectRatio: 1,
    padding: space.xs / 2,
  },
  calendarCellInner: {
    flex: 1,
    borderRadius: radii.sm,
    backgroundColor: surface.fieldSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCellActive: {
    backgroundColor: surface.accentSolid,
  },
  calendarLabel: {
    ...typo.label,
    color: surface.textSecondary,
  },
  calendarLabelActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  historySectionCard: {
    paddingTop: space.xl,
  },
  historyList: {
    marginTop: space.lg,
    gap: space.sm,
  },
  historyCard: {
    borderRadius: radii.xl,
    backgroundColor: "#ffffff",
    padding: space.xl,
  },
  historyDate: {
    ...typo.caption,
    color: "#b87089",
  },
  historyTitle: {
    marginTop: space.sm,
    ...typo.label,
    color: surface.textPrimary,
  },
  historyBody: {
    marginTop: space.sm,
    ...typo.caption,
    color: "#776873",
  },
  form: {
    marginTop: space.lg,
    gap: space.md,
  },
  surveyList: {
    marginTop: space.lg,
    gap: space.md,
  },
  surveyCard: {
    borderRadius: radii.xl,
    backgroundColor: "#ffffff",
    padding: space.xl,
    ...shadows.card,
  },
  surveyQuestion: {
    ...typo.label,
    color: surface.textPrimary,
  },
  surveyHelp: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
  surveyForm: {
    marginTop: space.md,
    gap: space.md,
  },
  surveyChoiceRow: {
    marginTop: space.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  surveyChoice: {
    borderRadius: radii.full,
    backgroundColor: surface.surfaceAccent,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  surveyChoiceLabel: {
    ...typo.button,
    color: palette.accent,
  },
  accountRow: {
    marginTop: space.md,
  },
  errorText: {
    ...typo.caption,
    color: palette.errorText,
  },
});
