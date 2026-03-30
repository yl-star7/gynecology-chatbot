import { DEFAULT_MOBILE_THEME_KEY } from "@gynecology-chatbot/app-core";
import { NextRequest, NextResponse } from "next/server";
import { completeUserOnboarding } from "@/lib/mobile/auth";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const hintedUserId = typeof body.userId === "string" ? body.userId : "";
    const pregnancyWeekOrDueDate =
      typeof body.pregnancyWeekOrDueDate === "string"
        ? body.pregnancyWeekOrDueDate.trim()
        : "";
    const tonePreference =
      typeof body.tonePreference === "string" ? body.tonePreference.trim() : "";
    const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
    const themeKey =
      typeof body.themeKey === "string" ? body.themeKey.trim() : "";

    if (!pregnancyWeekOrDueDate || !tonePreference) {
      return NextResponse.json(
        {
          error: "pregnancyWeekOrDueDate and tonePreference are required",
        },
        { status: 400 },
      );
    }

    const weekNum = Number(pregnancyWeekOrDueDate);
    if (!isNaN(weekNum)) {
      if (weekNum < 1 || weekNum > 42) {
        return NextResponse.json(
          { error: "임신 주차는 1~42 사이여야 해요." },
          { status: 400 },
        );
      }
    } else {
      const date = new Date(pregnancyWeekOrDueDate);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { error: "올바른 날짜 형식이 아니에요." },
          { status: 400 },
        );
      }
    }
    const { userId } = await requireMobileSession(request, hintedUserId);

    const user = await completeUserOnboarding({
      userId,
      pregnancyWeekOrDueDate,
      tonePreference,
      dueDate: dueDate || null,
      themeKey: themeKey || DEFAULT_MOBILE_THEME_KEY,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("mobile onboarding route error", error);
    return mobileRouteErrorResponse(error, "failed to save onboarding", 400);
  }
}
