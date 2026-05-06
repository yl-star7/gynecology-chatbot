"use client";

import { useMemo, useState } from "react";
import type { AdminWeekDetail } from "@gynecology-chatbot/app-core";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  formatMobileWeekDayLabel,
  getMobilePregnancyDayCount,
} from "./admin-week-day-labels";

type DailyContentColumn = "all" | "body" | "checklists" | "questions";

const COLUMN_LABELS: Record<DailyContentColumn, string> = {
  all: "전체",
  body: "일별 본문",
  checklists: "데일리 체크리스트",
  questions: "데일리 질문",
};

interface AdminDailyContentMatrixProps {
  weeks: AdminWeekDetail[];
}

function buildBodyItems(day: AdminWeekDetail["days"][number]) {
  return [
    ...(day.babyMessage ? [`아기의 말: ${day.babyMessage}`] : []),
    ...day.babyDevelopmentItems.map((item) => `아기 발달: ${item}`),
    ...day.motherChangesItems.map((item) => `산모 변화: ${item}`),
  ];
}

function ContentList({
  items,
  emptyLabel,
}: {
  items: string[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <span className="text-muted-foreground">{emptyLabel}</span>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={`${item}-${index}`} className="leading-6">
          {item}
        </li>
      ))}
    </ul>
  );
}

export function AdminDailyContentMatrix({
  weeks,
}: AdminDailyContentMatrixProps) {
  const [columnFilter, setColumnFilter] = useState<DailyContentColumn>("all");
  const [weekFilter, setWeekFilter] = useState("all");

  const rows = useMemo(
    () =>
      weeks
        .filter(
          (week) => weekFilter === "all" || String(week.weekNumber) === weekFilter,
        )
        .flatMap((week) =>
          [...week.days]
            .sort(
              (left, right) =>
                left.dayNumber - right.dayNumber ||
                left.displayOrder - right.displayOrder,
            )
            .map((day) => {
              const checklists = week.sections
                .filter((section) => section.dayNumber === day.dayNumber)
                .sort((left, right) => left.displayOrder - right.displayOrder)
                .map((section) => section.title);
              const questions = week.assets
                .filter((asset) => asset.dayNumber === day.dayNumber)
                .sort((left, right) => left.displayOrder - right.displayOrder)
                .map((asset) => asset.storagePath);

              return {
                weekNumber: week.weekNumber,
                dayNumber: day.dayNumber,
                dayLabel: formatMobileWeekDayLabel(
                  week.weekNumber,
                  day.dayNumber,
                ),
                pregnancyDay: getMobilePregnancyDayCount(
                  week.weekNumber,
                  day.dayNumber,
                ),
                bodyItems: buildBodyItems(day),
                checklists,
                questions,
              };
            }),
        ),
    [weekFilter, weeks],
  );

  const showBody = columnFilter === "all" || columnFilter === "body";
  const showChecklists =
    columnFilter === "all" || columnFilter === "checklists";
  const showQuestions = columnFilter === "all" || columnFilter === "questions";

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>일별 콘텐츠 매트릭스</CardTitle>
            <CardDescription>
              한 행을 모바일 앱의 주차·일자 기준으로 보고,
              본문·체크리스트·질문 컬럼을 골라 확인합니다.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-sm font-medium" htmlFor="daily-week-filter">
              주차
            </label>
            <select
              id="daily-week-filter"
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={weekFilter}
              onChange={(event) => setWeekFilter(event.target.value)}
            >
              <option value="all">전체</option>
              {weeks.map((week) => (
                <option key={week.id} value={week.weekNumber}>
                  {week.weekNumber}주차
                </option>
              ))}
            </select>

            <label className="text-sm font-medium" htmlFor="daily-column-filter">
              컬럼
            </label>
            <select
              id="daily-column-filter"
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={columnFilter}
              onChange={(event) =>
                setColumnFilter(event.target.value as DailyContentColumn)
              }
            >
              {Object.entries(COLUMN_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="outline">{weeks.length}개 주차</Badge>
            <Badge variant="outline">{rows.length}개 일자</Badge>
          </div>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[980px] border-collapse text-sm">
              <thead className="bg-muted text-left">
                <tr>
                  <th className="w-20 border-b px-3 py-3 font-semibold">주차</th>
                  <th className="w-28 border-b px-3 py-3 font-semibold">일자</th>
                  <th className="w-24 border-b px-3 py-3 font-semibold">
                    임신일수
                  </th>
                  {showBody ? (
                    <th className="border-b px-3 py-3 font-semibold">
                      일별 본문
                    </th>
                  ) : null}
                  {showChecklists ? (
                    <th className="border-b px-3 py-3 font-semibold">
                      데일리 체크리스트
                    </th>
                  ) : null}
                  {showQuestions ? (
                    <th className="border-b px-3 py-3 font-semibold">
                      데일리 질문
                    </th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`${row.weekNumber}-${row.dayNumber}`}
                    className="align-top odd:bg-background even:bg-muted/30"
                  >
                    <td className="border-b px-3 py-3 font-medium">
                      {row.weekNumber}주차
                    </td>
                    <td className="border-b px-3 py-3">{row.dayLabel}</td>
                    <td className="border-b px-3 py-3">{row.pregnancyDay}</td>
                    {showBody ? (
                      <td className="max-w-md border-b px-3 py-3">
                        <ContentList
                          items={row.bodyItems}
                          emptyLabel="본문 없음"
                        />
                      </td>
                    ) : null}
                    {showChecklists ? (
                      <td className="max-w-md border-b px-3 py-3">
                        <ContentList
                          items={row.checklists}
                          emptyLabel="체크리스트 없음"
                        />
                      </td>
                    ) : null}
                    {showQuestions ? (
                      <td className="max-w-lg border-b px-3 py-3">
                        <ContentList
                          items={row.questions}
                          emptyLabel="질문 없음"
                        />
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
