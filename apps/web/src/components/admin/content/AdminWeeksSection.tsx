"use client";

import { useState } from "react";

import type {
  AdminWeekAsset,
  AdminWeekDay,
  AdminWeekDetail,
  AdminWeekMedia,
  AdminWeekSection,
  AdminWeekSummary,
} from "@gynecology-chatbot/app-core";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getWeekStatusBadge,
  getWeekStatusLabel,
} from "../admin-dashboard-labels";
import { AdminWeekOverlay } from "./AdminWeekOverlay";
import {
  formatMobileWeekDayLabel,
  formatMobileWeekDayRangeLabel,
} from "./admin-week-day-labels";
import { getWeekPublishDayStatus } from "./week-publish-review";
import { getAdminVisibleWeeks } from "./admin-week-visibility";

function getStaticWeekBabyImagePath(weekNumber: number) {
  if (weekNumber < 5 || weekNumber > 40) {
    return null;
  }

  return `/week-baby/week-baby-w${String(weekNumber).padStart(2, "0")}.png`;
}

function weekToneClass(status: string) {
  const badge = getWeekStatusBadge(status as AdminWeekDetail["status"]);
  if (badge === "statusSuccess")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (badge === "statusWarning")
    return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-border bg-muted text-muted-foreground";
}

function publishDayToneClass(status: "complete" | "partial" | "empty") {
  if (status === "complete")
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "partial")
    return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-border bg-muted text-muted-foreground";
}

function WeekBabyImage({ weekNumber }: { weekNumber: number }) {
  const imagePath = getStaticWeekBabyImagePath(weekNumber);

  return (
    <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
      {imagePath ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imagePath}
          alt={`${weekNumber}주 아기 일러스트`}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="p-2 text-center text-xs text-muted-foreground">
          이미지 없음
        </span>
      )}
    </div>
  );
}

