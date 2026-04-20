import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import {
  AppState,
  Keyboard,
  Platform,
  type LayoutChangeEvent,
  ScrollView,
} from "react-native";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import { space } from "../../theme";
import {
  resolvePatientConversationLoadError,
  resolvePatientConversationSendError,
} from "./patientErrorCopy.model";
import { isPastConversationSession } from "./patientConversationSessionStatus.model";
import { createInitialConversationMessage } from "./PatientConversationInitialMessage.model";

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

function isNewConversationSession(sessionId: string) {
  return sessionId === "new" || sessionId === "heart-talk";
}

export function usePatientConversationScreenModel({
  sessionId,
}: {
  sessionId: string;
}) {
  const router = useRouter();
  const { currentUser } = useMobileAppSession();
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingSessionDetail, setIsLoadingSessionDetail] = useState(false);
  const [sessionLoadErrorMessage, setSessionLoadErrorMessage] = useState<
    string | null
  >(null);
  const [composerHeight, setComposerHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [linkSheet, setLinkSheet] = useState<{
    target: string;
    entityId?: string;
  } | null>(null);
  const didSeedInitialMessageRef = useRef(false);
  const didUserSendMessageRef = useRef(false);

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

  const loadSessionDetail = useCallback(async () => {
    if (isNewConversationSession(sessionId) || !currentUser) {
      return;
    }

    setIsLoadingSessionDetail(true);
    setSessionLoadErrorMessage(null);

    try {
      const nextSession = await services.chatPort.getSession(resolvedSessionId);
      replaceSession(resolvedSessionId, nextSession);
    } catch (error: unknown) {
      setSessionLoadErrorMessage(resolvePatientConversationLoadError(error));
    } finally {
      setIsLoadingSessionDetail(false);
    }
  }, [currentUser, replaceSession, resolvedSessionId, services, sessionId]);

  useEffect(() => {
    if (isNewConversationSession(sessionId) || !currentUser) {
      setIsLoadingSessionDetail(false);
      setSessionLoadErrorMessage(null);
      return;
    }

    void loadSessionDetail();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active" || isNewConversationSession(sessionId)) {
        return;
      }

      void loadSessionDetail();
    });

    return () => subscription.remove();
  }, [currentUser, loadSessionDetail, resolvedSessionId, sessionId]);

  useEffect(() => {
    if (
      !isNewConversationSession(sessionId) ||
      didSeedInitialMessageRef.current ||
      session.messages.length > 0
    ) {
      return;
    }

    didSeedInitialMessageRef.current = true;
    appendMessage(
      resolvedSessionId,
      "아기와 대화",
      createInitialConversationMessage(),
    );
  }, [appendMessage, resolvedSessionId, session.messages.length, sessionId]);

  useEffect(() => {
    if (session.messages.length === 0 && !isSending) {
      return;
    }

    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 0);

    return () => clearTimeout(timer);
  }, [isSending, session.messages.length]);

  useEffect(() => {
    return () => {
      if (!didUserSendMessageRef.current) {
        return;
      }
      const summarize = services.chatPort.summarizeSession;
      if (!summarize) {
        return;
      }
      void summarize.call(services.chatPort, resolvedSessionId).catch(() => {});
    };
  }, [resolvedSessionId, services.chatPort]);

  const isReadOnly =
    !isNewConversationSession(sessionId) &&
    isPastConversationSession(session.lastMessageAtIso);

  async function handleSend(overrideText?: string) {
    const nextText = (overrideText ?? text).trim();
    if (!nextText || isSending || isReadOnly) {
      return;
    }

    const capturedImage = imageDataUri;
    appendMessage(
      resolvedSessionId,
      "아기와 대화",
      createUserMessage(nextText, capturedImage),
    );
    didUserSendMessageRef.current = true;
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
    setLinkSheet({ target, entityId });
  }

  function handleDismissLinkSheet() {
    setLinkSheet(null);
  }

  function handleOpenLinkFullView(target: string, entityId?: string) {
    const params = entityId ? `?entityId=${entityId}` : "";
    router.push(`/chat/link/${target}${params}`);
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
    isReadOnly,
    scrollViewRef,
    handleScrollViewRef,
    text,
    setText,
    isSending,
    isLoadingSessionDetail,
    sessionLoadErrorMessage,
    imageDataUri,
    setImageDataUri,
    errorMessage,
    setErrorMessage,
    isKeyboardVisible,
    scrollBottomPadding: composerHeight + space.md,
    handleSend,
    handleRetrySessionLoad: loadSessionDetail,
    handleQuickReply,
    handleSurveyAnswer,
    handleDeepLink,
    handleComposerLayout,
    linkSheet,
    handleDismissLinkSheet,
    handleOpenLinkFullView,
    getLinkTarget: services.knowledgePort.getLinkTarget.bind(
      services.knowledgePort,
    ),
  };
}
