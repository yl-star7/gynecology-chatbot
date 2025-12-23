/**
 * Environment Configuration
 * Validates and exports environment variables with type safety
 */

function getEnv(key: string, required: boolean = true): string {
    const value = process.env[key];
    if (required && !value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value || "";
}

function getEnvOptional(key: string, defaultValue: string = ""): string {
    return process.env[key] || defaultValue;
}

export const env = {
    // Supabase
    supabase: {
        url: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
        anonKey: getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
        serviceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    },

    // Database (Prisma)
    database: {
        url: getEnvOptional("DATABASE_URL"),
    },

    // Google AI
    google: {
        geminiApiKey: getEnv("GEMINI_API_KEY"),
        applicationCredentials: getEnvOptional("GOOGLE_APPLICATION_CREDENTIALS"),
    },

    // App
    app: {
        url: getEnvOptional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
        secret: getEnvOptional("NEXTAUTH_SECRET"),
    },

    // Kakao OAuth
    kakao: {
        clientId: getEnvOptional("KAKAO_CLIENT_ID"),
        clientSecret: getEnvOptional("KAKAO_CLIENT_SECRET"),
    },

    // Feature flags
    features: {
        imagenEnabled: getEnvOptional("IMAGEN_ENABLED", "false") === "true",
        proactiveChatEnabled: getEnvOptional("PROACTIVE_CHAT_ENABLED", "true") === "true",
    },

    // Runtime checks
    isDev: process.env.NODE_ENV === "development",
    isProd: process.env.NODE_ENV === "production",
};

/**
 * Validate all required environment variables
 * Call this at app startup
 */
export function validateEnv(): { valid: boolean; missing: string[] } {
    const requiredVars = [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "GEMINI_API_KEY",
    ];

    const missing = requiredVars.filter((key) => !process.env[key]);

    return {
        valid: missing.length === 0,
        missing,
    };
}
