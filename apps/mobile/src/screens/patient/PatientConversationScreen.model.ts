import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage, RecentChatSummary } from "@gynecology-chatbot/app-core";
import {
  AppState,
  Keyboard,
  Platform,
  type LayoutChangeEvent,
  ScrollView,
} from "react-native";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import { space } from "../../theme";
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

function isNewConversationSession(sessionId: string) {
  return sessionId === "new" || sessionId === "heart-talk";
}

export function usePatientConversationScreenModel({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const services = useMobileServices();
  const scrollViewRef = useRef<ScrollView | null>(null);

  function handleScrollViewRef(instance: ScrollView | null) {
    scrollViewRef.current = instance;
  }
  const { getSession, replaceSession, appendMessage } = useChatSessions();
  const resolvedSessionId = useMemo(
    () => (isNewConversationSession(sessionId) ? createSessionId() : sessionId),
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
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, () =>
      setIsKeyboardVisible(true),
    );
    const hideSub = Keyboard.addListener(hideEvent, () =>
      setIsKeyboardVisible(false),
    );

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (isNewConversationSession(sessionId)) {
      return;
    }

    services.chatPort
      .getSession(resolvedSessionId)
      .then(replaceSession)
      .catch(() => undefined);

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" || isNewConversationSession(sessionId)) {
        return;
      }

      services.chatPort
        .getSession(resolvedSessionId)
        .then(replaceSession)
        .catch(() => undefined);
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
          for (const message of followUpMessages) {
            appendMessage(resolvedSessionId, "아기와 대화", message);
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
    void handleSend(replyMessage);
  }

  async function handleSurveyAnswer(surveyId: string, choiceId: string) {
    try {
      await services.recordsPort.saveSurveyResponse({
        questionId: surveyId,
        answer: choiceId,
      });
      return true;
    } catch {
      return false;
    }
  }

  function handleDeepLink(target: string, entityId?: string) {
    const params = entityId ? `?entityId=${entityId}` : "";
    router.push(`/chat/link/${target}${params}`);
  }

  async function handleOpenTodaySessions() {
    if (isTodaySessionsOpen) {
      setIsTodaySessionsOpen(false);
      return;
    }

    setIsTodaySessionsOpen(true);
    setIsTodaySessionsLoading(true);

    try {
      const recordDay = await services.homePort.getRecordDay(createTodayIsoDate());
      setTodaySessions(recordDay.relatedSessions);
    } catch {
      setTodaySessions([]);
    } finally {
      setIsTodaySessionsLoading(false);
    }
  }

  function closeTodaySessions() {
    setIsTodaySessionsOpen(false);
  }

  function handleSelectTodaySession(nextSessionId: string) {
    setIsTodaySessionsOpen(false);
    if (nextSessionId === resolvedSessionId) {
      return;
    }
    router.push(`/chat/${nextSessionId}`);
  }

  function handleComposerLayout(event: LayoutChangeEvent) {
    const nextHeight = event.nativeEvent.layout.height;
    if (Math.abs(nextHeight - composerHeight) > 1) {
      setComposerHeight(nextHeight);
    }
  }

  return {
    session,
    resolvedSessionId,
    scrollViewRef,
    handleScrollViewRef,
    text,
    setText,
    isSending,
    imageDataUri,
    setImageDataUri,
    todaySessions,
    isTodaySessionsOpen,
    isTodaySessionsLoading,
    errorMessage,
    setErrorMessage,
    isKeyboardVisible,
    scrollBottomPadding: composerHeight + space.md,
    handleSend,
    handleQuickReply,
    handleSurveyAnswer,
    handleDeepLink,
    handleOpenTodaySessions,
    closeTodaySessions,
    handleSelectTodaySession,
    handleComposerLayout,
  };
}
