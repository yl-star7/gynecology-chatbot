// @ts-nocheck
import type { MobileContentListItem } from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { EmptyState, Pressable } from "../components/ui";
import { MobileScreenFrame } from "../components/MobileScreenFrame";
import { useMobileServices } from "../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../theme";

export function ContentListScreen({
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
      setError(nextError instanceof Error ? nextError.message : "목록을 불러오지 못했어요.");
    }
  }, [section, services]);

  useEffect(() => {
    let mounted = true;
    fetchItems().then(() => { if (!mounted) { /* cancelled */ } });
    return () => { mounted = false; };
  }, [fetchItems]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, [fetchItems]);

  return (
    <MobileScreenFrame title={title} backHref="/home" showProfileButton showChatFab>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.accent} />}
      >
        <Text style={styles.eyebrow}>{section === "knowledge" ? "알아두면 좋은 것들" : "나의 기록"}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>
          {error ?? "원하는 항목을 눌러 자세히 읽어보세요."}
        </Text>

        <View style={styles.list}>
          {items.length > 0 ? (
            items.map((item) => (
              <Pressable
                key={item.id}
                style={[styles.itemCard, shadows.card]}
                onPress={() =>
                  router.push(`/chat/link/${item.section}?entityId=${encodeURIComponent(item.id)}`)
                }
              >
                <Text style={styles.itemEyebrow}>{item.slug}</Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemPreview} numberOfLines={2}>{item.preview}</Text>
                <View style={styles.itemArrow}>
                  <Ionicons name="chevron-forward" size={16} color={surface.textSecondary} />
                </View>
              </Pressable>
            ))
          ) : (
            <EmptyState
              icon={section === "knowledge" ? "book-outline" : "document-text-outline"}
              title={error ? "불러올 수 없어요" : "아직 비어있어요"}
              description={error ? "다시 시도해주세요." : "등록된 내용이 없어요."}
            />
          )}
        </View>
      </ScrollView>
    </MobileScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.xl,
    paddingBottom: 120,
  },
  eyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  title: {
    marginTop: space.sm,
    ...typo.titleMd,
    color: palette.ink,
  },
  description: {
    marginTop: 6,
    ...typo.body,
    color: palette.subInk,
  },
  list: {
    marginTop: space.xl,
    gap: space.sm,
  },
  itemCard: {
    padding: space.lg,
    borderRadius: radii.lg,
    backgroundColor: surface.surfacePrimary,
  },
  itemEyebrow: {
    fontSize: 12,
    fontWeight: "600",
    color: palette.accent,
    letterSpacing: 0.3,
  },
  itemTitle: {
    marginTop: space.xs,
    fontSize: 16,
    fontWeight: "700",
    color: palette.ink,
  },
  itemPreview: {
    marginTop: space.xs,
    ...typo.caption,
    color: palette.subInk,
  },
  itemArrow: {
    position: "absolute",
    right: space.lg,
    top: "50%",
  },
});
