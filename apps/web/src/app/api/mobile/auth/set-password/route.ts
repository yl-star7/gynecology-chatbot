import { NextRequest, NextResponse } from "next/server";
import { setUserPassword } from "@/lib/mobile/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const verificationToken = typeof body.verificationToken === "string" ? body.verificationToken : "";
    const password = typeof body.password === "string" ? body.password.trim() : "";

    if (!verificationToken || !password) {
      return NextResponse.json({ error: "verificationToken and password are required" }, { status: 400 });
    }

    const user = await setUserPassword(verificationToken, password);
    return NextResponse.json({ user });
  } catch (error) {
    console.error("mobile set password route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to set password" }, { status: 400 });
  }
}
