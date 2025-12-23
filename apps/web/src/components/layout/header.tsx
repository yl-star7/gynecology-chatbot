'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Menu, Bell, Settings } from 'lucide-react'

export interface HeaderProps {
  title?: string
  subtitle?: string
  avatar?: string
  userName?: string
  notifications?: number
  onMenuClick?: () => void
  onProfileClick?: () => void
  onNotificationClick?: () => void
  onSettingsClick?: () => void
  className?: string
  variant?: 'default' | 'minimal' | 'chat'
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  ({
    title = '부인과 AI 상담',
    subtitle = '전문적이고 따뜻한 건강 상담',
    avatar,
    userName = '회원님',
    notifications = 0,
    onMenuClick,
    onProfileClick,
    onNotificationClick,
    onSettingsClick,
    className,
    variant = 'default'
  }, ref) => {

    const getVariantStyles = () => {
      switch (variant) {
        case 'minimal':
          return 'bg-transparent border-0 shadow-none backdrop-blur-none'
        case 'chat':
          return 'bg-gradient-to-r from-primary-50 to-secondary-50 border-b border-primary-200/50'
        default:
          return 'bg-white/80 backdrop-blur-md border-b border-neutral-200/50 shadow-sm'
      }
    }

    return (
      <header
        ref={ref}
        className={cn(
          'sticky top-0 z-30 px-4 py-3 pt-safe transition-all duration-200',
          getVariantStyles(),
          className
        )}
      >
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          {/* Left Side */}
          <div className="flex items-center gap-3">
            {/* Menu Button */}
            {onMenuClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onMenuClick}
                className="p-2 text-primary-600 hover:bg-primary-100 lg:hidden"
                aria-label="메뉴 열기"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}

            {/* Logo/Icon */}
            <div className="w-10 h-10 rounded-full bg-primary-gradient flex items-center justify-center shadow-maternal">
              <span className="text-white font-bold text-lg">👩‍⚕️</span>
            </div>

            {/* Title */}
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg text-neutral-800 leading-tight">
                {title}
              </h1>
              <p className="text-xs text-neutral-600 leading-tight">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Status Indicator */}
            <div className="hidden md:flex items-center gap-2 mr-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-success-DEFAULT rounded-full animate-gentle-pulse" />
                <span className="text-xs text-neutral-600">온라인</span>
              </div>
            </div>

            {/* Notifications */}
            {onNotificationClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onNotificationClick}
                className="relative p-2 text-neutral-600 hover:bg-neutral-100"
                aria-label="알림"
              >
                <Bell className="w-5 h-5" />
                {notifications > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 text-xs font-bold px-1"
                  >
                    {notifications > 99 ? '99+' : notifications}
                  </Badge>
                )}
              </Button>
            )}

            {/* Settings */}
            {onSettingsClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSettingsClick}
                className="p-2 text-neutral-600 hover:bg-neutral-100 hidden sm:flex"
                aria-label="설정"
              >
                <Settings className="w-5 h-5" />
              </Button>
            )}

            {/* Profile */}
            {onProfileClick && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onProfileClick}
                className="flex items-center gap-2 p-2 text-neutral-600 hover:bg-neutral-100"
                aria-label="프로필"
              >
                <Avatar className="w-8 h-8">
                  <AvatarImage src={avatar} alt={userName} />
                  <AvatarFallback className="bg-secondary-gradient text-white font-medium text-xs">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden md:block">
                  {userName}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Title */}
        <div className="sm:hidden mt-2 text-center">
          <h1 className="font-bold text-base text-neutral-800">
            {title}
          </h1>
        </div>
      </header>
    )
  }
)

Header.displayName = 'Header'

export { Header }
