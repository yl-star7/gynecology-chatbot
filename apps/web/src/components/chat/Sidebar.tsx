'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus, MessageSquare, MoreHorizontal, Edit, Trash2 } from 'lucide-react';

interface ChatItem {
  id: string;
  title: string;
  timestamp: string;
}

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
  onNewChat?: () => void;
  onSelectChat?: (chatId: string) => void;
  currentChatId?: string;
}

export function Sidebar({
  isOpen = true,
  onClose,
  className,
  onNewChat,
  onSelectChat,
  currentChatId
}: SidebarProps) {
  const [chats] = useState<ChatItem[]>([
    { id: '1', title: '임신 초기 증상 문의', timestamp: '30분 전' },
    { id: '2', title: '엽산 복용 시기', timestamp: '2시간 전' },
    { id: '3', title: '산전 검사 일정', timestamp: '1일 전' },
  ]);

  const handleNewChat = () => {
    onNewChat?.();
    onClose?.();
  };

  const handleSelectChat = (chatId: string) => {
    onSelectChat?.(chatId);
    onClose?.();
  };

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={handleNewChat}
          className="w-full flex items-center gap-3 p-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Plus size={16} />
          새로운 채팅
        </button>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleSelectChat(chat.id)}
            className={cn(
              'group mx-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors',
              currentChatId === chat.id && 'bg-gray-100'
            )}
          >
            <div className="flex items-center gap-3">
              <MessageSquare size={16} className="text-gray-500" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {chat.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {chat.timestamp}
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1 hover:bg-gray-200 rounded">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
