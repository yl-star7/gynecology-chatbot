import { NextRequest, NextResponse } from "next/server";
import { completePhoneSignIn } from "@/lib/mobile/auth";
import { checkRateLimit } from "@/lib/mobile/rate-limit";

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const verificationCode = typeof body.verificationCode === "string" ? body.verificationCode.trim() : "";

    if (!phoneNumber || !verificationCode) {
      return NextResponse.json({ error: "phoneNumber and verificationCode are required" }, { status: 400 });
    }

    const rateCheck = checkRateLimit(
      `mobile-auth-login:${getClientIp(request)}:${phoneNumber}`,
      10,
      60_000,
    );
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "요청이 잠시 많아요. 조금 뒤에 다시 시도해주세요." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }

    const result = await completePhoneSignIn(phoneNumber, verificationCode);
    return NextResponse.json(result);
  } catch (error) {
    console.error("mobile auth login route error", error);
    return NextResponse.json(
      { error: "로그인을 진행하지 못했어요. 입력한 정보를 다시 확인해주세요." },
      { status: 400 },
    );
  }
}
