import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const services = createAdminServices();
    const weeks = await services.adminContentPort.listWeeks();
    return NextResponse.json({ weeks });
  } catch (error) {
    console.error("admin content weeks route error", error);
    return NextResponse.json(
      { error: "failed to load weeks" },
      { status: 500 },
    );
  }
}
