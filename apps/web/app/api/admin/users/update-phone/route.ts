import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const phoneNumber = typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!userId || !phoneNumber || !reason) {
      return NextResponse.json({ error: "userId, phoneNumber, and reason are required" }, { status: 400 });
    }

    const services = createAdminServices();
    await services.adminUserPort.updatePhoneNumber({
      actorId: admin.id,
      userId,
      phoneNumber,
      reason,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin update phone route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to update phone number" }, { status: 400 });
  }
}
