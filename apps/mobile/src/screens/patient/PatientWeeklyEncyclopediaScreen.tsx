// @ts-nocheck
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  MobilePregnancyWeekSummary,
  MobileProfileViewData,
} from "@gynecology-chatbot/app-core";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PatientShell } from "../../components/patient/PatientShell";
import { Card, Pressable } from "../../components/ui";
import { useMobileServices } from "../../core/MobileServicesProvider";
import {
  hasFreshCachedPregnancyWeeks,
  hasFreshCachedProfileView,
  readCachedPregnancyWeeks,
  readCachedProfileView,
} from "../../core/patientViewCache";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";
import { resolvePatientContentLoadError } from "./patientErrorCopy.model";
import { getWeekBabyImageSource } from "./week-baby-images";
import { buildWeeklyEncyclopediaViewModel } from "./PatientWeeklyEncyclopediaScreen.model";

export function PatientWeeklyEncyclopediaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; week?: string }>();
  const entryMode = params.mode === "browse" ? "browse" : "current";
  const selectedWeekFromParams = Number(params.week);
  const { knowledgePort, profilePort } = useMobileServices();
  const { currentUser } = useMobileAppSession();
  const [weeks, setWeeks] = useState<MobilePregnancyWeekSummary[]>([]);
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const contentInsets = buildPatientTabContentInsets({
    bottomInset: insets.bottom,
    topSpacing: space.xs,
    extraBottomSpacing: space.lg,
  });

  const fetchContent = useCallback(async () => {
    try {
      const [nextWeeks, nextProfile] = await Promise.all([
        knowledgePort.listPregnancyWeeks(),
        profilePort.getProfile(),
      ]);
      setWeeks((current) => {
        const currentSerialized = JSON.stringify(current);
        const nextSerialized = JSON.stringify(nextWeeks);
        return currentSerialized === nextSerialized ? current : nextWeeks;
      });
      setProfile((current) => {
        const currentSerialized = JSON.stringify(current);
        const nextSerialized = JSON.stringify(nextProfile);
        return currentSerialized === nextSerialized ? current : nextProfile;
      });
      setError(null);
    } catch (nextError) {
      setError(resolvePatientContentLoadError(nextError));
    }
  }, [knowledgePort, profilePort]);

  useEffect(() => {
    if (!currentUser) {
      setWeeks([]);
      setProfile(null);
      return;
    }

    const cachedWeeks = readCachedPregnancyWeeks(currentUser.id);
    const cachedProfile = readCachedProfileView(currentUser.id);
    const hasFreshWeeks = hasFreshCachedPregnancyWeeks(currentUser.id);
    const hasFreshProfile = hasFreshCachedProfileView(currentUser.id);

    if (cachedWeeks) {
      setWeeks(cachedWeeks);
    }
    if (cachedProfile) {
      setProfile(cachedProfile);
    }

    if (!hasFreshWeeks || !hasFreshProfile) {
      void fetchContent();
    }
  }, [currentUser, fetchContent]);

  useEffect(() => {
    if (
      Number.isInteger(selectedWeekFromParams) &&
      selectedWeekFromParams > 0
    ) {
      setSelectedWeekNumber(selectedWeekFromParams);
      return;
    }
    setSelectedWeekNumber(null);
  }, [selectedWeekFromParams]);

  const model = useMemo(
    () =>
      buildWeeklyEncyclopediaViewModel({
        weeks,
        profilePregnancyWeekLabel: profile?.pregnancyWeekLabel ?? null,
        selectedWeekNumber,
      }),
    [profile?.pregnancyWeekLabel, selectedWeekNumber, weeks],
  );
  const selectedWeek = model.selectedWeek;
  const shouldShowWeekPicker =
    entryMode === "browse" && !Number.isInteger(selectedWeekFromParams);
  const shouldShowWeekContent =
    entryMode === "current" || Number.isInteger(selectedWeekFromParams);
  const isBrowsingSpecificWeek =
    entryMode === "browse" && Number.isInteger(selectedWeekFromParams);

  return (
    <PatientShell
      activeTab="profile"
      title={shouldShowWeekPicker ? "주차 선택" : "임신백과"}
      backHref="/(tabs)/profile"
      showProfileButton={false}
      pageTone="plain"
      headerCompact
    >
      <ScrollView
        contentContainerStyle={[styles.content, contentInsets]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await fetchContent().catch(() => undefined);
              setRefreshing(false);
            }}
            tintColor={palette.accent}
          />
        }
      >
        {error ? (
          <Card>
            <Text style={styles.emptyTitle}>정보를 불러오지 못했어요</Text>
            <Text style={styles.bodyText}>{error}</Text>
          </Card>
        ) : null}

        {shouldShowWeekContent && selectedWeek ? (
          <>
            <Card style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View style={styles.heroCopy}>
                  <Text style={styles.eyebrow}>
                    {isBrowsingSpecificWeek ? "선택한 주차" : "이번 주 백과"}
                  </Text>
                  <Text style={styles.heroTitle}>{model.heroTitle}</Text>
                  <Text style={styles.bodyText}>{model.heroSubtitle}</Text>
                </View>
                <View style={styles.babyImageFrame}>
                  <Image
                    source={getWeekBabyImageSource(
                      `${selectedWeek.weekNumber}주`,
                    )}
                    style={styles.babyImage}
                    resizeMode="contain"
                  />
                </View>
              </View>
            </Card>

            <Card>
              <Text style={styles.sectionTitle}>
                {selectedWeek.weekNumber}주차 한눈에 보기
              </Text>
              <Text style={styles.bodyText}>
                {selectedWeek.babySummary ??
                  "이 주차의 아기 정보를 정리 중이에요."}
              </Text>
            </Card>

            <Card>
              <Text style={styles.eyebrow}>주차별 사전</Text>
              <View style={styles.contentBlock}>
                <Text style={styles.sectionTitle}>태아 발달</Text>
                <Text style={styles.bodyText}>
                  {selectedWeek.babySummary ??
                    "이 주차의 태아 발달 정보는 정리 중이에요."}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.contentBlock}>
                <Text style={styles.sectionTitle}>엄마 몸 변화</Text>
                <Text style={styles.bodyText}>
                  {selectedWeek.motherSummary ??
                    "이 주차의 몸 변화 정보는 정리 중이에요."}
                </Text>
              </View>
            </Card>

            <Card variant="muted">
              <Text style={styles.sectionTitle}>{model.lifeGuideTitle}</Text>
              {model.lifeGuideSummary ? (
                <Text style={styles.bodyText}>{model.lifeGuideSummary}</Text>
              ) : null}
              {model.lifeGuideBody ? (
                <Text style={styles.bodyText}>{model.lifeGuideBody}</Text>
              ) : null}
              <GuideList
                items={
                  model.lifeGuideItems.length > 0
                    ? model.lifeGuideItems
                    : [
                        "물을 충분히 마시고, 오래 서 있는 시간은 줄여요.",
                        "무리하지 않는 산책으로 몸을 부드럽게 움직여요.",
                        "불편함이 심하거나 오래가면 의료진과 상담해요.",
                      ]
                }
              />
            </Card>

            <Card variant="muted">
              <Text style={styles.sectionTitle}>{model.cautionTitle}</Text>
              {model.cautionSummary ? (
                <Text style={styles.bodyText}>{model.cautionSummary}</Text>
              ) : null}
              {model.cautionBody ? (
                <Text style={styles.bodyText}>{model.cautionBody}</Text>
              ) : null}
              {model.cautionItems.length > 0 ? (
                <GuideList items={model.cautionItems} />
              ) : null}
            </Card>

            {model.faqItems.length > 0 ? (
              <Card variant="muted">
                <Text style={styles.sectionTitle}>{model.faqTitle}</Text>
                <View style={styles.faqList}>
                  {model.faqItems.map((item, index) => (
                    <View
                      key={`${item.question}-${index}`}
                      style={styles.faqItem}
                    >
                      <Text style={styles.faqQuestion}>{item.question}</Text>
                      <Text style={styles.bodyText}>{item.answer}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            ) : null}
          </>
        ) : shouldShowWeekContent ? (
          <Card>
            <Text style={styles.emptyTitle}>{model.emptyTitle}</Text>
            <Text style={styles.bodyText}>{model.emptyDescription}</Text>
          </Card>
        ) : null}

        {shouldShowWeekPicker ? (
          <Card>
            <Text style={styles.sectionTitle}>주차 선택</Text>
            <Text style={styles.bodyText}>보고 싶은 주차를 골라 주세요.</Text>
            <View style={styles.weekGrid}>
              {model.weekCells.map((cell) => (
                <Pressable
                  key={cell.weekNumber}
                  style={[
                    styles.weekCell,
                    cell.state === "current" ? styles.weekCellCurrent : null,
                    cell.state === "selected" ? styles.weekCellSelected : null,
                    cell.state === "preparing"
                      ? styles.weekCellPreparing
                      : null,
                  ]}
                  onPress={() => {
                    router.push(
                      `/encyclopedia?mode=browse&week=${cell.weekNumber}` as never,
                    );
                  }}
                  accessibilityLabel={`${cell.label} ${
                    cell.state === "preparing" ? "준비 중" : "보기"
                  }`}
                >
                  <Text
                    style={[
                      styles.weekCellLabel,
                      cell.state === "current" || cell.state === "selected"
                        ? styles.weekCellLabelActive
                        : null,
                      cell.state === "selected"
                        ? styles.weekCellLabelSelected
                        : null,
                    ]}
                  >
                    {cell.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </PatientShell>
  );
}

function GuideList({ items }: { items: string[] }) {
  return (
    <View style={styles.guideList}>
      {items.map((item, index) => (
        <GuideItem key={`${item}-${index}`} label={item} />
      ))}
    </View>
  );
}

function GuideItem({ label }: { label: string }) {
  return (
    <View style={styles.guideItem}>
      <View style={styles.guideBullet} />
      <Text style={styles.guideText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    gap: space.lg,
  },
  heroCard: {
    paddingVertical: space.xl,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  heroTitle: {
    marginTop: space.xs,
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  bodyText: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
  },
  babyImageFrame: {
    width: space.xxxl * 3,
    height: space.xxxl * 3,
    borderRadius: radii.full,
    backgroundColor: surface.fieldSurface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  babyImage: {
    width: "92%",
    height: "92%",
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  contentBlock: {
    marginTop: space.md,
  },
  divider: {
    height: 1,
    backgroundColor: surface.strokeSubtle,
    marginVertical: space.lg,
  },
  guideList: {
    marginTop: space.md,
    gap: space.sm,
  },
  guideItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    borderRadius: radii.lg,
    backgroundColor: surface.fieldSurface,
    padding: space.md,
  },
  guideBullet: {
    width: space.sm,
    height: space.sm,
    borderRadius: radii.full,
    backgroundColor: palette.accent,
    marginTop: space.sm,
  },
  guideText: {
    flex: 1,
    ...typo.body,
    color: surface.textSecondary,
  },
  faqList: {
    marginTop: space.md,
    gap: space.md,
  },
  faqItem: {
    borderRadius: radii.lg,
    backgroundColor: surface.fieldSurface,
    padding: space.md,
  },
  faqQuestion: {
    ...typo.label,
    color: surface.textPrimary,
  },
  weekGrid: {
    marginTop: space.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  weekCell: {
    minWidth: "22%",
    borderRadius: radii.md,
    backgroundColor: surface.fieldSurface,
    paddingVertical: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  weekCellCurrent: {
    backgroundColor: surface.surfaceAccent,
  },
  weekCellSelected: {
    backgroundColor: surface.accentSolid,
  },
  weekCellPreparing: {
    opacity: 0.55,
    backgroundColor: surface.fieldSurface,
  },
  weekCellLabel: {
    ...typo.label,
    color: surface.textSecondary,
  },
  weekCellLabelActive: {
    color: palette.accent,
  },
  weekCellLabelSelected: {
    color: surface.surfacePrimary,
  },
  emptyTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
});
