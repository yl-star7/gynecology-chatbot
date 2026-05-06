"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { Upload } from "lucide-react";

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
import { cn } from "@/components/ui/cn";

export type AdminStatusTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "accent";

const STATUS_TONE_CLASS: Record<AdminStatusTone, string> = {
  neutral: "border-border bg-muted text-muted-foreground hover:bg-muted",
  success:
    "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-50",
  warning: "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-50",
  danger: "border-red-200 bg-red-50 text-red-700 hover:bg-red-50",
  accent:
    "border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-50",
};

export function AdminStatusBadge({
  tone = "neutral",
  children,
  className,
}: {
  tone?: AdminStatusTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "w-fit whitespace-nowrap",
        STATUS_TONE_CLASS[tone],
        className,
      )}
    >
      {children}
    </Badge>
  );
}

export function AdminCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-lg shadow-sm", className)}>{children}</Card>
  );
}

export function AdminCardHeader({
  title,
  description,
  eyebrow,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <CardHeader
      className={cn(
        "flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {eyebrow}
          </p>
        ) : null}
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? (
          <CardDescription className="mt-2 leading-6">
            {description}
          </CardDescription>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </CardHeader>
  );
}

export function AdminCardContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <CardContent className={cn("space-y-4", className)}>{children}</CardContent>
  );
}

export function AdminEmptyState({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed bg-muted px-4 py-6 text-center text-sm text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminField({
  label,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

export function AdminFileUpload({
  id,
  label,
  accept,
  disabled,
  onFileSelect,
  className,
}: {
  id: string;
  label: ReactNode;
  accept?: string;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Input
        ref={inputRef}
        id={id}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (!file) return;
          onFileSelect(file);
          event.currentTarget.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        {label}
      </Button>
    </div>
  );
}

export function AdminMessage({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "danger";
}) {
  return (
    <Alert variant={tone === "danger" ? "destructive" : "default"}>
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  );
}

export function AdminStat({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-md border bg-muted p-3", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
