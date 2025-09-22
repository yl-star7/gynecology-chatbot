'use client';

import React, { forwardRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { MessageBubble } from './message-bubble';
import { TypingIndicator } from './typing-indicator';
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh';
import type { Message } from '@/types/chat';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onRefresh?: () => Promise<void>;
  onRetry?: (messageId: string) => void;
  className?: string;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  ({ messages, isLoading, onRefresh, onRetry, className }, ref) => {
    const {
      pullToRefreshProps,
      state: refreshState,
    } = usePullToRefresh({
      onRefresh: onRefresh || (() => Promise.resolve()),
      threshold: 80,
      disabled: !onRefresh,
    });

    const isEmpty = messages.length === 0;
    const shouldShowWelcome = isEmpty && !isLoading;

    const WelcomeMessage = () => (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
          <span className="text-2xl">🤱</span>
        </div>
        <h3 className="text-xl font-semibold text-neutral-800 mb-3">
          부인과 전문의와 상담을 시작해보세요
        </h3>
        <p className="text-neutral-600 leading-relaxed max-w-sm">
          임신, 출산, 여성 건강에 대한 궁금증을 언제든지 편하게 물어보세요.
          안전하고 정확한 의료 정보를 제공해드립니다.
        </p>
      </div>
    );

    return (
      <div
        ref={ref}
        className={`flex-1 overflow-y-auto ${className || ''}`}
        {...pullToRefreshProps}
      >
        {/* 풀 투 리프레시 인디케이터 */}
        {refreshState.isPulling && (
          <div
            className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-gradient-to-b from-primary-50 to-transparent backdrop-blur-sm transition-all duration-300"
            style={{
              height: Math.max(refreshState.pullDistance, 0),
              opacity: refreshState.isPulling || refreshState.isRefreshing ? 1 : 0
            }}
          >
            <div className="flex items-center gap-2 text-primary-600 font-medium">
              {refreshState.isRefreshing ? (
                <>
                  <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">새로고침 중...</span>
                </>
              ) : refreshState.canRefresh ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-bounce" />
                  <span className="text-sm">놓으면 새로고침</span>
                </>
              ) : (
                <>
                  <RefreshCw
                    className="w-5 h-5 transition-transform duration-200"
                    style={{ transform: `rotate(${Math.min(refreshState.pullDistance / 80, 1) * 180}deg)` }}
                  />
                  <span className="text-sm">당겨서 새로고침</span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          {shouldShowWelcome ? (
            <WelcomeMessage />
          ) : (
            <>
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id || index}
                  message={message}
                  onRetry={onRetry}
                  className="animate-slide-up-fade"
                />
              ))}

              {isLoading && <TypingIndicator />}
            </>
          )}
        </div>

        {/* 스크롤 끝 마커 */}
        <div className="h-4" />
      </div>
    );
  }
);

MessageList.displayName = 'MessageList';