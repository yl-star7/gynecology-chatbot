'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Copy, Reply, Trash2, Heart, Share } from 'lucide-react';

export interface SwipeAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  color: 'primary' | 'secondary' | 'danger' | 'success';
  onPress: () => void;
}

export interface MessageSwipeActionsProps {
  actions: SwipeAction[];
  isVisible: boolean;
  isUser: boolean;
  className?: string;
}

export function MessageSwipeActions({
  actions,
  isVisible,
  isUser,
  className
}: MessageSwipeActionsProps) {
  const getActionColor = (color: SwipeAction['color']) => {
    switch (color) {
      case 'primary':
        return 'bg-primary-500 hover:bg-primary-600 text-white';
      case 'secondary':
        return 'bg-secondary-400 hover:bg-secondary-500 text-white';
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white';
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white';
      default:
        return 'bg-neutral-500 hover:bg-neutral-600 text-white';
    }
  };

  return (
    <div
      className={cn(
        'absolute inset-y-0 flex items-center z-10',
        'transition-all duration-300 ease-out',
        isUser ? 'left-0' : 'right-0',
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none',
        className
      )}
    >
      <div
        className={cn(
          'flex gap-2 p-2',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            onClick={(e) => {
              e.stopPropagation();
              action.onPress();
            }}
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-full',
              'shadow-lg transform transition-all duration-200',
              'hover:scale-110 active:scale-95',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              getActionColor(action.color),
              'animate-slide-in-up'
            )}
            style={{
              animationDelay: `${index * 50}ms`
            }}
            aria-label={action.label}
            title={action.label}
          >
            {action.icon}
          </button>
        ))}
      </div>
    </div>
  );
}

// Predefined action sets
export const getUserMessageActions = (
  onCopy: () => void,
  onDelete: () => void,
  onQuote: () => void
): SwipeAction[] => [
  {
    id: 'copy',
    icon: <Copy className="w-5 h-5" />,
    label: '복사',
    color: 'secondary',
    onPress: onCopy
  },
  {
    id: 'quote',
    icon: <Reply className="w-5 h-5" />,
    label: '인용',
    color: 'primary',
    onPress: onQuote
  },
  {
    id: 'delete',
    icon: <Trash2 className="w-5 h-5" />,
    label: '삭제',
    color: 'danger',
    onPress: onDelete
  }
];

export const getAIMessageActions = (
  onCopy: () => void,
  onLike: () => void,
  onShare: () => void,
  onQuote: () => void
): SwipeAction[] => [
  {
    id: 'copy',
    icon: <Copy className="w-5 h-5" />,
    label: '복사',
    color: 'secondary',
    onPress: onCopy
  },
  {
    id: 'like',
    icon: <Heart className="w-5 h-5" />,
    label: '도움됨',
    color: 'success',
    onPress: onLike
  },
  {
    id: 'quote',
    icon: <Reply className="w-5 h-5" />,
    label: '인용',
    color: 'primary',
    onPress: onQuote
  },
  {
    id: 'share',
    icon: <Share className="w-5 h-5" />,
    label: '공유',
    color: 'secondary',
    onPress: onShare
  }
];