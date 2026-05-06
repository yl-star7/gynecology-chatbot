"use client";

import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui/cn";

export type StatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "accent";

interface StatusBadgeProps {
  tone?: StatusTone;
  children: ReactNode;
}

const TONE_CLASS: Record<StatusTone, string | undefined> = {
  neutral: undefined,
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
  accent: "border-primary-200 bg-primary-50 text-primary-700",
};

export function StatusBadge({ tone = "neutral", children }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("whitespace-nowrap", TONE_CLASS[tone])}
    >
      {children}
    </Badge>
  );
}
