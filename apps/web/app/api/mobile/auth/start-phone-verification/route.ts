import { NextRequest, NextResponse } from "next/server";
import { startPhoneVerification } from "@/lib/mobile/auth";
import { checkRateLimit } from "@/lib/mobile/rate-limit";

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "phoneNumber is required" },
        { status: 400 },
      );
    }

    const ipRateCheck = checkRateLimit(
      `mobile-auth-start:${getClientIp(request)}:${phoneNumber}`,
      5,
      60_000,
    );
    const phoneRateCheck = checkRateLimit(
      `mobile-auth-start-phone:${phoneNumber}`,
      5,
      600_000,
    );
    const rateCheck = !ipRateCheck.allowed
      ? ipRateCheck
      : !phoneRateCheck.allowed
        ? phoneRateCheck
        : null;
    if (rateCheck) {
      return NextResponse.json(
        { error: "요청이 잠시 많아요. 조금 뒤에 다시 시도해주세요." },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rateCheck.resetAt - Date.now()) / 1000),
            ),
          },
        },
      );
    }

    const result = await startPhoneVerification(phoneNumber);
    return NextResponse.json(result);
  } catch (error) {
    console.error("mobile start phone verification route error", error);
    return NextResponse.json(
      {
        error:
          "인증 요청을 진행하지 못했어요. 입력한 정보를 다시 확인해주세요.",
      },
      { status: 400 },
    );
  }
}
