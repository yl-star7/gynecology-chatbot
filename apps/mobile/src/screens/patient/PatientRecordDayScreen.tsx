// @ts-nocheck
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { MockMobileChatAdapter, MockMobileHomeAdapter } from "@gynecology-chatbot/app-core";
import type { RecordDayView } from "@gynecology-chatbot/app-core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { fetchRecordDay, updateTodayChecklistItem } from "../../api/mobileApi";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";

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

async function loadRecordDay(isoDate: string) {
  const provider = process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER;
  if (provider !== "api" && provider !== "mock") {
    throw new Error("EXPO_PUBLIC_MOBILE_DATA_PROVIDER must be explicitly set to \"api\" or \"mock\"");
  }

  if (provider === "api") {
    const payload = await fetchRecordDay(isoDate);
    return payload.recordDay;
  }

  const home = await new MockMobileHomeAdapter().getHomeView();
  const relatedSessions = (await new MockMobileChatAdapter().listRecentChats()).filter(
    (session) => session.updatedAtIso?.startsWith(isoDate),
  );
  const currentDay = home.calendarDays.find((day) => day.isoDate === isoDate);

  return {
    isoDate,
    dateLabel: new Date(`${isoDate}T00:00:00`).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
    }),
    emotionTone: currentDay?.emotionTone ?? null,
    checklistItems: [
      {
        id: `${isoDate}-check-1`,
        label: "엽산 보충제 섭취하기",
        completed: Boolean(currentDay?.hasChat || relatedSessions.length > 0),
      },
      {
        id: `${isoDate}-check-2`,
        label: "충분한 수분 섭취하기 (하루 8잔)",
        completed: Boolean(currentDay?.emotionTone || currentDay?.summary),
      },
    ],
    records: currentDay?.summary
      ? [
          {
            id: `summary-${isoDate}`,
            title: "하루 요약",
            summary: currentDay.summary,
            entryType: "ai_summary",
            linkedSessionId: relatedSessions[0]?.id ?? null,
          },
        ]
      : [],
    relatedSessions,
  };
}

export function PatientRecordDayScreen({
  isoDate,
  returnTo,
}: {
  isoDate: string;
  returnTo?: string;
}) {
  const router = useRouter();
  const [recordDay, setRecordDay] = useState<RecordDayView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingChecklistIds, setPendingChecklistIds] = useState<string[]>([]);
  const backHref = useMemo(() => resolveBackHref(returnTo), [returnTo]);
  const activeTab = useMemo(() => resolveActiveTab(returnTo), [returnTo]);

  useEffect(() => {
    let cancelled = false;

    loadRecordDay(isoDate)
      .then((nextRecordDay) => {
        if (!cancelled) {
          setRecordDay(nextRecordDay);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(
            nextError instanceof Error
              ? nextError.message === "failed to load day records"
                ? "이 날짜 기록을 불러오지 못했어요. 잠시 후 다시 확인해 주세요."
                : nextError.message
              : "이 날짜 기록을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.",
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isoDate]);

  async function handleToggleChecklistItem(checklistId: string) {
    if (!recordDay || pendingChecklistIds.includes(checklistId)) {
      return;
    }

    const target = recordDay.checklistItems.find((item) => item.id === checklistId);
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
              item.id === checklistId ? { ...item, completed: nextCompleted } : item,
            ),
          }
        : current,
    );

    try {
      await updateTodayChecklistItem({
        checklistId,
        completed: nextCompleted,
      });
    } catch {
      setRecordDay((current) =>
        current
          ? {
              ...current,
              checklistItems: current.checklistItems.map((item) =>
                item.id === checklistId ? { ...item, completed: target.completed } : item,
              ),
            }
          : current,
      );
    } finally {
      setPendingChecklistIds((current) => current.filter((id) => id !== checklistId));
    }
  }

  return (
    <PatientShell
      activeTab={activeTab}
      title="하루 기록"
      backHref={backHref}
      pageTone="plain"
    >
      <ScrollView
        contentContainerStyle={styles.content}
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
                    <View style={[styles.checkbox, item.completed ? styles.checkboxCompleted : null]} />
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
                  onPress={() => router.push(`/chat/${session.id}`)}
                >
                  <Text style={styles.recordType}>{session.updatedAtLabel}</Text>
                  <Text style={styles.recordTitle}>{session.title}</Text>
                  <Text style={styles.recordSummary}>{session.preview}</Text>
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
    paddingTop: space.md,
    paddingBottom: 140,
    gap: space.md,
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
    marginTop: space.lg,
    gap: space.sm,
  },
  recordCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
    gap: space.sm,
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
