import { StyleSheet, Text, View } from "react-native";
import { Button, Card } from "../../ui";
import {
  patientSurfacePalette as surface,
  radii,
  shadows,
  space,
  typo,
} from "../../../theme";

export function PatientExternalSurveyCard({
  surveys,
  onOpenSurvey,
}: {
  surveys: Array<{ id: string; label: string; url: string }>;
  onOpenSurvey: (surveyId: string) => void;
}) {
  const hasSurveys = surveys.length > 0;

  return (
    <Card variant="muted">
      <Text style={styles.sectionTitle}>외부 설문</Text>
      <Text style={styles.sectionDescription}>
        운영팀이 준비한 구글 설문이 있을 때 여기에서 바로 열 수 있어요.
      </Text>
      <View style={styles.externalSurveyCard}>
        <Text style={styles.externalSurveyTitle}>설문으로 의견 들려주세요</Text>
        <Text style={styles.externalSurveyBody}>
          {hasSurveys
            ? "설문 페이지로 이동해 바로 답할 수 있어요."
            : "아직 열 수 있는 설문이 없어요. 준비되면 여기에서 안내해드릴게요."}
        </Text>
        {hasSurveys ? (
          surveys.map((survey) => (
            <Button
              key={survey.id}
              label={`${survey.label} 열기`}
              variant="secondary"
              onPress={() => onOpenSurvey(survey.id)}
            />
          ))
        ) : (
          <Button
            label="설문 열기"
            variant="secondary"
            onPress={() => undefined}
            disabled
          />
        )}
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
  externalSurveyCard: {
    marginTop: space.lg,
    borderRadius: radii.xl,
    backgroundColor: surface.surfacePrimary,
    padding: space.lg,
    gap: space.sm,
    ...shadows.card,
  },
  externalSurveyTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  externalSurveyBody: {
    ...typo.caption,
    color: surface.textSecondary,
  },
});
