// @ts-nocheck
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RecordDayView } from "@gynecology-chatbot/app-core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import { createRecordDayActions } from "./PatientRecordDayScreen.model";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";
import { resolvePatientRecordDayLoadError } from "./patientErrorCopy.model";
import { prefetchConversationSession } from "./patientConversationNavigation.model";
import {
  confirmChecklistRequest,
  createChecklistSyncTracker,
  hydrateChecklistSyncTracker,
  rememberChecklistDesiredState,
  resolveChecklistRequest,
  rollbackChecklistRequest,
  updateRecordDayChecklistItems,
  type ChecklistSyncTracker,
} from "./PatientTodayScreen.helpers";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  shadows,
  space,
  typo,
} from "../../theme";

function resolveBackHref(returnTo?: string) {
  if (returnTo === "profile") {
    return "/(tabs)/profile";
  }

  if (returnTo === "notebook") {
    return "/notebook";
  }

  return "/(tabs)/home";
}

function resolveActiveTab(returnTo?: string) {
  if (returnTo === "profile") {
    return "profile";
  }

  return "home";
}

export function PatientRecordDayScreen({
  isoDate,
  returnTo,
}: {
  isoDate: string;
  returnTo?: string;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { homePort, todayPort, chatPort } = useMobileServices();
  const { replaceSession } = useChatSessions();
  const actions = useMemo(
    () => createRecordDayActions({ homePort, todayPort }),
    [homePort, todayPort],
  );
  const [recordDay, setRecordDay] = useState<RecordDayView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingChecklistIds, setPendingChecklistIds] = useState<string[]>([]);
  const checklistSyncRef = useRef<ChecklistSyncTracker>(
    createChecklistSyncTracker([]),
  );
  const pendingChecklistIdsRef = useRef<string[]>([]);
  const backHref = useMemo(() => resolveBackHref(returnTo), [returnTo]);
  const activeTab = useMemo(() => resolveActiveTab(returnTo), [returnTo]);
  const contentInsets = buildPatientTabContentInsets({
    bottomInset: insets.bottom,
    topSpacing: space.md,
  });

  useEffect(() => {
    pendingChecklistIdsRef.current = pendingChecklistIds;
  }, [pendingChecklistIds]);

  function openConversationSession(sessionId: string) {
    setError(null);
    router.push(`/chat/${sessionId}`);

    void prefetchConversationSession({
      sessionId,
      getSession: chatPort.getSession.bind(chatPort),
      replaceSession,
    }).catch(() => {
      // 채팅 화면 자체가 loadSessionDetail 로 재시도하므로 여기선 조용히 실패
    });
  }

  useEffect(() => {
    let cancelled = false;

    actions
      .loadRecordDay(isoDate)
      .then((nextRecordDay) => {
        if (!cancelled) {
          setRecordDay(nextRecordDay);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(resolvePatientRecordDayLoadError(nextError));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [actions, isoDate]);

  async function handleToggleChecklistItem(checklistId: string) {
    if (!recordDay || pendingChecklistIds.includes(checklistId)) {
      return;
    }

    const target = recordDay.checklistItems.find(
      (item) => item.id === checklistId,
    );
    if (!target) {
      return;
    }

    const nextCompleted = !target.completed;
    setPendingChecklistIds((current) => [...current, checklistId]);
    setRecordDay((current) =>
      current
        ? {
            ...current,
            checklistItems: current.checklistItems.map((item) =>
              item.id === checklistId
                ? { ...item, completed: nextCompleted }
                : item,
            ),
          }
        : current,
    );

    try {
      await actions.setChecklistItemCompleted({
        checklistId,
        completed: nextCompleted,
      });
    } catch {
      setRecordDay((current) =>
        current
          ? {
              ...current,
              checklistItems: current.checklistItems.map((item) =>
                item.id === checklistId
                  ? { ...item, completed: target.completed }
                  : item,
              ),
            }
          : current,
      );
    } finally {
      setPendingChecklistIds((current) =>
        current.filter((id) => id !== checklistId),
      );
    }
  }

  return (
    <PatientShell
      activeTab={activeTab}
      backHref={backHref}
      pageTone="plain"
      headerCompact
      showProfileButton={false}
    >
      <ScrollView
        contentContainerStyle={[styles.content, contentInsets]}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="muted">
          <Text style={styles.eyebrow}>하루 기록</Text>
          <Text style={styles.title}>{recordDay?.dateLabel ?? isoDate}</Text>
          <Text style={styles.description}>
            {error ?? "이 날짜의 체크와 대화를 한눈에 볼 수 있도록 모아봤어요."}
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>체크리스트</Text>
          <View style={styles.sectionList}>
            {recordDay && recordDay.checklistItems.length > 0 ? (
              recordDay.checklistItems.map((item) => (
                <Pressable
                  key={item.id}
                  style={[styles.recordCard, shadows.card]}
                  onPress={() => handleToggleChecklistItem(item.id)}
                  disabled={pendingChecklistIds.includes(item.id)}
                  accessibilityLabel={`${item.label} ${item.completed ? "완료됨" : "미완료"}`}
                >
                  <View style={styles.checklistRow}>
                    <View
                      style={[
                        styles.checkbox,
                        item.completed ? styles.checkboxCompleted : null,
                      ]}
                    />
                    <Text style={styles.recordTitle}>{item.label}</Text>
                  </View>
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>
                이 날짜에 예정된 체크 항목이 없어요.
              </Text>
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>대화</Text>
          <View style={styles.sectionList}>
            {recordDay && recordDay.relatedSessions.length > 0 ? (
              recordDay.relatedSessions.map((session) => (
                <Pressable
                  key={session.id}
                  style={[styles.recordCard, shadows.card]}
                  onPress={() => {
                    void openConversationSession(session.id);
                  }}
                >
                  <Text style={styles.recordType}>
                    {session.updatedAtLabel}
                  </Text>
                  <Text style={styles.recordTitle}>{session.title}</Text>
                  {session.preview ? (
                    <Text style={styles.recordSummary}>{session.preview}</Text>
                  ) : null}
                </Pressable>
              ))
            ) : (
              <Text style={styles.emptyText}>
                이 날짜에 남겨진 대화가 아직 없어요.
              </Text>
            )}
          </View>
        </Card>
      </ScrollView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    gap: space.sm,
  },
  eyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  title: {
    marginTop: space.sm,
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  description: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  sectionList: {
    marginTop: space.md,
    gap: space.xs,
  },
  recordCard: {
    borderRadius: radii.lg,
    backgroundColor: surface.surfacePrimary,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.xs,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: space.sm,
  },
  recordTitle: {
    ...typo.label,
    color: surface.textPrimary,
    flex: 1,
  },
  recordType: {
    ...typo.caption,
    color: palette.accent,
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
  recordSummary: {
    ...typo.body,
    color: surface.textSecondary,
  },
  emptyText: {
    ...typo.body,
    color: surface.textSecondary,
  },
});
