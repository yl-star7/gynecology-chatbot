"use client";

import {
  ChevronRight,
  FilePlus2,
  FileText,
  FileType2,
  FolderOpen,
  Search,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";

import {
  formatFileSize,
  getDocumentStatusBadge,
  getDocumentStatusLabel,
  getRagFileStatusBadge,
  getRagFileStatusLabel,
} from "../admin-dashboard-labels";
import { SideDrawer, StatusBadge } from "../ui";
import type { StatusTone } from "../ui";

type RagDocument = AdminDashboardData["ragDocuments"][number];

function statusTone(badge: string | null | undefined): StatusTone {
  switch (badge) {
    case "statusSuccess":
      return "success";
    case "statusWarning":
      return "warning";
    case "statusError":
      return "danger";
    case "statusMuted":
      return "neutral";
    default:
      return "neutral";
  }
}

export type RagFileItem = {
  id: string;
  filename: string;
  storagePath: string;
  schiftBucket: string;
  fileSize: number;
  mimeType: string;
  status: "processing" | "ready" | "failed";
  enabled: boolean;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string | null;
};

type FileEntry =
  | { kind: "file"; data: RagFileItem }
  | { kind: "doc"; data: RagDocument };

export interface AdminDocumentsSectionProps {
  ragDocuments: AdminDashboardData["ragDocuments"];
  ragFiles: RagFileItem[];
  selectedRagDocumentId: string;
  contentMessage: string | null;
  ragTitle: string;
  ragCategory: string;
  ragWeek: string;
  ragContent: string;
  isRagSubmitting: boolean;
  isFileUploading: boolean;
  onSelectRagDocument: (id: string) => Promise<void>;
  onResetRagDocument: () => void;
  onRagTitleChange: (value: string) => void;
  onRagCategoryChange: (value: string) => void;
  onRagWeekChange: (value: string) => void;
  onRagContentChange: (value: string) => void;
  onUploadRagDocument: () => Promise<void>;
  onDeleteRagDocument: () => Promise<void>;
  onUploadRagFile: (file: File) => Promise<void>;
  onDeleteRagFile: (fileId: string) => Promise<void>;
  onToggleRagFile: (fileId: string, enabled: boolean) => Promise<void>;
}

function getMimeIcon(mimeType: string) {
  if (mimeType.includes("pdf")) return <FileType2 className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function entryKey(entry: FileEntry) {
  return entry.kind === "file"
    ? `file:${entry.data.id}`
    : `doc:${entry.data.id}`;
}

function normalizeMatchValue(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function getDocumentSourceText(document: RagDocument) {
  return normalizeMatchValue(
    [document.sourceFileId, document.sourceFilename].filter(Boolean).join(" "),
  );
}

function doesDocumentBelongToFile(document: RagDocument, file: RagFileItem) {
  const sourceFileId = normalizeMatchValue(document.sourceFileId);
  const sourceFilename = normalizeMatchValue(document.sourceFilename);
  const fileId = normalizeMatchValue(file.id);
  const filename = normalizeMatchValue(file.filename);
  const storagePath = normalizeMatchValue(file.storagePath);

  if (sourceFileId && sourceFileId === fileId) return true;
  if (sourceFilename && sourceFilename === filename) return true;
  if (sourceFilename && sourceFilename.includes(fileId)) return true;
  if (sourceFilename && storagePath && sourceFilename.includes(storagePath)) {
    return true;
  }

  return false;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
}

export function AdminDocumentsSection({
  ragDocuments,
  ragFiles,
  selectedRagDocumentId,
  contentMessage,
  ragTitle,
  ragCategory,
  ragWeek,
  ragContent,
  isRagSubmitting,
  isFileUploading,
  onSelectRagDocument,
  onResetRagDocument,
  onRagTitleChange,
  onRagCategoryChange,
  onRagWeekChange,
  onRagContentChange,
  onUploadRagDocument,
  onDeleteRagDocument,
  onUploadRagFile,
  onDeleteRagFile,
  onToggleRagFile,
}: AdminDocumentsSectionProps) {
  const [activeOverlay, setActiveOverlay] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [togglingFileId, setTogglingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedRagDocument =
    ragDocuments.find((d) => d.id === selectedRagDocumentId) ?? null;

  function matchesEntry(entry: FileEntry) {
    const q = query.trim().toLowerCase();
    const haystack =
      entry.kind === "file"
        ? `${entry.data.filename} ${entry.data.storagePath}`
        : `${entry.data.title} ${entry.data.category} ${entry.data.pregnancyWeekLabel ?? ""} ${getDocumentSourceText(entry.data)}`;
    const matchesQuery = !q || haystack.toLowerCase().includes(q);

    let matchesStatus = true;
    if (statusFilter !== "all") {
      matchesStatus = entry.data.status === statusFilter;
    }

    let matchesType = true;
    if (typeFilter !== "all") {
      matchesType = entry.kind === typeFilter;
    }

    return matchesQuery && matchesStatus && matchesType;
  }

  const filteredFiles = ragFiles.filter((file) =>
    matchesEntry({ kind: "file", data: file }),
  );
  const filteredDocuments = ragDocuments.filter((document) =>
    matchesEntry({ kind: "doc", data: document }),
  );

  const fileGroups = ragFiles
    .map((file) => {
      const documents = filteredDocuments.filter((document) =>
        doesDocumentBelongToFile(document, file),
      );
      const fileMatches = filteredFiles.some((item) => item.id === file.id);
      const shouldInclude =
        typeFilter === "file"
          ? fileMatches
          : typeFilter === "doc"
            ? documents.length > 0
            : fileMatches || documents.length > 0;

      return shouldInclude
        ? {
            file,
            documents,
          }
        : null;
    })
    .filter((group): group is { file: RagFileItem; documents: RagDocument[] } =>
      Boolean(group),
    );

  const linkedDocumentIds = new Set(
    fileGroups.flatMap((group) =>
      group.documents.map((document) => document.id),
    ),
  );
  const unlinkedDocuments =
    typeFilter === "file"
      ? []
      : filteredDocuments.filter(
          (document) => !linkedDocumentIds.has(document.id),
        );
  const visibleEntries: FileEntry[] = [
    ...fileGroups.flatMap((group) => [
      { kind: "file" as const, data: group.file },
      ...group.documents.map(
        (document): FileEntry => ({
          kind: "doc",
          data: document,
        }),
      ),
    ]),
    ...unlinkedDocuments.map(
      (document): FileEntry => ({ kind: "doc", data: document }),
    ),
  ];

  const allKeys = visibleEntries.map(entryKey);
  const allSelected =
    allKeys.length > 0 && allKeys.every((k) => selected.has(k));
  const visibleDocumentCount =
    linkedDocumentIds.size + unlinkedDocuments.length;

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allKeys));
    }
  }

  function toggleRow(key: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await onUploadRagFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleDeleteFile(fileId: string) {
    setDeletingFileId(fileId);
    try {
      await onDeleteRagFile(fileId);
    } finally {
      setDeletingFileId(null);
    }
  }

  async function handleBulkDelete() {
    const docIds = [...selected]
      .filter((k) => k.startsWith("doc:"))
      .map((k) => k.slice(4));
    const fileIds = [...selected]
      .filter((k) => k.startsWith("file:"))
      .map((k) => k.slice(5));

    for (const id of fileIds) {
      setDeletingFileId(id);
      await onDeleteRagFile(id);
    }
    setDeletingFileId(null);

    if (docIds.length > 0) {
      await onSelectRagDocument(docIds[0]);
      await onDeleteRagDocument();
    }
    setSelected(new Set());
  }

  return (
    <section className="space-y-4">
      <Card className="shadow-sm">
        <CardHeader className="space-y-4">
          <nav
            className="flex items-center gap-2 text-sm text-muted-foreground"
            aria-label="경로"
          >
            <FolderOpen className="h-4 w-4" />
            <span>pregnancy-knowledge</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-medium text-foreground">지식 문서</span>
          </nav>
          <div>
            <CardTitle className="text-lg">파일별 RAG 처리</CardTitle>
            <CardDescription>
              업로드한 파일 아래에 처리된 RAG 문서와 청크 수를 묶어서
              확인합니다.
            </CardDescription>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                disabled={isFileUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {isFileUploading ? "업로드 중..." : "업로드"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onResetRagDocument();
                  setActiveOverlay(true);
                }}
              >
                <FilePlus2 className="h-4 w-4" />새 자료
              </Button>
              {selected.size > 0 ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="h-4 w-4" />
                  {selected.size}건 삭제
                </Button>
              ) : null}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative min-w-[240px]">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="파일명 또는 카테고리 검색"
                  aria-label="파일 검색"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 유형</SelectItem>
                  <SelectItem value="file">파일 자료</SelectItem>
                  <SelectItem value="doc">텍스트 자료</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 상태</SelectItem>
                  <SelectItem value="ready">배포 가능</SelectItem>
                  <SelectItem value="draft">작성 중</SelectItem>
                  <SelectItem value="processing">처리 중</SelectItem>
                  <SelectItem value="failed">오류</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <Input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-md border bg-muted p-3">
              <p className="text-xs text-muted-foreground">파일</p>
              <strong>{fileGroups.length.toLocaleString()}건</strong>
            </div>
            <div className="rounded-md border bg-muted p-3">
              <p className="text-xs text-muted-foreground">RAG 문서</p>
              <strong>{visibleDocumentCount.toLocaleString()}건</strong>
            </div>
            <div className="rounded-md border bg-muted p-3">
              <p className="text-xs text-muted-foreground">선택</p>
              <strong>{selected.size.toLocaleString()}건</strong>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-2">
            <Checkbox
              aria-label="전체 선택"
              checked={allSelected}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">
              현재 표시된 파일과 RAG 문서를 한 번에 선택합니다.
            </span>
          </div>

          <div className="space-y-3">
            {fileGroups.length === 0 && unlinkedDocuments.length === 0 ? (
              <p className="rounded-md border border-dashed bg-muted p-6 text-center text-sm text-muted-foreground">
                조건에 맞는 자료가 없습니다.
              </p>
            ) : null}

            {fileGroups.map(({ file, documents }) => {
              const fileKey = entryKey({ kind: "file", data: file });
              const isFileSelected = selected.has(fileKey);
              return (
                <section
                  key={file.id}
                  className="overflow-hidden rounded-lg border bg-background"
                >
                  <div className="flex flex-col gap-3 border-b bg-muted p-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <Checkbox
                        aria-label={`${file.filename} 선택`}
                        checked={isFileSelected}
                        onCheckedChange={() => toggleRow(fileKey)}
                        className="mt-2"
                      />
                      <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                        {getMimeIcon(file.mimeType)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-base font-semibold">
                            {file.filename}
                          </h3>
                          <StatusBadge
                            tone={statusTone(
                              getRagFileStatusBadge(file.status),
                            )}
                          >
                            {getRagFileStatusLabel(file.status)}
                          </StatusBadge>
                          <StatusBadge
                            tone={file.enabled ? "success" : "neutral"}
                          >
                            {file.enabled ? "반영 중" : "미반영"}
                          </StatusBadge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {file.schiftBucket} · {formatFileSize(file.fileSize)}{" "}
                          · {documents.length.toLocaleString()}개 RAG 문서
                        </p>
                        {file.errorMessage ? (
                          <p
                            className="mt-1 max-w-3xl truncate text-xs text-destructive"
                            title={file.errorMessage}
                          >
                            {file.errorMessage}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 lg:justify-end">
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(file.updatedAt ?? file.createdAt)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title={
                          file.enabled
                            ? "반영 중 - 클릭해 비활성화"
                            : "미반영 - 클릭해 활성화"
                        }
                        disabled={
                          file.status !== "ready" || togglingFileId === file.id
                        }
                        onClick={async () => {
                          setTogglingFileId(file.id);
                          try {
                            await onToggleRagFile(file.id, !file.enabled);
                          } finally {
                            setTogglingFileId(null);
                          }
                        }}
                        aria-label={file.enabled ? "반영 중지" : "반영 시작"}
                      >
                        {file.enabled ? (
                          <ToggleRight className="h-4 w-4 text-emerald-600" />
                        ) : (
                          <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        title="삭제"
                        disabled={deletingFileId === file.id}
                        onClick={() => void handleDeleteFile(file.id)}
                        aria-label="파일 삭제"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {documents.length === 0 ? (
                    <p className="p-4 text-sm text-muted-foreground">
                      이 파일에서 연결된 RAG 문서가 아직 확인되지 않았습니다.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10" />
                          <TableHead>RAG 문서</TableHead>
                          <TableHead>분류</TableHead>
                          <TableHead>상태</TableHead>
                          <TableHead>청크</TableHead>
                          <TableHead>수정일</TableHead>
                          <TableHead className="w-10" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => {
                          const docKey = entryKey({ kind: "doc", data: doc });
                          const isDocSelected =
                            doc.id === selectedRagDocumentId ||
                            selected.has(docKey);
                          return (
                            <TableRow
                              key={doc.id}
                              data-state={
                                isDocSelected ? "selected" : undefined
                              }
                              className="cursor-pointer"
                              onClick={() => {
                                void onSelectRagDocument(doc.id);
                                setActiveOverlay(true);
                              }}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  aria-label={`${doc.title} 선택`}
                                  checked={selected.has(docKey)}
                                  onCheckedChange={() => toggleRow(docKey)}
                                />
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{doc.title}</div>
                                {doc.sourceFilename ? (
                                  <div className="text-xs text-muted-foreground">
                                    출처 {doc.sourceFilename}
                                  </div>
                                ) : null}
                              </TableCell>
                              <TableCell>
                                <div>{doc.category}</div>
                                <div className="text-xs text-muted-foreground">
                                  {doc.pregnancyWeekLabel || "공통"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <StatusBadge
                                  tone={statusTone(
                                    getDocumentStatusBadge(doc.status),
                                  )}
                                >
                                  {getDocumentStatusLabel(doc.status)}
                                </StatusBadge>
                              </TableCell>
                              <TableCell>{doc.chunkCount}개</TableCell>
                              <TableCell className="text-muted-foreground">
                                {formatDateTime(doc.updatedAt)}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                <ChevronRight className="ml-auto h-4 w-4" />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </section>
              );
            })}

            {unlinkedDocuments.length > 0 ? (
              <section className="overflow-hidden rounded-lg border bg-background">
                <div className="border-b bg-muted p-4">
                  <h3 className="text-base font-semibold">직접 입력 자료</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    업로드 파일 metadata와 연결되지 않은 RAG 문서입니다.
                  </p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>RAG 문서</TableHead>
                      <TableHead>분류</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>청크</TableHead>
                      <TableHead>수정일</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unlinkedDocuments.map((doc) => {
                      const docKey = entryKey({ kind: "doc", data: doc });
                      const isDocSelected =
                        doc.id === selectedRagDocumentId ||
                        selected.has(docKey);
                      return (
                        <TableRow
                          key={doc.id}
                          data-state={isDocSelected ? "selected" : undefined}
                          className="cursor-pointer"
                          onClick={() => {
                            void onSelectRagDocument(doc.id);
                            setActiveOverlay(true);
                          }}
                        >
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              aria-label={`${doc.title} 선택`}
                              checked={selected.has(docKey)}
                              onCheckedChange={() => toggleRow(docKey)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{doc.title}</div>
                            {doc.sourceFilename ? (
                              <div className="text-xs text-muted-foreground">
                                출처 {doc.sourceFilename}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            <div>{doc.category}</div>
                            <div className="text-xs text-muted-foreground">
                              {doc.pregnancyWeekLabel || "공통"}
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              tone={statusTone(
                                getDocumentStatusBadge(doc.status),
                              )}
                            >
                              {getDocumentStatusLabel(doc.status)}
                            </StatusBadge>
                          </TableCell>
                          <TableCell>{doc.chunkCount}개</TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDateTime(doc.updatedAt)}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            <ChevronRight className="ml-auto h-4 w-4" />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </section>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground" aria-live="polite">
            표시 중 {visibleEntries.length.toLocaleString()}개 항목
            {selected.size > 0
              ? ` · ${selected.size.toLocaleString()}개 선택됨`
              : ""}
          </p>
        </CardContent>
      </Card>

      <SideDrawer
        open={activeOverlay}
        title={selectedRagDocument ? "자료 편집" : "새 자료"}
        description="제목, 분류, 주차, 본문을 수정하고 바로 저장합니다."
        onClose={() => setActiveOverlay(false)}
        footer={
          <>
            <Button
              variant="outline"
              type="button"
              disabled={isRagSubmitting}
              onClick={onResetRagDocument}
            >
              비우기
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={isRagSubmitting || !selectedRagDocumentId}
              onClick={onDeleteRagDocument}
            >
              삭제
            </Button>
            <Button
              type="button"
              disabled={isRagSubmitting}
              onClick={onUploadRagDocument}
            >
              {selectedRagDocumentId ? "자료 저장" : "자료 반영"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {contentMessage ? (
            <p className="text-sm text-muted-foreground">{contentMessage}</p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor="rag-title">자료 제목</Label>
            <Input
              id="rag-title"
              value={ragTitle}
              onChange={(e) => onRagTitleChange(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rag-category">카테고리</Label>
              <Input
                id="rag-category"
                value={ragCategory}
                onChange={(e) => onRagCategoryChange(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rag-week">주차</Label>
              <Input
                id="rag-week"
                inputMode="numeric"
                value={ragWeek}
                onChange={(e) => onRagWeekChange(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rag-content">자료 내용</Label>
            <Textarea
              id="rag-content"
              className="min-h-56"
              value={ragContent}
              onChange={(e) => onRagContentChange(e.target.value)}
            />
          </div>
        </div>
      </SideDrawer>
    </section>
  );
}
