'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useGynecologyChat } from '@/hooks/use-gynecology-chat';
import { createClient } from '@/lib/supabase-client';
import { ConversationMetadata } from '@/types';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = use(params);
  const [conversation, setConversation] = useState<ConversationMetadata | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  // Vercel AI SDK의 useChat 사용 (특정 대화 ID로)
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit, 
    isLoading: isChatLoading,
    error
  } = useGynecologyChat({
    conversationId: conversationId // 특정 대화 ID 사용
  });

  // 대화 데이터 로드
  useEffect(() => {
    const loadConversationData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('User fetch error:', userError);
          router.push('/login');
          return;
        }

        // 대화 정보 가져오기
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select('*')
          .eq('id', conversationId)
          .eq('user_id', user.id)
          .single();

        if (conversationError) {
          console.error('Conversation fetch error:', conversationError);
          toast.error('대화를 찾을 수 없습니다.');
          router.push('/chat');
          return;
        }

        if (conversationData) {
          setConversation(conversationData);
        } else {
          toast.error('해당 대화에 접근할 권한이 없습니다.');
          router.push('/chat');
          return;
        }

      } catch (error) {
        console.error('Data loading error:', error);
        toast.error('대화를 불러오는 중 오류가 발생했습니다.');
        router.push('/chat');
      } finally {
        setIsLoading(false);
      }
    };

    if (conversationId) {
      loadConversationData();
    } else {
      router.push('/chat');
    }
  }, [conversationId, router, supabase]);

  // 채팅 오류 처리
  useEffect(() => {
    if (error) {
      console.error('Chat error:', error);
      toast.error('채팅 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }, [error]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-light/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h2 className="text-lg font-medium text-neutral-800 mb-2">대화 불러오는 중...</h2>
            <p className="text-neutral-600 text-sm">이전 상담 내역을 불러오고 있습니다</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden bg-gradient-to-br from-neutral-50 to-secondary-50/30">
      {/* 상단 헤더 */}
      <div className="absolute top-0 left-0 right-0 z-30 bg-white/90 backdrop-blur-sm border-b border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => router.push('/chat')}
              className="p-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 hover:text-neutral-800 transition-all duration-200"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5 text-primary-500" />
                <h1 className="font-medium text-neutral-800">
                  {conversation?.title || '이전 상담'}
                </h1>
              </div>
              <p className="text-sm text-neutral-500">
                {conversation?.created_at && 
                  new Date(conversation.created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 채팅 인터페이스 */}
      <div className="h-full pt-20 pb-20">
        <div className="flex flex-col h-full">
          {/* Messages display */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg: { id: string; content: string; role: string }) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Chat input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="부인과 관련 궁금한 점을 편하게 물어보세요..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                disabled={isChatLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isChatLoading}
                className="px-6 py-2 bg-primary-500 text-white rounded-lg disabled:opacity-50 hover:bg-primary-600 transition-colors"
              >
                전송
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
