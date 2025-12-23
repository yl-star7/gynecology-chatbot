/**
 * Kakao OAuth Utility
 * Handles Kakao login flow with Supabase Auth
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me";

interface KakaoTokenResponse {
    access_token: string;
    token_type: string;
    refresh_token: string;
    expires_in: number;
    scope: string;
    refresh_token_expires_in: number;
}

interface KakaoUserResponse {
    id: number;
    connected_at: string;
    properties?: {
        nickname?: string;
        profile_image?: string;
        thumbnail_image?: string;
    };
    kakao_account?: {
        profile_nickname_needs_agreement?: boolean;
        profile_image_needs_agreement?: boolean;
        profile?: {
            nickname?: string;
            thumbnail_image_url?: string;
            profile_image_url?: string;
            is_default_image?: boolean;
        };
        email_needs_agreement?: boolean;
        is_email_valid?: boolean;
        is_email_verified?: boolean;
        email?: string;
        age_range_needs_agreement?: boolean;
        age_range?: string;
        birthday_needs_agreement?: boolean;
        birthday?: string;
        gender_needs_agreement?: boolean;
        gender?: string;
    };
}

/**
 * Get the Kakao OAuth authorization URL
 */
export function getKakaoAuthUrl(): string {
    const clientId = process.env.KAKAO_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/kakao/callback`;

    const params = new URLSearchParams({
        client_id: clientId!,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "profile_nickname profile_image account_email",
    });

    return `${KAKAO_AUTH_URL}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function getKakaoToken(code: string): Promise<KakaoTokenResponse> {
    const clientId = process.env.KAKAO_CLIENT_ID;
    const clientSecret = process.env.KAKAO_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/auth/kakao/callback`;

    const response = await fetch(KAKAO_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            grant_type: "authorization_code",
            client_id: clientId!,
            client_secret: clientSecret!,
            redirect_uri: redirectUri,
            code,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get Kakao token: ${error}`);
    }

    return response.json();
}

/**
 * Get Kakao user information
 */
export async function getKakaoUser(accessToken: string): Promise<KakaoUserResponse> {
    const response = await fetch(KAKAO_USER_URL, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get Kakao user: ${error}`);
    }

    return response.json();
}

/**
 * Sign in or create user with Kakao credentials
 */
export async function signInWithKakao(kakaoUser: KakaoUserResponse) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    const email = kakaoUser.kakao_account?.email;
    const kakaoId = String(kakaoUser.id);
    const nickname = kakaoUser.properties?.nickname ||
        kakaoUser.kakao_account?.profile?.nickname ||
        `user_${kakaoId}`;
    const profileImage = kakaoUser.kakao_account?.profile?.profile_image_url ||
        kakaoUser.properties?.profile_image;

    // Check if user exists by kakao_id
    const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("kakao_id", kakaoId)
        .single();

    if (existingUser) {
        // User exists, sign them in
        const { data, error } = await supabase.auth.admin.getUserById(existingUser.id);
        if (error) throw error;

        // Create session for existing user
        const { data: session, error: sessionError } = await supabase.auth.signInWithPassword({
            email: data.user?.email || `${kakaoId}@kakao.placeholder`,
            password: `kakao_${kakaoId}_${process.env.NEXTAUTH_SECRET}`,
        });

        if (sessionError) {
            // If password sign-in fails, try admin sign-in
            await supabase.auth.admin.updateUserById(existingUser.id, {
                password: `kakao_${kakaoId}_${process.env.NEXTAUTH_SECRET}`,
            });

            const { data: retrySession } = await supabase.auth.signInWithPassword({
                email: data.user?.email || `${kakaoId}@kakao.placeholder`,
                password: `kakao_${kakaoId}_${process.env.NEXTAUTH_SECRET}`,
            });

            return { user: existingUser, session: retrySession, isNewUser: false };
        }

        return { user: existingUser, session, isNewUser: false };
    }

    // Create new user
    const userEmail = email || `${kakaoId}@kakao.placeholder`;

    const { data: newAuthUser, error: createError } = await supabase.auth.admin.createUser({
        email: userEmail,
        password: `kakao_${kakaoId}_${process.env.NEXTAUTH_SECRET}`,
        email_confirm: true,
        user_metadata: {
            full_name: nickname,
            avatar_url: profileImage,
            provider: "kakao",
            kakao_id: kakaoId,
        },
    });

    if (createError) throw createError;

    // Update the users table with Kakao-specific data
    await supabase
        .from("users")
        .update({
            kakao_id: kakaoId,
            auth_provider: "kakao",
            full_name: nickname,
        })
        .eq("id", newAuthUser.user.id);

    // Sign in the new user
    const { data: session } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: `kakao_${kakaoId}_${process.env.NEXTAUTH_SECRET}`,
    });

    return {
        user: { id: newAuthUser.user.id },
        session,
        isNewUser: true
    };
}
