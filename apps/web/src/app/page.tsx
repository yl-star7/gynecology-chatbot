'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, MessageSquare, Shield, Sparkles, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  const router = useRouter();
  const supabase = createClient();

  // 인증된 사용자면 채팅으로 리다이렉트
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.push('/chat');
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };

    checkAuthAndRedirect();
  }, [router, supabase]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-light/20">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/6 w-96 h-96 bg-primary-200/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/6 w-72 h-72 bg-secondary-200/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        {/* 헤더 */}
        <header className="flex justify-between items-center p-6 lg:p-8">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white fill-current" />
            </div>
            <h1 className="text-xl font-semibold text-neutral-800">부인과 AI 챗봇</h1>
          </div>

          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button className="rounded-full px-6">
                로그인 / 시작하기
              </Button>
            </Link>
          </div>
        </header>

        {/* 메인 히어로 섹션 */}
        <section className="text-center py-16 px-6 lg:py-24 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200/50 mb-6">
                <Sparkles className="w-4 h-4 text-primary-500" />
                <span className="text-sm font-medium text-primary-600">AI 기반 전문 상담</span>
              </div>

              <h1 className="text-4xl lg:text-6xl font-bold text-neutral-800 mb-6 leading-tight">
                부인과 전문의와 함께하는<br />
                <span className="text-gradient bg-gradient-to-r from-primary-500 to-secondary-500 bg-clip-text text-transparent">
                  건강한 여성의 삶
                </span>
              </h1>

              <p className="text-xl text-neutral-600 leading-relaxed max-w-2xl mx-auto">
                임신, 출산, 여성 건강에 대한 궁금증을 언제든지 전문의에게 물어보세요.
                안전하고 정확한 의료 정보를 제공합니다.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link href="/login">
                <Button size="lg" className="px-10 h-16 rounded-full transform transition-all duration-200 hover:scale-105 text-lg font-bold shadow-xl">
                  🤱 카카오로 3초 만에 시작하기
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            {/* 통계 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary-500 mb-2">24/7</div>
                <div className="text-sm text-neutral-600">언제든 상담 가능</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary-500 mb-2">10,000+</div>
                <div className="text-sm text-neutral-600">상담 케이스</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-accent-dark mb-2">98%</div>
                <div className="text-sm text-neutral-600">만족도</div>
              </div>
            </div>
          </div>
        </section>

        {/* 주요 기능 섹션 */}
        <section className="py-16 px-6 lg:py-24 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-neutral-800 mb-4">
                왜 저희 서비스를 선택해야 할까요?
              </h2>
              <p className="text-lg text-neutral-600">
                전문적이고 안전한 의료 상담 서비스를 제공합니다
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-white/80 backdrop-blur-sm border-primary-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-neutral-800">
                    실시간 AI 상담
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-neutral-600 leading-relaxed">
                    부인과 전문의의 지식을 기반으로 한 AI가 24시간 언제든지 정확하고
                    신뢰할 수 있는 의료 상담을 제공합니다.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-secondary-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-neutral-800">
                    개인정보 보호
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-neutral-600 leading-relaxed">
                    의료법과 개인정보보호법을 준수하여 모든 상담 내용은
                    철저히 보호되며 익명으로 처리됩니다.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm border-accent-dark/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-accent-DEFAULT to-accent-dark rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-neutral-800">
                    임신부 특화
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-neutral-600 leading-relaxed">
                    임신 단계별 맞춤 정보와 주의사항을 제공하여
                    건강한 임신과 출산을 위한 전문적인 가이드를 받을 수 있습니다.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA 섹션 */}
        <section className="py-16 px-6 lg:py-24 lg:px-8 bg-gradient-to-r from-primary-500 to-secondary-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              지금 바로 전문 상담을 시작해보세요
            </h2>
            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              임신, 출산, 여성 건강에 대한 모든 궁금증을 해결하고
              안심할 수 있는 전문적인 답변을 받아보세요.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" variant="secondary" className="px-10 h-16 rounded-full bg-white hover:bg-neutral-50 text-[#e16947] border-0 transform transition-all duration-200 hover:scale-105 text-lg font-bold shadow-xl">
                  지금 바로 대화 시작하기
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* 푸터 */}
        <footer className="py-8 px-6 lg:py-12 lg:px-8 bg-neutral-800 text-white">
          <div className="max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="w-6 h-6 text-primary-400 fill-current" />
              <span className="text-lg font-semibold">부인과 AI 챗봇</span>
            </div>
            <p className="text-neutral-400 text-sm mb-4">
              의료진 감수를 받은 정확한 정보 • 개인정보 보호 • 24시간 이용 가능
            </p>
            <p className="text-neutral-500 text-xs">
              본 서비스는 의료 참고용이며, 응급상황 시 반드시 의료진과 상담하시기 바랍니다.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
