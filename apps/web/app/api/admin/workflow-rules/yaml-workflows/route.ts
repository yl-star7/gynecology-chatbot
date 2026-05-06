import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";

export async function GET() {
  const admin = await readAdminSessionUser();
  if (!admin) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return NextResponse.json([]);
}
