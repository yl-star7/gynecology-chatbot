# AI Integration Documentation

## Overview

This gynecology chatbot integrates Google's Gemini API with a Vertex AI RAG (Retrieval-Augmented Generation) system to provide accurate, context-aware medical information with Korean language support.

## Architecture

### Components

1. **Gemini API Client** (`/src/lib/gemini.ts`)
   - Integrates with Vercel AI SDK (@ai-sdk/google)
   - Supports streaming and non-streaming responses
   - Medical warning detection
   - Follow-up suggestion generation

2. **Vertex AI RAG Client** (`/src/lib/vertex-rag.ts`)
   - Medical knowledge retrieval
   - Embedding-based search
   - Relevance scoring
   - Medical entity extraction

3. **Unified Chat Handler** (`/src/lib/chat-handler.ts`)
   - Combines Gemini responses with RAG sources
   - Manages streaming with Vercel AI SDK
   - Context enhancement
   - Response augmentation

4. **API Route** (`/src/app/api/chat/route.ts`)
   - Next.js API endpoint
   - Handles both streaming and non-streaming requests
   - Compatible with Vercel AI SDK's useChat hook

5. **React Hook** (`/src/hooks/use-gynecology-chat.ts`)
   - Custom hook built on Vercel AI SDK's useChat
   - Medical context management
   - Warning and source tracking
   - Preset prompts for common questions

## Setup

### 1. Environment Variables

Create a `.env.local` file with the following:

```env
# Required: Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Vertex AI Configuration (for production RAG)
VERTEX_AI_PROJECT_ID=your_project_id
VERTEX_AI_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Optional: Model Selection
GEMINI_MODEL=gemini-1.5-pro-latest
```

### 2. Get Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local` file

### 3. (Optional) Setup Vertex AI

For production RAG capabilities:

1. Create a Google Cloud Project
2. Enable Vertex AI API
3. Create a service account with Vertex AI permissions
4. Download the service account JSON key
5. Set the environment variables

## Usage

### Basic Chat Implementation

```tsx
import { useGynecologyChat } from '@/hooks/use-gynecology-chat';

function ChatComponent() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    warnings,
    sources,
    suggestions,
  } = useGynecologyChat({
    context: {
      pregnancyWeek: 12,
      symptoms: ['morning sickness'],
    }
  });

  return (
    <form onSubmit={handleSubmit}>
      {/* Display messages */}
      {messages.map(m => (
        <div key={m.id}>{m.content}</div>
      ))}
      
      {/* Display warnings */}
      {warnings.map(w => (
        <Alert severity={w.severity}>{w.message}</Alert>
      ))}
      
      {/* Input field */}
      <input value={input} onChange={handleInputChange} />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Direct API Usage

```typescript
// For custom implementations
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      { role: 'user', content: '임신 초기 엽산 섭취량은?' }
    ],
    context: { pregnancyWeek: 8 },
    stream: true, // or false for non-streaming
  }),
});
```

## Features

### 1. System Prompt

The AI is configured with a comprehensive Korean system prompt that:
- Acts as a professional gynecologist
- Provides empathetic, supportive responses
- Always recommends consulting actual doctors for serious conditions
- Uses formal but warm Korean language

### 2. Medical Warning Detection

Automatically detects and categorizes medical warnings:
- **Urgent**: Requires immediate medical attention
- **Warning**: Should consult with a doctor
- **Info**: General medical information

### 3. RAG Integration

The system includes:
- Medical knowledge base search
- Relevance scoring (0-1 scale)
- Source attribution
- Category-based filtering

Current medical categories:
- 임신 및 출산 (Pregnancy & Birth)
- 부인과 질환 (Gynecological Conditions)
- 생식 건강 (Reproductive Health)
- 산전 관리 (Prenatal Care)
- 산후 관리 (Postnatal Care)
- 피임 및 가족계획 (Contraception & Family Planning)
- 월경 및 생리 (Menstruation)
- 갱년기 (Menopause)
- 난임 및 불임 (Fertility Issues)
- 임산부 영양 (Maternal Nutrition)

### 4. Context Enhancement

The system automatically enhances responses based on:
- Pregnancy week
- Current symptoms
- Medications
- Previous conditions
- Extracted medical entities

### 5. Streaming Support

Full support for real-time streaming responses using Vercel AI SDK:
- Token-by-token streaming
- Progress indicators
- Cancelable requests

## Models

### Available Models

- `gemini-1.5-pro-latest`: Higher quality, slower
- `gemini-1.5-flash-latest`: Faster, more cost-effective

### Configuration

```typescript
// In chat-handler.ts or via environment variable
const chatHandler = new ChatHandler({
  model: GEMINI_MODELS.PRO, // or GEMINI_MODELS.FLASH
  temperature: 0.7,
  maxTokens: 2048,
});
```

## Testing

### Test Page

Access the test page at `/test-chat` to try the integration:

```bash
npm run dev
# Open http://localhost:3000/test-chat
```

### Features to Test

1. **Basic Conversation**: Ask medical questions in Korean
2. **Context**: Set pregnancy week and observe contextual responses
3. **Warnings**: Ask about emergency symptoms to see warning system
4. **RAG Sources**: Check the sources section for retrieved knowledge
5. **Suggestions**: Use follow-up suggestions after responses
6. **Streaming**: Observe real-time token streaming

## Production Considerations

### 1. API Key Security

- Never expose API keys in client-side code
- Use environment variables
- Implement rate limiting
- Add authentication middleware

### 2. Error Handling

The system includes comprehensive error handling:
- API failures fallback to mock data
- User-friendly error messages
- Automatic retry logic

### 3. Performance

- Response caching for common questions
- Lazy loading of RAG sources
- Efficient streaming implementation
- Token usage optimization

### 4. Compliance

- No storage of sensitive medical data
- Anonymous session options
- HIPAA compliance considerations
- Clear disclaimers about AI limitations

## Customization

### Adding Medical Knowledge

To add custom medical knowledge to the RAG system:

1. Update `MOCK_KNOWLEDGE_BASE` in `vertex-rag.ts`
2. Or integrate with a vector database (Pinecone, Weaviate, etc.)

### Modifying System Prompt

Edit `DEFAULT_CHAT_SETTINGS.systemPrompt` in `gemini.ts` to customize the AI's behavior.

### Adding New Categories

Add new medical categories in `vertex-rag.ts`:

```typescript
export const MEDICAL_CATEGORIES = {
  // ... existing categories
  NEW_CATEGORY: '새로운 카테고리',
};
```

## Troubleshooting

### Common Issues

1. **"GEMINI_API_KEY is not configured"**
   - Ensure `.env.local` contains valid API key
   - Restart the development server

2. **Streaming not working**
   - Check browser supports EventSource
   - Verify API route returns proper headers

3. **RAG sources not appearing**
   - Check relevance threshold settings
   - Verify knowledge base content

4. **Korean characters displaying incorrectly**
   - Ensure UTF-8 encoding throughout
   - Check font support

## Support

For issues or questions:
1. Check the test page at `/test-chat`
2. Review console logs for detailed errors
3. Verify environment variables are set correctly
4. Check network tab for API responses

## License

This integration is configured for medical information purposes only and should not replace professional medical advice.