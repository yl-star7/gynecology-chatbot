"use client";

import { useState, type FormEvent, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AdminChatActionRow {
  id: string;
  userId: string;
  userLabel: string;
  phoneNumber: string;
  actionType: string;
  detail: string;
  occurredAt: string;
}

interface AdminChatActionsFeedProps {
  actions: AdminChatActionRow[];
  actionTypes: string[];
  initialFilters: {
    phoneNumber: string;
    actionType: string;
    from: string;
    to: string;
  };
  limit: number;
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
  });
}

export function AdminChatActionsFeed({
  actions,
  actionTypes,
  initialFilters,
  limit,
}: AdminChatActionsFeedProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialFilters.phoneNumber);
  const [actionType, setActionType] = useState(initialFilters.actionType);
  const [from, setFrom] = useState(initialFilters.from);
  const [to, setTo] = useState(initialFilters.to);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (phoneNumber.trim()) params.set("phoneNumber", phoneNumber.trim());
    if (actionType && actionType !== "all")
      params.set("actionType", actionType);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const query = params.toString();
    window.location.href = query
      ? `/admin/chats/actions?${query}`
      : "/admin/chats/actions";
  }

  return (
    <section className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">사용자 액션 로그</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 items-end gap-3 rounded-md border bg-muted p-4 md:grid-cols-5"
          >
            <Field label="전화번호" htmlFor="admin-chat-action-phone">
              <Input
                id="admin-chat-action-phone"
                type="text"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="01012345678"
              />
            </Field>
            <Field label="액션 타입" htmlFor="admin-chat-action-type">
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger id="admin-chat-action-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체</SelectItem>
                  {actionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="시작일" htmlFor="admin-chat-action-from">
              <Input
                id="admin-chat-action-from"
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </Field>
            <Field label="종료일" htmlFor="admin-chat-action-to">
              <Input
                id="admin-chat-action-to"
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </Field>
            <Button type="submit">적용</Button>
          </form>

          <p className="text-sm text-muted-foreground">
            최근 {actions.length.toLocaleString("ko-KR")}건 (최대 {limit}건
            표시)
          </p>

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자</TableHead>
                  <TableHead>액션 타입</TableHead>
                  <TableHead>상세</TableHead>
                  <TableHead>발생 시각</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-muted-foreground"
                    >
                      조건에 맞는 로그가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  actions.map((action) => (
                    <TableRow key={action.id}>
                      <TableCell>
                        <div className="text-sm font-medium">
                          {action.userLabel}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {action.phoneNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{action.actionType}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md whitespace-pre-wrap">
                        {action.detail}
                      </TableCell>
                      <TableCell>{formatDateTime(action.occurredAt)}</TableCell>
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

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
