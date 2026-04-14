import { Ionicons } from "@expo/vector-icons";
import type { RecentChatSummary } from "@gynecology-chatbot/app-core";
import type { ComponentType } from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, Pressable } from "../../ui";
import { PatientTodayTabs } from "../PatientTodayTabs";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  shadows,
  space,
  typo,
} from "../../../theme";
import type {
  ProfileHeartShareItem,
  ProfileInfoCard,
  ProfileStatusBadge,
  ProfileStatusTone,
} from "../../../screens/patient/PatientProfileScreen.model";

const CloseIcon = Ionicons as unknown as ComponentType<{
  name: "close";
  size: number;
  color: string;
}>;

const BookIcon = Ionicons as unknown as ComponentType<{
  name: "book-outline";
  size: number;
  color: string;
}>;

const CheckIcon = Ionicons as unknown as ComponentType<{
  name: "checkmark-circle-outline";
  size: number;
  color: string;
}>;

const ChatIcon = Ionicons as unknown as ComponentType<{
  name: "chatbubble-outline";
  size: number;
  color: string;
}>;

function modalTabStyle(tone: ProfileStatusTone) {
  if (tone === "success") return styles.modalTabSuccess;
  if (tone === "active") return styles.modalTabConversation;
  if (tone === "muted") return styles.modalTabMuted;
  return styles.modalTabIdle;
}

function modalTabTextStyle(tone: ProfileStatusTone) {
  if (tone === "success") return styles.modalTabTextSuccess;
  if (tone === "active") return styles.modalTabTextConversation;
  if (tone === "muted") return styles.modalTabTextMuted;
  return styles.modalTabTextIdle;
}

