// @ts-nocheck
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PatientConversationMessageList } from "../../components/patient/chat/PatientConversationMessageList";
import { PatientConversationComposer } from "../../components/patient/chat/PatientConversationComposer";
import { PatientTodaySessionsDrawer } from "../../components/patient/chat/PatientTodaySessionsDrawer";
import { PatientShell } from "../../components/patient/PatientShell";
import { patientSurfacePalette as surface, space } from "../../theme";
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
      backHref="/(tabs)/today"
      pageTone="plain"
      headerCompact
      showProfileButton={false}
      rightActionIcon="list"
      rightActionLabel="오늘 지난 대화 열기"
      onRightActionPress={model.handleOpenTodaySessions}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.top + space.xxxl + space.lg}
      >
        <View style={styles.screen}>
          <PatientConversationMessageList
            scrollViewRef={model.scrollViewRef}
            messages={model.session.messages}
            isSending={model.isSending}
            scrollBottomPadding={model.scrollBottomPadding}
            onQuickReplySelect={model.handleQuickReply}
            onSurveyAnswer={model.handleSurveyAnswer}
            surveySaveErrorText={resolvePatientSurveySaveError(new Error())}
            onDeepLinkPress={model.handleDeepLink}
          />

          <PatientConversationComposer
            text={model.text}
            onChangeText={model.setText}
            isSending={model.isSending}
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

          <PatientTodaySessionsDrawer
            visible={model.isTodaySessionsOpen}
            insetsTop={insets.top}
            isLoading={model.isTodaySessionsLoading}
            sessions={model.todaySessions}
            currentSessionId={model.resolvedSessionId}
            onClose={model.closeTodaySessions}
            onSelectSession={model.handleSelectTodaySession}
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
    backgroundColor: surface.surfacePrimary,
  },
});
