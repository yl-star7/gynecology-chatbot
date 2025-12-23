'use client'

import React from 'react'
import { Button } from '@/components/ui/button'

import { cn } from '@/lib/utils'
import { Sparkles, Heart, Baby, Utensils, Dumbbell, Moon, AlertTriangle, Calendar } from 'lucide-react'

export interface SuggestionChip {
  id: string
  text: string
  message: string
  icon?: React.ReactNode
  category?: 'pregnancy' | 'nutrition' | 'exercise' | 'health' | 'emergency' | 'general'
  color?: 'primary' | 'secondary' | 'accent' | 'warning' | 'info'
}

export interface SuggestionChipsProps {
  suggestions?: SuggestionChip[]
  onSuggestionClick: (message: string) => void
  disabled?: boolean
  className?: string
  showCategories?: boolean
}

const defaultSuggestions: SuggestionChip[] = [
  {
    id: '1',
    text: '임신 초기 주의사항',
    message: '임신 초기에 주의해야 할 점들을 알려주세요',
    icon: <Baby className="w-3 h-3" />,
    category: 'pregnancy',
    color: 'primary'
  },
  {
    id: '2', 
    text: '영양 관리',
    message: '임신 중 영양 관리 방법을 알려주세요',
    icon: <Utensils className="w-3 h-3" />,
    category: 'nutrition',
    color: 'accent'
  },
  {
    id: '3',
    text: '운동 가이드',
    message: '임신 중 안전한 운동 방법이 궁금해요',
    icon: <Dumbbell className="w-3 h-3" />,
    category: 'exercise',
    color: 'secondary'
  },
  {
    id: '4',
    text: '태동 확인',
    message: '태동은 언제부터 느낄 수 있나요?',
    icon: <Heart className="w-3 h-3" />,
    category: 'pregnancy',
    color: 'primary'
  },
  {
    id: '5',
    text: '수면 관리',
    message: '임신 중 잠을 잘 자는 방법을 알려주세요',
    icon: <Moon className="w-3 h-3" />,
    category: 'health',
    color: 'info'
  },
  {
    id: '6',
    text: '산전 검사',
    message: '산전 검사 일정과 항목이 궁금해요',
    icon: <Calendar className="w-3 h-3" />,
    category: 'health',
    color: 'info'
  }
]

const categoryColorMap = {
  pregnancy: 'primary',
  nutrition: 'accent',
  exercise: 'secondary',
  health: 'info',
  emergency: 'warning',
  general: 'outline'
} as const

const SuggestionChips = React.forwardRef<HTMLDivElement, SuggestionChipsProps>(
  ({
    suggestions = defaultSuggestions,
    onSuggestionClick,
    disabled = false,
    className,
    showCategories = false
  }, ref) => {

    const categorizedSuggestions = React.useMemo(() => {
      if (!showCategories) return { all: suggestions }
      
      return suggestions.reduce((acc, suggestion) => {
        const category = suggestion.category || 'general'
        if (!acc[category]) {
          acc[category] = []
        }
        acc[category].push(suggestion)
        return acc
      }, {} as Record<string, SuggestionChip[]>)
    }, [suggestions, showCategories])

    const getCategoryTitle = (category: string) => {
      switch (category) {
        case 'pregnancy': return '임신/출산'
        case 'nutrition': return '영양 관리'
        case 'exercise': return '운동/활동'
        case 'health': return '건강 관리'
        case 'emergency': return '응급 상황'
        case 'general': return '일반 상담'
        default: return '추천 질문'
      }
    }

    const getCategoryIcon = (category: string) => {
      switch (category) {
        case 'pregnancy': return <Baby className="w-4 h-4" />
        case 'nutrition': return <Utensils className="w-4 h-4" />
        case 'exercise': return <Dumbbell className="w-4 h-4" />
        case 'health': return <Heart className="w-4 h-4" />
        case 'emergency': return <AlertTriangle className="w-4 h-4" />
        default: return <Sparkles className="w-4 h-4" />
      }
    }

    if (suggestions.length === 0) return null

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col gap-4 p-4',
          className
        )}
      >
        {Object.entries(categorizedSuggestions).map(([category, chips]) => (
          <div key={category} className="space-y-3">
            {/* Category Header */}
            {showCategories && (
              <div className="flex items-center gap-2">
                <div className="text-primary-600">
                  {getCategoryIcon(category)}
                </div>
                <h4 className="text-sm font-medium text-neutral-700">
                  {getCategoryTitle(category)}
                </h4>
              </div>
            )}

            {/* Suggestion Chips */}
            <div className="flex flex-wrap gap-2">
              {chips.map((suggestion) => (
                <Button
                  key={suggestion.id}
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => onSuggestionClick(suggestion.message)}
                  className={cn(
                    'h-auto py-2 px-3 rounded-full text-xs font-medium',
                    'bg-gradient-to-r border transition-all duration-200',
                    'hover:scale-105 active:scale-95',
                    // Color variants
                    suggestion.color === 'primary' && [
                      'from-primary-50 to-primary-100 text-primary-700',
                      'border-primary-200 hover:from-primary-100 hover:to-primary-200',
                      'hover:border-primary-300'
                    ],
                    suggestion.color === 'secondary' && [
                      'from-secondary-50 to-secondary-100 text-secondary-700',
                      'border-secondary-200 hover:from-secondary-100 hover:to-secondary-200',
                      'hover:border-secondary-300'
                    ],
                    suggestion.color === 'accent' && [
                      'from-accent-light/30 to-accent-light/50 text-accent-foreground',
                      'border-accent-DEFAULT/30 hover:from-accent-light/50 hover:to-accent-light/70',
                      'hover:border-accent-DEFAULT/50'
                    ],
                    suggestion.color === 'warning' && [
                      'from-warning-light/30 to-warning-light/50 text-warning-foreground',
                      'border-warning-DEFAULT/30 hover:from-warning-light/50 hover:to-warning-light/70',
                      'hover:border-warning-DEFAULT/50'
                    ],
                    suggestion.color === 'info' && [
                      'from-info-light/30 to-info-light/50 text-info-foreground',
                      'border-info-DEFAULT/30 hover:from-info-light/50 hover:to-info-light/70',
                      'hover:border-info-DEFAULT/50'
                    ],
                    !suggestion.color && [
                      'from-neutral-50 to-neutral-100 text-neutral-700',
                      'border-neutral-200 hover:from-neutral-100 hover:to-neutral-200',
                      'hover:border-neutral-300'
                    ]
                  )}
                  aria-label={`질문하기: ${suggestion.text}`}
                >
                  <div className="flex items-center gap-2">
                    {suggestion.icon && (
                      <span className="flex-shrink-0">
                        {suggestion.icon}
                      </span>
                    )}
                    <span className="whitespace-nowrap">
                      {suggestion.text}
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        ))}

        {/* Disclaimer */}
        <div className="text-center pt-2">
          <p className="text-xs text-neutral-500 leading-relaxed">
            💡 위 질문들을 참고하여 더 구체적으로 물어보세요
          </p>
        </div>
      </div>
    )
  }
)

SuggestionChips.displayName = 'SuggestionChips'

export { SuggestionChips }