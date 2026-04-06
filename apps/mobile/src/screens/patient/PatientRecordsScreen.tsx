// @ts-nocheck
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import type { HomeViewData } from "@gynecology-chatbot/app-core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileServices } from "../../core/MobileServicesProvider";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  shadows,
  space,
  typo,
} from "../../theme";
import { buildPatientRecordsViewModel } from "./view-models";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";

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

export function PatientRecordsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const services = useMobileServices();
  const [home, setHome] = useState<HomeViewData | null>(null);
  const contentInsets = buildPatientTabContentInsets({
    bottomInset: insets.bottom,
    topSpacing: space.xs,
  });

  useEffect(() => {
    services.homePort
      .getHomeView()
      .then(setHome)
      .catch(() => undefined);
  }, [services]);

  const viewModel = buildPatientRecordsViewModel(home);
  const activeDays = useMemo(
    () => viewModel.days.filter((day) => day.hasChat || day.emotionTone),
    [viewModel.days],
  );

  return (
    <PatientShell
      activeTab="home"
      title="날짜별 기록"
      backHref="/(tabs)/home"
      pageTone="plain"
      headerCompact
    >
      <ScrollView
        contentContainerStyle={[styles.content, contentInsets]}
        showsVerticalScrollIndicator={false}
      >
        <Card variant="muted">
          <Text style={styles.title}>{viewModel.title}</Text>
          <Text style={styles.description}>{viewModel.description}</Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>기록이 있는 날짜</Text>
          <Text style={styles.sectionDescription}>
            날짜를 누르면 그날의 체크와 대화를 함께 볼 수 있어요.
          </Text>
          <View style={styles.list}>
            {activeDays.map((day) => (
              <Pressable
                key={day.isoDate}
                style={[styles.dayCard, shadows.card]}
                onPress={() =>
                  router.push(
                    `/records/${encodeURIComponent(day.isoDate)}?returnTo=notebook`,
                  )
                }
              >
                <View style={styles.dayCardHeader}>
                  <Text style={styles.dayLabel}>{day.isoDate}</Text>
                  <View style={[styles.badge, badgeStyle(day.statusTone)]}>
                    <Text
                      style={[styles.badgeText, badgeTextStyle(day.statusTone)]}
                    >
                      {day.statusTone === "success"
                        ? "실천함"
                        : day.statusTone === "warning"
                          ? "어려웠음"
                          : day.statusTone === "tired"
                            ? "쉬임"
                            : day.statusTone === "muted"
                              ? "위로"
                              : day.statusTone === "calm"
                                ? "대화함"
                                : "기록 대기"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dayChip}>{day.chipLabel}</Text>
              </Pressable>
            ))}
            {activeDays.length === 0 ? (
              <Text style={styles.emptyText}>
                아직 기록이 쌓이지 않았어요. 오늘 대화를 시작하면 여기에
                차곡차곡 보여드릴게요.
              </Text>
            ) : null}
          </View>
        </Card>
      </ScrollView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    gap: space.md,
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
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  sectionDescription: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
  list: {
    marginTop: space.lg,
    gap: space.sm,
  },
  dayCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfaceSecondary,
    padding: space.md,
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
  emptyText: {
    ...typo.body,
    color: surface.textSecondary,
  },
});
