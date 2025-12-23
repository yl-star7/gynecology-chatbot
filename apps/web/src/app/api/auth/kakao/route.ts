/**
 * Kakao OAuth - Start Authorization
 * GET /api/auth/kakao
 */

import { NextResponse } from "next/server";
import { getKakaoAuthUrl } from "@/lib/kakao-auth";

export async function GET() {
    try {
        const authUrl = getKakaoAuthUrl();
        return NextResponse.redirect(authUrl);
    } catch (error) {
        console.error("Kakao auth error:", error);
        return NextResponse.json(
            { error: "Failed to initiate Kakao login" },
            { status: 500 }
        );
    }
}
