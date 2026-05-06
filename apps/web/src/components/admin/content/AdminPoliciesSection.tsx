"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Route, Trash2 } from "lucide-react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

import {
  getWorkflowStatusBadge,
  getWorkflowStatusLabel,
} from "../admin-dashboard-labels";
import { AdminWorkflowEditorAdapter } from "./AdminWorkflowEditorAdapter";
import { getWorkflowYamlEditorRouteName } from "./workflow-yaml-route";

type WorkflowRule = AdminDashboardData["workflowRules"][number];

function statusVariant(
  badge: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  switch (badge) {
    case "statusSuccess":
      return "default";
    case "statusWarning":
      return "secondary";
    case "statusError":
      return "destructive";
    default:
      return "outline";
  }
}

function workflowSourceLabel(rule: WorkflowRule) {
  if (rule.storagePath && rule.source === "sql") return "SQL + GCS YAML";
  if (rule.source === "gcs-yaml") return "GCS YAML";
  if (rule.source === "schift") return "Schift";
  return "SQL";
}

export interface AdminPoliciesSectionProps {
  workflowRules: AdminDashboardData["workflowRules"];
  selectedWorkflowRuleId: string;
  contentMessage: string | null;
  workflowName: string;
  workflowTrigger: string;
  workflowRetrievalScope: string;
  workflowModelName: string;
  workflowStatus: AdminDashboardData["workflowRules"][number]["status"];
  isWorkflowSaving: boolean;
  isWorkflowRunning: boolean;
  isWorkflowDeleting: boolean;
  onSelectWorkflowRule: (id: string) => void;
  onWorkflowNameChange: (value: string) => void;
  onWorkflowTriggerChange: (value: string) => void;
  onWorkflowRetrievalScopeChange: (value: string) => void;
  onWorkflowModelNameChange: (value: string) => void;
  onWorkflowStatusChange: (
    value: AdminDashboardData["workflowRules"][number]["status"],
  ) => void;
  onSaveWorkflowRule: () => Promise<void>;
  onRunWorkflowRule: (query: string) => Promise<void>;
  onDeleteWorkflowRule: () => Promise<void>;
  initialView?: "list" | "editor";
}

type View =
  | { mode: "list" }
  | { mode: "editor"; workflowId: string | null; apiBase?: string };

