import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    if (!body?.pushToken) {
      return NextResponse.json(
        { error: "pushToken is required" },
        { status: 400 },
      );
    }

    const { userId } = await requireMobileSession(request);

    await prisma.pregnancy_profiles.updateMany({
      where: { user_id: userId },
      data: {
        push_token: body.pushToken,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("push register route error", error);
    return mobileRouteErrorResponse(error, "failed to register push token");
  }
}
