// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import type { ChatMessage, RecentChatSummary, TodayViewData } from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useChatSessions } from "../../chat/store";
import { Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientTodayTabs } from "../../components/patient/PatientTodayTabs";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";
import { buildPatientTodayViewModel } from "./view-models";

function createSessionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function createUserMessage(text: string): ChatMessage {
  return {
    id: `user-${Date.now()}`,
    role: "user",
    createdAtLabel: "방금 전",
    parts: [{ type: "text", id: `text-${Date.now()}`, text }],
  };
}

export function PatientTodayScreen() {
  const services = useMobileServices();
  const { getSession, replaceSession, appendMessage } = useChatSessions();
  const [today, setToday] = useState<TodayViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [activeSection, setActiveSection] = useState("info");
  const [conversationSessionId, setConversationSessionId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [pendingChecklistIds, setPendingChecklistIds] = useState<string[]>([]);

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
    if (conversationSessionId) {
      return;
    }

    setConversationSessionId(recentSessions[0]?.id ?? createSessionId());
  }, [conversationSessionId, recentSessions]);

  useEffect(() => {
    if (!conversationSessionId) {
      return;
    }

    const hasExistingSession = recentSessions.some((session) => session.id === conversationSessionId);
    if (!hasExistingSession) {
      return;
    }

    services.chatPort.getSession(conversationSessionId).then(replaceSession).catch(() => undefined);
  }, [conversationSessionId, recentSessions, replaceSession, services]);

  const viewModel = buildPatientTodayViewModel({
    today,
  });
  const session = useMemo(
    () =>
      conversationSessionId
        ? getSession(conversationSessionId)
        : { id: "pending", title: "아기와 나누는 마음", messages: [] },
    [conversationSessionId, getSession],
  );

  async function handleSend() {
    const nextText = text.trim();
    if (!conversationSessionId || !nextText || isSending) {
      return;
    }

    appendMessage(conversationSessionId, "아기와 나누는 마음", createUserMessage(nextText));
    setText("");
    setIsSending(true);

    try {
      const assistantMessage = await services.chatPort.sendMessage({
        sessionId: conversationSessionId,
        text: nextText,
        imageUris: [],
      });
      appendMessage(conversationSessionId, "아기와 나누는 마음", assistantMessage);
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
              item.id === checklistId ? { ...item, completed: nextCompleted } : item,
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
                item.id === checklistId ? { ...item, completed: target.completed } : item,
              ),
            }
          : current,
      );
    } finally {
      setPendingChecklistIds((current) => current.filter((id) => id !== checklistId));
    }
  }

  return (
    <PatientShell activeTab="today" title="오늘,우리" pageTone="plain">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
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
                    <Ionicons name="happy-outline" size={18} color={palette.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>{viewModel.babyCard.title}</Text>
                </View>
                <View style={[styles.innerPanel, styles.babyPanel]}>
                  <Text style={styles.sectionBody}>{viewModel.babyCard.body}</Text>
                </View>
              </View>

              <View style={styles.segmentDivider} />

              <View style={styles.segmentSection}>
                <View style={styles.iconTitleRow}>
                  <View style={[styles.sectionIconWrap, styles.momIconWrap]}>
                    <Ionicons name="heart-outline" size={18} color={palette.accent} />
                  </View>
                  <Text style={styles.sectionTitle}>{viewModel.momCard.title}</Text>
                </View>
                <View style={[styles.innerPanel, styles.momPanel]}>
                  <Text style={styles.sectionBody}>{viewModel.momCard.body}</Text>
                </View>
              </View>
            </Card>
          ) : null}

          {activeSection === "checklist" ? (
            <Card style={styles.segmentCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.iconTitleRow}>
                  <View style={[styles.sectionIconWrap, styles.checklistIconWrap]}>
                    <Ionicons name="checkmark-circle-outline" size={18} color={palette.successText} />
                  </View>
                  <Text style={styles.sectionTitle}>{viewModel.checklistTitle}</Text>
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
                    <View style={[styles.checkbox, item.completed ? styles.checkboxCompleted : null]} />
                    <Text style={styles.checklistLabel}>{item.label}</Text>
                  </Pressable>
                ))}
                {viewModel.checklistItems.length === 0 ? (
                  <Text style={styles.emptyChecklistText}>오늘 체크리스트를 준비 중이에요.</Text>
                ) : null}
              </View>

              <View style={styles.progressMetaRow}>
                <Text style={styles.progressMetaLabel}>완료율</Text>
                <Text style={styles.progressPercent}>{`${viewModel.checklistProgressPercent}%`}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${viewModel.checklistProgressPercent}%` }]} />
              </View>
            </Card>
          ) : null}

          {activeSection === "conversation" ? (
            <Card style={[styles.segmentCard, styles.conversationCard]}>
              <View style={styles.iconTitleRow}>
                <View style={[styles.sectionIconWrap, styles.conversationIconWrap]}>
                  <Ionicons name="chatbubble-outline" size={18} color="#8a3ffc" />
                </View>
                <Text style={styles.sectionTitle}>{viewModel.conversationTitle}</Text>
              </View>

              {session.messages.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="chatbubble-outline" size={48} color="#d5d9e3" />
                  <Text style={styles.emptyText}>{viewModel.conversationDescription}</Text>
                </View>
              ) : (
                <View style={styles.messageList}>
                  {session.messages.map((message) => {
                    const textPart = message.parts.find((part) => part.type === "text");
                    const body =
                      textPart?.type === "text" ? textPart.text : "이미지 또는 안내가 포함된 메시지예요.";
                    return (
                      <View
                        key={message.id}
                        style={[
                          styles.messageBubble,
                          message.role === "user" ? styles.userBubble : styles.assistantBubble,
                        ]}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            message.role === "user" ? styles.userMessageText : null,
                          ]}
                        >
                          {body}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <View style={styles.segmentDivider} />

              <View style={styles.composerRow}>
                <TextInput
                  style={styles.input}
                  placeholder="아기에게 하고 싶은 말을 적어보세요..."
                  placeholderTextColor={surface.textSecondary}
                  value={text}
                  onChangeText={setText}
                />
                <Pressable
                  style={[styles.sendButton, isSending ? styles.sendButtonDisabled : null]}
                  onPress={handleSend}
                  disabled={isSending}
                  accessibilityLabel="메시지 보내기"
                >
                  <Ionicons name="paper-plane-outline" size={20} color="#ffffff" />
                </Pressable>
              </View>
            </Card>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 140,
    gap: space.lg,
  },
  segmentCard: {
    gap: space.lg,
  },
  segmentSection: {
    gap: space.md,
  },
  segmentDivider: {
    height: 1,
    backgroundColor: "#ececf0",
  },
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  babyIconWrap: {
    backgroundColor: "#f7e9ef",
  },
  momIconWrap: {
    backgroundColor: "#f4eef8",
  },
  checklistIconWrap: {
    backgroundColor: "#eef5ef",
  },
  sectionTitle: {
    ...typo.titleSm,
    color: "#1f1a1d",
  },
  innerPanel: {
    borderRadius: radii.xl,
    padding: space.lg,
  },
  babyPanel: {
    backgroundColor: "#fbf1f7",
  },
  momPanel: {
    backgroundColor: "#f5f0fb",
  },
  sectionBody: {
    ...typo.body,
    color: "#5d5a67",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  progressLabel: {
    ...typo.label,
    color: "#34a853",
  },
  checklist: {
    marginTop: space.xl,
    gap: space.xl,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d6d8de",
    backgroundColor: "#f3f3f5",
  },
  checkboxCompleted: {
    backgroundColor: palette.successBackground,
    borderColor: palette.successText,
  },
  checklistLabel: {
    ...typo.titleSm,
    color: "#30313a",
    flex: 1,
  },
  emptyChecklistText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  progressMetaRow: {
    marginTop: space.xxl,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: "#ececf0",
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
    backgroundColor: "#ececf0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: palette.successText,
  },
  conversationCard: {
    gap: space.lg,
  },
  conversationIconWrap: {
    backgroundColor: "#f4efff",
  },
  emptyState: {
    minHeight: 220,
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
  },
  emptyText: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
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
    backgroundColor: "#c084fc",
    maxWidth: "84%",
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: surface.surfaceSecondary,
    maxWidth: "88%",
  },
  messageText: {
    ...typo.body,
    color: surface.textPrimary,
  },
  userMessageText: {
    color: "#ffffff",
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  input: {
    flex: 1,
    minHeight: 56,
    borderRadius: radii.xl,
    backgroundColor: surface.fieldSurface,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
    ...typo.body,
    color: surface.textPrimary,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: radii.lg,
    backgroundColor: "#c084fc",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
