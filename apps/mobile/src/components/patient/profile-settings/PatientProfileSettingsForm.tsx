import { StyleSheet, Text, View } from "react-native";
import { Button, Card, DueDateCalendarPicker, LabeledInput } from "../../ui";
import { palette, patientSurfacePalette as surface, space, typo } from "../../../theme";
import { DEFAULT_NOTIFICATION_TIME } from "../../../screens/patient/PatientProfileSettingsScreen.model";
import { PatientTonePreferenceField } from "./PatientTonePreferenceField";

export function PatientProfileSettingsForm({
  babyNickname,
  dueDate,
  dueDateMaxDate,
  error,
  hospitalName,
  isSaving,
  isToneDropdownOpen,
  notificationTime,
  onChangeBabyNickname,
  onChangeDueDate,
  onChangeHospitalName,
  onChangeNotificationTime,
  onSave,
  onSelectTonePreference,
  onToggleToneDropdown,
  toneOptions,
  tonePreference,
}: {
  babyNickname: string;
  dueDate: string;
  dueDateMaxDate: Date;
  error: string | null;
  hospitalName: string;
  isSaving: boolean;
  isToneDropdownOpen: boolean;
  notificationTime: string;
  onChangeBabyNickname: (value: string) => void;
  onChangeDueDate: (value: string) => void;
  onChangeHospitalName: (value: string) => void;
  onChangeNotificationTime: (value: string) => void;
  onSave: () => void;
  onSelectTonePreference: (value: string) => void;
  onToggleToneDropdown: () => void;
  toneOptions: string[];
  tonePreference: string;
}) {
  return (
    <Card variant="muted">
      <View style={styles.form}>
        <LabeledInput
          label="태명"
          value={babyNickname}
          onChangeText={onChangeBabyNickname}
          placeholder="우리 아기 별명"
        />
        <View style={styles.fieldBlock}>
          <Text style={styles.fieldLabel}>출산 예정일</Text>
          <DueDateCalendarPicker
            value={dueDate}
            onChange={onChangeDueDate}
            minDate={new Date()}
            maxDate={dueDateMaxDate}
          />
        </View>
        <LabeledInput
          label="병원"
          value={hospitalName}
          onChangeText={onChangeHospitalName}
          placeholder="다니는 병원 이름"
        />
        <LabeledInput
          label="알림 시간"
          value={notificationTime}
          onChangeText={onChangeNotificationTime}
          placeholder={DEFAULT_NOTIFICATION_TIME}
        />
        <PatientTonePreferenceField
          value={tonePreference}
          isOpen={isToneDropdownOpen}
          options={toneOptions}
          onToggle={onToggleToneDropdown}
          onSelect={onSelectTonePreference}
        />
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <Button
          label={isSaving ? "저장 중이에요..." : "저장하기"}
          onPress={onSave}
          disabled={isSaving}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: space.md,
  },
  fieldBlock: {
    gap: space.xs,
  },
  fieldLabel: {
    ...typo.caption,
    color: surface.textSecondary,
    fontWeight: "600",
  },
  errorText: {
    ...typo.caption,
    color: palette.errorText,
  },
});