export function AdminPoliciesSection({
  workflowRules,
  selectedWorkflowRuleId,
  contentMessage,
  workflowName,
  workflowTrigger,
  workflowRetrievalScope,
  workflowModelName,
  workflowStatus,
  isWorkflowSaving,
  isWorkflowRunning,
  isWorkflowDeleting,
  onSelectWorkflowRule,
  onWorkflowNameChange,
  onWorkflowTriggerChange,
  onWorkflowRetrievalScopeChange,
  onWorkflowModelNameChange,
  onWorkflowStatusChange,
  onSaveWorkflowRule,
  onRunWorkflowRule,
  onDeleteWorkflowRule,
  initialView = "list",
}: AdminPoliciesSectionProps) {
  const initialWorkflowId =
    selectedWorkflowRuleId || workflowRules[0]?.id || null;
  const [view, setView] = useState<View>(
    initialView === "editor"
      ? { mode: "editor", workflowId: initialWorkflowId }
      : { mode: "list" },
  );
  const [workflowQuery, setWorkflowQuery] = useState("");
  const [workflowStatusFilter, setWorkflowStatusFilter] = useState("all");
  const [isWorkflowEditorAvailable, setIsWorkflowEditorAvailable] =
    useState(true);
  const [workflowEditorMessage, setWorkflowEditorMessage] = useState<
    string | null
  >(null);
  const [testQuery, setTestQuery] = useState("산모 복통이 심해요");
  const selectedWorkflowRule = workflowRules.find(
    (rule) => rule.id === selectedWorkflowRuleId,
  );
  const selectedWorkflowUsesYaml = Boolean(selectedWorkflowRule?.storagePath);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkflowEditorStatus() {
      try {
        const response = await fetch("/api/admin/schift");
        if (!response.ok) {
          let message = "워크플로우 편집기를 지금 불러오지 못했어요.";
          try {
            const payload = (await response.json()) as { error?: string };
            if (payload.error === "SCHIFT_API_KEY not configured") {
              message = "SCHIFT_API_KEY가 없어 노드 에디터를 열 수 없어요.";
            } else if (
              typeof payload.error === "string" &&
              payload.error.trim()
            ) {
              message = payload.error.trim();
            }
          } catch {
            // keep fallback
          }

          if (!cancelled) {
            setIsWorkflowEditorAvailable(false);
            setWorkflowEditorMessage(message);
          }
          return;
        }

        if (!cancelled) {
          setIsWorkflowEditorAvailable(true);
          setWorkflowEditorMessage(null);
        }
      } catch {
        if (!cancelled) {
          setIsWorkflowEditorAvailable(false);
          setWorkflowEditorMessage(
            "워크플로우 편집기를 지금 불러오지 못했어요.",
          );
        }
      }
    }

    void loadWorkflowEditorStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredWorkflowRules = workflowRules.filter((rule) => {
    const query = workflowQuery.trim().toLowerCase();
    const matchesQuery =
      !query ||
      rule.name.toLowerCase().includes(query) ||
      rule.trigger.toLowerCase().includes(query) ||
      rule.modelName.toLowerCase().includes(query);
    const matchesStatus =
      workflowStatusFilter === "all" || rule.status === workflowStatusFilter;
    return matchesQuery && matchesStatus;
  });
  const workflowSummary = useMemo(() => {
    const activeCount = workflowRules.filter(
      (rule) => rule.status === "active",
    ).length;
    const subWorkflowPattern = /sub|baby|letter|free|general|폴백|편지|질문/i;
    const subWorkflowCount = workflowRules.filter(
      (rule) =>
        rule.workflowKind === "subworkflow" ||
        subWorkflowPattern.test(`${rule.name} ${rule.trigger}`),
    ).length;

    return {
      total: workflowRules.length,
      active: activeCount,
      review: workflowRules.length - activeCount,
      subWorkflowCount,
    };
  }, [workflowRules]);

  if (view.mode === "editor") {
    return (
      <section className="space-y-4">
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="h-[calc(100vh-100px)] min-h-[500px]">
            <AdminWorkflowEditorAdapter
              workflowId={view.workflowId}
              apiBase={view.apiBase}
              onBack={() => setView({ mode: "list" })}
            />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">응답 워크플로우</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              SQL에 저장된 GCS YAML 위치 기준으로 라우터와 sub workflow를 함께
              관리합니다. YAML 워크플로우 행을 누르면 시각 편집기로 열립니다.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input
              value={workflowQuery}
              onChange={(event) => setWorkflowQuery(event.target.value)}
              placeholder="검색"
              className="w-40"
            />
            <Select
              value={workflowStatusFilter}
              onValueChange={setWorkflowStatusFilter}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="review">검토중</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!isWorkflowEditorAvailable}
              onClick={() => setView({ mode: "editor", workflowId: null })}
            >
              노드 에디터
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={
                isWorkflowDeleting ||
                !selectedWorkflowRuleId ||
                selectedWorkflowUsesYaml
              }
              onClick={() => void onDeleteWorkflowRule()}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              {isWorkflowDeleting ? "삭제 중…" : "선택 삭제"}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              전체 워크플로우
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {workflowSummary.total}
            </p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">활성</p>
            <p className="mt-1 text-2xl font-semibold">
              {workflowSummary.active}
            </p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">검토중</p>
            <p className="mt-1 text-2xl font-semibold">
              {workflowSummary.review}
            </p>
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Sub workflow 추정
            </p>
            <p className="mt-1 text-2xl font-semibold">
              {workflowSummary.subWorkflowCount}
            </p>
          </div>
        </div>

        {workflowEditorMessage ? (
          <Alert className="mt-4" role="status">
            <AlertDescription>{workflowEditorMessage}</AlertDescription>
          </Alert>
        ) : null}

        <div className="mt-4 flex flex-wrap items-end gap-3 rounded-md border border-dashed bg-muted p-3">
          <div className="flex-1 min-w-[240px] space-y-1">
            <Label htmlFor="workflow-test-query">테스트 질문</Label>
            <Input
              id="workflow-test-query"
              value={testQuery}
              onChange={(event) => setTestQuery(event.target.value)}
              placeholder="워크플로우로 검증할 질문"
            />
          </div>
          <Button
            type="button"
            disabled={
              isWorkflowRunning ||
              !selectedWorkflowRuleId ||
              selectedWorkflowUsesYaml
            }
            onClick={() => void onRunWorkflowRule(testQuery)}
          >
            <Play className="mr-1 h-4 w-4" />
            {isWorkflowRunning ? "실행 중…" : "테스트 실행"}
          </Button>
        </div>

        <div className="mt-4 overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">워크플로우</TableHead>
                <TableHead className="min-w-[140px]">트리거</TableHead>
                <TableHead className="min-w-[140px]">모델</TableHead>
                <TableHead className="min-w-[240px]">YAML 위치</TableHead>
                <TableHead className="w-24">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkflowRules.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-muted-foreground"
                  >
                    조건에 맞는 워크플로우가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkflowRules.map((rule) => {
                  const isSelected = selectedWorkflowRuleId === rule.id;
                  return (
                    <TableRow
                      key={rule.id}
                      data-state={isSelected ? "selected" : undefined}
                    >
                      <TableCell className="p-0">
                        <Button
                          type="button"
                          variant="ghost"
                          disabled={
                            !isWorkflowEditorAvailable && !rule.storagePath
                          }
                          onClick={() => {
                            if (
                              !isWorkflowEditorAvailable &&
                              !rule.storagePath
                            ) {
                              return;
                            }
                            onSelectWorkflowRule(rule.id);
                            if (rule.storagePath) {
                              const yamlName =
                                getWorkflowYamlEditorRouteName(rule);
                              if (yamlName) {
                                setView({
                                  mode: "editor",
                                  workflowId: yamlName,
                                  apiBase:
                                    "/api/admin/workflow-rules/yaml-workflows",
                                });
                              }
                            } else {
                              setView({
                                mode: "editor",
                                workflowId: rule.id,
                              });
                            }
                          }}
                          className="h-auto w-full min-w-0 justify-start rounded-none px-2 py-3 text-left font-medium"
                        >
                          <Route className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="flex min-w-0 flex-col items-start gap-1">
                            <span className="truncate">{rule.name}</span>
                            <span className="text-xs font-normal text-muted-foreground">
                              {workflowSourceLabel(rule)}
                            </span>
                          </span>
                        </Button>
                      </TableCell>
                      <TableCell>{rule.trigger}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {rule.modelName}
                      </TableCell>
                      <TableCell className="max-w-[360px] text-xs text-muted-foreground">
                        {rule.storagePath ? (
                          <code className="block truncate rounded bg-muted px-2 py-1">
                            {rule.storagePath}
                          </code>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusVariant(
                            getWorkflowStatusBadge(rule.status),
                          )}
                        >
                          {getWorkflowStatusLabel(rule.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
}
