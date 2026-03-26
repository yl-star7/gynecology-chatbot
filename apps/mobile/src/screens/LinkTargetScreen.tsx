// @ts-nocheck
import type { LinkTargetContent } from "@gynecology-chatbot/app-core";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card } from "../components/ui";
import { PatientShell } from "../components/patient/PatientShell";
import { useMobileServices } from "../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, space, typo } from "../theme";

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
    <PatientShell activeTab="today" title="오늘 내용" backHref="/home" pageTone="plain">
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card variant="muted">
          <Text style={styles.eyebrow}>{content?.section ?? "오늘 읽는 내용"}</Text>
          <Text style={styles.title}>{content?.title ?? "불러오는 중이에요"}</Text>
          <Text style={styles.description}>
            {error ?? "오늘 필요한 내용을 먼저 읽고, 아기와의 대화로 이어갈 수 있어요."}
          </Text>
        </Card>

        <Card style={styles.messageCard}>
          <Text style={styles.messageLabel}>오늘의 메모</Text>
          <Text style={styles.messageBody}>
            {content?.ctaLabel ?? "천천히 읽으면서 오늘 내 몸과 마음에 어떤 변화가 있는지 함께 살펴봐요."}
          </Text>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>자세히 보기</Text>
          <Text style={styles.body}>{error ?? content?.body ?? "잠시만 기다려주세요."}</Text>
        </Card>

        <View style={styles.buttonRow}>
          <Button label="오늘,우리로 이어가기" onPress={() => router.replace("/today")} />
          <Button label="홈으로 돌아가기" variant="secondary" onPress={() => router.replace("/home")} />
        </View>
      </ScrollView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
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
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  body: {
    marginTop: space.md,
    ...typo.body,
    lineHeight: 24,
    color: surface.textSecondary,
  },
  buttonRow: {
    gap: space.sm,
  },
});
