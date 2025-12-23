'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Send, Mic, Heart, ChevronUp, ChevronDown } from 'lucide-react'

export interface ChatInputProps {
  onSendMessage: (message: string) => void
  isLoading?: boolean
  disabled?: boolean
  placeholder?: string
  maxLength?: number
  className?: string
  showVoiceInput?: boolean
  showEmoji?: boolean
  // Panel control props
  isPanelExpanded?: boolean
  onTogglePanel?: () => void
}

const ChatInput = React.forwardRef<HTMLDivElement, ChatInputProps>(
  ({ 
    onSendMessage,
    isLoading = false,
    disabled = false,
    placeholder = "궁금한 점을 편하게 물어보세요...",
    maxLength = 500,
    className,
    showVoiceInput = true,
    
    isPanelExpanded = false,
    onTogglePanel
  }, ref) => {
    const [message, setMessage] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const handleSend = () => {
      const trimmedMessage = message.trim()
      if (trimmedMessage && !isLoading && !disabled) {
        onSendMessage(trimmedMessage)
        setMessage('')
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
        }
      }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value
      if (value.length <= maxLength) {
        setMessage(value)
      }
      
      // Auto-resize textarea
      const textarea = e.target
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
    }

    const canSend = message.trim().length > 0 && !isLoading && !disabled

    return (
      <div
        ref={ref}
        className={cn(
          'sticky bottom-0 left-0 right-0 z-10',
          'bg-gradient-to-t from-white via-white/95 to-transparent',
          'backdrop-blur-md border-t border-neutral-200/50',
          'px-4 py-3 pb-safe',
          className
        )}
      >
        {/* Input Container */}
        <div
          className={cn(
            'relative flex items-end gap-2 p-3',
            'bg-gradient-to-br from-neutral-50 to-primary-50/30',
            'rounded-2xl border-2 transition-all duration-300',
            'shadow-lg shadow-primary-500/10',
            isFocused 
              ? 'border-primary-300 shadow-xl shadow-primary-500/20' 
              : 'border-neutral-300 hover:border-primary-200',
            disabled && 'opacity-60'
          )}
        >
          {/* Panel Toggle Chevron Button */}
          {onTogglePanel && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl touch-target',
                'bg-gradient-to-br from-primary-500 to-primary-400 hover:from-primary-600 hover:to-primary-500',
                'text-white shadow-md shadow-primary-500/20',
                'transform transition-all duration-200',
                'hover:scale-105 active:scale-95'
              )}
              onClick={onTogglePanel}
              disabled={disabled}
              aria-label={isPanelExpanded ? '패널 접기' : '패널 펼치기'}
            >
              {isPanelExpanded ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronUp className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Voice Input Button */}
          {showVoiceInput && !onTogglePanel && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                'flex-shrink-0 w-10 h-10 rounded-xl',
                'text-secondary-600 hover:text-secondary-700',
                'hover:bg-secondary-100 transition-colors'
              )}
              disabled={disabled}
              aria-label="음성 입력"
            >
              <Mic className="w-4 h-4" />
            </Button>
          )}

          {/* Text Input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'min-h-[2.5rem] max-h-[7.5rem] resize-none border-0',
                'bg-transparent focus:ring-0 focus:border-0',
                'text-neutral-800 placeholder:text-neutral-500',
                'text-base leading-relaxed py-2 px-0',
                'scrollbar-thin scrollbar-thumb-neutral-300'
              )}
              style={{ 
                lineHeight: '1.5',
                overflowY: message.split('\n').length > 3 ? 'scroll' : 'hidden'
              }}
            />
            
            {/* Character Count */}
            <div className="absolute bottom-0 right-0 text-xs text-neutral-400">
              {message.length}/{maxLength}
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="sm"
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-xl',
              'transition-all duration-200',
              canSend
                ? [
                    'bg-primary-gradient hover:shadow-lg hover:shadow-primary-500/30',
                    'hover:scale-105 active:scale-95 text-white'
                  ]
                : [
                    'bg-neutral-200 text-neutral-400 cursor-not-allowed',
                    'hover:bg-neutral-200 hover:scale-100'
                  ]
            )}
            aria-label="메시지 전송"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Quick Action Buttons (Optional) */}
        <div className="flex justify-center mt-3 gap-2">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'px-4 py-2 rounded-full text-xs',
              'bg-accent-light/30 text-accent-dark border border-accent-default/20',
              'hover:bg-accent-light/50 transition-colors'
            )}
            disabled={disabled}
            onClick={() => setMessage('임신 중 주의사항이 궁금해요')}
          >
            💡 임신 주의사항
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'px-4 py-2 rounded-full text-xs',
              'bg-info-light/30 text-info-dark border border-info-default/20',
              'hover:bg-info-light/50 transition-colors'
            )}
            disabled={disabled}
            onClick={() => setMessage('영양 관리 방법을 알려주세요')}
          >
            🥗 영양 관리
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'px-4 py-2 rounded-full text-xs',
              'bg-warning-light/30 text-warning-dark border border-warning-default/20',
              'hover:bg-warning-light/50 transition-colors'
            )}
            disabled={disabled}
            onClick={() => setMessage('운동은 어떻게 해야 할까요?')}
          >
            🏃‍♀️ 운동
          </Button>
        </div>

        {/* Disclaimer */}
        <div className="text-center mt-2">
          <p className="text-xs text-neutral-500 flex items-center justify-center gap-1">
            <Heart className="w-3 h-3 text-primary-500" />
            AI 상담은 참고용이며, 정확한 진단은 전문의와 상담하세요
          </p>
        </div>
      </div>
    )
  }
)

ChatInput.displayName = 'ChatInput'

export { ChatInput }