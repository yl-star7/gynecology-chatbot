import { WebView } from "react-native-webview";
import { StyleSheet, SafeAreaView, BackHandler, Platform } from "react-native";
import { useRef, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || "https://your-app.vercel.app";

export default function Index() {
    const webViewRef = useRef<WebView>(null);
    const router = useRouter();

    // Handle Android back button
    useEffect(() => {
        if (Platform.OS !== "android") return;

        const onBackPress = () => {
            if (webViewRef.current) {
                webViewRef.current.goBack();
                return true;
            }
            return false;
        };

        BackHandler.addEventListener("hardwareBackPress", onBackPress);
        return () => BackHandler.removeEventListener("hardwareBackPress", onBackPress);
    }, []);

    // Handle deep links
    useEffect(() => {
        const handleDeepLink = (event: { url: string }) => {
            const { path } = Linking.parse(event.url);
            if (path && webViewRef.current) {
                webViewRef.current.injectJavaScript(`
          window.location.href = '${WEB_URL}/${path}';
          true;
        `);
            }
        };

        const subscription = Linking.addEventListener("url", handleDeepLink);
        return () => subscription.remove();
    }, []);

    // Handle messages from WebView
    const onMessage = useCallback((event: { nativeEvent: { data: string } }) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);

            switch (data.type) {
                case "SHARE":
                    // Handle share action (like KakaoTalk share)
                    break;
                case "NAVIGATE":
                    router.push(data.path);
                    break;
                case "CAMERA":
                    // Handle camera request
                    break;
            }
        } catch (error) {
            console.error("Message parse error:", error);
        }
    }, [router]);

    // Inject JavaScript to enable communication
    const injectedJavaScript = `
    window.ReactNativeWebView = window.ReactNativeWebView || {};
    window.isNativeApp = true;
    
    // Override share function for native handling
    window.nativeShare = function(data) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'SHARE',
        data: data
      }));
    };
    
    true;
  `;

    return (
        <SafeAreaView style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ uri: WEB_URL }}
                style={styles.webview}
                onMessage={onMessage}
                injectedJavaScript={injectedJavaScript}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                scalesPageToFit={true}
                allowsBackForwardNavigationGestures={true}
                sharedCookiesEnabled={true}
                thirdPartyCookiesEnabled={true}
                mediaPlaybackRequiresUserAction={false}
                allowsInlineMediaPlayback={true}
                originWhitelist={["*"]}
                cacheEnabled={true}
                cacheMode="LOAD_DEFAULT"
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.error("WebView error:", nativeEvent);
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f28b5c",
    },
    webview: {
        flex: 1,
    },
});
