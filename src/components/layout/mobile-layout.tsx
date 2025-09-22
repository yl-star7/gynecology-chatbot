'use client'

import React, { useState, useEffect } from 'react'
import { Header } from './header'
import { Footer } from './footer'
import { cn } from '@/lib/utils'

export interface MobileLayoutProps {
  children: React.ReactNode
  header?: {
    title?: string
    subtitle?: string
    variant?: 'default' | 'minimal' | 'chat'
    showMenu?: boolean
    showProfile?: boolean
    showNotifications?: boolean
    notifications?: number
  }
  footer?: {
    variant?: 'default' | 'minimal' | 'compact'
    show?: boolean
  }
  className?: string
  contentClassName?: string
  fullHeight?: boolean
  safeArea?: boolean
  onMenuClick?: () => void
  onProfileClick?: () => void
  onNotificationClick?: () => void
}

const MobileLayout = React.forwardRef<HTMLDivElement, MobileLayoutProps>(
  ({
    children,
    header = { variant: 'default', showMenu: true, showProfile: true },
    footer = { variant: 'minimal', show: true },
    className,
    contentClassName,
    fullHeight = true,
    safeArea = true,
    onMenuClick,
    onProfileClick,
    onNotificationClick
  }, ref) => {
    const [mounted, setMounted] = useState(false)

    // Ensure component is mounted for proper height calculation
    useEffect(() => {
      setMounted(true)
    }, [])

    if (!mounted) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col w-full',
          fullHeight && 'min-h-screen',
          // Mobile-first responsive design
          'relative overflow-hidden',
          // Maternal background
          'bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30',
          safeArea && 'supports-[height:100dvh]:min-h-[100dvh]',
          className
        )}
      >
        {/* Header */}
        <Header
          title={header.title}
          subtitle={header.subtitle}
          variant={header.variant}
          notifications={header.notifications}
          onMenuClick={header.showMenu ? onMenuClick : undefined}
          onProfileClick={header.showProfile ? onProfileClick : undefined}
          onNotificationClick={header.showNotifications ? onNotificationClick : undefined}
        />

        {/* Main Content */}
        <main
          className={cn(
            'flex-1 relative z-10',
            // Calculate height accounting for header and footer
            fullHeight && [
              'min-h-0', // Allow flexbox to work properly
              footer.show 
                ? 'h-[calc(100vh-theme(spacing.32))]' // Subtract header + footer
                : 'h-[calc(100vh-theme(spacing.16))]' // Subtract header only
            ],
            contentClassName
          )}
        >
          {children}
        </main>

        {/* Footer */}
        {footer.show && (
          <Footer
            variant={footer.variant}
            showEmergencyContact={footer.variant === 'default'}
            showSupportInfo={footer.variant === 'default'}
            showLegal={footer.variant !== 'minimal'}
          />
        )}

        {/* Background Pattern */}
        <div 
          className="fixed inset-0 z-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f28b5c' fill-opacity='1'%3E%3Cpath d='M30 30c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20zm0 0c0 11.046-8.954 20-20 20S-10 41.046-10 30s8.954-20 20-20 20 8.954 20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden="true"
        />
      </div>
    )
  }
)

MobileLayout.displayName = 'MobileLayout'

export { MobileLayout }