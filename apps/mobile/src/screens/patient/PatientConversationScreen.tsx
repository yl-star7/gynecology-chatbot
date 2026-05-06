// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import {
  NativeModules,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PatientConversationMessageList } from "../../components/patient/chat/PatientConversationMessageList";
import { PatientConversationComposer } from "../../components/patient/chat/PatientConversationComposer";
import { ChatLinkSheet } from "../../components/patient/chat/ChatLinkSheet";
import { PatientConversationWeekEncyclopediaSheet } from "../../components/patient/chat/PatientConversationWeekEncyclopediaSheet";
import { PatientShell } from "../../components/patient/PatientShell";
import { Pressable } from "../../components/ui";
import {
  patientSurfacePalette as surface,
  radii,
  shadows,
  space,
  typo,
} from "../../theme";
import { useMobileTheme } from "../../theme-provider";
import { usePatientConversationScreenModel } from "./PatientConversationScreen.model";
import { resolvePatientSurveySaveError } from "./patientErrorCopy.model";
import {
  resolveAndroidKeyboardBottomOffset,
  resolveConversationKeyboardAvoidingBehavior,
} from "./patientScreenLayout.model";

export function PatientConversationScreen({
  sessionId,
  forceReadOnly = false,
}: {
  sessionId: string;
  forceReadOnly?: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { surface: activeSurface } = useMobileTheme();
  const model = usePatientConversationScreenModel({ sessionId, forceReadOnly });
  const baselineWindowHeightRef = useRef(windowHeight);
  const [isDebugSheetVisible, setIsDebugSheetVisible] = useState(false);
  const [debugCopyStatus, setDebugCopyStatus] = useState<
    "idle" | "copied" | "failed"
  >("idle");

  function handleCopyDebugSnapshot() {
    const payload = JSON.stringify(model.debugSnapshot, null, 2);
    const clipboard = NativeModules.Clipboard;

    try {
      if (clipboard?.setString) {
        clipboard.setString(payload);
        setDebugCopyStatus("copied");
        return;
      }
    } catch {
      // Fall through to failed state.
    }

    setDebugCopyStatus("failed");
  }

  if (!model.isKeyboardVisible) {
    baselineWindowHeightRef.current = windowHeight;
  }

  const keyboardBottomOffset = resolveAndroidKeyboardBottomOffset({
    platformOs: Platform.OS,
    isKeyboardVisible: model.isKeyboardVisible,
    keyboardHeight: model.keyboardHeight,
    baselineWindowHeight: baselineWindowHeightRef.current,
    currentWindowHeight: windowHeight,
  });

  return (
    <PatientShell
      activeTab="today"
      title="아가야"
      backHref="/(tabs)/today"
      pageTone="plain"
      headerCompact
      showProfileButton={false}
      trailingAction={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="현재 주차 임신백과 열기"
          hitSlop={12}
          style={styles.toolbarButton}
          onPress={() => {
            void model.handleOpenWeekEncyclopediaSheet();
          }}
        >
          <Ionicons
            name="book-outline"
            size={space.lg + space.xs}
            color={activeSurface.accentSolid}
          />
        </Pressable>
      }
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={resolveConversationKeyboardAvoidingBehavior(Platform.OS)}
        keyboardVerticalOffset={
          Platform.OS === "ios" ? insets.top + space.xxxl + space.md : 0
        }
      >
        <View style={styles.screen}>
          <PatientConversationMessageList
            scrollViewRef={model.handleScrollViewRef}
            messages={model.session.messages}
            isSending={model.isSending}
            isLoadingSessionDetail={model.isLoadingSessionDetail}
            sessionLoadErrorMessage={model.sessionLoadErrorMessage}
            scrollBottomPadding={
              model.scrollBottomPadding + keyboardBottomOffset
            }
            onQuickReplySelect={model.handleQuickReply}
            onRetrySessionLoad={model.handleRetrySessionLoad}
            onSurveyAnswer={model.handleSurveyAnswer}
            surveySaveErrorText={resolvePatientSurveySaveError(new Error())}
            onDeepLinkPress={model.handleDeepLink}
          />

          <PatientConversationComposer
            text={model.text}
            onChangeText={model.setText}
            isSending={model.isSending}
            isReadOnly={model.isReadOnly}
            errorMessage={model.errorMessage}
            onDismissError={() => model.setErrorMessage(null)}
            onSend={() => {
              void model.handleSend();
            }}
            onLayout={model.handleComposerLayout}
            keyboardBottomOffset={keyboardBottomOffset}
            bottomPadding={
              model.isKeyboardVisible
                ? Platform.OS === "android"
                  ? space.lg
                  : space.xs
                : insets.bottom + space.xs
            }
          />
        </View>
      </KeyboardAvoidingView>
      <ChatLinkSheet
        visible={Boolean(model.linkSheet)}
        target={model.linkSheet?.target ?? null}
        entityId={model.linkSheet?.entityId ?? null}
        getLinkTarget={model.getLinkTarget}
        onClose={model.handleDismissLinkSheet}
        onOpenFullView={model.handleOpenLinkFullView}
      />
      <PatientConversationWeekEncyclopediaSheet
        visible={model.isWeekEncyclopediaSheetVisible}
        model={model.weekEncyclopediaSheetModel}
        onClose={model.handleDismissWeekEncyclopediaSheet}
      />
      {__DEV__ ? (
        <Modal
          visible={isDebugSheetVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDebugSheetVisible(false)}
        >
          <Pressable
            style={styles.debugBackdrop}
            onPress={() => setIsDebugSheetVisible(false)}
          >
            <Pressable style={styles.debugSheet}>
              <View style={styles.debugHeader}>
                <Text style={styles.debugTitle}>채팅 디버그 상태</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="채팅 디버그 상태 복사"
                  style={styles.debugCopyButton}
                  onPress={handleCopyDebugSnapshot}
                >
                  <Text style={styles.debugCopyButtonText}>
                    {debugCopyStatus === "copied"
                      ? "Copied"
                      : debugCopyStatus === "failed"
                        ? "Failed"
                        : "Copy"}
                  </Text>
                </Pressable>
              </View>
              {Object.entries(model.debugSnapshot).map(([key, value]) => (
                <View key={key} style={styles.debugRow}>
                  <Text style={styles.debugKey}>{key}</Text>
                  <Text style={styles.debugValue}>
                    {Array.isArray(value)
                      ? value.join(", ") || "-"
                      : value === null || value === undefined
                        ? "-"
                        : String(value)}
                  </Text>
                </View>
              ))}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
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
  debugBadge: {
    position: "absolute",
    zIndex: 10,
    top: space.sm,
    right: space.md,
    borderRadius: radii.full,
    backgroundColor: surface.surfaceAccent,
    paddingVertical: space.xs,
    paddingHorizontal: space.sm,
    ...shadows.card,
  },
  debugBadgeText: {
    ...typo.caption,
    color: surface.accentSolid,
    fontWeight: "700",
  },
  debugBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.24)",
  },
  debugSheet: {
    margin: space.md,
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.lg,
    gap: space.sm,
    ...shadows.card,
  },
  debugTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  debugHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.md,
    marginBottom: space.xs,
  },
  debugCopyButton: {
    borderRadius: radii.full,
    backgroundColor: surface.surfaceAccent,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
  },
  debugCopyButtonText: {
    ...typo.caption,
    color: surface.accentSolid,
    fontWeight: "700",
  },
  debugRow: {
    gap: space.xs,
  },
  debugKey: {
    ...typo.caption,
    color: surface.textSecondary,
    fontWeight: "700",
  },
  debugValue: {
    ...typo.caption,
    color: surface.textPrimary,
  },
  toolbarButton: {
    width: space.xxxl + space.md,
    height: space.xxxl + space.md,
    marginBottom: space.xs,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceAccent,
    ...shadows.card,
  },
});
