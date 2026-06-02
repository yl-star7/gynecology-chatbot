"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  GitBranch,
  MessageSquare,
  RefreshCw,
  Send,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface ScheduleConfig {
  dailyCheckEnabled: boolean;
  dailyCheckTime: string;
  weeklyMilestoneEnabled: boolean;
  weeklyMilestoneTime: string;
  weeklyMilestoneDay: number;
  checkupReminderEnabled: boolean;
  checkupReminderTime: string;
}

interface AskPromptConfig {
  tonePrompt: string;
  forbiddenTerms: string[];
}

type OperationKey = "refresh-yaml" | "push-send" | "proactive";

const DEFAULT_SCHEDULE: ScheduleConfig = {
  dailyCheckEnabled: true,
  dailyCheckTime: "09:00",
  weeklyMilestoneEnabled: true,
  weeklyMilestoneTime: "10:00",
  weeklyMilestoneDay: 1,
  checkupReminderEnabled: true,
  checkupReminderTime: "18:00",
};

const WEEKDAY_OPTIONS = [
  { value: "0", label: "일요일" },
  { value: "1", label: "월요일" },
  { value: "2", label: "화요일" },
  { value: "3", label: "수요일" },
  { value: "4", label: "목요일" },
  { value: "5", label: "금요일" },
  { value: "6", label: "토요일" },
];

const DEFAULT_ASK_PROMPT: AskPromptConfig = {
  tonePrompt: [
    "당신은 임산부를 따뜻하게 돕는 모성간호 안내 챗봇이에요.",
    "답변은 한국어, -어요/-해요 체로 자연스럽게 작성해주세요.",
    "첫 문장은 공감 한 문장으로 짧게 시작하고, 과한 축하·감탄·태담 권유는 쓰지 마세요.",
    "병원 안내만 반복하지 말고, 먼저 사용자가 바로 이해할 수 있는 관찰 기준과 안심 포인트를 말해주세요.",
    "제목은 필요한 경우에만 쓰고, 불릿은 4개 이하로 짧게 유지해주세요.",
  ].join("\n"),
  forbiddenTerms: ["context", "item", "title", "body", "참고", "자료", "출처"],
};

