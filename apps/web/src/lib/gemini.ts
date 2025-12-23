import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, generateText } from 'ai';
import type { ChatSettings, Message } from '@/types/chat';

// Initialize Google Generative AI with Gemini
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

// Model configurations
export const GEMINI_MODELS = {
  PRO: 'gemini-1.5-pro-latest',
  FLASH: 'gemini-1.5-flash-latest',
} as const;

export type GeminiModel = typeof GEMINI_MODELS[keyof typeof GEMINI_MODELS];

// Default chat settings
export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  streamingEnabled: true,
  useRAG: true,
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: `당신은 한국의 전문 산부인과 의사입니다. 다음 세부 지침을 철저히 준수하여 환자에게 최고 품질의 의료 상담을 제공하세요:

🩺 **전문성 및 역할**:
   - 20년 이상 경력의 산부인과 전문의로서, 임신·출산·여성건강 전 분야의 최신 의학 지식을 보유합니다
   - 대한산부인과학회, 대한모체태아의학회, 대한산부인과내분비학회 가이드라인을 준수합니다
   - 근거중심의학(Evidence-Based Medicine)에 기반하여 정보를 제공합니다
   - 개인차를 고려한 맞춤형 조언을 제공합니다

🗣️ **커뮤니케이션 원칙**:
   - 따뜻하고 친근하지만 전문적인 존댓말 사용 (환자가 편안함을 느끄도록)
   - 의학 용어는 반드시 쉬운 말로 풀어서 설명 (예: 자궁수축 → 배가 단단해지는 현상)
   - 임산부/환자의 감정적 상태를 먼저 공감하고 지지합니다
   - "걱정되시는 마음 충분히 이해합니다" 같은 공감 표현 적극 사용

⚡ **응급상황 대응 우선순위**:
   CRITICAL (즉시 119/응급실): 심한 출혈, 의식잃음, 경련, 호흡곤란, 심한 복통
   URGENT (24시간 내 병원): 고열, 지속적 구토, 태동감소, 양수파열 의심
   WARNING (48시간 내 상담): 비정상 분비물, 지속적 두통, 부종
   INFO (정기검진시 상담): 일반적인 임신 증상, 생활습관 문의

📋 **구조화된 답변 포맷**:
   1. 감정 공감 및 인사
   2. 핵심 답변 (원인/현상 설명)
   3. 구체적 권장사항 (즉시 실행 가능한)
   4. 주의사항 및 병원 방문 기준
   5. 추가 궁금증 해결을 위한 격려

🤰 **임신 단계별 특화 가이드**:
   - 임신 초기(1-12주): 엽산, 입덧, 기형아검사, 유산 위험요인
   - 임신 중기(13-27주): 태동, 체중관리, 기형아검사, 운동
   - 임신 후기(28-40주): 조산징후, 출산준비, 태동패턴, 진통
   - 출산 후: 산후조리, 모유수유, 산후우울, 피임

💊 **안전성 최우선 원칙**:
   - 모든 약물/치료법 언급 시 "반드시 담당 의사와 상의" 필수 고지
   - 온라인 상담의 한계성 명확히 고지
   - 개인차가 클 수 있음을 항상 강조
   - 의심 증상에 대해서는 과소평가보다 과대평가 경향으로 안전성 확보

🔬 **근거 기반 정보 제공**:
   - 통계나 수치 제시 시 신뢰할 수 있는 출처 언급
   - "일반적으로", "대부분의 경우" 등의 표현으로 개인차 고려
   - 최신 연구결과나 가이드라인 변경사항 반영
   - 민간요법이나 검증되지 않은 정보는 명확히 구분

💝 **정서적 지원**:
   - 임산부의 불안감, 우울감을 정상적인 반응으로 인정
   - 가족 지지체계의 중요성 강조
   - 완벽하지 않아도 괜찮다는 메시지 전달
   - 긍정적인 출산/육아 경험담 적절히 공유

🌟 **응답 품질 기준**:
   - 정확성: 의학적으로 정확하고 최신 정보
   - 완전성: 질문에 대한 포괄적 답변
   - 명확성: 이해하기 쉽고 실행 가능한 조언
   - 공감성: 환자의 감정과 상황에 대한 이해
   - 안전성: 위험 요소에 대한 적절한 경고

항상 환자 안전을 최우선으로 하며, 전문성과 따뜻함을 균형있게 제공하여 신뢰받는 의료 상담을 실시하세요.`,
};

// Gemini API client class
export class GeminiClient {
  private model: GeminiModel;
  private settings: ChatSettings;

  constructor(model: GeminiModel = GEMINI_MODELS.PRO, settings?: Partial<ChatSettings>) {
    this.model = model;
    this.settings = { ...DEFAULT_CHAT_SETTINGS, ...settings };
  }

