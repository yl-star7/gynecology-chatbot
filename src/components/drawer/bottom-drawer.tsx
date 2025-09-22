'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { X, ChevronUp, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface BottomDrawerProps {
  children: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  defaultHeight?: number
  maxHeight?: number
  minHeight?: number
  className?: string
  showHandle?: boolean
  showCloseButton?: boolean
  title?: string
  backdrop?: boolean
}

export type DrawerState = 'collapsed' | 'peek' | 'expanded'

const BottomDrawer = React.forwardRef<HTMLDivElement, BottomDrawerProps>(
  ({ 
    children,
    isOpen = false,
    onOpenChange,
    defaultHeight = 300,
    maxHeight = window?.innerHeight * 0.8 || 600,
    minHeight = 80,
    className,
    showHandle = true,
    showCloseButton = false,
    title,
    backdrop = true
  }, ref) => {
    const [drawerState, setDrawerState] = useState<DrawerState>('collapsed')
    const [isDragging, setIsDragging] = useState(false)
    const [startY, setStartY] = useState(0)
    const [currentHeight, setCurrentHeight] = useState(minHeight)
    const drawerRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    // Calculate heights for different states
    const peekHeight = Math.min(defaultHeight, maxHeight * 0.4)
    const expandedHeight = maxHeight

    useEffect(() => {
      if (isOpen) {
        setDrawerState('peek')
        setCurrentHeight(peekHeight)
      } else {
        setDrawerState('collapsed')
        setCurrentHeight(minHeight)
      }
    }, [isOpen, peekHeight, minHeight])

    const handleStateChange = (newState: DrawerState) => {
      setDrawerState(newState)
      
      switch (newState) {
        case 'collapsed':
          setCurrentHeight(minHeight)
          onOpenChange?.(false)
          break
        case 'peek':
          setCurrentHeight(peekHeight)
          onOpenChange?.(true)
          break
        case 'expanded':
          setCurrentHeight(expandedHeight)
          onOpenChange?.(true)
          break
      }
    }

    // Touch handlers for mobile
    const handleTouchStart = (e: React.TouchEvent) => {
      setIsDragging(true)
      setStartY(e.touches[0].clientY)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      if (!isDragging) return
      
      const currentY = e.touches[0].clientY
      const deltaY = startY - currentY
      const newHeight = Math.max(minHeight, Math.min(maxHeight, currentHeight + deltaY))
      
      setCurrentHeight(newHeight)
    }

    const handleTouchEnd = () => {
      if (!isDragging) return
      setIsDragging(false)
      
      // Snap to nearest state
      if (currentHeight < peekHeight / 2) {
        handleStateChange('collapsed')
      } else if (currentHeight < expandedHeight - 100) {
        handleStateChange('peek')
      } else {
        handleStateChange('expanded')
      }
    }

    // Mouse handlers for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
      setIsDragging(true)
      setStartY(e.clientY)
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return
      
      const deltaY = startY - e.clientY
      const newHeight = Math.max(minHeight, Math.min(maxHeight, currentHeight + deltaY))
      
      setCurrentHeight(newHeight)
    }

    const handleMouseUp = () => {
      if (!isDragging) return
      setIsDragging(false)
      
      // Snap to nearest state
      if (currentHeight < peekHeight / 2) {
        handleStateChange('collapsed')
      } else if (currentHeight < expandedHeight - 100) {
        handleStateChange('peek')
      } else {
        handleStateChange('expanded')
      }
    }

    // Add global mouse event listeners
    useEffect(() => {
      if (isDragging) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        
        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [isDragging, currentHeight, startY, handleMouseMove, handleMouseUp])

    // Handle backdrop click
    const handleBackdropClick = () => {
      if (drawerState !== 'collapsed') {
        handleStateChange('collapsed')
      }
    }

    const handleToggle = () => {
      switch (drawerState) {
        case 'collapsed':
          handleStateChange('peek')
          break
        case 'peek':
          handleStateChange('expanded')
          break
        case 'expanded':
          handleStateChange('collapsed')
          break
      }
    }

    return (
      <>
        {/* Backdrop */}
        {backdrop && drawerState !== 'collapsed' && (
          <div
            className={cn(
              'fixed inset-0 z-40 transition-opacity duration-300',
              'bg-black/20 backdrop-blur-sm',
              drawerState === 'expanded' ? 'opacity-100' : 'opacity-60'
            )}
            onClick={handleBackdropClick}
            aria-hidden="true"
          />
        )}

        {/* Drawer */}
        <div
          ref={ref}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'transition-transform duration-300 ease-out',
            'will-change-transform',
            className
          )}
          style={{
            height: `${currentHeight}px`,
            transform: drawerState === 'collapsed' && !isDragging
              ? `translateY(${currentHeight - minHeight}px)`
              : 'translateY(0px)'
          }}
        >
          <div
            ref={drawerRef}
            className={cn(
              'h-full w-full',
              'bg-gradient-to-t from-white via-white/98 to-white/95',
              'backdrop-blur-xl border-t border-neutral-200/50',
              'rounded-t-3xl shadow-2xl shadow-black/10',
              'overflow-hidden'
            )}
          >
            {/* Header */}
            <div
              className={cn(
                'relative flex items-center justify-between',
                'px-6 py-4 border-b border-neutral-100/50'
              )}
            >
              {/* Drag Handle */}
              {showHandle && (
                <div
                  className={cn(
                    'absolute top-3 left-1/2 -translate-x-1/2',
                    'w-12 h-1.5 bg-neutral-300 rounded-full',
                    'hover:bg-neutral-400 transition-colors cursor-grab active:cursor-grabbing',
                    isDragging && 'bg-primary-400'
                  )}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  role="button"
                  aria-label="드래그하여 서랍 크기 조절"
                />
              )}

              {/* Title */}
              {title && (
                <h2 className="font-semibold text-lg text-neutral-800 mt-2">
                  {title}
                </h2>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-2 ml-auto">
                {/* Toggle Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggle}
                  className="w-8 h-8 rounded-full hover:bg-neutral-100"
                  aria-label={
                    drawerState === 'collapsed' 
                      ? '서랍 열기' 
                      : drawerState === 'peek' 
                        ? '서랍 확장하기' 
                        : '서랍 닫기'
                  }
                >
                  {drawerState === 'expanded' ? (
                    <ChevronDown className="w-4 h-4 text-neutral-600" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-neutral-600" />
                  )}
                </Button>

                {/* Close Button */}
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStateChange('collapsed')}
                    className="w-8 h-8 rounded-full hover:bg-neutral-100"
                    aria-label="서랍 닫기"
                  >
                    <X className="w-4 h-4 text-neutral-600" />
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div
              ref={contentRef}
              className={cn(
                'flex-1 overflow-y-auto overflow-x-hidden',
                'scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-transparent'
              )}
              style={{
                height: `${currentHeight - 80}px` // Subtract header height
              }}
            >
              <div className="pb-safe">
                {children}
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }
)

BottomDrawer.displayName = 'BottomDrawer'

export { BottomDrawer }