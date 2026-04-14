// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChatMessage,
  RecentChatSummary,
} from "@gynecology-chatbot/app-core";
import {
  AppState,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
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
  const scrollViewRef = useRef<ScrollView | null>(null);
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
  const [todaySessions, setTodaySessions] = useState<RecentChatSummary[]>([]);
  const [isTodaySessionsOpen, setIsTodaySessionsOpen] = useState(false);
  const [isTodaySessionsLoading, setIsTodaySessionsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [composerHeight, setComposerHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardWillShow", () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener("keyboardWillHide", () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  useEffect(() => {
    if (session.messages.length === 0 && !isSending) {
      return;
    }

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 0);

    return () => clearTimeout(timer);
  }, [isSending, session.messages.length]);

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

    setIsTodaySessionsOpen(true);
    setIsTodaySessionsLoading(true);

    try {
      const recordDay =
        await services.homePort.getRecordDay(createTodayIsoDate());
      setTodaySessions(recordDay.relatedSessions);
    } catch {
      setTodaySessions([]);
    } finally {
      setIsTodaySessionsLoading(false);
    }
  }

  function handleSelectTodaySession(nextSessionId: string) {
    setIsTodaySessionsOpen(false);
    if (nextSessionId === resolvedSessionId) {
      return;
    }
    router.push(`/chat/${nextSessionId}`);
  }

  function handleComposerLayout(event: any) {
    const nextHeight = event.nativeEvent.layout.height;
    if (Math.abs(nextHeight - composerHeight) > 1) {
      setComposerHeight(nextHeight);
    }
  }

  const scrollBottomPadding = composerHeight + space.md;

  return (
    <PatientShell
      activeTab="today"
      backHref="/(tabs)/today"
      pageTone="plain"
      headerCompact
      showProfileButton={false}
      rightActionIcon="list"
      rightActionLabel="오늘 지난 대화 열기"
      onRightActionPress={handleOpenTodaySessions}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={space.xxxl}
      >
        <View style={styles.screen}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: scrollBottomPadding },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {session.messages.length === 0 ? (
              <View style={styles.emptyStateContent}>
                <View style={styles.heroSection}>
                  <NurseCharacter size="md" />
                  <Text style={styles.title}>아기와 대화</Text>
                  <Text style={styles.subtitle}>
                    오늘 마음이나 몸 상태를 편하게 적어보세요.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.threadedContent}>
                <View style={styles.messageList}>
                  {session.messages.map((message) => {
                    if (message.role === "user") {
                      const textPart = message.parts.find(
                        (part) => part.type === "text",
                      );
                      const imagePart = message.parts.find(
                        (part) => part.type === "image",
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
            )}
          </ScrollView>

          <View
            style={[
              styles.footerDock,
              {
                paddingBottom: isKeyboardVisible
                  ? space.xs
                  : insets.bottom + space.xs,
              },
            ]}
            onLayout={handleComposerLayout}
          >
            {imageDataUri ? (
              <View style={styles.imagePreviewRow}>
                <ChatImagePreview
                  dataUri={imageDataUri}
                  onRemove={() => setImageDataUri(null)}
                />
              </View>
            ) : null}

            {errorMessage ? (
              <Pressable onPress={() => setErrorMessage(null)}>
                <Text style={styles.errorMessageText}>{errorMessage}</Text>
              </Pressable>
            ) : null}

            <Card variant="muted" style={styles.composerCard}>
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

          <Modal
            visible={isTodaySessionsOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsTodaySessionsOpen(false)}
          >
            <View style={styles.drawerRoot}>
              <Pressable
                style={[StyleSheet.absoluteFillObject, styles.drawerBackdrop]}
                onPress={() => setIsTodaySessionsOpen(false)}
                accessibilityLabel="오늘 지난 대화 닫기"
              />
              <View
                style={[
                  styles.drawerPanel,
                  { paddingTop: insets.top + space.md },
                ]}
              >
                <View style={styles.drawerHeader}>
                  <Text style={styles.drawerTitle}>오늘 지난 대화</Text>
                  <Pressable
                    onPress={() => setIsTodaySessionsOpen(false)}
                    accessibilityLabel="오늘 지난 대화 닫기"
                    style={styles.drawerCloseButton}
                  >
                    <Ionicons
                      name="close"
                      size={space.lg + space.xs}
                      color={surface.textPrimary}
                    />
                  </Pressable>
                </View>

                <View style={styles.drawerList}>
                  {isTodaySessionsLoading ? (
                    <Text style={styles.drawerHelperText}>
                      오늘 대화를 불러오고 있어요.
                    </Text>
                  ) : todaySessions.length > 0 ? (
                    todaySessions.map((item) => {
                      const isCurrentSession = item.id === resolvedSessionId;
                      return (
                        <Pressable
                          key={item.id}
                          style={[
                            styles.drawerSessionCard,
                            isCurrentSession
                              ? styles.drawerSessionCardActive
                              : null,
                          ]}
                          onPress={() => handleSelectTodaySession(item.id)}
                          disabled={isCurrentSession}
                          accessibilityState={{ disabled: isCurrentSession }}
                        >
                          <Text style={styles.drawerSessionMeta}>
                            {item.updatedAtLabel}
                          </Text>
                          <Text
                            style={[
                              styles.drawerSessionTitle,
                              isCurrentSession
                                ? styles.drawerSessionTitleActive
                                : null,
                            ]}
                            numberOfLines={1}
                          >
                            {isCurrentSession
                              ? "지금 보고 있는 대화"
                              : item.title}
                          </Text>
                          <Text
                            style={styles.drawerSessionPreview}
                            numberOfLines={2}
                          >
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
        </View>
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: surface.surfacePrimary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space.lg,
    paddingTop: space.xs,
  },
  emptyStateContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
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
  footerDock: {
    gap: space.xs,
    paddingTop: space.xs,
    paddingHorizontal: space.lg,
    backgroundColor: surface.surfacePrimary,
  },
  imagePreviewRow: {
    alignItems: "flex-start",
    paddingHorizontal: space.xs,
  },
  composerCard: {
    paddingTop: space.xs,
    paddingBottom: space.xs,
    paddingLeft: space.xs,
    paddingRight: space.xs,
  },
  composerRow: {
    flexDirection: "row",
    gap: space.xs,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: space.xxxl * 3,
    borderRadius: radii.xl,
    backgroundColor: surface.fieldSurface,
    paddingHorizontal: space.md,
    paddingTop: space.sm,
    paddingBottom: space.sm,
    ...typo.body,
    color: surface.textPrimary,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
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
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
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
