"use client";

import { useState, type ReactNode } from "react";
import {
  Brain,
  CalendarClock,
  Database,
  FileCode2,
  MessageCircle,
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
  traceKey: string;
};

type EditorState =
  | { type: "mood"; choiceId: string }
  | { type: "source"; title: string; source: string; href?: string };

const MOOD_CHOICES: MoodChoice[] = [
  {
    id: "direct",
    label: "직접 말하고 싶어요",
    moodKey: "calm",
    tone: "직접 입력",
    userMessage: "직접 말하고 싶어요",
    assistantMessage: "나눠주신 감정 잘 들었어요. 천천히 이야기해도 괜찮아요.",
    traceKey: "mood_intake.direct",
  },
  {
    id: "joyful",
    label: "좋아요",
    moodKey: "joyful",
    tone: "밝음",
    userMessage: "좋아요",
    assistantMessage:
      "오늘 마음이 밝아서 다행이에요. 이 기분을 편하게 이어가봐요.",
    traceKey: "mood_intake.joyful",
  },
  {
    id: "gloomy",
    label: "울적해요",
    moodKey: "sad",
    tone: "울적함",
    userMessage: "울적해요",
    assistantMessage:
      "마음이 많이 가라앉은 느낌이네요. 천천히 같이 살펴볼게요.",
    traceKey: "mood_intake.gloomy",
  },
  {
    id: "sad",
    label: "슬퍼요",
    moodKey: "sad",
    tone: "슬픔",
    userMessage: "슬퍼요",
    assistantMessage:
      "슬픈 마음이 크게 올라온 날이네요. 지금 느끼는 걸 조금씩 말해도 괜찮아요.",
    traceKey: "mood_intake.sad",
  },
  {
    id: "angry",
    label: "짜증나요",
    moodKey: "anxious",
    tone: "짜증",
    userMessage: "짜증나요",
    assistantMessage:
      "많이 답답하고 예민해진 상황이었나 봐요. 오늘은 부담을 조금 덜어내도 괜찮아요.",
    traceKey: "mood_intake.angry",
  },
];

const FLOW_STEPS = [
  {
    label: "앱 버튼",
    title: "감정 선택",
    body: "좋아요 · 울적해요 · 슬퍼요 · 짜증나요",
  },
  {
    label: "문구",
    title: "mood_intake",
    body: "관리자 문구",
  },
  {
    label: "기준일",
    title: "주차 계산",
    body: "예정일 / 보정일",
  },
  {
    label: "자료",
    title: "주차 + RAG",
    body: "필요한 참고만",
  },
  {
    label: "답변",
    title: "AI 생성",
    body: "프롬프트 + 자료",
  },
];

