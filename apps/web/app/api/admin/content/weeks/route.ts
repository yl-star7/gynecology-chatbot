import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { loadCachedAdminWeeks } from "@/lib/admin/admin-cache";

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const weeks = await loadCachedAdminWeeks();
    return NextResponse.json({ weeks });
  } catch (error) {
    console.error("admin content weeks route error", error);
    return NextResponse.json(
      { error: "failed to load weeks" },
      { status: 500 },
    );
  }
}
