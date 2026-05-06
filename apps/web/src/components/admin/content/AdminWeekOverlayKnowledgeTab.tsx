"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  AdminKnowledgeItem,
  AdminKnowledgeItemInput,
} from "@gynecology-chatbot/app-core";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import {
  getWeekStatusBadge,
  getWeekStatusLabel,
} from "../admin-dashboard-labels";

interface AdminWeekOverlayKnowledgeTabProps {
  weekNumber: number;
}

interface EditState {
  id: string | null;
  slugSuffix: string;
  title: string;
  body: string;
  imageUrl: string;
  status: AdminKnowledgeItem["status"];
  section: AdminKnowledgeItem["section"];
}

function buildWeekPrefix(weekNumber: number) {
  return `week-${String(weekNumber).padStart(2, "0")}-`;
}

function stripWeekPrefix(slug: string, prefix: string) {
  return slug.startsWith(prefix) ? slug.slice(prefix.length) : slug;
}

const EMPTY_EDIT: EditState = {
  id: null,
  slugSuffix: "",
  title: "",
  body: "",
  imageUrl: "",
  status: "draft",
  section: "knowledge",
};

function statusClassName(status: AdminKnowledgeItem["status"]) {
  const badge = getWeekStatusBadge(status);
  if (badge === "statusSuccess") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (badge === "statusWarning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-border bg-muted text-muted-foreground";
}

export function AdminWeekOverlayKnowledgeTab({
  weekNumber,
}: AdminWeekOverlayKnowledgeTabProps) {
  const weekPrefix = useMemo(() => buildWeekPrefix(weekNumber), [weekNumber]);
  const [items, setItems] = useState<AdminKnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>(EMPTY_EDIT);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/content/knowledge-items");
      const payload = (await response.json()) as {
        error?: string;
        items?: AdminKnowledgeItem[];
        knowledgeItems?: AdminKnowledgeItem[];
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "안내문 목록을 불러오지 못했습니다.");
      }
      const list =
        payload.items ?? payload.knowledgeItems ?? ([] as AdminKnowledgeItem[]);
      setItems(list);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "안내문 목록을 불러오지 못했습니다.",
      );
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const weekItems = useMemo(
    () => items.filter((item) => item.slug.startsWith(weekPrefix)),
    [items, weekPrefix],
  );

  function resetForm() {
    setEdit(EMPTY_EDIT);
  }

  function openForEdit(item: AdminKnowledgeItem) {
    setEdit({
      id: item.id,
      slugSuffix: stripWeekPrefix(item.slug, weekPrefix),
      title: item.title,
      body: item.body,
      imageUrl: item.imageUrl ?? "",
      status: item.status,
      section: item.section,
    });
  }

  function buildInputPayload(): AdminKnowledgeItemInput | null {
    const suffix = edit.slugSuffix.trim();
    const title = edit.title.trim();
    const body = edit.body.trim();
    if (!suffix || !title || !body) {
      setMessage("슬러그, 제목, 본문은 필수 항목입니다.");
      return null;
    }
    return {
      slug: `${weekPrefix}${suffix}`,
      section: edit.section,
      title,
      body,
      imageUrl: edit.imageUrl.trim() || null,
      status: edit.status,
    };
  }

  async function createItem() {
    const input = buildInputPayload();
    if (!input) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/content/knowledge-items", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = (await response.json()) as {
        error?: string;
        item?: AdminKnowledgeItem;
        knowledgeItem?: AdminKnowledgeItem;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "안내문을 생성하지 못했습니다.");
      }
      setMessage("안내문을 생성했습니다.");
      resetForm();
      await loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "안내문을 생성하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function updateItem() {
    if (!edit.id) return;
    const input = buildInputPayload();
    if (!input) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/content/knowledge-items/${encodeURIComponent(edit.id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(input),
        },
      );
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "안내문을 저장하지 못했습니다.");
      }
      setMessage("안내문을 저장했습니다.");
      await loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "안내문을 저장하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteItem() {
    if (!edit.id) return;
    const confirmed =
      typeof window === "undefined"
        ? true
        : window.confirm("이 안내문을 삭제합니다. 계속 진행하시겠습니까?");
    if (!confirmed) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/content/knowledge-items/${encodeURIComponent(edit.id)}`,
        { method: "DELETE" },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "안내문을 삭제하지 못했습니다.");
      }
      setMessage("안내문을 삭제했습니다.");
      resetForm();
      await loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "안내문을 삭제하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleStatus() {
    if (!edit.id) return;
    const nextStatus: AdminKnowledgeItem["status"] =
      edit.status === "published" ? "draft" : "published";
    setEdit((prev) => ({ ...prev, status: nextStatus }));
    const suffix = edit.slugSuffix.trim();
    const title = edit.title.trim();
    const body = edit.body.trim();
    if (!suffix || !title || !body) {
      setMessage(
        "상태를 변경하기 전에 슬러그, 제목, 본문을 먼저 입력해 주세요.",
      );
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/content/knowledge-items/${encodeURIComponent(edit.id)}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            slug: `${weekPrefix}${suffix}`,
            section: edit.section,
            title,
            body,
            imageUrl: edit.imageUrl.trim() || null,
            status: nextStatus,
          } satisfies AdminKnowledgeItemInput),
        },
      );
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(payload.error ?? "상태를 변경하지 못했습니다.");
      }
      setMessage(
        nextStatus === "published"
          ? "게시 상태로 전환했습니다."
          : "초안으로 되돌렸습니다.",
      );
      await loadItems();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "상태를 변경하지 못했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">주차 안내문</h3>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            현재 주차에만 노출되는 안내문을 관리합니다. 슬러그는 자동으로{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              {weekPrefix}
            </code>{" "}
            접두어가 붙습니다.
          </p>
        </div>
        <Button
          variant="outline"
          type="button"
          onClick={resetForm}
          aria-label="안내문 새로 작성"
        >
          새 안내문
        </Button>
      </div>

      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}

      <div className="space-y-2">
        {isLoading ? (
          <p className="rounded-md border border-dashed bg-muted p-4 text-sm text-muted-foreground">
            안내문을 불러오는 중입니다.
          </p>
        ) : weekItems.length === 0 ? (
          <p className="rounded-md border border-dashed bg-muted p-4 text-sm text-muted-foreground">
            이 주차에 등록된 안내문이 없습니다.
          </p>
        ) : (
          weekItems.map((item) => (
            <Button
              key={item.id}
              type="button"
              variant={edit.id === item.id ? "secondary" : "outline"}
              className="h-auto w-full justify-between whitespace-normal px-4 py-3 text-left"
              onClick={() => openForEdit(item)}
            >
              <span>
                <span className="block font-semibold">{item.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {stripWeekPrefix(item.slug, weekPrefix) || item.slug}
                </span>
              </span>
              <Badge variant="outline" className={statusClassName(item.status)}>
                {getWeekStatusLabel(item.status)}
              </Badge>
            </Button>
          ))
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {edit.id ? "안내문 편집" : "새 안내문"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="슬러그 (주차 접두어 제외)">
              <Input
                value={edit.slugSuffix}
                onChange={(event) =>
                  setEdit((prev) => ({
                    ...prev,
                    slugSuffix: event.target.value,
                  }))
                }
                placeholder="예: weight-gain"
              />
            </Field>
            <Field label="섹션">
              <Select
                value={edit.section}
                onValueChange={(value) =>
                  setEdit((prev) => ({
                    ...prev,
                    section: value as AdminKnowledgeItem["section"],
                  }))
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
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="제목">
              <Input
                value={edit.title}
                onChange={(event) =>
                  setEdit((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </Field>
            <Field label="상태">
              <Select
                value={edit.status}
                onValueChange={(value) =>
                  setEdit((prev) => ({
                    ...prev,
                    status: value as AdminKnowledgeItem["status"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">초안</SelectItem>
                  <SelectItem value="published">게시중</SelectItem>
                  <SelectItem value="archived">보관</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="본문">
            <Textarea
              className="min-h-32"
              value={edit.body}
              onChange={(event) =>
                setEdit((prev) => ({ ...prev, body: event.target.value }))
              }
            />
          </Field>

          <Field label="이미지 URL">
            <Input
              value={edit.imageUrl}
              onChange={(event) =>
                setEdit((prev) => ({ ...prev, imageUrl: event.target.value }))
              }
              placeholder="https://example.com/image.png"
            />
          </Field>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isSaving}
              onClick={resetForm}
            >
              비우기
            </Button>
            {edit.id ? (
              <>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isSaving}
                  onClick={toggleStatus}
                >
                  {edit.status === "published" ? "초안으로" : "게시하기"}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isSaving}
                  onClick={deleteItem}
                >
                  삭제
                </Button>
                <Button type="button" disabled={isSaving} onClick={updateItem}>
                  저장
                </Button>
              </>
            ) : (
              <Button type="button" disabled={isSaving} onClick={createItem}>
                생성
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
