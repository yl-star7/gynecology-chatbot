import { NextRequest, NextResponse } from "next/server";
import { signInUserByPhoneNumber } from "@/lib/mobile/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: "phoneNumber and password are required" }, { status: 400 });
    }

    const user = await signInUserByPhoneNumber(phoneNumber, password);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("mobile auth login route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to sign in" }, { status: 400 });
  }
}
