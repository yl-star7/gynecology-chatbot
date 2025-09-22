import { streamText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { GeminiClient, GEMINI_MODELS, type GeminiModel } from './gemini';
import { VertexRAGClient, MEDICAL_CATEGORIES } from './vertex-rag';
import { medicalSafetyValidator, MEDICAL_DISCLAIMER } from './medical-safety';
import { pregnancyPersonalizationService } from './pregnancy-personalization';
import type {
  Message,
  ChatRequest,
  ChatResponse,
  RAGSource,
  MedicalWarning,
  ChatContext,
  StreamingChatResponse,
  ChatSettings
} from '@/types/chat';

// Chat handler configuration
export interface ChatHandlerConfig {
  model?: GeminiModel;
  useRAG?: boolean;
  streamingEnabled?: boolean;
  ragMaxResults?: number;
  ragMinRelevance?: number;
  settings?: Partial<ChatSettings>;
}

// Default configuration
const DEFAULT_CONFIG: Required<ChatHandlerConfig> = {
  model: GEMINI_MODELS.PRO,
  useRAG: true,
  streamingEnabled: true,
  ragMaxResults: 3,
  ragMinRelevance: 0.7,
  settings: {},
};

/**
 * Unified chat handler that combines Gemini with RAG
 */
export class ChatHandler {
  private geminiClient: GeminiClient;
  private ragClient: VertexRAGClient;
  private config: Required<ChatHandlerConfig>;

  constructor(config?: ChatHandlerConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize clients
    this.geminiClient = new GeminiClient(this.config.model, this.config.settings);
    this.ragClient = new VertexRAGClient({
      maxResults: this.config.ragMaxResults,
      minRelevanceScore: this.config.ragMinRelevance,
    });
  }

  /**
   * Handle streaming chat request with medical safety validation
   */
  async handleStreamingChat(
    request: ChatRequest,
    messages: Message[],
    onChunk: (response: StreamingChatResponse) => void
  ): Promise<ChatResponse> {
    try {
      // Generate a unique message ID
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Step 0: Pre-validate user query for safety
      const queryValidation = await medicalSafetyValidator.validateQuery(
        request.message,
        request.context
      );

      if (!queryValidation.isValid) {
        // Return safe response for blocked queries
        const safeResponse = ' 안전한 의료 정보 제공을 위해 이 질문에 대해서는 답변을 드리기 어렵습니다. 의료진과 직접 상담하시기 바랍니다.';

        const responseMessage: Message = {
          id: messageId,
          conversationId: request.conversationId || 'temp',
          role: 'assistant',
          content: safeResponse + '\n\n' + MEDICAL_DISCLAIMER,
          timestamp: new Date(),
          metadata: {
            isStreaming: true,
            safetyBlocked: true,
          },
        };

        return {
          message: responseMessage,
          warnings: queryValidation.warnings,
        };
      }

      // Step 1: Retrieve RAG sources if enabled
      let ragSources: RAGSource[] = [];
      let ragContext = '';

      if (this.config.useRAG) {
        // Determine relevant categories based on context
        const categories = this.determineCategories(request.message, request.context);
        
        // Search for relevant information
        ragSources = await this.ragClient.search(request.message, {
          categories: categories.length > 0 ? categories as string[] : undefined,
        });

        // Format RAG context for the LLM
        if (ragSources.length > 0) {
          ragContext = this.ragClient.formatRAGContext(ragSources);
        }
      }

      // Step 2: Extract medical entities for better context
      const entities = await this.ragClient.extractMedicalEntities(request.message);

      // Step 3: Generate personalized context for pregnancy stage
      let personalizationContext = '';
      if (request.context?.pregnancyWeek) {
        personalizationContext = pregnancyPersonalizationService.generateQueryContext(
          request.message,
          request.context
        );
      }

      // Step 4: Enhance the user message with context
      const enhancedMessages = this.enhanceMessagesWithContext(
        messages,
        request.context,
        entities,
        ragContext,
        personalizationContext
      );

      // Step 4: Stream response from Gemini
      let fullResponse = '';
      const startTime = Date.now();

      const result = await this.geminiClient.streamChat(
        enhancedMessages,
        (chunk) => {
          fullResponse += chunk;
          onChunk({
            chunk,
            isComplete: false,
            messageId,
            sources: ragSources.length > 0 ? ragSources : undefined,
          });
        },
        ragContext
      );

      // Step 5: Validate AI response for medical safety
      const responseValidation = await medicalSafetyValidator.validateResponse(
        fullResponse,
        request.message,
        request.context
      );

      let finalResponse = fullResponse;
      const allWarnings = [...queryValidation.warnings];

      if (!responseValidation.isValid || responseValidation.sanitizedResponse) {
        finalResponse = responseValidation.sanitizedResponse || fullResponse;
      }

      // Add safety warnings
      allWarnings.push(...responseValidation.requiredWarnings);

      // Step 6: Detect additional medical warnings
      const geminiWarnings = this.geminiClient.detectMedicalWarnings(finalResponse);
      allWarnings.push(...geminiWarnings);

      // Step 7: Generate follow-up suggestions
      const allMessages = [...messages, {
        id: messageId,
        conversationId: request.conversationId || 'temp',
        role: 'assistant' as const,
        content: finalResponse,
        timestamp: new Date(),
      }];
      const suggestions = this.geminiClient.generateSuggestions(allMessages);

      // Step 8: Log compliance audit
      await medicalSafetyValidator.logComplianceAudit(
        messageId,
        request.context?.userId,
        request.message,
        finalResponse,
        [...responseValidation.violations, ...queryValidation.violations]
      );

      // Step 9: Send completion signal
      onChunk({
        chunk: '',
        isComplete: true,
        messageId,
        sources: ragSources.length > 0 ? ragSources : undefined,
      });

      // Step 10: Create response message
      const responseMessage: Message = {
        id: messageId,
        conversationId: request.conversationId || 'temp',
        role: 'assistant',
        content: finalResponse,
        timestamp: new Date(),
        metadata: {
          model: this.config.model,
          temperature: this.geminiClient.getSettings().temperature,
          maxTokens: this.geminiClient.getSettings().maxTokens,
          processingTime: Date.now() - startTime,
          tokenCount: result.usage?.totalTokens,
          isStreaming: true,
          safetyValidated: true,
          violationCount: responseValidation.violations.length + queryValidation.violations.length,
        },
        ragSources: ragSources.length > 0 ? ragSources : undefined,
      };

      // Add medical disclaimer for all medical responses
      if (allWarnings.length > 0) {
        responseMessage.content += '\n\n' + MEDICAL_DISCLAIMER;
      }

      return {
        message: responseMessage,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        warnings: allWarnings.length > 0 ? allWarnings : undefined,
        sources: ragSources.length > 0 ? ragSources : undefined,
      };
    } catch (error) {
      console.error('Chat handler error:', error);
      throw new Error(`채팅 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * Handle non-streaming chat request
   */
  async handleChat(request: ChatRequest, messages: Message[]): Promise<ChatResponse> {
    try {
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Similar process as streaming, but without chunks
      let ragSources: RAGSource[] = [];
      let ragContext = '';

      if (this.config.useRAG) {
        const categories = this.determineCategories(request.message, request.context);
        ragSources = await this.ragClient.search(request.message, {
          categories: categories.length > 0 ? categories as string[] : undefined,
        });

        if (ragSources.length > 0) {
          ragContext = this.ragClient.formatRAGContext(ragSources);
        }
      }

      const entities = await this.ragClient.extractMedicalEntities(request.message);
      const enhancedMessages = this.enhanceMessagesWithContext(
        messages,
        request.context,
        entities,
        ragContext
      );

      const startTime = Date.now();
      const result = await this.geminiClient.generateChat(enhancedMessages, ragContext);

      const warnings = this.geminiClient.detectMedicalWarnings(result.content);
      
      const allMessages = [...messages, {
        id: messageId,
        conversationId: request.conversationId || 'temp',
        role: 'assistant' as const,
        content: result.content,
        timestamp: new Date(),
      }];
      const suggestions = this.geminiClient.generateSuggestions(allMessages);

      const responseMessage: Message = {
        id: messageId,
        conversationId: request.conversationId || 'temp',
        role: 'assistant',
        content: result.content,
        timestamp: new Date(),
        metadata: {
          model: this.config.model,
          temperature: this.geminiClient.getSettings().temperature,
          maxTokens: this.geminiClient.getSettings().maxTokens,
          processingTime: Date.now() - startTime,
          tokenCount: result.usage?.totalTokens,
          isStreaming: false,
        },
        ragSources: ragSources.length > 0 ? ragSources : undefined,
      };

      return {
        message: responseMessage,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
        sources: ragSources.length > 0 ? ragSources : undefined,
      };
    } catch (error) {
      console.error('Chat handler error:', error);
      throw new Error(`채팅 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  /**
   * Create a streaming response for Vercel AI SDK's useChat hook
   */
  async createStreamResponse(
    request: ChatRequest,
    messages: Message[]
  ): Promise<ReadableStream> {
    const google = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || '',
    });

    // Get RAG context if enabled
    let ragContext = '';
    if (this.config.useRAG) {
      const categories = this.determineCategories(request.message, request.context);
      const ragSources = await this.ragClient.search(request.message, {
        categories: categories.length > 0 ? categories as string[] : undefined,
      });

      if (ragSources.length > 0) {
        ragContext = this.ragClient.formatRAGContext(ragSources);
      }
    }

    // Prepare messages for streaming
    const formattedMessages = messages.map(msg => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
    }));

    // Add RAG context to the last user message
    if (ragContext) {
      const lastUserIndex = formattedMessages.findLastIndex(m => m.role === 'user');
      if (lastUserIndex !== -1) {
        formattedMessages[lastUserIndex].content = 
          `참고 정보:\n${ragContext}\n\n사용자 질문: ${formattedMessages[lastUserIndex].content}`;
      }
    }

    // Create streaming response
    const result = await streamText({
      model: google(this.config.model),
      messages: formattedMessages,
      temperature: this.geminiClient.getSettings().temperature,
      maxOutputTokens: this.geminiClient.getSettings().maxTokens,
      system: this.geminiClient.getSettings().systemPrompt,
    });

    return result.toTextStreamResponse().body as ReadableStream;
  }

  /**
   * Determine relevant medical categories based on message and context
   */
  private determineCategories(message: string, context?: ChatContext): string[] {
    const categories: string[] = [];
    const messageLower = message.toLowerCase();

    // Check message content for category keywords
    if (messageLower.includes('임신') || messageLower.includes('태아') || messageLower.includes('출산')) {
      categories.push(MEDICAL_CATEGORIES.PREGNANCY);
    }
    if (messageLower.includes('산전') || messageLower.includes('검사')) {
      categories.push(MEDICAL_CATEGORIES.PRENATAL);
    }
    if (messageLower.includes('산후') || messageLower.includes('수유') || messageLower.includes('모유')) {
      categories.push(MEDICAL_CATEGORIES.POSTNATAL);
    }
    if (messageLower.includes('피임') || messageLower.includes('가족계획')) {
      categories.push(MEDICAL_CATEGORIES.CONTRACEPTION);
    }
    if (messageLower.includes('생리') || messageLower.includes('월경')) {
      categories.push(MEDICAL_CATEGORIES.MENSTRUATION);
    }
    if (messageLower.includes('갱년기') || messageLower.includes('폐경')) {
      categories.push(MEDICAL_CATEGORIES.MENOPAUSE);
    }
    if (messageLower.includes('난임') || messageLower.includes('불임')) {
      categories.push(MEDICAL_CATEGORIES.FERTILITY);
    }
    if (messageLower.includes('영양') || messageLower.includes('비타민') || messageLower.includes('엽산')) {
      categories.push(MEDICAL_CATEGORIES.NUTRITION);
    }

    // Check context for additional categories
    if (context?.pregnancyWeek) {
      categories.push(MEDICAL_CATEGORIES.PREGNANCY);
      categories.push(MEDICAL_CATEGORIES.PRENATAL);
    }

    // Default to general gynecology if no specific category
    if (categories.length === 0) {
      categories.push(MEDICAL_CATEGORIES.GYNECOLOGY);
    }

    return [...new Set(categories)]; // Remove duplicates
  }

  /**
   * Enhance messages with additional context
   */
  private enhanceMessagesWithContext(
    messages: Message[],
    context?: ChatContext,
    entities?: Record<string, string[]>,
    ragContext?: string,
    personalizationContext?: string
  ): Message[] {
    const enhancedMessages = [...messages];

    // Add context to the last user message if available
    if (context && enhancedMessages.length > 0) {
      const lastUserIndex = enhancedMessages.findLastIndex(m => m.role === 'user');
      if (lastUserIndex !== -1) {
        let contextInfo = '\n\n[환자 정보]';
        if (context.pregnancyWeek) {
          contextInfo += `\n- 임신 주수: ${context.pregnancyWeek}주`;
        }
        if (context.symptoms && context.symptoms.length > 0) {
          contextInfo += `\n- 증상: ${context.symptoms.join(', ')}`;
        }
        if (context.medications && context.medications.length > 0) {
          contextInfo += `\n- 복용 약물: ${context.medications.join(', ')}`;
        }
        if (context.previousConditions && context.previousConditions.length > 0) {
          contextInfo += `\n- 기존 질환: ${context.previousConditions.join(', ')}`;
        }

        enhancedMessages[lastUserIndex] = {
          ...enhancedMessages[lastUserIndex],
          content: enhancedMessages[lastUserIndex].content + contextInfo,
        };
      }
    }

    // Add extracted entities as context
    if (entities && Object.values(entities).some((arr: string[]) => arr.length > 0)) {
      const lastUserIndex = enhancedMessages.findLastIndex(m => m.role === 'user');
      if (lastUserIndex !== -1) {
        let entityInfo = '\n\n[인식된 의료 정보]';
        if (entities.symptoms?.length > 0) {
          entityInfo += `\n- 증상: ${entities.symptoms.join(', ')}`;
        }
        if (entities.conditions?.length > 0) {
          entityInfo += `\n- 질환: ${entities.conditions.join(', ')}`;
        }
        if (entities.medications?.length > 0) {
          entityInfo += `\n- 약물: ${entities.medications.join(', ')}`;
        }
        if (entities.procedures?.length > 0) {
          entityInfo += `\n- 검사/시술: ${entities.procedures.join(', ')}`;
        }

        enhancedMessages[lastUserIndex] = {
          ...enhancedMessages[lastUserIndex],
          content: enhancedMessages[lastUserIndex].content + entityInfo,
        };
      }
    }

    // Add personalization context
    if (personalizationContext && enhancedMessages.length > 0) {
      const lastUserIndex = enhancedMessages.findLastIndex(m => m.role === 'user');
      if (lastUserIndex !== -1) {
        enhancedMessages[lastUserIndex] = {
          ...enhancedMessages[lastUserIndex],
          content: enhancedMessages[lastUserIndex].content + personalizationContext,
        };
      }
    }

    return enhancedMessages;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ChatHandlerConfig>) {
    this.config = { ...this.config, ...config };
    
    // Update client configurations
    if (config.model) {
      this.geminiClient = new GeminiClient(config.model, this.config.settings);
    }
    if (config.settings) {
      this.geminiClient.updateSettings(config.settings);
    }
    if (config.ragMaxResults !== undefined || config.ragMinRelevance !== undefined) {
      this.ragClient.updateConfig({
        maxResults: config.ragMaxResults,
        minRelevanceScore: config.ragMinRelevance,
      });
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ChatHandlerConfig {
    return { ...this.config };
  }
}

// Export default instance
export const chatHandler = new ChatHandler();