export interface AdminWeeksSectionProps {
  weekSummaries: AdminWeekSummary[];
  selectedWeekNumber: number | null;
  selectedWeekDetail: AdminWeekDetail | null;
  isLoadingWeeks: boolean;
  isWeekSaving: boolean;
  contentMessage: string | null;
  uploadingCoverField: "heroImagePath" | "compareImagePath" | null;
  uploadingMediaIndex: number | null;
  onSelectWeek: (weekNumber: number) => void;
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
  onWeekStatusChange?: (value: AdminWeekDetail["status"]) => void;
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

export function AdminWeeksSection({
  weekSummaries,
  selectedWeekNumber,
  selectedWeekDetail,
  isLoadingWeeks,
  isWeekSaving,
  contentMessage,
  uploadingCoverField,
  uploadingMediaIndex,
  onSelectWeek,
  onWeekFieldChange,
  onUploadWeekCoverImage,
  onWeekDayChange,
  onWeekSectionChange,
  onWeekAssetChange,
  onWeekMediaChange,
  onUploadWeekMedia,
  onAddWeekDay,
  onAddWeekSection,
  onAddWeekAsset,
  onAddWeekMedia,
  onMoveWeekDay,
  onMoveWeekSection,
  onMoveWeekAsset,
  onMoveWeekMedia,
  onRemoveWeekDay,
  onRemoveWeekSection,
  onRemoveWeekAsset,
  onRemoveWeekMedia,
  onSaveWeek,
}: AdminWeeksSectionProps) {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [weekStatusFilter, setWeekStatusFilter] = useState("all");

  const visibleWeekSummaries = getAdminVisibleWeeks(weekSummaries);
  const weekStatusOptions = [
    { value: "draft", label: "초안" },
    { value: "published", label: "게시중" },
    { value: "archived", label: "보관" },
  ].filter((option) =>
    visibleWeekSummaries.some((week) => week.status === option.value),
  );
  const shouldShowStatusFilter = weekStatusOptions.length > 1;
  const selectedStatusAvailable = weekStatusOptions.some(
    (option) => option.value === weekStatusFilter,
  );
  const effectiveWeekStatusFilter =
    shouldShowStatusFilter && selectedStatusAvailable
      ? weekStatusFilter
      : "all";
  const filteredWeekSummaries = visibleWeekSummaries.filter(
    (week) =>
      effectiveWeekStatusFilter === "all" ||
      week.status === effectiveWeekStatusFilter,
  );

  const selectedWeekOverview = selectedWeekDetail
    ? {
        dayCount: selectedWeekDetail.days.length,
        checklistCount: selectedWeekDetail.sections.length,
        questionCount: selectedWeekDetail.assets.length,
        mediaCount: selectedWeekDetail.media.length,
      }
    : null;

  const selectedWeekDayRows = selectedWeekDetail
    ? [...selectedWeekDetail.days]
        .sort((left, right) => left.dayNumber - right.dayNumber)
        .map((day) => {
          const checklistCount = selectedWeekDetail.sections.filter(
            (section) => section.dayNumber === day.dayNumber,
          ).length;
          const questionCount = selectedWeekDetail.assets.filter(
            (asset) => asset.dayNumber === day.dayNumber,
          ).length;
          const status = getWeekPublishDayStatus(
            selectedWeekDetail,
            day.dayNumber,
          );

          return {
            id: day.id || `day-${day.dayNumber}`,
            dayNumber: day.dayNumber,
            dayLabel: formatMobileWeekDayLabel(
              selectedWeekDetail.weekNumber,
              day.dayNumber,
            ),
            fetalCount: day.babyDevelopmentItems.filter((item) => item.trim())
              .length,
            maternalCount: day.motherChangesItems.filter((item) => item.trim())
              .length,
            checklistCount,
            questionCount,
            babyMessage: day.babyMessage?.trim() ?? "",
            status,
          };
        })
    : [];

  const selectedWeekHeroMedia = selectedWeekDetail?.media.find(
    (media) =>
      media.mediaScope === "week" &&
      media.dayNumber === null &&
      (media.mediaRole === "reference" ||
        media.mediaRole === "weekly_summary" ||
        media.mediaRole === "hero"),
  );
  const selectedWeekCompareMedia = selectedWeekDetail?.media.find(
    (media) =>
      media.mediaScope === "week" &&
      media.dayNumber === null &&
      media.mediaRole === "compare",
  );

  return (
    <section className="space-y-6">
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0">
          <Card className="sticky top-20 shadow-sm">
            <CardContent className="space-y-3 p-4">
              {shouldShowStatusFilter ? (
                <div>
                  <Select
                    value={effectiveWeekStatusFilter}
                    onValueChange={setWeekStatusFilter}
                  >
                    <SelectTrigger aria-label="상태">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {weekStatusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-2">
                {filteredWeekSummaries.map((week) => (
                  <Button
                    key={week.id}
                    variant={
                      selectedWeekNumber === week.weekNumber
                        ? "secondary"
                        : "outline"
                    }
                    type="button"
                    className="h-auto w-full justify-between whitespace-normal px-3 py-3 text-left"
                    onClick={() => onSelectWeek(week.weekNumber)}
                  >
                    <span className="font-semibold">{week.weekNumber}주차</span>
                    <span className="text-xs text-muted-foreground">
                      {week.updatedAt.slice(0, 10)}
                    </span>
                  </Button>
                ))}
                {filteredWeekSummaries.length === 0 ? (
                  <p className="rounded-md border border-dashed bg-muted p-4 text-sm text-muted-foreground">
                    {isLoadingWeeks
                      ? "주차 목록을 불러오는 중입니다."
                      : "조건에 맞는 주차가 없습니다."}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </aside>

        <div className="min-w-0 space-y-6">
          {selectedWeekDetail ? (
            <>
              {contentMessage ? (
                <Card>
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    {contentMessage}
                  </CardContent>
                </Card>
              ) : null}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedWeekDetail.weekNumber}주차 개요
                    </CardTitle>
                  </div>
                  <Button type="button" onClick={() => setIsOverlayOpen(true)}>
                    상세 편집 열기
                  </Button>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 gap-5 xl:grid-cols-[auto_minmax(0,1fr)_160px]">
                    <WeekBabyImage weekNumber={selectedWeekDetail.weekNumber} />
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          선택 주차
                        </p>
                        <h4 className="mt-1 text-lg font-semibold">
                          {selectedWeekDetail.title}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="outline"
                          className={weekToneClass(selectedWeekDetail.status)}
                        >
                          {getWeekStatusLabel(selectedWeekDetail.status)}
                        </Badge>
                        <Badge variant="outline">
                          아기 크기 {selectedWeekDetail.babySizeLabel || "-"}
                        </Badge>
                        <Badge variant="outline">
                          비교 {selectedWeekDetail.babySizeCompareObject || "-"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <SummaryCard
                          label="주차 아기 요약"
                          value={selectedWeekDetail.babySummary}
                        />
                        <SummaryCard
                          label="주차 엄마 요약"
                          value={selectedWeekDetail.motherSummary}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
                      <StatCard
                        label="일자 수"
                        value={selectedWeekOverview?.dayCount ?? 0}
                      />
                      <StatCard
                        label="체크리스트"
                        value={selectedWeekOverview?.checklistCount ?? 0}
                      />
                      <StatCard
                        label="질문"
                        value={selectedWeekOverview?.questionCount ?? 0}
                      />
                      <StatCard
                        label="이미지"
                        value={selectedWeekOverview?.mediaCount ?? 0}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    {formatMobileWeekDayRangeLabel(
                      selectedWeekDetail.weekNumber,
                    )}{" "}
                    검수
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedWeekDayRows.map((day) => (
                    <article
                      key={day.id}
                      className="rounded-lg border bg-muted p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-base font-semibold">
                            {day.dayLabel}
                          </h4>
                        </div>
                        <Badge
                          variant="outline"
                          className={publishDayToneClass(day.status)}
                        >
                          {day.status === "complete"
                            ? "검수 가능"
                            : day.status === "partial"
                              ? "보완 필요"
                              : "미작성"}
                        </Badge>
                      </div>
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
                          <StatCard
                            label="태아 발달정보"
                            value={`${day.fetalCount}개 문단`}
                          />
                          <StatCard
                            label="모체 변화정보"
                            value={`${day.maternalCount}개 문단`}
                          />
                          <StatCard
                            label="생활 체크리스트"
                            value={`${day.checklistCount}개 항목`}
                          />
                          <StatCard
                            label="태교 질문"
                            value={`${day.questionCount}개 항목`}
                          />
                        </div>
                        {day.babyMessage ? (
                          <p className="rounded-md border bg-muted p-3 text-sm leading-6 text-muted-foreground">
                            {day.babyMessage}
                          </p>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                {isLoadingWeeks
                  ? "주차 상세를 불러오는 중입니다."
                  : "왼쪽에서 주차를 선택하면 주차 개요와 일자별 검수 보드가 열립니다."}
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <AdminWeekOverlay
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        selectedWeekDetail={selectedWeekDetail}
        contentMessage={contentMessage}
        isWeekSaving={isWeekSaving}
        isLoadingWeeks={isLoadingWeeks}
        uploadingCoverField={uploadingCoverField}
        uploadingMediaIndex={uploadingMediaIndex}
        selectedWeekHeroMedia={selectedWeekHeroMedia}
        selectedWeekCompareMedia={selectedWeekCompareMedia}
        onWeekFieldChange={onWeekFieldChange}
        onUploadWeekCoverImage={onUploadWeekCoverImage}
        onWeekDayChange={onWeekDayChange}
        onWeekSectionChange={onWeekSectionChange}
        onWeekAssetChange={onWeekAssetChange}
        onWeekMediaChange={onWeekMediaChange}
        onUploadWeekMedia={onUploadWeekMedia}
        onAddWeekDay={onAddWeekDay}
        onAddWeekSection={onAddWeekSection}
        onAddWeekAsset={onAddWeekAsset}
        onAddWeekMedia={onAddWeekMedia}
        onMoveWeekDay={onMoveWeekDay}
        onMoveWeekSection={onMoveWeekSection}
        onMoveWeekAsset={onMoveWeekAsset}
        onMoveWeekMedia={onMoveWeekMedia}
        onRemoveWeekDay={onRemoveWeekDay}
        onRemoveWeekSection={onRemoveWeekSection}
        onRemoveWeekAsset={onRemoveWeekAsset}
        onRemoveWeekMedia={onRemoveWeekMedia}
        onSaveWeek={onSaveWeek}
      />
    </section>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted p-4">
      <p className="text-sm font-semibold">{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}
