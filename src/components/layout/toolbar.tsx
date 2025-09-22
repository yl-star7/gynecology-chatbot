'use client'

import Image from 'next/image'
import React, { useState, useRef, useEffect } from 'react'
import { Settings, User, Bell,  LogOut, Info, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface ToolbarProps {
  className?: string
  onSettingsClick?: () => void
  onProfileClick?: () => void
  onNotificationsClick?: () => void
  onLogoutClick?: () => void
  onInfoClick?: () => void
  onHistoryClick?: () => void
  notificationCount?: number
  userProfile?: {
    full_name?: string
    avatar_url?: string
  } | null
}

export const Toolbar = React.forwardRef<HTMLDivElement, ToolbarProps>(
  ({ 
    className,
    onSettingsClick,
    onProfileClick,
    onNotificationsClick,
    onLogoutClick,
    onInfoClick,
    onHistoryClick,
    notificationCount = 0,
    userProfile,
  }, ref) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsDropdownOpen(false)
        }
      }

      if (isDropdownOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isDropdownOpen])

    const handleMenuItemClick = (action?: () => void) => {
      action?.()
      setIsDropdownOpen(false)
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2',
          className
        )}
      >
        {/* Notifications Button */}
        <Button
          variant="ghost"
          size="sm"
          className="relative touch-target hover:bg-primary-50 transition-colors"
          onClick={onNotificationsClick}
          aria-label="알림"
        >
          <Bell className="h-5 w-5 text-neutral-600 hover:text-primary-600" />
          {notificationCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-primary-500 hover:bg-primary-500 text-white text-xs flex items-center justify-center"
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </Badge>
          )}
        </Button>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          className="touch-target hover:bg-primary-50 transition-colors"
          onClick={onSettingsClick}
          aria-label="설정"
        >
          <Settings className="h-5 w-5 text-neutral-600 hover:text-primary-600" />
        </Button>

        {/* Profile & More Menu */}
        <div className="relative" ref={dropdownRef}>
          <Button
            variant="ghost"
            size="sm"
            className="touch-target hover:bg-primary-50 transition-colors"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="더 보기"
          >
            {userProfile?.avatar_url ? (
              <div className="w-6 h-6 rounded-full bg-primary-100 border-2 border-primary-200 overflow-hidden">
                <Image
                  src={userProfile.avatar_url}
                  alt="프로필"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
                <User className="h-3.5 w-3.5 text-white" />
              </div>
            )}
          </Button>

          {/* Custom Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white/95 backdrop-blur-sm border border-primary-200/50 rounded-xl shadow-xl z-50 animate-scale-in">
              {/* User Info */}
              {userProfile && (
                <>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
                      {userProfile.avatar_url ? (
                          <Image
                            src={userProfile.avatar_url}
                            alt="프로필"
                            width={32}
                            height={32}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <User className="h-4 w-4 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 truncate">
                          {userProfile.full_name || '사용자'}님
                        </p>
                        <p className="text-xs text-neutral-500">
                          온라인
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-primary-100 my-1" />
                </>
              )}

              {/* Menu Items */}
              <div className="py-1">
                <button
                  onClick={() => handleMenuItemClick(onProfileClick)}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-primary-50 transition-colors text-sm text-neutral-700"
                >
                  <User className="h-4 w-4" />
                  내 프로필
                </button>

                <button
                  onClick={() => handleMenuItemClick(onHistoryClick)}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-primary-50 transition-colors text-sm text-neutral-700"
                >
                  <History className="h-4 w-4" />
                  대화 기록
                </button>

                <button
                  onClick={() => handleMenuItemClick(onInfoClick)}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-primary-50 transition-colors text-sm text-neutral-700"
                >
                  <Info className="h-4 w-4" />
                  도움말 & 정보
                </button>

                <div className="border-t border-primary-100 my-1" />

                <button
                  onClick={() => handleMenuItemClick(onLogoutClick)}
                  className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-error-light/20 transition-colors text-sm text-error-DEFAULT"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

Toolbar.displayName = 'Toolbar'