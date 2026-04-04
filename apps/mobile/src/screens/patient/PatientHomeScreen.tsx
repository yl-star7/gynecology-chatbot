// @ts-nocheck
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  HomeViewData,
  MobileProfileViewData,
} from "@gynecology-chatbot/app-core";
import { Card, Pressable } from "../../components/ui";
import { PatientHeroBubble } from "../../components/patient/PatientHeroBubble";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileServices } from "../../core/MobileServicesProvider";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";
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
  const babyImageSource = getWeekBabyImageSource(viewModel.imageWeekLabel);

  return (
    <PatientShell
      activeTab="home"
      title="홈"
      pageTone="main"
      showProfileButton={false}
      headerCompact
    >
      <ScrollView
        scrollEnabled={false}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchData().catch(() => undefined);
              setRefreshing(false);
            }}
            tintColor={palette.accent}
          />
        }
      >
        <View>
          <Text
            style={styles.monthLabel}
          >{`${viewModel.monthLabel} ${viewModel.dayLabel}일`}</Text>
          <Text style={styles.heroName}>{viewModel.heroName}</Text>
        </View>

        <PatientHeroBubble
          message={viewModel.babyMessage}
          name={viewModel.heroName}
        />

        <View style={styles.heroImageWrap}>
          <View style={styles.heroImageOuter}>
            <View style={styles.heroImageInner}>
              <Image
                source={babyImageSource}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeaderRow}>
            <Text style={styles.metricWeek}>{viewModel.pregnancyWeekLabel}</Text>
            <View style={styles.metricHeaderSpacer} />
            <Text style={styles.metricDayText}>{viewModel.pregnancyDayText}</Text>
          </View>
          <View style={styles.metricMeetingRow}>
            <Text style={styles.metricCaption}>{viewModel.meetingLabel}</Text>
            <Text style={styles.metricValue}>{viewModel.meetingValue}</Text>
          </View>
          <View style={styles.noteSection}>
            <Text style={styles.noteTitle}>{viewModel.noteTitle}</Text>
            <Text style={styles.noteBody}>{viewModel.noteBody}</Text>
          </View>
        </Card>
      </ScrollView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
    paddingBottom: 140,
    gap: space.md,
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
    gap: space.md,
  },
  heroImageWrap: {
    alignItems: "center",
    marginTop: -space.sm,
  },
  heroImageOuter: {
    width: space.xxxl * 8 + space.xl,
    height: space.xxxl * 8 + space.xl,
    borderRadius: radii.full,
    backgroundColor: surface.fieldSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageInner: {
    width: space.xxxl * 7 + space.xxl,
    height: space.xxxl * 7 + space.xxl,
    borderRadius: radii.full,
    backgroundColor: surface.surfaceSecondary,
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
  metricHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  metricHeaderSpacer: {
    flex: 1,
  },
  metricMeetingRow: {
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
  metricDayText: {
    ...typo.label,
    color: surface.textSecondary,
  },
  noteSection: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfaceSecondary,
    padding: space.lg,
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
});
