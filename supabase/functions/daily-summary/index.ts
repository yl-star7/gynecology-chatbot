import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface ChecklistEvent {
  user_id: string;
  answer_text: string | null;
  status: string;
  completed_at: string | null;
  week_checklists: { title: string } | null;
}

interface QuestionEvent {
  user_id: string;
  answer_text: string | null;
  status: string;
  answered_at: string | null;
  week_questions: { question_text: string } | null;
}

interface ChatSnippet {
  user_id: string;
  session_title: string;
  user_messages: string;
  message_count: number;
}

interface UserDayData {
  userId: string;
  checklists: Array<{ title: string; answer: string | null; completed: boolean }>;
  questions: Array<{ question: string; answer: string | null; answered: boolean }>;
  chatSnippets: string;
  sessionCount: number;
}

function getKstYesterday(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  kst.setDate(kst.getDate() - 1);
  return kst.toISOString().slice(0, 10);
}

async function fetchUserDayData(targetDate: string): Promise<UserDayData[]> {
  const kstStart = `${targetDate}T00:00:00+09:00`;
  const kstEnd = `${targetDate}T23:59:59+09:00`;

  const [{ data: rawChecklists }, { data: rawQuestions }, { data: chatData }] =
    await Promise.all([
      supabase
        .from("user_checklist_events")
        .select("user_id, answer_text, status, completed_at, week_checklists:checklist_id(title)")
        .gte("updated_at", kstStart)
        .lt("updated_at", kstEnd),
      supabase
        .from("user_question_events")
        .select("user_id, answer_text, status, answered_at, week_questions:question_id(question_text)")
        .gte("updated_at", kstStart)
        .lt("updated_at", kstEnd),
      supabase.rpc("get_chat_snippets_for_date", { target_date: targetDate }),
    ]);

  const userMap = new Map<string, UserDayData>();

  function ensureUser(userId: string): UserDayData {
    if (!userMap.has(userId)) {
      userMap.set(userId, {
        userId,
        checklists: [],
        questions: [],
        chatSnippets: "",
        sessionCount: 0,
      });
    }
    return userMap.get(userId)!;
  }

  for (const row of (rawChecklists ?? []) as ChecklistEvent[]) {
    const user = ensureUser(row.user_id);
    user.checklists.push({
      title: row.week_checklists?.title ?? "체크리스트",
      answer: row.answer_text,
      completed: row.status === "completed",
    });
  }

  for (const row of (rawQuestions ?? []) as QuestionEvent[]) {
    const user = ensureUser(row.user_id);
    user.questions.push({
      question: row.week_questions?.question_text ?? "질문",
      answer: row.answer_text,
      answered: row.status === "answered",
    });
  }

  for (const row of (chatData ?? []) as ChatSnippet[]) {
    const user = ensureUser(row.user_id);
    user.chatSnippets = row.user_messages;
    user.sessionCount = row.message_count;
  }

  return Array.from(userMap.values());
}

async function callGemini(prompt: string): Promise<string | null> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 200, temperature: 0.3 },
      }),
    },
  );
  if (!response.ok) {
    console.error("Gemini error:", response.status, await response.text());
    return null;
  }
  const result = await response.json();
  return result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? null;
}

// ── 1. 하루 전체 요약 (ai_summary) ──────────────────────────────

function buildDaySummaryPrompt(data: UserDayData): string {
  const parts: string[] = [];
  if (data.checklists.length > 0) {
    parts.push(
      "[체크리스트]\n" +
        data.checklists
          .map((c) => `- ${c.title}: ${c.completed ? (c.answer ?? "완료") : "미완료"}`)
          .join("\n"),
    );
  }
  if (data.questions.length > 0) {
    parts.push(
      "[질문 응답]\n" +
        data.questions
          .map((q) => `- ${q.question}: ${q.answered ? (q.answer ?? "응답함") : "미응답"}`)
          .join("\n"),
    );
  }
  if (data.chatSnippets) {
    parts.push(`[대화 내용]\n${data.chatSnippets}`);
  }
  if (parts.length === 0) return "";
  return [
    "아래는 임산부 사용자의 하루 활동 기록이에요.",
    "따뜻한 톤(-어요/-해요 체)으로 2~3문장으로 자연스럽게 요약해 주세요.",
    "체크리스트 완료 여부, 질문 응답, 주요 대화 주제를 포함해 주세요.",
    "",
    parts.join("\n\n"),
  ].join("\n");
}

