'use client'

import { useChat } from '@/hooks/use-custom-chat'

export default function TestChatPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading
  } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: '안녕하세요! 부인과 AI 상담사입니다. 궁금한 점을 물어보세요.',
        createdAt: new Date()
      }
    ]
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-2xl font-bold text-center mb-8">
          Chat Test Page
        </h1>
        
        {/* Messages */}
        <div className="space-y-4 mb-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`p-4 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-100 ml-12'
                  : 'bg-white mr-12 shadow-sm'
              }`}
            >
              <div className="font-medium text-sm mb-1">
                {message.role === 'user' ? '사용자' : 'AI 상담사'}
              </div>
              <div>{message.content}</div>
            </div>
          ))}
          
          {isLoading && (
            <div className="bg-white mr-12 shadow-sm p-4 rounded-lg">
              <div className="font-medium text-sm mb-1">AI 상담사</div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-gray-600">답변 중...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="궁금한 점을 입력해주세요..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            전송
          </button>
        </form>
      </div>
    </div>
  )
}