// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { ChatPartRenderer, ChatImagePicker, ChatImagePreview } from "../../components/chat";
import { PatientShell } from "../../components/patient/PatientShell";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";

type EmotionTone = "calm" | "joyful" | "anxious" | "tired" | "sad";

function createSessionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function createUserMessage(text: string, imageDataUri?: string | null): ChatMessage {
  const parts: ChatMessage["parts"] = [{ type: "text", id: `text-${Date.now()}`, text }];
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

export function PatientConversationScreen({ sessionId }: { sessionId: string }) {
  const insets = useSafeAreaInsets();
  const services = useMobileServices();
  const { getSession, replaceSession, appendMessage } = useChatSessions();
  const resolvedSessionId = useMemo(
    () => (sessionId === "new" || sessionId === "heart-talk" ? createSessionId() : sessionId),
    [sessionId],
  );
  const session = getSession(resolvedSessionId);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [imageDataUri, setImageDataUri] = useState<string | null>(null);
  const [showEmotionCheckin, setShowEmotionCheckin] = useState(
    sessionId === "new" || sessionId === "heart-talk",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId === "new" || sessionId === "heart-talk") {
      return;
    }

    services.chatPort.getSession(resolvedSessionId).then(replaceSession).catch(() => undefined);

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && resolvedSessionId && sessionId !== "new" && sessionId !== "heart-talk") {
        services.chatPort.getSession(resolvedSessionId).then(replaceSession).catch(() => undefined);
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
    appendMessage(resolvedSessionId, "아기와 대화", createUserMessage(nextText, capturedImage));
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
      for (const msg of assistantMessages) {
        appendMessage(resolvedSessionId, "아기와 대화", msg);
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "메시지를 보내지 못했어요.";
      if (msg.includes("429")) {
        setErrorMessage("잠시 쉬어 가요. 조금 뒤에 다시 이야기해요.");
      } else {
        setErrorMessage("메시지를 보내지 못했어요. 다시 시도해주세요.");
      }
    } finally {
      setIsSending(false);
    }
  }

  function handleQuickReply(replyMessage: string) {
    handleSend(replyMessage);
  }

  function handleSurveyAnswer(surveyId: string, choiceId: string) {
    try {
      services.recordsPort?.saveSurveyResponse?.(surveyId, choiceId).catch(() => undefined);
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
    try {
      await services.recordsPort?.saveEmotionCheckin?.(tone);
    } catch {
      // 감정 저장 실패 시 조용히 무시
    }
  }

  function handleEmotionDismiss() {
    setShowEmotionCheckin(false);
  }

  return (
    <PatientShell activeTab="today" title="아기와 대화" backHref="/(tabs)/today" pageTone="plain">
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={space.xxxl + space.xl}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + space.xxxl * 3 + space.xl },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <Text style={styles.title}>아기와 대화</Text>
            <Text style={styles.description}>아기에게 하고 싶은 이야기를 나눠보세요.</Text>
          </Card>

          <Card style={styles.chatCard}>
            {session.messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>◌</Text>
                <Text style={styles.emptyText}>아기에게 하고 싶은 이야기를 나눠보세요</Text>
              </View>
            ) : (
              <View style={styles.messageList}>
                {session.messages.map((message) => {
                  if (message.role === "user") {
                    const textPart = message.parts.find((p) => p.type === "text");
                    const imagePart = message.parts.find((p) => p.type === "image");
                    const bodyText =
                      textPart?.type === "text" ? textPart.text : "";
                    return (
                      <View key={message.id} style={[styles.messageBubble, styles.userBubble]}>
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

                  // 어시스턴트 메시지 — 풍부한 렌더링
                  return (
                    <View key={message.id} style={styles.assistantMessageWrapper}>
                      <ChatPartRenderer
                        message={message}
                        onQuickReplySelect={handleQuickReply}
                        onSurveyAnswer={handleSurveyAnswer}
                        onDeepLinkPress={handleDeepLink}
                      />
                    </View>
                  );
                })}
              </View>
            )}
          </Card>

          {imageDataUri ? (
            <View style={styles.imagePreviewRow}>
              <ChatImagePreview
                dataUri={imageDataUri}
                onRemove={() => setImageDataUri(null)}
              />
            </View>
          ) : null}

          <Card variant="muted">
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
                style={[styles.sendButton, isSending ? styles.sendButtonDisabled : null]}
                onPress={() => handleSend()}
                disabled={isSending}
                accessibilityLabel="메시지 보내기"
              >
                <Ionicons name="paper-plane-outline" size={space.lg + space.sm} color={surface.surfacePrimary} />
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
    paddingTop: space.md,
    gap: space.md,
    flexGrow: 1,
  },
  title: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  description: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
  },
  chatCard: {
    minHeight: space.xxxl * 13 + space.md,
  },
  emptyState: {
    minHeight: space.xxxl * 9 + space.xs,
    flex: 1,
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
  messageList: {
    flexGrow: 1,
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
  assistantMessageWrapper: {
    alignSelf: "flex-start",
    backgroundColor: surface.surfaceSecondary,
    borderRadius: radii.xl,
    padding: space.lg,
    maxWidth: `${100 - (space.xl - space.xs)}%`,
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
  composerRow: {
    flexDirection: "row",
    gap: space.sm,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: space.xxxl + space.lg,
    maxHeight: space.xxxl * 4,
    borderRadius: radii.xl,
    backgroundColor: surface.fieldSurface,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + space.xs,
    ...typo.body,
    color: surface.textPrimary,
    textAlignVertical: "top",
  },
  sendButton: {
    width: space.xxxl + space.md,
    height: space.xxxl + space.md,
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
