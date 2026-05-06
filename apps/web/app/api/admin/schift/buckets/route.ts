import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { loadSchiftDrift } from "@/lib/admin/lexicon-drift";

export async function GET() {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const drift = await loadSchiftDrift();
  return NextResponse.json({ drift });
}
