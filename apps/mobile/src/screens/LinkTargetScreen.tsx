// @ts-nocheck
import type { LinkTargetContent } from "@gynecology-chatbot/app-core";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MobileScreenFrame } from "../components/MobileScreenFrame";
import { useMobileServices } from "../core/MobileServicesProvider";
import { patientSurfacePalette as surface } from "../theme";

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
        setError(nextError instanceof Error ? nextError.message : "링크 콘텐츠를 불러오지 못했습니다.");
      });
  }, [entityId, services, target]);

  return (
    <MobileScreenFrame title="참고 콘텐츠" showProfileButton showChatFab>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{content?.title ?? "콘텐츠를 불러오는 중입니다."}</Text>
          <Text style={styles.body}>{error ?? content?.body ?? "앱 내부 콘텐츠를 조회하고 있습니다."}</Text>
          <Pressable style={styles.button} onPress={() => router.replace("/home")}>
            <Text style={styles.buttonLabel}>홈으로 돌아가기</Text>
          </Pressable>
        </View>
      </View>
    </MobileScreenFrame>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },
  card: {
    borderRadius: 24,
    backgroundColor: surface.surfacePrimary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  body: {
    marginTop: 14,
    fontSize: 16,
    lineHeight: 24,
    color: surface.textSecondary,
  },
  button: {
    marginTop: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: surface.accentSolid,
    alignSelf: "flex-start",
  },
  buttonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
