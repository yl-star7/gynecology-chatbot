'use client'

import React from 'react'
import { cn } from '@/lib/utils'

export interface DrawerHandleProps {
  onDrag?: (deltaY: number) => void
  onDragStart?: (startY: number) => void
  onDragEnd?: () => void
  isDragging?: boolean
  className?: string
}

const DrawerHandle = React.forwardRef<HTMLDivElement, DrawerHandleProps>(
  ({ 
    onDrag,
    onDragStart,
    onDragEnd,
    isDragging = false,
    className
  }, ref) => {
    const [startY, setStartY] = React.useState(0)
    

    // Touch handlers
    const handleTouchStart = (e: React.TouchEvent) => {
      const y = e.touches[0].clientY
      setStartY(y)
      
      onDragStart?.(y)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
      e.preventDefault() // Prevent scrolling
      const y = e.touches[0].clientY
      
      const deltaY = startY - y
      onDrag?.(deltaY)
    }

    const handleTouchEnd = () => {
      onDragEnd?.()
      setStartY(0)
      
    }

    // Mouse handlers for desktop
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      const y = e.clientY
      setStartY(y)
      
      onDragStart?.(y)
    }

    const handleMouseMove = React.useCallback((e: MouseEvent) => {
      e.preventDefault()
      const y = e.clientY
      
      const deltaY = startY - y
      onDrag?.(deltaY)
    }, [startY, onDrag])

    const handleMouseUp = React.useCallback(() => {
      onDragEnd?.()
      setStartY(0)
      
    }, [onDragEnd])

    // Add global mouse event listeners when dragging
    React.useEffect(() => {
      if (isDragging && startY > 0) {
        document.addEventListener('mousemove', handleMouseMove)
        document.addEventListener('mouseup', handleMouseUp)
        
        return () => {
          document.removeEventListener('mousemove', handleMouseMove)
          document.removeEventListener('mouseup', handleMouseUp)
        }
      }
    }, [isDragging, startY, handleMouseMove, handleMouseUp])

    return (
      <div
        ref={ref}
        className={cn(
          'absolute top-3 left-1/2 -translate-x-1/2 z-10',
          'touch-none select-none', // Prevent text selection and scrolling
          className
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        role="button"
        tabIndex={0}
        aria-label="드래그하여 서랍 크기 조절"
        aria-describedby="drawer-handle-description"
      >
        {/* Visual Handle */}
        <div
          className={cn(
            'w-12 h-1.5 rounded-full transition-all duration-200',
            'cursor-grab active:cursor-grabbing',
            // Default state
            'bg-neutral-300 hover:bg-neutral-400',
            // Dragging state
            isDragging && [
              'bg-primary-400 scale-110 shadow-lg shadow-primary-500/30'
            ],
            // Focus state for accessibility
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2'
          )}
        />
        
        {/* Screen reader description */}
        <div id="drawer-handle-description" className="sr-only">
          위아래로 드래그하여 서랍 크기를 조절할 수 있습니다. 
          위로 드래그하면 확장되고, 아래로 드래그하면 축소됩니다.
        </div>
      </div>
    )
  }
)

DrawerHandle.displayName = 'DrawerHandle'

export { DrawerHandle }