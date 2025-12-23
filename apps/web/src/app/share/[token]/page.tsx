/**
 * Shared Message View Page
 * /share/[token] - View a publicly shared message
 */

import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

interface PageProps {
    params: Promise<{ token: string }>;
}

async function getSharedMessage(token: string) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: savedMessage, error } = await supabase
        .from("saved_messages")
        .select(`
      id,
      title,
      note,
      tags,
      share_expires_at,
      created_at,
      messages:message_id(
        id,
        role,
        content,
        attachments,
        created_at
      ),
      conversations:conversation_id(
        title
      )
    `)
        .eq("share_token", token)
        .eq("is_shared", true)
        .single();

    if (error || !savedMessage) return null;

    // Check expiration
    if (savedMessage.share_expires_at) {
        const expiresAt = new Date(savedMessage.share_expires_at);
        if (expiresAt < new Date()) return null;
    }

    return savedMessage;
}

export default async function SharedMessagePage({ params }: PageProps) {
    const { token } = await params;
    const sharedMessage = await getSharedMessage(token);

    if (!sharedMessage) {
        notFound();
    }

    const message = sharedMessage.messages as {
        role: string;
        content: string;
        attachments: unknown[];
        created_at: string;
    };

    const conversation = sharedMessage.conversations as { title: string };

    return (
        <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
            <div className="max-w-2xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm mb-4">
                        <span className="text-2xl">🤱</span>
                        <span className="text-sm text-gray-600">부인과 AI 챗봇</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {sharedMessage.title || "공유된 대화"}
                    </h1>
                    {conversation?.title && (
                        <p className="text-sm text-gray-500 mt-2">
                            대화: {conversation.title}
                        </p>
                    )}
                </div>

                {/* Message Card */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    {/* Message Content */}
                    <div className="p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                                {message.role === "assistant" ? "🤖" : "👤"}
                            </div>
                            <div className="flex-1">
                                <div className="text-sm text-gray-500 mb-2">
                                    {message.role === "assistant" ? "AI 상담사" : "사용자"}
                                </div>
                                <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                                    {message.content}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Note */}
                    {sharedMessage.note && (
                        <div className="px-6 pb-6">
                            <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                                <div className="text-sm text-yellow-800">
                                    <span className="font-medium">📝 메모:</span> {sharedMessage.note}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    {sharedMessage.tags && sharedMessage.tags.length > 0 && (
                        <div className="px-6 pb-6">
                            <div className="flex flex-wrap gap-2">
                                {sharedMessage.tags.map((tag: string) => (
                                    <span
                                        key={tag}
                                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
                                    >
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span>
                                공유일: {new Date(sharedMessage.created_at).toLocaleDateString("ko-KR")}
                            </span>
                            {sharedMessage.share_expires_at && (
                                <span>
                                    만료: {new Date(sharedMessage.share_expires_at).toLocaleDateString("ko-KR")}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-8 text-center">
                    <p className="text-gray-600 mb-4">
                        임신 관련 궁금한 점이 있으신가요?
                    </p>
                    <a
                        href="/"
                        className="inline-flex items-center gap-2 bg-pink-500 text-white px-6 py-3 rounded-full font-medium hover:bg-pink-600 transition-colors"
                    >
                        <span>💬</span>
                        AI 상담 시작하기
                    </a>
                </div>

                {/* Disclaimer */}
                <div className="mt-8 text-center text-xs text-gray-400">
                    <p>
                        ⚠️ AI 상담 내용은 참고용이며, 의료적 결정은 전문의와 상담하세요.
                    </p>
                </div>
            </div>
        </div>
    );
}