function buildFallbackDaySummary(data: UserDayData): string {
  const parts: string[] = [];
  const done = data.checklists.filter((c) => c.completed).length;
  if (done > 0) parts.push(`체크리스트 ${done}개를 완료했어요`);
  const answered = data.questions.filter((q) => q.answered).length;
  if (answered > 0) parts.push(`질문 ${answered}개에 응답했어요`);
  if (data.sessionCount > 0) parts.push(`${data.sessionCount}개의 대화를 나눴어요`);
  return parts.length > 0
    ? `이날에는 ${parts.join(", ")}.`
    : "이날에는 활동 기록이 없어요.";
}

// ── 2. 질문별 개별 저장 (question_summary) ──────────────────────
// 질문 주제가 각각 다르므로 질문별로 calendar_logs 1건씩 저장한다.
// AI 요약 없이 Q&A 원문 저장 — 개별 Q&A에 Gemini 호출은 비용 낭비.

// ── main ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const targetDate =
      (body as { targetDate?: string }).targetDate || getKstYesterday();

    console.log(`[daily-summary] target: ${targetDate}`);

    const users = await fetchUserDayData(targetDate);
    console.log(`[daily-summary] ${users.length} users found`);

    let aiSummaryCount = 0;
    let questionSummaryCount = 0;

    // 기존 요약 삭제 (재실행 안전)
    await Promise.all([
      supabase
        .from("calendar_logs")
        .delete()
        .eq("date", targetDate)
        .eq("entry_type", "ai_summary")
        .filter("payload->>source", "eq", "daily_conversation_summary"),
      supabase
        .from("calendar_logs")
        .delete()
        .eq("date", targetDate)
        .eq("entry_type", "question_summary")
        .filter("payload->>source", "eq", "daily_question_summary"),
    ]);

    const errors: string[] = [];

    for (const userData of users) {
      // 활동이 전혀 없으면 스킵
      const hasActivity =
        userData.checklists.length > 0 ||
        userData.questions.length > 0 ||
        (userData.chatSnippets && userData.chatSnippets.trim().length > 0);

      if (!hasActivity) {
        console.log(`[daily-summary] skipping ${userData.userId}: no activity`);
        continue;
      }

      // ── 하루 전체 요약 ──
      const dayPrompt = buildDaySummaryPrompt(userData);
      const daySummary = dayPrompt
        ? (await callGemini(dayPrompt)) ?? buildFallbackDaySummary(userData)
        : buildFallbackDaySummary(userData);

      const { error: dayError } = await supabase
        .from("calendar_logs")
        .insert({
          user_id: userData.userId,
          date: targetDate,
          entry_type: "ai_summary",
          title: "하루 요약",
          summary: daySummary,
          payload: {
            source: "daily_conversation_summary",
            checklistCount: userData.checklists.length,
            questionCount: userData.questions.length,
            sessionCount: userData.sessionCount,
            generatedAt: new Date().toISOString(),
          },
        });

      if (!dayError) aiSummaryCount++;
      else {
        const msg = `ai_summary: ${dayError.message} (${dayError.code})`;
        console.error(`[daily-summary]`, msg);
        errors.push(msg);
      }

      // ── 질문별 개별 저장 (question_summary) ──
      const answeredQuestions = userData.questions.filter(
        (q) => q.answered && q.answer,
      );
      for (const q of answeredQuestions) {
        const { error: qError } = await supabase
          .from("calendar_logs")
          .insert({
            user_id: userData.userId,
            date: targetDate,
            entry_type: "question_summary",
            title: q.question,
            summary: q.answer!,
            payload: {
              source: "daily_question_summary",
              question: q.question,
              answer: q.answer,
              generatedAt: new Date().toISOString(),
            },
          });

        if (!qError) questionSummaryCount++;
        else {
          const msg = `question_summary: ${qError.message} (${qError.code})`;
          console.error(`[daily-summary]`, msg);
          errors.push(msg);
        }
      }
    }

    const result = {
      targetDate,
      processedUsers: users.length,
      aiSummaries: aiSummaryCount,
      questionSummaries: questionSummaryCount,
      ...(errors.length > 0 ? { errors } : {}),
    };
    console.log(`[daily-summary] done:`, result);

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[daily-summary] error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
