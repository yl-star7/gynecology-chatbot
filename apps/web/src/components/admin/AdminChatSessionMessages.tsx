"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/components/ui/cn";

export interface AdminChatMessageRow {
  messageId: string;
  role: string;
  plainText: string;
  partsSummary: string;
  modelName: string | null;
  createdAt: string;
}

export interface AdminChatQuestionAnswerRow {
  eventId: string;
  questionId: string;
  questionText: string;
  answerText: string | null;
  appSummary: string | null;
  status: string;
  sentAt: string | null;
  answeredAt: string | null;
}

interface AdminChatSessionMessagesProps {
  userId: string;
  sessionId: string;
  sessionTitle: string;
  messages: AdminChatMessageRow[];
  questionAnswers: AdminChatQuestionAnswerRow[];
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function roleLabel(role: string) {
  switch (role) {
    case "user":
      return "사용자";
    case "assistant":
      return "챗봇";
    case "system":
      return "시스템";
    case "tool":
      return "도구";
    default:
      return role;
  }
}

function roleClassName(role: string) {
  switch (role) {
    case "user":
      return "border-primary-200 bg-primary-50 text-primary-700";
    case "assistant":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "system":
      return "border-violet-200 bg-violet-50 text-violet-700";
    case "tool":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-border bg-muted text-muted-foreground";
  }
}

function questionStatusLabel(status: string) {
  switch (status) {
    case "sent":
      return "전송";
    case "opened":
      return "열람";
    case "answered":
      return "답변 완료";
    case "skipped":
      return "건너뜀";
    default:
      return status;
  }
}

export function AdminChatSessionMessages({
  userId,
  sessionId,
  sessionTitle,
  messages,
  questionAnswers,
}: AdminChatSessionMessagesProps) {
  return (
    <section className="space-y-4">
      <Button asChild variant="link" className="px-0">
        <Link href={`/admin/chats/${userId}`}>세션 목록으로 돌아갑니다</Link>
      </Button>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">{sessionTitle}</CardTitle>
          <p className="text-xs text-muted-foreground">세션 ID: {sessionId}</p>
          <p className="text-xs text-muted-foreground">
            총 {messages.length.toLocaleString("ko-KR")}개의 메시지가
            기록되었습니다.
          </p>
        </CardHeader>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            질문/답변 기록 ({questionAnswers.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            오늘의 질문 선택과 답변 저장 상태를 user_question_events 기준으로
            표시합니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {questionAnswers.length === 0 ? (
            <div className="rounded-md border bg-muted p-4 text-sm text-muted-foreground">
              이 세션에 저장된 질문/답변 이벤트가 없습니다.
            </div>
          ) : (
            questionAnswers.map((item) => (
              <div
                key={item.eventId}
                className="space-y-2 rounded-md border p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge variant="outline">
                    {questionStatusLabel(item.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {item.answeredAt
                      ? `답변 ${formatDateTime(item.answeredAt)}`
                      : item.sentAt
                        ? `전송 ${formatDateTime(item.sentAt)}`
                        : "시간 없음"}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-6">
                  Q. {item.questionText}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  원문 답변:{" "}
                  {item.answerText?.trim() || "아직 답변이 없습니다."}
                </p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  앱 표시 요약:{" "}
                  {item.appSummary?.trim() || "아직 요약이 없습니다."}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {messages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              메시지가 없습니다.
            </CardContent>
          </Card>
        ) : (
          messages.map((message) => (
            <Card key={message.messageId} className="shadow-sm">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Badge
                    variant="outline"
                    className={cn(
                      "whitespace-nowrap",
                      roleClassName(message.role),
                    )}
                  >
                    {roleLabel(message.role)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(message.createdAt)}
                    {message.modelName ? ` · ${message.modelName}` : ""}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6">
                  {message.plainText || "(본문이 비어 있습니다.)"}
                </p>
                {message.partsSummary ? (
                  <p className="text-xs text-muted-foreground">
                    parts: {message.partsSummary}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </section>
  );
}
