// @ts-nocheck
import { useLocalSearchParams } from "expo-router";
import { PatientRecordDayScreen } from "../../src/screens/patient/PatientRecordDayScreen";

export default function RecordDayRoute() {
  const { isoDate, returnTo } = useLocalSearchParams<{
    isoDate?: string;
    returnTo?: string;
  }>();

  return (
    <PatientRecordDayScreen
      isoDate={typeof isoDate === "string" ? isoDate : ""}
      returnTo={typeof returnTo === "string" ? returnTo : undefined}
    />
  );
}
