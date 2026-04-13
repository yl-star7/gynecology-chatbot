// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import type {
  ChatMessage,
  RecentChatSummary,
} from "@gynecology-chatbot/app-core";
import {
  AppState,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import { Card, Pressable } from "../../components/ui";
import {
  ChatPartRenderer,
  ChatImagePicker,
  ChatImagePreview,
  TypingIndicator,
} from "../../components/chat";
import { PatientShell } from "../../components/patient/PatientShell";
import { NurseCharacter } from "../../components/patient/NurseCharacter";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";
import { resolvePatientConversationSendError } from "./patientErrorCopy.model";

type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

const QUICK_STARTERS = [
  "안녕, 아가야",
  "오늘 태동을 느꼈어",
  "잠을 잘 못 자",
  "배가 자주 뭉쳐",
];

function createSessionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    (character) => {
      const random = Math.floor(Math.random() * 16);
      const value = character === "x" ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    },
  );
}

function createTodayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createUserMessage(
  text: string,
  imageDataUri?: string | null,
): ChatMessage {
  const parts: ChatMessage["parts"] = [
    { type: "text", id: `text-${Date.now()}`, text },
  ];
  if (imageDataUri) {
    parts.push({
      type: "image",
      id: `img-${Date.now()}`,
      imageUrl: imageDataUri,
      alt: "첨부 이미지",
    });
  }
  return {
    id: `user-${Date.now()}`,
    role: "user",
    createdAtLabel: "방금 전",
    parts,
  };
}

