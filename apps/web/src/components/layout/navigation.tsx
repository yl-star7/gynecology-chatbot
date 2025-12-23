'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  MessageCircle, 
  BookOpen, 
  BarChart3, 
  
  User,
  
  
  
  Home
} from 'lucide-react'

export interface NavigationItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string | number
  color?: 'primary' | 'secondary' | 'accent' | 'warning' | 'info' | 'error'
  href?: string
}

export interface NavigationProps {
  items?: NavigationItem[]
  activeItem?: string
  onItemClick?: (itemId: string) => void
  variant?: 'bottom' | 'sidebar'
  className?: string
  showLabels?: boolean
}

const defaultItems: NavigationItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: <Home className="w-5 h-5" />,
    color: 'primary'
  },
  {
    id: 'chat',
    label: '채팅',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'primary'
  },
  {
    id: 'info',
    label: '정보',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'secondary'
  },
  {
    id: 'records',
    label: '기록',
    icon: <BarChart3 className="w-5 h-5" />,
    badge: '3',
    color: 'accent'
  },
  {
    id: 'profile',
    label: '내정보',
    icon: <User className="w-5 h-5" />,
    color: 'secondary'
  }
]

const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({
    items = defaultItems,
    activeItem,
    onItemClick,
    variant = 'bottom',
    className,
    showLabels = true
  }, ref) => {

    const handleItemClick = (itemId: string) => {
      onItemClick?.(itemId)
    }

    const getItemColors = (item: NavigationItem, isActive: boolean) => {
      const colors = {
        primary: {
          active: 'text-primary-600 bg-primary-100',
          inactive: 'text-neutral-500 hover:text-primary-600 hover:bg-primary-50'
        },
        secondary: {
          active: 'text-secondary-600 bg-secondary-100',
          inactive: 'text-neutral-500 hover:text-secondary-600 hover:bg-secondary-50'
        },
        accent: {
          active: 'text-accent-foreground bg-accent-light/50',
          inactive: 'text-neutral-500 hover:text-accent-foreground hover:bg-accent-light/20'
        },
        warning: {
          active: 'text-warning-foreground bg-warning-light/50',
          inactive: 'text-neutral-500 hover:text-warning-foreground hover:bg-warning-light/20'
        },
        info: {
          active: 'text-info-foreground bg-info-light/50',
          inactive: 'text-neutral-500 hover:text-info-foreground hover:bg-info-light/20'
        },
        error: {
          active: 'text-error-foreground bg-error-light/50',
          inactive: 'text-neutral-500 hover:text-error-foreground hover:bg-error-light/20'
        }
      }

      const colorScheme = colors[item.color || 'primary']
      return isActive ? colorScheme.active : colorScheme.inactive
    }

    if (variant === 'sidebar') {
      return (
        <nav
          ref={ref}
          className={cn(
            'flex flex-col w-64 h-full',
            'bg-white border-r border-neutral-200',
            'p-4 space-y-2',
            className
          )}
        >
          {items.map((item) => {
            const isActive = activeItem === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  'justify-start w-full h-12 px-4',
                  'transition-all duration-200',
                  getItemColors(item, isActive),
                  isActive && 'font-semibold shadow-sm'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="relative">
                    {item.icon}
                    {item.badge && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 min-w-[1rem] h-4 text-xs px-1"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                  {showLabels && (
                    <span className="text-sm">
                      {item.label}
                    </span>
                  )}
                </div>
              </Button>
            )
          })}
        </nav>
      )
    }

    return (
      <nav
        ref={ref}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-white/95 backdrop-blur-md border-t border-neutral-200',
          'shadow-lg pb-safe',
          className
        )}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {items.map((item) => {
            const isActive = activeItem === item.id
            return (
              <Button
                key={item.id}
                variant="ghost"
                onClick={() => handleItemClick(item.id)}
                className={cn(
                  'flex flex-col items-center justify-center',
                  'min-h-[60px] min-w-[60px] px-2 py-2 rounded-xl',
                  'transition-all duration-200',
                  getItemColors(item, isActive),
                  isActive && [
                    'scale-105 shadow-sm',
                    'transform-gpu' // Use GPU acceleration
                  ]
                )}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
              >
                <div className="relative mb-1">
                  {item.icon}
                  {item.badge && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 min-w-[1rem] h-4 text-xs px-1"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                {showLabels && (
                  <span className={cn(
                    'text-xs leading-tight text-center',
                    'transition-all duration-200',
                    isActive && 'font-semibold'
                  )}>
                    {item.label}
                  </span>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <div 
                    className={cn(
                      'absolute top-1 left-1/2 -translate-x-1/2',
                      'w-1 h-1 rounded-full',
                      item.color === 'primary' && 'bg-primary-500',
                      item.color === 'secondary' && 'bg-secondary-500',
                      item.color === 'accent' && 'bg-accent-DEFAULT',
                      !item.color && 'bg-primary-500'
                    )}
                  />
                )}
              </Button>
            )
          })}
        </div>
      </nav>
    )
  }
)

Navigation.displayName = 'Navigation'

export { Navigation }