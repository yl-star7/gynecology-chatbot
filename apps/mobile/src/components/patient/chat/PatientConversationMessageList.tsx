import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { ChatPartRenderer, TypingIndicator } from "../../chat";
import { NurseCharacter } from "../NurseCharacter";
import { Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";

const EMPTY_STATE_QUICK_REPLIES = [
  { id: "baby", label: "아기 괜찮을까요?", message: "오늘 아기 상태가 괜찮은지 궁금해요." },
  { id: "pain", label: "배가 당겨요", message: "배가 당기는데 괜찮은지 알려주세요." },
  { id: "sleep", label: "잠이 안 와요", message: "잠이 잘 안 와서 힘들어요." },
  { id: "mood", label: "마음이 불안해요", message: "괜히 마음이 불안한데 괜찮을까요?" },
];

export function PatientConversationMessageList({
  scrollViewRef,
  messages,
  isSending,
  scrollBottomPadding,
  onQuickReplySelect,
  onSurveyAnswer,
  surveySaveErrorText,
  onDeepLinkPress,
}: {
  scrollViewRef: (instance: ScrollView | null) => void;
  messages: ChatMessage[];
  isSending: boolean;
  scrollBottomPadding: number;
  onQuickReplySelect: (message: string) => void;
  onSurveyAnswer: (surveyId: string, choiceId: string) => Promise<boolean>;
  surveySaveErrorText: string;
  onDeepLinkPress: (target: string, entityId?: string) => void;
}) {
  return (
    <ScrollView
      ref={scrollViewRef}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: scrollBottomPadding },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {messages.length === 0 ? (
        <View style={styles.emptyStateContent}>
          <View style={styles.heroSection}>
            <NurseCharacter size="md" />
            <Text style={styles.title}>아기와 대화</Text>
            <Text style={styles.subtitle}>
              오늘 마음이나 몸 상태를 편하게 적어보세요.
            </Text>
          </View>
          <View style={styles.quickRepliesWrapper}>
            <Text style={styles.quickRepliesTitle}>이렇게 시작해보세요</Text>
            <View style={styles.quickRepliesRow}>
              {EMPTY_STATE_QUICK_REPLIES.map((choice) => (
                <Pressable
                  key={choice.id}
                  style={styles.quickReplyPill}
                  onPress={() => onQuickReplySelect(choice.message)}
                  accessibilityRole="button"
                  accessibilityLabel={choice.label}
                >
                  <Text style={styles.quickReplyLabel}>{choice.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.threadedContent}>
          <View style={styles.messageList}>
            {messages.map((message) => {
              if (message.role === "user") {
                const textPart = message.parts.find((part) => part.type === "text");
                const imagePart = message.parts.find((part) => part.type === "image");
                const bodyText = textPart?.type === "text" ? textPart.text : "";

                return (
                  <View
                    key={message.id}
                    style={[styles.messageBubble, styles.userBubble]}
                  >
                    {imagePart?.type === "image" ? (
                      <Image
                        source={{ uri: imagePart.imageUrl }}
                        style={styles.userBubbleImage}
                        resizeMode="cover"
                        accessibilityLabel={imagePart.alt}
                      />
                    ) : null}
                    {bodyText ? (
                      <Text style={[styles.messageText, styles.userMessageText]}>
                        {bodyText}
                      </Text>
                    ) : null}
                  </View>
                );
              }

              const hasContent = message.parts.some((part) =>
                part.type === "text"
                  ? part.text.trim() !== "" && part.text.trim() !== "..."
                  : true,
              );
              if (!hasContent) {
                return null;
              }

              return (
                <View key={message.id} style={styles.assistantColumn}>
                  <View style={styles.assistantMessageWrapper}>
                    <ChatPartRenderer
                      message={message}
                      onQuickReplySelect={onQuickReplySelect}
                      onSurveyAnswer={onSurveyAnswer}
                      surveySaveErrorText={surveySaveErrorText}
                      onDeepLinkPress={onDeepLinkPress}
                    />
                  </View>
                </View>
              );
            })}
            {isSending ? (
              <View style={styles.assistantColumn}>
                <View style={styles.assistantMessageWrapper}>
                  <TypingIndicator />
                </View>
              </View>
            ) : null}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
  },
  emptyStateContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: space.lg,
    paddingBottom: space.xxxl,
  },
  heroSection: {
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  title: {
    ...typo.titleSm,
    color: surface.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
  },
  quickRepliesWrapper: {
    width: "100%",
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  quickRepliesTitle: {
    ...typo.caption,
    color: surface.textSecondary,
    textAlign: "center",
  },
  quickRepliesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space.sm,
  },
  quickReplyPill: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.accent,
    backgroundColor: surface.surfacePrimary,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  quickReplyLabel: {
    ...typo.caption,
    color: palette.accent,
    fontWeight: "600",
  },
  threadedContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
    paddingTop: space.md,
  },
  messageList: {
    gap: space.sm,
  },
  messageBubble: {
    borderRadius: radii.xl,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: palette.accent,
    maxWidth: "84%",
    gap: space.sm,
  },
  userBubbleImage: {
    width: "100%",
    height: 160,
    borderRadius: radii.lg,
  },
  assistantColumn: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  assistantMessageWrapper: {
    backgroundColor: surface.surfaceSecondary,
    borderRadius: radii.xl,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    maxWidth: "100%",
  },
  messageText: {
    ...typo.body,
    color: surface.textPrimary,
  },
  userMessageText: {
    color: surface.surfacePrimary,
  },
});