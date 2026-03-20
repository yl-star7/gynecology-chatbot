// @ts-nocheck
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { palette, patientSurfacePalette as surface } from "../theme";

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
        <Text style={styles.errorTitle}>연결할 수 없어요</Text>
        <Text style={styles.errorCopy}>
          네트워크 연결을 확인하고 다시 시도해주세요.
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
        <Text style={styles.loadingTitle}>잠시만요</Text>
        <Text style={styles.loadingCopy}>
          화면을 준비하고 있어요.
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
    backgroundColor: surface.pageBackground,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: surface.surfacePrimary,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  loadingCopy: {
    fontSize: 14,
    color: surface.textSecondary,
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
    backgroundColor: surface.pageBackground,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: surface.textPrimary,
    textAlign: "center",
  },
  errorCopy: {
    fontSize: 14,
    lineHeight: 22,
    color: surface.textSecondary,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: surface.accentSolid,
  },
  retryButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
