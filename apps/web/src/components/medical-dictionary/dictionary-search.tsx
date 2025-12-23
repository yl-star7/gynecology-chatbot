'use client'

import React, { useState, useEffect } from 'react'
import { Search, X, Filter, ChevronRight, Tag, Calendar, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MedicalDictionaryEntry, MedicalCategory } from '@/types/medical-dictionary'

interface DictionarySearchProps {
  className?: string
  onSelectEntry?: (entry: MedicalDictionaryEntry) => void
  initialCategory?: MedicalCategory
}

const categories: { value: MedicalCategory; label: string; emoji: string }[] = [
  { value: '질병', label: '질병', emoji: '🦠' },
  { value: '증상', label: '증상', emoji: '🤒' },
  { value: '약물', label: '약물', emoji: '💊' },
  { value: '검사', label: '검사', emoji: '🔬' },
  { value: '시술', label: '시술', emoji: '💉' },
  { value: '임신증상', label: '임신증상', emoji: '🤰' },
  { value: '임신합병증', label: '임신합병증', emoji: '⚠️' },
  { value: '영양', label: '영양', emoji: '🥗' },
  { value: '운동', label: '운동', emoji: '🏃‍♀️' },
  { value: '산전관리', label: '산전관리', emoji: '👶' },
  { value: '산후관리', label: '산후관리', emoji: '🤱' }
]

export const DictionarySearch: React.FC<DictionarySearchProps> = ({
  className,
  onSelectEntry,
  initialCategory
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<MedicalCategory | null>(initialCategory || null)
  const [searchResults, setSearchResults] = useState<MedicalDictionaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [trendingTerms, setTrendingTerms] = useState<string[]>([])

  // Fetch trending terms on mount
  useEffect(() => {
    fetchTrendingTerms()
  }, [])

  const fetchTrendingTerms = async () => {
    try {
      const response = await fetch('/api/medical-dictionary/search?trending=true')
      const data = await response.json()
      setTrendingTerms(data.terms || [])
    } catch (error) {
      console.error('Failed to fetch trending terms:', error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedCategory) return

    setIsLoading(true)
    try {
      const params: Record<string, unknown> = {
        search_type: searchQuery ? 'text' : 'category',
        limit: 20
      }

      if (searchQuery) {
        params.query = searchQuery
      }
      if (selectedCategory) {
        params.category = selectedCategory
      }

      const response = await fetch('/api/medical-dictionary/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      })

      const data = await response.json()
      setSearchResults(data.entries || [])
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleTrendingClick = (term: string) => {
    setSearchQuery(term)
    handleSearch()
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSelectedCategory(null)
    setSearchResults([])
  }

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Search Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="의료 용어, 증상, 질병명 검색..."
              className={cn(
                'w-full pl-10 pr-10 py-3 rounded-xl',
                'bg-neutral-50 border-2 border-neutral-200',
                'focus:border-primary-300 focus:bg-white',
                'text-neutral-800 placeholder:text-neutral-400',
                'transition-all duration-200'
              )}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'p-3 rounded-xl border-2 transition-all duration-200',
              showFilters 
                ? 'bg-primary-500 border-primary-500 text-white' 
                : 'bg-white border-neutral-200 text-neutral-600 hover:border-primary-300'
            )}
          >
            <Filter className="w-5 h-5" />
          </button>
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() && !selectedCategory}
            className={cn(
              'px-6 py-3 rounded-xl font-medium transition-all duration-200',
              'bg-gradient-to-r from-primary-500 to-primary-400',
              'text-white shadow-lg shadow-primary-500/30',
              'hover:shadow-xl hover:shadow-primary-500/40',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            검색
          </button>
        </div>

        {/* Category Filters */}
        {showFilters && (
          <div className="flex flex-wrap gap-2 mt-3 pb-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(
                  selectedCategory === cat.value ? null : cat.value
                )}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium',
                  'border transition-all duration-200',
                  selectedCategory === cat.value
                    ? 'bg-primary-500 border-primary-500 text-white'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:border-primary-300'
                )}
              >
                <span className="mr-1">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Trending Terms */}
        {!searchQuery && trendingTerms.length > 0 && searchResults.length === 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-neutral-600 mb-3">
              🔥 인기 검색어
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTerms.map((term) => (
                <button
                  key={term}
                  onClick={() => handleTrendingClick(term)}
                  className={cn(
                    'px-4 py-2 rounded-full',
                    'bg-gradient-to-r from-secondary-100 to-primary-100',
                    'text-neutral-700 text-sm font-medium',
                    'hover:shadow-md transition-all duration-200'
                  )}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4" />
            <p className="text-neutral-600">검색 중...</p>
          </div>
        )}

        {/* Search Results */}
        {!isLoading && searchResults.length > 0 && (
          <div className="space-y-3">
            {searchResults.map((entry) => (
              <button
                key={entry.id}
                onClick={() => onSelectEntry?.(entry)}
                className={cn(
                  'w-full p-4 rounded-xl text-left',
                  'bg-gradient-to-br from-neutral-50 to-primary-50/30',
                  'border border-neutral-200 hover:border-primary-300',
                  'transition-all duration-200 hover:shadow-md',
                  'group'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-neutral-800 group-hover:text-primary-600">
                    {entry.term}
                    {entry.term_en && (
                      <span className="ml-2 text-sm text-neutral-500">
                        ({entry.term_en})
                      </span>
                    )}
                  </h4>
                  <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-transform group-hover:translate-x-1" />
                </div>

                <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                  {entry.content.definition}
                </p>

                <div className="flex items-center gap-4 text-xs">
                  <span className={cn(
                    'px-2 py-1 rounded-full',
                    'bg-secondary-100 text-secondary-700'
                  )}>
                    {entry.category}
                  </span>

                  {entry.content.pregnancy_related && (
                    <span className="flex items-center gap-1 text-primary-600">
                      <Heart className="w-3 h-3" />
                      임신 관련
                    </span>
                  )}

                  {entry.content.pregnancy_week_relevant && (
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Calendar className="w-3 h-3" />
                      {entry.content.pregnancy_week_relevant[0]}-{entry.content.pregnancy_week_relevant[1]}주
                    </span>
                  )}

                  {entry.tags.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-neutral-400" />
                      {entry.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-neutral-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* No Results */}
        {!isLoading && searchQuery && searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              검색 결과가 없습니다
            </h3>
            <p className="text-sm text-neutral-500 text-center max-w-sm">
              다른 검색어를 시도하거나 카테고리를 변경해보세요
            </p>
          </div>
        )}

        {/* Initial State */}
        {!isLoading && !searchQuery && searchResults.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">📚</span>
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              의료 사전
            </h3>
            <p className="text-sm text-neutral-500 text-center max-w-sm">
              궁금한 의료 용어, 질병, 증상을 검색해보세요
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DictionarySearch