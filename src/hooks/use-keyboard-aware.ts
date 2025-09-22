'use client';

import { useEffect, useState, useCallback } from 'react';

export interface KeyboardState {
  isVisible: boolean;
  height: number;
  isOpening: boolean;
  isClosing: boolean;
}

export interface KeyboardAwareOptions {
  debounceMs?: number;
  threshold?: number; // Minimum height change to consider keyboard visible
}

export function useKeyboardAware(options: KeyboardAwareOptions = {}) {
  const { debounceMs = 100, threshold = 150 } = options;

  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
    isOpening: false,
    isClosing: false
  });

  const [initialViewportHeight, setInitialViewportHeight] = useState<number>(0);

  // Initialize viewport height
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setInitialViewportHeight(window.innerHeight);
    }
  }, []);

  const handleResize = useCallback(() => {
    if (typeof window === 'undefined' || !initialViewportHeight) return;

    const currentHeight = window.innerHeight;
    const heightDifference = initialViewportHeight - currentHeight;
    const isKeyboardVisible = heightDifference > threshold;
    const keyboardHeight = Math.max(0, heightDifference);

    setKeyboardState(prev => {
      const wasVisible = prev.isVisible;
      const isOpening = !wasVisible && isKeyboardVisible;
      const isClosing = wasVisible && !isKeyboardVisible;

      return {
        isVisible: isKeyboardVisible,
        height: keyboardHeight,
        isOpening,
        isClosing
      };
    });
  }, [initialViewportHeight, threshold]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: NodeJS.Timeout;

    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, debounceMs);
    };

    // Use both resize and visual viewport API if available
    if ('visualViewport' in window) {
      const visualViewport = window.visualViewport!;
      visualViewport.addEventListener('resize', debouncedResize);

      return () => {
        visualViewport.removeEventListener('resize', debouncedResize);
        clearTimeout(timeoutId);
      };
    } else {
      window.addEventListener('resize', debouncedResize);

      return () => {
        window.removeEventListener('resize', debouncedResize);
        clearTimeout(timeoutId);
      };
    }
  }, [handleResize, debounceMs]);

  // Reset opening/closing states after animation
  useEffect(() => {
    if (keyboardState.isOpening || keyboardState.isClosing) {
      const timeout = setTimeout(() => {
        setKeyboardState(prev => ({
          ...prev,
          isOpening: false,
          isClosing: false
        }));
      }, 300); // Animation duration

      return () => clearTimeout(timeout);
    }
  }, [keyboardState.isOpening, keyboardState.isClosing]);

  return keyboardState;
}

// Hook for managing input focus and keyboard behavior
export function useInputFocus() {
  const [isFocused, setIsFocused] = useState(false);
  const keyboardState = useKeyboardAware();

  const handleFocus = useCallback(() => {
    setIsFocused(true);

    // Prevent zoom on iOS
    if (typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      const viewport = document.querySelector('meta[name=viewport]') as HTMLMetaElement;
      if (viewport) {
        const originalContent = viewport.content;
        viewport.content = originalContent + ', user-scalable=no';

        // Restore after a delay
        setTimeout(() => {
          viewport.content = originalContent;
        }, 500);
      }
    }
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return {
    isFocused,
    keyboardState,
    onFocus: handleFocus,
    onBlur: handleBlur
  };
}

// Utility function to get safe area adjustments
export function getSafeAreaAdjustments() {
  if (typeof window === 'undefined') return { top: 0, bottom: 0 };

  const root = document.documentElement;
  const style = getComputedStyle(root);

  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0'),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0'),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0'),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0')
  };
}

// Custom hook for viewport-aware scrolling
export function useViewportAwareScroll(targetRef: React.RefObject<HTMLElement>) {
  const keyboardState = useKeyboardAware();

  const scrollIntoView = useCallback((options?: ScrollIntoViewOptions) => {
    if (!targetRef.current) return;

    const element = targetRef.current;
    const defaultOptions: ScrollIntoViewOptions = {
      behavior: 'smooth',
      block: 'nearest',
      inline: 'nearest'
    };

    // Adjust for keyboard if visible
    if (keyboardState.isVisible && keyboardState.height > 0) {
      const rect = element.getBoundingClientRect();
      const availableHeight = window.innerHeight - keyboardState.height;

      if (rect.bottom > availableHeight) {
        const offset = rect.bottom - availableHeight + 20; // 20px buffer
        window.scrollBy({
          top: offset,
          behavior: 'smooth'
        });
        return;
      }
    }

    element.scrollIntoView({ ...defaultOptions, ...options });
  }, [keyboardState, targetRef]);

  return { scrollIntoView, keyboardState };
}