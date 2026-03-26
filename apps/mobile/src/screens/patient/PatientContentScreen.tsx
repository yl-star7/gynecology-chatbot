// @ts-nocheck
import { useCallback, useEffect, useState } from "react";
import { router } from "expo-router";
import type { MobileContentListItem } from "@gynecology-chatbot/app-core";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";
import { DEFAULT_CONTENT_EMPTY } from "./view-models/patient-copy";

export function PatientContentScreen({
  section,
  title,
}: {
  section: "knowledge" | "notebook";
  title: string;
}) {
  const services = useMobileServices();
  const [items, setItems] = useState<MobileContentListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchItems = useCallback(async () => {
    try {
      const nextItems = await services.knowledgePort.listContentItems(section);
      setItems(nextItems);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : DEFAULT_CONTENT_EMPTY);
    }
  }, [section, services]);

  useEffect(() => {
    fetchItems().catch(() => undefined);
  }, [fetchItems]);

  const featuredItem = items[0] ?? null;

  return (
    <PatientShell activeTab={section === "knowledge" ? "today" : "home"} title={title} backHref="/home" pageTone="plain">
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
          <Text style={styles.eyebrow}>{section === "knowledge" ? "참고 정보" : "날짜별 기록"}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>
            {error ??
              (section === "knowledge"
                ? "필요할 때만 주차별 정보를 따로 읽어보세요."
                : "남겨둔 기록을 다시 읽으면서 오늘의 흐름을 차분히 정리해보세요.")}
          </Text>
        </Card>

        {section === "knowledge" && featuredItem ? (
          <Card variant="accent">
            <Text style={styles.cardTitle}>오늘,우리로 이어가기</Text>
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
  cardTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  cardBody: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
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
