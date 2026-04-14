import { StyleSheet, Text, View } from "react-native";
import { Button, Card } from "../../ui";
import { patientSurfacePalette as surface, space, typo } from "../../../theme";

export function PatientProfileAccountCard({
  onLogout,
}: {
  onLogout: () => void | Promise<void>;
}) {
  return (
    <Card>
      <Text style={styles.sectionTitle}>계정</Text>
      <Text style={styles.sectionDescription}>
        기기를 바꾸거나 다른 계정으로 로그인할 때만 로그아웃해요.
      </Text>
      <View style={styles.accountRow}>
        <Button label="로그아웃" variant="text" onPress={onLogout} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  sectionDescription: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
  accountRow: {
    marginTop: space.md,
    alignItems: "flex-start",
  },
});
