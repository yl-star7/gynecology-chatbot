'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Plus, Send, Menu, Paperclip, MoreHorizontal, Edit, Trash2, X, MessageSquare } from 'lucide-react';
import { useGynecologyChat } from '@/hooks/use-gynecology-chat';
import { CitationSources, type Citation } from './citation-sources';
import toast from 'react-hot-toast';

interface ChatItem {
  id: string;
  title: string;
}

export function NewChat() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [input, setInput] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [chats, setChats] = useState<ChatItem[]>([
    { id: '1', title: '임신 초기 증상 문의' },
    { id: '2', title: '엽산 복용 시기' },
    { id: '3', title: '산전 검사 일정' },
  ]);

  // Mock messages for different chats
  const mockMessages: Record<string, Array<{role: string, content: string}>> = {
    '1': [
      { role: 'user', content: '임신 초기 증상이 궁금해요' },
      { role: 'assistant', content: '임신 초기에는 입덧, 가슴 팽만감, 피로감 등이 나타날 수 있습니다. 생리 예정일이 지났다면 임신 테스트를 해보시는 것을 권합니다.' }
    ],
    '2': [
      { role: 'user', content: '엽산은 언제부터 복용해야 하나요?' },
      { role: 'assistant', content: '엽산은 임신 계획 시점부터 복용하시는 것이 좋습니다. 임신 전 1개월부터 임신 12주까지 하루 400-800㎍ 복용을 권장합니다.' }
    ],
    '3': [
      { role: 'user', content: '첫 산전 검사는 언제 받나요?' },
      { role: 'assistant', content: '첫 산전 검사는 임신 6-8주경에 받으시면 됩니다. 이때 초음파로 태아 심박동을 확인하고 기본적인 산전 검사를 진행합니다.' }
    ]
  };

  const [newChatMessages, setNewChatMessages] = useState<Array<{role: string, content: string, citations?: Citation[]}>>([]);
  const [newChatLoading, setNewChatLoading] = useState(false);

  const {
    messages: hookMessages,
    isLoading: hookLoading,
    handleSubmit: originalHandleSubmit,
    handleInputChange,
    searchMedicalDocuments,
    ragResults
  } = useGynecologyChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [newChatMessages, hookMessages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || attachedFiles.length > 0) && !newChatLoading) {
      const messageContent = input.trim();

      if (attachedFiles.length > 0) {
        toast.success(`${attachedFiles.length}개 파일과 함께 전송됨`);
        setAttachedFiles([]);
      }

      // If no chat is selected, this is a new chat
      if (!selectedChatId && messageContent) {
        setNewChatMessages(prev => [...prev, { role: 'user', content: messageContent }]);
        setInput('');
        setNewChatLoading(true);

        // RAG 검색 및 AI 응답
        setTimeout(async () => {
          // RAG 검색 실행
          const ragResponse = await searchMedicalDocuments(messageContent);

          // Mock citations 생성 (실제로는 RAG 결과에서 가져옴)
          const mockCitations: Citation[] = ragResults.map(result => ({
            source: result.source,
            content: result.content,
            confidence: result.confidence,
            citation: result.citation,
            category: result.category,
            page: result.page
          }));

          let responseContent = '안녕하세요! 궁금한 점에 대해 도움을 드리겠습니다.';

          // 질문에 따른 Mock 응답
          if (messageContent.includes('엽산')) {
            responseContent = `임신 전과 임신 초기에 엽산 복용은 매우 중요합니다.

**권장 복용량:**
- 임신 계획 시점부터 임신 12주까지
- 하루 400-800μg 복용

**효과:**
- 신경관 결함 예방
- 태아의 건강한 발달 지원

⚠️ **주의사항**: 정확한 복용량과 제품 선택은 담당 의사와 상담하시기 바랍니다.`;
          } else if (messageContent.includes('임신 초기')) {
            responseContent = `임신 초기는 태아 발달에 매우 중요한 시기입니다.

**주요 증상:**
- 입덧 (6-8주부터 시작)
- 가슴 팽만감
- 피로감 증가
- 소변 횟수 증가

**주의사항:**
- 알코올, 흡연 금지
- 생선회, 덜 익힌 고기 피하기
- 카페인 제한 (하루 200mg 이하)

🏥 **권장사항**: 임신 6-8주경 첫 산전진료를 받으시기 바랍니다.`;
          }

          setNewChatMessages(prev => [...prev, {
            role: 'assistant',
            content: responseContent,
            citations: mockCitations.length > 0 ? mockCitations : undefined
          }]);
          setNewChatLoading(false);
        }, 1500);
      } else if (selectedChatId) {
        // For existing chats, we'd use the real chat system
        originalHandleSubmit(e);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      setAttachedFiles(prev => [...prev, ...newFiles]);
      newFiles.forEach(file => {
        toast.success(`${file.name} 첨부됨`);
      });
    }
    e.target.value = '';
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={cn(
        'transition-all duration-300 border-r border-gray-200',
        sidebarOpen ? 'w-64' : 'w-0 overflow-hidden'
      )}>
        <div className="h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">채팅</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="사이드바 닫기"
            >
              <X size={18} />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="p-3">
            <button
              onClick={() => {
                setSelectedChatId(null);
                setInput('');
                setAttachedFiles([]);
              }}
              className="w-full flex items-center gap-3 p-3 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Plus size={16} />
              새로운 채팅
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => setSelectedChatId(chat.id)}
                className={cn(
                  'group mx-3 p-3 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors',
                  selectedChatId === chat.id && 'bg-gray-100'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <MessageSquare size={16} className="text-gray-500 flex-shrink-0" />
                    <div className="text-sm text-gray-900 truncate">
                      {chat.title}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: 메뉴 구현
                      }}
                      className="p-1 hover:bg-gray-200 rounded"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-lg font-semibold">부인과 AI 상담</h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          {!selectedChatId && newChatMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">👩‍⚕️</span>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                부인과 AI 상담사입니다
              </h2>
              <p className="text-gray-600 max-w-md">
                임신, 출산, 여성 건강에 대한 궁금한 점을 편하게 물어보세요.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto">
              {/* Show new chat messages if no chat selected */}
              {!selectedChatId && newChatMessages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'mb-4 flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[70%] p-4 rounded-2xl',
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                    {message.role === 'assistant' && message.citations && (
                      <CitationSources citations={message.citations} className="mt-3" />
                    )}
                  </div>
                </div>
              ))}

              {/* Show selected chat messages */}
              {selectedChatId && mockMessages[selectedChatId]?.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'mb-4 flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      'max-w-[70%] p-4 rounded-2xl',
                      message.role === 'user'
                        ? 'bg-blue-500 text-white rounded-br-md'
                        : 'bg-gray-100 text-gray-900 rounded-bl-md'
                    )}
                  >
                    <div className="whitespace-pre-wrap">{message.content}</div>
                  </div>
                </div>
              ))}

              {newChatLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-gray-100 p-4 rounded-2xl rounded-bl-md">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4">
          <div className="max-w-3xl mx-auto">
            {/* File Previews */}
            {attachedFiles.length > 0 && (
              <div className="mb-3">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="relative bg-gray-100 border border-gray-200 rounded-lg p-2 flex items-center gap-2"
                    >
                      {file.type.startsWith('image/') ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-8 h-8 object-cover rounded"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                          <span className="text-xs text-blue-600">📄</span>
                        </div>
                      )}
                      <span className="text-xs text-gray-600 max-w-20 truncate">
                        {file.name}
                      </span>
                      <button
                        onClick={() => {
                          setAttachedFiles(prev => prev.filter((_, i) => i !== index));
                          toast.success('파일이 제거되었습니다');
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-end gap-2 p-3 border border-gray-300 rounded-xl bg-white">
                {/* File Upload */}
                <div className="flex-shrink-0">
                  <input
                    type="file"
                    id="file-upload"
                    accept="image/*,.pdf,.doc,.docx"
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Paperclip size={18} className="text-gray-500" />
                  </label>
                </div>

                {/* Text Input */}
                <div className="flex-1">
                  <textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      handleInputChange(e);
                    }}
                    placeholder="메시지를 입력하세요..."
                    disabled={newChatLoading}
                    rows={1}
                    className="w-full resize-none border-0 focus:ring-0 focus:outline-none bg-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e as any);
                      }
                    }}
                    style={{
                      minHeight: '24px',
                      maxHeight: '120px'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                    }}
                  />
                </div>

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={(!input.trim() && attachedFiles.length === 0) || newChatLoading}
                  className={cn(
                    'flex-shrink-0 p-2 rounded-lg transition-colors',
                    (input.trim() || attachedFiles.length > 0) && !newChatLoading
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  )}
                >
                  <Send size={18} />
                </button>
              </div>
            </form>

            {/* Disclaimer */}
            <p className="text-xs text-gray-500 text-center mt-2">
              AI 상담은 참고용이며, 정확한 진단은 전문의와 상담하세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}