'use client'

import React, { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DictionarySearch } from './dictionary-search'
import { DictionaryDetail } from './dictionary-detail'
import type { MedicalDictionaryEntry } from '@/types/medical-dictionary'

interface DictionaryModalProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export const DictionaryModal: React.FC<DictionaryModalProps> = ({
  isOpen,
  onClose,
  className
}) => {
  const [selectedEntry, setSelectedEntry] = useState<MedicalDictionaryEntry | null>(null)

  if (!isOpen) return null

  const handleSelectEntry = (entry: MedicalDictionaryEntry) => {
    setSelectedEntry(entry)
  }

  const handleBack = () => {
    setSelectedEntry(null)
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'fixed inset-x-4 inset-y-20 md:inset-x-auto md:inset-y-auto',
        'md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2',
        'w-auto md:w-full md:max-w-2xl h-auto md:h-[80vh]',
        'bg-white rounded-2xl shadow-2xl z-50',
        'flex flex-col overflow-hidden',
        'animate-slide-up-fade',
        className
      )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200">
          <h2 className="text-lg font-bold text-neutral-800">
            {selectedEntry ? '의료 정보' : '의료 사전'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {selectedEntry ? (
            <DictionaryDetail
              entry={selectedEntry}
              onBack={handleBack}
            />
          ) : (
            <DictionarySearch
              onSelectEntry={handleSelectEntry}
            />
          )}
        </div>
      </div>
    </>
  )
}

export default DictionaryModal