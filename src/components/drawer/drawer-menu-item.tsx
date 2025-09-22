'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export interface DrawerMenuItemProps {
  icon: React.ReactNode | string
  label: string
  description?: string
  active?: boolean
  disabled?: boolean
  badge?: string | number
  onClick?: () => void
  className?: string
}

const DrawerMenuItem = React.forwardRef<HTMLButtonElement, DrawerMenuItemProps>(
  ({ 
    icon,
    label,
    description,
    active = false,
    disabled = false,
    badge,
    onClick,
    className
  }, ref) => {
    const handleClick = () => {
      if (!disabled && onClick) {
        onClick()
      }
    }

    const renderIcon = () => {
      if (typeof icon === 'string') {
        return (
          <span 
            className="text-2xl"
            role="img" 
            aria-label={label}
          >
            {icon}
          </span>
        )
      }
      return (
        <div className="w-6 h-6 flex items-center justify-center">
          {icon}
        </div>
      )
    }

    return (
      <button
        ref={ref}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          'relative flex flex-col items-center justify-center',
          'min-h-[80px] p-4 rounded-2xl',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2',
          // Default state
          'bg-gradient-to-br from-neutral-50 to-neutral-100/50',
          'border border-neutral-200/50 text-neutral-700',
          // Hover state
          'hover:shadow-lg hover:shadow-primary-500/10',
          'hover:border-primary-200 hover:scale-[1.02]',
          // Active state
          active && [
            'bg-gradient-to-br from-primary-100 to-primary-50',
            'border-primary-300 text-primary-700',
            'shadow-lg shadow-primary-500/20',
            'scale-[1.02]'
          ],
          // Disabled state
          disabled && [
            'opacity-50 cursor-not-allowed',
            'hover:scale-100 hover:shadow-none'
          ],
          className
        )}
        aria-pressed={active}
        aria-disabled={disabled}
      >
        {/* Badge */}
        {badge && (
          <div className="absolute -top-1 -right-1 z-10">
            <Badge 
              variant="destructive" 
              className={cn(
                'min-w-[1.25rem] h-5 text-xs font-bold',
                'bg-gradient-to-r from-red-500 to-red-400',
                'text-white shadow-lg shadow-red-500/30'
              )}
            >
              {badge}
            </Badge>
          </div>
        )}

        {/* Icon */}
        <div 
          className={cn(
            'mb-2 transition-transform duration-200',
            active && 'scale-110',
            !disabled && 'group-hover:scale-110'
          )}
        >
          {renderIcon()}
        </div>

        {/* Label */}
        <span 
          className={cn(
            'text-sm font-medium text-center leading-tight',
            'transition-colors duration-200',
            active && 'text-primary-700 font-semibold'
          )}
        >
          {label}
        </span>

        {/* Description */}
        {description && (
          <span 
            className={cn(
              'text-xs text-center mt-1 leading-tight',
              'text-neutral-500 transition-colors duration-200',
              active && 'text-primary-600'
            )}
          >
            {description}
          </span>
        )}

        {/* Active indicator */}
        {active && (
          <div 
            className={cn(
              'absolute bottom-2 left-1/2 -translate-x-1/2',
              'w-8 h-1 bg-primary-500 rounded-full',
              'animate-scale-in'
            )}
          />
        )}
      </button>
    )
  }
)

DrawerMenuItem.displayName = 'DrawerMenuItem'

export { DrawerMenuItem }