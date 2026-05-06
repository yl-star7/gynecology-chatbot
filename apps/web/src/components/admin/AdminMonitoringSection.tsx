"use client";

import type {
  AdminDashboardData,
  AdminHistoryUser,
} from "@gynecology-chatbot/app-core";
import { ChevronLeft, ChevronRight, Search, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  getSessionRoleLabel,
  getUserActionTypeLabel,
} from "./admin-dashboard-labels";

interface AdminMonitoringSectionProps {
  userActions: AdminDashboardData["userActions"];
  historyUsers: AdminDashboardData["historyUsers"];
  focusedHistoryUser: AdminHistoryUser | undefined;
  focusedUserActions: AdminDashboardData["userActions"];
  searchQuery: string;
  selectedActionType: string;
  actionPage: number;
  userPage: number;
  onSearchQueryChange: (value: string) => void;
  onSelectedActionTypeChange: (value: string) => void;
  onActionPageChange: (value: number) => void;
  onUserPageChange: (value: number) => void;
  onFocusUser: (userId: string) => void;
}

const ACTIONS_PER_PAGE = 8;
const USERS_PER_PAGE = 4;

export function AdminMonitoringSection({
  userActions,
  historyUsers,
  focusedHistoryUser,
  focusedUserActions,
  searchQuery,
  selectedActionType,
  actionPage,
  userPage,
  onSearchQueryChange,
  onSelectedActionTypeChange,
  onActionPageChange,
  onUserPageChange,
  onFocusUser,
}: AdminMonitoringSectionProps) {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const actionTypeOptions = Array.from(
    new Set(userActions.map((action) => action.actionType)),
  );

  const filteredUserActions = userActions.filter((action) => {
    const matchesType =
      selectedActionType === "all" || action.actionType === selectedActionType;
    const matchesQuery =
      !normalizedQuery ||
      action.userName.toLowerCase().includes(normalizedQuery) ||
      action.actionLabel.toLowerCase().includes(normalizedQuery) ||
      action.detail.toLowerCase().includes(normalizedQuery) ||
      (action.sessionTitle ?? "").toLowerCase().includes(normalizedQuery);

    return matchesType && matchesQuery;
  });

  const filteredHistoryUsers = historyUsers.filter((user) => {
    if (!normalizedQuery) {
      return true;
    }

    return (
      user.name.toLowerCase().includes(normalizedQuery) ||
      user.phoneNumber.toLowerCase().includes(normalizedQuery) ||
      user.pregnancyWeekLabel.toLowerCase().includes(normalizedQuery)
    );
  });

  const paginatedUserActions = filteredUserActions.slice(
    (actionPage - 1) * ACTIONS_PER_PAGE,
    actionPage * ACTIONS_PER_PAGE,
  );
  const paginatedHistoryUsers = filteredHistoryUsers.slice(
    (userPage - 1) * USERS_PER_PAGE,
    userPage * USERS_PER_PAGE,
  );
  const totalActionPages = Math.max(
    1,
    Math.ceil(filteredUserActions.length / ACTIONS_PER_PAGE),
  );
  const totalUserPages = Math.max(
    1,
    Math.ceil(filteredHistoryUsers.length / USERS_PER_PAGE),
  );

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            <h2>모니터링 필터</h2>
          </CardTitle>
          <CardDescription>
            이벤트와 사용자를 조건으로 좁혀서 조회합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-[1fr_240px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(event) => {
                  onSearchQueryChange(event.target.value);
                }}
                placeholder="이름, 이벤트, 상세, 세션으로 검색"
                className="pl-9"
              />
            </div>
            <Select
              value={selectedActionType}
              onValueChange={onSelectedActionTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="이벤트 종류" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 이벤트</SelectItem>
                {actionTypeOptions.map((actionType) => (
                  <SelectItem key={actionType} value={actionType}>
                    {getUserActionTypeLabel(actionType)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="events" className="w-full">
        <TabsList>
          <TabsTrigger value="events">이벤트 로그</TabsTrigger>
          <TabsTrigger value="users">사용자 히스토리</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <h2>실시간 사용자 이벤트</h2>
              </CardTitle>
              <CardDescription>
                총 {filteredUserActions.length}건의 이벤트 중 현재 페이지를
                표시합니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">사용자</TableHead>
                      <TableHead className="w-[160px]">이벤트</TableHead>
                      <TableHead>상세</TableHead>
                      <TableHead className="w-[160px]">세션</TableHead>
                      <TableHead className="w-[140px]">시각</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUserActions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          조건에 맞는 이벤트가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedUserActions.map((action) => (
                        <TableRow key={action.id}>
                          <TableCell className="font-medium">
                            {action.userName}
                          </TableCell>
                          <TableCell>{action.actionLabel}</TableCell>
                          <TableCell
                            className="max-w-[380px] truncate text-muted-foreground"
                            title={action.detail || undefined}
                          >
                            {action.detail || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                action.sessionId ? "default" : "secondary"
                              }
                            >
                              {action.sessionTitle ?? "계정 이벤트"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {action.occurredAtLabel}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                page={actionPage}
                totalPages={totalActionPages}
                onPageChange={onActionPageChange}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                <h2>채팅 세션 감사</h2>
              </CardTitle>
              <CardDescription>
                사용자를 선택하면 아래에 계정 이벤트와 세션 기록이 표시됩니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>전화번호</TableHead>
                      <TableHead className="w-[100px]">주차</TableHead>
                      <TableHead className="w-[200px]">최근 세션</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistoryUsers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="py-10 text-center text-sm text-muted-foreground"
                        >
                          조건에 맞는 사용자가 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedHistoryUsers.map((user) => {
                        const isSelected = focusedHistoryUser?.id === user.id;
                        return (
                          <TableRow
                            key={user.id}
                            data-state={isSelected ? "selected" : undefined}
                            onClick={() => onFocusUser(user.id)}
                            className="cursor-pointer"
                          >
                            <TableCell className="font-medium">
                              {user.name}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {user.phoneNumber}
                            </TableCell>
                            <TableCell>{user.pregnancyWeekLabel}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {user.latestSessionLabel}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              <Pagination
                page={userPage}
                totalPages={totalUserPages}
                onPageChange={onUserPageChange}
              />
            </CardContent>
          </Card>

          {focusedHistoryUser ? (
            <FocusedUserDetail
              user={focusedHistoryUser}
              focusedUserActions={focusedUserActions}
            />
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => onPageChange(Math.max(1, page - 1))}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        이전
      </Button>
      <span className="text-sm text-muted-foreground">
        {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      >
        다음
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

function FocusedUserDetail({
  user,
  focusedUserActions,
}: {
  user: AdminHistoryUser;
  focusedUserActions: AdminDashboardData["userActions"];
}) {
  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-4 w-4" />
              {user.name}
            </CardTitle>
            <CardDescription>
              {user.phoneNumber} · {user.pregnancyWeekLabel} · 최근{" "}
              {user.latestSessionLabel}
            </CardDescription>
          </div>
          <Badge variant="secondary">세션 {user.sessions.length}개</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <section className="flex flex-col gap-3">
          <div>
            <h3 className="text-sm font-semibold">계정 이벤트</h3>
            <p className="text-xs text-muted-foreground">
              선택한 사용자의 최근 계정 활동입니다.
            </p>
          </div>
          {focusedUserActions.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              선택한 사용자의 계정 이벤트가 아직 없습니다.
            </div>
          ) : (
            <ScrollArea className="max-h-[240px] rounded-md border">
              <ul className="divide-y">
                {focusedUserActions.map((action) => (
                  <li
                    key={action.id}
                    className="flex items-start justify-between gap-4 px-4 py-3"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium">
                        {action.actionLabel}
                      </span>
                      {action.detail ? (
                        <span
                          className="text-xs text-muted-foreground"
                          title={action.detail}
                        >
                          {action.detail}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant={action.sessionId ? "default" : "secondary"}
                      >
                        {action.sessionTitle ?? "계정 이벤트"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {action.occurredAtLabel}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </section>

        <Separator />

        <section className="flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-semibold">세션별 대화</h3>
            <p className="text-xs text-muted-foreground">
              세션 단위로 메시지 흐름을 확인합니다.
            </p>
          </div>

          {user.sessions.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
              세션이 아직 없습니다.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {user.sessions.map((session) => (
                <Card key={session.id} className="bg-muted">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-4">
                      <CardTitle className="text-base">
                        {session.title}
                      </CardTitle>
                      <Badge variant="outline">
                        {session.pregnancyWeekLabel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col gap-3">
                      {session.messages.map((message) => {
                        const isAssistant = message.role === "assistant";
                        return (
                          <li
                            key={message.id}
                            className={`flex ${
                              isAssistant ? "justify-start" : "justify-end"
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                                isAssistant
                                  ? "bg-background"
                                  : "bg-primary text-primary-foreground"
                              }`}
                            >
                              <div
                                className={`mb-1 text-xs font-medium ${
                                  isAssistant
                                    ? "text-muted-foreground"
                                    : "text-primary-foreground/80"
                                }`}
                              >
                                {getSessionRoleLabel(message.role)} ·{" "}
                                {message.createdAtLabel}
                              </div>
                              <p className="whitespace-pre-wrap break-words">
                                {message.summary}
                              </p>
                              {message.ragSources &&
                              message.ragSources.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {message.ragSources.map(
                                    (source, sourceIndex) => (
                                      <Badge
                                        key={sourceIndex}
                                        variant="secondary"
                                        className="text-[10px]"
                                        title={`유사도: ${source.similarity.toFixed(3)}`}
                                      >
                                        {source.filename}
                                      </Badge>
                                    ),
                                  )}
                                </div>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
