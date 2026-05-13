"use client";

import { useState, type ReactNode } from "react";
import {
  Brain,
  CalendarClock,
  Database,
  FileText,
  MessageCircle,
  Plus,
  Sparkles,
} from "lucide-react";

import AdminPageFrame from "@/components/AdminPageFrame";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { MoodVariantMood } from "@/lib/admin/mood-variants-constants";
import type { MoodVariantItem } from "./AdminMoodVariantsSection";

type MoodChoice = {
  id: string;
  label: string;
  moodKey: MoodVariantMood;
  tone: string;
  userMessage: string;
  assistantMessage: string;
};

type FlowStepId =
  | "app_buttons"
  | "mood_copy"
  | "date_basis"
  | "reference_pack"
  | "answer_prompt";

type FlowStep = {
  id: FlowStepId;
  label: string;
  title: string;
  body: string;
  promptLabel: string;
  promptText: string;
  references: string[];
};

const MOOD_CHOICES: MoodChoice[] = [
  {
    id: "direct",
    label: "직접 말하고 싶어요",
    moodKey: "calm",
    tone: "직접 입력",
    userMessage: "직접 말하고 싶어요",
    assistantMessage: "나눠주신 감정 잘 들었어요. 천천히 이야기해도 괜찮아요.",
  },
  {
    id: "joyful",
    label: "좋아요",
    moodKey: "joyful",
    tone: "밝음",
    userMessage: "좋아요",
    assistantMessage:
      "오늘 마음이 밝아서 다행이에요. 이 기분을 편하게 이어가봐요.",
  },
  {
    id: "gloomy",
    label: "울적해요",
    moodKey: "sad",
    tone: "울적함",
    userMessage: "울적해요",
    assistantMessage:
      "마음이 많이 가라앉은 느낌이네요. 천천히 같이 살펴볼게요.",
  },
  {
    id: "sad",
    label: "슬퍼요",
    moodKey: "sad",
    tone: "슬픔",
    userMessage: "슬퍼요",
    assistantMessage:
      "슬픈 마음이 크게 올라온 날이네요. 지금 느끼는 걸 조금씩 말해도 괜찮아요.",
  },
  {
    id: "angry",
    label: "짜증나요",
    moodKey: "anxious",
    tone: "짜증",
    userMessage: "짜증나요",
    assistantMessage:
      "많이 답답하고 예민해진 상황이었나 봐요. 오늘은 부담을 조금 덜어내도 괜찮아요.",
  },
];

const INITIAL_FLOW_STEPS: FlowStep[] = [
  {
    id: "app_buttons",
    label: "앱 버튼",
    title: "감정 선택",
    body: "좋아요 · 울적해요 · 슬퍼요 · 짜증나요",
    promptLabel: "버튼 문구",
    promptText: "직접 말하고 싶어요\n좋아요\n울적해요\n슬퍼요\n짜증나요",
    references: ["앱 첫 질문", "기분 선택 버튼"],
  },
  {
    id: "mood_copy",
    label: "문구",
    title: "기분 문구",
    body: "앱 말풍선",
    promptLabel: "앱 말풍선",
    promptText: "선택한 기분에 맞춰 바로 나가는 문구",
    references: ["기분별 변주", "앱 미리보기"],
  },
  {
    id: "date_basis",
    label: "기준일",
    title: "주차 계산",
    body: "예정일 / 보정일",
    promptLabel: "계산 기준",
    promptText: "예정일과 보정일을 기준으로 현재 주차를 계산합니다.",
    references: ["사용자 상세", "운영 화면"],
  },
  {
    id: "reference_pack",
    label: "자료",
    title: "참조 자료",
    body: "주차 + 사전",
    promptLabel: "참조 규칙",
    promptText: "현재 주차와 질문 의도에 맞는 자료만 붙입니다.",
    references: ["주차 콘텐츠", "사전 자료", "공통 풀"],
  },
  {
    id: "answer_prompt",
    label: "답변",
    title: "답변 지침",
    body: "프롬프트 + 자료",
    promptLabel: "답변 프롬프트",
    promptText: "앱 문구와 참조 자료를 바탕으로 최종 답변을 만듭니다.",
    references: ["기본 답변 톤", "참조 자료", "안전 안내"],
  },
];

interface AdminEngineIntegratedViewProps {
  adminDisplayName: string;
  initialMoodItems?: MoodVariantItem[];
}

