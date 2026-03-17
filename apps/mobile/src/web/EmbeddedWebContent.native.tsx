// @ts-nocheck
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { WebView } from "react-native-webview";

export function EmbeddedWebContent(props: {
  hasError: boolean;
  initialUrl: string;
  injectedJavaScript: string;
  onMessage: (event: { nativeEvent: { data: string } }) => void;
  onNavigationStateChange: (navigationState: unknown) => void;
  onShouldStartLoadWithRequest: (request: unknown) => boolean;
  onWebViewError: () => void;
  reloadKey: number;
  webViewRef: React.MutableRefObject<WebView | null>;
}) {
  const renderLoading = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="small" color="#d76c57" />
      <Text style={styles.loadingTitle}>서비스 연결 중</Text>
      <Text style={styles.loadingCopy}>웹 사용자 화면을 불러오고 있습니다.</Text>
    </View>
  );

  if (props.hasError) {
    return (
      <View style={styles.errorState}>
        <Text style={styles.errorTitle}>화면을 불러오지 못했습니다.</Text>
        <Text style={styles.errorCopy}>웹 앱 서버와 EXPO_PUBLIC_WEB_URL 설정을 확인한 뒤 다시 시도하세요.</Text>
      </View>
    );
  }

  return (
    <WebView
      key={props.reloadKey}
      ref={props.webViewRef}
      source={{ uri: props.initialUrl }}
      style={styles.webview}
      injectedJavaScript={props.injectedJavaScript}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      renderLoading={renderLoading}
      allowsBackForwardNavigationGestures
      sharedCookiesEnabled
      thirdPartyCookiesEnabled
      mediaPlaybackRequiresUserAction={false}
      allowsInlineMediaPlayback
      originWhitelist={["*"]}
      cacheEnabled
      onMessage={props.onMessage}
      onNavigationStateChange={props.onNavigationStateChange}
      onShouldStartLoadWithRequest={props.onShouldStartLoadWithRequest}
      onError={() => {
        props.onWebViewError();
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
    backgroundColor: "#ffffff",
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#142214",
  },
  loadingCopy: {
    fontSize: 14,
    color: "#5a695b",
  },
  errorState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 10,
    backgroundColor: "#ffffff",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#142214",
    textAlign: "center",
  },
  errorCopy: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5a695b",
    textAlign: "center",
  },
});
