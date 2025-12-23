// Base UI Components
export { Button, buttonVariants } from './ui/button'
export { Input } from './ui/input'
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardAction } from './ui/card'
export { Badge, badgeVariants } from './ui/badge'
export { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogFooter, 
  DialogTitle, 
  DialogDescription,
  DialogClose,
  DialogPortal,
  DialogOverlay 
} from './ui/dialog'
export { Separator } from './ui/separator'
export { Label, labelVariants } from './ui/label'
export { Textarea } from './ui/textarea'
export {
  Toast,
  ToastProvider,
  ToastViewport,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  type ToastProps,
  type ToastActionElement
} from './ui/toast'
export { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
export { Skeleton } from './ui/skeleton'

// Chat Components
export { ChatInterface, type Message } from './chat/chat-interface'
export type { ChatInterfaceProps } from './chat/chat-interface'
export { MessageBubble, type MessageBubbleProps } from './chat/message-bubble'
export { ChatInput, type ChatInputProps } from './chat/chat-input'
export { TypingIndicator } from './chat/typing-indicator'
export type { TypingIndicatorProps } from './chat/typing-indicator'
export { ChatHeader, type ChatHeaderProps } from './chat/chat-header'
export { MessageList, type MessageListProps } from './chat/message-list'
export { SuggestionChips, type SuggestionChipsProps, type SuggestionChip } from './chat/suggestion-chips'


// Layout Components
export { Header, type HeaderProps } from './layout/header'
export { Footer, type FooterProps } from './layout/footer'
export { MobileLayout, type MobileLayoutProps } from './layout/mobile-layout'
export { MaternalLayout, type MaternalLayoutProps } from './layout/maternal-layout'
export { Navigation, type NavigationProps, type NavigationItem } from './layout/navigation'
export { Sidebar, type SidebarProps, type ChatSession } from './layout/sidebar'
export { Toolbar, type ToolbarProps } from './layout/toolbar'
export { ExpandableBottomPanel, type ExpandableBottomPanelProps } from './layout/expandable-bottom-panel'