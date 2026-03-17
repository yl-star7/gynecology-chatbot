import { NextRequest, NextResponse } from "next/server";
import { supabaseSelect } from "@/lib/mobile/supabase-rest";
import { toRecentChats } from "@/lib/mobile/serializers";

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const sessions = await supabaseSelect<Array<{ id: string; title: string; last_message_at: string | null }>>(
      `chat_sessions?select=id,title,last_message_at&user_id=eq.${userId}&order=last_message_at.desc.nullslast`,
    );

    return NextResponse.json({ sessions: toRecentChats(sessions) });
  } catch (error) {
    console.error("mobile sessions route error", error);
    return NextResponse.json({ error: "failed to load sessions" }, { status: 500 });
  }
}
