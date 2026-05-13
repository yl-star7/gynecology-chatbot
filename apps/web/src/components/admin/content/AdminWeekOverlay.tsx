"use client";

import type { ReactNode } from "react";
import type {
  AdminWeekAsset,
  AdminWeekDay,
  AdminWeekDetail,
  AdminWeekMedia,
  AdminWeekSection,
} from "@gynecology-chatbot/app-core";

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { AdminFileUpload } from "../ui";
import {
  formatMobileWeekDayLabel,
  formatMobileWeekDayRangeLabel,
} from "./admin-week-day-labels";
import { WeekImagePreview } from "./WeekImagePreview";

export interface AdminWeekOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWeekDetail: AdminWeekDetail | null;
  contentMessage: string | null;
  isWeekSaving: boolean;
  isLoadingWeeks: boolean;
  uploadingCoverField: "heroImagePath" | "compareImagePath" | null;
  uploadingMediaIndex: number | null;
  selectedWeekHeroMedia: AdminWeekMedia | undefined;
  selectedWeekCompareMedia: AdminWeekMedia | undefined;
  onWeekFieldChange: (
    field:
      | "title"
      | "babySizeLabel"
      | "babySizeCompareObject"
      | "babySummary"
      | "motherSummary"
      | "heroImagePath"
      | "compareImagePath",
    value: string,
  ) => void;
  onUploadWeekCoverImage: (
    field: "heroImagePath" | "compareImagePath",
    file: File,
  ) => Promise<void>;
  onWeekDayChange: (
    index: number,
    field: keyof AdminWeekDay,
    value: string | number | string[] | null,
  ) => void;
  onWeekSectionChange: (
    index: number,
    field: keyof AdminWeekSection,
    value: string | number | boolean | null,
  ) => void;
  onWeekAssetChange: (
    index: number,
    field: keyof AdminWeekAsset,
    value: string | number | boolean | null,
  ) => void;
  onWeekMediaChange: (
    index: number,
    field: keyof AdminWeekMedia,
    value: string | number | null,
  ) => void;
  onUploadWeekMedia: (index: number, file: File) => Promise<void>;
  onAddWeekDay: () => void;
  onAddWeekSection: () => void;
  onAddWeekAsset: () => void;
  onAddWeekMedia: () => void;
  onMoveWeekDay: (index: number, direction: -1 | 1) => void;
  onMoveWeekSection: (index: number, direction: -1 | 1) => void;
  onMoveWeekAsset: (index: number, direction: -1 | 1) => void;
  onMoveWeekMedia: (index: number, direction: -1 | 1) => void;
  onRemoveWeekDay: (index: number) => void;
  onRemoveWeekSection: (index: number) => void;
  onRemoveWeekAsset: (index: number) => void;
  onRemoveWeekMedia: (index: number) => void;
  onSaveWeek: () => Promise<void>;
}

function toSingleTextareaItem(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized ? [normalized] : [];
}

function getStaticWeekBabyImagePath(weekNumber: number) {
  if (weekNumber < 5 || weekNumber > 40) {
    return null;
  }

  return `/week-baby/week-baby-w${String(weekNumber).padStart(2, "0")}.png`;
}

function formatUpdatedDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

function formatUpdatedTime(value: string) {
  const date = new Date(value);
  return date.toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Seoul",
  });
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {description ? (
        <p className="text-xs text-muted-foreground">{description}</p>
      ) : null}
    </div>
  );
}

