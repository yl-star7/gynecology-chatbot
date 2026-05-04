import {
  createKoreanDateKey,
  DEFAULT_MOBILE_THEME_KEY,
  readIsoDateKey,
} from "@gynecology-chatbot/app-core";
import { NextRequest, NextResponse } from "next/server";
import { completeUserOnboarding } from "@/lib/mobile/auth";
import {
  mobileRouteErrorResponse,
  requireMobileSession,
} from "@/lib/mobile/session-auth";

function isValidDateOnly(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeDateOnly(value: string) {
  const trimmed = value.trim();
  const ymd = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (ymd) {
    return isValidDateOnly(ymd) ? ymd : "";
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const normalized = readIsoDateKey(trimmed) ?? createKoreanDateKey(parsed);
  return isValidDateOnly(normalized) ? normalized : "";
}

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
    const babyNickname =
      typeof body.babyNickname === "string" ? body.babyNickname.trim() : "";
    const themeKey =
      typeof body.themeKey === "string" ? body.themeKey.trim() : "";

    const { userId } = await requireMobileSession(request, hintedUserId, {
      requireApproved: false,
    });

    if (!pregnancyWeekOrDueDate || !tonePreference) {
      return NextResponse.json(
        {
          error: "pregnancyWeekOrDueDate and tonePreference are required",
        },
        { status: 400 },
      );
    }

    const weekNum = Number(pregnancyWeekOrDueDate);
    const extractedDueDate =
      normalizeDateOnly(dueDate) ||
      normalizeDateOnly(pregnancyWeekOrDueDate) ||
      "";
    const normalizedPregnancyWeekOrDueDate =
      extractedDueDate || pregnancyWeekOrDueDate;

    if (!isNaN(weekNum)) {
      if (weekNum < 1 || weekNum > 42) {
        return NextResponse.json(
          { error: "임신 주차는 1~42 사이여야 해요." },
          { status: 400 },
        );
      }
    } else if (!extractedDueDate) {
      return NextResponse.json(
        { error: "올바른 날짜 형식이 아니에요." },
        { status: 400 },
      );
    }

    const user = await completeUserOnboarding({
      userId,
      pregnancyWeekOrDueDate: normalizedPregnancyWeekOrDueDate,
      babyNickname: babyNickname || null,
      tonePreference,
      dueDate: extractedDueDate || null,
      themeKey: themeKey || DEFAULT_MOBILE_THEME_KEY,
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("mobile onboarding route error", error);
    return mobileRouteErrorResponse(error, "failed to save onboarding", 400);
  }
}
