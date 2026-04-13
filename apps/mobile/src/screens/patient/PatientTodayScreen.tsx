// @ts-nocheck
import { useEffect, useState } from "react";
import type {
  RecentChatSummary,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Card, Pressable } from "../../components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientTodayTabs } from "../../components/patient/PatientTodayTabs";
import { useMobileServices } from "../../core/MobileServicesProvider";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";
import { buildPatientTodayViewModel } from "./view-models";

const QUICK_STARTERS = [
  "안녕, 아가야",
  "오늘 태동을 느꼈어",
  "잠을 잘 못 자",
  "배가 자주 뭉쳐",
];

export function PatientTodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const services = useMobileServices();
  const [today, setToday] = useState<TodayViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [activeSection, setActiveSection] = useState("info");
  const contentInsets = buildPatientTabContentInsets({
    bottomInset: insets.bottom,
    extraBottomSpacing:
      activeSection === "conversation" ? space.xxxl : space.lg,
    topSpacing: space.xs,
  });

  useEffect(() => {
    Promise.all([
      services.todayPort.getTodayView(),
      services.chatPort.listRecentChats(),
    ])
      .then(([nextToday, nextRecentSessions]) => {
        setToday(nextToday);
        setRecentSessions(nextRecentSessions);
      })
      .catch(() => undefined);
  }, [services]);

  useEffect(() => {
    if (activeSection !== "info" || today?.infoViewed) {
      return;
    }

    services.todayPort
      .markInfoViewed()
      .then(() => {
        setToday((current) =>
          current ? { ...current, infoViewed: true } : current,
        );
      })
      .catch(() => undefined);
  }, [activeSection, services, today?.infoViewed]);

  const viewModel = buildPatientTodayViewModel({
    today,
  });

  return (
    <PatientShell
      activeTab="today"
      title="오늘,우리"
      pageTone="plain"
      headerCompact
      showProfileButton={false}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={space.xxxl + space.xl}
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
          <PatientTodayTabs
            sections={viewModel.sections}
            activeSection={activeSection}
            onChange={setActiveSection}
          />

          {activeSection === "info" ? (
            <Card style={styles.segmentCard}>
              <View style={styles.segmentSection}>
                <View style={styles.iconTitleRow}>
                  <View style={[styles.sectionIconWrap, styles.babyIconWrap]}>
                    <Ionicons
                      name="happy-outline"
                      size={space.lg + space.xs}
                      color={palette.accent}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>
                    {viewModel.babyCard.title}
                  </Text>
                </View>
                <View style={[styles.innerPanel, styles.babyPanel]}>
                  <Text style={styles.sectionBody}>
                    {viewModel.babyCard.body}
                  </Text>
                </View>
              </View>

              <View style={styles.segmentDivider} />

              <View style={styles.segmentSection}>
                <View style={styles.iconTitleRow}>
                  <View style={[styles.sectionIconWrap, styles.momIconWrap]}>
                    <Ionicons
                      name="heart-outline"
                      size={space.lg + space.xs}
                      color={palette.accent}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>
                    {viewModel.momCard.title}
                  </Text>
                </View>
                <View style={[styles.innerPanel, styles.momPanel]}>
                  <Text style={styles.sectionBody}>
                    {viewModel.momCard.body}
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}

          {activeSection === "checklist" ? (
            <Card style={styles.segmentCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconTitleRow}>
                  <View
                    style={[styles.sectionIconWrap, styles.checklistIconWrap]}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={space.lg + space.xs}
                      color={palette.successText}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>
                    {viewModel.checklistTitle}
                  </Text>
                </View>
              </View>

              <View style={styles.checklist}>
                {viewModel.checklistItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.checklistRow}
                    onPress={() =>
                      services.todayPort
                        .setChecklistItemCompleted({
                          checklistId: item.id,
                          completed: !item.completed,
                        })
                        .then(() =>
                          setToday((current) =>
                            current
                              ? {
                                  ...current,
                                  checklistItems: current.checklistItems.map(
                                    (currentItem) =>
                                      currentItem.id === item.id
                                        ? {
                                            ...currentItem,
                                            completed: !currentItem.completed,
                                          }
                                        : currentItem,
                                  ),
                                }
                              : current,
                          ),
                        )
                        .catch(() => undefined)
                    }
                    accessibilityLabel={`${item.label} ${item.completed ? "완료됨" : "미완료"}`}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        item.completed ? styles.checkboxCompleted : null,
                      ]}
                    />
                    <Text style={styles.checklistLabel}>{item.label}</Text>
                  </Pressable>
                ))}
                {viewModel.checklistItems.length === 0 ? (
                  <Text style={styles.emptyChecklistText}>
                    오늘 체크리스트를 준비 중이에요.
                  </Text>
                ) : null}
              </View>

              <View style={styles.progressMetaRow}>
                <Text style={styles.progressMetaLabel}>완료율</Text>
                <Text
                  style={styles.progressPercent}
                >{`${viewModel.checklistProgressPercent}%`}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${viewModel.checklistProgressPercent}%` },
                  ]}
                />
              </View>
            </Card>
          ) : null}

          {activeSection === "conversation" ? (
            <Card style={[styles.segmentCard, styles.conversationLauncherCard]}>
              <View style={styles.conversationLauncherHeader}>
                <Text style={styles.sectionTitle}>
                  {viewModel.conversationTitle}
                </Text>
                <Pressable
                  style={styles.openChatButton}
                  onPress={() => router.push("/chat/new")}
                  accessibilityLabel="새 채팅 열기"
                >
                  <Text style={styles.openChatButtonText}>새 채팅</Text>
                </Pressable>
              </View>

              <Text style={styles.emptyText}>
                {viewModel.conversationDescription}
              </Text>

              <View style={styles.quickStarterWrap}>
                {QUICK_STARTERS.map((starter) => (
                  <Pressable
                    key={starter}
                    style={styles.quickStarterChip}
                    onPress={() => router.push("/chat/new")}
                  >
                    <Text style={styles.quickStarterText}>{starter}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.recentSessionList}>
                {recentSessions.length > 0 ? (
                  recentSessions.slice(0, 3).map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.recentSessionCard}
                      onPress={() => router.push(`/chat/${item.id}`)}
                    >
                      <Text style={styles.recentSessionTitle}>
                        {item.title}
                      </Text>
                      {item.preview ? (
                        <Text
                          style={styles.recentSessionPreview}
                          numberOfLines={1}
                        >
                          {item.preview}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.recentSessionEmptyText}>
                    이어볼 대화가 아직 없어요.
                  </Text>
                )}
              </View>
            </Card>
          ) : null}
        </ScrollView>

        {activeSection === "conversation" &&
        (!today || today.babyBody === "오늘 아기의 변화를 준비 중이에요.") ? (
          <Card variant="muted" style={styles.conversationComposerCard}>
            <Pressable
              style={styles.onboardingNudge}
              onPress={() => router.push("/onboarding")}
            >
              <Text style={styles.onboardingNudgeText}>
                내 정보를 등록하면 주차별 맞춤 상담을 받을 수 있어요
              </Text>
            </Pressable>
          </Card>
        ) : null}
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.lg,
    gap: space.sm,
    flexGrow: 1,
  },
  segmentCard: {
    gap: space.sm,
    padding: space.md,
  },
  segmentSection: {
    gap: space.md,
  },
  segmentDivider: {
    height: 1,
    backgroundColor: surface.strokeSubtle,
  },
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  sectionIconWrap: {
    width: space.xxl + space.xs,
    height: space.xxl + space.xs,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  babyIconWrap: {
    backgroundColor: surface.surfaceAccent,
  },
  momIconWrap: {
    backgroundColor: surface.surfaceSecondary,
  },
  checklistIconWrap: {
    backgroundColor: palette.successBackground,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  innerPanel: {
    borderRadius: radii.xl,
    padding: space.lg,
  },
  babyPanel: {
    backgroundColor: surface.surfaceAccent,
  },
  momPanel: {
    backgroundColor: surface.surfaceSecondary,
  },
  sectionBody: {
    ...typo.body,
    color: surface.textSecondary,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  checklist: {
    marginTop: space.lg,
    gap: space.lg,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  checkbox: {
    width: space.xl + space.xs,
    height: space.xl + space.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    backgroundColor: surface.fieldSurface,
  },
  checkboxCompleted: {
    backgroundColor: palette.successBackground,
    borderColor: palette.successText,
  },
  checklistLabel: {
    ...typo.titleSm,
    color: surface.textPrimary,
    flex: 1,
  },
  emptyChecklistText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  progressMetaRow: {
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: surface.strokeSubtle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressMetaLabel: {
    ...typo.label,
    color: surface.textSecondary,
  },
  progressPercent: {
    ...typo.titleSm,
    color: palette.successText,
  },
  progressTrack: {
    marginTop: space.md,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: surface.strokeSubtle,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: palette.successText,
  },
  conversationLauncherCard: {
    gap: space.md,
  },
  conversationLauncherHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  openChatButton: {
    borderRadius: radii.full,
    backgroundColor: palette.accentSoft,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  openChatButtonText: {
    ...typo.label,
    color: palette.accent,
  },
  conversationComposerCard: {
    marginTop: "auto",
    marginHorizontal: space.lg,
    marginBottom: 0,
  },
  emptyText: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
    paddingHorizontal: space.md,
  },
  quickStarterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space.xs,
    paddingHorizontal: 0,
  },
  quickStarterChip: {
    backgroundColor: palette.accentSoft,
    borderRadius: radii.full,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + space.xs,
  },
  quickStarterText: {
    ...typo.label,
    color: palette.accent,
  },
  recentSessionList: {
    gap: space.xs,
  },
  recentSessionCard: {
    gap: space.xs,
    borderRadius: radii.lg,
    backgroundColor: surface.surfaceSecondary,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  recentSessionTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  recentSessionPreview: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  recentSessionEmptyText: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
  },
  onboardingNudge: {
    backgroundColor: surface.surfaceAccent,
    borderRadius: radii.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    marginBottom: space.sm,
  },
  onboardingNudgeText: {
    ...typo.caption,
    color: palette.accent,
    textAlign: "center",
  },
});
