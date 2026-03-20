// @ts-nocheck
import type { ChatMessage, RecentChatSummary } from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmptyState } from "../components/ui";
import { useChatSessions } from "../chat/store";
import { useMobileServices } from "../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../theme";

function createSessionId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function createUserMessage(text: string, imageUri: string): ChatMessage {
  const parts: ChatMessage["parts"] = [];

  if (text.trim()) {
    parts.push({ type: "text", id: `text-${Date.now()}`, text: text.trim() });
  }

  if (imageUri.trim()) {
    parts.push({
      type: "image",
      id: `image-${Date.now()}`,
      imageUrl: imageUri.trim(),
      alt: "첨부 이미지",
      caption: "사용자 첨부 이미지",
    });
  }

  return {
    id: `user-${Date.now()}`,
    role: "user",
    createdAtLabel: "방금 전",
    parts,
  };
}

export function ChatScreen({ sessionId }: { sessionId: string }) {
  const services = useMobileServices();
  const { getSession, replaceSession, appendMessage } = useChatSessions();
  const resolvedSessionId = useMemo(() => (sessionId === "new" ? createSessionId() : sessionId), [sessionId]);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const session = getSession(resolvedSessionId);
  const [text, setText] = useState("");
  const [imageUri, setImageUri] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showRecent, setShowRecent] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    services.chatPort
      .listRecentChats()
      .then((nextSessions) => {
        setRecentSessions(nextSessions);
      })
      .catch((error) => {
        console.error(`Failed to fetch sessions: ${error instanceof Error ? error.message : String(error)}`);
      });
  }, [services]);

  useEffect(() => {
    if (sessionId === "new") {
      return;
    }

    services.chatPort
      .getSession(resolvedSessionId)
      .then((nextSession) => {
        replaceSession(nextSession);
      })
      .catch((error) => {
        console.error(`Failed to fetch session: ${error instanceof Error ? error.message : String(error)}`);
      });
  }, [replaceSession, resolvedSessionId, services, sessionId]);

  useEffect(() => {
    if (session.messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [session.messages.length]);

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function handleSend() {
    if (!text.trim() && !imageUri.trim()) {
      return;
    }

    const nextTitle = session.title === "새 상담" && text ? text.slice(0, 24) : session.title;
    appendMessage(resolvedSessionId, nextTitle, createUserMessage(text, imageUri));
    setIsSending(true);

    try {
      const assistantMessage = await services.chatPort.sendMessage({
        sessionId: resolvedSessionId,
        text,
        imageUris: imageUri.trim() ? [imageUri.trim()] : [],
      });
      appendMessage(resolvedSessionId, nextTitle, assistantMessage);
      setText("");
      setImageUri("");
    } catch (error) {
      console.error(`Failed to send chat message: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardArea}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.replace("/home")} accessibilityLabel="홈으로 이동" style={styles.headerButton}>
            <Ionicons name="chevron-back" size={22} color={surface.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>{session.title}</Text>
          <Pressable onPress={() => setShowRecent(true)} accessibilityLabel="이전 상담 열기" style={styles.headerButton}>
            <Ionicons name="time-outline" size={22} color={surface.textPrimary} />
          </Pressable>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.messages}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {session.messages.length === 0 ? (
            <EmptyState
              icon="chatbubbles-outline"
              title="새로운 상담"
              description={"궁금한 점이나 걱정되는 증상을\n편하게 물어보세요."}
            />
          ) : null}

          {session.messages.map((message) => (
            <View key={message.id} style={[styles.messageBubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}>
              {message.parts.map((part) => {
                if (part.type === "text") {
                  return (
                    <Text key={part.id} style={[styles.messageText, message.role === "user" ? styles.userText : null]}>
                      {part.text}
                    </Text>
                  );
                }

                if (part.type === "image") {
                  return (
                    <View key={part.id} style={styles.imageBlock}>
                      <Image source={{ uri: part.imageUrl }} style={styles.image} resizeMode="cover" />
                    </View>
                  );
                }

                if (part.type === "deepLink") {
                  return (
                    <Pressable key={part.id} style={styles.linkCard} onPress={() => router.push(`/chat/link/${part.target}`)}>
                      <Text style={styles.linkTitle}>{part.title}</Text>
                      <Text style={styles.linkBody}>{part.description}</Text>
                    </Pressable>
                  );
                }

                if (part.type === "carousel") {
                  return (
                    <View key={part.id} style={styles.partBlock}>
                      <Text style={styles.partTitle}>{part.title}</Text>
                      {part.cards.map((card) => (
                        <View key={card.id} style={styles.carouselCard}>
                          <Text style={styles.carouselEyebrow}>{card.eyebrow}</Text>
                          <Text style={styles.carouselTitle}>{card.title}</Text>
                          <Text style={styles.carouselBody}>{card.description}</Text>
                        </View>
                      ))}
                    </View>
                  );
                }

                return (
                  <View key={part.id} style={styles.partBlock}>
                    <Text style={styles.partTitle}>{part.title}</Text>
                    <Text style={styles.partBody}>{part.body}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          {imageUri ? (
            <View style={styles.attachmentRow}>
              <Image source={{ uri: imageUri }} style={styles.attachmentPreview} resizeMode="cover" />
              <Pressable onPress={() => setImageUri("")} style={styles.attachmentRemove}>
                <Ionicons name="close-circle" size={20} color={surface.textSecondary} />
              </Pressable>
            </View>
          ) : null}
          <View style={styles.composerRow}>
            <Pressable style={styles.attachButton} onPress={handlePickImage}>
              <Ionicons name="camera-outline" size={22} color={palette.accent} />
            </Pressable>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="궁금한 점을 물어보세요"
              placeholderTextColor={surface.textSecondary}
              style={styles.composerInput}
              multiline
            />
            <Pressable
              style={[styles.sendButton, (!text.trim() && !imageUri.trim()) ? styles.sendButtonDisabled : null]}
              onPress={handleSend}
              disabled={isSending || (!text.trim() && !imageUri.trim())}
            >
              <Ionicons name={isSending ? "hourglass-outline" : "arrow-up"} size={20} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal animationType="slide" visible={showRecent} transparent onRequestClose={() => setShowRecent(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowRecent(false)}>
          <Pressable style={styles.modalSheet} onPress={() => {}}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>이전 상담</Text>
            {recentSessions.length === 0 ? <Text style={styles.modalEmpty}>아직 상담 내역이 없어요.</Text> : null}
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {recentSessions.map((recentSession) => (
                <Pressable
                  key={recentSession.id}
                  style={styles.modalItem}
                  onPress={() => {
                    setShowRecent(false);
                    router.replace(`/chat/${recentSession.id}`);
                  }}
                >
                  <Text style={styles.modalItemTitle} numberOfLines={1}>{recentSession.title}</Text>
                  <Text style={styles.modalItemMeta}>{recentSession.updatedAtLabel}</Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.modalClose} onPress={() => setShowRecent(false)}>
              <Text style={styles.modalCloseLabel}>닫기</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: surface.pageBackground,
  },
  keyboardArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: space.sm,
    paddingVertical: space.sm,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: surface.pageBackground,
    ...shadows.header,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    color: surface.textPrimary,
  },
  messages: {
    padding: space.lg,
    paddingBottom: space.sm,
    gap: space.sm,
  },
  messageBubble: {
    padding: space.md,
    maxWidth: "85%",
    gap: space.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: surface.accentSolid,
    borderRadius: radii.xl,
    borderBottomRightRadius: 6,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: surface.surfacePrimary,
    borderRadius: radii.xl,
    borderBottomLeftRadius: 6,
    ...shadows.card,
  },
  messageText: {
    ...typo.body,
    color: surface.textPrimary,
  },
  userText: {
    color: "#ffffff",
  },
  imageBlock: {
    gap: 6,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: radii.md,
    backgroundColor: surface.surfaceSecondary,
  },
  linkCard: {
    padding: space.md,
    borderRadius: radii.md,
    backgroundColor: surface.surfaceAccent,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.accent,
  },
  linkBody: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
  partBlock: {
    gap: space.xs,
  },
  partTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: surface.textPrimary,
  },
  partBody: {
    fontSize: 14,
    lineHeight: 20,
    color: surface.textSecondary,
  },
  carouselCard: {
    marginTop: 6,
    padding: space.md,
    borderRadius: radii.sm,
    backgroundColor: surface.surfaceSecondary,
  },
  carouselEyebrow: {
    fontSize: 11,
    fontWeight: "600",
    color: surface.textSecondary,
  },
  carouselTitle: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: "600",
    color: surface.textPrimary,
  },
  carouselBody: {
    marginTop: 2,
    ...typo.caption,
    color: surface.textSecondary,
  },
  composer: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    backgroundColor: surface.surfacePrimary,
    ...Platform.select({
      ios: { shadowColor: palette.ink, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: -2 } },
      android: { elevation: 4 },
    }),
  },
  attachmentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.xs,
    marginBottom: space.sm,
  },
  attachmentPreview: {
    width: 64,
    height: 64,
    borderRadius: radii.sm,
    backgroundColor: surface.surfaceSecondary,
  },
  attachmentRemove: {
    marginTop: -4,
    marginLeft: -8,
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
  },
  attachButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  composerInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: radii.xl,
    paddingHorizontal: space.lg,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: surface.fieldSurface,
    color: surface.textPrimary,
    fontSize: 15,
    textAlignVertical: "center",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.accentSolid,
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    paddingHorizontal: space.xl,
    paddingBottom: 28,
    borderTopLeftRadius: radii.xxl,
    borderTopRightRadius: radii.xxl,
    backgroundColor: surface.surfacePrimary,
    maxHeight: "65%",
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: surface.strokeSubtle,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: space.lg,
  },
  modalTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  modalEmpty: {
    marginTop: space.lg,
    fontSize: 14,
    color: surface.textSecondary,
    textAlign: "center",
  },
  modalScroll: {
    marginTop: space.sm,
  },
  modalItem: {
    paddingVertical: space.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: surface.strokeSubtle,
  },
  modalItemTitle: {
    ...typo.body,
    fontWeight: "600",
    color: surface.textPrimary,
  },
  modalItemMeta: {
    marginTop: 2,
    fontSize: 12,
    color: surface.textSecondary,
  },
  modalClose: {
    marginTop: space.lg,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radii.md,
    backgroundColor: surface.surfaceSecondary,
    paddingVertical: space.md,
  },
  modalCloseLabel: {
    ...typo.body,
    fontWeight: "600",
    color: surface.textPrimary,
  },
});
