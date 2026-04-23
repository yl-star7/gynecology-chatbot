// @ts-nocheck
import { useCallback, useEffect, useState, useRef } from "react";
import { useNavigation } from "expo-router";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type {
  HomeViewData,
  MobileProfileViewData,
} from "@gynecology-chatbot/app-core";
import { Card } from "../../components/ui";
import { PatientHeroBubble } from "../../components/patient/PatientHeroBubble";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import {
  hasFreshCachedHomeView,
  hasFreshCachedProfileView,
  readCachedHomeView,
  readCachedProfileView,
} from "../../core/patientViewCache";
import {
  mergePatientProfileSyncSnapshot,
  usePatientProfileSyncSnapshot,
} from "./patientProfileSyncStore";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";
import { useMobileTheme } from "../../theme-provider";
import { buildPatientHomeViewModel } from "./view-models";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";
import { prefetchWeekBabyImages } from "./prefetchWeekBabyImages";

export function PatientHomeScreen() {
  const insets = useSafeAreaInsets();
  const { palette: activePalette } = useMobileTheme();
  const services = useMobileServices();
  const { currentUser, isRestoringSession } = useMobileAppSession();
  const syncSnapshot = usePatientProfileSyncSnapshot();
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const contentInsets = buildPatientTabContentInsets({
    bottomInset: insets.bottom,
    topSpacing: space.xs,
  });

  const fetchData = useCallback(async () => {
    const [nextHome, nextProfile] = await Promise.all([
      services.homePort.getHomeView(),
      services.profilePort.getProfile(),
    ]);

    setHome(nextHome);
    setProfile(nextProfile);
  }, [services]);

  useEffect(() => {
    if (!currentUser) {
      setHome(null);
      setProfile(null);
      return;
    }

    const cachedHome = readCachedHomeView(currentUser.id);
    const cachedProfile = readCachedProfileView(currentUser.id);

    setHome(cachedHome);
    setProfile(cachedProfile);
  }, [currentUser]);

  const navigation = useNavigation();
  const hasMounted = useRef(false);

  useEffect(() => {
    if (isRestoringSession || !currentUser) {
      return;
    }

    if (
      hasFreshCachedHomeView(currentUser.id) &&
      hasFreshCachedProfileView(currentUser.id)
    ) {
      return;
    }

    fetchData().catch(() => undefined);
  }, [currentUser, fetchData, isRestoringSession]);

  useEffect(() => {
    setProfile((current) =>
      mergePatientProfileSyncSnapshot(
        current,
        syncSnapshot.profile,
        currentUser?.id,
      ),
    );
  }, [currentUser?.id, syncSnapshot.profile, syncSnapshot.version]);

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      if (isRestoringSession || !currentUser) {
        return;
      }

      if (!hasMounted.current) {
        hasMounted.current = true;
        return;
      }

      if (
        hasFreshCachedHomeView(currentUser.id) &&
        hasFreshCachedProfileView(currentUser.id)
      ) {
        setHome(readCachedHomeView(currentUser.id));
        setProfile(readCachedProfileView(currentUser.id));
        return;
      }

      fetchData().catch(() => undefined);
    });
    return unsubscribe;
  }, [currentUser, fetchData, isRestoringSession, navigation]);

  const viewModel = buildPatientHomeViewModel({ home, profile });

  useEffect(() => {
    prefetchWeekBabyImages(viewModel.imageWeekLabel);
  }, [viewModel.imageWeekLabel]);

  return (
    <PatientShell
      activeTab="home"
      pageTone="main"
      showProfileButton={false}
      headerCompact
    >
      <ScrollView
        scrollEnabled
        contentContainerStyle={[styles.content, contentInsets]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchData().catch(() => undefined);
              setRefreshing(false);
            }}
            tintColor={activePalette.accent}
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
                source={viewModel.babyImageSource}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>

        <Card style={styles.metricCard}>
          <View style={styles.metricHeaderRow}>
            <Text style={styles.metricWeek}>
              {viewModel.pregnancyWeekLabel}
            </Text>
            <View style={styles.metricHeaderSpacer} />
            <Text style={styles.metricDayText}>
              {viewModel.pregnancyDayText}
            </Text>
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
