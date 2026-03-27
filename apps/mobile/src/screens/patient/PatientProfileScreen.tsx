// @ts-nocheck
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  CalendarDay,
  HomeViewData,
  MobileProfileViewData,
  RecordDayView,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import { Button, Card, LabeledInput, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientTodayTabs } from "../../components/patient/PatientTodayTabs";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";
import { buildProfileCalendarModel } from "./patientProfileCalendar";
import { getWeekBabyImageSource } from "./week-baby-images";
import { createMobileApiClient } from "../../api/mobileApi";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function isSameIsoDate(isoDate: string, now: Date) {
  const todayIsoDate = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  return isoDate === todayIsoDate;
}

function resolveChecklistStatus(recordDay: RecordDayView | null) {
  const checklistItems = recordDay?.checklistItems ?? [];

  if (checklistItems.length === 0) {
    return { label: "안함", tone: "idle" };
  }

  const completedCount = checklistItems.filter((item) => item.completed).length;

  if (completedCount === checklistItems.length) {
    return { label: "완료", tone: "success" };
  }

  return { label: "미완", tone: "muted" };
}

function resolveInfoStatus(selectedDay: CalendarDay | null, isToday: boolean) {
  if (isToday || selectedDay?.hasInfo || selectedDay?.summary) {
    return { label: "확인함", tone: "success" };
  }

  return { label: "안함", tone: "idle" };
}

function buildConversationSummary(recordDay: RecordDayView | null) {
  if (recordDay?.conversationSummary) {
    return recordDay.conversationSummary;
  }

  const sessions = recordDay?.relatedSessions ?? [];
  if (sessions.length === 0) {
    return "이 날짜에 남겨진 대화가 아직 없어요.";
  }

  return `${sessions.length}개의 대화가 있었어요. 다음 날 정리되는 하루 요약이 준비되면 여기에서 함께 보여드릴게요.`;
}

function buildHeartShareItems(recordDay: RecordDayView | null) {
  if (recordDay?.dailyQuestion) {
    return [
      {
        id: "question",
        question: recordDay.dailyQuestion.question,
        answer: recordDay.dailyQuestion.answer ?? "아직 남긴 답변이 없어요.",
        summary: recordDay.dailyQuestion.aiSummary ?? "대화 요약을 준비 중이에요.",
      },
    ];
  }

  const aiSummary = recordDay?.records.find((item) => item.entryType === "ai_summary");
  const linkedSession = recordDay?.relatedSessions[0] ?? null;

  if (!aiSummary && !linkedSession) {
    return [];
  }

  return [
    {
      id: "question",
      question: "하루 질문",
      answer: aiSummary?.title ?? "이날의 질문 기록을 준비 중이에요.",
      summary: aiSummary?.summary ?? linkedSession?.preview ?? "대화 요약을 준비 중이에요.",
    },
  ];
}

function hasConversation(recordDay: RecordDayView | null) {
  if (!recordDay) {
    return false;
  }

  if ((recordDay.relatedSessions?.length ?? 0) > 0) {
    return true;
  }

  if (recordDay.dailyQuestion?.answer || recordDay.dailyQuestion?.aiSummary) {
    return true;
  }

  return recordDay.records.some((item) => item.entryType === "ai_summary" || item.linkedSessionId);
}

function modalTabStyle(tone: string) {
  if (tone === "success") return styles.modalTabSuccess;
  if (tone === "active") return styles.modalTabConversation;
  if (tone === "muted") return styles.modalTabMuted;
  return styles.modalTabIdle;
}

function modalTabTextStyle(tone: string) {
  if (tone === "success") return styles.modalTabTextSuccess;
  if (tone === "active") return styles.modalTabTextConversation;
  if (tone === "muted") return styles.modalTabTextMuted;
  return styles.modalTabTextIdle;
}

function buildInfoCards(today: TodayViewData | null) {
  return [
    {
      id: "baby",
      title: "오늘 아기는요",
      body: today?.babyBody ?? "오늘 아기의 변화를 아직 준비하지 못했어요.",
    },
    {
      id: "mom",
      title: "오늘 엄마는요",
      body: today?.momBody ?? "오늘 엄마의 변화를 아직 준비하지 못했어요.",
    },
  ];
}