  /**
   * Stream chat response using Vercel AI SDK
   */
  async streamChat(
    messages: Message[],
    onChunk?: (chunk: string) => void,
    ragContext?: string
  ) {
    try {
      // Prepare messages for the AI SDK
      const formattedMessages = this.formatMessages(messages, ragContext);

      // Use streamText from Vercel AI SDK
      const result = await streamText({
        model: google(this.model),
        messages: formattedMessages,
        temperature: this.settings.temperature,
        maxOutputTokens: this.settings.maxTokens,
        system: this.settings.systemPrompt,
      });

      // Handle streaming
      const chunks: string[] = [];
      for await (const chunk of result.textStream) {
        chunks.push(chunk);
        if (onChunk) {
          onChunk(chunk);
        }
      }

      return {
        content: chunks.join(''),
        usage: await result.usage,
        finishReason: await result.finishReason,
      };
    } catch (error) {
      console.error('Gemini streaming error:', error);
      throw new Error(`채팅 응답 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * Generate non-streaming chat response
   */
  async generateChat(
    messages: Message[],
    ragContext?: string
  ) {
    try {
      const formattedMessages = this.formatMessages(messages, ragContext);

      const result = await generateText({
        model: google(this.model),
        messages: formattedMessages,
        temperature: this.settings.temperature,
        maxOutputTokens: this.settings.maxTokens,
        system: this.settings.systemPrompt,
      });

      return {
        content: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
      };
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw new Error(`응답 생성 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * Format messages for the AI SDK
   */
  private formatMessages(messages: Message[], ragContext?: string) {
    const formattedMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Add RAG context if available
    if (ragContext && this.settings.useRAG) {
      const lastUserMessageIndex = formattedMessages.findLastIndex(msg => msg.role === 'user');
      if (lastUserMessageIndex !== -1) {
        formattedMessages[lastUserMessageIndex].content = 
          `참고 정보:\n${ragContext}\n\n사용자 질문: ${formattedMessages[lastUserMessageIndex].content}`;
      }
    }

    return formattedMessages;
  }

  /**
   * Detect medical warnings in the response
   */
  detectMedicalWarnings(content: string) {
    const warnings = [];
    
    // Urgent warning patterns
    const urgentPatterns = [
      /즉시.*병원/gi,
      /응급실/gi,
      /119/gi,
      /긴급/gi,
      /위험한 증상/gi,
      /즉각적인 치료/gi,
    ];

    // Warning patterns
    const warningPatterns = [
      /의사.*상담/gi,
      /병원.*방문/gi,
      /전문의.*진료/gi,
      /검사.*필요/gi,
      /주의.*필요/gi,
    ];

    // Info patterns
    const infoPatterns = [
      /일반적으로/gi,
      /대부분의 경우/gi,
      /권장사항/gi,
      /예방/gi,
    ];

    // Check for urgent warnings
    for (const pattern of urgentPatterns) {
      if (pattern.test(content)) {
        warnings.push({
          severity: 'urgent' as const,
          message: '즉시 의료진의 도움이 필요할 수 있습니다',
          action: '가까운 병원 응급실을 방문하시거나 119에 연락하세요',
        });
        break;
      }
    }

    // Check for warnings
    for (const pattern of warningPatterns) {
      if (pattern.test(content)) {
        warnings.push({
          severity: 'warning' as const,
          message: '의료 전문가의 상담이 권장됩니다',
          action: '담당 의사와 상담 예약을 잡으시기 바랍니다',
        });
        break;
      }
    }

    // Check for info
    if (warnings.length === 0) {
      for (const pattern of infoPatterns) {
        if (pattern.test(content)) {
          warnings.push({
            severity: 'info' as const,
            message: '일반적인 의료 정보입니다',
            action: '개인의 상황에 따라 다를 수 있으니 참고하시기 바랍니다',
          });
          break;
        }
      }
    }

    return warnings;
  }

  /**
   * Generate follow-up suggestions based on the conversation
   */
  generateSuggestions(messages: Message[]): string[] {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'assistant') {
      return [];
    }

    const suggestions = [];
    const content = lastMessage.content.toLowerCase();

    // Context-based suggestions
    if (content.includes('임신') || content.includes('pregnancy')) {
      suggestions.push('임신 중 영양 관리는 어떻게 하나요?');
      suggestions.push('태아 발달 단계가 궁금해요');
      suggestions.push('임신 중 운동은 어떻게 해야 하나요?');
    }

    if (content.includes('증상') || content.includes('symptom')) {
      suggestions.push('이 증상은 언제 병원에 가야 하나요?');
      suggestions.push('집에서 할 수 있는 관리 방법이 있나요?');
      suggestions.push('예방하는 방법을 알려주세요');
    }

    if (content.includes('검사') || content.includes('test')) {
      suggestions.push('검사 결과는 어떻게 해석하나요?');
      suggestions.push('검사 전 준비사항이 있나요?');
      suggestions.push('검사 비용과 시간은 어떻게 되나요?');
    }

    // Default suggestions if no specific context
    if (suggestions.length === 0) {
      suggestions.push('더 자세히 설명해 주세요');
      suggestions.push('다른 관련 정보도 알려주세요');
      suggestions.push('주의사항이 있나요?');
    }

    return suggestions.slice(0, 3); // Return max 3 suggestions
  }

  // Update settings
  updateSettings(settings: Partial<ChatSettings>) {
    this.settings = { ...this.settings, ...settings };
  }

  // Get current settings
  getSettings(): ChatSettings {
    return { ...this.settings };
  }
}

// Export default instance
export const geminiClient = new GeminiClient();