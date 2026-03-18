import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await request.json();
    return NextResponse.json(
      {
        error:
          "password reset is no longer required. Re-run phone verification to sign in again.",
      },
      { status: 410 },
    );
  } catch (error) {
    console.error("mobile request password reset route error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "failed to request password reset" },
      { status: 400 },
    );
  }
}
