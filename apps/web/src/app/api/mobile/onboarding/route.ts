import { DEFAULT_MOBILE_THEME_KEY } from "@gynecology-chatbot/app-core";
import { NextRequest, NextResponse } from "next/server";
import { completeUserOnboarding } from "@/lib/mobile/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const pregnancyWeekOrDueDate =
      typeof body.pregnancyWeekOrDueDate === "string"
        ? body.pregnancyWeekOrDueDate.trim()
        : "";
    const tonePreference =
      typeof body.tonePreference === "string" ? body.tonePreference.trim() : "";
    const dueDate = typeof body.dueDate === "string" ? body.dueDate.trim() : "";
    const themeKey =
      typeof body.themeKey === "string" ? body.themeKey.trim() : "";

    if (!userId || !pregnancyWeekOrDueDate || !tonePreference) {
      return NextResponse.json(
        {
          error:
            "userId, pregnancyWeekOrDueDate, and tonePreference are required",
        },
        { status: 400 },
      );
    }

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
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to save onboarding",
      },
      { status: 400 },
    );
  }
}
