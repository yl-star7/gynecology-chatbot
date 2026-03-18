import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await request.json();
    return NextResponse.json(
      {
        error:
          "password-based authentication has been removed. Use phone verification instead.",
      },
      { status: 410 },
    );
  } catch (error) {
    console.error("mobile set password route error", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "failed to set password" }, { status: 400 });
  }
}
