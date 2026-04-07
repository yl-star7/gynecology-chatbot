// @ts-nocheck
import { useRouter } from "expo-router";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  CalendarDay,
  HomeViewData,
  MobileProfileViewData,
  RecordDayView,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import { Button, Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientTodayTabs } from "../../components/patient/PatientTodayTabs";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  shadows,
  space,
  typo,
} from "../../theme";
import { buildProfileCalendarModel } from "./patientProfileCalendar";
import { getWeekBabyImageSource } from "./week-baby-images";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";
import {
  buildProfileDayState,
  buildProfileInfoCards,
  resolveProfileBabyImageWeekLabel,
} from "./PatientProfileScreen.model";
import {
  resolvePatientProfileLoadError,
  resolvePatientRecordDayLoadError,
} from "./patientErrorCopy.model";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

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

export function PatientProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, signOut } = useMobileAppSession();
  const { profilePort, homePort, todayPort } = useMobileServices();
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [today, setToday] = useState<TodayViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [surveyFormUrl, setSurveyFormUrl] = useState<string | null>(null);
  const [selectedIsoDate, setSelectedIsoDate] = useState<string | null>(null);
  const [selectedRecordDay, setSelectedRecordDay] =
    useState<RecordDayView | null>(null);
  const [recordDayError, setRecordDayError] = useState<string | null>(null);
  const [modalSection, setModalSection] = useState("conversation");
  const [conversationSection, setConversationSection] = useState("summary");

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    Promise.all([
      profilePort.getProfile(),
      homePort.getHomeView(),
      todayPort.getTodayView(),
    ])
      .then(([nextProfile, nextHome, nextToday]) => {
        setProfile(nextProfile);
        setHome(nextHome);
        setToday(nextToday);
      })
      .catch((nextError) => {
        setError(resolvePatientProfileLoadError(nextError));
      });
  }, [currentUser, homePort, profilePort, todayPort]);

  useEffect(() => {
    let isMounted = true;

    profilePort
      .getBranding()
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
  }, [profilePort]);

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
          setRecordDayError(resolvePatientRecordDayLoadError(nextError));
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

  const calendarModel = useMemo(
    () => buildProfileCalendarModel(home?.calendarDays),
    [home?.calendarDays],
  );
  const isoDateByDay = useMemo(
    () => calendarModel.isoDateByDay,
    [calendarModel],
  );
  const babyName = profile?.babyNickname?.trim() || "아기";
  const babyImageSource = getWeekBabyImageSource(
    resolveProfileBabyImageWeekLabel({
      homePregnancyWeekLabel: home?.pregnancyWeekLabel,
      profilePregnancyWeekLabel: profile?.pregnancyWeekLabel,
      dueDate: profile?.dueDate,
    }),
  );
  const selectedDay = useMemo(
    () =>
      (home?.calendarDays ?? []).find(
        (day) => day.isoDate === selectedIsoDate,
      ) ?? null,
    [home?.calendarDays, selectedIsoDate],
  );
  const dayState = useMemo(
    () =>
      buildProfileDayState({
        selectedIsoDate,
        selectedDay,
        selectedRecordDay,
        hasRecordDayError: Boolean(recordDayError),
      }),
    [recordDayError, selectedDay, selectedIsoDate, selectedRecordDay],
  );
  const { selectedIsToday, checklistStatus, infoStatus, conversationStatus } =
    dayState;
  const infoCards = useMemo(
    () =>
      buildProfileInfoCards({
        today,
        recordDay: selectedRecordDay,
      }),
    [selectedRecordDay, today],
  );
  const heartShareItems = useMemo(() => dayState.heartShareItems, [dayState]);
  const contentInsets = buildPatientTabContentInsets({
    bottomInset: insets.bottom,
    extraBottomSpacing: 0,
    topSpacing: space.xs,
  });

  return (
    <PatientShell
      activeTab="profile"
      title="마이페이지"
      showProfileButton={false}
      pageTone="plain"
      headerCompact
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: contentInsets.paddingTop,
              paddingBottom: contentInsets.paddingBottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.heroCard}>
            <Pressable
              style={styles.heroSettingsButton}
              onPress={() => router.push("/profile-settings")}
              accessibilityLabel="정보 설정 열기"
            >
              <Ionicons
                name="settings-outline"
                size={space.lg + space.sm}
                color={surface.textPrimary}
              />
            </Pressable>
            <View style={styles.heroRow}>
              <View style={styles.avatarCircle}>
                <Image
                  source={babyImageSource}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.title}>{babyName}</Text>
                <Text style={styles.description}>
                  {profile
                    ? `${profile.pregnancyWeekLabel} · 임신 ${profile.pregnancyDayCount}일째예요.`
                    : "아기와 함께한 시간을 정리해보세요."}
                </Text>
                <Text style={styles.heroMeta}>
                  {profile?.dueDate
                    ? `예정일 ${profile.dueDate}`
                    : "출산 예정일을 입력하면 더 정확히 보여드려요."}
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
                const isActive = day
                  ? calendarModel.activeDays.has(day)
                  : false;
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
                    onPress={() => openCalendarDay(isoDate)}
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

          <Card variant="muted">
            <Text style={styles.sectionTitle}>외부 설문</Text>
            <Text style={styles.sectionDescription}>
              운영팀이 준비한 구글 설문이 있을 때 여기에서 바로 열 수 있어요.
            </Text>
            <View style={styles.externalSurveyCard}>
              <Text style={styles.externalSurveyTitle}>
                설문으로 의견 들려주세요
              </Text>
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

          </Card>

          <Card>
            <Text style={styles.sectionTitle}>계정</Text>
            <Text style={styles.sectionDescription}>
              기기를 바꾸거나 다른 계정으로 로그인할 때만 로그아웃해요.
            </Text>
            <View style={styles.accountRow}>
              <Button label="로그아웃" variant="text" onPress={handleLogout} />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={Boolean(selectedIsoDate)}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={closeCalendarDayModal}
      >
        <View style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Pressable
              style={styles.modalCloseButton}
              onPress={closeCalendarDayModal}
              accessibilityLabel="기록 상세 닫기"
            >
              <Ionicons
                name="close"
                size={space.lg + space.sm}
                color={surface.textPrimary}
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modalHero}>
              <Text style={styles.modalTitle}>
                {selectedRecordDay?.dateLabel ?? selectedIsoDate ?? ""}
              </Text>
              <Text style={styles.modalDescription}>
                이 날의 활동 내역을 확인해요.
              </Text>
            </View>

            <View style={styles.modalTabRow}>
              <Pressable
                style={[styles.modalStatusTab, modalTabStyle(infoStatus.tone)]}
                onPress={() => {
                  closeCalendarDayModal();
                  router.navigate("/(tabs)/today");
                }}
              >
                <View style={styles.modalStatusHeader}>
                  <Ionicons
                    name="book-outline"
                    size={space.lg + space.xs}
                    color={modalTabTextStyle(infoStatus.tone).color}
                  />
                  <Text
                    style={[
                      styles.modalStatusLabel,
                      modalTabTextStyle(infoStatus.tone),
                    ]}
                  >
                    정보 확인
                  </Text>
                </View>
                <Text
                  style={[
                    styles.modalStatusValue,
                    modalTabTextStyle(infoStatus.tone),
                  ]}
                >
                  {infoStatus.label}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalStatusTab,
                  modalTabStyle(checklistStatus.tone),
                ]}
                onPress={() => setModalSection("checklist")}
              >
                <View style={styles.modalStatusHeader}>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={space.lg + space.xs}
                    color={modalTabTextStyle(checklistStatus.tone).color}
                  />
                  <Text
                    style={[
                      styles.modalStatusLabel,
                      modalTabTextStyle(checklistStatus.tone),
                    ]}
                  >
                    체크리스트
                  </Text>
                </View>
                <Text
                  style={[
                    styles.modalStatusValue,
                    modalTabTextStyle(checklistStatus.tone),
                  ]}
                >
                  {checklistStatus.label}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalStatusTab,
                  modalTabStyle(conversationStatus.tone),
                ]}
                onPress={() => setModalSection("conversation")}
              >
                <View style={styles.modalStatusHeader}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={space.lg + space.xs}
                    color={modalTabTextStyle(conversationStatus.tone).color}
                  />
                  <Text
                    style={[
                      styles.modalStatusLabel,
                      modalTabTextStyle(conversationStatus.tone),
                    ]}
                  >
                    대화
                  </Text>
                </View>
                <Text
                  style={[
                    styles.modalStatusValue,
                    modalTabTextStyle(conversationStatus.tone),
                  ]}
                >
                  {conversationStatus.label}
                </Text>
              </Pressable>
            </View>

            {modalSection === "checklist" ? (
              <Card>
                <Text style={styles.modalSectionTitle}>체크리스트</Text>
                <Text style={styles.modalSectionDescription}>
                  {selectedIsToday
                    ? "오늘 체크 흐름으로 이어서 볼 수 있어요."
                    : "지난 날짜 기록은 확인만 할 수 있어요."}
                </Text>
                <View style={styles.modalChecklistList}>
                  {(selectedRecordDay?.checklistItems ?? []).map((item) => (
                    <View
                      key={item.id}
                      style={[styles.modalChecklistCard, shadows.card]}
                    >
                      <View
                        style={[
                          styles.modalCheckbox,
                          item.completed ? styles.modalCheckboxChecked : null,
                        ]}
                      />
                      <Text style={styles.modalChecklistLabel}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                  {(selectedRecordDay?.checklistItems?.length ?? 0) === 0 ? (
                    <Text style={styles.modalEmptyText}>
                      이 날짜에 남아 있는 체크리스트가 없어요.
                    </Text>
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
                    <Text style={styles.modalSummaryText}>
                      {dayState.conversationSummary}
                    </Text>
                    {(selectedRecordDay?.relatedSessions ?? []).map(
                      (session) => (
                        <View
                          key={session.id}
                          style={[styles.modalConversationCard, shadows.card]}
                        >
                          <Text style={styles.modalConversationMeta}>
                            {session.updatedAtLabel}
                          </Text>
                          <Text style={styles.modalConversationTitle}>
                            {session.title}
                          </Text>
                          <Text style={styles.modalConversationBody}>
                            {session.preview}
                          </Text>
                        </View>
                      ),
                    )}
                  </View>
                ) : null}

                {conversationSection === "heart" ? (
                  <View style={styles.modalPanel}>
                    {heartShareItems.map((item) => (
                      <View key={item.id} style={styles.modalQnaCard}>
                        <Text style={styles.modalQuestion}>
                          Q. {item.question}
                        </Text>
                        <Text style={styles.modalAnswer}>A. {item.answer}</Text>
                        <View style={styles.modalAiResponse}>
                          <Text style={styles.modalAiTitle}>AI 응답</Text>
                          <Text style={styles.modalAiBody}>{item.summary}</Text>
                        </View>
                      </View>
                    ))}
                    {heartShareItems.length === 0 ? (
                      <Text style={styles.modalEmptyText}>
                        이 날짜에 보여드릴 대화 요약이 아직 없어요.
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </Card>
            ) : null}

            {modalSection === "info" ? (
              <Card>
                <Text style={styles.modalSectionTitle}>정보 확인</Text>
                <Text style={styles.modalSectionDescription}>
                  오늘 우리에서 아기와 엄마의 정보를 다시 확인할 수 있어요.
                </Text>
                <View style={styles.modalInfoList}>
                  {infoCards.map((item) => (
                    <View
                      key={item.id}
                      style={[styles.modalInfoCard, shadows.card]}
                    >
                      <Text style={styles.modalInfoTitle}>{item.title}</Text>
                      <Text style={styles.modalInfoBody}>{item.body}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  label="오늘,우리로 이동"
                  onPress={() => {
                    closeCalendarDayModal();
                    router.navigate("/(tabs)/today");
                  }}
                />
              </Card>
            ) : null}

            {recordDayError ? (
              <Text style={styles.errorText}>{recordDayError}</Text>
            ) : null}
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
    gap: space.lg,
  },
  heroCard: {
    paddingVertical: space.xl,
    position: "relative",
  },
  heroSettingsButton: {
    position: "absolute",
    top: space.md,
    right: space.md,
    width: space.xxxl + space.md,
    height: space.xxxl + space.md,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceSecondary,
    zIndex: 1,
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
