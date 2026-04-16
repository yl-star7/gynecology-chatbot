import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, Card, EmptyState } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { space, typo, patientSurfacePalette as surface } from "../../theme";
import { EmbeddedWebContent } from "../../web/EmbeddedWebContent";
import { buildPatientTabContentInsets } from "./patientScreenLayout.model";
import { resolvePatientSurveyLoadError } from "./patientErrorCopy.model";
import { normalizeSurveyFormUrl } from "./patientSurveyFormUrl.model";

export function PatientSurveyFormScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { currentUser, isRestoringSession } = useMobileAppSession();
  const { profilePort } = useMobileServices();
  const contentInsets = buildPatientTabContentInsets({
    bottomInset: insets.bottom,
    topSpacing: space.md,
  });
  const [surveyFormUrl, setSurveyFormUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasWebViewError, setHasWebViewError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadBranding = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setHasWebViewError(false);

    try {
      const branding = await profilePort.getBranding();
      const nextSurveyFormUrl = normalizeSurveyFormUrl(branding.surveyFormUrl);

      setSurveyFormUrl(nextSurveyFormUrl);
      if (!nextSurveyFormUrl) {
        setError("아직 열 수 있는 설문이 없어요.");
      }
    } catch (nextError) {
      setError(resolvePatientSurveyLoadError(nextError));
    } finally {
      setIsLoading(false);
    }
  }, [profilePort]);

  useFocusEffect(
    useCallback(() => {
      if (isRestoringSession) {
        return;
      }

      if (!currentUser) {
        router.replace("/auth/login");
        return;
      }

      void loadBranding();
    }, [currentUser, isRestoringSession, loadBranding, router]),
  );

  return (
    <PatientShell
      activeTab="profile"
      pageTone="plain"
      showProfileButton={false}
      hideHeader
    >
      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>설문을 준비하고 있어요.</Text>
        </View>
      ) : surveyFormUrl ? (
        <View style={styles.screen}>
          {hasWebViewError ? (
            <ScrollView
              contentContainerStyle={[styles.scrollContent, contentInsets]}
              showsVerticalScrollIndicator={false}
            >
              <Card>
                <EmptyState
                  icon="document-text-outline"
                  title="설문을 열지 못했어요"
                  description="네트워크 연결을 확인한 뒤 다시 열어주세요."
                />
                <Button
                  label="다시 시도"
                  onPress={() => {
                    setHasWebViewError(false);
                    setReloadKey((current) => current + 1);
                  }}
                />
              </Card>
            </ScrollView>
          ) : (
            <EmbeddedWebContent
              hasError={false}
              initialUrl={surveyFormUrl}
              nativeTitle="설문"
              onReload={() => {
                setReloadKey((current) => current + 1);
              }}
              onWebViewError={() => {
                setHasWebViewError(true);
              }}
              reloadKey={reloadKey}
            />
          )}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, contentInsets]}
          showsVerticalScrollIndicator={false}
        >
          <Card>
            <EmptyState
              icon="document-text-outline"
              title="설문을 준비 중이에요"
              description={error ?? "조금 뒤에 다시 확인해주세요."}
            />
            <Button label="다시 확인" onPress={() => void loadBranding()} />
          </Card>
        </ScrollView>
      )}
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: space.xl,
  },
  loadingText: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space.xl,
    gap: space.lg,
  },
});