function SectionCard({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description ? (
            <CardDescription>{description}</CardDescription>
          ) : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

function BooleanSelect({
  value,
  trueLabel,
  falseLabel,
  onChange,
}: {
  value: boolean;
  trueLabel: string;
  falseLabel: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <Select
      value={value ? "true" : "false"}
      onValueChange={(nextValue) => onChange(nextValue === "true")}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">{trueLabel}</SelectItem>
        <SelectItem value="false">{falseLabel}</SelectItem>
      </SelectContent>
    </Select>
  );
}

function EmptyEditorState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed bg-muted p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function getChecklistNumber(section: AdminWeekSection, fallbackIndex: number) {
  const codeMatch = section.sectionKey.match(/check-(\d+)$/);
  if (codeMatch?.[1]) {
    return Number(codeMatch[1]);
  }

  const displayRemainder = section.displayOrder % 100;
  return displayRemainder > 0 ? displayRemainder : fallbackIndex + 1;
}

function groupChecklistSections(
  sections: AdminWeekSection[],
  weekNumber: number,
) {
  const groups = new Map<
    string,
    {
      dayNumber: number | null;
      label: string;
      items: Array<{
        section: AdminWeekSection;
        sectionIndex: number;
        checklistNumber: number;
      }>;
    }
  >();

  sections.forEach((section, sectionIndex) => {
    const dayNumber = section.dayNumber ?? null;
    const key = dayNumber === null ? "common" : String(dayNumber);
    const group =
      groups.get(key) ??
      {
        dayNumber,
        label:
          dayNumber === null
            ? "공통 체크리스트"
            : formatMobileWeekDayLabel(weekNumber, dayNumber),
        items: [],
      };

    group.items.push({ section, sectionIndex, checklistNumber: 0 });
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .sort(
      (left, right) =>
        (left.dayNumber ?? 99) - (right.dayNumber ?? 99) ||
        left.label.localeCompare(right.label),
    )
    .map((group) => ({
      ...group,
      items: group.items
        .sort(
          (left, right) =>
            left.section.displayOrder - right.section.displayOrder ||
            left.sectionIndex - right.sectionIndex,
        )
        .map((item, itemIndex) => ({
          ...item,
          checklistNumber: getChecklistNumber(item.section, itemIndex),
        })),
    }));
}

function getQuestionNumber(asset: AdminWeekAsset, fallbackIndex: number) {
  const code = asset.styleKey ?? "";
  const codeMatch = code.match(/question-(\d+)$/);
  if (codeMatch?.[1]) {
    return Number(codeMatch[1]);
  }

  const displayRemainder = asset.displayOrder % 100;
  return displayRemainder > 0 ? displayRemainder : fallbackIndex + 1;
}

function groupQuestionAssets(assets: AdminWeekAsset[], weekNumber: number) {
  const groups = new Map<
    string,
    {
      dayNumber: number | null;
      label: string;
      items: Array<{
        asset: AdminWeekAsset;
        assetIndex: number;
        questionNumber: number;
      }>;
    }
  >();

  assets.forEach((asset, assetIndex) => {
    const dayNumber = asset.dayNumber ?? null;
    const key = dayNumber === null ? "common" : String(dayNumber);
    const group =
      groups.get(key) ??
      {
        dayNumber,
        label:
          dayNumber === null
            ? "공통 질문"
            : formatMobileWeekDayLabel(weekNumber, dayNumber),
        items: [],
      };

    group.items.push({ asset, assetIndex, questionNumber: 0 });
    groups.set(key, group);
  });

  return Array.from(groups.values())
    .sort(
      (left, right) =>
        (left.dayNumber ?? 99) - (right.dayNumber ?? 99) ||
        left.label.localeCompare(right.label),
    )
    .map((group) => ({
      ...group,
      items: group.items
        .sort(
          (left, right) =>
            left.asset.displayOrder - right.asset.displayOrder ||
            left.assetIndex - right.assetIndex,
        )
        .map((item, itemIndex) => ({
          ...item,
          questionNumber: getQuestionNumber(item.asset, itemIndex),
        })),
    }));
}

export function AdminWeekOverlay({
  isOpen,
  onClose,
  selectedWeekDetail,
  contentMessage,
  isWeekSaving,
  isLoadingWeeks,
  uploadingCoverField,
  selectedWeekHeroMedia,
  selectedWeekCompareMedia,
  onWeekFieldChange,
  onUploadWeekCoverImage,
  onWeekDayChange,
  onWeekSectionChange,
  onWeekAssetChange,
  onAddWeekSection,
  onAddWeekAsset,
  onSaveWeek,
}: AdminWeekOverlayProps) {
  const publicStorageBaseUrl = (
    process.env.NEXT_PUBLIC_GCS_PUBLIC_BASE_URL ??
    "https://storage.googleapis.com"
  ).replace(/\/$/, "");

  function resolveImagePreviewSrc(path: string | null | undefined) {
    const trimmed = path?.trim();
    if (!trimmed) {
      return null;
    }

    if (
      trimmed.startsWith("/") ||
      trimmed.startsWith("http://") ||
      trimmed.startsWith("https://")
    ) {
      return trimmed;
    }

    if (trimmed.startsWith("storage://")) {
      const normalized = trimmed.replace("storage://", "");
      const slashIndex = normalized.indexOf("/");
      if (slashIndex === -1) {
        return null;
      }

      const bucketId = normalized.slice(0, slashIndex).trim();
      const objectPath = normalized.slice(slashIndex + 1).trim();
      if (!bucketId || !objectPath) {
        return null;
      }

      return `${publicStorageBaseUrl}/${bucketId}/${objectPath}`;
    }

    return null;
  }

  function renderWeekImageField(input: {
    field: "heroImagePath" | "compareImagePath";
    label: string;
    value: string | null;
    fallbackMedia: AdminWeekMedia | undefined;
  }) {
    const fallbackStoragePath =
      !input.value && input.fallbackMedia
        ? `storage://${input.fallbackMedia.bucketId}/${input.fallbackMedia.objectPath}`
        : null;
    const previewSrc = resolveImagePreviewSrc(
      input.value ?? fallbackStoragePath,
    );
    const staticWeekImageSrc =
      input.field === "heroImagePath" && selectedWeekDetail
        ? getStaticWeekBabyImagePath(selectedWeekDetail.weekNumber)
        : null;
    const isUploading = uploadingCoverField === input.field;

    return (
      <Field label={input.label}>
        <div className="grid gap-3 rounded-md border bg-muted p-3 md:grid-cols-[180px_minmax(0,1fr)]">
          <WeekImagePreview
            src={previewSrc}
            fallbackSrc={staticWeekImageSrc}
            alt={input.label}
            emptyLabel={`${input.label}가 아직 없어요.`}
          />
          <div className="space-y-3">
            <AdminFileUpload
              id={`week-cover-${input.field}`}
              label={isUploading ? "업로드 중" : "이미지 선택"}
              accept="image/*"
              disabled={isUploading}
              onFileSelect={(file) => {
                void onUploadWeekCoverImage(input.field, file);
              }}
            />
            <Button
              variant="outline"
              type="button"
              disabled={!input.value}
              onClick={() => onWeekFieldChange(input.field, "")}
            >
              {isUploading ? "업로드 중" : "이미지 제거"}
            </Button>
          </div>
        </div>
      </Field>
    );
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <SheetContent
        side="right"
        className="flex w-full flex-col overflow-y-auto p-0 sm:max-w-6xl"
      >
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle>
            {selectedWeekDetail
              ? `${selectedWeekDetail.weekNumber}주차 편집`
              : "주차 편집"}
          </SheetTitle>
          <SheetDescription>
            주차 요약, 일별 본문, 체크리스트, 질문, 이미지를 탭별로
            관리합니다.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {contentMessage ? (
            <div className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">
              {contentMessage}
            </div>
          ) : null}

          {selectedWeekDetail ? (
            <>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
                <div className="rounded-md border bg-muted p-3">
                  <p className="text-xs text-muted-foreground">선택 주차</p>
                  <strong>{selectedWeekDetail.weekNumber}주차</strong>
                </div>
                <div className="rounded-md border bg-muted p-3">
                  <p className="text-xs text-muted-foreground">일자 수</p>
                  <strong>{selectedWeekDetail.days.length}</strong>
                </div>
                <div className="rounded-md border bg-muted p-3">
                  <p className="text-xs text-muted-foreground">최근 수정</p>
                  <strong>
                    {formatUpdatedDate(selectedWeekDetail.updatedAt)}
                  </strong>
                  <p className="text-xs text-muted-foreground">
                    {formatUpdatedTime(selectedWeekDetail.updatedAt)}
                  </p>
                </div>
              </div>

              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList className="h-auto flex-wrap justify-start">
                  <TabsTrigger value="basic">기본 정보</TabsTrigger>
                  <TabsTrigger value="days">일별 본문</TabsTrigger>
                  <TabsTrigger value="checklists">체크리스트</TabsTrigger>
                  <TabsTrigger value="questions">질문</TabsTrigger>
                  <TabsTrigger value="images">이미지</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="mt-0 space-y-4">
                  <SectionCard title="주차 기본 정보">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Field label="주차 제목">
                        <Input
                          value={selectedWeekDetail.title}
                          onChange={(event) =>
                            onWeekFieldChange("title", event.target.value)
                          }
                        />
                      </Field>
                      <Field label="아기 크기">
                        <Input
                          value={selectedWeekDetail.babySizeLabel ?? ""}
                          onChange={(event) => {
                            onWeekFieldChange(
                              "babySizeLabel",
                              event.target.value,
                            );
                            onWeekFieldChange(
                              "babySizeCompareObject",
                              event.target.value,
                            );
                          }}
                        />
                      </Field>
                    </div>

                    <Field label="아기 요약">
                      <Textarea
                        value={selectedWeekDetail.babySummary}
                        className="min-h-28"
                        onChange={(event) =>
                          onWeekFieldChange("babySummary", event.target.value)
                        }
                      />
                    </Field>

                    <Field label="산모 요약">
                      <Textarea
                        value={selectedWeekDetail.motherSummary}
                        className="min-h-28"
                        onChange={(event) =>
                          onWeekFieldChange("motherSummary", event.target.value)
                        }
                      />
                    </Field>
                  </SectionCard>
                </TabsContent>

                <TabsContent value="days" className="mt-0 space-y-4">
                  <SectionCard
                    title="일별 본문"
                    description={`모바일과 같은 ${formatMobileWeekDayRangeLabel(selectedWeekDetail.weekNumber)} 기준으로 관리합니다.`}
                  >
                    {selectedWeekDetail.days.length === 0 ? (
                      <EmptyEditorState>
                        등록된 일별 본문이 없습니다.
                      </EmptyEditorState>
                    ) : (
                      <div className="space-y-4">
                        {selectedWeekDetail.days.map((day, index) => (
                          <div
                            key={day.id || `new-day-${index}`}
                            className="space-y-4 rounded-md border p-4"
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h4 className="font-semibold">
                                  {formatMobileWeekDayLabel(
                                    selectedWeekDetail.weekNumber,
                                    day.dayNumber,
                                  )}
                                </h4>
                              </div>
                            </div>

                            <Field label="아기의 말">
                              <Textarea
                                value={day.babyMessage ?? ""}
                                className="min-h-24"
                                onChange={(event) =>
                                  onWeekDayChange(
                                    index,
                                    "babyMessage",
                                    event.target.value,
                                  )
                                }
                              />
                            </Field>

                            <Field label="아기 발달 항목">
                              <Textarea
                                value={day.babyDevelopmentItems.join(" ")}
                                className="min-h-28"
                                onChange={(event) =>
                                  onWeekDayChange(
                                    index,
                                    "babyDevelopmentItems",
                                    toSingleTextareaItem(event.target.value),
                                  )
                                }
                              />
                            </Field>

                            <Field label="산모 변화 항목">
                              <Textarea
                                value={day.motherChangesItems.join(" ")}
                                className="min-h-28"
                                onChange={(event) =>
                                  onWeekDayChange(
                                    index,
                                    "motherChangesItems",
                                    toSingleTextareaItem(event.target.value),
                                  )
                                }
                              />
                            </Field>

                            {(() => {
                              const daySections = selectedWeekDetail.sections
                                .map((section, sectionIndex) => ({
                                  section,
                                  sectionIndex,
                                }))
                                .filter(
                                  ({ section }) =>
                                    section.dayNumber === day.dayNumber,
                                );
                              if (daySections.length === 0) return null;
                              return (
                                <Field label="체크리스트">
                                  <div className="space-y-2">
                                    {daySections.map(
                                      (
                                        { section, sectionIndex },
                                        itemIndex,
                                      ) => (
                                        <Input
                                          key={
                                            section.id ||
                                            `section-${sectionIndex}`
                                          }
                                          placeholder={`항목 ${itemIndex + 1}`}
                                          value={section.title}
                                          onChange={(event) =>
                                            onWeekSectionChange(
                                              sectionIndex,
                                              "title",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      ),
                                    )}
                                  </div>
                                </Field>
                              );
                            })()}

                            {(() => {
                              const dayAssets = selectedWeekDetail.assets
                                .map((asset, assetIndex) => ({
                                  asset,
                                  assetIndex,
                                }))
                                .filter(
                                  ({ asset }) =>
                                    asset.dayNumber === day.dayNumber,
                                );
                              if (dayAssets.length === 0) return null;
                              return (
                                <Field label="태교 질문">
                                  <div className="space-y-2">
                                    {dayAssets.map(
                                      ({ asset, assetIndex }, itemIndex) => (
                                        <Input
                                          key={
                                            asset.id || `asset-${assetIndex}`
                                          }
                                          placeholder={`질문 ${itemIndex + 1}`}
                                          value={asset.storagePath}
                                          onChange={(event) =>
                                            onWeekAssetChange(
                                              assetIndex,
                                              "storagePath",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      ),
                                    )}
                                  </div>
                                </Field>
                              );
                            })()}
                          </div>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </TabsContent>

                <TabsContent value="checklists" className="mt-0 space-y-4">
                  <SectionCard
                    title="체크리스트"
                    description="앱에 노출할 체크리스트 문구를 관리합니다."
                    action={
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onAddWeekSection}
                      >
                        체크리스트 추가
                      </Button>
                    }
                  >
                    {selectedWeekDetail.sections.length === 0 ? (
                      <EmptyEditorState>
                        등록된 체크리스트 항목이 없습니다.
                      </EmptyEditorState>
                    ) : (
                      <div className="space-y-6">
                        {groupChecklistSections(
                          selectedWeekDetail.sections,
                          selectedWeekDetail.weekNumber,
                        ).map((group) => (
                          <section
                            key={
                              group.dayNumber === null
                                ? "common-checklists"
                                : `day-${group.dayNumber}-checklists`
                            }
                            className="space-y-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
                              <div>
                                <h4 className="font-semibold">
                                  {group.label}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  체크리스트 {group.items.length}개
                                </p>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {group.items.map(
                                ({
                                  section,
                                  sectionIndex,
                                  checklistNumber,
                                }) => (
                                  <div
                                    key={
                                      section.id ||
                                      `new-section-${sectionIndex}`
                                    }
                                    className="space-y-4 rounded-md border bg-background p-4"
                                  >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                      <Badge variant="secondary">
                                        항목 {checklistNumber}
                                      </Badge>
                                      <div className="w-full sm:w-44">
                                        <Field label="앱 노출">
                                          <BooleanSelect
                                            value={section.isActive}
                                            trueLabel="앱에 노출"
                                            falseLabel="숨김"
                                            onChange={(value) =>
                                              onWeekSectionChange(
                                                sectionIndex,
                                                "isActive",
                                                value,
                                              )
                                            }
                                          />
                                        </Field>
                                      </div>
                                    </div>

                                    <Field label="체크리스트 문구">
                                      <Input
                                        value={section.title}
                                        onChange={(event) =>
                                          onWeekSectionChange(
                                            sectionIndex,
                                            "title",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </Field>

                                    <Field label="설명">
                                      <Textarea
                                        value={section.body}
                                        className="min-h-24"
                                        onChange={(event) =>
                                          onWeekSectionChange(
                                            sectionIndex,
                                            "body",
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </Field>
                                  </div>
                                ),
                              )}
                            </div>
                          </section>
                        ))}
                      </div>
                    )}
                  </SectionCard>
                </TabsContent>

                <TabsContent value="questions" className="mt-0 space-y-4">
                  <SectionCard
                    title="질문"
                    description="앱에 노출할 태교 질문 문구를 관리합니다."
                    action={
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onAddWeekAsset}
                      >
                        질문 추가
                      </Button>
                    }
                  >
                    {selectedWeekDetail.assets.length === 0 ? (
                      <EmptyEditorState>
                        등록된 질문이 없습니다.
                      </EmptyEditorState>
                    ) : (
                      <div className="space-y-6">
                        {groupQuestionAssets(
                          selectedWeekDetail.assets,
                          selectedWeekDetail.weekNumber,
                        ).map((group) => (
                            <section
                              key={
                                group.dayNumber === null
                                  ? "common-questions"
                                  : `day-${group.dayNumber}-questions`
                              }
                              className="space-y-3"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
                                <div>
                                  <h4 className="font-semibold">
                                    {group.label}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    질문 {group.items.length}개
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-3">
                                {group.items.map(
                                  ({
                                    asset,
                                    assetIndex,
                                    questionNumber,
                                  }) => (
                                    <div
                                      key={
                                        asset.id ||
                                        `new-asset-${assetIndex}`
                                      }
                                      className="space-y-4 rounded-md border bg-background p-4"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <Badge variant="secondary">
                                          질문 {questionNumber}
                                        </Badge>
                                        <div className="w-full sm:w-44">
                                          <Field label="앱 노출">
                                            <BooleanSelect
                                              value={asset.isActive}
                                              trueLabel="앱에 노출"
                                              falseLabel="숨김"
                                              onChange={(value) =>
                                                onWeekAssetChange(
                                                  assetIndex,
                                                  "isActive",
                                                  value,
                                                )
                                              }
                                            />
                                          </Field>
                                        </div>
                                      </div>

                                      <Field label="질문 문구">
                                        <Textarea
                                          value={asset.storagePath}
                                          className="min-h-24 resize-y"
                                          onChange={(event) =>
                                            onWeekAssetChange(
                                              assetIndex,
                                              "storagePath",
                                              event.target.value,
                                            )
                                          }
                                        />
                                      </Field>
                                    </div>
                                  ),
                                )}
                              </div>
                            </section>
                          ),
                        )}
                      </div>
                    )}
                  </SectionCard>
                </TabsContent>

                <TabsContent value="images" className="mt-0 space-y-4">
                  <SectionCard title="대표 이미지">
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      {renderWeekImageField({
                        field: "heroImagePath",
                        label: "주차 대표 이미지",
                        value: selectedWeekDetail.heroImagePath,
                        fallbackMedia: selectedWeekHeroMedia,
                      })}
                      {renderWeekImageField({
                        field: "compareImagePath",
                        label: "크기 비교 이미지",
                        value: selectedWeekDetail.compareImagePath,
                        fallbackMedia: selectedWeekCompareMedia,
                      })}
                    </div>
                  </SectionCard>
                </TabsContent>

              </Tabs>
            </>
          ) : (
            <EmptyEditorState>
              {isLoadingWeeks
                ? "주차 상세를 불러오는 중입니다."
                : "테이블에서 주차를 선택하면 편집 패널이 열립니다."}
            </EmptyEditorState>
          )}
        </div>

        <SheetFooter className="border-t px-6 py-4">
          <Button variant="outline" type="button" onClick={onClose}>
            닫기
          </Button>
          <Button
            type="button"
            disabled={isWeekSaving || isLoadingWeeks || !selectedWeekDetail}
            onClick={async () => {
              await onSaveWeek();
              onClose();
            }}
          >
            저장
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
