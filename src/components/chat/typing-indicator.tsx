'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export interface TypingIndicatorProps {
  message?: string
  avatar?: string
  username?: string
  className?: string
}

const TypingIndicator = React.forwardRef<HTMLDivElement, TypingIndicatorProps>(
  ({ 
    message = '답변을 준비하고 있어요...', 
    avatar,
    username = 'AI 산부인과 전문의',
    className 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex w-full mb-4 justify-start animate-fade-in',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label="AI가 응답을 작성 중입니다"
      >
        <div className="flex max-w-[85%] sm:max-w-[75%] md:max-w-[70%] items-end gap-2">
          {/* Avatar */}
          <div className="flex-shrink-0 mb-1">
            <Avatar className="w-8 h-8 sm:w-10 sm:h-10">
              <AvatarImage 
                src={avatar || '/ai-doctor-avatar.png'} 
                alt={username}
              />
              <AvatarFallback className="bg-secondary-gradient text-white text-xs sm:text-sm font-medium">
                AI
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Typing Container */}
          <div className="flex flex-col gap-1 items-start">
            {/* Username */}
            <span className="text-xs text-neutral-600 px-2">
              {username}
            </span>

            {/* Typing Bubble */}
            <div
              className={cn(
                'relative px-4 py-3 rounded-2xl rounded-bl-md',
                'bg-gradient-to-br from-[#f3eff7] to-[#e9dff0]',
                'text-[#704a85] border border-[#d6c2e0]/50',
                'shadow-md shadow-[#a67fb5]/10',
                'animate-gentle-pulse',
                'transition-all duration-300'
              )}
            >
              <div className="flex items-center space-x-3">
                {/* Animated Dots */}
                <div className="flex space-x-1" role="presentation">
                  <div 
                    className="w-2 h-2 bg-[#a67fb5] rounded-full animate-gentle-bounce"
                    style={{ animationDelay: '0s' }}
                  />
                  <div 
                    className="w-2 h-2 bg-[#a67fb5] rounded-full animate-gentle-bounce"
                    style={{ animationDelay: '0.1s' }}
                  />
                  <div 
                    className="w-2 h-2 bg-[#a67fb5] rounded-full animate-gentle-bounce"
                    style={{ animationDelay: '0.2s' }}
                  />
                </div>

                {/* Message Text */}
                <span className="text-sm text-[#8b5fa3] font-medium">
                  {message}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
)

TypingIndicator.displayName = 'TypingIndicator'

export { TypingIndicator }