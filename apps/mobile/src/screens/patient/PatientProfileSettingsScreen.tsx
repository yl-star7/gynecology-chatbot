import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PatientProfileSettingsForm } from "../../components/patient/profile-settings/PatientProfileSettingsForm";
import { PatientShell } from "../../components/patient/PatientShell";
import { patientSurfacePalette as surface, space, typo } from "../../theme";
import { buildPatientScrollContentInsets } from "./patientScreenLayout.model";
import { usePatientProfileSettingsScreenModel } from "./PatientProfileSettingsScreen.model";

export function PatientProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const model = usePatientProfileSettingsScreenModel();
  const contentInsets = buildPatientScrollContentInsets({
    bottomInset: insets.bottom,
    tabBarHeight: 0,
    extraBottomSpacing: space.xl,
    topSpacing: 0,
  });

  return (
    <PatientShell
      activeTab="profile"
      title="세부 설정"
      backHref="/(tabs)/profile"
      showProfileButton={false}
      pageTone="plain"
      headerCompact
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: contentInsets.paddingTop,
              paddingBottom: contentInsets.paddingBottom,
            },
          ]}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.helperText}>
            필요한 정보만 편하게 바꿔보세요.
          </Text>

          <PatientProfileSettingsForm
            babyNickname={model.babyNickname}
            dueDate={model.dueDate}
            dueDateMaxDate={model.dueDateMaxDate}
            error={model.error}
            hospitalName={model.hospitalName}
            isSaving={model.isSaving}
            isTimePickerOpen={model.isTimePickerOpen}
            isToneDropdownOpen={model.isToneDropdownOpen}
            notificationTime={model.notificationTime}
            onChangeBabyNickname={model.setBabyNickname}
            onChangeDueDate={model.setDueDate}
            onChangeHospitalName={model.setHospitalName}
            onSave={() => {
              void model.handleSave();
            }}
            onSelectNotificationTime={model.selectNotificationTime}
            onSelectTonePreference={model.selectTonePreference}
            onToggleTimePicker={model.toggleTimePicker}
            onToggleToneDropdown={model.toggleToneDropdown}
            toneOptions={model.toneOptions}
            tonePreference={model.tonePreference}
          />
        </ScrollView>
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
  },
  helperText: {
    ...typo.body,
    color: surface.textSecondary,
  },
});
