import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase-server';

export async function POST() {
  try {
    const supabase = await getServerClient();

    // 현재 사용자 확인
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 로그아웃 시간 기록 (users 테이블에 last_logout_at 필드가 없으므로 주석 처리)
      // await supabase
      //   .from('users')
      //   .update({ 
      //     updated_at: new Date().toISOString()
      //   })
      //   .eq('id', user.id);
    }

    // 세션 종료
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json(
        { error: '로그아웃 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '로그아웃이 완료되었습니다.'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'POST 메서드만 지원됩니다.' },
    { status: 405 }
  );
}
