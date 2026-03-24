// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import type { HomeViewData, RecentChatSummary } from "@gynecology-chatbot/app-core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientTodayTabs } from "../../components/patient/PatientTodayTabs";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";
import { buildPatientRecordsViewModel } from "./view-models";

function badgeStyle(tone: string) {
  if (tone === "success") return styles.badgeSuccess;
  if (tone === "calm") return styles.badgeCalm;
  if (tone === "warning") return styles.badgeWarning;
  if (tone === "tired") return styles.badgeTired;
  if (tone === "muted") return styles.badgeMuted;
  return styles.badgeIdle;
}

function badgeTextStyle(tone: string) {
  if (tone === "success") return styles.badgeTextSuccess;
  if (tone === "calm") return styles.badgeTextCalm;
  if (tone === "warning") return styles.badgeTextWarning;
  if (tone === "tired") return styles.badgeTextTired;
  if (tone === "muted") return styles.badgeTextMuted;
  return styles.badgeTextIdle;
}

function chunkByWeek(days: ReturnType<typeof buildPatientRecordsViewModel>["days"]) {
  const groups = [];
  for (let index = 0; index < days.length; index += 7) {
    groups.push(days.slice(index, index + 7));
  }
  return groups;
}

export function PatientRecordsScreen() {
  const services = useMobileServices();
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [activeTab, setActiveTab] = useState("checklist");

  useEffect(() => {
    Promise.all([
      services.homePort.getHomeView(),
      services.chatPort.listRecentChats(),
    ]).then(([nextHome, nextSessions]) => {
      setHome(nextHome);
      setRecentSessions(nextSessions);
    }).catch(() => undefined);
  }, [services]);

  const viewModel = buildPatientRecordsViewModel(home);
  const checklistGroups = useMemo(() => chunkByWeek(viewModel.days), [viewModel.days]);

  return (
    <PatientShell activeTab="home" title="기록과 회고" backHref="/home">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card variant="muted">
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.description}>{viewModel.description}</Text>
        </Card>

        <PatientTodayTabs
          sections={[
            { id: "checklist", label: "생활 체크리스트" },
            { id: "reflections", label: "대화와 회고" },
          ]}
          activeSection={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "checklist" ? (
          <View style={styles.list}>
            {checklistGroups.map((group, index) => {
              const completedCount = group.filter((day) => day.hasChat || day.emotionTone).length;
              const completionRate = group.length ? Math.round((completedCount / group.length) * 100) : 0;

              return (
                <Card key={`week-${index}`}>
                  <View style={styles.weekHeader}>
                    <View>
                      <Text style={styles.weekTitle}>{`${index + 1}번째 기록 묶음`}</Text>
                      <Text style={styles.weekSubtitle}>{`${completedCount}/${group.length}일에 활동이 있었어요.`}</Text>
                    </View>
                    <Text style={styles.weekRate}>{`${completionRate}%`}</Text>
                  </View>
                  <View style={styles.dayGrid}>
                    {group.map((day) => (
                      <Pressable
                        key={day.isoDate}
                        style={[styles.dayCard, shadows.card]}
                        onPress={() => router.push(`/chat/link/records?entityId=${encodeURIComponent(day.isoDate)}`)}
                      >
                        <View style={styles.dayCardHeader}>
                          <Text style={styles.dayLabel}>{`${day.dayLabel}일`}</Text>
                          <View style={[styles.badge, badgeStyle(day.statusTone)]}>
                            <Text style={[styles.badgeText, badgeTextStyle(day.statusTone)]}>
                              {day.statusTone === "success"
                                ? "실천함"
                                : day.statusTone === "warning"
                                  ? "어려웠음"
                                  : day.statusTone === "tired"
                                    ? "쉬임"
                                    : day.statusTone === "muted"
                                      ? "위로"
                                      : day.statusTone === "calm"
                                        ? "차분"
                                        : "미기록"}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.dayChip}>{day.chipLabel}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Card>
              );
            })}
          </View>
        ) : null}

        {activeTab === "reflections" ? (
          <View style={styles.list}>
            {recentSessions.map((session) => (
              <Pressable
                key={session.id}
                style={[styles.sessionCard, shadows.card]}
                onPress={() => router.replace(`/chat/${session.id}`)}
              >
                <Text style={styles.sessionEyebrow}>{session.updatedAtLabel}</Text>
                <Text style={styles.sessionTitle}>{session.title}</Text>
                <Text style={styles.sessionPreview}>{session.preview}</Text>
              </Pressable>
            ))}
            {recentSessions.length === 0 ? (
              <Card>
                <Text style={styles.emptyText}>아직 회고로 이어진 대화가 없어요.</Text>
              </Card>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 140,
    gap: space.lg,
  },
  title: {
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  description: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
  },
  list: {
    gap: space.sm,
  },
  weekHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  weekTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  weekSubtitle: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
  weekRate: {
    ...typo.titleSm,
    color: palette.accent,
  },
  dayGrid: {
    marginTop: space.lg,
    gap: space.sm,
  },
  dayCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfaceSecondary,
    padding: space.lg,
  },
  dayCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  dayLabel: {
    ...typo.label,
    color: surface.textPrimary,
  },
  dayChip: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
  badge: {
    borderRadius: radii.full,
    paddingHorizontal: space.sm,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  badgeSuccess: {
    backgroundColor: palette.successBackground,
  },
  badgeCalm: {
    backgroundColor: surface.surfaceAccent,
  },
  badgeWarning: {
    backgroundColor: surface.surfaceSecondary,
  },
  badgeTired: {
    backgroundColor: surface.surfaceSecondary,
  },
  badgeMuted: {
    backgroundColor: surface.surfaceSecondary,
  },
  badgeIdle: {
    backgroundColor: surface.surfacePrimary,
  },
  badgeTextSuccess: {
    color: palette.successText,
  },
  badgeTextCalm: {
    color: palette.accent,
  },
  badgeTextWarning: {
    color: surface.textSecondary,
  },
  badgeTextTired: {
    color: surface.textSecondary,
  },
  badgeTextMuted: {
    color: surface.textSecondary,
  },
  badgeTextIdle: {
    color: surface.textSecondary,
  },
  sessionCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
  },
  sessionEyebrow: {
    ...typo.caption,
    color: palette.accent,
  },
  sessionTitle: {
    marginTop: space.xs,
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  sessionPreview: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
  },
  emptyText: {
    ...typo.body,
    color: surface.textSecondary,
  },
});
