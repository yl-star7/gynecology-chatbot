// @ts-nocheck
import type { MobileContentListItem } from "@gynecology-chatbot/app-core";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MobileScreenFrame } from "../components/MobileScreenFrame";
import { useMobileServices } from "../core/MobileServicesProvider";
import { palette } from "../theme";

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

  useEffect(() => {
    let mounted = true;

    services.knowledgePort
      .listContentItems(section)
      .then((nextItems) => {
        if (mounted) {
          setItems(nextItems);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (mounted) {
          setError(
            nextError instanceof Error
              ? nextError.message
              : "콘텐츠 목록을 불러오지 못했습니다.",
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [section, services]);

  return (
    <MobileScreenFrame title={title} showProfileButton showChatFab>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>{section}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>
          {error ?? "등록된 문헌을 선택해 상세 내용을 확인할 수 있습니다."}
        </Text>

        <View style={styles.list}>
          {items.length > 0 ? (
            items.map((item) => (
              <Pressable
                key={item.id}
                style={styles.itemCard}
                onPress={() =>
                  router.push(`/chat/link/${item.section}?entityId=${encodeURIComponent(item.id)}`)
                }
              >
                <Text style={styles.itemEyebrow}>{item.slug}</Text>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemPreview}>{item.preview}</Text>
              </Pressable>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>등록된 콘텐츠가 아직 없습니다.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </MobileScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "700",
    color: palette.ink,
  },
  description: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    color: palette.subInk,
  },
  list: {
    marginTop: 20,
    gap: 12,
  },
  itemCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  itemEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  itemTitle: {
    marginTop: 10,
    fontSize: 20,
    fontWeight: "700",
    color: palette.ink,
  },
  itemPreview: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: palette.subInk,
  },
  emptyCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  emptyText: {
    fontSize: 14,
    color: palette.subInk,
  },
});