export function PatientProfileScreen() {
  const { currentUser, signOut } = useMobileAppSession();
  const { profilePort, homePort, todayPort } = useMobileServices();
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [today, setToday] = useState<TodayViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  const [submittingSurveyId, setSubmittingSurveyId] = useState<string | null>(null);
  const [surveyFormUrl, setSurveyFormUrl] = useState<string | null>(null);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);
  const [selectedRecordDay, setSelectedRecordDay] = useState<RecordDayView | null>(null);
  const [recordDayError, setRecordDayError] = useState<string | null>(null);
  const [modalSection, setModalSection] = useState("conversation");
  const [conversationSection, setConversationSection] = useState("summary");

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    Promise.all([profilePort.getProfile(), homePort.getHomeView(), todayPort.getTodayView()])
      .then(([nextProfile, nextHome, nextToday]) => {
        setProfile(nextProfile);
        setHome(nextHome);
        setToday(nextToday);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "내 정보를 불러오지 못했어요.");
      });
  }, [currentUser, homePort, profilePort, todayPort]);

  useEffect(() => {
    let isMounted = true;

    createMobileApiClient()
      .fetchMobileBranding()
      .then((branding) => {
        if (!isMounted) return;
        setSurveyFormUrl(branding.surveyFormUrl?.trim() || null);
      })
      .catch(() => {
        if (!isMounted) return;
        setSurveyFormUrl(null);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedIsoDate) {
      return;
    }

    let cancelled = false;
    setRecordDayError(null);

    homePort
      .getRecordDay(selectedIsoDate)
      .then((nextRecordDay) => {
        if (!cancelled) {
          setSelectedRecordDay(nextRecordDay);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setSelectedRecordDay(null);
          setRecordDayError(nextError instanceof Error ? nextError.message : "이 날짜 기록을 불러오지 못했어요.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [homePort, selectedIsoDate]);

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

  function openCalendarDay(isoDate: string) {
    setSelectedIsoDate(isoDate);
    setModalSection("conversation");
    setConversationSection("summary");
  }

  function closeCalendarDayModal() {
    setSelectedIsoDate(null);
    setSelectedRecordDay(null);
    setRecordDayError(null);
  }

  const calendarModel = useMemo(() => buildProfileCalendarModel(home?.calendarDays), [home?.calendarDays]);
  const isoDateByDay = useMemo(
    () => new Map((home?.calendarDays ?? []).map((day) => [Number(day.dayLabel), day.isoDate])),
    [home?.calendarDays],
  );
  const babyName = profile?.babyNickname?.trim() || "아기";
  const babyImageSource = getWeekBabyImageSource(profile?.pregnancyWeekLabel);
  const selectedDay = useMemo(
    () => (home?.calendarDays ?? []).find((day) => day.isoDate === selectedIsoDate) ?? null,
    [home?.calendarDays, selectedIsoDate],
  );
  const selectedIsToday = useMemo(
    () => (selectedIsoDate ? isSameIsoDate(selectedIsoDate, new Date()) : false),
    [selectedIsoDate],
  );
  const checklistStatus = useMemo(() => resolveChecklistStatus(selectedRecordDay), [selectedRecordDay]);
  const infoStatus = useMemo(
    () =>
      resolveInfoStatus(
        selectedRecordDay
          ? ({
              ...(selectedDay ?? {
                isoDate: selectedIsoDate ?? "",
                dayLabel: "",
                hasChat: false,
                hasInfo: false,
                emotionTone: null,
              }),
              hasInfo: selectedRecordDay.infoViewed,
            } as CalendarDay)
          : selectedDay,
        selectedIsToday,
      ),
    [selectedDay, selectedIsoDate, selectedIsToday, selectedRecordDay],
  );
  const conversationStatus = useMemo(
    () => ({
      label: hasConversation(selectedRecordDay) ? "했음" : "안함",
      tone: hasConversation(selectedRecordDay) ? "active" : "idle",
    }),
    [selectedRecordDay],
  );
  const infoCards = useMemo(() => buildInfoCards(today), [today]);
  const heartShareItems = useMemo(() => buildHeartShareItems(selectedRecordDay), [selectedRecordDay]);

  return (
    <PatientShell
      activeTab="profile"
      title="마이페이지"
      showProfileButton={false}
      pageTone="plain"
      rightActionIcon="settings-outline"
      rightActionLabel="정보 설정 열기"
      onRightActionPress={() => router.push("/profile-settings")}
    >
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
                ? `${home.currentMonthLabel}에 활동이 있었던 날을 눌러 하루 기록을 볼 수 있어요.`
                : "활동이 있었던 날을 한눈에 볼 수 있어요."}
            </Text>
            <View style={styles.weekdayRow}>
              {DAY_NAMES.map((label) => (
                <Text key={label} style={styles.weekdayLabel}>
                  {label}
                </Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarModel.gridDays.map((day, index) => {
                const isActive = day ? calendarModel.activeDays.has(day) : false;
                const isoDate = day ? isoDateByDay.get(day) : null;

                if (!day || !isoDate) {
                  return (
                    <View key={`day-${index}`} style={[styles.calendarCell, { width: calendarModel.columnWidth }]}>
                      <View style={styles.calendarCellInner}>
                        <Text style={styles.calendarLabel} />
                      </View>
                    </View>
                  );
                }

                return (
                  <Pressable
                    key={`day-${index}`}
                    style={[styles.calendarCell, { width: calendarModel.columnWidth }]}
                    onPress={() => openCalendarDay(isoDate)}
                    accessibilityLabel={`${day}일 기록 보기`}
                  >
                    <View style={[styles.calendarCellInner, isActive ? styles.calendarCellActive : null]}>
                      <Text style={[styles.calendarLabel, isActive ? styles.calendarLabelActive : null]}>{String(day)}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Card>

          <Card variant="muted">
            <Text style={styles.sectionTitle}>외부 설문</Text>
            <Text style={styles.sectionDescription}>
              운영팀이 준비한 구글 설문이 있을 때 여기에서 바로 열 수 있어요.
            </Text>
            <View style={styles.externalSurveyCard}>
              <Text style={styles.externalSurveyTitle}>설문으로 의견 들려주세요</Text>
              <Text style={styles.externalSurveyBody}>
                {surveyFormUrl
                  ? "새 창 없이 앱 안에서 바로 설문에 답할 수 있어요."
                  : "아직 열 수 있는 설문이 없어요. 준비되면 여기에서 안내해드릴게요."}
              </Text>
              <Button
                label="설문 열기"
                variant="secondary"
                onPress={() => router.push("/profile-survey")}
                disabled={!surveyFormUrl}
              />
            </View>

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
                        {survey.helpText ? <Text style={styles.surveyHelp}>{survey.helpText}</Text> : null}

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

      <Modal visible={Boolean(selectedIsoDate)} animationType="slide" presentationStyle="fullScreen" onRequestClose={closeCalendarDayModal}>
        <View style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Pressable style={styles.modalCloseButton} onPress={closeCalendarDayModal} accessibilityLabel="기록 상세 닫기">
              <Ionicons name="close" size={space.lg + space.sm} color={surface.textPrimary} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.modalHero}>
              <Text style={styles.modalTitle}>{selectedRecordDay?.dateLabel ?? selectedIsoDate ?? ""}</Text>
              <Text style={styles.modalDescription}>이 날의 활동 내역을 확인해요.</Text>
            </View>

            <View style={styles.modalTabRow}>
              <Pressable
                style={[styles.modalStatusTab, modalTabStyle(infoStatus.tone)]}
                onPress={() => {
                  closeCalendarDayModal();
                  router.replace("/today");
                }}
              >
                <View style={styles.modalStatusHeader}>
                  <Ionicons name="book-outline" size={space.lg + space.xs} color={modalTabTextStyle(infoStatus.tone).color} />
                  <Text style={[styles.modalStatusLabel, modalTabTextStyle(infoStatus.tone)]}>정보 확인</Text>
                </View>
                <Text style={[styles.modalStatusValue, modalTabTextStyle(infoStatus.tone)]}>{infoStatus.label}</Text>
              </Pressable>

              <Pressable
                style={[styles.modalStatusTab, modalTabStyle(checklistStatus.tone)]}
                onPress={() => setModalSection("checklist")}
              >
                <View style={styles.modalStatusHeader}>
                  <Ionicons name="checkmark-circle-outline" size={space.lg + space.xs} color={modalTabTextStyle(checklistStatus.tone).color} />
                  <Text style={[styles.modalStatusLabel, modalTabTextStyle(checklistStatus.tone)]}>체크리스트</Text>
                </View>
                <Text style={[styles.modalStatusValue, modalTabTextStyle(checklistStatus.tone)]}>{checklistStatus.label}</Text>
              </Pressable>

              <Pressable
                style={[styles.modalStatusTab, modalTabStyle(conversationStatus.tone)]}
                onPress={() => setModalSection("conversation")}
              >
                <View style={styles.modalStatusHeader}>
                  <Ionicons name="chatbubble-outline" size={space.lg + space.xs} color={modalTabTextStyle(conversationStatus.tone).color} />
                  <Text style={[styles.modalStatusLabel, modalTabTextStyle(conversationStatus.tone)]}>대화</Text>
                </View>
                <Text style={[styles.modalStatusValue, modalTabTextStyle(conversationStatus.tone)]}>{conversationStatus.label}</Text>
              </Pressable>
            </View>

            {modalSection === "checklist" ? (
              <Card>
                <Text style={styles.modalSectionTitle}>체크리스트</Text>
                <Text style={styles.modalSectionDescription}>
                  {selectedIsToday ? "오늘 체크 흐름으로 이어서 볼 수 있어요." : "지난 날짜 기록은 확인만 할 수 있어요."}
                </Text>
                <View style={styles.modalChecklistList}>
                  {(selectedRecordDay?.checklistItems ?? []).map((item) => (
                    <View key={item.id} style={[styles.modalChecklistCard, shadows.card]}>
                      <View style={[styles.modalCheckbox, item.completed ? styles.modalCheckboxChecked : null]} />
                      <Text style={styles.modalChecklistLabel}>{item.label}</Text>
                    </View>
                  ))}
                  {(selectedRecordDay?.checklistItems?.length ?? 0) === 0 ? (
                    <Text style={styles.modalEmptyText}>이 날짜에 남아 있는 체크리스트가 없어요.</Text>
                  ) : null}
                </View>
              </Card>
            ) : null}

            {modalSection === "conversation" ? (
              <Card>
                <Text style={styles.modalSectionTitle}>대화</Text>
                <PatientTodayTabs
                  sections={[
                    { id: "summary", label: "대화 요약" },
                    { id: "heart", label: "아기와 나누는 마음" },
                  ]}
                  activeSection={conversationSection}
                  onChange={setConversationSection}
                />

                {conversationSection === "summary" ? (
                  <View style={styles.modalPanel}>
                    <Text style={styles.modalSummaryText}>{buildConversationSummary(selectedRecordDay)}</Text>
                    {(selectedRecordDay?.relatedSessions ?? []).map((session) => (
                      <View key={session.id} style={[styles.modalConversationCard, shadows.card]}>
                        <Text style={styles.modalConversationMeta}>{session.updatedAtLabel}</Text>
                        <Text style={styles.modalConversationTitle}>{session.title}</Text>
                        <Text style={styles.modalConversationBody}>{session.preview}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                {conversationSection === "heart" ? (
                  <View style={styles.modalPanel}>
                    {heartShareItems.map((item) => (
                      <View key={item.id} style={styles.modalQnaCard}>
                        <Text style={styles.modalQuestion}>Q. {item.question}</Text>
                        <Text style={styles.modalAnswer}>A. {item.answer}</Text>
                        <View style={styles.modalAiResponse}>
                          <Text style={styles.modalAiTitle}>AI 응답</Text>
                          <Text style={styles.modalAiBody}>{item.summary}</Text>
                        </View>
                      </View>
                    ))}
                    {heartShareItems.length === 0 ? (
                      <Text style={styles.modalEmptyText}>이 날짜에 보여드릴 대화 요약이 아직 없어요.</Text>
                    ) : null}
                  </View>
                ) : null}
              </Card>
            ) : null}

            {modalSection === "info" ? (
              <Card>
                <Text style={styles.modalSectionTitle}>정보 확인</Text>
                <Text style={styles.modalSectionDescription}>오늘,우리에서 아기와 엄마의 정보를 다시 확인할 수 있어요.</Text>
                <View style={styles.modalInfoList}>
                  {infoCards.map((item) => (
                    <View key={item.id} style={[styles.modalInfoCard, shadows.card]}>
                      <Text style={styles.modalInfoTitle}>{item.title}</Text>
                      <Text style={styles.modalInfoBody}>{item.body}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  label="오늘,우리로 이동"
                  onPress={() => {
                    closeCalendarDayModal();
                    router.replace("/today");
                  }}
                />
              </Card>
            ) : null}

            {recordDayError ? <Text style={styles.errorText}>{recordDayError}</Text> : null}
          </ScrollView>
        </View>
      </Modal>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.md,
    paddingBottom: 140,
    gap: space.lg,
  },
  heroCard: {
    paddingVertical: space.xl,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
  },
  avatarCircle: {
    width: space.xxxl * 2 + space.xl,
    height: space.xxxl * 2 + space.xl,
    borderRadius: radii.full,
    backgroundColor: surface.fieldSurface,
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
    color: surface.surfacePrimary,
    fontWeight: "700",
  },
  externalSurveyCard: {
    marginTop: space.lg,
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.lg,
    gap: space.sm,
    ...shadows.card,
  },
  externalSurveyTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  externalSurveyBody: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  surveyList: {
    marginTop: space.lg,
    gap: space.md,
    marginBottom: space.xl,
  },
  surveyCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.lg,
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
    alignItems: "flex-start",
  },
  errorText: {
    ...typo.caption,
    color: palette.errorText,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: surface.surfacePrimary,
    paddingTop: space.xl,
  },
  modalHeader: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    alignItems: "flex-start",
  },
  modalCloseButton: {
    width: space.xxxl + space.md,
    height: space.xxxl + space.xs,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceSecondary,
  },
  modalContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxxl,
    gap: space.lg,
  },
  modalHero: {
    gap: space.xs,
  },
  modalTitle: {
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  modalDescription: {
    ...typo.body,
    color: surface.textSecondary,
  },
  modalTabRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  modalStatusTab: {
    flex: 1,
    borderRadius: radii.xl,
    paddingHorizontal: space.md,
    paddingVertical: space.lg,
    gap: space.sm,
  },
  modalStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  modalStatusLabel: {
    ...typo.label,
  },
  modalStatusValue: {
    ...typo.titleSm,
  },
  modalTabSuccess: {
    backgroundColor: palette.successBackground,
  },
  modalTabConversation: {
    backgroundColor: surface.surfaceSecondary,
  },
  modalTabMuted: {
    backgroundColor: surface.surfaceSecondary,
  },
  modalTabIdle: {
    backgroundColor: surface.surfaceSecondary,
  },
  modalTabTextSuccess: {
    color: palette.successText,
  },
  modalTabTextConversation: {
    color: palette.accent,
  },
  modalTabTextMuted: {
    color: surface.textSecondary,
  },
  modalTabTextIdle: {
    color: surface.textSecondary,
  },
  modalSectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
    marginBottom: space.xs,
  },
  modalSectionDescription: {
    ...typo.caption,
    color: surface.textSecondary,
    marginBottom: space.lg,
  },
  modalChecklistList: {
    gap: space.sm,
  },
  modalChecklistCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  modalCheckbox: {
    width: space.xl + space.xs,
    height: space.xl + space.xs,
    borderRadius: radii.sm,
    backgroundColor: surface.fieldSurface,
  },
  modalCheckboxChecked: {
    backgroundColor: palette.accent,
  },
  modalChecklistLabel: {
    ...typo.body,
    color: surface.textPrimary,
    flex: 1,
  },
  modalEmptyText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  modalPanel: {
    marginTop: space.lg,
    gap: space.sm,
  },
  modalSummaryText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  modalConversationCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
    gap: space.sm,
  },
  modalConversationMeta: {
    ...typo.caption,
    color: palette.accent,
  },
  modalConversationTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  modalConversationBody: {
    ...typo.body,
    color: surface.textSecondary,
  },
  modalQnaCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
    gap: space.sm,
  },
  modalQuestion: {
    ...typo.label,
    color: palette.accent,
  },
  modalAnswer: {
    ...typo.body,
    color: surface.textPrimary,
  },
  modalAiResponse: {
    borderRadius: radii.lg,
    backgroundColor: surface.surfaceSecondary,
    padding: space.lg,
    gap: space.xs,
  },
  modalAiTitle: {
    ...typo.label,
    color: palette.accent,
  },
  modalAiBody: {
    ...typo.body,
    color: surface.textSecondary,
  },
  modalInfoList: {
    gap: space.sm,
    marginBottom: space.lg,
  },
  modalInfoCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
    gap: space.sm,
  },
  modalInfoTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  modalInfoBody: {
    ...typo.body,
    color: surface.textSecondary,
  },
});
