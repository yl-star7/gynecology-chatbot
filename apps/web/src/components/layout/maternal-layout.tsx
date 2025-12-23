'use client'

import React, { useState } from 'react'
import { ChatInterface } from '../chat/chat-interface'
import { Toolbar } from './toolbar'
import { ExpandableBottomPanel } from './expandable-bottom-panel'
import { Sidebar } from './sidebar'
import { DictionaryModal } from '../medical-dictionary/dictionary-modal'
import { cn } from '@/lib/utils'
import { useChat } from '@/hooks/use-custom-chat'
import { useRouter } from 'next/navigation'

export interface MaternalLayoutProps {
  children?: React.ReactNode
  className?: string
  showBottomPanel?: boolean
  defaultPanelExpanded?: boolean
  userProfile?: {
    full_name?: string
    avatar_url?: string
  } | null
  onLogout?: () => void
}

const MaternalLayout = React.forwardRef<HTMLDivElement, MaternalLayoutProps>(
  ({ 
    children,
    className,
    showBottomPanel = true,
    defaultPanelExpanded = false,
    userProfile,
    onLogout
  }, ref) => {
    const [panelExpanded, setPanelExpanded] = useState(defaultPanelExpanded)
    const [notificationCount, setNotificationCount] = useState(0)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [isDictionaryOpen, setIsDictionaryOpen] = useState(false)
    const router = useRouter()

    const handleTogglePanel = () => {
      setPanelExpanded(!panelExpanded)
    }

    const handleMenuItemClick = (item: string) => {
      switch(item) {
        case 'dictionary':
          setIsDictionaryOpen(true)
          break
        case 'album':
        case 'notes':
        case 'hospital':
        case 'emergency':
        case 'nutrition':
        case 'exercise':
        case 'medicine':
          // TODO: Implement other features
          console.log(`${item} clicked`)
          break
      }
    }

    // Using Vercel AI SDK's useChat hook
    const { 
      messages, 
      isLoading,
      append 
    } = useChat({
      api: '/api/chat',
      initialMessages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: '안녕하세요! 부인과 AI 상담사입니다. 임신, 출산, 여성 건강에 대한 궁금한 점을 편하게 물어보세요 💕'
        }
      ]
    })

    const handleSendMessage = async (message: string) => {
      await append({
        role: 'user',
        content: message
      })
    }

    // Convert AI SDK messages to our Message format
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      isUser: msg.role === 'user',
      timestamp: new Date(msg.createdAt || Date.now()),
      messageType: 'text' as const,
      username: msg.role === 'user' ? '회원님' : 'AI 산부인과 전문의'
    }))

    return (
      <div
        ref={ref}
        className={cn(
          'min-h-screen w-full flex relative overflow-hidden',
          'bg-gradient-to-br from-neutral-50 via-primary-50/30 to-secondary-50/30',
          className
        )}
      >
        {/* Left Sidebar */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          onNewChat={() => {
            // Reset messages and start new chat
            router.push('/chat')
          }}
          onSelectChat={(chatId) => {
            router.push(`/chat/${chatId}`)
          }}
          className="flex-shrink-0"
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <header className={cn(
            'sticky top-0 z-30 px-4 py-3 pt-safe',
            'bg-white/80 backdrop-blur-md border-b border-neutral-200/50',
            'shadow-sm'
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-gradient flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">👩‍⚕️</span>
                </div>
                <div>
                  <h1 className="font-bold text-lg text-neutral-800">
                    부인과 AI 상담
                  </h1>
                  <p className="text-xs text-neutral-600">
                    전문적이고 따뜻한 건강 상담
                  </p>
                </div>
              </div>
              
              {/* Right Toolbar */}
              <Toolbar
                userProfile={userProfile}
                notificationCount={notificationCount}
                onSettingsClick={() => {
                  // Handle settings click
                  console.log('Settings clicked')
                }}
                onNotificationsClick={() => {
                  // Handle notifications click
                  setNotificationCount(0)
                  console.log('Notifications clicked')
                }}
                onProfileClick={() => {
                  // Handle profile click
                  console.log('Profile clicked')
                }}
                onHistoryClick={() => {
                  // Handle history click
                  console.log('History clicked')
                }}
                onInfoClick={() => {
                  // Handle info click
                  console.log('Info clicked')
                }}
                onLogoutClick={onLogout}
              />
            </div>
          </header>

          {/* Main Content */}
          <main className={cn(
            'relative z-10 transition-all duration-300 flex-1',
            panelExpanded && showBottomPanel ? 'pb-80' : 'pb-4'
          )}>
            {children || (
              <div className="h-[calc(100vh-theme(spacing.16))] w-full">
                <ChatInterface
                  messages={formattedMessages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  welcomeMessage="안녕하세요! 부인과 AI 상담사입니다. 임신, 출산, 여성 건강에 대한 궁금한 점을 편하게 물어보세요 💕"
                  isPanelExpanded={panelExpanded}
                  onTogglePanel={handleTogglePanel}
                />
              </div>
            )}
          </main>

          {/* Expandable Bottom Panel */}
          {showBottomPanel && (
            <ExpandableBottomPanel
              isExpanded={panelExpanded}
              onExpandedChange={setPanelExpanded}
              onMenuItemClick={handleMenuItemClick}
            />
          )}
        </div>

        {/* Medical Dictionary Modal */}
        <DictionaryModal
          isOpen={isDictionaryOpen}
          onClose={() => setIsDictionaryOpen(false)}
        />

        {/* Background Pattern */}
        <div 
          className="fixed inset-0 z-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23f28b5c' fill-opacity='1'%3E%3Cpath d='M30 30c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20zm0 0c0 11.046-8.954 20-20 20S-10 41.046-10 30s8.954-20 20-20 20 8.954 20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
    )
  }
)

MaternalLayout.displayName = 'MaternalLayout'

export { MaternalLayout }
