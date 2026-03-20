// @ts-nocheck
import type { LinkTargetContent } from "@gynecology-chatbot/app-core";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { Button, Card } from "../components/ui";
import { MobileScreenFrame } from "../components/MobileScreenFrame";
import { useMobileServices } from "../core/MobileServicesProvider";
import { patientSurfacePalette as surface, space, typo } from "../theme";

export function LinkTargetScreen({
  target,
  entityId,
}: {
  target: string;
  entityId?: string;
}) {
  const services = useMobileServices();
  const [content, setContent] = useState<LinkTargetContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    services.knowledgePort
      .getLinkTarget(target, entityId)
      .then((nextContent) => {
        setContent(nextContent);
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "내용을 불러오지 못했어요.");
      });
  }, [entityId, services, target]);

  return (
    <MobileScreenFrame title="상세 보기" showProfileButton showChatFab>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.title}>{content?.title ?? "불러오는 중이에요"}</Text>
          <Text style={styles.body}>{error ?? content?.body ?? "잠시만 기다려주세요."}</Text>
        </Card>
        <Button label="홈으로 돌아가기" variant="text" onPress={() => router.replace("/home")} />
      </ScrollView>
    </MobileScreenFrame>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: space.xl,
    paddingBottom: 120,
    gap: space.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 30,
    color: surface.textPrimary,
  },
  body: {
    marginTop: space.md,
    ...typo.body,
    lineHeight: 24,
    color: surface.textSecondary,
  },
});
