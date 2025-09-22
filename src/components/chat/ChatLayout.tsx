'use client';

import React, { useState, useEffect } from 'react';
import { ChatInterface } from './chat-interface';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { useTouchGestures } from '@/hooks/use-touch-gestures';

export interface ChatLayoutProps {
  children?: React.ReactNode;
  className?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  currentChatId?: string;
}

export function ChatLayout({
  children,
  className,
  onNewChat,
  onSelectChat,
  currentChatId
}: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOffset, setSidebarOffset] = useState(0);

  // Check if mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-close sidebar on mobile
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Touch gesture support for sidebar
  const mainContentRef = useTouchGestures({
    onSwipeRight: (distance, velocity) => {
      if (isMobile && !sidebarOpen && velocity > 0.5) {
        setSidebarOpen(true);
      }
    },
    onTouchMove: (x, y, deltaX, deltaY) => {
      if (isMobile && !sidebarOpen && deltaX > 0 && deltaX > Math.abs(deltaY)) {
        // Edge swipe detection - only trigger near the left edge
        if (x - deltaX < 20) {
          setSidebarOffset(Math.min(deltaX, 320));
        }
      }
    },
    onTouchEnd: () => {
      if (sidebarOffset > 100) {
        setSidebarOpen(true);
      }
      setSidebarOffset(0);
    }
  }, {
    threshold: 20,
    preventBehavior: false
  });

  const sidebarRef = useTouchGestures({
    onSwipeLeft: (distance, velocity) => {
      if (isMobile && sidebarOpen && velocity > 0.3) {
        setSidebarOpen(false);
      }
    }
  }, {
    threshold: 50,
    preventBehavior: false
  });

  return (
    <div
      className={cn('flex h-screen bg-neutral-50', className)}
      role="application"
      aria-label="부인과 AI 상담 애플리케이션"
    >
      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          'flex-shrink-0 transition-all duration-300 ease-in-out',
          'bg-white border-r border-neutral-200',
          sidebarOpen ? 'w-80' : 'w-0 overflow-hidden',
          'md:relative',
          isMobile && 'fixed inset-y-0 left-0 z-50 shadow-lg'
        )}
        style={{
          transform: isMobile && !sidebarOpen && sidebarOffset > 0
            ? `translateX(${-320 + sidebarOffset}px)`
            : isMobile && !sidebarOpen
            ? 'translateX(-100%)'
            : 'translateX(0)'
        }}
      >
        <Sidebar
          isOpen={sidebarOpen}
          onClose={closeSidebar}
          onNewChat={onNewChat}
          onSelectChat={onSelectChat}
          currentChatId={currentChatId}
          className="h-full w-80"
        />
      </div>

      {/* Main content area - VSTACK */}
      <div ref={mainContentRef} className="flex-1 flex flex-col min-w-0 h-full">
        {/* Toggle button for sidebar */}
        <div className="absolute top-4 left-4 z-30">
          <button
            onClick={toggleSidebar}
            className={cn(
              'touch-target rounded-lg text-neutral-600 hover:text-neutral-900',
              'hover:bg-white/80 backdrop-blur-sm transition-colors shadow-sm',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'flex items-center justify-center border border-neutral-200'
            )}
            aria-label={sidebarOpen ? '사이드바 숨기기' : '사이드바 보이기'}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Chat content - takes full remaining space */}
        <div className="flex-1 w-full h-full">
          {children || <ChatInterface />}
        </div>
      </div>
    </div>
  );
}