import { NextRequest, NextResponse } from "next/server";
import { createPasswordResetAudit } from "@/lib/mobile/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";

    if (!phoneNumber) {
      return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });
    }

    const result = await createPasswordResetAudit(phoneNumber);
    return NextResponse.json(result);
  } catch (error) {
    console.error("mobile request password reset route error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to request password reset" },
      { status: 400 },
    );
  }
}
