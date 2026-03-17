import { NextRequest, NextResponse } from "next/server";
import { authenticateAdmin, writeAdminSession } from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!phoneNumber || !password) {
      return NextResponse.json({ error: "phoneNumber and password are required" }, { status: 400 });
    }

    const admin = await authenticateAdmin({ phoneNumber, password });
    await writeAdminSession(admin.id);

    return NextResponse.json({ admin });
  } catch (error) {
    console.error("admin auth login route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to sign in admin" }, { status: 400 });
  }
}
