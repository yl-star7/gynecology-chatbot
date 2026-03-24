// @ts-nocheck
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { HomeViewData, MobileProfileViewData } from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
import { Card, Pressable } from "../../components/ui";
import { PatientHeroBubble } from "../../components/patient/PatientHeroBubble";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";
import { buildPatientHomeViewModel } from "./view-models";
import { getWeekBabyImageSource } from "./week-baby-images";

export function PatientHomeScreen() {
  const services = useMobileServices();
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    const [nextHome, nextProfile] = await Promise.all([
      services.homePort.getHomeView(),
      services.profilePort.getProfile(),
    ]);

    setHome(nextHome);
    setProfile(nextProfile);
  }, [services]);

  useEffect(() => {
    fetchData().catch(() => undefined);
  }, [fetchData]);

  const viewModel = buildPatientHomeViewModel({ home, profile });
  const babyImageSource = getWeekBabyImageSource(viewModel.pregnancyWeekLabel);

  return (
    <PatientShell activeTab="home" title="홈">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
          setRefreshing(true);
          await fetchData().catch(() => undefined);
          setRefreshing(false);
        }} tintColor={palette.accent} />}
      >
        <View>
          <Text style={styles.monthLabel}>{viewModel.monthLabel}</Text>
          <Text style={styles.dayLabel}>{viewModel.dayLabel}</Text>
          <Text style={styles.heroName}>{viewModel.heroName}</Text>
        </View>

        <PatientHeroBubble message={viewModel.babyMessage} name={viewModel.heroName} />

        <View style={styles.heroImageWrap}>
          <View style={styles.heroImageOuter}>
            <View style={styles.heroImageInner}>
              <View style={[styles.floatDot, styles.floatDotOne]} />
              <View style={[styles.floatDot, styles.floatDotTwo]} />
              <View style={[styles.floatDot, styles.floatDotThree]} />
              <Image source={babyImageSource} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.mailBadge}>
                <View style={styles.mailBadgeInner}>
                  <Ionicons name="mail-outline" size={22} color={palette.accent} />
                </View>
                <View style={styles.heartBadge}>
                  <Ionicons name="heart" size={11} color="#ffffff" />
                </View>
              </View>
            </View>
          </View>
        </View>

        <Card style={styles.metricCard}>
          <Text style={styles.metricWeek}>{viewModel.pregnancyWeekLabel}</Text>
          <View style={styles.metricRow}>
            <Text style={styles.metricCaption}>{viewModel.meetingLabel}</Text>
            <Text style={styles.metricValue}>{viewModel.meetingValue}</Text>
          </View>
          <Text style={styles.metricSubLabel}>{`임신 ${viewModel.pregnancyDayCount}일째예요.`}</Text>
        </Card>

        <Card style={styles.quoteCard}>
          <Text style={styles.quoteText}>{viewModel.quote}</Text>
        </Card>

        <Card style={styles.noteCard}>
          <Text style={styles.noteTitle}>{viewModel.noteTitle}</Text>
          <Text style={styles.noteBody}>{viewModel.noteBody}</Text>
        </Card>

        <View style={styles.shortcutRow}>
          <Pressable style={[styles.shortcutCard, shadows.card]} onPress={() => router.replace("/notebook")}>
            <Text style={styles.shortcutEyebrow}>기록과 회고</Text>
            <Text style={styles.shortcutTitle}>오늘 남긴 마음을 다시 봐요</Text>
            <Text style={styles.shortcutBody}>날짜별 기록과 상담 흔적을 차분히 정리해볼 수 있어요.</Text>
          </Pressable>
          <Pressable style={[styles.shortcutCard, shadows.card]} onPress={() => router.replace("/profile")}>
            <Text style={styles.shortcutEyebrow}>마이페이지</Text>
            <Text style={styles.shortcutTitle}>내 정보와 알림을 조절해요</Text>
            <Text style={styles.shortcutBody}>태명, 예정일, 상담 톤을 내 흐름에 맞게 바꿀 수 있어요.</Text>
          </Pressable>
        </View>
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
  monthLabel: {
    ...typo.eyebrow,
    color: surface.textSecondary,
  },
  dayLabel: {
    marginTop: space.xs,
    ...typo.titleLg,
    color: surface.textPrimary,
  },
  heroName: {
    marginTop: -4,
    ...typo.titleLg,
    color: surface.textPrimary,
  },
  metricCard: {
    gap: space.sm,
  },
  heroImageWrap: {
    alignItems: "center",
    marginTop: -space.sm,
  },
  heroImageOuter: {
    width: 272,
    height: 272,
    borderRadius: radii.full,
    backgroundColor: palette.warm,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageInner: {
    width: 236,
    height: 236,
    borderRadius: radii.full,
    backgroundColor: surface.surfaceAccent,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  floatDot: {
    position: "absolute",
    borderRadius: radii.full,
    backgroundColor: "rgba(255,255,255,0.42)",
    zIndex: 2,
  },
  floatDotOne: {
    width: 12,
    height: 12,
    top: 48,
    left: 44,
  },
  floatDotTwo: {
    width: 10,
    height: 10,
    top: 82,
    right: 54,
  },
  floatDotThree: {
    width: 14,
    height: 14,
    bottom: 64,
    left: 58,
  },
  mailBadge: {
    position: "absolute",
    bottom: 22,
    left: "50%",
    marginLeft: -26,
    zIndex: 3,
  },
  mailBadgeInner: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartBadge: {
    position: "absolute",
    right: -6,
    bottom: -6,
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  metricWeek: {
    ...typo.label,
    color: palette.accent,
  },
  metricRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
  },
  metricCaption: {
    ...typo.body,
    color: surface.textSecondary,
  },
  metricValue: {
    ...typo.titleLg,
    color: surface.textPrimary,
  },
  metricSubLabel: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  quoteCard: {
    backgroundColor: surface.surfacePrimary,
  },
  quoteText: {
    ...typo.body,
    color: surface.textPrimary,
    textAlign: "center",
  },
  noteCard: {
    backgroundColor: surface.surfaceSecondary,
  },
  noteTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  noteBody: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
  },
  shortcutRow: {
    gap: space.sm,
  },
  shortcutCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
  },
  shortcutEyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  shortcutTitle: {
    marginTop: space.xs,
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  shortcutBody: {
    marginTop: space.sm,
    ...typo.caption,
    color: surface.textSecondary,
  },
});
