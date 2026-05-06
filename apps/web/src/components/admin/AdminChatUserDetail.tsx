"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AdminChatUserProfile {
  userId: string;
  displayName: string | null;
  phoneLast4: string | null;
  week: number | null;
  day: number | null;
  accountStatus: string;
  createdAt: string | null;
  lastLoginAt: string | null;
}

export interface AdminChatSessionRow {
  sessionId: string;
  title: string;
  status: string;
  lastMessageAt: string | null;
  createdAt: string | null;
  messageCount: number;
}

interface AdminChatUserDetailProps {
  profile: AdminChatUserProfile;
  sessions: AdminChatSessionRow[];
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

export function AdminChatUserDetail({
  profile,
  sessions,
}: AdminChatUserDetailProps) {
  return (
    <section className="space-y-6">
      <Button asChild variant="link" className="px-0">
        <Link href="/admin/chats">유저 목록으로 돌아갑니다</Link>
      </Button>

      <Card className="shadow-sm">
        <CardContent className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoCell label="닉네임" value={profile.displayName ?? "(닉 없음)"} />
          <InfoCell
            label="번호 뒷자리"
            value={
              profile.phoneLast4 ? `****${profile.phoneLast4}` : "확인 불가"
            }
          />
          <InfoCell
            label="임신 주차"
            value={
              profile.week != null
                ? `${profile.week}주${profile.day != null ? ` ${profile.day}일` : ""}`
                : "주차 미상"
            }
          />
          <InfoCell
            label="계정 상태"
            value={accountStatusLabel(profile.accountStatus)}
          />
          <InfoCell label="가입일" value={formatDateTime(profile.createdAt)} />
          <InfoCell
            label="마지막 로그인"
            value={formatDateTime(profile.lastLoginAt)}
          />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">
            최근 세션 ({sessions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>제목</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>최근 메시지</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>메시지 수</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-8 text-center text-muted-foreground"
                    >
                      대화 세션이 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow
                      key={session.sessionId}
                      className="cursor-pointer"
                      onClick={() => {
                        window.location.href = `/admin/chats/${profile.userId}/${session.sessionId}`;
                      }}
                    >
                      <TableCell className="font-medium">
                        {session.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{session.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {formatDateTime(session.lastMessageAt)}
                      </TableCell>
                      <TableCell>{formatDateTime(session.createdAt)}</TableCell>
                      <TableCell>
                        {session.messageCount.toLocaleString("ko-KR")}
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

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
