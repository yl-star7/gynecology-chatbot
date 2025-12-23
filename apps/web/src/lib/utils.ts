import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names using clsx and tailwind-merge for optimal class merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format time for chat messages
 */
export function formatMessageTime(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

/**
 * Format date for chat headers
 */
export function formatMessageDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  return date.toDateString() === yesterday.toDateString()
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
  return passwordRegex.test(password)
}

/**
 * Get relative time for messages (오늘, 어제, etc.)
 */
export function getRelativeTime(date: Date): string {
  if (isToday(date)) {
    return '오늘'
  } else if (isYesterday(date)) {
    return '어제'
  } else {
    return formatMessageDate(date)
  }
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Generate a random ID for messages or components
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Scroll to bottom of element smoothly
 */
export function scrollToBottom(element: HTMLElement, smooth = true): void {
  element.scrollTo({
    top: element.scrollHeight,
    behavior: smooth ? 'smooth' : 'auto',
  })
}

/**
 * Check if user is on mobile device
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Safe area inset detection for mobile devices
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, bottom: 0, left: 0, right: 0 }
  }
  
  const style = getComputedStyle(document.documentElement)
  return {
    top: parseInt(style.getPropertyValue('env(safe-area-inset-top)') || '0'),
    bottom: parseInt(style.getPropertyValue('env(safe-area-inset-bottom)') || '0'),
    left: parseInt(style.getPropertyValue('env(safe-area-inset-left)') || '0'),
    right: parseInt(style.getPropertyValue('env(safe-area-inset-right)') || '0'),
  }
}

/**
 * Validate Korean text input
 */
export function validateKoreanInput(text: string): boolean {
  const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/
  return koreanRegex.test(text) || /^[a-zA-Z0-9\s.,?!]*$/.test(text)
}

/**
 * Format pregnancy week
 */
export function formatPregnancyWeek(weeks: number): string {
  if (weeks < 1) return '임신 준비'
  if (weeks > 40) return '출산 후'
  
  const trimester = weeks <= 12 ? '초기' : weeks <= 28 ? '중기' : '후기'
  return `임신 ${trimester} (${weeks}주)`
}

/**
 * Get pregnancy trimester info
 */
export function getPregnancyTrimester(weeks: number): {
  trimester: string
  period: string
  description: string
} {
  if (weeks <= 12) {
    return {
      trimester: '1분기',
      period: '임신 초기',
      description: '중요한 기관 형성 시기입니다.'
    }
  } else if (weeks <= 28) {
    return {
      trimester: '2분기',
      period: '임신 중기',
      description: '가장 안정적인 시기입니다.'
    }
  } else {
    return {
      trimester: '3분기',
      period: '임신 후기',
      description: '출산 준비 시기입니다.'
    }
  }
}

/**
 * Medical emergency keywords detection
 */
export function detectEmergencyKeywords(text: string): boolean {
  const emergencyKeywords = [
    '출혈', '극심한 통증', '호흡곤란', '의식잃음', '경련', '심한 두통',
    '시야 흐림', '갑작스런 부종', '태동 없음', '양수 파수'
  ]
  
  return emergencyKeywords.some(keyword => text.includes(keyword))
}

/**
 * Sanitize user input for safety
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .trim()
    .substring(0, 1000) // Limit length
}