export function AdminOperationsPanel() {
  const [requireApproval, setRequireApproval] = useState(true);
  const [approvalPolicyLoading, setApprovalPolicyLoading] = useState(true);
  const [approvalPolicySaving, setApprovalPolicySaving] = useState(false);
  const [approvalPolicyResult, setApprovalPolicyResult] = useState<
    string | null
  >(null);
  const [approvalPolicyError, setApprovalPolicyError] = useState<string | null>(
    null,
  );

  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [askPrompt, setAskPrompt] =
    useState<AskPromptConfig>(DEFAULT_ASK_PROMPT);
  const [askPromptLoading, setAskPromptLoading] = useState(true);
  const [askPromptSaving, setAskPromptSaving] = useState(false);
  const [askPromptResult, setAskPromptResult] = useState<string | null>(null);
  const [askPromptError, setAskPromptError] = useState<string | null>(null);

  const [stageMappingJson, setStageMappingJson] = useState("{}");
  const [stageMappingLoading, setStageMappingLoading] = useState(true);
  const [stageMappingSaving, setStageMappingSaving] = useState(false);
  const [stageMappingResult, setStageMappingResult] = useState<string | null>(
    null,
  );
  const [stageMappingError, setStageMappingError] = useState<string | null>(
    null,
  );

  const [operationRunning, setOperationRunning] =
    useState<OperationKey | null>(null);
  const [operationResult, setOperationResult] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchApprovalPolicy() {
      setApprovalPolicyLoading(true);
      setApprovalPolicyError(null);
      try {
        const res = await fetch("/api/admin/approval-policy");
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        const data = (await res.json()) as { requireApproval: boolean };
        if (!cancelled) setRequireApproval(data.requireApproval);
      } catch (err) {
        if (!cancelled) {
          setApprovalPolicyError(
            err instanceof Error
              ? err.message
              : "앱 사용 승인 정책을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setApprovalPolicyLoading(false);
      }
    }

    async function fetchSchedule() {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const res = await fetch("/api/admin/schedule");
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        const data = (await res.json()) as Partial<ScheduleConfig>;
        if (!cancelled) setSchedule({ ...DEFAULT_SCHEDULE, ...data });
      } catch (err) {
        if (!cancelled) {
          setScheduleError(
            err instanceof Error
              ? err.message
              : "알림 스케줄을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }

    async function fetchAskPrompt() {
      setAskPromptLoading(true);
      setAskPromptError(null);
      try {
        const res = await fetch("/api/admin/ask-prompt");
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        const data = (await res.json()) as Partial<AskPromptConfig>;
        if (!cancelled) setAskPrompt({ ...DEFAULT_ASK_PROMPT, ...data });
      } catch (err) {
        if (!cancelled) {
          setAskPromptError(
            err instanceof Error
              ? err.message
              : "답변 톤을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setAskPromptLoading(false);
      }
    }

    async function fetchStageMapping() {
      setStageMappingLoading(true);
      setStageMappingError(null);
      try {
        const res = await fetch("/api/admin/workflow-rules/stage-mapping");
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        const data = (await res.json()) as { mapping?: unknown };
        if (!cancelled) {
          setStageMappingJson(JSON.stringify(data.mapping ?? {}, null, 2));
        }
      } catch (err) {
        if (!cancelled) {
          setStageMappingError(
            err instanceof Error
              ? err.message
              : "워크플로우 매핑을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setStageMappingLoading(false);
      }
    }

    void fetchApprovalPolicy();
    void fetchSchedule();
    void fetchAskPrompt();
    void fetchStageMapping();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveApprovalPolicy(nextRequireApproval: boolean) {
    setApprovalPolicySaving(true);
    setApprovalPolicyResult(null);
    setApprovalPolicyError(null);
    try {
      const res = await fetch("/api/admin/approval-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireApproval: nextRequireApproval }),
      });
      const payload = (await res.json()) as {
        requireApproval?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? `서버 오류 (${res.status})`);
      }

      setRequireApproval(payload.requireApproval ?? nextRequireApproval);
      setApprovalPolicyResult("앱 사용 승인 정책을 저장했습니다.");
    } catch (err) {
      setApprovalPolicyError(
        err instanceof Error
          ? err.message
          : "앱 사용 승인 정책 저장에 실패했습니다.",
      );
    } finally {
      setApprovalPolicySaving(false);
    }
  }

  async function handleSaveSchedule() {
    setScheduleSaving(true);
    setScheduleResult(null);
    setScheduleError(null);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      const payload = (await res.json()) as {
        schedule?: ScheduleConfig;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? `서버 오류 (${res.status})`);
      }

      setSchedule(payload.schedule ?? schedule);
      setScheduleResult("알림 스케줄을 저장했습니다.");
    } catch (err) {
      setScheduleError(
        err instanceof Error
          ? err.message
          : "알림 스케줄 저장에 실패했습니다.",
      );
    } finally {
      setScheduleSaving(false);
    }
  }

  async function handleSaveAskPrompt() {
    setAskPromptSaving(true);
    setAskPromptResult(null);
    setAskPromptError(null);
    try {
      const res = await fetch("/api/admin/ask-prompt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(askPrompt),
      });
      const payload = (await res.json()) as Partial<AskPromptConfig> & {
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? `서버 오류 (${res.status})`);
      }

      setAskPrompt({ ...DEFAULT_ASK_PROMPT, ...payload });
      setAskPromptResult("무엇이든 물어보세요 답변 톤을 저장했습니다.");
    } catch (err) {
      setAskPromptError(
        err instanceof Error ? err.message : "답변 톤 저장에 실패했습니다.",
      );
    } finally {
      setAskPromptSaving(false);
    }
  }

  async function handleSaveStageMapping() {
    setStageMappingSaving(true);
    setStageMappingResult(null);
    setStageMappingError(null);
    try {
      const mapping = JSON.parse(stageMappingJson) as unknown;
      const res = await fetch("/api/admin/workflow-rules/stage-mapping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapping),
      });
      const payload = (await res.json()) as {
        mapping?: unknown;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? `서버 오류 (${res.status})`);
      }

      setStageMappingJson(JSON.stringify(payload.mapping ?? mapping, null, 2));
      setStageMappingResult("워크플로우 매핑을 저장했습니다.");
    } catch (err) {
      setStageMappingError(
        err instanceof SyntaxError
          ? "JSON 형식을 확인해주세요."
          : err instanceof Error
            ? err.message
            : "워크플로우 매핑 저장에 실패했습니다.",
      );
    } finally {
      setStageMappingSaving(false);
    }
  }

  async function handleRunOperation(
    key: OperationKey,
    url: string,
    body?: Record<string, unknown>,
  ) {
    setOperationRunning(key);
    setOperationResult(null);
    setOperationError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? `서버 오류 (${res.status})`);
      }

      setOperationResult(JSON.stringify(payload, null, 2));
    } catch (err) {
      setOperationError(
        err instanceof Error ? err.message : "운영 실행에 실패했습니다.",
      );
    } finally {
      setOperationRunning(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 앱 사용 승인 정책 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm text-muted-foreground">
                앱 사용 승인 정책
              </CardTitle>
            </div>
            {!approvalPolicyLoading && (
              <Badge variant={requireApproval ? "default" : "secondary"}>
                {requireApproval ? "승인제" : "전체 공개"}
              </Badge>
            )}
          </div>
          <CardDescription>
            새로 가입한 사람이 앱을 바로 쓰게 할지, 관리자가 먼저 확인할지
            정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {approvalPolicyLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="rounded-md border bg-muted p-3 text-sm">
                <p className="font-medium">
                  현재 모드:{" "}
                  {requireApproval
                    ? "관리자 확인 후 사용"
                    : "가입하면 바로 사용"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {requireApproval
                    ? "새 가입자는 사용자 관리 화면에서 승인해야 앱을 사용할 수 있습니다."
                    : "새 가입자는 관리자 승인 없이 바로 앱을 사용할 수 있습니다."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={approvalPolicySaving || requireApproval}
                  aria-busy={approvalPolicySaving}
                  onClick={() => void handleSaveApprovalPolicy(true)}
                >
                  관리자가 확인하고 승인
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={approvalPolicySaving || !requireApproval}
                  aria-busy={approvalPolicySaving}
                  onClick={() => void handleSaveApprovalPolicy(false)}
                >
                  가입하면 바로 사용
                </Button>
              </div>
            </>
          )}

          {approvalPolicyResult && (
            <Alert role="status" aria-live="polite">
              <AlertDescription>{approvalPolicyResult}</AlertDescription>
            </Alert>
          )}
          {approvalPolicyError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{approvalPolicyError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 무엇이든 물어보세요 답변 톤 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">
              무엇이든 물어보세요 답변 톤
            </CardTitle>
          </div>
          <CardDescription>
            앱에서 산모에게 보이는 답변의 말투와 구성 방식을 관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {askPromptLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <div>
                <Label htmlFor="ask-prompt-tone">답변 작성 원칙</Label>
                <Textarea
                  id="ask-prompt-tone"
                  value={askPrompt.tonePrompt}
                  rows={8}
                  aria-label="무엇이든 물어보세요 답변 작성 원칙"
                  onChange={(event) =>
                    setAskPrompt((current) => ({
                      ...current,
                      tonePrompt: event.target.value,
                    }))
                  }
                />
              </div>
              <p className="text-xs text-muted-foreground">
                진단·처방 금지와 위험 신호 안내는 안전 장치로 항상 함께
                적용됩니다.
              </p>
              <Button
                type="button"
                className="w-fit"
                disabled={askPromptSaving || !askPrompt.tonePrompt.trim()}
                aria-busy={askPromptSaving}
                onClick={() => void handleSaveAskPrompt()}
              >
                {askPromptSaving ? "저장 중..." : "답변 톤 저장"}
              </Button>
            </>
          )}

          {askPromptResult && (
            <Alert role="status" aria-live="polite">
              <AlertDescription>{askPromptResult}</AlertDescription>
            </Alert>
          )}
          {askPromptError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{askPromptError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 알림 스케줄 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">
              알림 스케줄
            </CardTitle>
          </div>
          <CardDescription>
            매일 확인, 주차 변경, 검진 알림의 사용 여부와 발송 시각을
            관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {scheduleLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border bg-card p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      aria-label="매일 확인 알림 사용"
                      checked={schedule.dailyCheckEnabled}
                      onCheckedChange={(checked) =>
                        setSchedule((current) => ({
                          ...current,
                          dailyCheckEnabled: checked === true,
                        }))
                      }
                    />
                    매일 확인 알림
                  </label>
                  <Input
                    className="mt-3"
                    type="time"
                    aria-label="매일 확인 알림 시각"
                    value={schedule.dailyCheckTime}
                    onChange={(event) =>
                      setSchedule((current) => ({
                        ...current,
                        dailyCheckTime: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="rounded-md border bg-card p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      aria-label="주차 변경 알림 사용"
                      checked={schedule.weeklyMilestoneEnabled}
                      onCheckedChange={(checked) =>
                        setSchedule((current) => ({
                          ...current,
                          weeklyMilestoneEnabled: checked === true,
                        }))
                      }
                    />
                    주차 변경 알림
                  </label>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px]">
                    <Input
                      type="time"
                      aria-label="주차 변경 알림 시각"
                      value={schedule.weeklyMilestoneTime}
                      onChange={(event) =>
                        setSchedule((current) => ({
                          ...current,
                          weeklyMilestoneTime: event.target.value,
                        }))
                      }
                    />
                    <Select
                      value={String(schedule.weeklyMilestoneDay)}
                      onValueChange={(value) =>
                        setSchedule((current) => ({
                          ...current,
                          weeklyMilestoneDay: Number(value),
                        }))
                      }
                    >
                      <SelectTrigger aria-label="주차 변경 알림 요일">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border bg-card p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      aria-label="검진 알림 사용"
                      checked={schedule.checkupReminderEnabled}
                      onCheckedChange={(checked) =>
                        setSchedule((current) => ({
                          ...current,
                          checkupReminderEnabled: checked === true,
                        }))
                      }
                    />
                    검진 알림
                  </label>
                  <Input
                    className="mt-3"
                    type="time"
                    aria-label="검진 알림 시각"
                    value={schedule.checkupReminderTime}
                    onChange={(event) =>
                      setSchedule((current) => ({
                        ...current,
                        checkupReminderTime: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                type="button"
                className="w-fit"
                disabled={scheduleSaving}
                aria-busy={scheduleSaving}
                onClick={() => void handleSaveSchedule()}
              >
                {scheduleSaving ? "저장 중..." : "스케줄 저장"}
              </Button>
            </>
          )}

          {scheduleResult && (
            <Alert role="status" aria-live="polite">
              <AlertDescription>{scheduleResult}</AlertDescription>
            </Alert>
          )}
          {scheduleError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{scheduleError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 운영 실행 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">
              운영 실행
            </CardTitle>
          </div>
          <CardDescription>
            워크플로우 캐시, 수동 알림, stage별 워크플로우 연결을 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={operationRunning !== null}
              aria-busy={operationRunning === "refresh-yaml"}
              onClick={() =>
                void handleRunOperation(
                  "refresh-yaml",
                  "/api/admin/workflow-rules/refresh-yaml",
                )
              }
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {operationRunning === "refresh-yaml"
                ? "새로고침 중..."
                : "YAML 캐시 새로고침"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={operationRunning !== null}
              aria-busy={operationRunning === "push-send"}
              onClick={() =>
                void handleRunOperation("push-send", "/api/admin/push/send")
              }
            >
              <Send className="mr-1 h-4 w-4" />
              {operationRunning === "push-send"
                ? "발송 중..."
                : "푸시 수동 발송"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={operationRunning !== null}
              aria-busy={operationRunning === "proactive"}
              onClick={() =>
                void handleRunOperation(
                  "proactive",
                  "/api/admin/proactive/trigger",
                  { triggerId: "daily_check" },
                )
              }
            >
              <MessageSquare className="mr-1 h-4 w-4" />
              {operationRunning === "proactive"
                ? "실행 중..."
                : "자동 대화 실행"}
            </Button>
          </div>

          <div className="rounded-md border bg-card p-3">
            <div className="mb-3">
              <Label htmlFor="stage-mapping-json">
                stage 워크플로우 매핑 JSON
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                router, baby_info, letter_reflection, free_chat, general에
                연결할 워크플로우 ID를 지정합니다.
              </p>
            </div>
            <Textarea
              id="stage-mapping-json"
              value={stageMappingJson}
              disabled={stageMappingLoading}
              rows={7}
              className="font-mono text-xs"
              onChange={(event) => setStageMappingJson(event.target.value)}
            />
            <Button
              type="button"
              className="mt-3"
              disabled={stageMappingLoading || stageMappingSaving}
              aria-busy={stageMappingSaving}
              onClick={() => void handleSaveStageMapping()}
            >
              {stageMappingSaving ? "저장 중..." : "매핑 저장"}
            </Button>
          </div>

          {operationResult && (
            <pre
              className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-3 text-xs"
              aria-live="polite"
            >
              {operationResult}
            </pre>
          )}
          {operationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{operationError}</AlertDescription>
            </Alert>
          )}
          {stageMappingResult && (
            <Alert role="status" aria-live="polite">
              <AlertDescription>{stageMappingResult}</AlertDescription>
            </Alert>
          )}
          {stageMappingError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{stageMappingError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
