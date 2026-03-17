// @ts-nocheck
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView, type ShouldStartLoadRequest, type WebViewNavigation } from "react-native-webview";
import { EmbeddedWebContent } from "../src/web/EmbeddedWebContent";

function normalizeBaseUrl(rawUrl: string | undefined): string {
  if (!rawUrl) {
    return "http://localhost:4000";
  }

  return rawUrl.endsWith("/") ? rawUrl.slice(0, -1) : rawUrl;
}

function withUserId(baseUrl: string, userId: string | undefined) {
  if (!userId) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set("userId", userId);
    return url.toString();
  } catch {
    const separator = baseUrl.includes("?") ? "&" : "?";
    return `${baseUrl}${separator}userId=${encodeURIComponent(userId)}`;
  }
}

function appendUserId(rawUrl: string, userId: string | undefined) {
  if (!userId) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.get("userId")) {
      url.searchParams.set("userId", userId);
    }
    return url.toString();
  } catch {
    const separator = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${separator}userId=${encodeURIComponent(userId)}`;
  }
}

function buildWebUrl(baseUrl: string, userId: string | undefined, path = "") {
  const normalizedPath = path.replace(/^\/+/, "");
  const resolvedUrl = normalizedPath ? `${baseUrl}/${normalizedPath}` : baseUrl;
  return appendUserId(resolvedUrl, userId);
}

function isInternalUrl(baseUrl: string, nextUrl: string) {
  try {
    const base = new URL(baseUrl);
    const target = new URL(nextUrl);
    return base.origin === target.origin;
  } catch {
    return nextUrl.startsWith(baseUrl);
  }
}

export default function Index() {
  const webViewRef = useRef<WebView>(null);
  const { width } = useWindowDimensions();
  const [reloadKey, setReloadKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");
  const [nativeTitle, setNativeTitle] = useState("부인과 상담 앱");
  const devUserId = process.env.EXPO_PUBLIC_DEV_USER_ID;

  const baseUrl = useMemo(() => {
    const normalizedBaseUrl = normalizeBaseUrl(process.env.EXPO_PUBLIC_WEB_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL);
    return withUserId(normalizedBaseUrl, devUserId);
  }, [devUserId]);
  const initialUrl = useMemo(() => buildWebUrl(baseUrl, devUserId), [baseUrl, devUserId]);
  const isWideLayout = width >= 768;
  const frameWidth = isWideLayout ? Math.min(width - 40, 560) : width;

  useEffect(() => {
    if (Platform.OS !== "android") {
      return;
    }

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current.goBack();
        return true;
      }

      return false;
    });

    return () => subscription.remove();
  }, [canGoBack]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return;
    }

    const handleDeepLink = (event: { url: string }) => {
      const { path, queryParams } = Linking.parse(event.url);
      if (!path || !webViewRef.current) {
        return;
      }

      const nextUrl = new URL(buildWebUrl(baseUrl, devUserId, path));
      if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
          if (typeof value === "string") {
            nextUrl.searchParams.set(key, value);
          }
        });
      }

      webViewRef.current.injectJavaScript(`
        window.location.href = ${JSON.stringify(nextUrl.toString())};
        true;
      `);
    };

    const subscription = Linking.addEventListener("url", handleDeepLink);
    return () => subscription.remove();
  }, [baseUrl, devUserId]);

  const reload = useCallback(() => {
    setHasError(false);
    setReloadKey((current) => current + 1);

    if (Platform.OS !== "web") {
      webViewRef.current?.reload();
    }
  }, []);

  const handleNavigationStateChange = useCallback((navigationState: WebViewNavigation) => {
    setCanGoBack(navigationState.canGoBack);
    setCurrentUrl(navigationState.url);
    setHasError(false);
  }, []);

  const handleShouldStartLoad = useCallback(
    (request: ShouldStartLoadRequest) => {
      if (request.url === "about:blank") {
        return true;
      }

      if (isInternalUrl(baseUrl, request.url)) {
        return true;
      }

      void WebBrowser.openBrowserAsync(request.url);
      return false;
    },
    [baseUrl],
  );

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      try {
        const message = JSON.parse(event.nativeEvent.data) as {
          type?: string;
          payload?: { url?: string; path?: string; title?: string };
        };

        if (message.type === "open-external" && message.payload?.url) {
          void WebBrowser.openBrowserAsync(message.payload.url);
          return;
        }

        if (message.type === "open-native" && message.payload?.path) {
          void Linking.openURL(`gynecology-chatbot://${message.payload.path.replace(/^\//, "")}`);
          return;
        }

        if (message.type === "set-title" && message.payload?.title) {
          setNativeTitle(message.payload.title);
          return;
        }

        if (message.type === "reload") {
          reload();
        }
      } catch (error) {
        console.error(`WebView message parse error: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    [reload],
  );

  const injectedJavaScript = `
    window.ReactNativeApp = { platform: ${JSON.stringify(Platform.OS)} };
    window.isNativeApp = true;
    window.ReactNativeBridge = {
      postMessage: function(type, payload) {
        if (!window.ReactNativeWebView) return;
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: type, payload: payload || {} }));
      },
      openExternal: function(url) {
        this.postMessage("open-external", { url: url });
      },
      openNative: function(path) {
        this.postMessage("open-native", { path: path });
      },
      setTitle: function(title) {
        this.postMessage("set-title", { title: title });
      },
      reload: function() {
        this.postMessage("reload", {});
      }
    };
    window.dispatchEvent(new CustomEvent("react-native-ready"));
    true;
  `;

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right", "bottom"]}>
      <View style={[styles.shell, isWideLayout ? styles.shellWide : null]}>
        <View style={[styles.frame, { width: frameWidth }, isWideLayout ? styles.frameWide : null]}>
          <View style={styles.toolbar}>
            <View>
              <Text style={styles.toolbarEyebrow}>Mobile Wrapper</Text>
              <Text style={styles.toolbarTitle}>{nativeTitle}</Text>
            </View>
            <View style={styles.toolbarActions}>
              <Pressable
                style={[styles.toolbarButton, !canGoBack ? styles.toolbarButtonDisabled : null]}
                disabled={!canGoBack}
                onPress={() => webViewRef.current?.goBack()}
              >
                <Text style={styles.toolbarButtonLabel}>뒤로</Text>
              </Pressable>
              <Pressable style={styles.toolbarButton} onPress={reload}>
                <Text style={styles.toolbarButtonLabel}>새로고침</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.urlBar}>
            <Text numberOfLines={1} style={styles.urlText}>
              {(currentUrl || initialUrl).replace(/^https?:\/\//, "")}
            </Text>
          </View>

          <View style={styles.webviewContainer}>
            <EmbeddedWebContent
              hasError={hasError}
              initialUrl={initialUrl}
              injectedJavaScript={injectedJavaScript}
              nativeTitle={nativeTitle}
              onMessage={handleMessage}
              onNavigationStateChange={handleNavigationStateChange}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              onReload={reload}
              onWebViewError={() => {
                setHasError(true);
              }}
              reloadKey={reloadKey}
              webViewRef={webViewRef}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ebefe4",
  },
  shell: {
    flex: 1,
  },
  shellWide: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  frame: {
    flex: 1,
    backgroundColor: "#f8faf4",
  },
  frameWide: {
    flex: 0,
    height: "100%",
    maxHeight: 920,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(20, 34, 20, 0.1)",
    ...(Platform.OS === "web"
      ? {
          boxShadow: "0px 14px 24px rgba(41, 58, 39, 0.12)",
        }
      : {
          shadowColor: "#293a27",
          shadowOpacity: 0.12,
          shadowRadius: 24,
          shadowOffset: { width: 0, height: 14 },
          elevation: 8,
        }),
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: "#f8faf4",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(20, 34, 20, 0.08)",
  },
  toolbarEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    color: "#69786b",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  toolbarTitle: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: "#142214",
  },
  toolbarActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  toolbarButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(20, 34, 20, 0.1)",
  },
  toolbarButtonDisabled: {
    opacity: 0.45,
  },
  toolbarButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#142214",
  },
  urlBar: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#f2f5ed",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(20, 34, 20, 0.08)",
  },
  urlText: {
    fontSize: 13,
    color: "#5a695b",
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
});
