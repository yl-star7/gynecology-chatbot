'use client'

import { useState, useCallback, useRef } from 'react'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt?: Date
}

export interface UseChatOptions {
  api?: string
  initialMessages?: ChatMessage[]
  body?: Record<string, unknown>
  onResponse?: (response: Response) => void | Promise<void>
  onError?: (error: Error) => void
}

export interface UseChatReturn {
  messages: ChatMessage[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent) => void | Promise<void>
  setInput: (input: string) => void
  isLoading: boolean
  error: Error | null
  reload: () => void
  stop: () => void
  setMessages: (messages: ChatMessage[]) => void
  append: (message: { role: 'user' | 'assistant' | 'system'; content: string }) => Promise<void>
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    api = '/api/chat',
    initialMessages = [],
    body = {},
    onResponse,
    onError
  } = options

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const generateId = () => Math.random().toString(36).substring(2, 15)

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  const append = useCallback(async (message: { role: 'user' | 'assistant' | 'system'; content: string }) => {
    const newMessage: ChatMessage = {
      id: generateId(),
      role: message.role,
      content: message.content,
      createdAt: new Date()
    }

    // Add user message immediately
    const updatedMessages = [...messages, newMessage]
    setMessages(updatedMessages)
    setIsLoading(true)
    setError(null)

    // Create assistant message placeholder
    const assistantMessageId = generateId()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date()
    }
    
    setMessages(prev => [...prev, assistantMessage])

    try {
      // Create abort controller for this request
      abortControllerRef.current = new AbortController()

      const response = await fetch(api, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages,
          stream: true,
          ...body
        }),
        signal: abortControllerRef.current.signal
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Call onResponse if provided
      if (onResponse) {
        await onResponse(response)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No reader available')
      }

      let assistantContent = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        buffer += chunk
        
        // Split by newlines and process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep the last potentially incomplete line in buffer

        for (const line of lines) {
          if (line.trim() === '') continue
          
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            
            if (data === '[DONE]') {
              break
            }

            try {
              const parsed = JSON.parse(data)
              
              // Handle different response formats
              if (parsed.type === 'text-delta' && parsed.textDelta) {
                // AI SDK text delta format
                assistantContent += parsed.textDelta
              } else if (parsed.choices && parsed.choices[0]?.delta?.content) {
                // OpenAI-style streaming format
                assistantContent += parsed.choices[0].delta.content
              } else if (parsed.content) {
                // Simple content format
                assistantContent += parsed.content
              } else if (typeof parsed === 'string') {
                // Plain string content
                assistantContent += parsed
              }

              // Update the assistant message with accumulated content
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              )
            } catch {
              // If JSON parsing fails, treat as plain text if it doesn't look like SSE control
              if (data.trim() && !data.startsWith('0:') && !data.startsWith('8:') && !data.startsWith('d:')) {
                assistantContent += data
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: assistantContent }
                      : msg
                  )
                )
              }
            }
          }
        }
      }

      reader.releaseLock()
    } catch (error) {
      const err = error as Error
      
      // Don't show error if request was aborted
      if (err.name !== 'AbortError') {
        setError(err)
        if (onError) {
          onError(err)
        }
        
        // Remove the failed assistant message
        setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [messages, api, body, onResponse, onError])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!input.trim() || isLoading) {
      return
    }

    const userMessage = input.trim()
    setInput('')

    await append({
      role: 'user',
      content: userMessage
    })
  }, [input, isLoading, append])

  const reload = useCallback(() => {
    if (messages.length === 0) return

    // Find the last user message and regenerate response
    const lastUserMessageIndex = messages.findLastIndex(msg => msg.role === 'user')
    if (lastUserMessageIndex === -1) return

    const messagesUpToLastUser = messages.slice(0, lastUserMessageIndex + 1)
    setMessages(messagesUpToLastUser)

    const lastUserMessage = messages[lastUserMessageIndex]
    append({
      role: 'user',
      content: lastUserMessage.content
    })
  }, [messages, append])

  const stop = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setIsLoading(false)
  }, [])

  return {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    isLoading,
    error,
    reload,
    stop,
    setMessages,
    append
  }
}