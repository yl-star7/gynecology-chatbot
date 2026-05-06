"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AdminFileUpload } from "./ui";

type MoodTag = "calm" | "joyful" | "anxious" | "tired" | "sad";
type MoodFilter = MoodTag | "all" | "null";

const MOOD_OPTIONS: Array<{ value: MoodTag; label: string }> = [
  { value: "calm", label: "차분" },
  { value: "joyful", label: "기쁨" },
  { value: "anxious", label: "걱정" },
  { value: "tired", label: "피곤" },
  { value: "sad", label: "슬픔" },
];

const MOOD_LABEL: Record<MoodTag, string> = Object.fromEntries(
  MOOD_OPTIONS.map((option) => [option.value, option.label]),
) as Record<MoodTag, string>;

type CharacterImageTone = "neutral" | MoodTag;
const CHARACTER_IMAGE_TONES: Array<{ key: CharacterImageTone; label: string }> =
  [
    { key: "neutral", label: "기본" },
    { key: "calm", label: "차분" },
    { key: "joyful", label: "기쁨" },
    { key: "anxious", label: "걱정" },
    { key: "tired", label: "피곤" },
    { key: "sad", label: "슬픔" },
  ];

interface BabyComfortRow {
  id: string;
  text: string;
  tag_week: number | null;
  tag_mood: string | null;
  weight: number;
  active: boolean;
  has_snapshot: boolean;
  updated_at: string;
}

interface HomeCopyRow {
  id: string;
  slot: "hero_bubble" | "daily_note" | "encouragement_quote";
  variant: string | null;
  title: string;
  body: string;
  status: "draft" | "published";
  displayOrder: number;
  updatedAt: string;
}

interface CharacterImagesData {
  version: string;
  images: Record<CharacterImageTone, string>;
}

type TabKey = "home-copy" | "baby-comfort" | "character";

export function AdminPoolsSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("baby-comfort");

  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">공통 풀</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          주차와 무관하게 랜덤으로 노출되는 문구와 이미지 풀을 관리합니다.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TabKey)}
      >
        <TabsList>
          <TabsTrigger value="home-copy">홈 위안 풀</TabsTrigger>
          <TabsTrigger value="baby-comfort">아기 위안 풀</TabsTrigger>
          <TabsTrigger value="character">캐릭터 이미지</TabsTrigger>
        </TabsList>

        <TabsContent value="home-copy" className="mt-4">
          <HomeCopyPoolPanel />
        </TabsContent>
        <TabsContent value="baby-comfort" className="mt-4">
          <BabyComfortPoolPanel />
        </TabsContent>
        <TabsContent value="character" className="mt-4">
          <CharacterImagePoolPanel />
        </TabsContent>
      </Tabs>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Home Copy Pool
// ---------------------------------------------------------------------------

