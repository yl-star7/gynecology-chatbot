import { useChat } from './use-custom-chat';
import { useState, useCallback } from 'react';
import type { ChatContext, MedicalWarning, RAGSource } from '@/types/chat';

export interface UseGynecologyChatOptions {
  conversationId?: string;
  context?: ChatContext;
  onWarning?: (warnings: MedicalWarning[]) => void;
  onSources?: (sources: RAGSource[]) => void;
}

export function useGynecologyChat(options?: UseGynecologyChatOptions) {
  const [warnings, setWarnings] = useState<MedicalWarning[]>([]);
  const [sources, setSources] = useState<RAGSource[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [ragResults, setRagResults] = useState<any[]>([]);

  const chat = useChat({
    api: '/api/chat',
    body: {
      conversationId: options?.conversationId,
      context: options?.context,
    },
    onError: (error) => {
      console.error('Chat error:', error);
      const errorWarning: MedicalWarning = {
        severity: 'warning',
        message: '응답을 생성하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        action: '문제가 계속되면 고객 지원팀에 문의하세요.',
      };
      setWarnings([errorWarning]);
      options?.onWarning?.([errorWarning]);
    },
  });

  const sendSuggestion = useCallback(
    (suggestion: string) => {
      chat.append({
        role: 'user',
        content: suggestion,
      });
    },
    [chat]
  );

  const hasUrgentWarning = useCallback(() => {
    return warnings.some(w => w.severity === 'urgent');
  }, [warnings]);

  const getFormattedSources = useCallback(() => {
    return sources.map(source => ({
      title: source.title,
      summary: (source.content || '').substring(0, 200) + '...',
      url: source.url,
      relevance: Math.round((source.relevanceScore || 0) * 100),
      category: source.category,
    }));
  }, [sources]);

  return {
    messages: chat.messages,
    input: chat.input,
    handleInputChange: chat.handleInputChange,
    handleSubmit: chat.handleSubmit,
    setInput: chat.setInput,
    isLoading: chat.isLoading,
    error: chat.error,
    reload: chat.reload,
    stop: chat.stop,
    setMessages: chat.setMessages,
    append: chat.append,
    sendSuggestion,
    warnings,
    sources,
    suggestions,
    ragResults,
    hasUrgentWarning,
    getFormattedSources,
  };
}

export const PRESET_PROMPTS = {
  pregnancy: {
    firstTrimester: [
      '임신 초기 증상은 어떤 것들이 있나요?',
      '임신 초기에 먹으면 안 되는 음식이 있나요?',
      '입덧을 완화하는 방법을 알려주세요',
    ],
    secondTrimester: [
      '태동은 언제부터 느낄 수 있나요?',
      '임신 중기 검사는 어떤 것들이 있나요?',
      '임신 중 운동은 어떻게 하는 것이 좋나요?',
    ],
    thirdTrimester: [
      '출산 신호는 어떤 것들이 있나요?',
      '진통이 시작되면 언제 병원에 가야 하나요?',
      '제왕절개 후 회복 과정이 궁금해요',
    ],
  },
  generalHealth: [
    '생리불순의 원인과 치료법을 알려주세요',
    '자궁경부암 검사는 언제 받아야 하나요?',
    '난소낭종이 발견되었는데 치료가 필요한가요?',
  ],
  fertility: [
    '임신 준비 중인데 어떤 검사를 받아야 하나요?',
    '배란일 계산 방법을 알려주세요',
    '난임 검사는 언제부터 시작해야 하나요?',
  ],
  menopause: [
    '갱년기 증상은 어떤 것들이 있나요?',
    '호르몬 대체 요법의 장단점을 알려주세요',
    '갱년기에 좋은 운동과 식단을 추천해주세요',
  ],
};