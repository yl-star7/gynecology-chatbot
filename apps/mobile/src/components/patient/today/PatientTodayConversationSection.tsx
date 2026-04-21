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
  isLoadingRecentSessions,
  openErrorMessage,
  onOpenNewChat,
  onOpenRecentSession,
}: {
  title: string;
  description: string;
  recentSessions: RecentChatSummary[];
  isLoadingRecentSessions: boolean;
  openErrorMessage: string | null;
  onOpenNewChat: () => void;
  onOpenRecentSession: (sessionId: string) => void | Promise<void>;
}) {
  return (
    <Card style={[styles.segmentCard, styles.conversationLauncherCard]}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <Text style={styles.emptyText}>{description}</Text>

      <Pressable
        style={styles.openChatButton}
        onPress={onOpenNewChat}
        accessibilityLabel="새 채팅 열기"
      >
        <Text style={styles.openChatButtonText}>새 채팅 시작하기</Text>
      </Pressable>

      <View style={styles.recentSessionList}>
        {isLoadingRecentSessions && recentSessions.length === 0 ? (
          <Text style={styles.recentSessionEmptyText}>
            오늘 대화를 불러오고 있어요.
          </Text>
        ) : recentSessions.length > 0 ? (
          recentSessions.map((item) => (
            <Pressable
              key={item.id}
              style={styles.recentSessionCard}
              onPress={() => onOpenRecentSession(item.id)}
            >
              <View style={styles.recentSessionHeader}>
                <Text style={styles.recentSessionTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.updatedAtLabel ? (
                  <Text style={styles.recentSessionTime}>
                    {item.updatedAtLabel}
                  </Text>
                ) : null}
              </View>
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
    backgroundColor: palette.accent,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  openChatButtonText: {
    ...typo.titleSm,
    color: surface.surfacePrimary,
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
  recentSessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  recentSessionTitle: {
    ...typo.label,
    color: surface.textPrimary,
    flex: 1,
  },
  recentSessionTime: {
    ...typo.caption,
    color: surface.textSecondary,
    flexShrink: 0,
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