function HomeCopyPoolPanel() {
  const [items, setItems] = useState<HomeCopyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [draft, setDraft] = useState<{
    id: string | null;
    slot: HomeCopyRow["slot"];
    variant: string;
    title: string;
    body: string;
    status: HomeCopyRow["status"];
    displayOrder: string;
  }>({
    id: null,
    slot: "hero_bubble",
    variant: "",
    title: "",
    body: "",
    status: "published",
    displayOrder: "",
  });
  const [saving, setSaving] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/content/home-copy");
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data = (await res.json()) as { homeCopyItems?: HomeCopyRow[] };
      setItems(data.homeCopyItems ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "홈 위안 풀을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  function resetDraft() {
    setDraft({
      id: null,
      slot: "hero_bubble",
      variant: "",
      title: "",
      body: "",
      status: "published",
      displayOrder: "",
    });
  }

  function openCreate() {
    resetDraft();
    setDrawerOpen(true);
  }

  function openEdit(item: HomeCopyRow) {
    setDraft({
      id: item.id,
      slot: item.slot,
      variant: item.variant ?? "",
      title: item.title,
      body: item.body,
      status: item.status,
      displayOrder: String(item.displayOrder),
    });
    setDrawerOpen(true);
  }

  async function submit() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const payload = {
        slot: draft.slot,
        variant: draft.variant.trim() || null,
        title: draft.title.trim(),
        body: draft.body.trim(),
        status: draft.status,
        displayOrder: draft.displayOrder
          ? Number.parseInt(draft.displayOrder, 10)
          : undefined,
      };
      if (!payload.title || !payload.body) {
        throw new Error("제목과 본문을 입력해주세요.");
      }
      const url = draft.id
        ? `/api/admin/content/home-copy/${draft.id}`
        : "/api/admin/content/home-copy";
      const res = await fetch(url, {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      setMessage(draft.id ? "문구를 저장했습니다." : "문구를 추가했습니다.");
      resetDraft();
      setDrawerOpen(false);
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("정말 이 문구를 삭제하시겠습니까?")) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/content/home-copy/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      setMessage("문구를 삭제했습니다.");
      if (draft.id === id) {
        resetDraft();
        setDrawerOpen(false);
      }
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">홈 위안 풀</h3>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" />새 문구
        </Button>
      </div>

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>제목</TableHead>
                <TableHead>위치</TableHead>
                <TableHead>대상</TableHead>
                <TableHead>순서</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="w-0"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-8 text-center text-muted-foreground"
                  >
                    등록된 문구가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.title}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {item.body}
                      </div>
                    </TableCell>
                    <TableCell>{item.slot}</TableCell>
                    <TableCell>{item.variant ?? "전체"}</TableCell>
                    <TableCell>{item.displayOrder}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          item.status === "published" ? "default" : "secondary"
                        }
                      >
                        {item.status === "published" ? "게시" : "초안"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="flex w-full flex-col gap-4 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{draft.id ? "문구 편집" : "새 문구"}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto">
            <div className="space-y-1">
              <Label>위치</Label>
              <Select
                value={draft.slot}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    slot: value as HomeCopyRow["slot"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hero_bubble">아기 말풍선</SelectItem>
                  <SelectItem value="daily_note">오늘의 한마디</SelectItem>
                  <SelectItem value="encouragement_quote">응원 문구</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="homecopy-variant">대상</Label>
              <Input
                id="homecopy-variant"
                value={draft.variant}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, variant: event.target.value }))
                }
                placeholder="default, unknown"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="homecopy-title">제목</Label>
              <Input
                id="homecopy-title"
                value={draft.title}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, title: event.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="homecopy-body">본문</Label>
              <Textarea
                id="homecopy-body"
                rows={5}
                value={draft.body}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, body: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="homecopy-order">순서</Label>
                <Input
                  id="homecopy-order"
                  type="number"
                  value={draft.displayOrder}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      displayOrder: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>상태</Label>
                <Select
                  value={draft.status}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      status: value as HomeCopyRow["status"],
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">초안</SelectItem>
                    <SelectItem value="published">게시</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <SheetFooter className="gap-2">
            {draft.id ? (
              <Button
                type="button"
                variant="destructive"
                disabled={saving}
                onClick={() => void remove(draft.id as string)}
              >
                <Trash2 className="mr-1 h-4 w-4" />
                삭제
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={saving}
              onClick={() => void submit()}
            >
              {draft.id ? "문구 저장" : "문구 추가"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Baby Comfort Pool
// ---------------------------------------------------------------------------

function BabyComfortPoolPanel() {
  const [rows, setRows] = useState<BabyComfortRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState(true);
  const [filterWeek, setFilterWeek] = useState<string>("");
  const [filterMood, setFilterMood] = useState<MoodFilter>("all");
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [draft, setDraft] = useState<{
    id: string | null;
    text: string;
    tag_week: string;
    tag_mood: MoodTag | "";
    weight: string;
    active: boolean;
  }>({
    id: null,
    text: "",
    tag_week: "",
    tag_mood: "",
    weight: "1",
    active: true,
  });

  const loadRows = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterActive) params.set("active", "true");
      if (filterWeek) params.set("week", filterWeek);
      if (filterMood !== "all" && filterMood !== "null")
        params.set("mood", filterMood);
      const res = await fetch(
        `/api/admin/pools/baby-comfort?${params.toString()}`,
      );
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data = (await res.json()) as { items: BabyComfortRow[] };
      const items = data.items ?? [];
      setRows(
        filterMood === "null"
          ? items.filter((row) => row.tag_mood === null)
          : items,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "아기 위안 풀을 불러오지 못했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }, [filterActive, filterMood, filterWeek]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  function resetDraft() {
    setDraft({
      id: null,
      text: "",
      tag_week: "",
      tag_mood: "",
      weight: "1",
      active: true,
    });
  }

  function openCreate(prefill?: {
    tag_week?: string;
    tag_mood?: MoodTag | "";
  }) {
    resetDraft();
    if (prefill) {
      setDraft((prev) => ({
        ...prev,
        tag_week: prefill.tag_week ?? prev.tag_week,
        tag_mood: prefill.tag_mood ?? prev.tag_mood,
      }));
    }
    setDrawerOpen(true);
  }

  function openEdit(row: BabyComfortRow) {
    setDraft({
      id: row.id,
      text: row.text,
      tag_week: row.tag_week !== null ? String(row.tag_week) : "",
      tag_mood: (row.tag_mood as MoodTag | null) ?? "",
      weight: String(row.weight),
      active: row.active,
    });
    setDrawerOpen(true);
  }

  async function submit() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const text = draft.text.trim();
      if (!text) throw new Error("문구 본문을 입력해주세요.");
      const weekNumber = draft.tag_week
        ? Number.parseInt(draft.tag_week, 10)
        : null;
      if (
        weekNumber !== null &&
        (!Number.isFinite(weekNumber) || weekNumber < 1 || weekNumber > 40)
      ) {
        throw new Error("주차는 1에서 40 사이여야 합니다.");
      }
      const payload = {
        text,
        tag_week: weekNumber,
        tag_mood: draft.tag_mood || null,
        weight: Number.parseInt(draft.weight || "1", 10),
        active: draft.active,
      };
      const url = draft.id
        ? `/api/admin/pools/baby-comfort/${draft.id}`
        : "/api/admin/pools/baby-comfort";
      const res = await fetch(url, {
        method: draft.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorBody = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errorBody.error ?? `서버 오류 (${res.status})`);
      }
      setMessage(draft.id ? "문구를 저장했습니다." : "문구를 추가했습니다.");
      resetDraft();
      setDrawerOpen(false);
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: BabyComfortRow) {
    setError(null);
    try {
      const res = await fetch(`/api/admin/pools/baby-comfort/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "변경에 실패했습니다.");
    }
  }

  async function remove(row: BabyComfortRow) {
    if (!window.confirm("정말 이 문구를 삭제하시겠습니까?")) return;
    setError(null);
    try {
      const res = await fetch(`/api/admin/pools/baby-comfort/${row.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      setMessage("문구를 삭제했습니다.");
      if (draft.id === row.id) {
        resetDraft();
        setDrawerOpen(false);
      }
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  }

  async function rollback(row: BabyComfortRow) {
    if (!row.has_snapshot) return;
    if (!window.confirm("직전 저장 상태로 되돌리시겠습니까?")) return;
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/rollback/baby-comfort-pool/${row.id}`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      setMessage("이전 상태로 되돌렸습니다.");
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "롤백에 실패했습니다.");
    }
  }

  // Mood variation matrix: rows = weeks (1..40 when filtered, else "전체"), cols = mood+null
  const matrixWeek = filterWeek ? Number.parseInt(filterWeek, 10) : null;
  const matrixMoodCols: Array<{ key: MoodTag | "null"; label: string }> = [
    { key: "null", label: "공통" },
    ...MOOD_OPTIONS.map((option) => ({
      key: option.value,
      label: option.label,
    })),
  ];

  function countFor(week: number | null, mood: MoodTag | "null") {
    return rows.filter((row) => {
      const weekMatch = week === null ? true : row.tag_week === week;
      const moodMatch =
        mood === "null" ? row.tag_mood === null : row.tag_mood === mood;
      return weekMatch && moodMatch;
    }).length;
  }

  return (
    <div className="space-y-4">
      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="baby-active"
            checked={filterActive}
            onCheckedChange={(value) => setFilterActive(Boolean(value))}
          />
          <Label htmlFor="baby-active">활성만 보기</Label>
        </div>
        <div className="space-y-1">
          <Label htmlFor="baby-week">주차 필터</Label>
          <Input
            id="baby-week"
            type="number"
            min={1}
            max={40}
            value={filterWeek}
            onChange={(event) => setFilterWeek(event.target.value)}
            placeholder="예: 20"
            className="w-28"
          />
        </div>
        <div className="space-y-1">
          <Label>감정 필터</Label>
          <Select
            value={filterMood}
            onValueChange={(value) => setFilterMood(value as MoodFilter)}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="null">감정 없음</SelectItem>
              {MOOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="ml-auto">
          <Button type="button" size="sm" onClick={() => openCreate()}>
            <Plus className="mr-1 h-4 w-4" />새 문구
          </Button>
        </div>
      </div>

      {/* Mood variation matrix */}
      <div className="overflow-hidden rounded-md border">
        <div className="border-b bg-muted px-3 py-2 text-sm font-medium">
          기분별 변주 매트릭스
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">
                {matrixWeek !== null ? `${matrixWeek}주` : "전체"}
              </TableHead>
              {matrixMoodCols.map((col) => (
                <TableHead key={col.key} className="text-center">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">개수</TableCell>
              {matrixMoodCols.map((col) => {
                const count = countFor(matrixWeek, col.key);
                return (
                  <TableCell key={col.key} className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-sm text-muted-foreground">
                        {count}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          openCreate({
                            tag_week:
                              matrixWeek !== null ? String(matrixWeek) : "",
                            tag_mood: col.key === "null" ? "" : col.key,
                          })
                        }
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        추가
                      </Button>
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <h3 className="mb-2 text-base font-semibold">아기 위안 풀</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>문구</TableHead>
                  <TableHead>주차</TableHead>
                  <TableHead>감정</TableHead>
                  <TableHead>가중치</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead className="w-0"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      조건에 맞는 문구가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="p-0">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto w-full justify-start rounded-none px-2 py-3 text-left"
                          onClick={() => openEdit(row)}
                        >
                          <div>
                            <div className="font-medium">{row.text}</div>
                            <div className="text-xs text-muted-foreground">
                              수정{" "}
                              {new Date(row.updated_at).toLocaleString("ko-KR")}
                            </div>
                          </div>
                        </Button>
                      </TableCell>
                      <TableCell>{row.tag_week ?? "-"}</TableCell>
                      <TableCell>
                        {row.tag_mood
                          ? (MOOD_LABEL[row.tag_mood as MoodTag] ??
                            row.tag_mood)
                          : "-"}
                      </TableCell>
                      <TableCell>{row.weight}</TableCell>
                      <TableCell>
                        <Badge variant={row.active ? "default" : "outline"}>
                          {row.active ? "활성" : "비활성"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => void toggleActive(row)}
                          >
                            {row.active ? "비활성화" : "활성화"}
                          </Button>
                          {row.has_snapshot ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => void rollback(row)}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              되돌리기
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => void remove(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="flex w-full flex-col gap-4 sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {draft.id ? "아기 위안 문구 편집" : "새 아기 위안 문구"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto">
            <div className="space-y-1">
              <Label htmlFor="baby-text">문구 본문</Label>
              <Textarea
                id="baby-text"
                rows={4}
                value={draft.text}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, text: event.target.value }))
                }
                placeholder="아가는 오늘도 엄마 목소리를 듣고 있어요."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="baby-tag-week">주차 태그 (1-40)</Label>
                <Input
                  id="baby-tag-week"
                  type="number"
                  min={1}
                  max={40}
                  value={draft.tag_week}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      tag_week: event.target.value,
                    }))
                  }
                  placeholder="전체"
                />
              </div>
              <div className="space-y-1">
                <Label>감정 태그</Label>
                <Select
                  value={draft.tag_mood || "__none"}
                  onValueChange={(value) =>
                    setDraft((prev) => ({
                      ...prev,
                      tag_mood: value === "__none" ? "" : (value as MoodTag),
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none">감정 없음</SelectItem>
                    {MOOD_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="baby-weight">가중치</Label>
                <Input
                  id="baby-weight"
                  type="number"
                  min={0}
                  value={draft.weight}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      weight: event.target.value,
                    }))
                  }
                />
              </div>
              <div className="flex items-end gap-2">
                <Checkbox
                  id="baby-active-draft"
                  checked={draft.active}
                  onCheckedChange={(value) =>
                    setDraft((prev) => ({ ...prev, active: Boolean(value) }))
                  }
                />
                <Label htmlFor="baby-active-draft">활성</Label>
              </div>
            </div>
          </div>
          <SheetFooter className="gap-2">
            <Button
              type="button"
              disabled={saving}
              onClick={() => void submit()}
            >
              {draft.id ? "문구 저장" : "문구 추가"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Character Image Pool
// ---------------------------------------------------------------------------

const DEFAULT_CHARACTER_IMAGES: CharacterImagesData = {
  version: "gcs-penguin-nurse-v1",
  images: Object.fromEntries(
    CHARACTER_IMAGE_TONES.map(({ key }) => [
      key,
      `https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/${key}.png`,
    ]),
  ) as Record<CharacterImageTone, string>,
};

function CharacterImagePoolPanel() {
  const [images, setImages] = useState<CharacterImagesData>(
    DEFAULT_CHARACTER_IMAGES,
  );
  const [loading, setLoading] = useState(true);
  const [savingTone, setSavingTone] = useState<CharacterImageTone | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/branding/character-images");
        if (res.ok) {
          const data = (await res.json()) as CharacterImagesData;
          if (!cancelled) setImages(data);
        }
      } catch {
        // fall back to defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function upload(tone: CharacterImageTone, file: File) {
    setSavingTone(tone);
    setMessage(null);
    setError(null);
    try {
      const objectPath = `assets/penguin-nurse/app/${tone}.png`;
      const formData = new FormData();
      formData.set("file", file);
      formData.set("bucketId", "pregnancy-content");
      formData.set("mediaScope", "asset");
      formData.set("objectPath", objectPath);

      const uploadRes = await fetch("/api/admin/content/media/upload", {
        method: "POST",
        body: formData,
      });
      const uploadPayload = (await uploadRes.json()) as {
        error?: string;
        bucketId?: string;
        objectPath?: string;
        signedUrl?: string;
        contentType?: string;
      };
      if (
        !uploadRes.ok ||
        !uploadPayload.bucketId ||
        !uploadPayload.objectPath ||
        !uploadPayload.signedUrl
      ) {
        throw new Error(
          uploadPayload.error ?? "캐릭터 이미지 업로드에 실패했습니다.",
        );
      }
      const signedUploadResponse = await fetch(uploadPayload.signedUrl, {
        method: "PUT",
        headers: {
          "content-type": uploadPayload.contentType ?? file.type,
          "x-upsert": "true",
        },
        body: file,
      });
      if (!signedUploadResponse.ok) {
        throw new Error("signed URL 업로드에 실패했습니다.");
      }

      const nextImages = {
        ...images.images,
        [tone]: `https://storage.googleapis.com/${uploadPayload.bucketId}/${uploadPayload.objectPath}`,
      };
      const saveRes = await fetch("/api/admin/branding/character-images", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: nextImages }),
      });
      const savePayload = (await saveRes.json()) as {
        error?: string;
        config?: CharacterImagesData;
      };
      if (!saveRes.ok || !savePayload.config) {
        throw new Error(
          savePayload.error ?? "캐릭터 이미지 저장에 실패했습니다.",
        );
      }
      setImages(savePayload.config);
      setMessage("캐릭터 이미지 캐시를 갱신했습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSavingTone(null);
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-base font-semibold">캐릭터 이미지</h3>

      {message ? (
        <Alert>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {CHARACTER_IMAGE_TONES.map(({ key, label }) => (
            <div key={key} className="rounded-md border bg-card p-3 space-y-2">
              <Label htmlFor={`character-${key}`}>{label} 이미지</Label>
              <AdminFileUpload
                id={`character-${key}`}
                label="파일 선택"
                accept="image/png,image/jpeg,image/webp"
                disabled={savingTone === key}
                onFileSelect={(file) => {
                  void upload(key, file);
                }}
              />
              <p className="truncate text-xs text-muted-foreground">
                {images.images[key]}
              </p>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        앱은 시작할 때 version을 비교하고 바뀐 경우에만 이 캐시를 다시 받습니다.
        현재 version: {images.version}
      </p>
    </div>
  );
}
