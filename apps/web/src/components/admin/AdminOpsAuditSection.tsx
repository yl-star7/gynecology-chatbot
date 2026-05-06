"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AdminOpsAuditLogRow {
  id: string;
  actorDisplayName: string;
  actionType: string;
  entityType: string;
  entityId: string | null;
  reason: string;
  beforeSummary: string;
  afterSummary: string;
  createdAt: string;
}

interface AdminOpsAuditSectionProps {
  logs: AdminOpsAuditLogRow[];
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminOpsAuditSection({ logs }: AdminOpsAuditSectionProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <CardTitle className="text-lg">감사 로그</CardTitle>
        <Badge variant="outline">최근 {logs.length}건</Badge>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted p-6 text-center text-sm text-muted-foreground">
            표시할 감사 로그가 없습니다.
          </p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>시각</TableHead>
                  <TableHead>운영자</TableHead>
                  <TableHead>행동</TableHead>
                  <TableHead>대상</TableHead>
                  <TableHead>전</TableHead>
                  <TableHead>후</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap">
                      {formatTimestamp(log.createdAt)}
                    </TableCell>
                    <TableCell>{log.actorDisplayName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{log.actionType}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>{log.entityType}</div>
                      {log.entityId ? (
                        <div className="font-mono text-xs text-muted-foreground">
                          {log.entityId.slice(0, 8)}...
                        </div>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-60">
                      <code className="whitespace-pre-wrap break-all text-xs text-muted-foreground">
                        {log.beforeSummary}
                      </code>
                    </TableCell>
                    <TableCell className="max-w-60">
                      <code className="whitespace-pre-wrap break-all text-xs text-muted-foreground">
                        {log.afterSummary}
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
