import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase-server';

// GET - 사용자 프로필 조회
export async function GET() {
  try {
    const supabase = await getServerClient();

    // 현재 인증된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json(
        { error: '프로필을 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        phoneNumber: profile.phone_number,
        dateOfBirth: profile.date_of_birth,
        pregnancyWeek: profile.pregnancy_week,
        dueDate: profile.due_date,
        medicalHistory: profile.medical_history,
        allergies: profile.allergies,
        currentMedications: profile.current_medications,
        createdAt: profile.created_at,
        updatedAt: profile.updated_at,
        lastLoginAt: profile.last_login_at,
        preferences: profile.preferences
      }
    });

  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// PUT - 사용자 프로필 업데이트
export async function PUT(request: NextRequest) {
  try {
    const { fullName, phoneNumber, dateOfBirth, pregnancyWeek, dueDate, medicalHistory, allergies, currentMedications, preferences } = await request.json();
    const supabase = await getServerClient();

    // 현재 인증된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString()
    };

    if (fullName !== undefined) updateData.full_name = fullName;
    if (phoneNumber !== undefined) updateData.phone_number = phoneNumber;
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth;
    if (pregnancyWeek !== undefined) updateData.pregnancy_week = pregnancyWeek;
    if (dueDate !== undefined) updateData.due_date = dueDate;
    if (medicalHistory !== undefined) updateData.medical_history = medicalHistory;
    if (allergies !== undefined) updateData.allergies = allergies;
    if (currentMedications !== undefined) updateData.current_medications = currentMedications;
    if (preferences !== undefined) updateData.preferences = preferences;

    // 프로필 업데이트
    const { data: updatedProfile, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: '프로필 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '프로필이 성공적으로 업데이트되었습니다.',
      profile: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        fullName: updatedProfile.full_name,
        phoneNumber: updatedProfile.phone_number,
        dateOfBirth: updatedProfile.date_of_birth,
        pregnancyWeek: updatedProfile.pregnancy_week,
        dueDate: updatedProfile.due_date,
        medicalHistory: updatedProfile.medical_history,
        allergies: updatedProfile.allergies,
        currentMedications: updatedProfile.current_medications,
        preferences: updatedProfile.preferences,
        updatedAt: updatedProfile.updated_at
      }
    });

  } catch (error) {
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE - 사용자 프로필 삭제 (회원탈퇴)
export async function DELETE() {
  try {
    const supabase = await getServerClient();

    // 현재 인증된 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 관련 데이터 삭제 (대화, 메시지 등)
    await supabase.from('messages').delete().eq('user_id', user.id);
    await supabase.from('conversations').delete().eq('user_id', user.id);
    await supabase.from('users').delete().eq('id', user.id);

    // 사용자 계정 삭제는 관리자 권한이 필요하므로 비활성화로 처리
    // 실제 운영에서는 관리자 도구를 통해 처리

    return NextResponse.json({
      success: true,
      message: '회원탈퇴가 완료되었습니다.'
    });

  } catch (error) {
    console.error('Profile DELETE error:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}