import { StyleSheet, Text, View } from "react-native";
import { Card, Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

import type { RecentChatSummary } from "@gynecology-chatbot/app-core";

export function PatientTodayConversationSection({
  title,
  description,
  recentSessions,
  openErrorMessage,
  onOpenNewChat,
  onOpenRecentSession,
}: {
  title: string;
  description: string;
  recentSessions: RecentChatSummary[];
  openErrorMessage: string | null;
  onOpenNewChat: () => void;
  onOpenRecentSession: (sessionId: string) => void | Promise<void>;
}) {
  return (
    <Card style={[styles.segmentCard, styles.conversationLauncherCard]}>
      <View style={styles.conversationLauncherHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable
          style={styles.openChatButton}
          onPress={onOpenNewChat}
          accessibilityLabel="새 채팅 열기"
        >
          <Text style={styles.openChatButtonText}>새 채팅</Text>
        </Pressable>
      </View>

      <Text style={styles.emptyText}>{description}</Text>

      <View style={styles.recentSessionList}>
        {recentSessions.length > 0 ? (
          recentSessions.map((item) => (
            <Pressable
              key={item.id}
              style={styles.recentSessionCard}
              onPress={() => onOpenRecentSession(item.id)}
            >
              <Text style={styles.recentSessionTitle}>{item.title}</Text>
              {item.preview ? (
                <Text style={styles.recentSessionPreview}>{item.preview}</Text>
              ) : null}
            </Pressable>
          ))
        ) : (
          <Text style={styles.recentSessionEmptyText}>
            오늘 이어볼 대화가 아직 없어요.
          </Text>
        )}
      </View>
      {openErrorMessage ? (
        <Text style={styles.openErrorText}>{openErrorMessage}</Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  segmentCard: {
    gap: space.sm,
    padding: space.md,
  },
  conversationLauncherCard: {
    gap: space.md,
  },
  conversationLauncherHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  openChatButton: {
    borderRadius: radii.full,
    backgroundColor: palette.accentSoft,
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
  },
  openChatButtonText: {
    ...typo.label,
    color: palette.accent,
  },
  emptyText: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
    paddingHorizontal: space.md,
  },
  recentSessionList: {
    gap: space.xs,
  },
  recentSessionCard: {
    gap: space.xs,
    borderRadius: radii.lg,
    backgroundColor: "transparent",
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  recentSessionTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  recentSessionPreview: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  recentSessionEmptyText: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
  },
  openErrorText: {
    ...typo.caption,
    color: palette.errorText,
    textAlign: "center",
  },
});
