"use client";

import { useState } from "react";
import { Search, UserCog } from "lucide-react";
import type {
  AdminAllowedPhoneNumber,
  AdminDashboardData,
} from "@gynecology-chatbot/app-core";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

import {
  getAdminEventLabel,
  getManagedUserStatusBadge,
  getManagedUserStatusLabel,
} from "./admin-dashboard-labels";

type ManagedUser = AdminDashboardData["managedUsers"][number];
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface AdminAccountSectionProps {
  managedUsers: AdminDashboardData["managedUsers"];
  allowedPhoneNumbers: AdminAllowedPhoneNumber[];
  userSearchQuery: string;
  selectedUserId: string;
  phoneNumber: string;
  reason: string;
  selectedAllowedPhoneId: string;
  allowedPhoneNumber: string;
  allowedDisplayName: string;
  allowedNote: string;
  actionMessage: string | null;
  isSubmitting: boolean;
  onUserSearchQueryChange: (value: string) => void;
  onSelectUser: (userId: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onReasonChange: (value: string) => void;
  onSelectAllowedPhone: (id: string) => void;
  onAllowedPhoneNumberChange: (value: string) => void;
  onAllowedDisplayNameChange: (value: string) => void;
  onAllowedNoteChange: (value: string) => void;
  onUpdatePhoneNumber: () => Promise<void>;
  onResetSession: () => Promise<void>;
  onPauseUser: () => Promise<void>;
  onResumeUser: () => Promise<void>;
  onApproveUser: (userId: string) => Promise<void>;
  onRejectUser: (userId: string) => Promise<void>;
  onCreateAllowedPhoneNumber: () => Promise<void>;
  onUpdateAllowedPhoneNumber: () => Promise<void>;
  onDeleteAllowedPhoneNumber: () => Promise<void>;
}

function statusBadgeVariant(badge: string | null | undefined): {
  variant: BadgeVariant;
  className?: string;
} {
  switch (badge) {
    case "statusSuccess":
      return {
        variant: "default",
        className: "bg-emerald-500 hover:bg-emerald-600",
      };
    case "statusWarning":
      return { variant: "secondary" };
    case "statusError":
      return { variant: "destructive" };
    default:
      return { variant: "outline" };
  }
}

export function AdminAccountSection({
  managedUsers,
  userSearchQuery,
  selectedUserId,
  phoneNumber,
  reason,
  actionMessage,
  isSubmitting,
  onUserSearchQueryChange,
  onSelectUser,
  onPhoneNumberChange,
  onReasonChange,
  onUpdatePhoneNumber,
  onResetSession,
  onPauseUser,
  onResumeUser,
  onApproveUser,
  onRejectUser,
}: AdminAccountSectionProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const normalizedUserSearchQuery = userSearchQuery.trim().toLowerCase();
  const filteredManagedUsers = managedUsers.filter((user) => {
    if (!normalizedUserSearchQuery) return true;
    return (
      user.name.toLowerCase().includes(normalizedUserSearchQuery) ||
      user.phoneNumber.toLowerCase().includes(normalizedUserSearchQuery) ||
      user.latestIssue.toLowerCase().includes(normalizedUserSearchQuery)
    );
  });
  const pendingApprovalUsers = filteredManagedUsers.filter(
    (user) => user.accountStatus === "pending_approval",
  );
  const activeManagedUsers = filteredManagedUsers.filter(
    (user) => user.accountStatus !== "pending_approval",
  );
  const selectedUser =
    managedUsers.find((user) => user.id === selectedUserId) ??
    managedUsers[0] ??
    null;
  const isSelectedUserPendingApproval =
    selectedUser?.accountStatus === "pending_approval";

  function getUserStatusLabel(user: ManagedUser) {
    if (user.accountStatus === "pending_approval") {
      return "승인 대기";
    }

    return getManagedUserStatusLabel(user.status);
  }

  function getUserStatusBadge(user: ManagedUser) {
    if (user.accountStatus === "pending_approval") {
      return "statusWarning";
    }

    return getManagedUserStatusBadge(user.status);
  }

  const handleRowClick = (user: ManagedUser) => {
    onSelectUser(user.id);
    setDrawerOpen(true);
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">가입 승인 대기</h2>
          <p className="text-sm text-muted-foreground">
            새로 가입한 번호를 확인하고, 앱 사용을 승인하거나 거절합니다.
          </p>
        </div>

        <div className="mt-4 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>최근 이슈</TableHead>
                <TableHead>처리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingApprovalUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    지금 승인 대기 중인 사용자가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                pendingApprovalUsers.map((user) => (
                  <TableRow
                    key={user.id}
                    data-state={
                      user.id === selectedUserId ? "selected" : undefined
                    }
                    className="cursor-pointer"
                    onClick={() => handleRowClick(user)}
                  >
                    <TableCell>
                      <strong className="font-semibold">{user.name}</strong>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.phoneNumber}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.latestIssue}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSubmitting}
                          onClick={(event) => {
                            event.stopPropagation();
                            void onApproveUser(user.id);
                          }}
                        >
                          승인
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          disabled={isSubmitting}
                          onClick={(event) => {
                            event.stopPropagation();
                            void onRejectUser(user.id);
                          }}
                        >
                          거절
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold">사용자 관리</h2>
          <p className="text-sm text-muted-foreground">
            앱을 쓰는 사용자를 찾아 전화번호 수정·세션 초기화·사용 중단을
            진행합니다.
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={userSearchQuery}
              onChange={(event) => onUserSearchQueryChange(event.target.value)}
              placeholder="이름, 전화번호, 최근 이슈"
              className="pl-9"
            />
          </div>
          <Badge variant="outline" className="w-fit">
            사용 중인 사용자 {activeManagedUsers.length.toLocaleString("ko-KR")}
            명
          </Badge>
        </div>

        <div className="mt-4 rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>전화번호</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>최근 이슈</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeManagedUsers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="h-24 text-center text-muted-foreground"
                  >
                    조건에 맞는 사용 중인 사용자가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                activeManagedUsers.map((user) => {
                  const badge = statusBadgeVariant(getUserStatusBadge(user));
                  const isSelected = user.id === selectedUserId;
                  return (
                    <TableRow
                      key={user.id}
                      data-state={isSelected ? "selected" : undefined}
                      className="cursor-pointer"
                      onClick={() => handleRowClick(user)}
                    >
                      <TableCell>
                        <strong className="font-semibold">{user.name}</strong>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.phoneNumber}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={badge.variant}
                          className={badge.className}
                        >
                          {getUserStatusLabel(user)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.latestIssue}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-0 sm:max-w-md"
        >
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" aria-hidden />
              {isSelectedUserPendingApproval
                ? "앱 사용 승인"
                : selectedUser
                  ? "사용자 수정"
                  : "선택된 사용자 없음"}
            </SheetTitle>
            <SheetDescription>
              {isSelectedUserPendingApproval
                ? "이 사용자가 앱을 사용할 수 있게 하려면 아래의 사용 승인 버튼을 누릅니다."
                : "전화번호를 바꾸거나, 세션을 초기화하거나, 사용을 중단/재개합니다."}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md border bg-muted p-3">
                <p className="text-xs text-muted-foreground">선택 계정</p>
                <p className="mt-1 text-sm font-semibold">
                  {selectedUser?.name ?? "선택된 계정 없음"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedUser?.phoneNumber ?? "-"}
                </p>
              </div>
              <div className="rounded-md border bg-muted p-3">
                <p className="text-xs text-muted-foreground">현재 상태</p>
                <p className="mt-1 text-sm font-semibold">
                  {selectedUser ? getUserStatusLabel(selectedUser) : "-"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {selectedUser?.accountStatus
                    ? getAdminEventLabel(selectedUser.accountStatus)
                    : (selectedUser?.latestIssue ?? "최근 이슈 없음")}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-account-phone">변경 전화번호</Label>
                <Input
                  id="admin-account-phone"
                  value={phoneNumber}
                  onChange={(event) => onPhoneNumberChange(event.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="admin-account-reason">조치 메모</Label>
                <Textarea
                  id="admin-account-reason"
                  value={reason}
                  onChange={(event) => onReasonChange(event.target.value)}
                  rows={4}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={isSubmitting}
                  onClick={onUpdatePhoneNumber}
                >
                  전화번호 갱신
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={onResetSession}
                >
                  세션 초기화
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting}
                  onClick={onPauseUser}
                >
                  사용 중단
                </Button>
                <Button
                  type="button"
                  variant={
                    isSelectedUserPendingApproval ? "default" : "outline"
                  }
                  disabled={isSubmitting}
                  onClick={onResumeUser}
                >
                  {isSelectedUserPendingApproval ? "앱 사용 승인" : "사용 재개"}
                </Button>
              </div>

              {actionMessage ? (
                <p className="text-sm text-muted-foreground">{actionMessage}</p>
              ) : null}
            </div>
          </div>

          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                닫기
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
}
