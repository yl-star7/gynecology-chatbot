import type { ComponentType } from "react";
import { Ionicons } from "@expo/vector-icons";
import { Modal, StyleSheet, Text, View } from "react-native";
import type { RecentChatSummary } from "@gynecology-chatbot/app-core";
import { Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

const CloseIcon = Ionicons as unknown as ComponentType<{
  name: "close";
  size: number;
  color: string;
}>;

export function PatientTodaySessionsDrawer({
  visible,
  insetsTop,
  isLoading,
  sessions,
  currentSessionId,
  onClose,
  onSelectSession,
}: {
  visible: boolean;
  insetsTop: number;
  isLoading: boolean;
  sessions: RecentChatSummary[];
  currentSessionId: string;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.drawerRoot}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, styles.drawerBackdrop]}
          onPress={onClose}
          accessibilityLabel="오늘 지난 대화 닫기"
        />
        <View style={[styles.drawerPanel, { paddingTop: insetsTop + space.md }]}>
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>오늘 지난 대화</Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel="오늘 지난 대화 닫기"
              style={styles.drawerCloseButton}
            >
              <CloseIcon
                name="close"
                size={space.lg + space.xs}
                color={surface.textPrimary}
              />
            </Pressable>
          </View>

          <View style={styles.drawerList}>
            {isLoading ? (
              <Text style={styles.drawerHelperText}>
                오늘 대화를 불러오고 있어요.
              </Text>
            ) : sessions.length > 0 ? (
              sessions.map((item) => {
                const isCurrentSession = item.id === currentSessionId;
                return (
                  <Pressable
                    key={item.id}
                    style={
                      isCurrentSession
                        ? [styles.drawerSessionCard, styles.drawerSessionCardActive]
                        : styles.drawerSessionCard
                    }
                    onPress={() => onSelectSession(item.id)}
                    disabled={isCurrentSession}
                    accessibilityState={{ disabled: isCurrentSession }}
                  >
                    <Text style={styles.drawerSessionMeta}>{item.updatedAtLabel}</Text>
                    <Text
                      style={[
                        styles.drawerSessionTitle,
                        isCurrentSession ? styles.drawerSessionTitleActive : null,
                      ]}
                      numberOfLines={1}
                    >
                      {isCurrentSession ? "지금 보고 있는 대화" : item.title}
                    </Text>
                    <Text style={styles.drawerSessionPreview} numberOfLines={2}>
                      {item.preview || "대화를 열어 이어서 볼 수 있어요."}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.drawerHelperText}>
                오늘 이어볼 대화가 아직 없어요.
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  drawerRoot: {
    flex: 1,
  },
  drawerBackdrop: {
    backgroundColor: "rgba(17, 24, 39, 0.16)",
  },
  drawerPanel: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: 320,
    maxWidth: "86%",
    backgroundColor: surface.surfacePrimary,
    paddingHorizontal: space.lg,
    paddingBottom: space.lg,
    shadowColor: palette.ink,
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: -4, height: 0 },
    elevation: 12,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    paddingBottom: space.md,
    borderBottomWidth: 1,
    borderBottomColor: surface.strokeSubtle,
  },
  drawerTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  drawerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: surface.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerList: {
    gap: space.xs,
    paddingTop: space.md,
  },
  drawerSessionCard: {
    borderRadius: radii.lg,
    backgroundColor: surface.surfaceSecondary,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.xs,
  },
  drawerSessionCardActive: {
    backgroundColor: surface.surfaceAccent,
  },
  drawerSessionMeta: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  drawerSessionTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  drawerSessionTitleActive: {
    color: palette.accent,
  },
  drawerSessionPreview: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  drawerHelperText: {
    ...typo.body,
    color: surface.textSecondary,
    paddingTop: space.sm,
  },
});