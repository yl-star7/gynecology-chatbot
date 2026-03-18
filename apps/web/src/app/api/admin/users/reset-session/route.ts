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
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!userId || !reason) {
      return NextResponse.json(
        { error: "userId and reason are required" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    await services.adminUserPort.resetSession({
      actorId: admin.id,
      userId,
      reason,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin reset session route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "failed to reset session",
      },
      { status: 400 },
    );
  }
}
