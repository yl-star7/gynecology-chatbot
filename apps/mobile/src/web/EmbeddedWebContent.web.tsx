// @ts-nocheck
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { palette } from "../theme";

export function EmbeddedWebContent(props: {
  hasError: boolean;
  initialUrl: string;
  nativeTitle: string;
  onReload: () => void;
  onWebViewError?: () => void;
  reloadKey: number;
}) {
  const canRenderIframe = typeof document !== "undefined";

  if (props.hasError) {
    return (
      <View style={styles.errorState}>
        <Text style={styles.errorTitle}>화면을 불러오지 못했습니다.</Text>
        <Text style={styles.errorCopy}>
          웹 앱 서버와 EXPO_PUBLIC_WEB_URL 설정을 확인한 뒤 다시 시도하세요.
        </Text>
        <Pressable style={styles.retryButton} onPress={props.onReload}>
          <Text style={styles.retryButtonLabel}>다시 시도</Text>
        </Pressable>
      </View>
    );
  }

  if (!canRenderIframe) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="small" color={palette.accent} />
        <Text style={styles.loadingTitle}>서비스 연결 중</Text>
        <Text style={styles.loadingCopy}>
          웹 사용자 화면을 불러오고 있습니다.
        </Text>
      </View>
    );
  }

  return (
    <iframe
      key={props.reloadKey}
      title={props.nativeTitle}
      src={props.initialUrl}
      style={styles.iframe as never}
      allow="clipboard-read; clipboard-write; fullscreen"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
}

const styles = StyleSheet.create({
  iframe: {
    width: "100%",
    height: "100%",
    borderWidth: 0,
    backgroundColor: palette.background,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#ffffff",
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.ink,
  },
  loadingCopy: {
    fontSize: 14,
    color: palette.subInk,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
    backgroundColor: palette.background,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.ink,
    textAlign: "center",
  },
  errorCopy: {
    fontSize: 14,
    lineHeight: 22,
    color: palette.subInk,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  retryButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
