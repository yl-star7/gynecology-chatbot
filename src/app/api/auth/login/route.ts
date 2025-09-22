import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();

    // 로그인 시도
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('Auth signin error:', authError);
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 사용자 프로필 정보 조회
    let userProfile = null;
    if (authData.user) {
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single();

      if (!profileError && profileData) {
        userProfile = profileData;
      }
    }

    // 마지막 로그인 시간 업데이트
    if (userProfile) {
      await supabase
        .from('users')
        .update({ 
          last_login_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', authData.user!.id);
    }

    return NextResponse.json({
      success: true,
      message: '로그인이 완료되었습니다.',
      user: {
        id: authData.user!.id,
        email: authData.user!.email,
        fullName: userProfile?.full_name || '',
        phoneNumber: userProfile?.phone_number || null,
        pregnancyWeek: userProfile?.pregnancy_week || null,
        preferences: userProfile?.preferences || null
      },
      session: authData.session
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}