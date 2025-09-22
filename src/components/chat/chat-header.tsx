'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Menu, MoreVertical, Phone, Video, Info } from 'lucide-react'

export interface ChatHeaderProps {
  title?: string
  subtitle?: string
  avatar?: string
  onlineStatus?: 'online' | 'offline' | 'away'
  isTyping?: boolean
  onMenuClick?: () => void
  onCallClick?: () => void
  onVideoClick?: () => void
  onInfoClick?: () => void
  className?: string
}

const ChatHeader = React.forwardRef<HTMLDivElement, ChatHeaderProps>(
  ({
    title = 'AI 산부인과 전문의',
    subtitle = '24시간 상담 가능',
    avatar,
    onlineStatus = 'online',
    isTyping = false,
    onMenuClick,
    onCallClick,
    onVideoClick,
    onInfoClick,
    className
  }, ref) => {

    const getStatusColor = () => {
      switch (onlineStatus) {
        case 'online':
          return 'bg-success-DEFAULT'
        case 'away':
          return 'bg-warning-DEFAULT'
        default:
          return 'bg-neutral-400'
      }
    }

    const getStatusText = () => {
      switch (onlineStatus) {
        case 'online':
          return '온라인'
        case 'away':
          return '자리비움'
        default:
          return '오프라인'
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between',
          'bg-gradient-to-r from-primary-50 to-secondary-50',
          'border-b border-primary-200/50 px-4 py-3',
          'sticky top-0 z-30 backdrop-blur-md',
          'shadow-sm',
          className
        )}
      >
        {/* Left Side - Menu and User Info */}
        <div className="flex items-center gap-3">
          {/* Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="p-2 text-primary-600 hover:bg-primary-100"
            aria-label="메뉴 열기"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Avatar and Status */}
          <div className="relative">
            <Avatar className="w-10 h-10">
              <AvatarImage 
                src={avatar || '/ai-doctor-avatar.png'} 
                alt={title}
              />
              <AvatarFallback className="bg-secondary-gradient text-white font-medium">
                AI
              </AvatarFallback>
            </Avatar>
            
            {/* Online Status Indicator */}
            <div 
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white',
                getStatusColor()
              )}
              aria-label={`상태: ${getStatusText()}`}
            />
          </div>

          {/* Title and Subtitle */}
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-neutral-900 leading-tight">
              {title}
            </h2>
            <div className="flex items-center gap-2">
              {isTyping ? (
                <div className="flex items-center gap-2">
                  <div className="flex space-x-0.5">
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-gentle-bounce" />
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-gentle-bounce" 
                         style={{ animationDelay: '0.1s' }} />
                    <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-gentle-bounce" 
                         style={{ animationDelay: '0.2s' }} />
                  </div>
                  <span className="text-xs text-primary-600 font-medium">
                    답변 작성 중...
                  </span>
                </div>
              ) : (
                <>
                  <span className="text-xs text-neutral-600">
                    {subtitle}
                  </span>
                  <Badge 
                    variant={onlineStatus === 'online' ? 'success' : 'secondary'}
                    className="text-xs px-2 py-0.5"
                  >
                    {getStatusText()}
                  </Badge>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Call Button */}
          {onCallClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCallClick}
              className="p-2 text-primary-600 hover:bg-primary-100"
              aria-label="음성 통화"
            >
              <Phone className="w-4 h-4" />
            </Button>
          )}

          {/* Video Call Button */}
          {onVideoClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onVideoClick}
              className="p-2 text-primary-600 hover:bg-primary-100"
              aria-label="화상 통화"
            >
              <Video className="w-4 h-4" />
            </Button>
          )}

          {/* Info Button */}
          {onInfoClick && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onInfoClick}
              className="p-2 text-primary-600 hover:bg-primary-100"
              aria-label="정보"
            >
              <Info className="w-4 h-4" />
            </Button>
          )}

          {/* More Options */}
          <Button
            variant="ghost"
            size="sm"
            className="p-2 text-primary-600 hover:bg-primary-100"
            aria-label="더보기"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }
)

ChatHeader.displayName = 'ChatHeader'

export { ChatHeader }