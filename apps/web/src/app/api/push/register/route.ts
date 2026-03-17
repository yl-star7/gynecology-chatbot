import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  if (!body?.pushToken) {
    return NextResponse.json({ error: "pushToken is required" }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
