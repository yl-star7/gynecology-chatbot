'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { BookOpen, ExternalLink, ChevronDown, ChevronUp, Info, Shield } from 'lucide-react';

export interface Citation {
  source: string;
  content: string;
  confidence: number;
  citation: string;
  category?: string;
  page?: number;
}

interface CitationSourcesProps {
  citations: Citation[];
  className?: string;
}

export function CitationSources({ citations, className }: CitationSourcesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  if (!citations || citations.length === 0) {
    return null;
  }

  const topCitations = citations.slice(0, 3);
  const remainingCitations = citations.slice(3);

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'pregnancy_early':
        return '🤱';
      case 'prenatal_care':
        return '🏥';
      case 'nutrition':
        return '🥗';
      default:
        return '📄';
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'pregnancy_early':
        return '임신 초기';
      case 'prenatal_care':
        return '산전 관리';
      case 'nutrition':
        return '영양 관리';
      default:
        return '의료 정보';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600 bg-green-50';
    if (confidence >= 0.7) return 'text-blue-600 bg-blue-50';
    return 'text-orange-600 bg-orange-50';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.9) return '높은 신뢰도';
    if (confidence >= 0.7) return '보통 신뢰도';
    return '낮은 신뢰도';
  };

  return (
    <div className={cn('mt-4 space-y-3', className)}>
      {/* 신뢰성 안내 */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <Shield size={16} className="text-green-500" />
        <span>신뢰할 수 있는 의료 문서에서 검색된 정보입니다</span>
      </div>

      {/* 주요 출처 (최대 3개) */}
      <div className="space-y-2">
        {topCitations.map((citation, index) => (
          <div
            key={index}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setSelectedCitation(citation)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="text-lg mt-1">
                  {getCategoryIcon(citation.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {citation.source}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {getCategoryLabel(citation.category)}
                    </span>
                    {citation.page && (
                      <span className="text-xs text-gray-500">p.{citation.page}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {citation.content.substring(0, 150)}
                    {citation.content.length > 150 && '...'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-3">
                <span
                  className={cn(
                    'text-xs px-2 py-1 rounded-full',
                    getConfidenceColor(citation.confidence)
                  )}
                >
                  {Math.round(citation.confidence * 100)}%
                </span>
                <ExternalLink size={14} className="text-gray-400" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 추가 출처 토글 */}
      {remainingCitations.length > 0 && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <span>추가 출처 {remainingCitations.length}개</span>
            {isExpanded ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>

          {isExpanded && (
            <div className="space-y-2">
              {remainingCitations.map((citation, index) => (
                <div
                  key={index + 3}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedCitation(citation)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 flex-1">
                      <div className="text-sm mt-0.5">
                        {getCategoryIcon(citation.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="text-sm font-medium text-gray-900 truncate">
                            {citation.source}
                          </h5>
                          <span className="text-xs text-gray-500">
                            {getCategoryLabel(citation.category)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-1">
                          {citation.content.substring(0, 100)}
                          {citation.content.length > 100 && '...'}
                        </p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        getConfidenceColor(citation.confidence)
                      )}
                    >
                      {Math.round(citation.confidence * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 상세 모달 */}
      {selectedCitation && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedCitation(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {getCategoryIcon(selectedCitation.category)}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedCitation.source}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-sm text-gray-600">
                      {getCategoryLabel(selectedCitation.category)}
                    </span>
                    {selectedCitation.page && (
                      <span className="text-sm text-gray-600">
                        페이지 {selectedCitation.page}
                      </span>
                    )}
                    <span
                      className={cn(
                        'text-xs px-2 py-1 rounded-full',
                        getConfidenceColor(selectedCitation.confidence)
                      )}
                    >
                      {getConfidenceLabel(selectedCitation.confidence)} ({Math.round(selectedCitation.confidence * 100)}%)
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedCitation(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">문서 내용</h4>
                <p className="text-sm text-gray-900 leading-relaxed">
                  {selectedCitation.content}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">인용 정보</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  {selectedCitation.citation}
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 bg-blue-50 p-3 rounded-lg">
                <Info size={14} className="text-blue-500" />
                <span>
                  이 정보는 신뢰할 수 있는 의료 문서에서 추출되었지만, 개인별 상황에 따라 다를 수 있습니다.
                  정확한 진단과 치료는 반드시 전문의와 상담하시기 바랍니다.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 의료 면책 조항 */}
      <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong>의료 면책 조항:</strong> 위 정보는 참고용이며, 개인의 건강 상태나 증상에 대한
            정확한 진단과 치료는 반드시 의료 전문가와 상담하시기 바랍니다.
          </div>
        </div>
      </div>
    </div>
  );
}