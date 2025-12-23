'use client';

import { useState, useEffect, useCallback } from 'react';

export interface MaternalPreferences {
  darkMode: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xl';
  reducedMotion: boolean;
  highContrast: boolean;
  vibrationEnabled: boolean;
}

const defaultPreferences: MaternalPreferences = {
  darkMode: false,
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
  vibrationEnabled: false // Disabled by default for pregnancy comfort
};

const STORAGE_KEY = 'maternal-preferences';

export function useMaternalPreferences() {
  const [preferences, setPreferences] = useState<MaternalPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }

      // Detect system preferences
      const systemDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const systemReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const systemHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

      if (!stored) {
        setPreferences(prev => ({
          ...prev,
          darkMode: systemDarkMode,
          reducedMotion: systemReducedMotion,
          highContrast: systemHighContrast
        }));
      }
    } catch (error) {
      console.warn('Failed to load maternal preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: MaternalPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.warn('Failed to save maternal preferences:', error);
    }
  }, []);

  // Apply preferences to document
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;

    // Dark mode
    if (preferences.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large', 'font-xl');
    root.classList.add(`font-${preferences.fontSize}`);

    // High contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [preferences, isLoaded]);

  // Individual setters
  const toggleDarkMode = useCallback(() => {
    savePreferences({ ...preferences, darkMode: !preferences.darkMode });
  }, [preferences, savePreferences]);

  const setFontSize = useCallback((fontSize: MaternalPreferences['fontSize']) => {
    savePreferences({ ...preferences, fontSize });
  }, [preferences, savePreferences]);

  const toggleReducedMotion = useCallback(() => {
    savePreferences({ ...preferences, reducedMotion: !preferences.reducedMotion });
  }, [preferences, savePreferences]);

  const toggleHighContrast = useCallback(() => {
    savePreferences({ ...preferences, highContrast: !preferences.highContrast });
  }, [preferences, savePreferences]);

  const toggleVibration = useCallback(() => {
    savePreferences({ ...preferences, vibrationEnabled: !preferences.vibrationEnabled });
  }, [preferences, savePreferences]);

  const resetToDefaults = useCallback(() => {
    savePreferences(defaultPreferences);
  }, [savePreferences]);

  return {
    preferences,
    isLoaded,
    toggleDarkMode,
    setFontSize,
    toggleReducedMotion,
    toggleHighContrast,
    toggleVibration,
    resetToDefaults,
    updatePreferences: savePreferences
  };
}

// Font size utilities
export const getFontSizeClasses = (size: MaternalPreferences['fontSize']) => {
  switch (size) {
    case 'small':
      return 'text-sm leading-relaxed';
    case 'large':
      return 'text-lg leading-relaxed';
    case 'xl':
      return 'text-xl leading-loose';
    default:
      return 'text-base leading-relaxed';
  }
};

// Haptic feedback utility (pregnancy-safe)
export const useMaternalHaptics = () => {
  const { preferences } = useMaternalPreferences();

  const gentleVibrate = useCallback((pattern?: number | number[]) => {
    if (!preferences.vibrationEnabled || !navigator.vibrate) return;

    // Very gentle vibration patterns for pregnancy comfort
    const gentlePattern = pattern || 50; // Short, gentle vibration
    navigator.vibrate(gentlePattern);
  }, [preferences.vibrationEnabled]);

  const successVibrate = useCallback(() => {
    gentleVibrate([30, 50, 30]); // Gentle success pattern
  }, [gentleVibrate]);

  const errorVibrate = useCallback(() => {
    gentleVibrate([100]); // Single gentle vibration for errors
  }, [gentleVibrate]);

  return {
    gentleVibrate,
    successVibrate,
    errorVibrate,
    isEnabled: preferences.vibrationEnabled
  };
};