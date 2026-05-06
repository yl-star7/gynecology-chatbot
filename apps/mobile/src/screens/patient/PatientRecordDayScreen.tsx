// @ts-nocheck
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { RecordDayView } from "@gynecology-chatbot/app-core";
import {
  InteractionManager,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import { createRecordDayActions } from "./PatientRecordDayScreen.model";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";
import { formatQuestionAnswerSummary } from "./patientQuestionSummary.model";
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
  const isOpeningConversationRef = useRef(false);
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
    if (isOpeningConversationRef.current) {
      return;
    }

    isOpeningConversationRef.current = true;
    setError(null);
    const prefetch = prefetchConversationSession({
      sessionId,
      getSession: chatPort.getSession.bind(chatPort),
      replaceSession,
    }).catch(() => {
      // 채팅 화면 자체가 loadSessionDetail 로 재시도하므로 여기선 조용히 실패
    });

    requestAnimationFrame(() => {
      InteractionManager.runAfterInteractions(() => {
        router.push(`/chat/${sessionId}?readOnly=1`);
        void prefetch.finally(() => {
          setTimeout(() => {
            isOpeningConversationRef.current = false;
          }, 400);
        });
      });
    });
  }

  useEffect(() => {
    let cancelled = false;

    actions
      .loadRecordDay(isoDate)
      .then((nextRecordDay) => {
        if (!cancelled) {
          setRecordDay(nextRecordDay);
          hydrateChecklistSyncTracker(
            checklistSyncRef.current,
            nextRecordDay.checklistItems,
          );
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

  function handleToggleChecklistItem(checklistId: string) {
    if (!recordDay) {
      return;
    }

    const target = recordDay.checklistItems.find(
      (item) => item.id === checklistId,
    );
    if (!target) {
      return;
    }

    const nextCompleted = !target.completed;
    rememberChecklistDesiredState(
      checklistSyncRef.current,
      checklistId,
      nextCompleted,
    );
    setRecordDay((current) => {
      if (!current) {
        return current;
      }

      const nextRecordDay = updateRecordDayChecklistItems(
        current,
        checklistId,
        nextCompleted,
      );
      return nextRecordDay ?? current;
    });

    if (pendingChecklistIdsRef.current.includes(checklistId)) {
      return;
    }

    const request = resolveChecklistRequest(
      checklistSyncRef.current,
      checklistId,
    );
    if (!request) {
      return;
    }

    pendingChecklistIdsRef.current = [
      ...pendingChecklistIdsRef.current,
      checklistId,
    ];
    setPendingChecklistIds((current) => [...current, checklistId]);
    void actions
      .setChecklistItemCompleted(request)
      .then(() => {
        confirmChecklistRequest(
          checklistSyncRef.current,
          checklistId,
          request.completed,
        );
      })
      .catch(() => {
        const rollbackCompleted = rollbackChecklistRequest(
          checklistSyncRef.current,
          checklistId,
        );
        setRecordDay((current) => {
          if (!current) {
            return current;
          }

          const nextRecordDay = updateRecordDayChecklistItems(
            current,
            checklistId,
            rollbackCompleted,
          );
          return nextRecordDay ?? current;
        });
      })
      .finally(() => {
        pendingChecklistIdsRef.current = pendingChecklistIdsRef.current.filter(
          (id) => id !== checklistId,
        );
        setPendingChecklistIds((current) =>
          current.filter((id) => id !== checklistId),
        );

        const nextRequest = resolveChecklistRequest(
          checklistSyncRef.current,
          checklistId,
        );
        if (nextRequest) {
          handleToggleChecklistItem(checklistId);
        }
      });
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
          <Text style={styles.sectionTitle}>날짜 질문</Text>
          <View style={styles.sectionList}>
            {recordDay && (recordDay.dailyQuestions?.length ?? 0) > 0 ? (
              recordDay.dailyQuestions?.map((item) => (
                <View key={item.id} style={[styles.recordCard, shadows.card]}>
                  <Text style={styles.recordType}>날짜 질문</Text>
                  <Text style={styles.recordTitle}>{item.question}</Text>
                  <Text style={styles.recordSummary}>
                    {formatQuestionAnswerSummary(item.answerSummary)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>
                이 날짜에 보여드릴 질문이 아직 없어요.
              </Text>
            )}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>대화 기록</Text>
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
