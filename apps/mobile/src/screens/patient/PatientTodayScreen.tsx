// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import type {
  ChatMessage,
  RecentChatSummary,
  TodayViewData,
} from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useChatSessions } from "../../chat/store";
import { ChatPartRenderer } from "../../components/chat";
import { Card, Pressable } from "../../components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientTodayTabs } from "../../components/patient/PatientTodayTabs";
import { NurseCharacter } from "../../components/patient/NurseCharacter";
import { useMobileServices } from "../../core/MobileServicesProvider";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";
import {
  buildPatientTabContentInsets,
  buildTodayConversationLayout,
} from "./patientScreenLayout.model";
import { buildPatientTodayViewModel } from "./view-models";
import { appendAssistantMessages } from "./PatientTodayScreen.model";

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

function createUserMessage(text: string): ChatMessage {
  return {
    id: `user-${Date.now()}`,
    role: "user",
    createdAtLabel: "방금 전",
    parts: [{ type: "text", id: `text-${Date.now()}`, text }],
  };
}

const QUICK_STARTERS = [
  "안녕, 아가야 👋",
  "오늘 기분이...",
  "궁금한 게 있어",
  "엄마 몸이 좀...",
];

export function PatientTodayScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const services = useMobileServices();
  const { getSession, replaceSession, appendMessage } = useChatSessions();
  const [today, setToday] = useState<TodayViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [activeSection, setActiveSection] = useState("info");
  const [conversationSessionId, setConversationSessionId] = useState<
    string | null
  >(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingChecklistIds, setPendingChecklistIds] = useState<string[]>([]);
  const conversationLayout = buildTodayConversationLayout();
  const contentInsets = buildPatientTabContentInsets({
    bottomInset: insets.bottom,
    extraBottomSpacing:
      activeSection === "conversation"
        ? conversationLayout.sendButtonSize + space.xxxl
        : space.lg,
    topSpacing: space.xs,
  });

  useEffect(() => {
    Promise.all([
      services.todayPort.getTodayView(),
      services.chatPort.listRecentChats(),
    ])
      .then(([nextToday, nextRecentSessions]) => {
        setToday(nextToday);
        setRecentSessions(nextRecentSessions);
      })
      .catch(() => undefined);
  }, [services]);

  useEffect(() => {
    if (activeSection !== "info" || today?.infoViewed) {
      return;
    }

    services.todayPort
      .markInfoViewed()
      .then(() => {
        setToday((current) =>
          current ? { ...current, infoViewed: true } : current,
        );
      })
      .catch(() => undefined);
  }, [activeSection, services, today?.infoViewed]);

  useEffect(() => {
    if (conversationSessionId) {
      return;
    }

    setConversationSessionId(recentSessions[0]?.id ?? createSessionId());
  }, [conversationSessionId, recentSessions]);

  useEffect(() => {
    if (!conversationSessionId) {
      return;
    }

    const hasExistingSession = recentSessions.some(
      (session) => session.id === conversationSessionId,
    );
    if (!hasExistingSession) {
      return;
    }

    services.chatPort
      .getSession(conversationSessionId)
      .then(replaceSession)
      .catch(() => undefined);
  }, [conversationSessionId, recentSessions, replaceSession, services]);

  const viewModel = buildPatientTodayViewModel({
    today,
  });
  const session = useMemo(
    () =>
      conversationSessionId
        ? getSession(conversationSessionId)
        : { id: "pending", title: "아기와 대화", messages: [] },
    [conversationSessionId, getSession],
  );

  async function handleSend(overrideText?: string) {
    const nextText = (overrideText ?? text).trim();
    if (!conversationSessionId || !nextText || isSending) {
      return;
    }

    appendMessage(
      conversationSessionId,
      "아기와 대화",
      createUserMessage(nextText),
    );
    setText("");
    setIsSending(true);

    try {
      const assistantMessages = await services.chatPort.sendMessage({
        sessionId: conversationSessionId,
        text: nextText,
        imageUris: [],
      });
      const [firstMessage, ...followUpMessages] = assistantMessages;
      if (firstMessage) {
        appendMessage(conversationSessionId, "아기와 대화", firstMessage);
      }
      if (followUpMessages.length > 0) {
        setTimeout(() => {
          for (const message of followUpMessages) {
            appendMessage(conversationSessionId, "아기와 대화", message);
          }
        }, 1500);
      }
    } finally {
      setIsSending(false);
    }
  }

  async function handleToggleChecklistItem(checklistId: string) {
    if (!today || pendingChecklistIds.includes(checklistId)) {
      return;
    }

    const target = today.checklistItems.find((item) => item.id === checklistId);
    if (!target) {
      return;
    }

    const nextCompleted = !target.completed;
    setPendingChecklistIds((current) => [...current, checklistId]);
    setToday((current) =>
      current
        ? {
            ...current,
            checklistItems: current.checklistItems.map((item) =>
              item.id === checklistId
                ? { ...item, completed: nextCompleted }
                : item,
            ),
          }
        : current,
    );

    try {
      await services.todayPort.setChecklistItemCompleted({
        checklistId,
        completed: nextCompleted,
      });
    } catch {
      setToday((current) =>
        current
          ? {
              ...current,
              checklistItems: current.checklistItems.map((item) =>
                item.id === checklistId
                  ? { ...item, completed: target.completed }
                  : item,
              ),
            }
          : current,
      );
    } finally {
      setPendingChecklistIds((current) =>
        current.filter((id) => id !== checklistId),
      );
    }
  }

  function handleQuickReplySelect(message: string) {
    handleSend(message);
  }

  function handleSurveyAnswer(surveyId: string, choiceId: string) {
    services.chatPort
      ?.saveSurveyAnswer?.({ surveyId, choiceId })
      .catch(() => undefined);
  }

  function handleDeepLinkPress(target: string, entityId?: string) {
    try {
      const path = entityId
        ? `/chat/link/${target}?entityId=${encodeURIComponent(entityId)}`
        : `/chat/link/${target}`;
      router.push(path);
    } catch {
      // 탐색 불가 경우 무시
    }
  }

  return (
    <PatientShell
      activeTab="today"
      title="오늘,우리"
      pageTone="plain"
      headerCompact
      showProfileButton={false}
    >
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
          <PatientTodayTabs
            sections={viewModel.sections}
            activeSection={activeSection}
            onChange={setActiveSection}
          />

          {activeSection === "info" ? (
            <Card style={styles.segmentCard}>
              <View style={styles.segmentSection}>
                <View style={styles.iconTitleRow}>
                  <View style={[styles.sectionIconWrap, styles.babyIconWrap]}>
                    <Ionicons
                      name="happy-outline"
                      size={space.lg + space.xs}
                      color={palette.accent}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>
                    {viewModel.babyCard.title}
                  </Text>
                </View>
                <View style={[styles.innerPanel, styles.babyPanel]}>
                  <Text style={styles.sectionBody}>
                    {viewModel.babyCard.body}
                  </Text>
                </View>
              </View>

              <View style={styles.segmentDivider} />

              <View style={styles.segmentSection}>
                <View style={styles.iconTitleRow}>
                  <View style={[styles.sectionIconWrap, styles.momIconWrap]}>
                    <Ionicons
                      name="heart-outline"
                      size={space.lg + space.xs}
                      color={palette.accent}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>
                    {viewModel.momCard.title}
                  </Text>
                </View>
                <View style={[styles.innerPanel, styles.momPanel]}>
                  <Text style={styles.sectionBody}>
                    {viewModel.momCard.body}
                  </Text>
                </View>
              </View>
            </Card>
          ) : null}

          {activeSection === "checklist" ? (
            <Card style={styles.segmentCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconTitleRow}>
                  <View
                    style={[styles.sectionIconWrap, styles.checklistIconWrap]}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={space.lg + space.xs}
                      color={palette.successText}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>
                    {viewModel.checklistTitle}
                  </Text>
                </View>
              </View>

              <View style={styles.checklist}>
                {viewModel.checklistItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.checklistRow}
                    onPress={() => handleToggleChecklistItem(item.id)}
                    disabled={pendingChecklistIds.includes(item.id)}
                    accessibilityLabel={`${item.label} ${item.completed ? "완료됨" : "미완료"}`}
                  >
                    <View
                      style={[
                        styles.checkbox,
                        item.completed ? styles.checkboxCompleted : null,
                      ]}
                    />
                    <Text style={styles.checklistLabel}>{item.label}</Text>
                  </Pressable>
                ))}
                {viewModel.checklistItems.length === 0 ? (
                  <Text style={styles.emptyChecklistText}>
                    오늘 체크리스트를 준비 중이에요.
                  </Text>
                ) : null}
              </View>

              <View style={styles.progressMetaRow}>
                <Text style={styles.progressMetaLabel}>완료율</Text>
                <Text
                  style={styles.progressPercent}
                >{`${viewModel.checklistProgressPercent}%`}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${viewModel.checklistProgressPercent}%` },
                  ]}
                />
              </View>
            </Card>
          ) : null}

          {activeSection === "conversation" ? (
            <Card
              style={[
                styles.segmentCard,
                styles.conversationCard,
                { minHeight: conversationLayout.cardMinHeight },
              ]}
            >
              <View style={styles.iconTitleRow}>
                <View
                  style={[styles.sectionIconWrap, styles.conversationIconWrap]}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={space.lg + space.xs}
                    color={palette.accent}
                  />
                </View>
                <Text style={styles.sectionTitle}>
                  {viewModel.conversationTitle}
                </Text>
              </View>

              {session.messages.length === 0 ? (
                <View
                  style={[
                    styles.emptyState,
                    { minHeight: conversationLayout.emptyStateMinHeight },
                  ]}
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={space.xxxl + space.lg}
                    color={surface.strokeSubtle}
                  />
                  <Text style={styles.emptyText}>
                    {viewModel.conversationDescription}
                  </Text>
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
                </View>
              ) : (
                <View style={styles.messageList}>
                  {session.messages.map((message) => {
                    if (message.role === "assistant") {
                      return (
                        <View key={message.id} style={styles.assistantColumn}>
                          <NurseCharacter size="sm" />
                          <View
                            style={[
                              styles.messageBubble,
                              styles.assistantBubble,
                            ]}
                          >
                            <ChatPartRenderer
                              message={message}
                              onQuickReplySelect={handleQuickReplySelect}
                              onSurveyAnswer={handleSurveyAnswer}
                              onDeepLinkPress={handleDeepLinkPress}
                            />
                          </View>
                        </View>
                      );
                    }

                    const textPart = message.parts.find(
                      (part) => part.type === "text",
                    );
                    const imageParts = message.parts.filter(
                      (part) => part.type === "image",
                    );
                    const bodyText =
                      textPart?.type === "text" ? textPart.text : null;

                    return (
                      <View
                        key={message.id}
                        style={[styles.messageBubble, styles.userBubble]}
                      >
                        {imageParts.map((part) =>
                          part.type === "image" ? (
                            <View key={part.id} style={styles.userImageWrap}>
                              <Image
                                source={{ uri: part.imageUrl }}
                                style={styles.userImage}
                                resizeMode="cover"
                                accessibilityLabel={part.alt ?? "첨부 이미지"}
                              />
                            </View>
                          ) : null,
                        )}
                        {bodyText ? (
                          <Text
                            style={[styles.messageText, styles.userMessageText]}
                          >
                            {bodyText}
                          </Text>
                        ) : null}
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          ) : null}
        </ScrollView>

        {activeSection === "conversation" ? (
          <Card variant="muted" style={styles.conversationComposerCard}>
            <View style={styles.composerRow}>
              <TextInput
                style={styles.input}
                placeholder="아기에게 하고 싶은 말을 적어보세요..."
                placeholderTextColor={surface.textSecondary}
                value={text}
                onChangeText={setText}
              />
              <Pressable
                style={[
                  styles.sendButton,
                  isSending ? styles.sendButtonDisabled : null,
                ]}
                onPress={handleSend}
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
        ) : null}
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.lg,
    gap: space.md,
    flexGrow: 1,
  },
  segmentCard: {
    gap: space.md,
    padding: space.lg,
  },
  segmentSection: {
    gap: space.md,
  },
  segmentDivider: {
    height: 1,
    backgroundColor: surface.strokeSubtle,
  },
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  sectionIconWrap: {
    width: space.xxl + space.xs,
    height: space.xxl + space.xs,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  babyIconWrap: {
    backgroundColor: surface.surfaceAccent,
  },
  momIconWrap: {
    backgroundColor: surface.surfaceSecondary,
  },
  checklistIconWrap: {
    backgroundColor: palette.successBackground,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  innerPanel: {
    borderRadius: radii.xl,
    padding: space.lg,
  },
  babyPanel: {
    backgroundColor: surface.surfaceAccent,
  },
  momPanel: {
    backgroundColor: surface.surfaceSecondary,
  },
  sectionBody: {
    ...typo.body,
    color: surface.textSecondary,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  progressLabel: {
    ...typo.label,
    color: palette.successText,
  },
  checklist: {
    marginTop: space.lg,
    gap: space.lg,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  checkbox: {
    width: space.xl + space.xs,
    height: space.xl + space.xs,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    backgroundColor: surface.fieldSurface,
  },
  checkboxCompleted: {
    backgroundColor: palette.successBackground,
    borderColor: palette.successText,
  },
  checklistLabel: {
    ...typo.titleSm,
    color: surface.textPrimary,
    flex: 1,
  },
  emptyChecklistText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  progressMetaRow: {
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: surface.strokeSubtle,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressMetaLabel: {
    ...typo.label,
    color: surface.textSecondary,
  },
  progressPercent: {
    ...typo.titleSm,
    color: palette.successText,
  },
  progressTrack: {
    marginTop: space.md,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: surface.strokeSubtle,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: palette.successText,
  },
  conversationCard: {
    gap: space.md,
  },
  conversationComposerCard: {
    marginTop: "auto",
    marginHorizontal: space.lg,
    marginBottom: 0,
  },
  conversationIconWrap: {
    backgroundColor: surface.surfaceSecondary,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
    paddingTop: space.xxxl * 2,
    paddingBottom: space.xxxl * 2,
  },
  emptyText: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
    paddingHorizontal: space.md,
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
  },
  assistantColumn: {
    alignItems: "flex-start",
    gap: space.sm,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: surface.surfaceSecondary,
  },
  messageText: {
    ...typo.body,
    color: surface.textPrimary,
  },
  userMessageText: {
    color: surface.surfacePrimary,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: radii.xl,
    backgroundColor: surface.fieldSurface,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm + space.xs,
    ...typo.body,
    color: surface.textPrimary,
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
  userImageWrap: {
    borderRadius: radii.lg,
    overflow: "hidden",
    marginBottom: space.xs,
  },
  userImage: {
    width: "100%",
    height: 160,
    borderRadius: radii.lg,
    backgroundColor: surface.fieldSurface,
  },
});
