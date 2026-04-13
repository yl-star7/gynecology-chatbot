// @ts-nocheck
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
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
import { Card, Pressable, EmotionCheckin } from "../../components/ui";
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
import {
  buildConversationComposerLayout,
  buildPatientTabContentInsets,
} from "./patientScreenLayout.model";
import { resolvePatientConversationSendError } from "./patientErrorCopy.model";

type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

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
  const [showEmotionCheckin, setShowEmotionCheckin] = useState(
    sessionId === "new" || sessionId === "heart-talk",
  );
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionTone | null>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const composerLayout = buildConversationComposerLayout();
  const contentInsets = buildPatientTabContentInsets({
    bottomInset: insets.bottom,
    extraBottomSpacing: space.lg,
    topSpacing: space.md,
  });

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

  async function handleEmotionSelect(tone: EmotionTone) {
    setShowEmotionCheckin(false);
    setSelectedEmotion(tone);
    try {
      await services.recordsPort.saveEmotionCheckin({
        sessionId: resolvedSessionId,
        emotionTone: tone,
      });
    } catch {
      // 감정 저장 실패 시 조용히 무시
    }
  }

  function handleEmotionDismiss() {
    setShowEmotionCheckin(false);
  }

  return (
    <PatientShell activeTab="today" backHref="/(tabs)/today" pageTone="plain">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={space.xxxl + space.xl}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: contentInsets.paddingTop,
              paddingBottom: contentInsets.paddingBottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.chatCard}>
            <View style={styles.chatBody}>
              <NurseCharacter emotionTone={selectedEmotion} size="md" />

              <View style={styles.chatHeaderRow}>
                <View style={styles.chatHeaderIconWrap}>
                  <Ionicons
                    name="chatbubble-outline"
                    size={space.xl}
                    color={palette.accent}
                  />
                </View>
                <Text style={styles.title}>아기와 대화</Text>
              </View>
              {session.messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>◌</Text>
                  <Text style={styles.emptyText}>
                    아기에게 하고 싶은 이야기를 나눠보세요
                  </Text>
                  <View style={styles.quickStarterWrap}>
                    {[
                      "안녕, 아가야 👋",
                      "오늘 태동을 느꼈어",
                      "잠을 잘 못 자",
                      "배가 자주 뭉쳐",
                    ].map((starter) => (
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
                </View>
              ) : (
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
                        <NurseCharacter
                          size="sm"
                          emotionTone={selectedEmotion}
                        />
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
                      <NurseCharacter size="sm" emotionTone={selectedEmotion} />
                      <View style={styles.assistantMessageWrapper}>
                        <TypingIndicator />
                      </View>
                    </View>
                  ) : null}
                </View>
              )}
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

          <Card variant="muted" style={styles.composerCard}>
            {errorMessage && (
              <Pressable onPress={() => setErrorMessage(null)}>
                <Text style={styles.errorMessageText}>{errorMessage}</Text>
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
                  name="paper-plane-outline"
                  size={space.lg + space.sm}
                  color={surface.surfacePrimary}
                />
              </Pressable>
            </View>
          </Card>
        </ScrollView>

        {showEmotionCheckin ? (
          <EmotionCheckin
            onSelect={handleEmotionSelect}
            onDismiss={handleEmotionDismiss}
          />
        ) : null}
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: space.lg,
    gap: space.md,
    flexGrow: 1,
  },
  title: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  chatCard: {
    minHeight: 0,
  },
  chatBody: {
    gap: space.lg,
  },
  chatHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  chatHeaderIconWrap: {
    width: space.xxxl,
    height: space.xxxl,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.accentSoft,
  },
  emptyState: {
    minHeight: 0,
    paddingTop: space.xxxl * 2,
    paddingBottom: space.xxxl * 2,
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
  },
  emptyIcon: {
    fontSize: space.xxxl + space.lg,
    color: surface.textSecondary,
  },
  emptyText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  quickStarterWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space.sm,
    marginTop: space.lg,
    paddingHorizontal: space.md,
  },
  quickStarterChip: {
    backgroundColor: palette.accentSoft,
    borderRadius: radii.full,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
  },
  quickStarterText: {
    ...typo.label,
    color: palette.accent,
  },
  messageList: {
    gap: space.sm,
  },
  messageBubble: {
    borderRadius: radii.xl,
    padding: space.lg,
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
    flexDirection: "column",
    alignItems: "flex-start",
    gap: space.sm,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  assistantMessageWrapper: {
    backgroundColor: surface.surfaceSecondary,
    borderRadius: radii.xl,
    padding: space.lg,
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
  composerCard: {
    marginTop: "auto",
  },
  composerRow: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 52,
    maxHeight: space.xxxl * 3,
    borderRadius: radii.xl,
    backgroundColor: surface.fieldSurface,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + space.xs,
    ...typo.body,
    color: surface.textPrimary,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  errorMessageText: {
    ...typo.caption,
    color: palette.errorText,
    textAlign: "center",
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
});
