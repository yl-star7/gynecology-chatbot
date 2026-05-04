import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { MobileThemeKey } from "@gynecology-chatbot/app-core";
import {
  DEFAULT_MOBILE_THEME_KEY,
  resolveMobileThemeKey,
} from "@gynecology-chatbot/app-core";
import {
  createPatientSurfacePalette,
  createThemeShadows,
  readActiveMobileThemeKey,
  resolveNativePalette,
  setActiveMobileThemeKey,
  type PatientTheme,
} from "./theme";
import {
  persistNativeThemeKeyForUser,
  readNativeThemeKeyForUser,
} from "./core/nativeSessionStorage";

type MobileThemeContextValue = PatientTheme & {
  applyThemeKey(
    themeKey?: string | null,
    userId?: string | null,
  ): Promise<MobileThemeKey>;
  restoreThemeKeyForUser(
    userId: string,
    fallbackThemeKey?: string | null,
  ): Promise<MobileThemeKey>;
};

const MobileThemeContext = createContext<MobileThemeContextValue | null>(null);

function buildPatientTheme(themeKey?: string | null): PatientTheme {
  const key = resolveMobileThemeKey(themeKey);
  const palette = resolveNativePalette(key);
  const surface = createPatientSurfacePalette(palette);

  return {
    key,
    palette,
    surface,
    shadows: createThemeShadows(palette, surface),
  };
}

export function MobileThemeProvider({ children }: { children: ReactNode }) {
  const [themeKey, setThemeKey] = useState<MobileThemeKey>(() =>
    resolveMobileThemeKey(
      readActiveMobileThemeKey() ?? DEFAULT_MOBILE_THEME_KEY,
    ),
  );

  const applyThemeKey = useCallback(
    async (nextThemeKey?: string | null, userId?: string | null) => {
      const resolvedThemeKey = resolveMobileThemeKey(nextThemeKey);
      setActiveMobileThemeKey(resolvedThemeKey);
      setThemeKey((currentThemeKey) =>
        currentThemeKey === resolvedThemeKey
          ? currentThemeKey
          : resolvedThemeKey,
      );
      if (userId) {
        await persistNativeThemeKeyForUser(userId, resolvedThemeKey);
      }
      return resolvedThemeKey;
    },
    [],
  );

  const restoreThemeKeyForUser = useCallback(
    async (userId: string, fallbackThemeKey?: string | null) => {
      const storedThemeKey = await readNativeThemeKeyForUser(userId);
      return applyThemeKey(storedThemeKey ?? fallbackThemeKey, userId);
    },
    [applyThemeKey],
  );

  const value = useMemo<MobileThemeContextValue>(() => {
    const theme = buildPatientTheme(themeKey);

    return {
      ...theme,
      applyThemeKey,
      restoreThemeKeyForUser,
    };
  }, [applyThemeKey, restoreThemeKeyForUser, themeKey]);

  return (
    <MobileThemeContext.Provider value={value}>
      {children}
    </MobileThemeContext.Provider>
  );
}

export function useMobileTheme() {
  const value = useContext(MobileThemeContext);
  if (!value) {
    throw new Error("useMobileTheme must be used within MobileThemeProvider");
  }

  return value;
}

export function useOptionalMobileTheme() {
  return useContext(MobileThemeContext);
}
