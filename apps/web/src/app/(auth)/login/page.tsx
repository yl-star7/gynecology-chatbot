'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Heart, Mail, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        router.push('/chat');
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-light/20 flex items-center justify-center p-4">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-secondary-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
      </div>

      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm border-primary-200/50 shadow-2xl shadow-primary-500/10 relative">
        <CardHeader className="text-center space-y-4">
          {/* 로고/아이콘 */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 text-white fill-current" />
          </div>
          
          <div>
            <CardTitle className="text-2xl font-semibold text-neutral-800 mb-2">
              안전한 로그인
            </CardTitle>
            <CardDescription className="text-neutral-600">
              부인과 전문의와 함께하는 건강한 임신 여정
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이메일 입력 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-700 font-medium">
                이메일 주소
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="
                    pl-10 bg-neutral-50 border-2 border-neutral-200
                    focus:border-primary-300 focus:ring-4 focus:ring-primary-100
                    rounded-xl py-3 text-neutral-700
                    placeholder:text-neutral-400
                    transition-all duration-200
                  "
                  placeholder="이메일을 입력해주세요"
                  required
                />
              </div>
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-700 font-medium">
                비밀번호
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="
                    pl-10 pr-10 bg-neutral-50 border-2 border-neutral-200
                    focus:border-primary-300 focus:ring-4 focus:ring-primary-100
                    rounded-xl py-3 text-neutral-700
                    placeholder:text-neutral-400
                    transition-all duration-200
                  "
                  placeholder="비밀번호를 입력해주세요"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* 로그인 버튼 */}
            <Button
              type="submit"
              disabled={isLoading}
              className="
                w-full bg-gradient-to-r from-primary-500 to-primary-400
                hover:from-primary-600 hover:to-primary-500
                text-white font-medium py-3 rounded-xl
                shadow-lg shadow-primary-500/30
                transform transition-all duration-200
                hover:scale-[1.02] hover:shadow-xl hover:shadow-primary-500/40
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:transform-none disabled:hover:scale-100
              "
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>로그인 중...</span>
                </div>
              ) : (
                '로그인'
              )}
            </Button>
          </form>

          {/* 구분선 */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">또는</span>
            </div>
          </div>

          {/* 회원가입 링크 */}
          <div className="text-center space-y-2">
            <p className="text-sm text-neutral-600">
              아직 계정이 없으시나요?
            </p>
            <Link 
              href="/register"
              className="
                inline-flex items-center text-sm font-medium text-primary-600 
                hover:text-primary-700 transition-colors
              "
            >
              회원가입하기
            </Link>
          </div>

          {/* 도움말 */}
          <div className="text-center">
            <Link 
              href="/forgot-password"
              className="text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
            >
              비밀번호를 잊으셨나요?
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 하단 안내 메시지 */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-neutral-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
          안전하고 신뢰할 수 있는 의료 정보 서비스
        </p>
      </div>
    </div>
  );
}