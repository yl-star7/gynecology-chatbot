import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { EmbeddedWebContent } from "./src/web/EmbeddedWebContent";
import { palette } from "./src/theme";

function resolveBaseUrl() {
  const configuredUrl =
    process.env.EXPO_PUBLIC_WEB_URL ?? process.env.EXPO_PUBLIC_API_BASE_URL;

  if (configuredUrl && configuredUrl.trim().length > 0) {
    return configuredUrl.trim();
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:3005";
  }

  return "http://localhost:3005";
}

function resolveInitialUrl() {
  const baseUrl = resolveBaseUrl();
  const homeUrl = `${baseUrl}/`;
  const devUserId = process.env.EXPO_PUBLIC_DEV_USER_ID?.trim();

  if (!devUserId) {
    return homeUrl;
  }

  return `${homeUrl}?userId=${encodeURIComponent(devUserId)}`;
}

type AppState = {
  hasError: boolean;
  reloadKey: number;
};

export default class App extends React.Component<
  Record<string, never>,
  AppState
> {
  state: AppState = {
    hasError: false,
    reloadKey: 0,
  };

  initialUrl = resolveInitialUrl();

  handleReload = () => {
    this.setState((currentState) => ({
      hasError: false,
      reloadKey: currentState.reloadKey + 1,
    }));
  };

  handleWebViewError = () => {
    this.setState({ hasError: true });
  };

  render() {
    return (
      <View style={styles.container}>
        <EmbeddedWebContent
          hasError={this.state.hasError}
          initialUrl={this.initialUrl}
          nativeTitle="홈"
          onReload={this.handleReload}
          onWebViewError={this.handleWebViewError}
          reloadKey={this.state.reloadKey}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
});
