// @ts-nocheck
import type { ChatMessage, RecentChatSummary } from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useChatSessions } from "../chat/store";
import { useMobileServices } from "../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface } from "../theme";

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

    const nextTitle = session.title === "새 대화" && text ? text.slice(0, 24) : session.title;
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
      <View style={styles.header}>
        <Pressable onPress={() => router.replace("/home")} accessibilityLabel="홈으로 이동">
          <Ionicons name="arrow-back" size={24} color={surface.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{session.title}</Text>
        <Pressable onPress={() => setShowRecent(true)} accessibilityLabel="최근 채팅 열기">
          <Ionicons name="menu" size={24} color={surface.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.messages}>
        {session.messages.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>새 세션</Text>
            <Text style={styles.emptyBody}>텍스트와 이미지 첨부를 함께 보내면 세션 단위로 누적됩니다.</Text>
          </View>
        ) : null}

        {session.messages.map((message) => (
          <View key={message.id} style={[styles.messageBubble, message.role === "user" ? styles.userBubble : styles.assistantBubble]}>
            {message.parts.map((part) => {
              if (part.type === "text") {
                return (
                  <Text key={part.id} style={styles.messageText}>
                    {part.text}
                  </Text>
                );
              }

              if (part.type === "image") {
                return (
                  <View key={part.id} style={styles.imageBlock}>
                    <Image source={{ uri: part.imageUrl }} style={styles.image} resizeMode="cover" />
                    {part.caption ? <Text style={styles.caption}>{part.caption}</Text> : null}
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
        <Pressable style={styles.attachButton} onPress={handlePickImage}>
          <Ionicons name="image-outline" size={18} color={surface.accentSolid} />
          <Text style={styles.attachButtonLabel}>{imageUri ? "이미지 선택됨" : "이미지 첨부"}</Text>
        </Pressable>
        {imageUri ? <Image source={{ uri: imageUri }} style={styles.attachmentPreview} resizeMode="cover" /> : null}
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={surface.textSecondary}
          style={[styles.input, styles.messageInput]}
          multiline
        />
        <Pressable style={[styles.sendButton, isSending ? styles.sendButtonDisabled : null]} onPress={handleSend} disabled={isSending}>
          <Text style={styles.sendButtonLabel}>{isSending ? "전송 중" : "보내기"}</Text>
        </Pressable>
      </View>

      <Modal animationType="slide" visible={showRecent} transparent onRequestClose={() => setShowRecent(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Recent Chat</Text>
            {recentSessions.length === 0 ? <Text style={styles.modalEmpty}>아직 열린 세션이 없습니다.</Text> : null}
            {recentSessions.map((recentSession) => (
              <Pressable
                key={recentSession.id}
                style={styles.modalItem}
                onPress={() => {
                  setShowRecent(false);
                  router.replace(`/chat/${recentSession.id}`);
                }}
              >
                <Text style={styles.modalItemTitle}>{recentSession.title}</Text>
                <Text style={styles.modalItemMeta}>{recentSession.updatedAtLabel}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.modalClose} onPress={() => setShowRecent(false)}>
              <Text style={styles.modalCloseLabel}>닫기</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: surface.pageBackground,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: surface.strokeSubtle,
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: 12,
    fontSize: 17,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  messages: {
    padding: 18,
    gap: 12,
  },
  emptyCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: surface.surfacePrimary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  emptyBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: surface.textSecondary,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
    gap: 10,
  },
  userBubble: {
    backgroundColor: surface.surfaceAccent,
  },
  assistantBubble: {
    backgroundColor: surface.surfacePrimary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    color: surface.textPrimary,
  },
  imageBlock: {
    gap: 8,
  },
  image: {
    width: "100%",
    height: 180,
    borderRadius: 16,
    backgroundColor: surface.surfaceSecondary,
  },
  caption: {
    fontSize: 13,
    color: surface.textSecondary,
  },
  linkCard: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: surface.surfaceAccent,
  },
  linkTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: palette.accent,
  },
  linkBody: {
    marginTop: 6,
    fontSize: 14,
    color: surface.textSecondary,
  },
  partBlock: {
    gap: 6,
  },
  partTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  partBody: {
    fontSize: 14,
    lineHeight: 20,
    color: surface.textSecondary,
  },
  carouselCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: surface.surfaceSecondary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
  },
  carouselEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: surface.textSecondary,
    textTransform: "uppercase",
  },
  carouselTitle: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  carouselBody: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: surface.textSecondary,
  },
  composer: {
    padding: 16,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: surface.strokeSubtle,
    backgroundColor: surface.surfacePrimary,
  },
  attachButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: surface.surfaceSecondary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
  },
  attachButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: surface.accentSolid,
  },
  attachmentPreview: {
    width: 88,
    height: 88,
    borderRadius: 16,
    backgroundColor: surface.surfaceSecondary,
  },
  input: {
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: surface.fieldSurface,
    color: surface.textPrimary,
  },
  messageInput: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  sendButton: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: surface.accentSolid,
    paddingVertical: 14,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 29, 29, 0.28)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: surface.surfacePrimary,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  modalEmpty: {
    marginTop: 12,
    fontSize: 14,
    color: surface.textSecondary,
  },
  modalItem: {
    marginTop: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: surface.strokeSubtle,
  },
  modalItemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  modalItemMeta: {
    marginTop: 4,
    fontSize: 13,
    color: surface.textSecondary,
  },
  modalClose: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: surface.surfaceSecondary,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    paddingVertical: 14,
  },
  modalCloseLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: surface.accentSolid,
  },
});
