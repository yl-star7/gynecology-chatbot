"use client";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { AdminConsoleShell } from "./admin/AdminConsoleShell";
import { AdminMetricsBar } from "./admin/AdminMetricsBar";

interface AdminDashboardProps {
  dashboard: AdminDashboardData;
  adminDisplayName: string;
}

function DashboardLink({ href, children }: { href: string; children: string }) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-primary-600 hover:text-primary-700"
    >
      {children}
    </a>
  );
}

export default function AdminDashboard({
  dashboard,
  adminDisplayName,
}: AdminDashboardProps) {
  const attentionUsers = dashboard.managedUsers.filter(
    (user) => user.status !== "active",
  );
  const pendingApprovals = dashboard.managedUsers.filter(
    (user) => user.accountStatus === "pending_approval",
  );
  const recoveryUsers = dashboard.managedUsers.filter(
    (user) => user.accountStatus === "pending_recovery",
  );
  const readyDocuments = dashboard.ragDocuments.filter(
    (document) => document.status === "ready",
  );
  const draftDocuments = dashboard.ragDocuments.filter(
    (document) => document.status === "draft",
  );
  const activeWorkflows = dashboard.workflowRules.filter(
    (workflow) => workflow.status === "active",
  );
  const reviewWorkflows = dashboard.workflowRules.filter(
    (workflow) => workflow.status === "review",
  );
  const recentActions = dashboard.userActions.slice(0, 6);

  async function handleLogout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }

  return (
    <AdminConsoleShell
      adminDisplayName={adminDisplayName}
      currentPath="/admin/dashboard"
      title="대시보드"
      onLogout={handleLogout}
    >
      <div className="space-y-6">
        <AdminMetricsBar metrics={dashboard.metrics} />

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">사용자 처리</CardTitle>
              <CardDescription>
                승인과 복구가 필요한 계정만 봅니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">확인 필요</p>
                  <p className="text-2xl font-semibold">
                    {attentionUsers.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">승인 대기</p>
                  <p className="text-2xl font-semibold">
                    {pendingApprovals.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">복구 대기</p>
                  <p className="text-2xl font-semibold">
                    {recoveryUsers.length}
                  </p>
                </div>
              </div>
              <DashboardLink href="/admin/ops/users">
                사용자 운영 액션으로 이동
              </DashboardLink>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">RAG 자료</CardTitle>
              <CardDescription>사전에 반영된 자료 상태입니다.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">전체</p>
                  <p className="text-2xl font-semibold">
                    {dashboard.ragDocuments.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">배포 가능</p>
                  <p className="text-2xl font-semibold">
                    {readyDocuments.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">작성 중</p>
                  <p className="text-2xl font-semibold">
                    {draftDocuments.length}
                  </p>
                </div>
              </div>
              <DashboardLink href="/admin/lexicon">
                사전 관리로 이동
              </DashboardLink>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">응답 워크플로우</CardTitle>
              <CardDescription>
                SQL/GCS 기준의 응답 설정 상태입니다.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">전체</p>
                  <p className="text-2xl font-semibold">
                    {dashboard.workflowRules.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">활성</p>
                  <p className="text-2xl font-semibold">
                    {activeWorkflows.length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">검토</p>
                  <p className="text-2xl font-semibold">
                    {reviewWorkflows.length}
                  </p>
                </div>
              </div>
              <DashboardLink href="/admin/engine/workflows">
                워크플로우로 이동
              </DashboardLink>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_1.2fr]">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">최근 계정 이슈</CardTitle>
              <CardDescription>
                상태 확인이 필요한 사용자입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attentionUsers.length === 0 ? (
                <p className="rounded-md border border-dashed bg-muted p-6 text-center text-sm text-muted-foreground">
                  확인이 필요한 계정이 없습니다.
                </p>
              ) : (
                <div className="divide-y rounded-md border">
                  {attentionUsers.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between gap-3 p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.latestIssue}
                        </p>
                      </div>
                      <Badge variant="outline">{user.accountStatus}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">최근 사용자 이벤트</CardTitle>
              <CardDescription>사용자 앱 활동 로그입니다.</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActions.length === 0 ? (
                <p className="rounded-md border border-dashed bg-muted p-6 text-center text-sm text-muted-foreground">
                  최근 이벤트가 없습니다.
                </p>
              ) : (
                <div className="divide-y rounded-md border">
                  {recentActions.map((action) => (
                    <div key={action.id} className="grid gap-1 p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{action.userName}</p>
                        <Badge variant="secondary">{action.actionLabel}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {action.detail}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {action.occurredAtLabel}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </AdminConsoleShell>
  );
}
