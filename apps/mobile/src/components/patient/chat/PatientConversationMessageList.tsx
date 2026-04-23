import { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { ChatPartRenderer, TypingIndicator } from "../../chat";
import { resolveQuickReplyDisplayLabel } from "../../chat/ChatPartRenderer.model";
import { NurseAvatar, NurseCharacter } from "../NurseCharacter";
import { Pressable } from "../../ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../../theme";
import {
  isRenderableConversationPart,
  resolveRenderableConversationMessages,
  resolveAssistantMessageIdsWithLaterUserMessage,
  resolveConversationMessageListState,
  resolveLatestVisibleQuickRepliesMessageId,
  resolveShouldShowTypingIndicator,
} from "./PatientConversationMessageList.model";

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
  onQuickReplySelect: (message: string, choiceId?: string) => void;
  onRetrySessionLoad: () => void;
  onSurveyAnswer: (surveyId: string, choiceId: string) => Promise<boolean>;
  surveySaveErrorText: string;
  onDeepLinkPress: (
    target: string,
    entityId?: string,
    meta?: {
      title?: string;
      description?: string;
      weekNumber?: number | null;
    },
  ) => void;
}) {
  const [didChooseEmptyReply, setDidChooseEmptyReply] = useState(false);
  const assistantMessageIdsWithLaterUserMessage =
    resolveAssistantMessageIdsWithLaterUserMessage(messages);
  const latestQuickRepliesMessageId = resolveLatestVisibleQuickRepliesMessageId(
    {
      messages,
      assistantMessageIdsWithLaterUserMessage,
    },
  );
  const renderableMessages = resolveRenderableConversationMessages({
    messages,
    assistantMessageIdsWithLaterUserMessage,
    latestQuickRepliesMessageId,
  });
  const listState = resolveConversationMessageListState({
    messagesLength: renderableMessages.length,
    isLoadingSessionDetail,
    sessionLoadErrorMessage,
  });
  const shouldShowTypingIndicator = resolveShouldShowTypingIndicator({
    listState,
    isSending,
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

      {listState === "empty" && !isSending ? (
        <View style={styles.emptyStateContent}>
          <View style={styles.assistantRow}>
            <NurseAvatar />
            <View style={styles.emptyAssistantStack}>
              <Text style={styles.assistantName}>아가야</Text>
              <View style={styles.assistantBubbleRow}>
                <View style={styles.emptyAssistantBubble}>
                  <Text style={styles.messageText}>
                    오늘 마음이나 몸 상태를 편하게 적어보세요.
                  </Text>
                </View>
              </View>
              {!didChooseEmptyReply ? (
                <View style={styles.quickRepliesWrapper}>
                  <View style={styles.quickRepliesRow}>
                    {EMPTY_STATE_QUICK_REPLIES.map((choice) => (
                      <Pressable
                        key={choice.id}
                        style={styles.quickReplyPill}
                        onPress={() => {
                          setDidChooseEmptyReply(true);
                          onQuickReplySelect(choice.message, choice.id);
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={choice.label}
                      >
                        <Text style={styles.quickReplyLabel}>
                          {resolveQuickReplyDisplayLabel(choice.label)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}

      {listState === "messages" || shouldShowTypingIndicator ? (
        <View style={styles.threadedContent}>
          <View style={styles.messageList}>
            {renderableMessages.map((message) => {
              if (message.role === "user") {
                const textPart = message.parts.find(
                  (part) => part.type === "text",
                );
                const imagePart = message.parts.find(
                  (part) => part.type === "image",
                );
                const bodyText = textPart?.type === "text" ? textPart.text : "";

                return (
                  <View key={message.id} style={styles.userMessageRow}>
                    <View style={[styles.messageBubble, styles.userBubble]}>
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
                  </View>
                );
              }

              const visibleParts = message.parts.filter((part) =>
                isRenderableConversationPart({
                  part,
                  messageId: message.id,
                  assistantMessageIdsWithLaterUserMessage,
                  latestQuickRepliesMessageId,
                }),
              );
              if (visibleParts.length === 0) {
                return null;
              }

              return (
                <View key={message.id} style={styles.assistantRow}>
                  <NurseAvatar emotionTone={message.characterTone ?? null} />
                  <View style={styles.assistantStack}>
                    <Text style={styles.assistantName}>아가야</Text>
                    {visibleParts.map((part) => {
                      const isImage = part.type === "image";
                      const isQuickReplies = part.type === "quickReplies";
                      const isDeepLink = part.type === "deepLink";
                      return (
                        <View key={part.id} style={styles.assistantBubbleRow}>
                          <View
                            style={[
                              styles.assistantColumn,
                              isImage
                                ? styles.assistantImageWrapper
                                : isQuickReplies
                                  ? styles.assistantQuickRepliesWrapper
                                  : isDeepLink
                                    ? styles.assistantDeepLinkWrapper
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
                        </View>
                      );
                    })}
                  </View>
                </View>
              );
            })}
            {shouldShowTypingIndicator ? (
              <View style={styles.assistantRow}>
                <NurseAvatar />
                <View style={styles.assistantStack}>
                  <Text style={styles.assistantName}>아가야</Text>
                  <View style={styles.assistantBubbleRow}>
                    <View
                      style={[
                        styles.assistantColumn,
                        styles.assistantMessageWrapper,
                        styles.typingIndicatorWrapper,
                      ]}
                    >
                      <TypingIndicator />
                    </View>
                  </View>
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
    paddingHorizontal: space.md,
    paddingTop: 0,
    backgroundColor: surface.surfaceSecondary,
  },
  emptyStateContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
    paddingTop: space.lg,
    paddingBottom: space.xl,
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
    paddingTop: space.xs,
  },
  quickRepliesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    gap: space.sm,
  },
  quickReplyPill: {
    borderRadius: radii.full,
    backgroundColor: surface.surfacePrimary,
    paddingVertical: space.md,
    paddingHorizontal: space.xl,
    maxWidth: "100%",
    minWidth: 0,
    flexShrink: 1,
  },
  quickReplyLabel: {
    ...typo.caption,
    color: palette.accent,
    fontWeight: "600",
    flexShrink: 1,
    flexWrap: "wrap",
  },
  threadedContent: {
    paddingTop: space.lg,
  },
  messageList: {
    gap: space.md,
  },
  messageBubble: {
    borderRadius: radii.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  userMessageRow: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "flex-end",
    gap: space.xs,
    maxWidth: "92%",
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: surface.surfaceAccent,
    maxWidth: "86%",
    gap: space.sm,
    borderTopRightRadius: radii.sm,
  },
  userBubbleImage: {
    width: CHAT_IMAGE_WIDTH,
    maxWidth: "100%",
    height: 160,
    borderRadius: radii.lg,
    alignSelf: "stretch",
  },
  assistantStack: {
    flex: 1,
    alignSelf: "flex-start",
    maxWidth: "86%",
    gap: space.xs,
  },
  emptyAssistantStack: {
    flex: 1,
    alignSelf: "flex-start",
    maxWidth: "86%",
    gap: space.xs,
  },
  assistantRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.xs,
    maxWidth: "100%",
  },
  assistantName: {
    ...typo.caption,
    color: surface.textSecondary,
    marginLeft: space.xs,
  },
  assistantBubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.xs,
  },
  assistantColumn: {
    alignItems: "flex-start",
    alignSelf: "flex-start",
    maxWidth: "84%",
  },
  assistantImageWrapper: {
    borderRadius: radii.xl,
    overflow: "hidden",
    backgroundColor: "transparent",
    maxWidth: "100%",
  },
  assistantMessageWrapper: {
    backgroundColor: surface.surfacePrimary,
    borderRadius: radii.lg,
    borderTopLeftRadius: radii.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    maxWidth: "100%",
    width: "100%",
  },
  typingIndicatorWrapper: {
    minWidth: space.xxxl,
  },
  assistantQuickRepliesWrapper: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  assistantDeepLinkWrapper: {
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  emptyAssistantBubble: {
    backgroundColor: surface.surfacePrimary,
    borderRadius: radii.lg,
    borderTopLeftRadius: radii.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    maxWidth: "100%",
  },
  messageText: {
    ...typo.body,
    color: surface.textPrimary,
  },
  userMessageText: {
    color: surface.textPrimary,
  },
  messageTimeText: {
    ...typo.caption,
    color: surface.textSecondary,
    marginBottom: space.xs,
    flexShrink: 0,
  },
});