export function PatientProfileDayModal({
  visible,
  dateLabel,
  isoDate,
  selectedIsToday,
  modalSection,
  conversationSection,
  checklistStatus,
  infoStatus,
  conversationStatus,
  checklistItems,
  conversationSummary,
  relatedSessions,
  heartShareItems,
  infoCards,
  error,
  onClose,
  onPressInfo,
  onPressChecklist,
  onPressConversation,
  onChangeConversationSection,
  onOpenSession,
  onOpenToday,
}: {
  visible: boolean;
  dateLabel: string;
  isoDate: string;
  selectedIsToday: boolean;
  modalSection: string;
  conversationSection: string;
  checklistStatus: ProfileStatusBadge;
  infoStatus: ProfileStatusBadge;
  conversationStatus: ProfileStatusBadge;
  checklistItems: { id: string; label: string; completed: boolean }[];
  conversationSummary: string;
  relatedSessions: RecentChatSummary[];
  heartShareItems: ProfileHeartShareItem[];
  infoCards: ProfileInfoCard[];
  error: string | null;
  onClose: () => void;
  onPressInfo: () => void;
  onPressChecklist: () => void;
  onPressConversation: () => void;
  onChangeConversationSection: (value: string) => void;
  onOpenSession: (sessionId: string) => void;
  onOpenToday: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.modalSafeArea}>
        <View style={styles.modalHeader}>
          <Pressable
            style={styles.modalCloseButton}
            onPress={onClose}
            accessibilityLabel="기록 상세 닫기"
          >
            <CloseIcon
              name="close"
              size={space.lg + space.sm}
              color={surface.textPrimary}
            />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.modalHero}>
            <Text style={styles.modalTitle}>{dateLabel || isoDate}</Text>
            <Text style={styles.modalDescription}>
              이 날의 활동 내역을 확인해요.
            </Text>
          </View>

          <View style={styles.modalTabRow}>
            <Pressable
              style={[styles.modalStatusTab, modalTabStyle(infoStatus.tone)]}
              onPress={onPressInfo}
            >
              <View style={styles.modalStatusHeader}>
                <BookIcon
                  name="book-outline"
                  size={space.lg + space.xs}
                  color={modalTabTextStyle(infoStatus.tone).color}
                />
                <Text
                  style={[
                    styles.modalStatusLabel,
                    modalTabTextStyle(infoStatus.tone),
                  ]}
                >
                  정보 확인
                </Text>
              </View>
              <Text
                style={[
                  styles.modalStatusValue,
                  modalTabTextStyle(infoStatus.tone),
                ]}
              >
                {infoStatus.label}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.modalStatusTab, modalTabStyle(checklistStatus.tone)]}
              onPress={onPressChecklist}
            >
              <View style={styles.modalStatusHeader}>
                <CheckIcon
                  name="checkmark-circle-outline"
                  size={space.lg + space.xs}
                  color={modalTabTextStyle(checklistStatus.tone).color}
                />
                <Text
                  style={[
                    styles.modalStatusLabel,
                    modalTabTextStyle(checklistStatus.tone),
                  ]}
                >
                  체크리스트
                </Text>
              </View>
              <Text
                style={[
                  styles.modalStatusValue,
                  modalTabTextStyle(checklistStatus.tone),
                ]}
              >
                {checklistStatus.label}
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.modalStatusTab,
                modalTabStyle(conversationStatus.tone),
              ]}
              onPress={onPressConversation}
            >
              <View style={styles.modalStatusHeader}>
                <ChatIcon
                  name="chatbubble-outline"
                  size={space.lg + space.xs}
                  color={modalTabTextStyle(conversationStatus.tone).color}
                />
                <Text
                  style={[
                    styles.modalStatusLabel,
                    modalTabTextStyle(conversationStatus.tone),
                  ]}
                >
                  대화
                </Text>
              </View>
              <Text
                style={[
                  styles.modalStatusValue,
                  modalTabTextStyle(conversationStatus.tone),
                ]}
              >
                {conversationStatus.label}
              </Text>
            </Pressable>
          </View>

          {modalSection === "checklist" ? (
            <Card>
              <Text style={styles.modalSectionTitle}>체크리스트</Text>
              <Text style={styles.modalSectionDescription}>
                {selectedIsToday
                  ? "오늘 체크 흐름으로 이어서 볼 수 있어요."
                  : "지난 날짜 기록은 확인만 할 수 있어요."}
              </Text>
              <View style={styles.modalChecklistList}>
                {checklistItems.map((item) => (
                  <View
                    key={item.id}
                    style={[styles.modalChecklistCard, shadows.card]}
                  >
                    <View
                      style={
                        item.completed
                          ? [styles.modalCheckbox, styles.modalCheckboxChecked]
                          : styles.modalCheckbox
                      }
                    />
                    <Text style={styles.modalChecklistLabel}>{item.label}</Text>
                  </View>
                ))}
                {checklistItems.length === 0 ? (
                  <Text style={styles.modalEmptyText}>
                    이 날짜에 남아 있는 체크리스트가 없어요.
                  </Text>
                ) : null}
              </View>
            </Card>
          ) : null}

          {modalSection === "conversation" ? (
            <Card>
              <Text style={styles.modalSectionTitle}>대화</Text>
              <PatientTodayTabs
                sections={[
                  { id: "summary", label: "대화 요약" },
                  { id: "heart", label: "아기와 나누는 마음" },
                ]}
                activeSection={conversationSection}
                onChange={onChangeConversationSection}
              />

              {conversationSection === "summary" ? (
                <View style={styles.modalPanel}>
                  <Text style={styles.modalSummaryText}>{conversationSummary}</Text>
                  {relatedSessions.map((session) => (
                    <Pressable
                      key={session.id}
                      style={styles.modalConversationCard}
                      onPress={() => onOpenSession(session.id)}
                      accessibilityLabel={`${session.title} 대화 다시 열기`}
                    >
                      <Text style={styles.modalConversationMeta}>
                        {session.updatedAtLabel}
                      </Text>
                      <Text style={styles.modalConversationTitle}>
                        {session.title}
                      </Text>
                      {session.preview ? (
                        <Text style={styles.modalConversationBody}>
                          {session.preview}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              ) : null}

              {conversationSection === "heart" ? (
                <View style={styles.modalPanel}>
                  {heartShareItems.map((item) => (
                    <View key={item.id} style={styles.modalQnaCard}>
                      <Text style={styles.modalQuestion}>Q. {item.question}</Text>
                      <Text style={styles.modalAnswer}>A. {item.answer}</Text>
                      <View style={styles.modalAiResponse}>
                        <Text style={styles.modalAiTitle}>AI 응답</Text>
                        <Text style={styles.modalAiBody}>{item.summary}</Text>
                      </View>
                    </View>
                  ))}
                  {heartShareItems.length === 0 ? (
                    <Text style={styles.modalEmptyText}>
                      이 날짜에 보여드릴 대화 요약이 아직 없어요.
                    </Text>
                  ) : null}
                </View>
              ) : null}
            </Card>
          ) : null}

          {modalSection === "info" ? (
            <Card>
              <Text style={styles.modalSectionTitle}>정보 확인</Text>
              <Text style={styles.modalSectionDescription}>
                오늘 우리에서 아기와 엄마의 정보를 다시 확인할 수 있어요.
              </Text>
              <View style={styles.modalInfoList}>
                {infoCards.map((item) => (
                  <View key={item.id} style={styles.modalInfoCard}>
                    <Text style={styles.modalInfoTitle}>{item.title}</Text>
                    <Text style={styles.modalInfoBody}>{item.body}</Text>
                  </View>
                ))}
              </View>
              <Button label="오늘,우리로 이동" onPress={onOpenToday} />
            </Card>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  errorText: {
    ...typo.caption,
    color: palette.errorText,
  },
  modalSafeArea: {
    flex: 1,
    backgroundColor: surface.surfacePrimary,
    paddingTop: space.xl,
  },
  modalHeader: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    alignItems: "flex-start",
  },
  modalCloseButton: {
    width: space.xxxl + space.md,
    height: space.xxxl + space.xs,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceSecondary,
  },
  modalContent: {
    paddingHorizontal: space.lg,
    paddingTop: space.lg,
    paddingBottom: space.xxxl,
    gap: space.lg,
  },
  modalHero: {
    gap: space.xs,
  },
  modalTitle: {
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  modalDescription: {
    ...typo.body,
    color: surface.textSecondary,
  },
  modalTabRow: {
    flexDirection: "row",
    gap: space.sm,
  },
  modalStatusTab: {
    flex: 1,
    borderRadius: radii.xl,
    paddingHorizontal: space.md,
    paddingVertical: space.lg,
    gap: space.sm,
  },
  modalStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
  },
  modalStatusLabel: {
    ...typo.label,
  },
  modalStatusValue: {
    ...typo.titleSm,
  },
  modalTabSuccess: {
    backgroundColor: palette.successBackground,
  },
  modalTabConversation: {
    backgroundColor: surface.surfaceSecondary,
  },
  modalTabMuted: {
    backgroundColor: surface.surfaceSecondary,
  },
  modalTabIdle: {
    backgroundColor: surface.surfaceSecondary,
  },
  modalTabTextSuccess: {
    color: palette.successText,
  },
  modalTabTextConversation: {
    color: palette.accent,
  },
  modalTabTextMuted: {
    color: surface.textSecondary,
  },
  modalTabTextIdle: {
    color: surface.textSecondary,
  },
  modalSectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
    marginBottom: space.xs,
  },
  modalSectionDescription: {
    ...typo.caption,
    color: surface.textSecondary,
    marginBottom: space.md,
  },
  modalChecklistList: {
    gap: space.sm,
  },
  modalChecklistCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  modalCheckbox: {
    width: space.xl + space.xs,
    height: space.xl + space.xs,
    borderRadius: radii.sm,
    backgroundColor: surface.fieldSurface,
  },
  modalCheckboxChecked: {
    backgroundColor: palette.accent,
  },
  modalChecklistLabel: {
    ...typo.body,
    color: surface.textPrimary,
    flex: 1,
  },
  modalEmptyText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  modalPanel: {
    marginTop: space.md,
    gap: space.xs,
  },
  modalSummaryText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  modalConversationCard: {
    borderRadius: radii.lg,
    backgroundColor: surface.surfacePrimary,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    gap: space.xs,
    ...shadows.card,
  },
  modalConversationMeta: {
    ...typo.caption,
    color: palette.accent,
  },
  modalConversationTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  modalConversationBody: {
    ...typo.body,
    color: surface.textSecondary,
  },
  modalQnaCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
    gap: space.sm,
  },
  modalQuestion: {
    ...typo.label,
    color: palette.accent,
  },
  modalAnswer: {
    ...typo.body,
    color: surface.textPrimary,
  },
  modalAiResponse: {
    borderRadius: radii.lg,
    backgroundColor: surface.surfaceSecondary,
    padding: space.lg,
    gap: space.xs,
  },
  modalAiTitle: {
    ...typo.label,
    color: palette.accent,
  },
  modalAiBody: {
    ...typo.body,
    color: surface.textSecondary,
  },
  modalInfoList: {
    gap: space.sm,
    marginBottom: space.lg,
  },
  modalInfoCard: {
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
    gap: space.sm,
  },
  modalInfoTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  modalInfoBody: {
    ...typo.body,
    color: surface.textSecondary,
  },
});
