"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin] route render failed", error);
  }, [error]);

  return (
    <main className="admin-console-shell flex min-h-screen items-center justify-center p-6 text-foreground">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="space-y-1.5">
            <CardTitle>화면을 불러오지 못했습니다.</CardTitle>
            <CardDescription>
              필요한 운영 데이터를 가져오지 못했습니다. 잠시 후 다시
              시도해주십시오.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={reset}>
            다시 시도
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
