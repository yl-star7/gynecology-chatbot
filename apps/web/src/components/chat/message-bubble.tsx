'use client'

import React, { useState, useCallback } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useSwipeAction } from '@/hooks/use-touch-gestures'
import {
  MessageSwipeActions,
  getUserMessageActions,
  getAIMessageActions
} from './message-swipe-actions'
import toast from 'react-hot-toast'

export interface MessageBubbleProps {
  message: string
  isUser: boolean
  timestamp?: Date
  isLoading?: boolean
  avatar?: string
  username?: string
  messageType?: 'text' | 'medical-info' | 'warning' | 'success'
  className?: string
  onCopy?: (message: string) => void
  onDelete?: () => void
  onQuote?: (message: string) => void
  onLike?: () => void
  onShare?: (message: string) => void
}

const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  ({
    message,
    isUser,
    timestamp,
    isLoading,
    avatar,
    username = isUser ? '회원님' : 'AI 산부인과 전문의',
    messageType = 'text',
    className,
    onCopy,
    onDelete,
    onQuote,
    onLike,
    onShare
  }, ref) => {
    const [showActions, setShowActions] = useState(false);

    // Default action handlers
    const handleCopy = useCallback(() => {
      if (onCopy) {
        onCopy(message);
      } else {
        navigator.clipboard.writeText(message);
        toast.success('메시지가 복사되었습니다', {
          icon: '📋',
          duration: 2000
        });
      }
      setShowActions(false);
    }, [message, onCopy]);

    const handleDelete = useCallback(() => {
      if (onDelete) {
        onDelete();
      } else {
        toast.success('메시지가 삭제되었습니다', {
          icon: '🗑️',
          duration: 2000
        });
      }
      setShowActions(false);
    }, [onDelete]);

    const handleQuote = useCallback(() => {
      if (onQuote) {
        onQuote(message);
      } else {
        toast.success('메시지가 인용되었습니다', {
          icon: '💬',
          duration: 2000
        });
      }
      setShowActions(false);
    }, [message, onQuote]);

    const handleLike = useCallback(() => {
      if (onLike) {
        onLike();
      } else {
        toast.success('도움이 되었다고 표시했습니다', {
          icon: '❤️',
          duration: 2000
        });
      }
      setShowActions(false);
    }, [onLike]);

    const handleShare = useCallback(() => {
      if (onShare) {
        onShare(message);
      } else if (navigator.share) {
        navigator.share({
          title: '부인과 AI 상담 내용',
          text: message
        });
      } else {
        handleCopy();
      }
      setShowActions(false);
    }, [message, onShare, handleCopy]);

    // Swipe action for message bubble
    const swipeRef = useSwipeAction(
      isUser ? handleDelete : undefined, // Left swipe
      isUser ? undefined : handleCopy,   // Right swipe
      100 // threshold
    );

    // Get appropriate actions based on message type
    const actions = isUser
      ? getUserMessageActions(handleCopy, handleDelete, handleQuote)
      : getAIMessageActions(handleCopy, handleLike, handleShare, handleQuote);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }

    const getMessageTypeStyles = () => {
      switch (messageType) {
        case 'medical-info':
          return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200/50 text-blue-900'
        case 'warning':
          return 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50 text-amber-900'
        case 'success':
          return 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200/50 text-emerald-900'
        default:
          return ''
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full mb-4 relative',
          isUser ? 'justify-end' : 'justify-start',
          className
        )}
        role="article"
        aria-label={`${isUser ? '사용자' : 'AI'} 메시지: ${message}`}
        onDoubleClick={() => setShowActions(!showActions)}
        onClick={() => showActions && setShowActions(false)}
      >
        <div
          ref={swipeRef}
          className={cn(
            'flex max-w-[85%] sm:max-w-[75%] md:max-w-[70%] relative',
            isUser ? 'flex-row-reverse' : 'flex-row',
            'items-end gap-2'
          )}
        >
          {/* Avatar */}
          <div className="flex-shrink-0 mb-1">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              <AvatarImage 
                src={avatar || (isUser ? undefined : '/ai-doctor-avatar.png')} 
                alt={username}
              />
              <AvatarFallback 
                className={cn(
                  'text-xs sm:text-sm font-medium',
                  isUser 
                    ? 'bg-primary-gradient text-white' 
                    : 'bg-secondary-gradient text-white'
                )}
              >
                {isUser ? '회' : 'AI'}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Message Container */}
          <div
            className={cn(
              'flex flex-col gap-1',
              isUser ? 'items-end' : 'items-start'
            )}
          >
            {/* Username - only show for AI or when specified */}
            {(!isUser || username !== '회원님') && (
              <span className="text-xs text-neutral-600 px-2">
                {username}
              </span>
            )}

            {/* Message Bubble */}
            <div
              className={cn(
                'relative px-4 py-3 rounded-2xl shadow-lg transition-all duration-300',
                'backdrop-blur-sm border border-opacity-20',
                // User message styling
                isUser && [
                  'bg-primary-gradient text-white',
                  'rounded-br-md shadow-[#f28b5c]/30',
                  'animate-slide-in-right'
                ],
                // AI message styling
                !isUser && [
                  'bg-gradient-to-br from-[#faf8ff] to-[#f3eff7]',
                  'text-[#573a69] border-[#e9dff0]/50',
                  'rounded-bl-md shadow-[#a67fb5]/20',
                  'animate-slide-in-left'
                ],
                // Message type overrides for AI messages
                !isUser && messageType !== 'text' && getMessageTypeStyles(),
                // Loading state
                isLoading && 'animate-gentle-pulse',
                // Hover effects
                'hover:scale-[1.02] hover:shadow-xl'
              )}
            >
              {/* Message Content */}
              <div 
                className={cn(
                  'text-sm sm:text-base leading-relaxed',
                  'whitespace-pre-wrap break-words'
                )}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-current rounded-full animate-gentle-bounce opacity-60" />
                      <div className="w-2 h-2 bg-current rounded-full animate-gentle-bounce opacity-60" 
                           style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-current rounded-full animate-gentle-bounce opacity-60" 
                           style={{ animationDelay: '0.2s' }} />
                    </div>
                    <span className="text-xs opacity-80">답변을 준비하고 있어요...</span>
                  </div>
                ) : (
                  message
                )}
              </div>

              {/* Message Type Badge */}
              {!isUser && messageType !== 'text' && (
                <div className="mt-2">
                  <Badge 
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      messageType === 'medical-info' && 'bg-blue-100 text-blue-700',
                      messageType === 'warning' && 'bg-amber-100 text-amber-700',
                      messageType === 'success' && 'bg-emerald-100 text-emerald-700'
                    )}
                  >
                    {messageType === 'medical-info' && '📋 의료정보'}
                    {messageType === 'warning' && '⚠️ 주의사항'}
                    {messageType === 'success' && '✅ 권장사항'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Timestamp */}
            {timestamp && (
              <span 
                className={cn(
                  'text-xs text-neutral-500 px-2',
                  isUser ? 'text-right' : 'text-left'
                )}
                aria-label={`전송 시간: ${formatTime(timestamp)}`}
              >
                {formatTime(timestamp)}
              </span>
            )}
          </div>

          {/* Swipe Actions */}
          <MessageSwipeActions
            actions={actions}
            isVisible={showActions}
            isUser={isUser}
            className="absolute top-0 bottom-0"
          />
        </div>
      </div>
    )
  }
)

MessageBubble.displayName = 'MessageBubble'

export { MessageBubble }