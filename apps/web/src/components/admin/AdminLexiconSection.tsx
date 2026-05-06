"use client";

import { useMemo, useState } from "react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  parseSurfaceFromFilename,
  parseWeekFromFilename,
  surfaceLabel,
  type LexiconSurface,
} from "@/lib/admin/lexicon-tags";

import AdminPageFrame from "../AdminPageFrame";
import { AdminDocumentsSection } from "./content/AdminDocumentsSection";
import { useAdminContentState } from "./useAdminContentState";

export interface LexiconDriftSummary {
  dbCount: number;
  schiftCount: number;
  untaggedCount: number;
  available: boolean;
  message: string | null;
}

interface AdminLexiconSectionProps {
  adminDisplayName: string;
  dashboard: AdminDashboardData;
  initialDrift: LexiconDriftSummary;
}

type RagDocument = AdminDashboardData["ragDocuments"][number];
type ViewMode = "files" | "grouped";
type SurfaceFilter = "all" | LexiconSurface;

const WEEK_OPTIONS = Array.from({ length: 40 }, (_, index) => index + 1);

const SURFACE_OPTIONS: ReadonlyArray<{ value: SurfaceFilter; label: string }> =
  [
    { value: "all", label: "전체 분류" },
    { value: "week_overview", label: "주차 개요" },
    { value: "week_day", label: "주차 일자" },
    { value: "rag", label: "일반 RAG" },
    { value: "archive", label: "아카이브" },
  ];

function detectWeek(document: RagDocument): number | null {
  const fromFilename = parseWeekFromFilename(document.title);
  if (fromFilename !== null) return fromFilename;

  const label = (document.pregnancyWeekLabel ?? "").trim();
  const labelMatch = label.match(/(\d{1,2})/);
  if (labelMatch) {
    const week = Number.parseInt(labelMatch[1] ?? "", 10);
    if (Number.isFinite(week) && week >= 1 && week <= 42) return week;
  }

  return null;
}

function detectSurface(document: RagDocument): LexiconSurface | null {
  return parseSurfaceFromFilename(document.title);
}

