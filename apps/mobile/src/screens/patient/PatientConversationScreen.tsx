// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import { Button, Card } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { palette, patientSurfacePalette as surface, radii, space, typo } from "../../theme";

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

export function PatientConversationScreen({ sessionId }: { sessionId: string }) {
  const services = useMobileServices();
  const { getSession, replaceSession, appendMessage } = useChatSessions();
  const resolvedSessionId = useMemo(
    () => (sessionId === "new" || sessionId === "heart-talk" ? createSessionId() : sessionId),
    [sessionId],
  );
  const session = getSession(resolvedSessionId);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (sessionId === "new" || sessionId === "heart-talk") {
      return;
    }

    services.chatPort.getSession(resolvedSessionId).then(replaceSession).catch(() => undefined);
  }, [replaceSession, resolvedSessionId, services, sessionId]);

  async function handleSend() {
    const nextText = text.trim();
    if (!nextText || isSending) {
      return;
    }

    appendMessage(resolvedSessionId, "아기와 나누는 마음", createUserMessage(nextText));
    setText("");
    setIsSending(true);

    try {
      const assistantMessage = await services.chatPort.sendMessage({
        sessionId: resolvedSessionId,
        text: nextText,
        imageUris: [],
      });
      appendMessage(resolvedSessionId, "아기와 나누는 마음", assistantMessage);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <PatientShell activeTab="today" title="아기와 대화" backHref="/today">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card>
            <Text style={styles.title}>아기와 나누는 마음</Text>
            <Text style={styles.description}>아기에게 하고 싶은 이야기를 나눠보세요</Text>
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
                  const textPart = message.parts.find((part) => part.type === "text");
                  const body = textPart?.type === "text" ? textPart.text : "이미지 또는 안내가 포함된 메시지예요.";
                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.messageBubble,
                        message.role === "user" ? styles.userBubble : styles.assistantBubble,
                      ]}
                    >
                      <Text style={[styles.messageText, message.role === "user" ? styles.userMessageText : null]}>
                        {body}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </Card>

          <Card variant="muted">
            <View style={styles.composerRow}>
              <TextInput
                style={styles.input}
                placeholder="아기에게 하고 싶은 말을 적어보세요..."
                placeholderTextColor={surface.textSecondary}
                value={text}
                onChangeText={setText}
                multiline
              />
              <Button label={isSending ? "..." : "↗"} onPress={handleSend} disabled={isSending} />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 140,
    gap: space.lg,
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
    minHeight: 360,
  },
  emptyState: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
    gap: space.md,
  },
  emptyIcon: {
    fontSize: 48,
    color: surface.textSecondary,
  },
  emptyText: {
    ...typo.body,
    color: surface.textSecondary,
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
    gap: space.sm,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    minHeight: 88,
    borderRadius: radii.xl,
    backgroundColor: surface.fieldSurface,
    padding: space.lg,
    ...typo.body,
    color: surface.textPrimary,
    textAlignVertical: "top",
  },
});
