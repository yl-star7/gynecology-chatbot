"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Baby,
  Bot,
  GitBranch,
  HeartHandshake,
  MessageCircle,
  Route,
  ShieldAlert,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui/cn";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getWorkflowStatusBadge,
  getWorkflowStatusLabel,
} from "../admin-dashboard-labels";
import { AdminWorkflowEditorAdapter } from "./AdminWorkflowEditorAdapter";
import { getWorkflowYamlEditorRouteName } from "./workflow-yaml-route";

type WorkflowRule = AdminDashboardData["workflowRules"][number];
type WorkflowStageGroupId =
  | "entry"
  | "week-info"
  | "reflection"
  | "free-chat"
  | "safety"
  | "other";

type WorkflowStageMeta = {
  id: WorkflowStageGroupId;
  title: string;
  description: string;
  icon: LucideIcon;
};

const WORKFLOW_STAGE_ORDER: WorkflowStageGroupId[] = [
  "entry",
  "week-info",
  "reflection",
  "free-chat",
  "safety",
  "other",
];

const WORKFLOW_STAGE_META: Record<WorkflowStageGroupId, WorkflowStageMeta> = {
  entry: {
    id: "entry",
    title: "시작/분기",
    description: "앱 채팅을 시작하고 어느 답변 흐름으로 보낼지 고릅니다.",
    icon: GitBranch,
  },
  "week-info": {
    id: "week-info",
    title: "주차 정보",
    description: "아기 발달과 산모 변화를 짧게 안내합니다.",
    icon: Baby,
  },
  reflection: {
    id: "reflection",
    title: "오늘 질문",
    description: "사용자의 답변을 공감형 대화로 이어갑니다.",
    icon: HeartHandshake,
  },
  "free-chat": {
    id: "free-chat",
    title: "자유 상담",
    description: "오늘 질문을 마친 뒤 이어지는 일반 대화를 맡습니다.",
    icon: MessageCircle,
  },
  safety: {
    id: "safety",
    title: "기본/응급 안내",
    description: "분류가 애매한 질문과 응급 신호를 안전하게 처리합니다.",
    icon: ShieldAlert,
  },
  other: {
    id: "other",
    title: "기타",
    description: "별도 관리되는 추가 상담 흐름입니다.",
    icon: Bot,
  },
};

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

function getYamlRouteSuffix(rule: WorkflowRule) {
  const suffix = rule.sqlSlug?.replace(/^maternal-nursing-/, "");
  return suffix ?? "";
}

function getWorkflowStageMeta(rule: WorkflowRule): WorkflowStageMeta {
  const routeSuffix = getYamlRouteSuffix(rule);
  const searchText = `${rule.name} ${rule.trigger} ${rule.retrievalScope} ${routeSuffix}`;

  if (
    rule.workflowKind === "monolith" ||
    rule.workflowKind === "router" ||
    routeSuffix === "monolith" ||
    routeSuffix === "router"
  ) {
    return WORKFLOW_STAGE_META.entry;
  }
  if (routeSuffix === "baby-info" || /baby|주차|발달/i.test(searchText)) {
    return WORKFLOW_STAGE_META["week-info"];
  }
  if (
    routeSuffix === "letter-reflection" ||
    /letter|reflection|편지|공감|오늘 질문/i.test(searchText)
  ) {
    return WORKFLOW_STAGE_META.reflection;
  }
  if (routeSuffix === "free-chat" || /free|자유/i.test(searchText)) {
    return WORKFLOW_STAGE_META["free-chat"];
  }
  if (
    routeSuffix === "general" ||
    /general|fallback|폴백|응급|기본/i.test(searchText)
  ) {
    return WORKFLOW_STAGE_META.safety;
  }
  return WORKFLOW_STAGE_META.other;
}

function groupWorkflowRules(rules: WorkflowRule[]) {
  const byGroup = new Map<WorkflowStageGroupId, WorkflowRule[]>(
    WORKFLOW_STAGE_ORDER.map((id) => [id, []]),
  );
  for (const rule of rules) {
    byGroup.get(getWorkflowStageMeta(rule).id)?.push(rule);
  }
  return WORKFLOW_STAGE_ORDER.map((id) => ({
    meta: WORKFLOW_STAGE_META[id],
    rules: byGroup.get(id) ?? [],
  })).filter((group) => group.rules.length > 0);
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
  isWorkflowDeleting,
  onSelectWorkflowRule,
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
  const workflowGroups = useMemo(
    () => groupWorkflowRules(filteredWorkflowRules),
    [filteredWorkflowRules],
  );

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
              <Route className="h-4 w-4" />
              고급 노드 편집
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
              전체 상담 단계
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
              단계별 흐름
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

        <div className="mt-4 space-y-3">
          {filteredWorkflowRules.length === 0 ? (
            <div className="rounded-md border border-dashed bg-muted/20 py-8 text-center text-muted-foreground">
              조건에 맞는 상담 단계가 없습니다.
            </div>
          ) : (
            workflowGroups.map((group) => {
              const GroupIcon = group.meta.icon;
              return (
                <section
                  key={group.meta.id}
                  className="overflow-hidden rounded-md border bg-background"
                >
                  <div className="flex items-start justify-between gap-3 border-b bg-muted/30 px-3 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="rounded-md bg-background p-2 text-muted-foreground shadow-sm">
                        <GroupIcon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="font-semibold">{group.meta.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {group.meta.description}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {group.rules.length}개
                    </Badge>
                  </div>
                  <div className="divide-y">
                    {group.rules.map((rule) => {
                      const isSelected = selectedWorkflowRuleId === rule.id;
                      const stageMeta = getWorkflowStageMeta(rule);
                      const StageIcon = stageMeta.icon;
                      const canOpen =
                        isWorkflowEditorAvailable || Boolean(rule.storagePath);
                      return (
                        <Button
                          key={rule.id}
                          type="button"
                          variant="ghost"
                          disabled={!canOpen}
                          onClick={() => {
                            if (!canOpen) return;
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
                          className={cn(
                            "h-auto w-full min-w-0 justify-start rounded-none border-0 bg-transparent px-3 py-3 text-left shadow-none hover:bg-muted/40",
                            isSelected && "bg-primary-50 hover:bg-primary-50",
                          )}
                        >
                          <span className="flex w-full min-w-0 items-start gap-3">
                            <span className="mt-0.5 rounded-md bg-muted p-2 text-muted-foreground">
                              <StageIcon className="h-4 w-4" />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-1">
                              <span className="flex min-w-0 flex-wrap items-center gap-2">
                                <span className="truncate text-base font-semibold">
                                  {rule.name}
                                </span>
                                <Badge
                                  variant={statusVariant(
                                    getWorkflowStatusBadge(rule.status),
                                  )}
                                >
                                  {getWorkflowStatusLabel(rule.status)}
                                </Badge>
                              </span>
                              <span className="text-sm text-foreground">
                                {rule.trigger}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                참고 범위: {rule.retrievalScope}
                              </span>
                              <span className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                <span>응답 엔진: {rule.modelName}</span>
                                <span aria-hidden="true">·</span>
                                <span>
                                  {rule.storagePath ? "YAML 설정" : "직접 설정"}
                                </span>
                              </span>
                            </span>
                          </span>
                        </Button>
                      );
                    })}
                  </div>
                </section>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