export function PatientConversationScreen({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const services = useMobileServices();
  const { getSession, replaceSession, appendMessage } = useChatSessions();
  const resolvedSessionId = useMemo(
    () =>
      sessionId === "new" || sessionId === "heart-talk"
        ? createSessionId()
        : sessionId,
    [sessionId],
  );
  const session = getSession(resolvedSessionId);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTone | null>(
    null,
  );
  const [todaySessions, setTodaySessions] = useState<RecentChatSummary[]>([]);
  const [isTodaySessionsOpen, setIsTodaySessionsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const emptyStateBottomSpacing = insets.bottom + space.md;
  const threadedContentBottomSpacing =
    insets.bottom + space.xxxl * 2 + space.lg;

  useEffect(() => {
    if (sessionId === "new" || sessionId === "heart-talk") {
      return;
    }

    services.chatPort
      .getSession(resolvedSessionId)
      .then(replaceSession)
      .catch(() => undefined);

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        nextState === "active" &&
        resolvedSessionId &&
        sessionId !== "new" &&
        sessionId !== "heart-talk"
      ) {
        services.chatPort
          .getSession(resolvedSessionId)
          .then(replaceSession)
          .catch(() => undefined);
      }
    });
    return () => subscription.remove();
  }, [replaceSession, resolvedSessionId, services, sessionId]);

  async function handleSend(overrideText?: string) {
    const nextText = (overrideText ?? text).trim();
    if (!nextText || isSending) {
      return;
    }

    const capturedImage = imageDataUri;
    appendMessage(
      resolvedSessionId,
      "아기와 대화",
      createUserMessage(nextText, capturedImage),
    );
    setText("");
    setImageDataUri(null);
    setErrorMessage(null);
    setIsSending(true);

    try {
      const assistantMessages = await services.chatPort.sendMessage({
        sessionId: resolvedSessionId,
        text: nextText,
        imageUris: capturedImage ? [capturedImage] : [],
      });
      const [firstMessage, ...followUpMessages] = assistantMessages;
      if (firstMessage) {
        appendMessage(resolvedSessionId, "아기와 대화", firstMessage);
      }
      if (followUpMessages.length > 0) {
        setTimeout(() => {
          for (const msg of followUpMessages) {
            appendMessage(resolvedSessionId, "아기와 대화", msg);
          }
        }, 1500);
      }
    } catch (error: unknown) {
      setErrorMessage(resolvePatientConversationSendError(error));
    } finally {
      setIsSending(false);
    }
  }

  function handleQuickReply(replyMessage: string) {
    handleSend(replyMessage);
  }

  function handleSurveyAnswer(surveyId: string, choiceId: string) {
    try {
      services.recordsPort
        .saveSurveyResponse({ questionId: surveyId, answer: choiceId })
        .catch(() => undefined);
    } catch {
      // 기록 실패 시 조용히 무시
    }
  }

  function handleDeepLink(target: string, entityId?: string) {
    const params = entityId ? `?entityId=${entityId}` : "";
    router.push(`/${target}${params}`);
  }

  async function handleOpenTodaySessions() {
    if (isTodaySessionsOpen) {
      setIsTodaySessionsOpen(false);
      return;
    }

    try {
      const recordDay =
        await services.homePort.getRecordDay(createTodayIsoDate());
      setTodaySessions(recordDay.relatedSessions);
    } catch {
      setTodaySessions([]);
    }

    setIsTodaySessionsOpen(true);
  }

  function handleSelectTodaySession(nextSessionId: string) {
    setIsTodaySessionsOpen(false);
    if (nextSessionId === resolvedSessionId) {
      return;
    }
    router.push(`/chat/${nextSessionId}`);
  }

  return (
    <PatientShell
      activeTab="today"
      backHref="/(tabs)/today"
      pageTone="plain"
      headerCompact
      showProfileButton={false}
      rightActionIcon="list"
      rightActionLabel="오늘 대화 보기"
      onRightActionPress={handleOpenTodaySessions}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={space.xxxl + space.xl}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            session.messages.length === 0
              ? {
                  paddingTop: space.md,
                  paddingBottom: emptyStateBottomSpacing,
                }
              : {
                  paddingTop: space.md,
                  paddingBottom: threadedContentBottomSpacing,
                },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {isTodaySessionsOpen ? (
            <Card style={styles.todaySessionsCard}>
              <Text style={styles.todaySessionsTitle}>오늘 지난 세션</Text>
              <View style={styles.todaySessionsList}>
                {todaySessions.length > 0 ? (
                  todaySessions.map((item) => (
                    <Pressable
                      key={item.id}
                      style={styles.todaySessionChip}
                      onPress={() => handleSelectTodaySession(item.id)}
                    >
                      <Text style={styles.todaySessionTitle}>{item.title}</Text>
                      {item.preview ? (
                        <Text
                          style={styles.todaySessionPreview}
                          numberOfLines={1}
                        >
                          {item.preview}
                        </Text>
                      ) : null}
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.todaySessionsEmptyText}>
                    오늘 이어볼 대화가 아직 없어요.
                  </Text>
                )}
              </View>
            </Card>
          ) : null}

          {session.messages.length === 0 ? (
            <View style={styles.emptyStateContent}>
              <View style={styles.emptyStateHeroArea}>
                <View style={styles.heroSection}>
                  <NurseCharacter emotionTone={selectedEmotion} size="md" />
                  <Text style={styles.title}>아기와 대화</Text>
                </View>
              </View>

              {imageDataUri ? (
                <View style={styles.imagePreviewRow}>
                  <ChatImagePreview
                    dataUri={imageDataUri}
                    onRemove={() => setImageDataUri(null)}
                  />
                </View>
              ) : null}

              <View style={styles.composerContainer}>
                <View style={styles.quickStarterWrap}>
                  {QUICK_STARTERS.map((starter) => (
                    <Pressable
                      key={starter}
                      style={styles.quickStarterChip}
                      onPress={() => handleSend(starter)}
                      disabled={isSending}
                    >
                      <Text style={styles.quickStarterText}>{starter}</Text>
                    </Pressable>
                  ))}
                </View>

                <Card variant="muted" style={styles.composerCard}>
                  {errorMessage && (
                    <Pressable onPress={() => setErrorMessage(null)}>
                      <Text style={styles.errorMessageText}>
                        {errorMessage}
                      </Text>
                    </Pressable>
                  )}
                  <View style={styles.composerRow}>
                    <ChatImagePicker
                      onImageSelected={setImageDataUri}
                      disabled={isSending}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="아기에게 하고 싶은 말을 적어보세요..."
                      placeholderTextColor={surface.textSecondary}
                      value={text}
                      onChangeText={setText}
                      multiline
                      maxLength={3000}
                    />
                    <Pressable
                      style={[
                        styles.sendButton,
                        isSending ? styles.sendButtonDisabled : null,
                      ]}
                      onPress={() => handleSend()}
                      disabled={isSending}
                      accessibilityLabel="메시지 보내기"
                    >
                      <Ionicons
                        name="arrow-up"
                        size={20}
                        color={surface.surfacePrimary}
                      />
                    </Pressable>
                  </View>
                </Card>
              </View>
            </View>
          ) : (
            <>
              <Card style={styles.chatCard}>
                <View style={styles.chatBody}>
                  <View style={styles.heroSection}>
                    <NurseCharacter emotionTone={selectedEmotion} size="md" />
                    <Text style={styles.title}>아기와 대화</Text>
                  </View>
                  <View style={styles.messageList}>
                    {session.messages.map((message) => {
                      if (message.role === "user") {
                        const textPart = message.parts.find(
                          (p) => p.type === "text",
                        );
                        const imagePart = message.parts.find(
                          (p) => p.type === "image",
                        );
                        const bodyText =
                          textPart?.type === "text" ? textPart.text : "";
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
                                style={[
                                  styles.messageText,
                                  styles.userMessageText,
                                ]}
                              >
                                {bodyText}
                              </Text>
                            ) : null}
                          </View>
                        );
                      }

                      const hasContent = message.parts.some((p) =>
                        p.type === "text"
                          ? p.text.trim() !== "" && p.text.trim() !== "..."
                          : true,
                      );
                      if (!hasContent) return null;

                      return (
                        <View key={message.id} style={styles.assistantColumn}>
                          <View style={styles.assistantMessageWrapper}>
                            <ChatPartRenderer
                              message={message}
                              onQuickReplySelect={handleQuickReply}
                              onSurveyAnswer={handleSurveyAnswer}
                              onDeepLinkPress={handleDeepLink}
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
              </Card>

              {imageDataUri ? (
                <View style={styles.imagePreviewRow}>
                  <ChatImagePreview
                    dataUri={imageDataUri}
                    onRemove={() => setImageDataUri(null)}
                  />
                </View>
              ) : null}

              <View style={styles.composerContainer}>
                <Card variant="muted" style={styles.composerCard}>
                  {errorMessage && (
                    <Pressable onPress={() => setErrorMessage(null)}>
                      <Text style={styles.errorMessageText}>
                        {errorMessage}
                      </Text>
                    </Pressable>
                  )}
                  <View style={styles.composerRow}>
                    <ChatImagePicker
                      onImageSelected={setImageDataUri}
                      disabled={isSending}
                    />
                    <TextInput
                      style={styles.input}
                      placeholder="아기에게 하고 싶은 말을 적어보세요..."
                      placeholderTextColor={surface.textSecondary}
                      value={text}
                      onChangeText={setText}
                      multiline
                      maxLength={3000}
                    />
                    <Pressable
                      style={[
                        styles.sendButton,
                        isSending ? styles.sendButtonDisabled : null,
                      ]}
                      onPress={() => handleSend()}
                      disabled={isSending}
                      accessibilityLabel="메시지 보내기"
                    >
                      <Ionicons
                        name="arrow-up"
                        size={20}
                        color={surface.surfacePrimary}
                      />
                    </Pressable>
                  </View>
                </Card>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: space.lg,
    gap: space.sm,
    flexGrow: 1,
  },
  emptyStateContent: {
    flexGrow: 1,
    minHeight: "100%",
    justifyContent: "flex-end",
    gap: space.xs,
  },
  emptyStateHeroArea: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: space.xl,
  },
  title: {
    ...typo.titleSm,
    color: surface.textPrimary,
    textAlign: "center",
  },
  todaySessionsCard: {
    gap: space.xs,
    paddingVertical: space.sm,
  },
  todaySessionsTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  todaySessionsList: {
    gap: space.xs,
  },
  todaySessionChip: {
    borderRadius: radii.lg,
    backgroundColor: surface.surfaceSecondary,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + space.xs,
    gap: space.xs,
  },
  todaySessionTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  todaySessionPreview: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  todaySessionsEmptyText: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  chatCard: {
    minHeight: 0,
  },
  chatBody: {
    gap: space.sm,
  },
  heroSection: {
    alignItems: "center",
    gap: space.xs,
    paddingTop: 0,
    paddingBottom: space.xs,
  },
  quickStarterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space.xs,
    marginTop: 0,
    marginBottom: 0,
    paddingHorizontal: 0,
  },
  quickStarterChip: {
    backgroundColor: palette.accentSoft,
    borderRadius: radii.full,
    paddingHorizontal: space.md,
    paddingVertical: space.xs + space.xs,
  },
  quickStarterText: {
    ...typo.label,
    color: palette.accent,
  },
  messageList: {
    gap: space.xs + space.xs,
  },
  messageBubble: {
    borderRadius: radii.xl,
    padding: space.md,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: palette.accent,
    maxWidth: `${100 - space.lg}%`,
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
    padding: space.md,
    maxWidth: "100%",
  },
  messageText: {
    ...typo.body,
    color: surface.textPrimary,
  },
  userMessageText: {
    color: surface.surfacePrimary,
  },
  imagePreviewRow: {
    paddingHorizontal: space.xs,
  },
  composerContainer: {
    gap: space.xs,
  },
  composerCard: {
    marginTop: 0,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    paddingLeft: space.xs,
    paddingRight: space.sm,
  },
  composerRow: {
    flexDirection: "row",
    gap: space.xs,
    alignItems: "center",
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: space.xxxl * 3,
    borderRadius: radii.xl,
    backgroundColor: surface.fieldSurface,
    paddingHorizontal: space.md,
    paddingTop: space.xs,
    paddingBottom: space.sm,
    ...typo.body,
    color: surface.textPrimary,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: radii.full,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    ...typo.label,
    color: surface.surfacePrimary,
  },
  errorMessageText: {
    ...typo.caption,
    color: palette.errorText,
    textAlign: "center",
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
});
