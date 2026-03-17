import { NextRequest, NextResponse } from "next/server";
import { verifyPhoneNumber } from "@/lib/mobile/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const verificationCode = typeof body.verificationCode === "string" ? body.verificationCode.trim() : "";

    if (!phoneNumber || !verificationCode) {
      return NextResponse.json({ error: "phoneNumber and verificationCode are required" }, { status: 400 });
    }

    const verification = await verifyPhoneNumber(phoneNumber, verificationCode);
    return NextResponse.json(verification);
  } catch (error) {
    console.error("mobile verify phone route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to verify phone" }, { status: 400 });
  }
}
