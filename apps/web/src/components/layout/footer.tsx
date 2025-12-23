'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Heart, Phone, Mail, MapPin, Clock } from 'lucide-react'

export interface FooterProps {
  showEmergencyContact?: boolean
  showSupportInfo?: boolean
  showLegal?: boolean
  className?: string
  variant?: 'default' | 'minimal' | 'compact'
}

const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({
    showEmergencyContact = true,
    showSupportInfo = true,
    showLegal = true,
    className,
    variant = 'default'
  }, ref) => {

    const currentYear = new Date().getFullYear()

    const emergencyContacts = [
      {
        name: '응급실 (119)',
        number: '119',
        description: '응급상황 시'
      },
      {
        name: '임신중독 상담',
        number: '1577-1111',
        description: '24시간 상담'
      },
      {
        name: '산후우울 상담',
        number: '1588-9128',
        description: '정신건강 위기상담'
      }
    ]

    const supportInfo = {
      email: 'support@gynecology-ai.com',
      phone: '1588-0000',
      hours: '평일 09:00 - 18:00',
      address: '서울특별시 강남구 테헤란로 123길 45'
    }

    if (variant === 'minimal') {
      return (
        <footer
          ref={ref}
          className={cn(
            'text-center py-4 px-4 pb-safe',
            'bg-neutral-50 border-t border-neutral-200',
            className
          )}
        >
          <p className="text-xs text-neutral-500 mb-1">
            AI 상담은 참고용이며, 정확한 진단은 전문의와 상담하세요
          </p>
          <p className="text-xs text-neutral-400">
            © {currentYear} 부인과 AI 상담. All rights reserved.
          </p>
        </footer>
      )
    }

    if (variant === 'compact') {
      return (
        <footer
          ref={ref}
          className={cn(
            'py-6 px-4 pb-safe',
            'bg-gradient-to-t from-neutral-100 to-neutral-50',
            'border-t border-neutral-200',
            className
          )}
        >
          <div className="max-w-4xl mx-auto text-center space-y-3">
            {/* Emergency Quick Access */}
            <div className="flex justify-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <Phone className="w-4 h-4 mr-1" />
                119
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <Heart className="w-4 h-4 mr-1" />
                상담
              </Button>
            </div>

            <p className="text-xs text-neutral-500 leading-relaxed">
              💕 안전하고 건강한 임신을 위해 함께해요
            </p>

            <p className="text-xs text-neutral-400">
              © {currentYear} 부인과 AI 상담
            </p>
          </div>
        </footer>
      )
    }

    return (
      <footer
        ref={ref}
        className={cn(
          'py-8 px-4 pb-safe',
          'bg-gradient-to-t from-neutral-100 to-neutral-50',
          'border-t border-neutral-200',
          className
        )}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Emergency Contacts */}
          {showEmergencyContact && (
            <div className="text-center">
              <h3 className="text-sm font-semibold text-neutral-800 mb-4 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4 text-red-500" />
                응급 연락처
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {emergencyContacts.map((contact) => (
                  <div
                    key={contact.number}
                    className="p-3 bg-white rounded-xl border border-neutral-200 shadow-sm"
                  >
                    <div className="font-medium text-sm text-neutral-800 mb-1">
                      {contact.name}
                    </div>
                    <div className="text-lg font-bold text-red-600 mb-1">
                      {contact.number}
                    </div>
                    <div className="text-xs text-neutral-500">
                      {contact.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {showEmergencyContact && (showSupportInfo || showLegal) && (
            <Separator />
          )}

          {/* Support Information */}
          {showSupportInfo && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-neutral-800 mb-3">
                  고객지원
                </h4>
                <div className="space-y-2 text-sm text-neutral-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary-500" />
                    {supportInfo.email}
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-primary-500" />
                    {supportInfo.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary-500" />
                    {supportInfo.hours}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-neutral-800 mb-3">
                  주소
                </h4>
                <div className="flex items-start gap-2 text-sm text-neutral-600">
                  <MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                  <span>{supportInfo.address}</span>
                </div>
              </div>
            </div>
          )}

          {(showSupportInfo || showEmergencyContact) && showLegal && (
            <Separator />
          )}

          {/* Legal & Brand */}
          {showLegal && (
            <div className="text-center space-y-4">
              <div className="flex flex-wrap justify-center gap-4 text-xs text-neutral-500">
                <button className="hover:text-neutral-700 transition-colors">
                  이용약관
                </button>
                <button className="hover:text-neutral-700 transition-colors">
                  개인정보처리방침
                </button>
                <button className="hover:text-neutral-700 transition-colors">
                  의료정보처리방침
                </button>
                <button className="hover:text-neutral-700 transition-colors">
                  고객센터
                </button>
              </div>

              <div className="text-center">
                <p className="text-xs text-neutral-500 mb-2 leading-relaxed">
                  <Heart className="w-3 h-3 inline mr-1 text-primary-500" />
                  AI 상담은 참고용이며, 정확한 진단은 전문의와 상담하세요
                </p>
                <p className="text-xs text-neutral-400">
                  © {currentYear} 부인과 AI 상담. All rights reserved. • 버전 1.0.0
                </p>
              </div>
            </div>
          )}
        </div>
      </footer>
    )
  }
)

Footer.displayName = 'Footer'

export { Footer }