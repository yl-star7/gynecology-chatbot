'use client'

import React from 'react'
import { 
  Images, 
  BookOpen, 
  NotebookPen, 
  MapPin, 
  Phone, 
  Apple, 
  Activity, 
  Pill 
} from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ExpandableBottomPanelProps {
  className?: string
  children?: React.ReactNode
  isExpanded?: boolean
  
  onMenuItemClick?: (item: string) => void
}

// Define menu items with their icons, labels, and colors
const menuItems = [
  { 
    id: 'album', 
    icon: Images, 
    label: '앨범', 
    gradient: 'from-primary-400 to-primary-500',
    shadowColor: 'shadow-primary-500/30'
  },
  { 
    id: 'dictionary', 
    icon: BookOpen, 
    label: '사전', 
    gradient: 'from-secondary-400 to-secondary-500',
    shadowColor: 'shadow-secondary-500/30'
  },
  { 
    id: 'notes', 
    icon: NotebookPen, 
    label: '산모노트', 
    gradient: 'from-accent-DEFAULT to-accent-dark',
    shadowColor: 'shadow-accent-DEFAULT/30'
  },
  { 
    id: 'hospital', 
    icon: MapPin, 
    label: '병원찾기', 
    gradient: 'from-info-DEFAULT to-info-dark',
    shadowColor: 'shadow-info-DEFAULT/30'
  },
  { 
    id: 'emergency', 
    icon: Phone, 
    label: '응급연락', 
    gradient: 'from-warning-DEFAULT to-warning-dark',
    shadowColor: 'shadow-warning-DEFAULT/30'
  },
  { 
    id: 'nutrition', 
    icon: Apple, 
    label: '영양정보', 
    gradient: 'from-success-DEFAULT to-success-dark',
    shadowColor: 'shadow-success-DEFAULT/30'
  },
  { 
    id: 'exercise', 
    icon: Activity, 
    label: '운동가이드', 
    gradient: 'from-primary-500 to-secondary-500',
    shadowColor: 'shadow-primary-500/20'
  },
  { 
    id: 'medicine', 
    icon: Pill, 
    label: '약물정보', 
    gradient: 'from-secondary-500 to-accent-dark',
    shadowColor: 'shadow-secondary-500/20'
  },
]

export const ExpandableBottomPanel = React.forwardRef<HTMLDivElement, ExpandableBottomPanelProps>(
  ({ 
    className,
    children,
    isExpanded = false,
    
    onMenuItemClick,
  }, ref) => {

    return (
      <div
        ref={ref}
        className={cn(
          'fixed bottom-0 left-0 right-0 z-40',
          'bg-gradient-to-t from-white via-white/98 to-white/95 backdrop-blur-sm',
          'border-t border-primary-200/50 shadow-lg',
          'transition-all duration-300 ease-out',
          isExpanded ? 'pb-safe' : 'pb-0',
          className
        )}
      >
        {/* Panel Content */}
        <div
          className={cn(
            'transition-all duration-300 ease-out overflow-hidden',
            isExpanded ? 'max-h-60 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="p-6 pb-8">
            {/* Custom Content */}
            {children}
            
            {/* Default Grid Layout */}
            {!children && (
              <div className="grid grid-cols-4 gap-4 md:gap-6">
                {menuItems.map((item) => {
                  const IconComponent = item.icon
                  return (
                    <button
                      key={item.id}
                      onClick={() => onMenuItemClick?.(item.id)}
                      className={cn(
                        'flex flex-col items-center space-y-2',
                        'transform transition-all duration-200 ease-out',
                        'hover:scale-105 active:scale-95',
                        'touch-manipulation'
                      )}
                    >
                      {/* Circular Icon Button */}
                      <div
                        className={cn(
                          'w-14 h-14 md:w-16 md:h-16 rounded-full',
                          'bg-gradient-to-br',
                          item.gradient,
                          'shadow-lg',
                          item.shadowColor,
                          'flex items-center justify-center',
                          'hover:shadow-xl hover:shadow-opacity-40',
                          'transition-all duration-200'
                        )}
                      >
                        <IconComponent className="w-6 h-6 md:w-7 md:h-7 text-white" />
                      </div>
                      
                      {/* Label */}
                      <span className="text-xs md:text-sm font-medium text-neutral-700 text-center leading-tight">
                        {item.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Collapsed State Indicator */}
        {!isExpanded && (
          <div className="h-1 bg-gradient-to-r from-primary-300 via-secondary-300 to-accent-DEFAULT opacity-50" />
        )}
      </div>
    )
  }
)

ExpandableBottomPanel.displayName = 'ExpandableBottomPanel'