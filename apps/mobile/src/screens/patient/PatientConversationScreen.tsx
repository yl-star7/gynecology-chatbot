// @ts-nocheck
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
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
} from "../../theme";
import { usePatientConversationScreenModel } from "./PatientConversationScreen.model";
import { resolvePatientSurveySaveError } from "./patientErrorCopy.model";

export function PatientConversationScreen({
  sessionId,
}: {
  sessionId: string;
}) {
  const insets = useSafeAreaInsets();
  const model = usePatientConversationScreenModel({ sessionId });

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
            color={surface.accentSolid}
          />
        </Pressable>
      }
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + space.xxxl + space.lg}
      >
        <View style={styles.screen}>
          <PatientConversationMessageList
            scrollViewRef={model.handleScrollViewRef}
            messages={model.session.messages}
            isSending={model.isSending}
            isLoadingSessionDetail={model.isLoadingSessionDetail}
            sessionLoadErrorMessage={model.sessionLoadErrorMessage}
            scrollBottomPadding={model.scrollBottomPadding}
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
            imageDataUri={model.imageDataUri}
            onImageSelected={model.setImageDataUri}
            onRemoveImage={() => model.setImageDataUri(null)}
            errorMessage={model.errorMessage}
            onDismissError={() => model.setErrorMessage(null)}
            onSend={() => {
              void model.handleSend();
            }}
            onLayout={model.handleComposerLayout}
            bottomPadding={
              model.isKeyboardVisible ? space.xs : insets.bottom + space.xs
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
        onOpenFullView={model.handleOpenWeekEncyclopediaFullView}
      />
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
  toolbarButton: {
    width: space.xxxl + space.md,
    height: space.xxxl + space.md,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: surface.surfaceAccent,
    ...shadows.card,
  },
});
