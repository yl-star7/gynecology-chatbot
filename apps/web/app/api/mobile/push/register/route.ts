import { NextRequest, NextResponse } from "next/server";

import { requireMobileSession } from "@/lib/mobile/session-auth";
import { supabaseUpdate } from "@/lib/supabase/admin-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const pushToken =
      typeof body.pushToken === "string" ? body.pushToken.trim() : "";

    if (!pushToken) {
      return NextResponse.json(
        { error: "pushToken is required" },
        { status: 400 },
      );
    }

    const { userId } = await requireMobileSession(request, "");

    await supabaseUpdate(`pregnancy_profiles?user_id=eq.${userId}`, {
      push_token: pushToken,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("push register error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "푸시 토큰 등록에 실패했습니다.",
      },
      { status: 500 },
    );
  }
}
