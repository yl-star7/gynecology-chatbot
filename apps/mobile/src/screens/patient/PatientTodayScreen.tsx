import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Card, Pressable } from "../../components/ui";
import { PatientTodayConversationSection } from "../../components/patient/today/PatientTodayConversationSection";
import { PatientTodayChecklistSection } from "../../components/patient/today/PatientTodayChecklistSection";
import { PatientTodayInfoSection } from "../../components/patient/today/PatientTodayInfoSection";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientTodayTabs } from "../../components/patient/PatientTodayTabs";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";
import { usePatientTodayScreenModel } from "./PatientTodayScreen.model";

export function PatientTodayScreen() {
  const insets = useSafeAreaInsets();
  const model = usePatientTodayScreenModel();
  const contentInsets = buildPatientTabContentInsets({
    bottomInset: insets.bottom,
    extraBottomSpacing:
      model.activeSection === "conversation" ? space.xxxl : space.lg,
    topSpacing: space.xs,
  });

  return (
    <PatientShell
      activeTab="today"
      title="오늘,우리"
      pageTone="plain"
      headerCompact
      showProfileButton={false}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={space.xxxl + space.xl}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: contentInsets.paddingTop,
              paddingBottom: contentInsets.paddingBottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <PatientTodayTabs
            sections={model.viewModel.sections}
            activeSection={model.activeSection}
            onChange={model.setActiveSection}
          />

          {model.activeSection === "info" ? (
            <PatientTodayInfoSection
              babyCard={model.viewModel.babyCard}
              momCard={model.viewModel.momCard}
            />
          ) : null}

          {model.activeSection === "checklist" ? (
            <PatientTodayChecklistSection
              title={model.viewModel.checklistTitle}
              items={model.viewModel.checklistItems}
              pendingChecklistIds={model.pendingChecklistIds}
              progressPercent={model.viewModel.checklistProgressPercent}
              onToggleChecklistItem={model.handleToggleChecklistItem}
            />
          ) : null}

          {model.activeSection === "conversation" ? (
            <PatientTodayConversationSection
              title={model.viewModel.conversationTitle}
              description={model.viewModel.conversationDescription}
              recentSessions={model.recentSessions}
              openErrorMessage={model.conversationOpenError}
              onOpenNewChat={model.openNewChat}
              onOpenRecentSession={model.openRecentSession}
            />
          ) : null}
        </ScrollView>

        {model.shouldShowOnboardingNudge ? (
          <Card variant="muted" style={styles.conversationComposerCard}>
            <Pressable style={styles.onboardingNudge} onPress={model.openOnboarding}>
              <Text style={styles.onboardingNudgeText}>
                내 정보를 등록하면 주차별 맞춤 상담을 받을 수 있어요
              </Text>
            </Pressable>
          </Card>
        ) : null}
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.lg,
    gap: space.sm,
    flexGrow: 1,
  },
  conversationComposerCard: {
    marginTop: "auto",
    marginHorizontal: space.lg,
    marginBottom: 0,
  },
  onboardingNudge: {
    backgroundColor: surface.surfaceAccent,
    borderRadius: radii.lg,
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    marginBottom: space.sm,
  },
  onboardingNudgeText: {
    ...typo.caption,
    color: palette.accent,
    textAlign: "center",
  },
});
