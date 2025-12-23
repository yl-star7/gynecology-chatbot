/**
 * Health Check API
 * GET /api/health - Check service health
 */

import { NextResponse } from "next/server";
import { validateEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
    const startTime = Date.now();

    // Check environment
    const envCheck = validateEnv();

    // Check Supabase connection
    let supabaseStatus = "unknown";
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
            {
                headers: {
                    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
                },
            }
        );
        supabaseStatus = response.ok ? "healthy" : "unhealthy";
    } catch {
        supabaseStatus = "unreachable";
    }

    // Check Gemini API
    let geminiStatus = "unknown";
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
        );
        geminiStatus = response.ok ? "healthy" : "unhealthy";
    } catch {
        geminiStatus = "unreachable";
    }

    const responseTime = Date.now() - startTime;

    const health = {
        status: envCheck.valid && supabaseStatus === "healthy" ? "healthy" : "degraded",
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        version: process.env.npm_package_version || "0.1.0",
        environment: process.env.NODE_ENV,
        checks: {
            environment: {
                status: envCheck.valid ? "pass" : "fail",
                missing: envCheck.missing.length > 0 ? envCheck.missing : undefined,
            },
            supabase: {
                status: supabaseStatus,
            },
            gemini: {
                status: geminiStatus,
            },
        },
    };

    const statusCode = health.status === "healthy" ? 200 : 503;

    return NextResponse.json(health, { status: statusCode });
}
