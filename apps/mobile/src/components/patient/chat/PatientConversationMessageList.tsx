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
import { resolveConversationMessageListState } from "./PatientConversationMessageList.model";

const EMPTY_STATE_QUICK_REPLIES = [
  {
    id: "baby",
    label: "아기 괜찮을까요?",
    message: "오늘 아기 상태가 괜찮은지 궁금해요.",
  },
  {
    id: "pain",
    label: "배가 당겨요",
    message: "배가 당기는데 괜찮은지 알려주세요.",
  },
  { id: "sleep", label: "잠이 안 와요", message: "잠이 잘 안 와서 힘들어요." },
  {
    id: "mood",
    label: "마음이 불안해요",
    message: "괜히 마음이 불안한데 괜찮을까요?",
  },
];

const CHAT_IMAGE_WIDTH = space.xxxl * 5;

export function PatientConversationMessageList({
  scrollViewRef,
  messages,
  isSending,
  isLoadingSessionDetail,
  sessionLoadErrorMessage,
  scrollBottomPadding,
  onQuickReplySelect,
  onRetrySessionLoad,
  onSurveyAnswer,
  surveySaveErrorText,
  onDeepLinkPress,
}: {
  scrollViewRef: (instance: ScrollView | null) => void;
  messages: ChatMessage[];
  isSending: boolean;
  isLoadingSessionDetail: boolean;
  sessionLoadErrorMessage: string | null;
  scrollBottomPadding: number;
  onQuickReplySelect: (message: string) => void;
  onRetrySessionLoad: () => void;
  onSurveyAnswer: (surveyId: string, choiceId: string) => Promise<boolean>;
  surveySaveErrorText: string;
  onDeepLinkPress: (target: string, entityId?: string) => void;
}) {
  const listState = resolveConversationMessageListState({
    messagesLength: messages.length,
    isLoadingSessionDetail,
    sessionLoadErrorMessage,
  });

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
      {listState === "loading" ? (
        <View style={styles.stateContent}>
          <NurseCharacter size="md" />
          <Text style={styles.stateTitle}>대화를 불러오고 있어요</Text>
          <Text style={styles.subtitle}>잠시만 기다려주세요.</Text>
        </View>
      ) : null}

      {listState === "error" ? (
        <View style={styles.stateContent}>
          <NurseCharacter size="md" />
          <Text style={styles.stateTitle}>
            {sessionLoadErrorMessage ?? "대화를 불러오지 못했어요."}
          </Text>
          <Text style={styles.subtitle}>잠시 후 다시 확인해 주세요.</Text>
          <Pressable
            style={styles.retryButton}
            onPress={onRetrySessionLoad}
            accessibilityRole="button"
            accessibilityLabel="대화 다시 불러오기"
          >
            <Text style={styles.retryButtonLabel}>다시 불러오기</Text>
          </Pressable>
        </View>
      ) : null}

      {listState === "empty" ? (
        <View style={styles.emptyStateContent}>
          <View style={styles.heroSection}>
            <NurseCharacter size="md" />
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
      ) : null}

      {listState === "messages" ? (
        <View style={styles.threadedContent}>
          <View style={styles.messageList}>
            {messages.map((message) => {
              if (message.role === "user") {
                const textPart = message.parts.find(
                  (part) => part.type === "text",
                );
                const imagePart = message.parts.find(
                  (part) => part.type === "image",
                );
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
                      <Text
                        style={[styles.messageText, styles.userMessageText]}
                      >
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
                <View key={message.id} style={styles.assistantStack}>
                  {message.parts.map((part) => {
                    if (
                      part.type === "text" &&
                      (part.text.trim() === "" || part.text.trim() === "...")
                    ) {
                      return null;
                    }
                    const isImage = part.type === "image";
                    return (
                      <View
                        key={part.id}
                        style={[
                          styles.assistantColumn,
                          isImage
                            ? styles.assistantImageWrapper
                            : styles.assistantMessageWrapper,
                        ]}
                      >
                        <ChatPartRenderer
                          message={{ ...message, parts: [part] }}
                          onQuickReplySelect={onQuickReplySelect}
                          onSurveyAnswer={onSurveyAnswer}
                          surveySaveErrorText={surveySaveErrorText}
                          onDeepLinkPress={onDeepLinkPress}
                        />
                      </View>
                    );
                  })}
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
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingTop: 0,
  },
  emptyStateContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "center",
    gap: space.md,
    paddingTop: space.sm,
    paddingBottom: space.xl,
  },
  heroSection: {
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
  },
  subtitle: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
  },
  stateContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingBottom: space.xl,
  },
  stateTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: space.xs,
    borderRadius: radii.lg,
    backgroundColor: palette.accent,
    paddingVertical: space.sm,
    paddingHorizontal: space.xl,
  },
  retryButtonLabel: {
    ...typo.button,
    color: surface.surfacePrimary,
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
    maxWidth: "100%",
  },
  quickReplyLabel: {
    ...typo.caption,
    color: palette.accent,
    fontWeight: "600",
    flexShrink: 1,
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
    width: CHAT_IMAGE_WIDTH,
    maxWidth: "100%",
    height: 160,
    borderRadius: radii.lg,
    alignSelf: "stretch",
  },
  assistantStack: {
    alignSelf: "flex-start",
    maxWidth: "100%",
    gap: space.sm,
  },
  assistantColumn: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  assistantImageWrapper: {
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: "transparent",
    maxWidth: "100%",
  },
  assistantMessageWrapper: {
    backgroundColor: surface.surfacePrimary,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    maxWidth: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  messageText: {
    ...typo.body,
    color: surface.textPrimary,
  },
  userMessageText: {
    color: surface.surfacePrimary,
  },
});
