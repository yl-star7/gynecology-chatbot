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
  DialogDescription,
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
  MOOD_VARIANT_APP_BUTTON_COLUMNS,
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

export interface MoodVariantFallbackItem {
  scenario: string;
  mood: string;
  prompt_suffix: string;
}

interface AdminMoodVariantsSectionProps {
  adminDisplayName: string;
  initialItems: MoodVariantItem[];
  initialFallbackItems?: MoodVariantFallbackItem[];
  dashboard: AdminDashboardData;
}

interface EditorState {
  scenario: MoodVariantScenario;
  mood: MoodVariantMood;
  moodLabel: string;
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

function findFallbackItem(
  items: MoodVariantFallbackItem[],
  scenario: string,
  mood: string,
): MoodVariantFallbackItem | null {
  return (
    items.find((item) => item.scenario === scenario && item.mood === mood) ??
    null
  );
}

function truncate(value: string, length = 24): string {
  if (value.length <= length) return value;
  return `${value.slice(0, length)}...`;
}

type MoodVariantScenarioOption = (typeof MOOD_VARIANT_SCENARIOS)[number];
type MoodVariantMoodColumn = (typeof MOOD_VARIANT_APP_BUTTON_COLUMNS)[number];

const IMMEDIATE_OUTPUT_SCENARIOS = MOOD_VARIANT_SCENARIOS.filter(
  (scenario) => scenario.value === "mood_intake",
);

const PROMPT_GUIDANCE_SCENARIOS = MOOD_VARIANT_SCENARIOS.filter(
  (scenario) => scenario.value !== "mood_intake",
);

function getScenarioLabel(value: MoodVariantScenario): string {
  return (
    MOOD_VARIANT_SCENARIOS.find((scenario) => scenario.value === value)
      ?.label ?? value
  );
}

function getMoodLabel(value: MoodVariantMood): string {
  const mood = MOOD_VARIANT_MOODS.find((item) => item.value === value);
  return mood?.label ?? value;
}

function MoodColumnHeader({ mood }: { mood: MoodVariantMoodColumn }) {
  return <TableHead key={mood.value}>{mood.label}</TableHead>;
}

function MoodVariantCellButton({
  item,
  fallback,
  onClick,
}: {
  item: MoodVariantItem | null;
  fallback: MoodVariantFallbackItem | null;
  onClick: () => void;
}) {
  return (
    <TableCell>
      <Button
        type="button"
        variant="outline"
        className="h-auto w-full justify-start whitespace-normal text-left"
        onClick={onClick}
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
        ) : fallback ? (
          <span>
            {truncate(fallback.prompt_suffix)}
            <Badge variant="outline" className="ml-2">
              YAML 기본
            </Badge>
          </span>
        ) : (
          <span className="text-muted-foreground">추가</span>
        )}
      </Button>
    </TableCell>
  );
}

function MoodVariantMatrixCard({
  eyebrow,
  title,
  description,
  scenarios,
  items,
  fallbackItems,
  onOpenCell,
}: {
  eyebrow: string;
  title: string;
  description: string;
  scenarios: MoodVariantScenarioOption[];
  items: MoodVariantItem[];
  fallbackItems: MoodVariantFallbackItem[];
  onOpenCell: (
    scenario: MoodVariantScenario,
    mood: MoodVariantMood,
    moodLabel: string,
  ) => void;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {eyebrow}
        </p>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md border">
          <Table className="min-w-[720px] table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-40">시나리오</TableHead>
                {MOOD_VARIANT_APP_BUTTON_COLUMNS.map((mood) => (
                  <MoodColumnHeader key={mood.id} mood={mood} />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {scenarios.map((scenario) => (
                <TableRow key={scenario.value}>
                  <TableCell>
                    <strong>{scenario.label}</strong>
                    <div className="text-xs text-muted-foreground">
                      {scenario.value}
                    </div>
                  </TableCell>
                  {MOOD_VARIANT_APP_BUTTON_COLUMNS.map((mood) => {
                    const item = findItem(items, scenario.value, mood.value);
                    const fallback = item
                      ? null
                      : findFallbackItem(
                          fallbackItems,
                          scenario.value,
                          mood.value,
                        );
                    return (
                      <MoodVariantCellButton
                        key={`${scenario.value}-${mood.id}`}
                        item={item}
                        fallback={fallback}
                        onClick={() =>
                          onOpenCell(scenario.value, mood.value, mood.label)
                        }
                      />
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminMoodVariantsSection({
  adminDisplayName,
  initialItems,
  initialFallbackItems = [],
  dashboard: _dashboard,
}: AdminMoodVariantsSectionProps) {
  const [items, setItems] = useState<MoodVariantItem[]>(initialItems);
  const [fallbackItems] =
    useState<MoodVariantFallbackItem[]>(initialFallbackItems);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function openCell(
    scenario: MoodVariantScenario,
    mood: MoodVariantMood,
    moodLabel = getMoodLabel(mood),
  ) {
    const existing = findItem(items, scenario, mood);
    const fallback = existing
      ? null
      : findFallbackItem(fallbackItems, scenario, mood);
    setEditor({
      scenario,
      mood,
      moodLabel,
      id: existing?.id ?? null,
      prompt_suffix: existing?.prompt_suffix ?? fallback?.prompt_suffix ?? "",
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
            <CardTitle className="text-lg">앱과 같은 기분 이름</CardTitle>
            <CardDescription>
              표의 기분 이름은 사용자가 앱에서 보는 버튼 이름 그대로 표시합니다.
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
                <strong>앱에 바로 보이는 문구</strong>는 사용자가
                버튼을 누른 직후 바로 나가고,{" "}
                <strong>프롬프트에 붙는 보조 지침</strong>은 모델 답변을
                만들 때만 참고됩니다.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <MoodVariantMatrixCard
          eyebrow="바로 반영"
          title="앱에 바로 보이는 문구"
          description="감정 버튼을 누른 직후 사용자에게 표시되는 짧은 공감 문장입니다. 한 줄에 한 문장씩 넣으면 안정된 seed로 하나를 고릅니다."
          scenarios={IMMEDIATE_OUTPUT_SCENARIOS}
          items={items}
          fallbackItems={fallbackItems}
          onOpenCell={openCell}
        />

        <MoodVariantMatrixCard
          eyebrow="수정 주의"
          title="프롬프트에 붙는 보조 지침"
          description="아래 시나리오는 앱에 문구가 그대로 찍히는 영역이 아니라, 모델 응답을 만들 때 감정 맞춤 안내로 붙는 지침입니다. 문장 스타일이나 정책을 바꾸면 실제 답변 톤이 달라질 수 있습니다."
          scenarios={PROMPT_GUIDANCE_SCENARIOS}
          items={items}
          fallbackItems={fallbackItems}
          onOpenCell={openCell}
        />
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
                  {getScenarioLabel(editor.scenario)} · {editor.moodLabel}
                </DialogTitle>
                <DialogDescription>
                  {editor.scenario === "mood_intake"
                    ? "저장하면 감정 버튼을 누른 직후 앱에 바로 보이는 문구로 사용됩니다."
                    : "저장하면 모델 답변을 만들 때 참고하는 보조 지침으로 사용됩니다."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prompt-suffix-input">
                    {editor.scenario === "mood_intake"
                      ? "앱에 바로 보이는 문구"
                      : "프롬프트 보조 지침"}
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
