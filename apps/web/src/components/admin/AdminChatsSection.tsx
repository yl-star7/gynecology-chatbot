"use client";

import { useMemo, useState, type FormEvent } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AdminChatsUserRow {
  userId: string;
  displayName: string | null;
  phoneLast4: string | null;
  week: number | null;
  day: number | null;
  lastMessageAt: string | null;
  messageCount: number;
  accountStatus: string;
}

interface AdminChatsSectionProps {
  users: AdminChatsUserRow[];
  initialQuery: string;
  totalMatched: number;
  pageSize: number;
}

function formatDateTime(value: string | null) {
  if (!value) return "없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "없음";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWeekDay(week: number | null, day: number | null) {
  if (week == null) return "주차 미상";
  const dayLabel = day != null ? `${day}일` : "";
  return `${week}주 ${dayLabel}`.trim();
}

function accountStatusLabel(status: string) {
  switch (status) {
    case "active":
      return "활성";
    case "suspended":
      return "정지";
    case "withdrawn":
      return "탈퇴";
    default:
      return status;
  }
}

export function AdminChatsSection({
  users,
  initialQuery,
  totalMatched,
  pageSize,
}: AdminChatsSectionProps) {
  const [query, setQuery] = useState(initialQuery);

  const rows = useMemo(() => users, [users]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    const nextUrl = trimmed
      ? `/admin/chats?query=${encodeURIComponent(trimmed)}`
      : "/admin/chats";
    window.location.href = nextUrl;
  }

  return (
    <section className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-lg">대화 사용자</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              총 {totalMatched.toLocaleString("ko-KR")}명 중 최대 {pageSize}명
              표시
            </p>
          </div>
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[420px] sm:flex-row sm:items-end"
          >
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="admin-chats-query">검색</Label>
              <Input
                id="admin-chats-query"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="닉네임 또는 전화번호(E.164)"
              />
            </div>
            <Button type="submit">검색</Button>
          </form>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>닉</TableHead>
                  <TableHead>주차/일차</TableHead>
                  <TableHead>최근 세션</TableHead>
                  <TableHead>메시지 수</TableHead>
                  <TableHead>계정 상태</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      조건에 맞는 사용자가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow
                      key={row.userId}
                      className="cursor-pointer"
                      onClick={() => {
                        window.location.href = `/admin/chats/${row.userId}`;
                      }}
                    >
                      <TableCell>
                        <div className="font-medium">
                          {row.displayName ?? "(닉 없음)"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {row.phoneLast4
                            ? `****${row.phoneLast4}`
                            : "번호 확인 불가"}
                        </div>
                      </TableCell>
                      <TableCell>{formatWeekDay(row.week, row.day)}</TableCell>
                      <TableCell>{formatDateTime(row.lastMessageAt)}</TableCell>
                      <TableCell>
                        {row.messageCount.toLocaleString("ko-KR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {accountStatusLabel(row.accountStatus)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
