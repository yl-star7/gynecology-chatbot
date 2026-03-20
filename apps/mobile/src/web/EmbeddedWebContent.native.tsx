// @ts-nocheck
import * as Linking from "expo-linking";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";
import { palette, patientSurfacePalette as surface } from "../theme";

export function EmbeddedWebContent(props: {
  hasError: boolean;
  initialUrl: string;
  nativeTitle?: string;
  onReload?: () => void;
  onWebViewError: () => void;
  reloadKey: number;
}) {
  const renderLoading = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="small" color={palette.accent} />
      <Text style={styles.loadingTitle}>잠시만요</Text>
      <Text style={styles.loadingCopy}>
        화면을 준비하고 있어요.
      </Text>
    </View>
  );

  if (props.hasError) {
    return (
      <View style={styles.errorState}>
        <Text style={styles.errorTitle}>연결할 수 없어요</Text>
        <Text style={styles.errorCopy}>
          네트워크 연결을 확인하고 다시 시도해주세요.
        </Text>
      </View>
    );
  }

  return (
    <WebView
      key={props.reloadKey}
      source={{ uri: props.initialUrl }}
      style={styles.webview}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      renderLoading={renderLoading}
      onError={() => {
        props.onWebViewError();
      }}
      onShouldStartLoadWithRequest={(request) => {
        try {
          const requestUrl = new URL(request.url);
          if (
            requestUrl.pathname === "/admin" ||
            requestUrl.pathname.startsWith("/admin/")
          ) {
            void Linking.openURL(request.url);
            return false;
          }
        } catch {
          return true;
        }

        return true;
      }}
    />
  );
}

const styles = StyleSheet.create({
  webview: {
    flex: 1,
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
});
