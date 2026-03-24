// @ts-nocheck
import { useCallback, useEffect, useMemo, useState } from "react";
import { router } from "expo-router";
import type { MobileContentListItem, MobileProfileViewData } from "@gynecology-chatbot/app-core";
import { Image, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";
import { DEFAULT_CHECKLIST, DEFAULT_CONTENT_EMPTY } from "./view-models/patient-copy";
import { getWeekBabyImageSource } from "./week-baby-images";

export function PatientContentScreen({
  section,
  title,
}: {
  section: "knowledge" | "notebook";
  title: string;
}) {
  const services = useMobileServices();
  const [items, setItems] = useState<MobileContentListItem[]>([]);
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const [nextItems, nextProfile] = await Promise.all([
        services.knowledgePort.listContentItems(section),
        services.profilePort.getProfile(),
      ]);
      setItems(nextItems);
      setProfile(nextProfile);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : DEFAULT_CONTENT_EMPTY);
    }
  }, [section, services]);

  useEffect(() => {
    fetchItems().catch(() => undefined);
  }, [fetchItems]);

  const featuredItem = items[0] ?? null;
  const heroName = profile?.babyNickname?.trim() || "우리 아기";
  const fetalSummary = useMemo(() => {
    if (featuredItem?.preview) {
      return featuredItem.preview;
    }
    return `${heroName}는 ${profile?.pregnancyWeekLabel ?? "지금의 주차"}에 맞춰 오늘도 차분히 자라고 있어요.`;
  }, [featuredItem?.preview, heroName, profile?.pregnancyWeekLabel]);

  const maternalSummary =
    profile?.tonePreference?.trim()
      ? `오늘은 ${profile.tonePreference} 톤으로 몸의 변화를 천천히 정리해보면 좋아요.`
      : "오늘 몸과 마음의 변화를 천천히 살펴보면 좋아요.";
  const babyImageSource = getWeekBabyImageSource(profile?.pregnancyWeekLabel);

  return (
    <PatientShell activeTab={section === "knowledge" ? "today" : "home"} title={title} backHref="/home">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
          setRefreshing(true);
          await fetchItems().catch(() => undefined);
          setRefreshing(false);
        }} tintColor={palette.accent} />}
      >
        <Card variant="muted">
          <Text style={styles.eyebrow}>{section === "knowledge" ? "오늘 내용" : "함께 남긴 기록"}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            {error ??
              (section === "knowledge"
                ? "오늘 아기와 엄마의 변화를 먼저 보고, 이어서 자세한 내용을 읽어보세요."
                : "남겨둔 기록을 다시 읽으면서 오늘의 흐름을 차분히 정리해보세요.")}
          </Text>
        </Card>

        {section === "knowledge" ? (
          <>
            <Card style={styles.messageCard}>
              <Text style={styles.messageLabel}>{heroName}의 말</Text>
              <Text style={styles.messageBody}>
                엄마, 오늘도 저를 위해 시간을 내주셔서 감사해요. 함께 읽으면서 오늘 하루를 준비해봐요.
              </Text>
            </Card>

            <View style={styles.heroImageWrap}>
              <View style={styles.heroImageOuter}>
                <View style={styles.heroImageInner}>
                  <Image source={babyImageSource} style={styles.heroImage} resizeMode="cover" />
                </View>
              </View>
            </View>

            <View style={styles.dualCardRow}>
              <Card style={styles.dualCard}>
                <Text style={styles.cardTitle}>태아 발달</Text>
                <Text style={styles.cardBody}>{fetalSummary}</Text>
              </Card>
              <Card variant="muted" style={styles.dualCard}>
                <Text style={styles.cardTitle}>모체 변화</Text>
                <Text style={styles.cardBody}>{maternalSummary}</Text>
              </Card>
            </View>

            <Card>
              <Text style={styles.cardTitle}>오늘의 생활 체크리스트</Text>
              <View style={styles.checklist}>
                {DEFAULT_CHECKLIST.map((item) => (
                  <View key={item} style={styles.checklistRow}>
                    <View style={styles.checkIcon} />
                    <Text style={styles.checklistLabel}>{item}</Text>
                  </View>
                ))}
              </View>
            </Card>

            {featuredItem ? (
              <Card variant="accent">
                <Text style={styles.cardTitle}>오늘의 태교 질문으로 이어가기</Text>
                <Text style={styles.cardBody}>
                  오늘 읽은 내용을 바탕으로 아기에게 하고 싶은 말을 정리해볼 수 있어요.
                </Text>
                <View style={styles.ctaRow}>
                  <Button
                    label="오늘,우리에서 이어가기"
                    onPress={() => router.replace("/today")}
                  />
                </View>
              </Card>
            ) : null}
          </>
        ) : null}

        <View style={styles.list}>
          {items.map((item, index) => (
            <Pressable
              key={item.id}
              style={[styles.itemCard, shadows.card]}
              onPress={() => router.push(`/chat/link/${item.section}?entityId=${encodeURIComponent(item.id)}`)}
            >
              <Text style={styles.itemEyebrow}>
                {section === "knowledge"
                  ? index === 0
                    ? "오늘 먼저 읽어요"
                    : "참고 문서"
                  : "다시 떠올려요"}
              </Text>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemPreview}>{item.preview}</Text>
            </Pressable>
          ))}
          {items.length === 0 ? (
            <Card>
              <Text style={styles.emptyText}>{error ?? DEFAULT_CONTENT_EMPTY}</Text>
            </Card>
          ) : null}
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
  messageCard: {
    backgroundColor: palette.accent,
  },
  messageLabel: {
    ...typo.caption,
    color: "#ffffff",
    opacity: 0.85,
  },
  messageBody: {
    marginTop: space.sm,
    ...typo.body,
    color: "#ffffff",
  },
  heroImageWrap: {
    alignItems: "center",
    marginTop: -space.sm,
  },
  heroImageOuter: {
    width: 220,
    height: 220,
    borderRadius: radii.full,
    backgroundColor: palette.warm,
    alignItems: "center",
    justifyContent: "center",
  },
  heroImageInner: {
    width: 188,
    height: 188,
    borderRadius: radii.full,
    backgroundColor: surface.surfaceAccent,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  dualCardRow: {
    gap: space.sm,
  },
  dualCard: {
    flex: 1,
  },
  cardTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  cardBody: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
  },
  checklist: {
    marginTop: space.lg,
    gap: space.md,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  checkIcon: {
    width: 14,
    height: 14,
    borderRadius: radii.full,
    backgroundColor: palette.accent,
  },
  checklistLabel: {
    ...typo.body,
    color: surface.textPrimary,
  },
  ctaRow: {
    marginTop: space.lg,
  },
  list: {
    gap: space.sm,
  },
  itemCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
  },
  itemEyebrow: {
    ...typo.caption,
    color: palette.accent,
  },
  itemTitle: {
    marginTop: space.xs,
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  itemPreview: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
  },
  emptyText: {
    ...typo.body,
    color: surface.textSecondary,
  },
});
