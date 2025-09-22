'use client';

import { useRef, useEffect, useState, useCallback } from 'react';

export interface PullToRefreshOptions {
  threshold?: number; // Minimum distance to trigger refresh
  resistance?: number; // Pull resistance factor (0-1)
  maxDistance?: number; // Maximum pull distance
  snapBackDuration?: number; // Animation duration for snap back
  refreshingDuration?: number; // Minimum time to show refreshing state
}

export interface PullToRefreshState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  canRefresh: boolean;
}

export function usePullToRefresh(
  onRefresh: () => Promise<void> | void,
  options: PullToRefreshOptions = {}
) {
  const {
    threshold = 80,
    resistance = 0.5,
    maxDistance = 120,
    snapBackDuration = 300,
    refreshingDuration = 1000
  } = options;

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false
  });

  const containerRef = useRef<HTMLElement>(null);
  const touchData = useRef({
    startY: 0,
    startScrollTop: 0,
    isTracking: false
  });

  const updatePullDistance = useCallback((distance: number) => {
    const adjustedDistance = Math.min(distance * resistance, maxDistance);
    const canRefresh = adjustedDistance >= threshold;

    setState(prev => ({
      ...prev,
      pullDistance: adjustedDistance,
      canRefresh,
      isPulling: adjustedDistance > 0
    }));

    return { adjustedDistance, canRefresh };
  }, [resistance, maxDistance, threshold]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const container = containerRef.current;
    if (!container || state.isRefreshing) return;

    // Only start tracking if at the top of the scrollable area
    if (container.scrollTop <= 0) {
      const touch = e.touches[0];
      touchData.current = {
        startY: touch.clientY,
        startScrollTop: container.scrollTop,
        isTracking: true
      };
    }
  }, [state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchData.current.isTracking || state.isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - touchData.current.startY;

    // Only pull down when at the top
    if (deltaY > 0 && container.scrollTop <= 0) {
      e.preventDefault(); // Prevent overscroll
      updatePullDistance(deltaY);
    } else if (deltaY <= 0) {
      // Reset if pulling up
      updatePullDistance(0);
    }
  }, [state.isRefreshing, updatePullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!touchData.current.isTracking) return;

    touchData.current.isTracking = false;

    if (state.canRefresh && !state.isRefreshing) {
      // Trigger refresh
      setState(prev => ({
        ...prev,
        isRefreshing: true,
        isPulling: false,
        pullDistance: threshold
      }));

      try {
        const refreshPromise = onRefresh();
        const minDurationPromise = new Promise(resolve =>
          setTimeout(resolve, refreshingDuration)
        );

        await Promise.all([
          refreshPromise,
          minDurationPromise
        ]);
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        // Animate back to 0
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false,
          isPulling: false
        }));
      }
    } else {
      // Snap back to 0
      setState(prev => ({
        ...prev,
        pullDistance: 0,
        canRefresh: false,
        isPulling: false
      }));
    }
  }, [state.canRefresh, state.isRefreshing, threshold, onRefresh, refreshingDuration]);

  // Attach event listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options = { passive: false };

    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd, options);
    container.addEventListener('touchcancel', handleTouchEnd, options);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    state,
    // Helper to get transform style for pull indicator
    getTransform: () => ({
      transform: `translateY(${state.pullDistance}px)`,
      transition: state.isPulling ? 'none' : `transform ${snapBackDuration}ms ease-out`
    })
  };
}

// Pull to refresh indicator component props
export interface PullToRefreshIndicatorProps {
  state: PullToRefreshState;
  threshold: number;
  className?: string;
}

export function PullToRefreshIndicator({
  state,
  threshold,
  className
}: PullToRefreshIndicatorProps) {
  const progress = Math.min(state.pullDistance / threshold, 1);
  const isReady = state.canRefresh;
  const isRefreshing = state.isRefreshing;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center
        bg-gradient-to-b from-primary-50 to-transparent backdrop-blur-sm
        transition-all duration-300 ${className}`}
      style={{
        height: Math.max(state.pullDistance, 0),
        opacity: state.isPulling || state.isRefreshing ? 1 : 0
      }}
    >
      <div className="flex items-center gap-2 text-primary-600 font-medium">
        {isRefreshing ? (
          <>
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">새로고침 중...</span>
          </>
        ) : isReady ? (
          <>
            <svg className="w-5 h-5 animate-bounce" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">놓으면 새로고침</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 transition-transform duration-200"
              style={{ transform: `rotate(${progress * 180}deg)` }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">당겨서 새로고침</span>
          </>
        )}
      </div>
    </div>
  );
}