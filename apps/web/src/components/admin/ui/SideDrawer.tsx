"use client";

import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/components/ui/cn";

interface SideDrawerProps {
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  children: ReactNode;
  /** 기본 width. `wide`면 overlayPanelWide 클래스 적용. */
  size?: "default" | "wide";
  /** 하단 footer 영역 (선택). */
  footer?: ReactNode;
}

export function SideDrawer({
  open,
  title,
  description,
  onClose,
  children,
  size = "default",
  footer,
}: SideDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="right"
        className={cn(
          "flex w-full flex-col gap-0 p-0 sm:max-w-lg",
          size === "wide" && "sm:max-w-5xl",
        )}
      >
        <SheetHeader className="border-b p-6">
          <div className="flex items-start justify-between gap-4 pr-8">
            <div className="space-y-1">
              <SheetTitle>{title}</SheetTitle>
              {description ? (
                <SheetDescription>{description}</SheetDescription>
              ) : null}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              닫기
            </Button>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
        {footer ? (
          <SheetFooter className="border-t p-6">{footer}</SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
