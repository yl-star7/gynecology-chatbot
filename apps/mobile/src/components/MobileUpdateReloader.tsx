import { useEffect } from "react";
import { AppState } from "react-native";

const MIN_UPDATE_CHECK_INTERVAL_MS = 60_000;

type ExpoUpdatesModule = typeof import("expo-updates");

declare const require: (moduleName: string) => unknown;

let isCheckingForUpdate = false;
let isReloadingForUpdate = false;
let lastUpdateCheckAt = 0;

function loadUpdatesModule() {
  if (__DEV__) {
    return null;
  }

  try {
    return require("expo-updates") as ExpoUpdatesModule;
  } catch {
    return null;
  }
}

async function checkForUpdateAndReload() {
  const Updates = loadUpdatesModule();

  if (
    !Updates ||
    !Updates.isEnabled ||
    !Updates.channel ||
    !Updates.runtimeVersion ||
    isCheckingForUpdate ||
    isReloadingForUpdate
  ) {
    return;
  }

  const now = Date.now();
  if (now - lastUpdateCheckAt < MIN_UPDATE_CHECK_INTERVAL_MS) {
    return;
  }

  lastUpdateCheckAt = now;
  isCheckingForUpdate = true;

  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) {
      return;
    }

    const fetchResult = await Updates.fetchUpdateAsync();
    if (!fetchResult.isNew && !fetchResult.isRollBackToEmbedded) {
      return;
    }

    isReloadingForUpdate = true;
    await Updates.reloadAsync();
  } catch {
    // Update failures should not block normal app launch.
  } finally {
    isCheckingForUpdate = false;
  }
}

export function MobileUpdateReloader() {
  useEffect(() => {
    void checkForUpdateAndReload();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void checkForUpdateAndReload();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return null;
}
