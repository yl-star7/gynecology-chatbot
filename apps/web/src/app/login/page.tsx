/**
 * Kakao-Only Login Page
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);

    const handleKakaoLogin = () => {
        setIsLoading(true);
        // Redirect to our internal Kakao API route that handles Supabase Auth
        window.location.href = "/api/auth/kakao";
    };

    return (
        <div className="min-h-screen bg-[#FFF5F7] flex flex-col items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                {/* Logo/Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-4xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        🤱
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-3xl font-extrabold text-neutral-900 mb-2 tracking-tight">
                    부인과 AI 상담사
                </h1>
                <p className="text-neutral-600 mb-12 text-lg">
                    당신의 가장 따뜻한 임신 동반자
                </p>

                {/* Login Card */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 pt-10 border border-white/50 backdrop-blur-xl relative overflow-hidden">
                    {/* Decorative background element */}
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-pink-100 rounded-full blur-3xl opacity-50" />

                    <div className="relative z-10">
                        <p className="text-sm font-medium text-neutral-500 mb-8">
                            3초 만에 회원가입하고 상담을 시작하세요
                        </p>

                        {/* Kakao Button */}
                        <button
                            onClick={handleKakaoLogin}
                            disabled={isLoading}
                            className={cn(
                                "w-full h-16 bg-[#FEE500] rounded-2xl flex items-center justify-center gap-3 px-6",
                                "text-[#191919] font-bold text-lg",
                                "hover:bg-[#FADA0A] active:scale-[0.98] transition-all",
                                "shadow-[0_4px_12px_rgba(254,229,0,0.3)]",
                                isLoading && "opacity-70 cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-3 border-[#191919]/20 border-t-[#191919] rounded-full animate-spin" />
                            ) : (
                                <>
                                    <svg
                                        className="w-6 h-6"
                                        viewBox="0 0 24 24"
                                        fill="currentColor"
                                    >
                                        <path d="M12 3c-4.97 0-9 3.18-9 7.11 0 2.55 1.7 4.79 4.26 6.04-.17.65-.63 2.37-.72 2.76-.11.45.17.44.36.32.14-.09 2.3-1.56 3.23-2.18.6.09 1.23.14 1.87.14 4.97 0 9-3.18 9-7.11S16.97 3 12 3z" />
                                    </svg>
                                    카카오로 시작하기
                                </>
                            )}
                        </button>

                        {/* Support links */}
                        <div className="mt-8 flex items-center justify-center gap-6 text-xs text-neutral-400">
                            <Link href="/terms" className="hover:text-neutral-600 underline underline-offset-4 decoration-neutral-200">
                                이용약관
                            </Link>
                            <Link href="/privacy" className="hover:text-neutral-600 underline underline-offset-4 decoration-neutral-200">
                                개인정보처리방침
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Footer Meta */}
                <div className="mt-12 text-neutral-400 text-xs text-center flex items-center justify-center gap-2">
                    <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                    Vercel AI SDK & Gemini 2.0 Powered
                    <span className="w-1 h-1 bg-neutral-300 rounded-full" />
                </div>
            </div>
        </div>
    );
}
