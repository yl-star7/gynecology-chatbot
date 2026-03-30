// @ts-nocheck
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Button, Card, EmptyState, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { createMobileApiClient } from "../../api/mobileApi";
import { space, typo, patientSurfacePalette as surface, palette } from "../../theme";
import { EmbeddedWebContent } from "../../web/EmbeddedWebContent";

function normalizeSurveyFormUrl(input: string | null | undefined) {
  if (!input?.trim()) {
    return null;
  }

  try {
    const parsedUrl = new URL(input.trim());
    const isAllowedHost =
      parsedUrl.hostname === "docs.google.com" ||
      parsedUrl.hostname === "forms.gle";
    const isAllowedPath =
      parsedUrl.hostname === "forms.gle" ||
      parsedUrl.pathname.startsWith("/forms/");

    if (parsedUrl.protocol !== "https:" || !isAllowedHost || !isAllowedPath) {
      return null;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function PatientSurveyFormScreen() {
  const { currentUser } = useMobileAppSession();
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
      const client = createMobileApiClient();
      const branding = await client.fetchMobileBranding();
      const nextSurveyFormUrl = normalizeSurveyFormUrl(branding.surveyFormUrl);

      setSurveyFormUrl(nextSurveyFormUrl);
      if (!nextSurveyFormUrl) {
        setError("아직 열 수 있는 설문이 없어요.");
      }
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "설문 화면을 불러오지 못했어요.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    void loadBranding();
  }, [currentUser, loadBranding]);

  return (
    <PatientShell activeTab="profile" pageTone="plain" showProfileButton={false}>
      {isLoading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>설문을 준비하고 있어요.</Text>
        </View>
      ) : surveyFormUrl ? (
        <View style={styles.screen}>
          <View style={styles.header}>
            <Pressable onPress={() => router.replace("/profile")} accessibilityLabel="마이페이지로 돌아가기">
              <Text style={styles.backLabel}>마이페이지로</Text>
            </Pressable>
            <Text style={styles.title}>설문</Text>
            <View style={styles.headerSpacer} />
          </View>
          {hasWebViewError ? (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space.xl,
    paddingBottom: space.md,
    gap: space.md,
    backgroundColor: surface.pageBackground,
  },
  backLabel: {
    ...typo.label,
    color: palette.accent,
  },
  title: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  headerSpacer: {
    width: space.xxxl * 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 140,
    gap: space.lg,
  },
});
