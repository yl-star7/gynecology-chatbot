'use client'

import React, { useRef, useEffect, useState } from 'react'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'


import { SuggestionChips, SuggestionChip } from './suggestion-chips';

import { useGynecologyChat } from '@/hooks/use-gynecology-chat'
import { usePullToRefresh, PullToRefreshIndicator } from '@/hooks/use-pull-to-refresh'
import { useKeyboardAware, useViewportAwareScroll } from '@/hooks/use-keyboard-aware'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export interface ChatInterfaceProps {
  className?: string
  welcomeMessage?: string
  placeholder?: string
  chatId?: string
}

const ChatInterface = React.forwardRef<HTMLDivElement, ChatInterfaceProps>(
  ({
    className,
    welcomeMessage = "안녕하세요! 부인과 AI 상담사입니다. 궁금한 점을 편하게 물어보세요 💕",
    placeholder = "궁금한 점을 편하게 물어보세요...",
    chatId
  }, ref) => {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [attachedFiles, setAttachedFiles] = useState<File[]>([])

    // File attachment interface
    interface AttachedFile {
      file: File;
      preview?: string;
      type: 'image' | 'document';
    }

    // Welcome suggestions as proper SuggestionChip objects
    const welcomeSuggestions: SuggestionChip[] = [
      {
        id: '1',
        text: '임신 초기 증상',
        message: '임신 초기 증상은 어떤 것들이 있나요?',
        category: 'pregnancy' as const
      },
      {
        id: '2',
        text: '엽산 복용법',
        message: '엽산 복용 시기와 방법을 알려주세요',
        category: 'nutrition' as const
      },
      {
        id: '3',
        text: '금기 음식',
        message: '임신 중 먹으면 안 되는 음식이 있나요?',
        category: 'nutrition' as const
      },
      {
        id: '4',
        text: '입덧 완화법',
        message: '입덧을 완화하는 방법을 알려주세요',
        category: 'health' as const
      }
    ]
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // Use Vercel AI SDK hook
    const {
      messages,
      input,
      handleInputChange,
      handleSubmit,
      isLoading,
      error,
      suggestions,
      
      
      sendSuggestion
    } = useGynecologyChat({
      conversationId: chatId,
      context: {
        userType: 'expectant_mother',
        language: 'ko'
      }
    })

    // Pull to refresh functionality
    const handleRefresh = async () => {
      try {
        // Simulate loading chat history or refreshing conversation
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('대화가 새로고침되었습니다', {
          icon: '🔄',
          duration: 2000
        });
      } catch {
        toast.error('새로고침에 실패했습니다');
      }
    };

    const { containerRef, state: pullState, getTransform } = usePullToRefresh(
      handleRefresh,
      {
        threshold: 80,
        resistance: 0.6,
        maxDistance: 120
      }
    );

    // Keyboard awareness
    const keyboardState = useKeyboardAware();
    const { scrollIntoView } = useViewportAwareScroll(messagesEndRef);

    // Auto scroll to bottom with keyboard awareness
    const scrollToBottom = () => {
      scrollIntoView({
        behavior: 'smooth',
        block: 'end'
      });
    }

    useEffect(() => {
      scrollToBottom()
    }, [messages, isLoading, scrollToBottom])

    // Handle form submission
    const onSubmit = (e: React.FormEvent) => {
      e.preventDefault()
      if ((input.trim() || attachedFiles.length > 0) && !isLoading) {
        if (attachedFiles.length > 0) {
          // TODO: Handle file attachments in the message
          console.log('Submitting with attachments:', attachedFiles);
          toast.success(`${attachedFiles.length}개 파일과 함께 전송됨`);
          setAttachedFiles([]); // Clear attachments after sending
        }
        handleSubmit(e)
      }
    }

    // Handle suggestion click
    const onSuggestionClick = (suggestion: string) => {
      sendSuggestion(suggestion)
    }
    // Convert string suggestions to SuggestionChip objects
    const formatSuggestions = (stringArray: string[]): SuggestionChip[] => {
      return stringArray.map((text, index) => ({
        id: `suggestion-${index}`,
        text: text.length > 30 ? text.substring(0, 27) + '...' : text,
        message: text,
        category: 'general' as const
      }))
    }

    // Welcome message logic
    const shouldShowWelcome = messages.length === 0 && !isLoading
    

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col h-full w-full max-w-4xl mx-auto',
          'bg-chat-gradient relative transition-all duration-300',
          keyboardState.isVisible && 'pb-0', // Remove padding when keyboard is visible
          className
        )}
        style={{
          height: keyboardState.isVisible && typeof window !== 'undefined'
            ? `${window.innerHeight - keyboardState.height}px`
            : '100%'
        }}
      >
        {/* Pull to Refresh Indicator */}
        <PullToRefreshIndicator
          state={pullState}
          threshold={80}
          className="safe-top"
        />

        {/* Messages Container */}
        <div
          ref={(node) => {
            if (chatContainerRef.current !== node) {
              chatContainerRef.current = node;
            }
            if (containerRef.current !== node) {
              (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
            }
          }}
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden',
            'px-4 py-6 pb-32', // Extra padding for input
            'scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent',
            'scroll-smooth'
          )}
          style={pullState.isPulling ? getTransform() : undefined}
          role="log"
          aria-live="polite"
          aria-label="채팅 메시지"
        >
          {/* Welcome message and suggestions */}
          {shouldShowWelcome && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-20 h-20 mb-6 bg-primary-gradient rounded-full flex items-center justify-center shadow-lg">
                <span className="text-3xl">👩‍⚕️</span>
              </div>
              <h3 className="text-xl font-semibold text-neutral-800 mb-2">
                부인과 AI 상담사입니다
              </h3>
              <p className="text-neutral-600 mb-6 max-w-md leading-relaxed">
                {welcomeMessage}
              </p>

              {/* Suggestion chips for first-time users */}
              <SuggestionChips
                suggestions={welcomeSuggestions}
                onSuggestionClick={onSuggestionClick}
                className="max-w-2xl"
              />
            </div>
          )}

          {/* Messages */}
          {messages.map((message: { id: string; content: string; role: string }) => (
            <MessageBubble
              key={message.id}
              message={message.content}
              isUser={message.role === 'user'}
              timestamp={new Date()} // AI SDK doesn't provide timestamps
              messageType={message.role === 'user' ? 'text' : 'medical-info'}
            />
          ))}

          {/* Show suggestions after AI response */}
          {suggestions.length > 0 && !isLoading && (
            <div className="mb-4">
              <SuggestionChips
                suggestions={formatSuggestions(suggestions)}
                onSuggestionClick={onSuggestionClick}
                              />
            </div>
          )}

          {/* Typing Indicator */}
          {isLoading && (
            <TypingIndicator />
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input - Using Vercel AI SDK */}
        <div
          className={cn(
            'absolute bottom-0 left-0 right-0 z-10',
            'bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-md',
            'border-t border-neutral-200/50 px-4 py-3',
            keyboardState.isVisible ? 'pb-2' : 'pb-safe'
          )}
          style={{
            transform: keyboardState.isVisible && keyboardState.height > 0
              ? `translateY(-${Math.max(0, keyboardState.height - 20)}px)`
              : 'translateY(0)',
            transition: 'transform 0.3s ease-out'
          }}
        >
          <div className="bg-gradient-to-br from-neutral-50 to-primary-50/30 rounded-2xl border-2 border-neutral-300 hover:border-primary-200 transition-all duration-300 shadow-lg shadow-primary-500/10">
            {/* File preview area */}
            {attachedFiles.length > 0 && (
              <div className="p-3 pb-0">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="relative bg-white border border-neutral-200 rounded-lg p-2 flex items-center gap-2 shadow-sm"
                    >
                      {/* File icon or image preview */}
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-8 h-8 object-cover rounded"
                          onLoad={(e) => {
                            // Clean up object URL after loading
                            URL.revokeObjectURL((e.target as HTMLImageElement).src);
                          }}
                        />
                      ) : (
                        <div className="w-8 h-8 bg-neutral-100 rounded flex items-center justify-center">
                          <svg className="w-4 h-4 text-neutral-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                        </div>
                      )}

                      {/* File name */}
                      <span className="text-xs text-neutral-600 max-w-20 truncate">
                        {file.name}
                      </span>

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedFiles(prev => prev.filter((_, i) => i !== index));
                          toast.success('파일이 제거되었습니다');
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        aria-label="파일 제거"
                      >
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="relative flex items-end gap-2 p-3">
              {/* Attachment button */}
              <div className="flex-shrink-0">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*,.pdf,.doc,.docx"
                  multiple
                  className="hidden"
                  onChange={async (e) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      const newFiles = Array.from(files);
                      setAttachedFiles(prev => [...prev, ...newFiles]);

                      newFiles.forEach(file => {
                        toast.success(`${file.name} 첨부됨`);
                      });
                    }
                    // Reset input
                    e.target.value = '';
                  }}
                />
                <label
                  htmlFor="file-upload"
                  className={cn(
                    'cursor-pointer touch-target rounded-xl transition-all duration-200',
                    'flex items-center justify-center',
                    'bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-700',
                    'hover:scale-105 active:scale-95'
                  )}
                  aria-label="파일 첨부"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </label>
              </div>

              <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={isLoading}
                rows={1}
                className={cn(
                  'w-full min-h-[2.5rem] max-h-[7.5rem] resize-none border-0',
                  'bg-transparent focus:ring-0 focus:border-0 focus:outline-none',
                  'text-neutral-800 placeholder:text-neutral-500',
                  'text-base leading-relaxed py-2 px-0',
                  'scrollbar-thin scrollbar-thumb-neutral-300'
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    onSubmit(e as React.FormEvent)
                  }
                }}
                style={{
                  height: 'auto',
                  minHeight: '40px',
                  maxHeight: '120px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement
                  target.style.height = 'auto'
                  target.style.height = Math.min(target.scrollHeight, 120) + 'px'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={(!input.trim() && attachedFiles.length === 0) || isLoading}
              className={cn(
                'flex-shrink-0 touch-target rounded-xl transition-all duration-200',
                'flex items-center justify-center btn-submit',
                (input.trim() || attachedFiles.length > 0) && !isLoading
                  ? 'bg-primary-gradient hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105 active:scale-95 text-white'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed hover:bg-neutral-200 hover:scale-100'
              )}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
            </form>
          </div>

          {/* Disclaimer */}
          <div className="text-center mt-2">
            <p className="text-xs text-neutral-500 flex items-center justify-center gap-1">
              <svg className="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              AI 상담은 참고용이며, 정확한 진단은 전문의와 상담하세요
            </p>
          </div>
        </div>

        {/* Scroll to Bottom Button */}
        {messages.length > 5 && (
          <button
            onClick={scrollToBottom}
            className={cn(
              'fixed bottom-36 right-6 z-30',
              'touch-target-lg bg-primary-gradient text-white rounded-full',
              'shadow-lg hover:shadow-xl transition-all duration-200',
              'flex items-center justify-center',
              'hover:scale-105 active:scale-95'
            )}
            aria-label="맨 아래로 스크롤"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        )}

        {/* Error handling */}
        {error && (
          <div className="fixed bottom-32 left-4 right-4 z-30 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-lg">
            <p className="text-sm">
              오류가 발생했습니다: {error.message || '다시 시도해주세요.'}
            </p>
          </div>
        )}
      </div>
    )
  }
)

ChatInterface.displayName = 'ChatInterface'

export { ChatInterface }