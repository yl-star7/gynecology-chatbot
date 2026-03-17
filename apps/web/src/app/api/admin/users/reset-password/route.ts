import { NextRequest, NextResponse } from "next/server";
import { createAdminServices } from "@/lib/admin/create-admin-services";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!userId || !reason) {
      return NextResponse.json({ error: "userId and reason are required" }, { status: 400 });
    }

    const services = createAdminServices();
    await services.adminUserPort.resetPassword({ userId, reason });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin reset password route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to reset password" }, { status: 400 });
  }
}