const EDIT_TARGETS = [
  {
    label: "기분 문구",
    href: "/admin/engine/moods",
    value: "대화 엔진 > 기분별 변주",
  },
  {
    label: "주차 자료",
    href: "/admin/content/weeks",
    value: "자산 관리 > 주차별",
  },
  {
    label: "공통 풀",
    href: "/admin/assets/pools",
    value: "자산 관리 > 공통 풀",
  },
  {
    label: "워크플로우",
    href: "/admin/engine/workflows",
    value: "대화 엔진 > 워크플로우",
  },
  {
    label: "YAML fallback",
    value: "packages/mobile-api/src/workflows/maternal-nursing.yaml",
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
  const [selectedChoiceId, setSelectedChoiceId] = useState("joyful");
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [draftMoodText, setDraftMoodText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const selected =
    MOOD_CHOICES.find((choice) => choice.id === selectedChoiceId) ??
    MOOD_CHOICES[1];
  const selectedMoodText = getMoodText(selected, moodItems);

  function openMoodEditor(choice: MoodChoice) {
    setEditor({ type: "mood", choiceId: choice.id });
    setDraftMoodText(
      getMoodItem(choice, moodItems)?.prompt_suffix ?? choice.assistantMessage,
    );
    setMessage(null);
  }

  function openSourceEditor(title: string, source: string, href?: string) {
    setEditor({ type: "source", title, source, href });
    setMessage(null);
  }

  function closeEditor() {
    if (isSaving) return;
    setEditor(null);
  }

  async function saveMoodText() {
    if (!editor || editor.type !== "mood") return;
    const choice = getChoiceById(editor.choiceId);
    const currentItem = getMoodItem(choice, moodItems);
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
                  mood: choice.moodKey,
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
      setEditor(null);
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
              {["앱", "문구", "기준일", "자료", "답변"].map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-border bg-muted px-3 py-1.5 text-xs font-bold text-foreground"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_420px]">
          <main className="space-y-4">
            <FlowMap
              selected={selected}
              onOpenMoodEditor={() => openMoodEditor(selected)}
              onOpenSourceEditor={openSourceEditor}
            />
            <SourceTrace
              selected={selected}
              onOpenMoodEditor={() => openMoodEditor(selected)}
              onOpenSourceEditor={openSourceEditor}
            />
          </main>
          <aside className="space-y-4">
            <ConversationPreview
              selected={selected}
              selectedMoodText={selectedMoodText}
              onSelect={setSelectedChoiceId}
              onOpenMoodEditor={() => openMoodEditor(selected)}
            />
            <EditTargetPanel onOpenSourceEditor={openSourceEditor} />
          </aside>
        </div>
        {message ? (
          <p className="rounded-lg border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground">
            {message}
          </p>
        ) : null}
      </div>
      <EngineEditDialog
        editor={editor}
        draftMoodText={draftMoodText}
        isSaving={isSaving}
        selectedChoice={selected}
        onClose={closeEditor}
        onDraftMoodTextChange={setDraftMoodText}
        onSaveMoodText={saveMoodText}
      />
    </AdminPageFrame>
  );
}

function FlowMap({
  selected,
  onOpenMoodEditor,
  onOpenSourceEditor,
}: {
  selected: MoodChoice;
  onOpenMoodEditor: () => void;
  onOpenSourceEditor: (title: string, source: string, href?: string) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Brain className="h-5 w-5 text-slate-700" aria-hidden="true" />
        <h3 className="text-lg font-bold text-foreground">실제 흐름</h3>
      </div>
      <div className="mt-4 grid gap-3 lg:grid-cols-5">
        {FLOW_STEPS.map((step, index) => (
          <button
            key={step.label}
            type="button"
            onClick={() => {
              if (step.label === "문구") {
                onOpenMoodEditor();
                return;
              }
              const target = EDIT_TARGETS[index] ?? EDIT_TARGETS[0];
              onOpenSourceEditor(step.title, target.value, target.href);
            }}
            className="relative rounded-lg border border-border bg-background p-4 text-left transition hover:border-slate-400 hover:bg-muted"
          >
            {index < FLOW_STEPS.length - 1 ? (
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
          {selected.label} · {selected.traceKey}
        </p>
      </div>
    </section>
  );
}

function SourceTrace({
  selected,
  onOpenMoodEditor,
  onOpenSourceEditor,
}: {
  selected: MoodChoice;
  onOpenMoodEditor: () => void;
  onOpenSourceEditor: (title: string, source: string, href?: string) => void;
}) {
  const rows = [
    {
      icon: MessageCircle,
      label: "사용자 입력",
      value: selected.label,
      detail: selected.tone,
      onClick: () => onOpenSourceEditor("앱 버튼", "앱 quick reply"),
    },
    {
      icon: Database,
      label: "관리자 문구",
      value: "engine_mood_variants / mood_intake",
      detail: selected.traceKey,
      onClick: onOpenMoodEditor,
    },
    {
      icon: CalendarClock,
      label: "기준일 보정",
      value: "예정일 / 보정일",
      detail: "현재 주차",
      onClick: () =>
        onOpenSourceEditor("기준일 보정", "사용자 상세 / 운영 화면"),
    },
    {
      icon: Database,
      label: "참고 자료",
      value: "주차 콘텐츠 + RAG 사전",
      detail: "주차 / 사전",
      onClick: () =>
        onOpenSourceEditor(
          "참고 자료",
          "자산 관리 > 주차별",
          "/admin/content/weeks",
        ),
    },
    {
      icon: FileCode2,
      label: "YAML fallback",
      value: "maternal-nursing.yaml",
      detail: "DB 없을 때",
      onClick: () =>
        onOpenSourceEditor(
          "YAML fallback",
          "packages/mobile-api/src/workflows/maternal-nursing.yaml",
        ),
    },
    {
      icon: Sparkles,
      label: "AI 답변",
      value: "프롬프트 + 참고자료",
      detail: "최종 문장",
      onClick: () => onOpenSourceEditor("AI 답변", "프롬프트 + 참고자료"),
    },
  ];

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-lg font-bold text-foreground">참조 trace</h3>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <button
              key={`${row.label}-${row.value}`}
              type="button"
              onClick={row.onClick}
              className="grid grid-cols-[36px_1fr] gap-3 rounded-lg border border-border bg-background p-3 text-left transition hover:border-slate-400 hover:bg-muted"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-slate-700">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">
                  {row.label}
                </p>
                <p className="mt-1 truncate text-sm font-bold text-foreground">
                  {row.value}
                </p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {row.detail}
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

function EditTargetPanel({
  onOpenSourceEditor,
}: {
  onOpenSourceEditor: (title: string, source: string, href?: string) => void;
}) {
  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <h3 className="text-lg font-bold text-foreground">수정 위치</h3>
      <div className="mt-4 space-y-2">
        {EDIT_TARGETS.map((target) =>
          target.href ? (
            <button
              key={target.label}
              type="button"
              onClick={() =>
                onOpenSourceEditor(target.label, target.value, target.href)
              }
              className="block w-full rounded-lg border border-border bg-background p-3 text-left transition hover:border-slate-400 hover:bg-muted"
            >
              <p className="text-sm font-bold text-foreground">
                {target.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {target.value}
              </p>
            </button>
          ) : (
            <button
              key={target.label}
              type="button"
              onClick={() => onOpenSourceEditor(target.label, target.value)}
              className="block w-full rounded-lg border border-border bg-background p-3 text-left transition hover:border-slate-400 hover:bg-muted"
            >
              <p className="text-sm font-bold text-foreground">
                {target.label}
              </p>
              <code className="mt-1 block break-all text-xs text-muted-foreground">
                {target.value}
              </code>
            </button>
          ),
        )}
      </div>
    </section>
  );
}

function EngineEditDialog({
  editor,
  draftMoodText,
  isSaving,
  selectedChoice,
  onClose,
  onDraftMoodTextChange,
  onSaveMoodText,
}: {
  editor: EditorState | null;
  draftMoodText: string;
  isSaving: boolean;
  selectedChoice: MoodChoice;
  onClose: () => void;
  onDraftMoodTextChange: (value: string) => void;
  onSaveMoodText: () => void;
}) {
  const isMoodEditor = editor?.type === "mood";

  return (
    <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isMoodEditor ? "기분 문구" : editor?.title}
          </DialogTitle>
          <DialogDescription>
            {isMoodEditor ? "앱에 바로 보이는 문구" : "수정 위치"}
          </DialogDescription>
        </DialogHeader>
        {isMoodEditor ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted px-3 py-2 text-sm">
              {selectedChoice.label} · mood_intake
            </div>
            <Textarea
              aria-label="기분 문구 내용"
              className="min-h-36"
              value={draftMoodText}
              onChange={(event) => onDraftMoodTextChange(event.target.value)}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                닫기
              </Button>
              <Button
                type="button"
                disabled={isSaving}
                onClick={onSaveMoodText}
              >
                {isSaving ? "저장 중" : "저장"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-lg border border-border bg-muted px-3 py-3">
              <p className="text-xs font-semibold text-muted-foreground">
                수정 위치
              </p>
              <p className="mt-1 text-sm font-bold text-foreground">
                {editor?.source}
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                닫기
              </Button>
              {editor?.href ? (
                <Button type="button" asChild>
                  <a href={editor.href}>열기</a>
                </Button>
              ) : null}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getChoiceById(choiceId: string) {
  return (
    MOOD_CHOICES.find((choice) => choice.id === choiceId) ?? MOOD_CHOICES[1]
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
