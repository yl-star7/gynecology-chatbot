import { NextRequest, NextResponse } from "next/server";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin-client";

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseAdminClient();
    const body = await request.json().catch(() => ({}));
    if (!body?.pushToken) {
      return NextResponse.json(
        { error: "pushToken is required" },
        { status: 400 },
      );
    }

    const { userId } = await requireMobileSession(request);

    const { error } = await client
      .from("pregnancy_profiles")
      .update({
        push_token: body.pushToken,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) {
      throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("push register route error", error);
    return mobileRouteErrorResponse(error, "failed to register push token");
  }
}
