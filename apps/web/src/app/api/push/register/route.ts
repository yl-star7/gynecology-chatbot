import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { supabaseUpdate } from "@/lib/mobile/supabase-rest";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body?.pushToken) {
      return NextResponse.json({ error: "pushToken is required" }, { status: 400 });
    }

    const { userId } = await requireMobileSession(request);

    await supabaseUpdate(`pregnancy_profiles?user_id=eq.${userId}`, {
      push_token: body.pushToken,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("push register route error", error);
    return mobileRouteErrorResponse(error, "failed to register push token");
  }
}
