import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BrandMark, Button, Card, KeyboardScreen } from "../src/components/ui";
import { useMobileAppSession } from "../src/core/MobileAppSessionProvider";
import { palette, space, typo } from "../src/theme";
import { resolvePostLoginHref } from "../src/screens/auth/LoginScreen.model";

export default function ApprovalPendingRoute() {
  const { currentUser, isRestoringSession, refreshCurrentUser, signOut } =
    useMobileAppSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isRestoringSession) {
      return;
    }

    if (!currentUser) {
      router.replace("/auth/login");
    } else if (currentUser.accountStatus !== "pending_approval") {
      router.replace(
        currentUser.hasCompletedOnboarding ? "/(tabs)/home" : "/onboarding",
      );
    }
  }, [currentUser, isRestoringSession, router]);

  async function handleRefreshApprovalStatus() {
    try {
      setIsChecking(true);
      setStatusMessage(null);
      setError(null);

      const nextUser = await refreshCurrentUser();
      if (nextUser.accountStatus === "pending_approval") {
        setStatusMessage("아직 승인 대기 중이에요.");
        return;
      }

      router.replace(resolvePostLoginHref(nextUser));
    } catch {
      setError("승인 상태를 확인하지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsChecking(false);
    }
  }

  if (isRestoringSession || currentUser?.accountStatus !== "pending_approval") {
    return null;
  }

  return (
    <KeyboardScreen centered>
      <View style={styles.brandBlock}>
        <BrandMark centered subtitle="곧 안전하게 시작할 수 있어요" size={68} />
      </View>
      <Card>
        <View style={styles.content}>
          <Text style={styles.title}>관리자 승인을 기다리고 있어요</Text>
          <Text style={styles.body}>
            전화번호 확인은 완료됐어요. 관리자가 사용을 승인하면 앱을 이용할 수
            있고, 승인 알림을 받을 수 있어요.
          </Text>
          <Text style={styles.caption}>
            승인이 오래 걸리면 연구 담당자에게 문의해 주세요.
          </Text>
          {statusMessage ? (
            <Text style={styles.status}>{statusMessage}</Text>
          ) : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button
            label={isChecking ? "확인 중" : "승인 상태 확인"}
            onPress={handleRefreshApprovalStatus}
            disabled={isChecking}
          />
          <Button
            label="다른 번호로 로그인"
            variant="secondary"
            onPress={signOut}
          />
        </View>
      </Card>
    </KeyboardScreen>
  );
}

const styles = StyleSheet.create({
  brandBlock: {
    marginBottom: space.lg,
  },
  content: {
    gap: space.lg,
  },
  title: {
    ...typo.titleLg,
    color: palette.ink,
    textAlign: "center",
  },
  body: {
    ...typo.body,
    color: palette.subInk,
    textAlign: "center",
  },
  caption: {
    ...typo.caption,
    color: palette.subInk,
    textAlign: "center",
  },
  status: {
    ...typo.caption,
    color: palette.accent,
    textAlign: "center",
  },
  error: {
    ...typo.caption,
    color: palette.errorText,
    textAlign: "center",
  },
});
