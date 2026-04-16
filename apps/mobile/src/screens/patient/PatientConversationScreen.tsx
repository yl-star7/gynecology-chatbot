// @ts-nocheck
import { KeyboardAvoidingView, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PatientConversationMessageList } from "../../components/patient/chat/PatientConversationMessageList";
import { PatientConversationComposer } from "../../components/patient/chat/PatientConversationComposer";
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
      title="아기와 대화"
      backHref="/(tabs)/today"
      pageTone="plain"
      headerCompact
      showProfileButton={false}
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
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: surface.pageBackground,
  },
});
