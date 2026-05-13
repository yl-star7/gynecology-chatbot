"use client";

import { useState } from "react";

import type {
  HomeCopyItem,
  HomeCopySlot,
  HomeCopyStatus,
} from "@gynecology-chatbot/app-core";

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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export const SLOT_LABELS: Record<HomeCopySlot, string> = {
  hero_bubble: "아기 말풍선",
  daily_note: "오늘의 한마디",
  encouragement_quote: "응원 문구",
};

export interface AdminHomeCopyPanelProps {
  homeCopyItems: HomeCopyItem[];
  selectedHomeCopyItemId: string;
  contentMessage: string | null;
  homeCopySlot: HomeCopySlot;
  homeCopyVariant: string;
  homeCopyTitle: string;
  homeCopyBody: string;
  homeCopyStatus: HomeCopyStatus;
  homeCopyDisplayOrder: string;
  isHomeCopySaving: boolean;
  onSelectHomeCopyItem: (id: string) => void;
  onHomeCopySlotChange: (value: HomeCopySlot) => void;
  onHomeCopyVariantChange: (value: string) => void;
  onHomeCopyTitleChange: (value: string) => void;
  onHomeCopyBodyChange: (value: string) => void;
  onHomeCopyStatusChange: (value: HomeCopyStatus) => void;
  onHomeCopyDisplayOrderChange: (value: string) => void;
  onCreateHomeCopyItem: () => Promise<void>;
  onUpdateHomeCopyItem: () => Promise<void>;
  onDeleteHomeCopyItem: () => Promise<void>;
  onResetHomeCopyItem: () => void;
}

export function AdminHomeCopyPanel({
  homeCopyItems,
  selectedHomeCopyItemId,
  contentMessage,
  homeCopySlot,
  homeCopyVariant,
  homeCopyTitle,
  homeCopyBody,
  homeCopyDisplayOrder,
  isHomeCopySaving,
  onSelectHomeCopyItem,
  onHomeCopySlotChange,
  onHomeCopyVariantChange,
  onHomeCopyTitleChange,
  onHomeCopyBodyChange,
  onHomeCopyDisplayOrderChange,
  onCreateHomeCopyItem,
  onUpdateHomeCopyItem,
  onDeleteHomeCopyItem,
  onResetHomeCopyItem,
}: AdminHomeCopyPanelProps) {
  const [activeOverlay, setActiveOverlay] = useState(false);
  const [query, setQuery] = useState("");
  const [slotFilter, setSlotFilter] = useState<HomeCopySlot | "all">("all");

  const visibleHomeCopyItems = homeCopyItems.filter(
    (item) => item.slot !== "encouragement_quote",
  );
  const selectedItem =
    visibleHomeCopyItems.find((item) => item.id === selectedHomeCopyItemId) ??
    null;
  const filteredItems = visibleHomeCopyItems.filter((item) => {
    const normalizedQuery = query.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.body.toLowerCase().includes(normalizedQuery) ||
      (item.variant ?? "").toLowerCase().includes(normalizedQuery);
    const matchesSlot = slotFilter === "all" || item.slot === slotFilter;
    return matchesQuery && matchesSlot;
  });

  return (
    <section className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">
            앱 메인 문구
          </h2>
          <p className="text-sm text-muted-foreground">
            홈 화면 말풍선과 오늘의 한마디를 관리합니다.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            onResetHomeCopyItem();
            setActiveOverlay(true);
          }}
        >
          새 문구
        </Button>
      </div>

      <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="home-copy-search">검색</Label>
          <Input
            id="home-copy-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목, 본문, 대상"
          />
        </div>
        <div className="w-full space-y-1.5 sm:w-48">
          <Label>위치</Label>
          <Select
            value={slotFilter}
            onValueChange={(value) =>
              setSlotFilter(value as HomeCopySlot | "all")
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="hero_bubble">
                {SLOT_LABELS.hero_bubble}
              </SelectItem>
              <SelectItem value="daily_note">
                {SLOT_LABELS.daily_note}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead className="w-[140px]">위치</TableHead>
              <TableHead className="w-[120px]">대상</TableHead>
              <TableHead className="w-[80px]">순서</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-sm text-muted-foreground"
                >
                  조건에 맞는 문구가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  data-state={
                    item.id === selectedHomeCopyItemId ? "selected" : undefined
                  }
                  className="cursor-pointer"
                  onClick={() => {
                    onSelectHomeCopyItem(item.id);
                    setActiveOverlay(true);
                  }}
                >
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <strong className="font-medium text-foreground">
                        {item.title}
                      </strong>
                      <small className="line-clamp-1 text-xs text-muted-foreground">
                        {item.body}
                      </small>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {SLOT_LABELS[item.slot]}
                  </TableCell>
                  <TableCell className="text-sm">
                    {item.variant ?? "전체"}
                  </TableCell>
                  <TableCell className="text-sm">{item.displayOrder}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={activeOverlay} onOpenChange={setActiveOverlay}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>
              {selectedItem ? "메인 문구 편집" : "새 메인 문구"}
            </SheetTitle>
            <SheetDescription>
              저장한 문구는 바로 앱 홈 화면 후보에 반영됩니다.
            </SheetDescription>
          </SheetHeader>

          {contentMessage ? (
            <p className="text-sm text-muted-foreground">{contentMessage}</p>
          ) : null}

          <div className="flex flex-1 flex-col gap-4">
            <div className="space-y-1.5">
              <Label>위치</Label>
              <Select
                value={homeCopySlot}
                onValueChange={(value) =>
                  onHomeCopySlotChange(value as HomeCopySlot)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero_bubble">
                    {SLOT_LABELS.hero_bubble}
                  </SelectItem>
                  <SelectItem value="daily_note">
                    {SLOT_LABELS.daily_note}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="home-copy-variant">대상</Label>
                <Input
                  id="home-copy-variant"
                  value={homeCopyVariant}
                  onChange={(event) =>
                    onHomeCopyVariantChange(event.target.value)
                  }
                  placeholder="default, unknown, 차분하게"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="home-copy-order">순서</Label>
                <Input
                  id="home-copy-order"
                  type="number"
                  value={homeCopyDisplayOrder}
                  onChange={(event) =>
                    onHomeCopyDisplayOrderChange(event.target.value)
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="home-copy-title">제목</Label>
              <Input
                id="home-copy-title"
                value={homeCopyTitle}
                onChange={(event) => onHomeCopyTitleChange(event.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="home-copy-body">문구</Label>
              <Textarea
                id="home-copy-body"
                value={homeCopyBody}
                onChange={(event) => onHomeCopyBodyChange(event.target.value)}
                rows={6}
              />
            </div>

            <Badge variant="outline" className="w-fit">
              사용할 수 있는 값: {"{babyName}"}, {"{pregnancyWeekLabel}"},{" "}
              {"{tone}"}
            </Badge>
          </div>

          <SheetFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isHomeCopySaving}
              onClick={onResetHomeCopyItem}
            >
              비우기
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={isHomeCopySaving || !selectedHomeCopyItemId}
              onClick={onDeleteHomeCopyItem}
            >
              삭제
            </Button>
            <Button
              type="button"
              disabled={isHomeCopySaving}
              onClick={
                selectedHomeCopyItemId
                  ? onUpdateHomeCopyItem
                  : onCreateHomeCopyItem
              }
            >
              {selectedHomeCopyItemId ? "문구 저장" : "문구 생성"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
}
