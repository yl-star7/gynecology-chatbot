'use client';

import React, { useRef, useEffect, useCallback } from 'react';

export interface TouchGestureOptions {
  threshold?: number; // Minimum distance for gesture recognition
  maxDuration?: number; // Maximum time for gesture
  preventBehavior?: boolean; // Prevent default touch behavior
}

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  duration: number;
  velocity: number;
}

export interface TouchGestureCallbacks {
  onSwipe?: (gesture: SwipeDirection) => void;
  onSwipeLeft?: (distance: number, velocity: number) => void;
  onSwipeRight?: (distance: number, velocity: number) => void;
  onSwipeUp?: (distance: number, velocity: number) => void;
  onSwipeDown?: (distance: number, velocity: number) => void;
  onTouchStart?: (x: number, y: number) => void;
  onTouchMove?: (x: number, y: number, deltaX: number, deltaY: number) => void;
  onTouchEnd?: () => void;
}

export function useTouchGestures(
  callbacks: TouchGestureCallbacks = {},
  options: TouchGestureOptions = {}
) {
  const {
    threshold = 50,
    maxDuration = 500,
    preventBehavior = true
  } = options;

  const touchRef = useRef<HTMLElement>(null);
  const touchData = useRef({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventBehavior) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    if (!touch) return;

    touchData.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      isTracking: true
    };

    callbacks.onTouchStart?.(touch.clientX, touch.clientY);
  }, [callbacks, preventBehavior]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchData.current.isTracking) return;

    const touch = e.touches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchData.current.startX;
    const deltaY = touch.clientY - touchData.current.startY;

    callbacks.onTouchMove?.(touch.clientX, touch.clientY, deltaX, deltaY);
  }, [callbacks]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchData.current.isTracking) return;

    const touch = e.changedTouches[0];
    if (!touch) return;

    const endTime = Date.now();
    const duration = endTime - touchData.current.startTime;

    // Only process if within max duration
    if (duration > maxDuration) {
      touchData.current.isTracking = false;
      callbacks.onTouchEnd?.();
      return;
    }

    const deltaX = touch.clientX - touchData.current.startX;
    const deltaY = touch.clientY - touchData.current.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Calculate distance and velocity
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / duration;

    // Check if gesture exceeds threshold
    if (distance >= threshold) {
      let direction: SwipeDirection['direction'];

      // Determine primary direction
      if (absX > absY) {
        direction = deltaX > 0 ? 'right' : 'left';
      } else {
        direction = deltaY > 0 ? 'down' : 'up';
      }

      const gesture: SwipeDirection = {
        direction,
        distance,
        duration,
        velocity
      };

      // Call appropriate callbacks
      callbacks.onSwipe?.(gesture);

      switch (direction) {
        case 'left':
          callbacks.onSwipeLeft?.(distance, velocity);
          break;
        case 'right':
          callbacks.onSwipeRight?.(distance, velocity);
          break;
        case 'up':
          callbacks.onSwipeUp?.(distance, velocity);
          break;
        case 'down':
          callbacks.onSwipeDown?.(distance, velocity);
          break;
      }
    }

    touchData.current.isTracking = false;
    callbacks.onTouchEnd?.();
  }, [callbacks, threshold, maxDuration]);

  // Attach event listeners
  useEffect(() => {
    const element = touchRef.current;
    if (!element) return;

    const options = { passive: !preventBehavior };

    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    element.addEventListener('touchcancel', handleTouchEnd, options);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, preventBehavior]);

  return touchRef;
}

// Hook for swipe-to-dismiss/action on individual elements
export function useSwipeAction(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold = 100
) {
  const elementRef = useRef<HTMLElement>(null);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [translateX, setTranslateX] = React.useState(0);

  const touchRef = useTouchGestures({
    onTouchMove: (x, y, deltaX) => {
      if (!isAnimating && Math.abs(deltaX) > 10) {
        setTranslateX(deltaX * 0.5); // Damping effect
      }
    },
    onTouchEnd: () => {
      setIsAnimating(true);

      if (Math.abs(translateX) > threshold) {
        if (translateX > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
      }

      // Reset position
      setTranslateX(0);
      setTimeout(() => setIsAnimating(false), 300);
    }
  }, { threshold: threshold / 2 });

  // Apply transform style
  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.style.transform = `translateX(${translateX}px)`;
      elementRef.current.style.transition = isAnimating ? 'transform 0.3s ease-out' : 'none';
    }
  }, [translateX, isAnimating]);

  // Merge refs
  const mergeRefs = useCallback((node: HTMLElement | null) => {
    elementRef.current = node;
    if (typeof touchRef === 'function') {
      touchRef(node);
    } else if (touchRef) {
      (touchRef as React.MutableRefObject<Node | null>).current = node;
    }
  }, [touchRef]);

  return mergeRefs;
}