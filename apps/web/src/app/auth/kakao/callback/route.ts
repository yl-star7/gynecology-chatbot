/**
 * Kakao OAuth - Callback Handler
 * GET /auth/kakao/callback
 */

import { NextRequest, NextResponse } from "next/server";
import { getKakaoToken, getKakaoUser, signInWithKakao } from "@/lib/kakao-auth";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
        console.error("Kakao OAuth error:", error);
        return NextResponse.redirect(
            new URL("/login?error=kakao_auth_failed", request.url)
        );
    }

    if (!code) {
        return NextResponse.redirect(
            new URL("/login?error=no_code", request.url)
        );
    }

    try {
        // Exchange code for token
        const tokenResponse = await getKakaoToken(code);

        // Get user info from Kakao
        const kakaoUser = await getKakaoUser(tokenResponse.access_token);

        // Sign in or create user in Supabase
        const { isNewUser } = await signInWithKakao(kakaoUser);

        // Redirect based on whether user needs onboarding
        if (isNewUser) {
            return NextResponse.redirect(new URL("/onboarding", request.url));
        }

        return NextResponse.redirect(new URL("/chat", request.url));
    } catch (error) {
        console.error("Kakao callback error:", error);
        return NextResponse.redirect(
            new URL("/login?error=callback_failed", request.url)
        );
    }
}
