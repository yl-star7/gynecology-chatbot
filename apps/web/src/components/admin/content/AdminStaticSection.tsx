"use client";

import { useState } from "react";

import type {
  AdminKnowledgeItem,
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

import {
  getWeekStatusBadge,
  getWeekStatusLabel,
} from "../admin-dashboard-labels";
import { AdminHomeCopyPanel } from "./AdminHomeCopyPanel";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function statusVariant(badge: string | null | undefined): BadgeVariant {
  switch (badge) {
    case "statusSuccess":
      return "default";
    case "statusWarning":
      return "secondary";
    case "statusError":
      return "destructive";
    case "statusMuted":
      return "outline";
    default:
      return "outline";
  }
}

export interface AdminStaticSectionProps {
  homeCopyItems: HomeCopyItem[];
  selectedHomeCopyItemId: string;
  knowledgeItems: AdminKnowledgeItem[];
  selectedKnowledgeItemId: string;
  contentMessage: string | null;
  homeCopySlot: HomeCopySlot;
  homeCopyVariant: string;
  homeCopyTitle: string;
  homeCopyBody: string;
  homeCopyStatus: HomeCopyStatus;
  homeCopyDisplayOrder: string;
  knowledgeSlug: string;
  knowledgeSection: AdminKnowledgeItem["section"];
  knowledgeTitle: string;
  knowledgeBody: string;
  knowledgeImageUrl: string;
  knowledgeStatus: AdminKnowledgeItem["status"];
  isHomeCopySaving: boolean;
  isKnowledgeSaving: boolean;
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
  onSelectKnowledgeItem: (id: string) => void;
  onKnowledgeSlugChange: (value: string) => void;
  onKnowledgeSectionChange: (value: AdminKnowledgeItem["section"]) => void;
  onKnowledgeTitleChange: (value: string) => void;
  onKnowledgeBodyChange: (value: string) => void;
  onKnowledgeImageUrlChange: (value: string) => void;
  onKnowledgeStatusChange: (value: AdminKnowledgeItem["status"]) => void;
  onCreateKnowledgeItem: () => Promise<void>;
  onUpdateKnowledgeItem: () => Promise<void>;
  onDeleteKnowledgeItem: () => Promise<void>;
  onResetKnowledgeItem: () => void;
}

export function AdminStaticSection({
  homeCopyItems,
  selectedHomeCopyItemId,
  knowledgeItems,
  selectedKnowledgeItemId,
  contentMessage,
  homeCopySlot,
  homeCopyVariant,
  homeCopyTitle,
  homeCopyBody,
  homeCopyStatus,
  homeCopyDisplayOrder,
  knowledgeSlug,
  knowledgeSection,
  knowledgeTitle,
  knowledgeBody,
  knowledgeImageUrl,
  knowledgeStatus,
  isHomeCopySaving,
  isKnowledgeSaving,
  onSelectHomeCopyItem,
  onHomeCopySlotChange,
  onHomeCopyVariantChange,
  onHomeCopyTitleChange,
  onHomeCopyBodyChange,
  onHomeCopyStatusChange,
  onHomeCopyDisplayOrderChange,
  onCreateHomeCopyItem,
  onUpdateHomeCopyItem,
  onDeleteHomeCopyItem,
  onResetHomeCopyItem,
  onSelectKnowledgeItem,
  onKnowledgeSlugChange,
  onKnowledgeSectionChange,
  onKnowledgeTitleChange,
  onKnowledgeBodyChange,
  onKnowledgeImageUrlChange,
  onKnowledgeStatusChange,
  onCreateKnowledgeItem,
  onUpdateKnowledgeItem,
  onDeleteKnowledgeItem,
  onResetKnowledgeItem,
}: AdminStaticSectionProps) {
  const [activeOverlay, setActiveOverlay] = useState(false);
  const [knowledgeQuery, setKnowledgeQuery] = useState("");
  const [knowledgeStatusFilter, setKnowledgeStatusFilter] = useState("all");

  const selectedKnowledgeItem =
    knowledgeItems.find((item) => item.id === selectedKnowledgeItemId) ?? null;

  const filteredKnowledgeItems = knowledgeItems.filter((item) => {
    const normalizedQuery = knowledgeQuery.trim().toLowerCase();
    const matchesQuery =
      !normalizedQuery ||
      item.title.toLowerCase().includes(normalizedQuery) ||
      item.slug.toLowerCase().includes(normalizedQuery);
    const matchesStatus =
      knowledgeStatusFilter === "all" || item.status === knowledgeStatusFilter;
    return matchesQuery && matchesStatus;
  });

  return (
    <section className="flex flex-col gap-6">
      <AdminHomeCopyPanel
        homeCopyItems={homeCopyItems}
        selectedHomeCopyItemId={selectedHomeCopyItemId}
        contentMessage={contentMessage}
        homeCopySlot={homeCopySlot}
        homeCopyVariant={homeCopyVariant}
        homeCopyTitle={homeCopyTitle}
        homeCopyBody={homeCopyBody}
        homeCopyStatus={homeCopyStatus}
        homeCopyDisplayOrder={homeCopyDisplayOrder}
        isHomeCopySaving={isHomeCopySaving}
        onSelectHomeCopyItem={onSelectHomeCopyItem}
        onHomeCopySlotChange={onHomeCopySlotChange}
        onHomeCopyVariantChange={onHomeCopyVariantChange}
        onHomeCopyTitleChange={onHomeCopyTitleChange}
        onHomeCopyBodyChange={onHomeCopyBodyChange}
        onHomeCopyStatusChange={onHomeCopyStatusChange}
        onHomeCopyDisplayOrderChange={onHomeCopyDisplayOrderChange}
        onCreateHomeCopyItem={onCreateHomeCopyItem}
        onUpdateHomeCopyItem={onUpdateHomeCopyItem}
        onDeleteHomeCopyItem={onDeleteHomeCopyItem}
        onResetHomeCopyItem={onResetHomeCopyItem}
      />

      <section className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">
              주차별 아기는요?
            </h2>
            <p className="text-sm text-muted-foreground">
              주차별 아기 정보에 함께 쓰는 고정 안내문을 관리하고, 상세 수정은
              우측 패널에서 처리합니다.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => {
              onResetKnowledgeItem();
              setActiveOverlay(true);
            }}
          >
            새 안내문
          </Button>
        </div>

        <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="knowledge-search">검색</Label>
            <Input
              id="knowledge-search"
              value={knowledgeQuery}
              onChange={(event) => setKnowledgeQuery(event.target.value)}
              placeholder="제목 또는 슬러그"
            />
          </div>
          <div className="w-full space-y-1.5 sm:w-48">
            <Label>상태</Label>
            <Select
              value={knowledgeStatusFilter}
              onValueChange={setKnowledgeStatusFilter}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체</SelectItem>
                <SelectItem value="draft">초안</SelectItem>
                <SelectItem value="published">게시중</SelectItem>
                <SelectItem value="archived">보관</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead className="w-[160px]">슬러그</TableHead>
                <TableHead className="w-[120px]">섹션</TableHead>
                <TableHead className="w-[100px]">상태</TableHead>
                <TableHead className="w-[160px]">최근 수정</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredKnowledgeItems.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-sm text-muted-foreground"
                  >
                    조건에 맞는 안내문이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                filteredKnowledgeItems.map((item) => (
                  <TableRow
                    key={item.id}
                    data-state={
                      item.id === selectedKnowledgeItemId
                        ? "selected"
                        : undefined
                    }
                    className="cursor-pointer"
                    onClick={() => {
                      onSelectKnowledgeItem(item.id);
                      setActiveOverlay(true);
                    }}
                  >
                    <TableCell>
                      <strong className="font-medium text-foreground">
                        {item.title}
                      </strong>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.slug}
                    </TableCell>
                    <TableCell className="text-sm">{item.section}</TableCell>
                    <TableCell>
                      <Badge
                        variant={statusVariant(getWeekStatusBadge(item.status))}
                      >
                        {getWeekStatusLabel(item.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.updatedAt}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      <Sheet open={activeOverlay} onOpenChange={setActiveOverlay}>
        <SheetContent
          side="right"
          className="flex w-full flex-col gap-4 overflow-y-auto sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle>
              {selectedKnowledgeItem ? "안내문 편집" : "새 안내문"}
            </SheetTitle>
            <SheetDescription>
              이름, 상태, 본문을 한 패널 안에서 수정합니다.
            </SheetDescription>
          </SheetHeader>

          {contentMessage ? (
            <p className="text-sm text-muted-foreground">{contentMessage}</p>
          ) : null}

          <div className="flex flex-1 flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="knowledge-slug">슬러그</Label>
                <Input
                  id="knowledge-slug"
                  value={knowledgeSlug}
                  onChange={(event) =>
                    onKnowledgeSlugChange(event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>섹션</Label>
                <Select
                  value={knowledgeSection}
                  onValueChange={(value) =>
                    onKnowledgeSectionChange(
                      value as AdminKnowledgeItem["section"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="knowledge">knowledge</SelectItem>
                    <SelectItem value="notebook">notebook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="knowledge-title">제목</Label>
                <Input
                  id="knowledge-title"
                  value={knowledgeTitle}
                  onChange={(event) =>
                    onKnowledgeTitleChange(event.target.value)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>상태</Label>
                <Select
                  value={knowledgeStatus}
                  onValueChange={(value) =>
                    onKnowledgeStatusChange(
                      value as AdminKnowledgeItem["status"],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">draft</SelectItem>
                    <SelectItem value="published">published</SelectItem>
                    <SelectItem value="archived">archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="knowledge-body">본문</Label>
              <Textarea
                id="knowledge-body"
                value={knowledgeBody}
                onChange={(event) => onKnowledgeBodyChange(event.target.value)}
                rows={8}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="knowledge-image">이미지 URL</Label>
              <Input
                id="knowledge-image"
                value={knowledgeImageUrl}
                onChange={(event) =>
                  onKnowledgeImageUrlChange(event.target.value)
                }
                placeholder="https://example.com/image.png"
              />
            </div>
          </div>

          <SheetFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isKnowledgeSaving}
              onClick={onResetKnowledgeItem}
            >
              비우기
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={isKnowledgeSaving || !selectedKnowledgeItemId}
              onClick={onDeleteKnowledgeItem}
            >
              삭제
            </Button>
            <Button
              type="button"
              disabled={isKnowledgeSaving}
              onClick={
                selectedKnowledgeItemId
                  ? onUpdateKnowledgeItem
                  : onCreateKnowledgeItem
              }
            >
              {selectedKnowledgeItemId ? "안내문 저장" : "안내문 생성"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </section>
  );
}
