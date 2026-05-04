import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  ChatMessage,
  EmotionTone,
  MobilePregnancyWeekSummary,
} from "@gynecology-chatbot/app-core";
import {
  AppState,
  Dimensions,
  Keyboard,
  Platform,
  type LayoutChangeEvent,
  ScrollView,
} from "react-native";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { useChatSessions } from "../../chat/store";
import { resolveQuickReplyComposerText } from "../../components/chat/ChatPartRenderer.model";
import {
  hasFreshCachedPregnancyWeeks,
  hasFreshCachedProfileView,
  readCachedPregnancyWeeks,
  readCachedProfileView,
} from "../../core/patientViewCache";
import { space } from "../../theme";
import {
  resolvePatientContentLoadError,
  resolvePatientConversationLoadError,
  resolvePatientConversationSendError,
} from "./patientErrorCopy.model";
import { buildConversationWeekEncyclopediaSheetModel } from "./PatientConversationWeekEncyclopediaSheet.model";
import { isPastConversationSession } from "./patientConversationSessionStatus.model";
import { createInitialConversationMessage } from "./PatientConversationInitialMessage.model";
import {
  resolveConversationDeepLinkAction,
  type ConversationDeepLinkMeta,
} from "./PatientConversationDeepLink.model";
import { shouldKeepQuickReplyInComposer } from "./PatientConversationQuickReply.model";
import { resolveKeyboardHeightFromCoordinates } from "./patientScreenLayout.model";

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
  const parts: ChatMessage["parts"] = [
    { type: "text", id: `text-${Date.now()}`, text },
  ];

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
  const [newSessionId] = useState(() => createSessionId());
  const resolvedSessionId = isNewConversationSession(sessionId)
    ? newSessionId
    : sessionId;
  const session = getSession(resolvedSessionId);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingSessionDetail, setIsLoadingSessionDetail] = useState(false);
  const [sessionLoadErrorMessage, setSessionLoadErrorMessage] = useState<
    string | null
  >(null);
  const [composerHeight, setComposerHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [linkSheet, setLinkSheet] = useState<{
    target: string;
    entityId?: string;
  } | null>(null);
  const [isWeekEncyclopediaSheetVisible, setIsWeekEncyclopediaSheetVisible] =
    useState(false);
  const [weekEncyclopediaWeeks, setWeekEncyclopediaWeeks] = useState<
    MobilePregnancyWeekSummary[]
  >([]);
  const [
    weekEncyclopediaProfilePregnancyWeekLabel,
    setWeekEncyclopediaProfilePregnancyWeekLabel,
  ] = useState<string | null>(null);
  const [isLoadingWeekEncyclopedia, setIsLoadingWeekEncyclopedia] =
    useState(false);
  const [weekEncyclopediaErrorMessage, setWeekEncyclopediaErrorMessage] =
    useState<string | null>(null);
  const didSeedInitialMessageRef = useRef(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setIsKeyboardVisible(true);
      setKeyboardHeight(
        resolveKeyboardHeightFromCoordinates({
          reportedHeight: event.endCoordinates.height,
          keyboardScreenY: event.endCoordinates.screenY,
          viewportHeight: Dimensions.get("window").height,
        }),
      );
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const loadSessionDetail = useCallback(async () => {
    if (!currentUser) {
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
  }, [currentUser, replaceSession, resolvedSessionId, services]);

  useEffect(() => {
    if (!currentUser) {
      setIsLoadingSessionDetail(false);
      setSessionLoadErrorMessage(null);
      return;
    }

    void loadSessionDetail();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
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

  const isReadOnly =
    !isNewConversationSession(sessionId) &&
    isPastConversationSession(session.lastMessageAtIso);

  async function handleSend(
    overrideText?: string,
    selectedQuestionId?: string,
    selectedMoodTone?: EmotionTone,
  ) {
    const nextText = (overrideText ?? text).trim();
    if (!nextText || isSending || isReadOnly) {
      return;
    }

    appendMessage(
      resolvedSessionId,
      "아기와 대화",
      createUserMessage(nextText),
    );
    setText("");
    setErrorMessage(null);
    setIsSending(true);

    try {
      const assistantMessages = await services.chatPort.sendMessage({
        sessionId: resolvedSessionId,
        text: nextText,
        selectedQuestionId,
        selectedMoodTone,
        clientWorkflowStage:
          debugSnapshot.inferredFlow === "mood_intake" ? 0 : null,
        clientWorkflowStageName:
          debugSnapshot.inferredFlow === "mood_intake" ? "mood_intake" : null,
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

  function handleComposerTextChange(value: string) {
    setText(value);
  }

  function handleQuickReply(
    replyMessage: string,
    choiceId?: string,
    label?: string,
    moodTone?: EmotionTone,
  ) {
    if (isSending || isReadOnly) {
      return;
    }

    const nextText = resolveQuickReplyComposerText({
      choiceId,
      label: label ?? replyMessage,
      message: replyMessage,
    });
    setErrorMessage(null);
    if (shouldKeepQuickReplyInComposer({ choiceId })) {
      setText(nextText);
      return;
    }

    void handleSend(nextText, choiceId, moodTone);
  }

  const debugSnapshot = useMemo(() => {
    const assistantMessages = session.messages.filter(
      (message) => message.role === "assistant",
    );
    const latestAssistant = assistantMessages.at(-1) ?? null;
    const latestQuickReplies = latestAssistant?.parts.find(
      (part) => part.type === "quickReplies",
    );
    const latestText = latestAssistant?.parts.find(
      (part) => part.type === "text",
    );
    const inferFlow = () => {
      if (latestQuickReplies?.type === "quickReplies") {
        const ids = latestQuickReplies.choices.map((choice) => choice.id);
        if (ids.some((id) => id.startsWith("initial-workflow-"))) {
          return "mood_intake";
        }
        if (ids.includes("week-info-yes") || ids.includes("week-info-no")) {
          return "week_info_opt_in";
        }
        if (ids.some((id) => id.includes("mood"))) {
          return "mood_intake";
        }
        return "quick_reply";
      }
      return latestAssistant ? "assistant_response" : "empty";
    };

    return {
      routeSessionId: sessionId,
      resolvedSessionId,
      isNewSessionAlias: isNewConversationSession(sessionId),
      inferredFlow: inferFlow(),
      latestAssistantId: latestAssistant?.id ?? null,
      latestAssistantPartTypes:
        latestAssistant?.parts.map((part) => part.type) ?? [],
      latestAssistantText:
        latestText?.type === "text" ? latestText.text.slice(0, 80) : null,
      latestQuickReplyCount:
        latestQuickReplies?.type === "quickReplies"
          ? latestQuickReplies.choices.length
          : 0,
      latestQuickReplyLabels:
        latestQuickReplies?.type === "quickReplies"
          ? latestQuickReplies.choices.map((choice) => choice.label)
          : [],
      latestQuickReplyIds:
        latestQuickReplies?.type === "quickReplies"
          ? latestQuickReplies.choices.map((choice) => choice.id)
          : [],
      messageCount: session.messages.length,
      currentUserId: currentUser?.id ?? null,
      apiBaseUrl:
        process.env.EXPO_PUBLIC_API_BASE_URL ??
        "https://agaya-api-yvdnhntt7a-du.a.run.app",
      mobileDataProvider: process.env.EXPO_PUBLIC_MOBILE_DATA_PROVIDER ?? "api",
    };
  }, [currentUser?.id, resolvedSessionId, session.messages, sessionId]);

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

  function handleDeepLink(
    target: string,
    entityId?: string,
    meta?: ConversationDeepLinkMeta,
  ) {
    const action = resolveConversationDeepLinkAction({
      target,
      entityId,
      ...meta,
    });

    if (action.type === "encyclopedia") {
      router.push(action.href as never);
      return;
    }

    setLinkSheet({ target: action.target, entityId: action.entityId });
  }

  function handleDismissLinkSheet() {
    setLinkSheet(null);
  }

  function handleOpenLinkFullView(target: string, entityId?: string) {
    const params = entityId ? `?entityId=${entityId}` : "";
    router.push(`/chat/link/${target}${params}`);
  }

  async function handleOpenWeekEncyclopediaSheet() {
    setIsWeekEncyclopediaSheetVisible(true);
    setWeekEncyclopediaErrorMessage(null);

    if (!currentUser) {
      setWeekEncyclopediaErrorMessage("정보를 불러오지 못했어요.");
      return;
    }

    const cachedWeeks = readCachedPregnancyWeeks(currentUser.id);
    const cachedProfile = readCachedProfileView(currentUser.id);
    if (cachedWeeks) {
      setWeekEncyclopediaWeeks(cachedWeeks);
    }
    if (cachedProfile) {
      setWeekEncyclopediaProfilePregnancyWeekLabel(
        cachedProfile.pregnancyWeekLabel,
      );
    }

    const shouldFetch =
      !hasFreshCachedPregnancyWeeks(currentUser.id) ||
      !hasFreshCachedProfileView(currentUser.id) ||
      !cachedWeeks ||
      !cachedProfile;
    if (!shouldFetch) {
      return;
    }

    setIsLoadingWeekEncyclopedia(true);
    try {
      const [nextWeeks, nextProfile] = await Promise.all([
        services.knowledgePort.listPregnancyWeeks(),
        services.profilePort.getProfile(),
      ]);
      setWeekEncyclopediaWeeks(nextWeeks);
      setWeekEncyclopediaProfilePregnancyWeekLabel(
        nextProfile.pregnancyWeekLabel,
      );
    } catch (error: unknown) {
      setWeekEncyclopediaErrorMessage(resolvePatientContentLoadError(error));
    } finally {
      setIsLoadingWeekEncyclopedia(false);
    }
  }

  function handleDismissWeekEncyclopediaSheet() {
    setIsWeekEncyclopediaSheetVisible(false);
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
    debugSnapshot,
    isReadOnly,
    scrollViewRef,
    handleScrollViewRef,
    text,
    setText: handleComposerTextChange,
    isSending,
    isLoadingSessionDetail,
    sessionLoadErrorMessage,
    errorMessage,
    setErrorMessage,
    isKeyboardVisible,
    keyboardHeight,
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
    isWeekEncyclopediaSheetVisible,
    weekEncyclopediaSheetModel: buildConversationWeekEncyclopediaSheetModel({
      weeks: weekEncyclopediaWeeks,
      profilePregnancyWeekLabel: weekEncyclopediaProfilePregnancyWeekLabel,
      isLoading: isLoadingWeekEncyclopedia,
      errorMessage: weekEncyclopediaErrorMessage,
    }),
    handleOpenWeekEncyclopediaSheet,
    handleDismissWeekEncyclopediaSheet,
    getLinkTarget: services.knowledgePort.getLinkTarget.bind(
      services.knowledgePort,
    ),
  };
}
