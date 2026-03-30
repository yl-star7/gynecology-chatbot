import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, writeAdminSession } from "@/lib/admin/auth";
import { checkRateLimit } from "@/lib/mobile/rate-limit";

function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: "phoneNumber and password are required" }, { status: 400 });
    }

    const rateCheck = checkRateLimit(`admin-login:${getClientIp(request)}`, 5, 60_000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "너무 많은 요청이에요. 잠시 후 다시 시도해주세요." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((rateCheck.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }

    const admin = await authenticateAdmin({ phoneNumber, password });
    await writeAdminSession(admin.id);

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("admin auth login route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to sign in admin" }, { status: 400 });
  }
}
