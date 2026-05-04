import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/mobile/auth";
import { requireMobileSession } from "@/lib/mobile/session-auth";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireMobileSession(request, null, {
      requireApproved: false,
    });
    const user = await getAuthenticatedUser(userId);

    if (!user) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("mobile auth session route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to restore session",
      },
      { status: 401 },
    );
  }
}
