"use client";

import { useState } from "react";

import type { AdminDashboardData } from "@gynecology-chatbot/app-core";

import AdminPageFrame from "../../AdminPageFrame";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  MOOD_VARIANT_MOODS,
  MOOD_VARIANT_SCENARIOS,
  type MoodVariantMood,
  type MoodVariantScenario,
} from "@/lib/admin/mood-variants-constants";

export interface MoodVariantItem {
  id: string;
  scenario: string;
  mood: string;
  prompt_suffix: string;
  tone: string | null;
  active: boolean;
  has_snapshot: boolean;
  updated_at: string;
}

interface AdminMoodVariantsSectionProps {
  adminDisplayName: string;
  initialItems: MoodVariantItem[];
  dashboard: AdminDashboardData;
}

interface EditorState {
  scenario: MoodVariantScenario;
  mood: MoodVariantMood;
  id: string | null;
  prompt_suffix: string;
  tone: string;
  active: boolean;
}

function findItem(
  items: MoodVariantItem[],
  scenario: string,
  mood: string,
): MoodVariantItem | null {
  return (
    items.find((item) => item.scenario === scenario && item.mood === mood) ??
    null
  );
}

function truncate(value: string, length = 24): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length)}...`;
}

export default function AdminMoodVariantsSection({
  adminDisplayName,
  initialItems,
  dashboard: _dashboard,
}: AdminMoodVariantsSectionProps) {
  const [items, setItems] = useState<MoodVariantItem[]>(initialItems);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function openCell(scenario: MoodVariantScenario, mood: MoodVariantMood) {
    const existing = findItem(items, scenario, mood);
    setEditor({
      scenario,
      mood,
      id: existing?.id ?? null,
      prompt_suffix: existing?.prompt_suffix ?? "",
      tone: existing?.tone ?? "",
      active: existing ? existing.active : true,
    });
    setMessage(null);
  }

  function closeEditor() {
    setEditor(null);
  }

  async function handleSave() {
    if (!editor) return;
    const trimmedSuffix = editor.prompt_suffix.trim();
    if (!trimmedSuffix) {
      setMessage("프롬프트 보조문은 비워 둘 수 없습니다.");
      return;
    }

    setIsSaving(true);
    try {
      if (editor.id) {
        const response = await fetch(`/api/admin/engine/moods/${editor.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            prompt_suffix: trimmedSuffix,
            tone: editor.tone.trim() || null,
            active: editor.active,
          }),
        });
        if (!response.ok) {
          throw new Error("변주를 저장하지 못했습니다.");
        }
        const { item } = (await response.json()) as { item: MoodVariantItem };
        setItems((prev) =>
          prev.map((row) => (row.id === item.id ? item : row)),
        );
      } else {
        const response = await fetch("/api/admin/engine/moods", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            scenario: editor.scenario,
            mood: editor.mood,
            prompt_suffix: trimmedSuffix,
            tone: editor.tone.trim() || null,
            active: editor.active,
          }),
        });
        if (!response.ok) {
          throw new Error("변주를 생성하지 못했습니다.");
        }
        const { item } = (await response.json()) as { item: MoodVariantItem };
        setItems((prev) => [...prev, item]);
      }
      setMessage("저장되었습니다.");
      setEditor(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!editor?.id) return;
    if (!window.confirm("이 기분별 변주를 삭제하시겠습니까?")) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/engine/moods/${editor.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("삭제하지 못했습니다.");
      }
      setItems((prev) => prev.filter((row) => row.id !== editor.id));
      setMessage("삭제되었습니다.");
      setEditor(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "삭제 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath="/admin/engine/moods"
      title="기분별 변주"
    >
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              대화 엔진 · 기분별 변주
            </p>
            <CardTitle className="text-lg">응답 문구 적용 매트릭스</CardTitle>
            <CardDescription>
              버튼으로 이미 기분이 정해진 경우에는 LLM 감정 분류를 다시 타지
              않고, 해당 기분의 문구를 바로 사용합니다. 자유 입력처럼 기분이
              정해지지 않은 문장만 감정 분류 후 이 매트릭스의 문구를
              참조합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {message ? (
              <Alert role="status">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
            ) : null}

            <Alert>
              <AlertDescription>
                <strong>mood_intake</strong>는 감정 선택 직후 사용자에게 바로
                보여주는 짧은 공감 문장 후보입니다. 한 줄에 한 문장씩 넣으면
                안정된 seed로 하나를 고릅니다. 다른 시나리오는 LLM 응답을 만들
                때 붙는 보조 지침으로 사용됩니다.
              </AlertDescription>
            </Alert>

            <div className="overflow-hidden rounded-md border">
              <Table className="min-w-[720px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">시나리오</TableHead>
                    {MOOD_VARIANT_MOODS.map((mood) => (
                      <TableHead key={mood.value}>{mood.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOOD_VARIANT_SCENARIOS.map((scenario) => (
                    <TableRow key={scenario.value}>
                      <TableCell>
                        <strong>{scenario.label}</strong>
                        <div className="text-xs text-muted-foreground">
                          {scenario.value}
                        </div>
                      </TableCell>
                      {MOOD_VARIANT_MOODS.map((mood) => {
                        const item = findItem(
                          items,
                          scenario.value,
                          mood.value,
                        );
                        return (
                          <TableCell key={`${scenario.value}-${mood.value}`}>
                            <Button
                              type="button"
                              variant="outline"
                              className="h-auto w-full justify-start whitespace-normal text-left"
                              onClick={() =>
                                openCell(scenario.value, mood.value)
                              }
                            >
                              {item ? (
                                <span>
                                  {truncate(item.prompt_suffix)}
                                  {!item.active ? (
                                    <Badge variant="outline" className="ml-2">
                                      비활성
                                    </Badge>
                                  ) : null}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  추가
                                </span>
                              )}
                            </Button>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={Boolean(editor)}
        onOpenChange={(open) => {
          if (!open) closeEditor();
        }}
      >
        <DialogContent>
          {editor ? (
            <>
              <DialogHeader>
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  변주 편집
                </p>
                <DialogTitle>
                  {editor.scenario} · {editor.mood}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prompt-suffix-input">
                    실제 반영 문구
                  </Label>
                  <Textarea
                    id="prompt-suffix-input"
                    rows={8}
                    placeholder={
                      editor.scenario === "mood_intake"
                        ? "예: 울적한 마음을 꺼내줘서 고마워요.\\n예: 슬픈 마음이 올라온 하루였군요."
                        : "예: 사용자의 감정을 먼저 짧게 인정한 뒤, 필요한 정보만 차분하게 안내하세요."
                    }
                    value={editor.prompt_suffix}
                    onChange={(event) =>
                      setEditor({
                        ...editor,
                        prompt_suffix: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tone-input">관리용 메모 (선택)</Label>
                  <Input
                    id="tone-input"
                    value={editor.tone}
                    onChange={(event) =>
                      setEditor({ ...editor, tone: event.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Checkbox
                    id="mood-variant-active"
                    checked={editor.active}
                    onCheckedChange={(checked) =>
                      setEditor({ ...editor, active: checked === true })
                    }
                  />
                  <Label htmlFor="mood-variant-active">
                    활성화하면 다음 응답부터 바로 반영
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeEditor}
                  disabled={isSaving}
                >
                  취소
                </Button>
                {editor.id ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSaving}
                  >
                    삭제
                  </Button>
                ) : null}
                <Button type="button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "저장 중..." : "저장"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </AdminPageFrame>
  );
}
