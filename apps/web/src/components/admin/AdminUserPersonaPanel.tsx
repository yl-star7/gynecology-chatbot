"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PersonaHint =
  | "anxious"
  | "positive"
  | "introverted"
  | "practical"
  | "unknown";
type PersonaConfidence = "low" | "medium" | "high";

interface PersonaProfile {
  userId: string;
  personaHint: PersonaHint;
  confidence: PersonaConfidence;
  evidenceSummary: string | null;
  weightedScore: number | null;
  lastObservedAt: string | null;
}

interface PersonaSignal {
  id: string;
  userId: string;
  sessionId: string | null;
  sourceMessageId: string | null;
  personaHint: PersonaHint;
  confidence: PersonaConfidence;
  evidence: string | null;
  weight: number;
  observedAt: string;
  createdAt: string;
}

interface PersonaPayload {
  profile?: PersonaProfile | null;
  signals?: PersonaSignal[];
  signal?: PersonaSignal;
  error?: string;
}

interface AdminUserPersonaPanelProps {
  userId: string;
}

const PERSONA_HINT_OPTIONS: Array<{
  value: PersonaHint;
  label: string;
  description: string;
}> = [
  {
    value: "anxious",
    label: "안심 필요",
    description: "불안 표현이 많고 확인을 자주 원함",
  },
  {
    value: "positive",
    label: "긍정 공유",
    description: "기쁨과 기대를 나누는 반응을 선호",
  },
  {
    value: "introverted",
    label: "낮은 부담",
    description: "짧고 조용한 응답을 선호",
  },
  {
    value: "practical",
    label: "기준 선호",
    description: "수치, 기준, 다음 행동을 선호",
  },
  {
    value: "unknown",
    label: "확인 필요",
    description: "아직 뚜렷한 성향을 정하지 않음",
  },
];

const CONFIDENCE_OPTIONS: Array<{
  value: PersonaConfidence;
  label: string;
}> = [
  { value: "low", label: "낮음" },
  { value: "medium", label: "보통" },
  { value: "high", label: "높음" },
];

function getPersonaHintLabel(value: PersonaHint | null | undefined) {
  return (
    PERSONA_HINT_OPTIONS.find((option) => option.value === value)?.label ??
    "확인 필요"
  );
}

function getConfidenceLabel(value: PersonaConfidence | null | undefined) {
  return (
    CONFIDENCE_OPTIONS.find((option) => option.value === value)?.label ??
    "낮음"
  );
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "기록 없음";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "기록 없음";
  return date.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AdminUserPersonaPanel({ userId }: AdminUserPersonaPanelProps) {
  const [profile, setProfile] = useState<PersonaProfile | null>(null);
  const [signals, setSignals] = useState<PersonaSignal[]>([]);
  const [personaHint, setPersonaHint] = useState<PersonaHint>("practical");
  const [confidence, setConfidence] = useState<PersonaConfidence>("medium");
  const [evidence, setEvidence] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadPersona = useCallback(
    async function loadPersona(options: { clearMessage?: boolean } = {}) {
      setIsLoading(true);
      if (options.clearMessage !== false) {
        setMessage(null);
      }

      try {
        const response = await fetch(
          `/api/admin/users/persona?userId=${encodeURIComponent(userId)}`,
        );
        const payload = (await response.json()) as PersonaPayload;

        if (!response.ok) {
          throw new Error(
            payload.error ?? "상담 성향 정보를 불러오지 못했습니다.",
          );
        }

        setProfile(payload.profile ?? null);
        setSignals(payload.signals ?? []);
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "상담 성향 정보를 불러오지 못했습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    void loadPersona();
  }, [loadPersona]);

  async function handleCreateSignal() {
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/users/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          personaHint,
          confidence,
          evidence,
        }),
      });
      const payload = (await response.json()) as PersonaPayload;

      if (!response.ok || !payload.signal) {
        throw new Error(payload.error ?? "상담 성향 신호를 추가하지 못했습니다.");
      }

      setEvidence("");
      await loadPersona({ clearMessage: false });
      setMessage("상담 성향 신호를 추가했습니다.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "상담 성향 신호를 추가하지 못했습니다.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const latestSignals = signals.slice(0, 5);

  return (
    <div className="rounded-md border p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold">상담 성향</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            대화 응답 톤에 쓰이는 사용자 성향 신호를 확인하고 보정합니다.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading || isSubmitting}
          onClick={() => {
            void loadPersona();
          }}
        >
          새로고침
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <PersonaInfoCell
          label="현재 성향"
          value={
            isLoading
              ? "불러오는 중"
              : profile
                ? getPersonaHintLabel(profile.personaHint)
                : "기록 없음"
          }
        />
        <PersonaInfoCell
          label="확신도"
          value={
            profile ? getConfidenceLabel(profile.confidence) : "기록 없음"
          }
        />
        <PersonaInfoCell
          label="최근 관찰"
          value={formatDateTime(profile?.lastObservedAt)}
        />
        <PersonaInfoCell
          label="가중 평균"
          value={
            typeof profile?.weightedScore === "number"
              ? profile.weightedScore.toFixed(1)
              : "기록 없음"
          }
        />
      </div>

      {profile?.evidenceSummary ? (
        <p className="mt-3 rounded-md bg-muted p-3 text-xs text-muted-foreground">
          {profile.evidenceSummary}
        </p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-persona-hint">성향 신호</Label>
            <Select
              value={personaHint}
              onValueChange={(value) => setPersonaHint(value as PersonaHint)}
            >
              <SelectTrigger id="admin-persona-hint">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERSONA_HINT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {
                PERSONA_HINT_OPTIONS.find(
                  (option) => option.value === personaHint,
                )?.description
              }
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="admin-persona-confidence">확신도</Label>
            <Select
              value={confidence}
              onValueChange={(value) =>
                setConfidence(value as PersonaConfidence)
              }
            >
              <SelectTrigger id="admin-persona-confidence">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONFIDENCE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="admin-persona-evidence">운영자 근거</Label>
          <Textarea
            id="admin-persona-evidence"
            value={evidence}
            onChange={(event) => setEvidence(event.target.value)}
            rows={3}
            placeholder="예: 기준과 수치를 반복해서 확인함"
          />
        </div>

        <Button
          type="button"
          variant="outline"
          disabled={isLoading || isSubmitting}
          onClick={() => {
            void handleCreateSignal();
          }}
        >
          성향 신호 추가
        </Button>
      </div>

      {message ? (
        <p className="mt-3 text-xs text-muted-foreground">{message}</p>
      ) : null}

      <div className="mt-4">
        <p className="text-xs font-semibold text-muted-foreground">
          최근 기록
        </p>
        {latestSignals.length === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">
            아직 저장된 성향 신호가 없습니다.
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2">
            {latestSignals.map((signal) => (
              <li key={signal.id} className="rounded-md bg-muted p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">
                    {getPersonaHintLabel(signal.personaHint)}
                  </Badge>
                  <Badge variant="secondary">
                    {getConfidenceLabel(signal.confidence)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(signal.observedAt)}
                  </span>
                </div>
                {signal.evidence ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {signal.evidence}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function PersonaInfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}
