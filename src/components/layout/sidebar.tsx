'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Search, 
  MessageCircle, 
  MoreVertical, 
  Archive, 
  
  ChevronLeft,
  Heart,
  Clock
} from 'lucide-react';

export interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
  isFavorite?: boolean;
  isArchived?: boolean;
}

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  chatSessions?: ChatSession[];
  activeChatId?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  
  
  onToggleFavorite?: (chatId: string) => void;
  className?: string;
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ 
    isCollapsed = false,
    onToggleCollapse,
    chatSessions = [],
    activeChatId,
    onNewChat,
    onSelectChat,
    
    
    onToggleFavorite,
    className
  }, ref) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);

    // Mock data for development
    const mockSessions: ChatSession[] = chatSessions.length > 0 ? chatSessions : [
      {
        id: '1',
        title: '임신 초기 증상 상담',
        lastMessage: '감사합니다. 도움이 많이 되었어요.',
        timestamp: new Date(),
        messageCount: 8,
        isFavorite: true
      },
      {
        id: '2',
        title: '산전 검사 관련 질문',
        lastMessage: '언제 병원에 가야 할까요?',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        messageCount: 5
      },
      {
        id: '3',
        title: '엽산 복용량 문의',
        lastMessage: '하루에 몇 번 먹어야 하나요?',
        timestamp: new Date(Date.now() - 172800000), // 2 days ago
        messageCount: 3
      },
      {
        id: '4',
        title: '입덧 완화 방법',
        lastMessage: '생강차가 도움이 될까요?',
        timestamp: new Date(Date.now() - 259200000), // 3 days ago
        messageCount: 12,
        isFavorite: true
      },
      {
        id: '5',
        title: '태교 음악 추천',
        lastMessage: '클래식 음악이 좋다고 들었어요.',
        timestamp: new Date(Date.now() - 604800000), // 1 week ago
        messageCount: 6
      }
    ];

    const filteredSessions = mockSessions.filter(session =>
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatTimestamp = (timestamp: Date) => {
      const now = new Date();
      const diff = now.getTime() - timestamp.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      
      if (days === 0) return '오늘';
      if (days === 1) return '어제';
      if (days < 7) return `${days}일 전`;
      return timestamp.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative h-full bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out',
          'flex flex-col',
          isCollapsed ? 'w-16' : 'w-80',
          className
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-center justify-between mb-3">
            {!isCollapsed && (
              <h2 className="font-semibold text-neutral-800 text-sm">
                채팅 목록
              </h2>
            )}
            <div className="flex items-center gap-2">
              {/* New Chat Button */}
              <Button
                onClick={onNewChat}
                size="sm"
                className={cn(
                  'bg-gradient-to-r from-primary-500 to-primary-400',
                  'hover:from-primary-600 hover:to-primary-500',
                  'text-white shadow-lg shadow-primary-500/20',
                  'rounded-full transition-all duration-200',
                  'hover:shadow-xl hover:shadow-primary-500/30',
                  isCollapsed ? 'px-2' : 'px-3'
                )}
              >
                <Plus className="w-4 h-4" />
                {!isCollapsed && <span className="ml-1 text-xs">새 채팅</span>}
              </Button>
              
              {/* Collapse Toggle */}
              {onToggleCollapse && (
                <Button
                  onClick={onToggleCollapse}
                  variant="ghost"
                  size="sm"
                  className="p-1 rounded-full"
                >
                  <ChevronLeft 
                    className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isCollapsed && 'rotate-180'
                    )} 
                  />
                </Button>
              )}
            </div>
          </div>

          {/* Search */}
          {!isCollapsed && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                placeholder="채팅 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-neutral-50 border-neutral-200 text-sm"
              />
            </div>
          )}
        </div>

        {/* Chat Sessions List */}
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1 py-2">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'group relative p-3 rounded-lg cursor-pointer transition-all duration-200',
                  'hover:bg-neutral-50',
                  activeChatId === session.id 
                    ? 'bg-gradient-to-r from-primary-50 to-secondary-50 border border-primary-200/50' 
                    : 'hover:shadow-sm',
                  isCollapsed && 'px-2'
                )}
                onClick={() => onSelectChat?.(session.id)}
                onMouseEnter={() => setHoveredChatId(session.id)}
                onMouseLeave={() => setHoveredChatId(null)}
              >
                {isCollapsed ? (
                  // Collapsed view - just show icon
                  <div className="flex items-center justify-center">
                    <MessageCircle 
                      className={cn(
                        'w-5 h-5',
                        activeChatId === session.id ? 'text-primary-600' : 'text-neutral-600'
                      )} 
                    />
                  </div>
                ) : (
                  // Full view
                  <>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <MessageCircle className="w-4 h-4 text-primary-500 flex-shrink-0" />
                        <h3 className="font-medium text-sm text-neutral-800 truncate">
                          {session.title}
                        </h3>
                        {session.isFavorite && (
                          <Heart className="w-3 h-3 text-red-500 fill-current flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Actions */}
                      {(hoveredChatId === session.id || activeChatId === session.id) && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto hover:bg-neutral-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite?.(session.id);
                            }}
                          >
                            <Heart 
                              className={cn(
                                'w-3 h-3',
                                session.isFavorite ? 'text-red-500 fill-current' : 'text-neutral-400'
                              )} 
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto hover:bg-neutral-100"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Show more actions menu
                            }}
                          >
                            <MoreVertical className="w-3 h-3 text-neutral-400" />
                          </Button>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-neutral-600 mb-2 line-clamp-2">
                      {session.lastMessage}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-neutral-400" />
                        <span className="text-xs text-neutral-500">
                          {formatTimestamp(session.timestamp)}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {session.messageCount}
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-neutral-100">
            <div className="flex items-center justify-between text-xs text-neutral-500">
              <span>총 {filteredSessions.length}개 채팅</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-neutral-400 hover:text-neutral-600"
                  onClick={() => {/* Show archived chats */}}
                >
                  <Archive className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-auto text-neutral-400 hover:text-neutral-600"
                  onClick={() => {/* Bulk actions */}}
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

Sidebar.displayName = 'Sidebar';

export { Sidebar };