export default function AdminLexiconSection({
  adminDisplayName,
  dashboard,
  initialDrift: _initialDrift,
}: AdminLexiconSectionProps) {
  const state = useAdminContentState(dashboard, "documents");

  const [weekFilter, setWeekFilter] = useState<string>("");
  const [surfaceFilter, setSurfaceFilter] = useState<SurfaceFilter>("all");
  const [search, setSearch] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("files");
  const [collapsedWeeks, setCollapsedWeeks] = useState<Record<string, boolean>>(
    {},
  );

  const ragDocumentsWithMissingWeek = state.ragDocuments.filter((document) => {
    const label = (document.pregnancyWeekLabel ?? "").trim();
    if (!label) return true;
    if (label === "공통") return false;
    return !/\d/.test(label);
  });

  const filteredDocuments = useMemo(() => {
    const trimmedSearch = search.trim().toLowerCase();
    const weekValue = weekFilter ? Number.parseInt(weekFilter, 10) : null;

    return state.ragDocuments.filter((document) => {
      if (weekValue !== null) {
        if (detectWeek(document) !== weekValue) return false;
      }

      if (surfaceFilter !== "all") {
        if (detectSurface(document) !== surfaceFilter) return false;
      }

      if (trimmedSearch) {
        const haystack =
          `${document.title} ${document.pregnancyWeekLabel ?? ""} ${document.category ?? ""}`.toLowerCase();
        if (!haystack.includes(trimmedSearch)) return false;
      }

      return true;
    });
  }, [state.ragDocuments, weekFilter, surfaceFilter, search]);

  const groupedByWeek = useMemo(() => {
    const groups = new Map<number | "none", RagDocument[]>();
    for (const document of filteredDocuments) {
      const week = detectWeek(document);
      const key: number | "none" = week ?? "none";
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(document);
      } else {
        groups.set(key, [document]);
      }
    }

    const sortedEntries = Array.from(groups.entries()).sort((a, b) => {
      if (a[0] === "none") return 1;
      if (b[0] === "none") return -1;
      return (a[0] as number) - (b[0] as number);
    });

    return sortedEntries;
  }, [filteredDocuments]);

  const isFilterActive =
    weekFilter !== "" || surfaceFilter !== "all" || search.trim() !== "";

  const handleResetFilters = () => {
    setWeekFilter("");
    setSurfaceFilter("all");
    setSearch("");
  };

  const toggleWeekGroup = (key: string) => {
    setCollapsedWeeks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath="/admin/lexicon"
      title="사전 (RAG 참조)"
    >
      <section className="space-y-4">
        {ragDocumentsWithMissingWeek.length > 0 ? (
          <section className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">metadata 태그 검증</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  week
                </code>{" "}
                태그가 비어 있는 문서만 노출합니다. 누락된 문서는 수정 후
                재업로드해 주십시오.
              </p>
            </div>

            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>자료명</TableHead>
                    <TableHead>카테고리</TableHead>
                    <TableHead>주차 라벨</TableHead>
                    <TableHead>상태</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ragDocumentsWithMissingWeek.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-medium">
                        {document.title}
                      </TableCell>
                      <TableCell>{document.category}</TableCell>
                      <TableCell>
                        {document.pregnancyWeekLabel || "(미지정)"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">태그 누락</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">자료 보기</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                업로드 파일, 주차, 분류 기준으로 RAG 자료를 확인합니다.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {ragDocumentsWithMissingWeek.length === 0 ? (
                <Badge variant="outline">week 태그 정상</Badge>
              ) : null}
              <span className="text-sm text-muted-foreground">
                표시 중 {filteredDocuments.length.toLocaleString()}건 / 전체{" "}
                {state.ragDocuments.length.toLocaleString()}건
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label>주차 필터</Label>
              <Select
                value={weekFilter || "all"}
                onValueChange={(value) =>
                  setWeekFilter(value === "all" ? "" : value)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 주차</SelectItem>
                  {WEEK_OPTIONS.map((week) => (
                    <SelectItem key={week} value={String(week)}>
                      {week}주차
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>분류 필터</Label>
              <Select
                value={surfaceFilter}
                onValueChange={(value) =>
                  setSurfaceFilter(value as SurfaceFilter)
                }
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SURFACE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-1.5 min-w-[200px]">
              <Label>이름 검색</Label>
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="파일명 또는 주차 라벨"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
                disabled={!isFilterActive}
              >
                필터 초기화
              </Button>
              <div className="inline-flex overflow-hidden rounded-md border border-input">
                <Button
                  type="button"
                  variant={viewMode === "files" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("files")}
                  className="rounded-none"
                >
                  파일별 처리
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "grouped" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grouped")}
                  className="rounded-none"
                >
                  주차별 그룹
                </Button>
              </div>
            </div>
          </div>
        </section>

        {viewMode === "grouped" ? (
          <section className="rounded-lg border bg-card p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold">주차별 그룹 뷰</h2>
            {groupedByWeek.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                조건에 맞는 자료가 없습니다.
              </p>
            ) : (
              <div className="space-y-2">
                {groupedByWeek.map(([key, docs]) => {
                  const groupKey = key === "none" ? "none" : String(key);
                  const groupTitle =
                    key === "none" ? "주차 없음" : `${key}주차`;
                  const isCollapsed = collapsedWeeks[groupKey] ?? false;
                  return (
                    <div
                      key={groupKey}
                      className="overflow-hidden rounded-md border"
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => toggleWeekGroup(groupKey)}
                        className="flex h-auto w-full items-center justify-between rounded-none bg-muted px-3 py-2 text-left text-sm font-medium hover:bg-muted"
                      >
                        <span>
                          {groupTitle}{" "}
                          <span className="text-muted-foreground">
                            ({docs.length}건)
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {isCollapsed ? "펼치기" : "접기"}
                        </span>
                      </Button>
                      {isCollapsed ? null : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>자료명</TableHead>
                              <TableHead>분류</TableHead>
                              <TableHead>주차 라벨</TableHead>
                              <TableHead>업데이트</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {docs.map((document) => (
                              <TableRow key={document.id}>
                                <TableCell className="font-medium">
                                  {document.title}
                                </TableCell>
                                <TableCell>
                                  {surfaceLabel(detectSurface(document))}
                                </TableCell>
                                <TableCell>
                                  {document.pregnancyWeekLabel || "(미지정)"}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  {document.updatedAt
                                    ? new Date(
                                        document.updatedAt,
                                      ).toLocaleString("ko-KR")
                                    : "-"}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <AdminDocumentsSection
            ragDocuments={filteredDocuments}
            ragFiles={state.ragFiles}
            selectedRagDocumentId={state.selectedRagDocumentId}
            contentMessage={state.contentMessage}
            ragTitle={state.ragTitle}
            ragCategory={state.ragCategory}
            ragWeek={state.ragWeek}
            ragContent={state.ragContent}
            isRagSubmitting={state.isRagSubmitting}
            isFileUploading={state.isFileUploading}
            onSelectRagDocument={state.syncSelectedRagDocument}
            onResetRagDocument={state.resetRagDocumentForm}
            onRagTitleChange={state.setRagTitle}
            onRagCategoryChange={state.setRagCategory}
            onRagWeekChange={state.setRagWeek}
            onRagContentChange={state.setRagContent}
            onUploadRagDocument={state.handleUploadRagDocument}
            onDeleteRagDocument={state.handleDeleteRagDocument}
            onUploadRagFile={state.handleUploadRagFile}
            onDeleteRagFile={state.handleDeleteRagFile}
            onToggleRagFile={state.handleToggleRagFile}
          />
        )}
      </section>
    </AdminPageFrame>
  );
}
