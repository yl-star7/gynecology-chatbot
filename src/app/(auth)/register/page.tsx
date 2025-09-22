'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Heart, Mail, Lock, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    age: '',
    isPregnant: false,
    pregnancyWeek: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.fullName) {
      toast.error('필수 정보를 모두 입력해주세요.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return false;
    }

    if (formData.password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.');
      return false;
    }

    if (formData.isPregnant && formData.pregnancyWeek && (parseInt(formData.pregnancyWeek) < 1 || parseInt(formData.pregnancyWeek) > 42)) {
      toast.error('임신 주차는 1~42주 사이여야 합니다.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          age: formData.age ? parseInt(formData.age) : null,
          isPregnant: formData.isPregnant,
          pregnancyWeek: formData.pregnancyWeek ? parseInt(formData.pregnancyWeek) : null
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        router.push('/login');
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-light/20 flex items-center justify-center p-4 py-8">
      {/* 배경 장식 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/6 right-1/5 w-72 h-72 bg-secondary-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/6 left-1/5 w-56 h-56 bg-primary-200/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '3s'}} />
      </div>

      <Card className="w-full max-w-lg bg-white/95 backdrop-blur-sm border-primary-200/50 shadow-2xl shadow-primary-500/10 relative">
        <CardHeader className="text-center space-y-4">
          {/* 로고/아이콘 */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-secondary-400 to-secondary-500 rounded-full flex items-center justify-center shadow-lg">
            <Heart className="w-8 h-8 text-white fill-current" />
          </div>
          
          <div>
            <CardTitle className="text-2xl font-semibold text-neutral-800 mb-2">
              함께하는 건강한 여정
            </CardTitle>
            <CardDescription className="text-neutral-600">
              부인과 전문의와 함께하는 맞춤형 건강 관리
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 이름 입력 */}
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-neutral-700 font-medium">
                성함 <span className="text-primary-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="
                    pl-10 bg-neutral-50 border-2 border-neutral-200
                    focus:border-secondary-300 focus:ring-4 focus:ring-secondary-100
                    rounded-xl py-3 text-neutral-700
                    placeholder:text-neutral-400
                    transition-all duration-200
                  "
                  placeholder="실명을 입력해주세요"
                  required
                />
              </div>
            </div>

            {/* 이메일 입력 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-neutral-700 font-medium">
                이메일 주소 <span className="text-primary-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="
                    pl-10 bg-neutral-50 border-2 border-neutral-200
                    focus:border-secondary-300 focus:ring-4 focus:ring-secondary-100
                    rounded-xl py-3 text-neutral-700
                    placeholder:text-neutral-400
                    transition-all duration-200
                  "
                  placeholder="이메일을 입력해주세요"
                  required
                />
              </div>
            </div>

            {/* 나이 입력 (선택사항) */}
            <div className="space-y-2">
              <Label htmlFor="age" className="text-neutral-700 font-medium">
                나이 (선택사항)
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="65"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="
                    pl-10 bg-neutral-50 border-2 border-neutral-200
                    focus:border-secondary-300 focus:ring-4 focus:ring-secondary-100
                    rounded-xl py-3 text-neutral-700
                    placeholder:text-neutral-400
                    transition-all duration-200
                  "
                  placeholder="나이를 입력해주세요"
                />
              </div>
            </div>

            {/* 임신 여부 */}
            <div className="space-y-3">
              <Label className="text-neutral-700 font-medium">
                현재 임신 상태
              </Label>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={() => handleInputChange('isPregnant', false)}
                  className={`
                    flex-1 py-3 rounded-xl transition-all duration-200
                    ${!formData.isPregnant 
                      ? 'bg-secondary-500 text-white shadow-md' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }
                  `}
                >
                  임신 아님
                </Button>
                <Button
                  type="button"
                  onClick={() => handleInputChange('isPregnant', true)}
                  className={`
                    flex-1 py-3 rounded-xl transition-all duration-200
                    ${formData.isPregnant 
                      ? 'bg-primary-500 text-white shadow-md' 
                      : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }
                  `}
                >
                  임신 중
                </Button>
              </div>
              
              {formData.isPregnant && (
                <div className="mt-3 space-y-2">
                  <Label htmlFor="pregnancyWeek" className="text-neutral-700 font-medium">
                    임신 주차
                  </Label>
                  <Input
                    id="pregnancyWeek"
                    type="number"
                    min="1"
                    max="42"
                    value={formData.pregnancyWeek}
                    onChange={(e) => handleInputChange('pregnancyWeek', e.target.value)}
                    className="
                      bg-neutral-50 border-2 border-neutral-200
                      focus:border-primary-300 focus:ring-4 focus:ring-primary-100
                      rounded-xl py-3 text-neutral-700
                      placeholder:text-neutral-400
                      transition-all duration-200
                    "
                    placeholder="몇 주차인가요? (1-42주)"
                  />
                  {formData.pregnancyWeek && parseInt(formData.pregnancyWeek) > 0 && (
                    <Badge className="bg-accent-light text-accent-dark px-3 py-1 rounded-full text-xs font-medium">
                      임신 {formData.pregnancyWeek}주차
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* 비밀번호 입력 */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-700 font-medium">
                비밀번호 <span className="text-primary-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="
                    pl-10 pr-10 bg-neutral-50 border-2 border-neutral-200
                    focus:border-secondary-300 focus:ring-4 focus:ring-secondary-100
                    rounded-xl py-3 text-neutral-700
                    placeholder:text-neutral-400
                    transition-all duration-200
                  "
                  placeholder="8자 이상의 비밀번호"
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

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-neutral-700 font-medium">
                비밀번호 확인 <span className="text-primary-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="
                    pl-10 pr-10 bg-neutral-50 border-2 border-neutral-200
                    focus:border-secondary-300 focus:ring-4 focus:ring-secondary-100
                    rounded-xl py-3 text-neutral-700
                    placeholder:text-neutral-400
                    transition-all duration-200
                  "
                  placeholder="비밀번호를 다시 입력해주세요"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* 회원가입 버튼 */}
            <Button
              type="submit"
              disabled={isLoading}
              className="
                w-full bg-gradient-to-r from-secondary-500 to-secondary-400
                hover:from-secondary-600 hover:to-secondary-500
                text-white font-medium py-3 rounded-xl
                shadow-lg shadow-secondary-500/30
                transform transition-all duration-200
                hover:scale-[1.02] hover:shadow-xl hover:shadow-secondary-500/40
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                disabled:transform-none disabled:hover:scale-100
              "
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>회원가입 중...</span>
                </div>
              ) : (
                '회원가입'
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

          {/* 로그인 링크 */}
          <div className="text-center space-y-2">
            <p className="text-sm text-neutral-600">
              이미 계정이 있으시나요?
            </p>
            <Link 
              href="/login"
              className="
                inline-flex items-center text-sm font-medium text-secondary-600 
                hover:text-secondary-700 transition-colors
              "
            >
              로그인하기
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 하단 안내 메시지 */}
      <div className="absolute bottom-6 left-0 right-0 text-center">
        <p className="text-xs text-neutral-500 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
          개인정보는 안전하게 보호되며 의료진에게만 공유됩니다
        </p>
      </div>
    </div>
  );
}