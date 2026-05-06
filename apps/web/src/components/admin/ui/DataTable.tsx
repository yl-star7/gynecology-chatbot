"use client";

import type { ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/components/ui/cn";

import { AdminEmptyState } from "./AdminPrimitives";

export interface DataTableColumn<T> {
  key: string;
  label: string;
  /** Legacy hint retained for callers. shadcn table layout now owns sizing. */
  width?: string;
  /** 행 데이터를 받아 셀 내용을 반환. 반환값이 `null|undefined`면 빈 셀. */
  render: (row: T) => ReactNode;
  /** 특정 정렬 필요 시 사용 (예: 숫자 우측 정렬). */
  align?: "start" | "center" | "end";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  selectedRowKey?: string | null;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  /** 행이 버튼이 아닌 단순 표시(예: 이벤트 로그)인 경우. 기본 false. */
  readOnly?: boolean;
}

function alignClass(align: DataTableColumn<unknown>["align"]): string {
  if (align === "center") return "text-center";
  if (align === "end") return "text-right";
  return "text-left";
}

export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  selectedRowKey,
  onRowClick,
  emptyMessage = "조건에 맞는 항목이 없습니다.",
  readOnly = false,
}: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-md border bg-card">
      {rows.length === 0 ? (
        <AdminEmptyState className="m-4">{emptyMessage}</AdminEmptyState>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className={alignClass(col.align)}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const key = getRowKey(row);
              const isSelected = selectedRowKey === key;
              return (
                <TableRow
                  key={key}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(!readOnly && onRowClick && "cursor-pointer")}
                  onClick={() => {
                    if (!readOnly && onRowClick) onRowClick(row);
                  }}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={alignClass(col.align)}>
                      {col.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
