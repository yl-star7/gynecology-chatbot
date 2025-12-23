'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { DrawerMenuItem } from './drawer-menu-item'
import { MessageCircle, BookOpen, BarChart3, Settings, User, Heart, Calendar, Phone } from 'lucide-react'

export interface DrawerContentProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  className?: string
}

const DrawerContent = React.forwardRef<HTMLDivElement, DrawerContentProps>(
  ({ activeTab = 'chat', onTabChange, className }, ref) => {
    
    const menuItems = [
      {
        id: 'chat',
        icon: <MessageCircle className="w-5 h-5" />,
        label: '채팅',
        description: 'AI 상담',
        emoji: '💬'
      },
      {
        id: 'info',
        icon: <BookOpen className="w-5 h-5" />,
        label: '정보',
        description: '임신 정보',
        emoji: '📚'
      },
      {
        id: 'records',
        icon: <BarChart3 className="w-5 h-5" />,
        label: '기록',
        description: '건강 기록',
        emoji: '📊',
        badge: '3'
      },
      {
        id: 'calendar',
        icon: <Calendar className="w-5 h-5" />,
        label: '일정',
        description: '검진 일정',
        emoji: '📅'
      },
      {
        id: 'community',
        icon: <Heart className="w-5 h-5" />,
        label: '커뮤니티',
        description: '맘카페',
        emoji: '💕'
      },
      {
        id: 'profile',
        icon: <User className="w-5 h-5" />,
        label: '프로필',
        description: '내 정보',
        emoji: '👤'
      },
      {
        id: 'emergency',
        icon: <Phone className="w-5 h-5" />,
        label: '응급연락',
        description: '응급상황',
        emoji: '🚨'
      },
      {
        id: 'settings',
        icon: <Settings className="w-5 h-5" />,
        label: '설정',
        description: '환경설정',
        emoji: '⚙️'
      }
    ]

    const handleItemClick = (itemId: string) => {
      onTabChange?.(itemId)
    }

    return (
      <div
        ref={ref}
        className={cn('px-6 py-4', className)}
      >
        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 px-2">
            빠른 메뉴
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {menuItems.slice(0, 4).map((item) => (
              <DrawerMenuItem
                key={item.id}
                icon={item.emoji}
                label={item.label}
                description={item.description}
                active={activeTab === item.id}
                badge={item.badge}
                onClick={() => handleItemClick(item.id)}
                className="aspect-square"
              />
            ))}
          </div>
        </div>

        {/* Main Menu */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 px-2">
            메인 메뉴
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {menuItems.slice(4, 6).map((item) => (
              <DrawerMenuItem
                key={item.id}
                icon={item.emoji}
                label={item.label}
                description={item.description}
                active={activeTab === item.id}
                onClick={() => handleItemClick(item.id)}
                className="aspect-[2/1]"
              />
            ))}
          </div>
        </div>

        {/* Emergency & Settings */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-neutral-700 mb-3 px-2">
            기타
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {menuItems.slice(6).map((item) => (
              <DrawerMenuItem
                key={item.id}
                icon={item.emoji}
                label={item.label}
                description={item.description}
                active={activeTab === item.id}
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  'aspect-[2/1]',
                  item.id === 'emergency' && [
                    'bg-gradient-to-br from-red-50 to-red-100/50',
                    'border-red-200 text-red-700',
                    'hover:border-red-300 hover:shadow-red-500/20'
                  ]
                )}
              />
            ))}
          </div>
        </div>

        {/* User Info Card */}
        <div className={cn(
          'bg-gradient-to-br from-primary-50 to-secondary-50',
          'border border-primary-200/50 rounded-2xl p-4 mb-4',
          'shadow-lg shadow-primary-500/10'
        )}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary-gradient flex items-center justify-center">
              <span className="text-white font-semibold text-sm">김</span>
            </div>
            <div>
              <p className="font-semibold text-primary-800">김○○님</p>
              <p className="text-sm text-primary-600">임신 24주</p>
            </div>
          </div>
          <div className="text-xs text-primary-700 bg-primary-100/50 rounded-lg px-3 py-2">
            💡 다음 검진일: 2024.02.15 (7일 후)
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-neutral-200/50">
          <p className="text-xs text-neutral-500 mb-2">
            안전하고 건강한 임신을 위해 함께해요 💕
          </p>
          <p className="text-xs text-neutral-400">
            버전 1.0.0 • 문의: support@gynecology-ai.com
          </p>
        </div>
      </div>
    )
  }
)

DrawerContent.displayName = 'DrawerContent'

export { DrawerContent }