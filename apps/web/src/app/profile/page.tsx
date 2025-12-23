'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { User } from '@supabase/supabase-js';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar, 
  Heart, 
  MessageSquare, 
  Save,
  LogOut,
  Trash2,
  Edit3
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    isPregnant: false,
    pregnancyWeek: ''
  });
  
  const router = useRouter();
  const supabase = createClient();

  // 사용자 프로필 데이터 로드
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          router.push('/login');
          return;
        }

        setUser(user);

        // 프로필 API에서 데이터 가져오기
        const response = await fetch('/api/user/profile');
        const data = await response.json();

        if (data.success) {
          setProfile(data.profile);
          setFormData({
            fullName: data.profile.fullName || '',
            age: data.profile.age?.toString() || '',
            isPregnant: data.profile.isPregnant || false,
            pregnancyWeek: data.profile.pregnancyWeek?.toString() || ''
          });
        } else {
          toast.error('프로필을 불러올 수 없습니다.');
        }
      } catch (error) {
        console.error('Profile loading error:', error);
        toast.error('프로필을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, [router, supabase]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          age: formData.age ? parseInt(formData.age) : null,
          isPregnant: formData.isPregnant,
          pregnancyWeek: formData.pregnancyWeek ? parseInt(formData.pregnancyWeek) : null
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProfile(data.profile);
        setIsEditing(false);
        toast.success(data.message);
      } else {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await supabase.auth.signOut();
      router.push('/');
      toast.success('로그아웃되었습니다.');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        const response = await fetch('/api/user/profile', { method: 'DELETE' });
        const data = await response.json();
        
        if (data.success) {
          await supabase.auth.signOut();
          router.push('/');
          toast.success(data.message);
        } else {
          toast.error(data.error);
        }
      } catch (error) {
        console.error('Account deletion error:', error);
        toast.error('계정 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-light/20 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div>
            <h2 className="text-lg font-medium text-neutral-800 mb-2">프로필 로딩 중...</h2>
            <p className="text-neutral-600 text-sm">사용자 정보를 불러오고 있습니다</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-secondary-50 to-accent-light/20 p-4">
      {/* 헤더 */}
      <div className="max-w-2xl mx-auto mb-6">
        <div className="flex items-center justify-between">
          <Button
            onClick={() => router.push('/chat')}
            className="
              p-2 rounded-full bg-white/80 backdrop-blur-sm 
              hover:bg-white text-neutral-600 hover:text-neutral-800
              border border-neutral-200 shadow-md
              transition-all duration-200
            "
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <h1 className="text-2xl font-bold text-neutral-800">내 프로필</h1>
          
          <Button
            onClick={() => setIsEditing(!isEditing)}
            className="
              p-2 rounded-full bg-primary-500 hover:bg-primary-600 
              text-white shadow-md transition-all duration-200
            "
          >
            <Edit3 className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* 기본 정보 카드 */}
        <Card className="bg-white/90 backdrop-blur-sm border-primary-200/50 shadow-xl">
          <CardHeader className="text-center pb-4">
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="w-20 h-20 shadow-lg">
                <AvatarFallback className="bg-gradient-to-br from-primary-400 to-primary-500 text-white text-2xl font-bold">
                  {formData.fullName ? formData.fullName.charAt(0) : user?.email?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div>
                <CardTitle className="text-2xl text-neutral-800 mb-1">
                  {profile?.fullName || '사용자'}
                </CardTitle>
                <CardDescription className="text-neutral-500">
                  {user?.email}
                </CardDescription>
              </div>

              {profile?.isPregnant && profile?.pregnancyWeek && (
                <Badge className="bg-accent-light text-accent-dark px-4 py-2 rounded-full font-medium">
                  임신 {profile.pregnancyWeek}주차
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* 이름 */}
            <div className="space-y-2">
              <Label className="text-neutral-700 font-medium">성함</Label>
              {isEditing ? (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <Input
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="pl-10 bg-neutral-50 border-2 border-neutral-200 focus:border-primary-300"
                    placeholder="성함을 입력해주세요"
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-xl">
                  <User className="h-5 w-5 text-neutral-400" />
                  <span className="text-neutral-700">{profile?.fullName || '미설정'}</span>
                </div>
              )}
            </div>

            {/* 이메일 (읽기 전용) */}
            <div className="space-y-2">
              <Label className="text-neutral-700 font-medium">이메일 주소</Label>
              <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-xl">
                <Mail className="h-5 w-5 text-neutral-400" />
                <span className="text-neutral-700">{user?.email}</span>
              </div>
            </div>

            {/* 나이 */}
            <div className="space-y-2">
              <Label className="text-neutral-700 font-medium">나이</Label>
              {isEditing ? (
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <Input
                    type="number"
                    min="18"
                    max="65"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="pl-10 bg-neutral-50 border-2 border-neutral-200 focus:border-primary-300"
                    placeholder="나이를 입력해주세요"
                  />
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-xl">
                  <Calendar className="h-5 w-5 text-neutral-400" />
                  <span className="text-neutral-700">{profile?.age ? `${profile.age}세` : '미설정'}</span>
                </div>
              )}
            </div>

            {/* 임신 상태 */}
            <div className="space-y-3">
              <Label className="text-neutral-700 font-medium">임신 상태</Label>
              {isEditing ? (
                <div className="space-y-3">
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
                    <Input
                      type="number"
                      min="1"
                      max="42"
                      value={formData.pregnancyWeek}
                      onChange={(e) => handleInputChange('pregnancyWeek', e.target.value)}
                      className="bg-neutral-50 border-2 border-neutral-200 focus:border-primary-300"
                      placeholder="임신 주차 (1-42주)"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-xl">
                  <Heart className={`h-5 w-5 ${profile?.isPregnant ? 'text-primary-500' : 'text-neutral-400'}`} />
                  <span className="text-neutral-700">
                    {profile?.isPregnant 
                      ? `임신 중 ${profile?.pregnancyWeek ? `(${profile.pregnancyWeek}주차)` : ''}`
                      : '임신 아님'
                    }
                  </span>
                </div>
              )}
            </div>

            {/* 수정 모드 버튼 */}
            {isEditing && (
              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="
                    flex-1 bg-primary-500 hover:bg-primary-600 text-white
                    py-3 rounded-xl shadow-md transition-all duration-200
                  "
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>저장 중...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Save className="w-4 h-4" />
                      <span>저장하기</span>
                    </div>
                  )}
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="
                    flex-1 border-neutral-200 text-neutral-600 hover:bg-neutral-50
                    py-3 rounded-xl transition-all duration-200
                  "
                >
                  취소
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 계정 관리 카드 */}
        <Card className="bg-white/90 backdrop-blur-sm border-neutral-200/50 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-neutral-800">계정 관리</CardTitle>
            <CardDescription className="text-neutral-600">
              계정 설정 및 데이터 관리
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 통계 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-primary-50 rounded-xl">
                <MessageSquare className="w-6 h-6 text-primary-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-primary-600">
                  {/* 여기에 실제 채팅 수 표시 */}
                  -
                </div>
                <div className="text-sm text-neutral-600">총 상담 수</div>
              </div>
              <div className="text-center p-4 bg-secondary-50 rounded-xl">
                <Calendar className="w-6 h-6 text-secondary-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-secondary-600">
                  {profile?.createdAt ? 
                    Math.floor((new Date().getTime() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                    : '-'
                  }
                </div>
                <div className="text-sm text-neutral-600">사용 일수</div>
              </div>
            </div>

            <Separator />

            {/* 계정 액션 */}
            <div className="space-y-3">
              <Button
                onClick={handleLogout}
                className="
                  w-full bg-neutral-600 hover:bg-neutral-700 text-white
                  py-3 rounded-xl shadow-md transition-all duration-200
                "
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
              
              <Button
                onClick={handleDeleteAccount}
                variant="outline"
                className="
                  w-full border-red-200 text-red-600 hover:bg-red-50
                  py-3 rounded-xl transition-all duration-200
                "
              >
                <Trash2 className="w-4 h-4 mr-2" />
                계정 삭제
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 도움말 */}
        <div className="text-center text-sm text-neutral-500 bg-white/60 backdrop-blur-sm p-4 rounded-xl">
          궁금한 점이 있으시면 언제든지 채팅을 통해 문의해주세요.<br />
          모든 개인정보는 안전하게 보호됩니다.
        </div>
      </div>

      {/* Toast 알림 */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#fff',
            color: '#374151',
            padding: '12px 16px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
            border: '1px solid #f3f4f6',
          },
        }}
      />
    </div>
  );
}