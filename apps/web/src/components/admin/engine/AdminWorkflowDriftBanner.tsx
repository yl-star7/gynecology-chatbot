"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { WorkflowDriftReport } from "@/lib/admin/workflow-drift";

interface AdminWorkflowDriftBannerProps {
  drift: WorkflowDriftReport;
}

function shortSha(value: string | null): string {
  if (!value) return "-";
  return value.length > 12 ? value.slice(0, 12) : value;
}

export default function AdminWorkflowDriftBanner({
  drift,
}: AdminWorkflowDriftBannerProps) {
  const headline = drift.drift
    ? "3층 상태에 드리프트가 감지되었습니다."
    : "YAML · DB · Schift 런타임이 동기화된 상태입니다.";

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            대화 엔진 · 3층 상태
          </p>
          <CardTitle className="text-lg">워크플로우 드리프트</CardTitle>
          <CardDescription className="mt-2">{headline}</CardDescription>
        </div>
        <Badge variant={drift.drift ? "destructive" : "outline"}>
          {drift.drift ? "확인 필요" : "동기화됨"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <StatusCard
            label="YAML (레이어 A)"
            value={shortSha(drift.yamlSha)}
            detail={
              drift.yamlModifiedAt
                ? `수정 ${new Date(drift.yamlModifiedAt).toLocaleString("ko-KR")}`
                : null
            }
          />
          <StatusCard
            label="workflow_definitions (레이어 B)"
            value={shortSha(drift.dbVersion)}
            detail={
              drift.dbUpdatedAt
                ? `갱신 ${new Date(drift.dbUpdatedAt).toLocaleString("ko-KR")}`
                : null
            }
          />
          <StatusCard
            label="Schift 런타임 (레이어 C)"
            value={drift.schiftStatus ?? "미등록"}
            detail={
              drift.schiftWorkflowId
                ? `ID ${drift.schiftWorkflowId.slice(0, 12)}`
                : null
            }
          />
        </div>

        {drift.reasons.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {drift.reasons.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        ) : null}

        {drift.message ? (
          <Alert>
            <AlertDescription>{drift.message}</AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

function StatusCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string | null;
}) {
  return (
    <div className="rounded-md border bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      ) : null}
    </div>
  );
}
