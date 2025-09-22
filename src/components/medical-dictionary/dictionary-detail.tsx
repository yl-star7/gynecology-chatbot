'use client'

import React from 'react'
import { ArrowLeft, Shield, Info, Heart, Calendar, AlertCircle, Tag, ExternalLink, ChevronLeft, Share2, BookOpen } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { MedicalDictionaryEntry } from '@/types/medical-dictionary'

interface DictionaryDetailProps {
  entry: MedicalDictionaryEntry
  onBack?: () => void
  className?: string
}

export const DictionaryDetail: React.FC<DictionaryDetailProps> = ({
  entry,
  onBack,
  className
}) => {
  const severityColors = {
    low: 'bg-success-100 text-success-700 border-success-200',
    medium: 'bg-warning-100 text-warning-700 border-warning-200',
    high: 'bg-red-100 text-red-700 border-red-200'
  }

  const frequencyLabels = {
    common: '흔함',
    uncommon: '드물게',
    rare: '매우 드물게'
  }

  return (
    <div className={cn('flex flex-col h-full bg-white', className)}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 p-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-neutral-600" />
            </button>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-neutral-800">
              {entry.term}
              {entry.term_en && (
                <span className="ml-2 text-base font-normal text-neutral-500">
                  {entry.term_en}
                </span>
              )}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium">
                {entry.category}
              </span>
              {entry.is_verified && (
                <span className="flex items-center gap-1 text-xs text-success-600">
                  <Shield className="w-3 h-3" />
                  검증됨
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Definition */}
        <section className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-4">
          <h3 className="font-semibold text-neutral-800 mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-primary-500" />
            정의
          </h3>
          <p className="text-neutral-700 leading-relaxed">
            {entry.content.definition}
          </p>
        </section>

        {/* Metadata Tags */}
        {entry.metadata && (
          <div className="flex flex-wrap gap-2">
            {entry.metadata.severity && (
              <span className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border',
                severityColors[entry.metadata.severity]
              )}>
                위험도: {entry.metadata.severity === 'low' ? '낮음' : entry.metadata.severity === 'medium' ? '보통' : '높음'}
              </span>
            )}
            {entry.metadata.frequency && (
              <span className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium border border-neutral-200">
                빈도: {frequencyLabels[entry.metadata.frequency]}
              </span>
            )}
            {entry.metadata.icd_code && (
              <span className="px-3 py-1 rounded-full bg-info-100 text-info-700 text-xs font-medium border border-info-200">
                ICD: {entry.metadata.icd_code}
              </span>
            )}
            {entry.metadata.department && (
              <span className="px-3 py-1 rounded-full bg-accent-light/30 text-accent-dark text-xs font-medium border border-accent-DEFAULT/20">
                {entry.metadata.department}
              </span>
            )}
          </div>
        )}

        {/* Pregnancy Related */}
        {entry.content.pregnancy_related && (
          <section className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-4 border border-pink-200">
            <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-pink-500" />
              임신 관련 정보
            </h3>
            {entry.content.pregnancy_week_relevant && (
              <div className="flex items-center gap-2 text-sm text-neutral-700 mb-2">
                <Calendar className="w-4 h-4 text-pink-500" />
                <span>
                  임신 {entry.content.pregnancy_week_relevant[0]}주 ~ {entry.content.pregnancy_week_relevant[1]}주 관련
                </span>
              </div>
            )}
          </section>
        )}

        {/* Symptoms */}
        {entry.content.symptoms && entry.content.symptoms.length > 0 && (
          <section>
            <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-warning-DEFAULT" />
              증상
            </h3>
            <ul className="space-y-2">
              {entry.content.symptoms.map((symptom, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-warning-DEFAULT mt-1.5 flex-shrink-0" />
                  <span className="text-neutral-700">{symptom}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Causes */}
        {entry.content.causes && entry.content.causes.length > 0 && (
          <section>
            <h3 className="font-semibold text-neutral-800 mb-3">원인</h3>
            <ul className="space-y-2">
              {entry.content.causes.map((cause, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary-500 mt-1.5 flex-shrink-0" />
                  <span className="text-neutral-700">{cause}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Treatment */}
        {entry.content.treatment && (
          <section className="bg-success-50 rounded-xl p-4 border border-success-200">
            <h3 className="font-semibold text-neutral-800 mb-2">치료법</h3>
            <p className="text-neutral-700 leading-relaxed">
              {entry.content.treatment}
            </p>
          </section>
        )}

        {/* Prevention */}
        {entry.content.prevention && (
          <section className="bg-info-50 rounded-xl p-4 border border-info-200">
            <h3 className="font-semibold text-neutral-800 mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4 text-info-600" />
              예방법
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              {entry.content.prevention}
            </p>
          </section>
        )}

        {/* Cautions */}
        {entry.content.cautions && entry.content.cautions.length > 0 && (
          <section className="bg-red-50 rounded-xl p-4 border border-red-200">
            <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600" />
              주의사항
            </h3>
            <ul className="space-y-2">
              {entry.content.cautions.map((caution, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">⚠️</span>
                  <span className="text-red-700">{caution}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <section>
            <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <Tag className="w-4 h-4 text-neutral-500" />
              관련 태그
            </h3>
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* References */}
        {entry.content.references && entry.content.references.length > 0 && (
          <section className="border-t border-neutral-200 pt-4">
            <h3 className="font-semibold text-neutral-800 mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-neutral-500" />
              참고문헌
            </h3>
            <ul className="space-y-1">
              {entry.content.references.map((ref, index) => (
                <li key={index} className="text-sm text-neutral-600">
                  {index + 1}. {ref}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Last Updated */}
        {entry.metadata?.last_reviewed && (
          <div className="text-xs text-neutral-500 text-center pt-4 border-t border-neutral-200">
            마지막 검토: {new Date(entry.metadata.last_reviewed).toLocaleDateString('ko-KR')}
            {entry.metadata.reviewer && ` · 검토자: ${entry.metadata.reviewer}`}
          </div>
        )}
      </div>

      {/* Footer Disclaimer */}
      <div className="p-4 bg-neutral-50 border-t border-neutral-200">
        <p className="text-xs text-neutral-500 text-center">
          💝 이 정보는 참고용이며, 정확한 진단과 치료는 전문의와 상담하세요
        </p>
      </div>
    </div>
  )
}

export default DictionaryDetail