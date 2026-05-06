import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PatientProfileSettingsForm } from "../../components/patient/profile-settings/PatientProfileSettingsForm";
import { PatientShell } from "../../components/patient/PatientShell";
import { Button } from "../../components/ui";
import { patientSurfacePalette as surface, space, typo } from "../../theme";
import { buildPatientScrollContentInsets } from "./patientScreenLayout.model";
import { usePatientProfileSettingsScreenModel } from "./PatientProfileSettingsScreen.model";
import { USER_GUIDE_URL } from "./patientSurveyFormUrl.model";

function resolveAppVersionLabel() {
  const appVersion =
    Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? null;
  const buildVersion =
    Constants.nativeBuildVersion ??
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode ??
    null;

  if (!appVersion) {
    return "최신 버전 확인 중";
  }

  return buildVersion
    ? `최신 버전 v${appVersion} · 빌드 ${String(buildVersion)}`
    : `최신 버전 v${appVersion}`;
}

export function PatientProfileSettingsScreen() {
  const insets = useSafeAreaInsets();
  const model = usePatientProfileSettingsScreenModel();
  const appVersionLabel = resolveAppVersionLabel();
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
            onSelectThemeKey={model.selectThemeKey}
            onSelectTonePreference={model.selectTonePreference}
            onToggleTimePicker={model.toggleTimePicker}
            onToggleToneDropdown={model.toggleToneDropdown}
            toneOptions={model.toneOptions}
            tonePreference={model.tonePreference}
            themeKey={model.themeKey}
            themeOptions={model.themeOptions}
          />
          <Button
            label="사용설명서 보기"
            variant="secondary"
            onPress={() => {
              void Linking.openURL(USER_GUIDE_URL);
            }}
          />
          <Text style={styles.versionText}>{appVersionLabel}</Text>
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
  },
  versionText: {
    ...typo.caption,
    marginTop: space.md,
    color: surface.textSecondary,
    textAlign: "center",
    fontWeight: "500",
  },
});
