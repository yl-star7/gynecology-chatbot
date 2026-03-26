// @ts-nocheck
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import type { HomeViewData, MobileProfileViewData } from "@gynecology-chatbot/app-core";
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
    <PatientShell activeTab="home" title="홈" pageTone="main">
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
          <Text style={styles.monthLabel}>{`${viewModel.monthLabel} ${viewModel.dayLabel}일`}</Text>
          <Text style={styles.heroName}>{viewModel.heroName}</Text>
        </View>

        <PatientHeroBubble message={viewModel.babyMessage} name={viewModel.heroName} />

        <View style={styles.heroImageWrap}>
          <View style={styles.heroImageOuter}>
            <View style={styles.heroImageInner}>
              <Image source={babyImageSource} style={styles.heroImage} resizeMode="cover" />
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

        <Pressable style={[styles.knowledgeEntryCard, shadows.card]} onPress={() => router.replace("/knowledge")}>
          <Text style={styles.shortcutEyebrow}>참고 정보</Text>
          <Text style={styles.shortcutTitle}>임신 지식을 참고로 읽어봐요</Text>
          <Text style={styles.shortcutBody}>주차별 변화와 참고 문서를 따로 읽고 싶을 때만 들어가면 돼요.</Text>
        </Pressable>

        <View style={styles.shortcutRow}>
          <Pressable style={[styles.shortcutCard, shadows.card]} onPress={() => router.replace("/notebook")}>
            <Text style={styles.shortcutEyebrow}>날짜별 기록</Text>
            <Text style={styles.shortcutTitle}>그날의 체크와 대화를 같이 봐요</Text>
            <Text style={styles.shortcutBody}>날짜를 누르면 그날 남긴 체크리스트와 대화를 한 번에 볼 수 있어요.</Text>
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
  heroName: {
    marginTop: space.xs,
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
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageInner: {
    width: 236,
    height: 236,
    borderRadius: radii.full,
    backgroundColor: "#ececf0",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: {
    width: "100%",
    height: "100%",
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
    backgroundColor: "#ffffff",
  },
  quoteText: {
    ...typo.body,
    color: surface.textPrimary,
    textAlign: "center",
  },
  noteCard: {
    backgroundColor: "#f7f7f9",
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
  knowledgeEntryCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfaceSecondary,
    padding: space.xl,
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