export function AdminEngineIntegratedView({
  adminDisplayName,
  initialMoodItems = [],
}: AdminEngineIntegratedViewProps) {
  const [moodItems, setMoodItems] =
    useState<MoodVariantItem[]>(initialMoodItems);
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>(INITIAL_FLOW_STEPS);
  const [selectedChoiceId, setSelectedChoiceId] = useState("joyful");
  const [editingStepId, setEditingStepId] = useState<FlowStepId | null>(null);
  const [draftMoodText, setDraftMoodText] = useState("");
  const [draftPromptText, setDraftPromptText] = useState("");
  const [draftReferences, setDraftReferences] = useState<string[]>([]);
  const [newReference, setNewReference] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const selected =
    MOOD_CHOICES.find((choice) => choice.id === selectedChoiceId) ??
    MOOD_CHOICES[1];
  const selectedMoodText = getMoodText(selected, moodItems);
  const editingStep = editingStepId
    ? (flowSteps.find((step) => step.id === editingStepId) ?? null)
    : null;

  function openStepEditor(stepId: FlowStepId) {
    const step = flowSteps.find((item) => item.id === stepId);
    if (!step) return;
    setEditingStepId(stepId);
    setDraftPromptText(step.promptText);
    setDraftReferences(step.references);
    setNewReference("");
    setDraftMoodText(
      stepId === "mood_copy"
        ? (getMoodItem(selected, moodItems)?.prompt_suffix ??
            selected.assistantMessage)
        : "",
    );
    setMessage(null);
  }

  function closeEditor() {
    if (isSaving) return;
    setEditingStepId(null);
  }

  function addReference() {
    const value = newReference.trim();
    if (!value) return;
    setDraftReferences((prev) => [...prev, value]);
    setNewReference("");
  }

  function removeReference(index: number) {
    setDraftReferences((prev) =>
      prev.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  async function applyEditor() {
    if (!editingStep) return;
    if (editingStep.id === "mood_copy") {
      await saveMoodText();
      return;
    }

    setFlowSteps((prev) =>
      prev.map((step) =>
        step.id === editingStep.id
          ? {
              ...step,
              promptText: draftPromptText.trim() || step.promptText,
              references: draftReferences
                .map((item) => item.trim())
                .filter(Boolean),
            }
          : step,
      ),
    );
    setMessage("화면에 반영되었습니다.");
    setEditingStepId(null);
  }

  async function saveMoodText() {
    const currentItem = getMoodItem(selected, moodItems);
    const trimmed = draftMoodText.trim();
    if (!trimmed) {
      setMessage("문구를 입력해주세요.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(
        currentItem
          ? `/api/admin/engine/moods/${currentItem.id}`
          : "/api/admin/engine/moods",
        {
          method: currentItem ? "PATCH" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            currentItem
              ? { prompt_suffix: trimmed, tone: currentItem.tone, active: true }
              : {
                  scenario: "mood_intake",
                  mood: selected.moodKey,
                  prompt_suffix: trimmed,
                  tone: null,
                  active: true,
                },
          ),
        },
      );
      if (!response.ok) {
        throw new Error("저장하지 못했습니다.");
      }
      const { item } = (await response.json()) as { item: MoodVariantItem };
      setMoodItems((prev) => {
        const exists = prev.some((row) => row.id === item.id);
        if (exists) return prev.map((row) => (row.id === item.id ? item : row));
        return [...prev, item];
      });
      setFlowSteps((prev) =>
        prev.map((step) =>
          step.id === "mood_copy"
            ? {
                ...step,
                promptText:
                  draftPromptText.trim() ||
                  "선택한 기분에 맞춰 바로 나가는 문구",
                references: draftReferences
                  .map((ref) => ref.trim())
                  .filter(Boolean),
              }
            : step,
        ),
      );
      setEditingStepId(null);
      setMessage("저장되었습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "저장 중 오류가 발생했습니다.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AdminPageFrame
      adminDisplayName={adminDisplayName}
      currentPath="/admin/engine/flow"
      title="대화 엔진 통합 뷰"
    >
      <div className="space-y-4">
        <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">
                대화 엔진
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                통합 흐름
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {flowSteps.map((step) => (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => openStepEditor(step.id)}
                  className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground transition hover:border-slate-400"
                >
                  {step.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <main className="space-y-4">
            <FlowMap
              flowSteps={flowSteps}
              selected={selected}
              onOpenStepEditor={openStepEditor}
            />
            <SourceTrace
              flowSteps={flowSteps}
              selected={selected}
              onOpenStepEditor={openStepEditor}
            />
          </main>
          <aside className="space-y-4">
            <ConversationPreview
              selected={selected}
              selectedMoodText={selectedMoodText}
              onSelect={setSelectedChoiceId}
              onOpenMoodEditor={() => openStepEditor("mood_copy")}
            />
            <QuickEditPanel
              flowSteps={flowSteps}
              onOpenStepEditor={openStepEditor}
            />
          </aside>
        </div>
        {message ? (
          <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
            {message}
          </p>
        ) : null}
      </div>
      <EngineEditDialog
        editingStep={editingStep}
        draftMoodText={draftMoodText}
        draftPromptText={draftPromptText}
        draftReferences={draftReferences}
        isSaving={isSaving}
        newReference={newReference}
        selectedChoice={selected}
        onAddReference={addReference}
        onClose={closeEditor}
        onDraftMoodTextChange={setDraftMoodText}
        onDraftPromptTextChange={setDraftPromptText}
        onNewReferenceChange={setNewReference}
        onRemoveReference={removeReference}
        onApply={applyEditor}
      />
    </AdminPageFrame>
  );
}

function FlowMap({
  flowSteps,
  selected,
  onOpenStepEditor,
}: {
  flowSteps: FlowStep[];
  selected: MoodChoice;
  onOpenStepEditor: (stepId: FlowStepId) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-slate-700" aria-hidden="true" />
        <h3 className="text-lg font-bold text-foreground">실제 흐름</h3>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-5">
        {flowSteps.map((step, index) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onOpenStepEditor(step.id)}
            className="relative rounded-lg border border-border bg-background p-4 text-left transition hover:border-slate-400 hover:bg-muted"
          >
            {index < flowSteps.length - 1 ? (
              <span className="absolute -right-2 top-1/2 hidden h-px w-4 bg-border lg:block" />
            ) : null}
            <p className="text-xs font-bold text-muted-foreground">
              {index + 1}. {step.label}
            </p>
            <h4 className="mt-2 text-sm font-bold leading-5 text-foreground">
              {step.title}
            </h4>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {step.body}
            </p>
          </button>
        ))}
      </div>
      <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold text-slate-500">선택 상태</p>
        <p className="mt-1 text-sm font-bold text-slate-950">
          {selected.label} · 기분 문구
        </p>
      </div>
    </section>
  );
}

function SourceTrace({
  flowSteps,
  selected,
  onOpenStepEditor,
}: {
  flowSteps: FlowStep[];
  selected: MoodChoice;
  onOpenStepEditor: (stepId: FlowStepId) => void;
}) {
  const iconByStep: Record<FlowStepId, typeof MessageCircle> = {
    app_buttons: MessageCircle,
    mood_copy: Database,
    date_basis: CalendarClock,
    reference_pack: FileText,
    answer_prompt: Sparkles,
  };

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-lg font-bold text-foreground">참조</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {flowSteps.map((step) => {
          const Icon = iconByStep[step.id];
          const value =
            step.id === "app_buttons"
              ? selected.label
              : (step.references[0] ?? step.title);
          const detail = step.id === "app_buttons" ? selected.tone : step.body;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onOpenStepEditor(step.id)}
              className="grid grid-cols-[36px_1fr] gap-3 rounded-lg border border-border bg-background p-3 text-left transition hover:border-slate-400 hover:bg-muted"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-slate-700">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">
                  {step.title}
                </p>
                <p className="mt-1 truncate text-sm font-bold text-foreground">
                  {value}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {detail}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ConversationPreview({
  selected,
  selectedMoodText,
  onSelect,
  onOpenMoodEditor,
}: {
  selected: MoodChoice;
  selectedMoodText: string;
  onSelect: (choiceId: string) => void;
  onOpenMoodEditor: () => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-slate-700" aria-hidden="true" />
        <h3 className="text-lg font-bold text-foreground">앱 미리보기</h3>
      </div>
      <div className="mt-4 rounded-lg bg-slate-100 p-3">
        <ChatBubble speaker="assistant">
          오늘은 마음이 어떠세요? 편하게 골라주세요.
        </ChatBubble>
        <div className="mt-3 flex flex-wrap gap-2">
          {MOOD_CHOICES.map((choice) => {
            const isActive = choice.id === selected.id;
            return (
              <button
                key={choice.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => onSelect(choice.id)}
                className={
                  isActive
                    ? "rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white shadow-sm"
                    : "rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-slate-500"
                }
              >
                {choice.label}
              </button>
            );
          })}
        </div>
        <div className="mt-3 space-y-3">
          <ChatBubble speaker="user">{selected.userMessage}</ChatBubble>
          <button
            type="button"
            aria-label={`${selected.label} 문구 수정`}
            onClick={onOpenMoodEditor}
            className="block w-full text-left"
          >
            <ChatBubble speaker="assistant">{selectedMoodText}</ChatBubble>
          </button>
          <ChatBubble speaker="assistant">
            이번 주 몸의 변화나 주차별 정보도 같이 확인해볼까요?
          </ChatBubble>
        </div>
      </div>
    </section>
  );
}

function ChatBubble({
  speaker,
  children,
}: {
  speaker: "assistant" | "user";
  children: ReactNode;
}) {
  const isUser = speaker === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? "max-w-[82%] rounded-lg bg-slate-950 px-3 py-2 text-sm leading-6 text-white"
            : "max-w-[86%] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-6 text-slate-800"
        }
      >
        {children}
      </div>
    </div>
  );
}

function QuickEditPanel({
  flowSteps,
  onOpenStepEditor,
}: {
  flowSteps: FlowStep[];
  onOpenStepEditor: (stepId: FlowStepId) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-lg font-bold text-foreground">편집</h3>
      <div className="mt-4 space-y-2">
        {flowSteps.map((step) => (
          <button
            key={step.id}
            type="button"
            onClick={() => onOpenStepEditor(step.id)}
            className="block w-full rounded-lg border border-border bg-background p-3 text-left transition hover:border-slate-400 hover:bg-muted"
          >
            <p className="text-sm font-bold text-foreground">{step.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              문구 · 프롬프트 · 참조
            </p>
          </button>
        ))}
      </div>
    </section>
  );
}

function EngineEditDialog({
  editingStep,
  draftMoodText,
  draftPromptText,
  draftReferences,
  isSaving,
  newReference,
  selectedChoice,
  onAddReference,
  onClose,
  onDraftMoodTextChange,
  onDraftPromptTextChange,
  onNewReferenceChange,
  onRemoveReference,
  onApply,
}: {
  editingStep: FlowStep | null;
  draftMoodText: string;
  draftPromptText: string;
  draftReferences: string[];
  isSaving: boolean;
  newReference: string;
  selectedChoice: MoodChoice;
  onAddReference: () => void;
  onClose: () => void;
  onDraftMoodTextChange: (value: string) => void;
  onDraftPromptTextChange: (value: string) => void;
  onNewReferenceChange: (value: string) => void;
  onRemoveReference: (index: number) => void;
  onApply: () => void;
}) {
  const isMoodEditor = editingStep?.id === "mood_copy";

  return (
    <Dialog
      open={Boolean(editingStep)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingStep?.title}</DialogTitle>
          <DialogDescription>문구 · 프롬프트 · 참조</DialogDescription>
        </DialogHeader>
        {editingStep ? (
          <div className="space-y-4">
            {isMoodEditor ? (
              <section className="space-y-2">
                <p className="text-sm font-bold text-foreground">
                  {selectedChoice.label} 선택 뒤 말풍선
                </p>
                <Textarea
                  aria-label="앱 말풍선"
                  className="min-h-28"
                  value={draftMoodText}
                  onChange={(event) =>
                    onDraftMoodTextChange(event.target.value)
                  }
                />
              </section>
            ) : null}

            <section className="space-y-2">
              <p className="text-sm font-bold text-foreground">
                {editingStep.promptLabel}
              </p>
              <Textarea
                aria-label="프롬프트 내용"
                className="min-h-28"
                value={draftPromptText}
                onChange={(event) =>
                  onDraftPromptTextChange(event.target.value)
                }
              />
            </section>

            <section className="space-y-2">
              <p className="text-sm font-bold text-foreground">참조</p>
              <div className="space-y-2">
                {draftReferences.map((reference, index) => (
                  <div
                    key={`${reference}-${index}`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                      {reference}
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onRemoveReference(index)}
                    >
                      삭제
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  aria-label="참조 추가"
                  value={newReference}
                  onChange={(event) => onNewReferenceChange(event.target.value)}
                  placeholder="참조 추가"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={onAddReference}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  추가
                </Button>
              </div>
            </section>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                닫기
              </Button>
              <Button type="button" disabled={isSaving} onClick={onApply}>
                {isSaving ? "저장 중" : isMoodEditor ? "저장" : "반영"}
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function getMoodItem(choice: MoodChoice, items: MoodVariantItem[]) {
  return (
    items.find(
      (item) =>
        item.scenario === "mood_intake" &&
        item.mood === choice.moodKey &&
        item.active,
    ) ?? null
  );
}

function getMoodText(choice: MoodChoice, items: MoodVariantItem[]) {
  const item = getMoodItem(choice, items);
  const firstLine = item?.prompt_suffix
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);
  return firstLine ?? choice.assistantMessage;
}
