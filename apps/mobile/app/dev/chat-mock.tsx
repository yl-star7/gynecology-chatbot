// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ChatMessage } from "@gynecology-chatbot/app-core";
import { PatientConversationMessageList } from "../../src/components/patient/chat/PatientConversationMessageList";
import { PatientConversationComposer } from "../../src/components/patient/chat/PatientConversationComposer";
import { PatientShell } from "../../src/components/patient/PatientShell";
import { patientSurfacePalette as surface, space } from "../../src/theme";
import {
  resolveAndroidKeyboardBottomOffset,
  resolveConversationKeyboardAvoidingBehavior,
  resolveKeyboardHeightFromCoordinates,
} from "../../src/screens/patient/patientScreenLayout.model";

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "assistant-welcome",
    role: "assistant",
    createdAtLabel: "오전 10:12",
    characterTone: "calm",
    parts: [
      {
        type: "text",
        id: "welcome-text",
        text: "오늘 마음이나 몸 상태를 편하게 적어보세요.",
      },
      {
        type: "quickReplies",
        id: "welcome-quick",
        choices: [
          {
            id: "baby",
            label: "아기 괜찮을까요?",
            message: "오늘 아기 상태가 괜찮은지 궁금해요.",
          },
          {
            id: "pain",
            label: "배가 당겨요",
            message: "배가 당기는데 괜찮은지 알려주세요.",
          },
          {
            id: "sleep",
            label: "잠이 안 와요",
            message: "잠이 잘 안 와서 힘들어요.",
          },
        ],
      },
    ],
  },
  {
    id: "user-pain",
    role: "user",
    createdAtLabel: "오전 10:13",
    parts: [{ type: "text", id: "user-pain-text", text: "배가 조금 당겨요." }],
  },
  {
    id: "assistant-pain",
    role: "assistant",
    createdAtLabel: "오전 10:13",
    characterTone: "anxious",
    parts: [
      {
        type: "text",
        id: "assistant-pain-text",
        text:
          "충분히 그럴 수 있어요.\n\n쉬거나 자세를 바꾸면 괜찮아지는지 먼저 살펴볼게요.",
      },
      {
        type: "quickReplies",
        id: "pain-quick",
        choices: [
          {
            id: "better",
            label: "쉬면 괜찮아져요",
            message: "쉬면 조금 괜찮아져요.",
          },
          {
            id: "continue",
            label: "계속 이어져요",
            message: "쉬어도 계속 이어져요.",
          },
          {
            id: "hospital",
            label: "병원 가볼게요",
            message: "병원에 연락해볼게요.",
          },
        ],
      },
    ],
  },
  {
    id: "user-better",
    role: "user",
    createdAtLabel: "오전 10:14",
    parts: [{ type: "text", id: "user-better-text", text: "쉬면 좀 괜찮아져요." }],
  },
  {
    id: "assistant-placeholder",
    role: "assistant",
    createdAtLabel: "오전 10:14",
    characterTone: "calm",
    parts: [{ type: "text", id: "assistant-placeholder-text", text: "..." }],
  },
  {
    id: "assistant-checklist",
    role: "assistant",
    createdAtLabel: "오전 10:14",
    characterTone: "tired",
    parts: [
      {
        type: "text",
        id: "assistant-checklist-text",
        text:
          "다행이에요. 오늘은 가볍게만 챙겨볼게요.\n\n- 물을 천천히 마셔요\n- 왼쪽으로 누워 쉬어요\n- 통증이 규칙적인지 살펴봐요",
      },
      {
        type: "quickReplies",
        id: "checklist-quick",
        choices: [
          {
            id: "done",
            label: "다 했어요",
            message: "체크리스트를 다 했어요.",
          },
          {
            id: "partial",
            label: "하나만 했어요",
            message: "체크리스트 중 하나만 했어요.",
          },
          {
            id: "later",
            label: "이따가 할래요",
            message: "체크리스트는 이따가 할래요.",
          },
        ],
      },
    ],
  },
];

export default function ChatMockRoute() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{ sending?: string }>();
  const scrollRef = useRef(null);
  const baselineWindowHeightRef = useRef(windowHeight);
  const [text, setText] = useState("");
  const [keyboardState, setKeyboardState] = useState({
    isVisible: false,
    height: 0,
  });
  const isSending = params.sending === "1";

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardState({
        isVisible: true,
        height: resolveKeyboardHeightFromCoordinates({
          reportedHeight: event.endCoordinates.height,
          keyboardScreenY: event.endCoordinates.screenY,
          viewportHeight: windowHeight,
        }),
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardState({ isVisible: false, height: 0 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [windowHeight]);

  if (!keyboardState.isVisible) {
    baselineWindowHeightRef.current = windowHeight;
  }

  const keyboardBottomOffset = resolveAndroidKeyboardBottomOffset({
    platformOs: Platform.OS,
    isKeyboardVisible: keyboardState.isVisible,
    keyboardHeight: keyboardState.height,
    baselineWindowHeight: baselineWindowHeightRef.current,
    currentWindowHeight: windowHeight,
  });

  if (!__DEV__) {
    return null;
  }

  return (
    <PatientShell
      activeTab="today"
      title="아가야"
      backHref="/(tabs)/today"
      pageTone="plain"
      headerCompact
      showProfileButton={false}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={resolveConversationKeyboardAvoidingBehavior(Platform.OS)}
        keyboardVerticalOffset={insets.top + space.xxxl + space.lg}
      >
        <View style={styles.screen}>
          <PatientConversationMessageList
            scrollViewRef={(instance) => {
              scrollRef.current = instance;
            }}
            messages={MOCK_MESSAGES}
            isSending={isSending}
            isLoadingSessionDetail={false}
            sessionLoadErrorMessage={null}
            scrollBottomPadding={space.xxxl * 4 + keyboardBottomOffset}
            onQuickReplySelect={setText}
            onRetrySessionLoad={() => {}}
            onSurveyAnswer={async () => true}
            surveySaveErrorText="답변을 저장하지 못했어요."
            onDeepLinkPress={() => {}}
          />
          <PatientConversationComposer
            text={text}
            onChangeText={setText}
            isSending={isSending}
            isReadOnly={false}
            errorMessage={null}
            onDismissError={() => {}}
            onSend={() => {}}
            onLayout={() => {}}
            keyboardBottomOffset={keyboardBottomOffset}
            bottomPadding={
              keyboardState.isVisible && Platform.OS === "android"
                ? space.lg
                : insets.bottom + space.xs
            }
          />
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
    backgroundColor: surface.surfaceSecondary,
  },
});
