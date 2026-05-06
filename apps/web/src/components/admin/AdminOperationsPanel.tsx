"use client";

import {
  Activity,
  AlertTriangle,
  Bell,
  GitBranch,
  MessageSquare,
  RefreshCw,
  Send,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BrandingImagePreview,
  buildPublicGcsImageUrl,
} from "./BrandingImagePreview";
import { AdminFileUpload } from "./ui";

interface BrandingData {
  mascotBucketId: string | null;
  mascotObjectPath: string | null;
  mascotSourceFileName: string | null;
  mascotAltText: string | null;
  surveyFormUrl: string | null;
  externalSurveys: ExternalSurveyData[];
}

interface ExternalSurveyData {
  id: string;
  label: string;
  url: string | null;
  visible: boolean;
}

const DEFAULT_EXTERNAL_SURVEYS: ExternalSurveyData[] = [
  {
    id: "survey-1",
    label: "1차 설문지",
    url: "https://forms.gle/ZoLxWPdwid1F94FE8",
    visible: true,
  },
  {
    id: "survey-2",
    label: "2차 설문지",
    url: "https://forms.gle/LvFmEZHkGM3MMLQ8A",
    visible: true,
  },
  {
    id: "survey-3",
    label: "3차 설문지",
    url: "https://forms.gle/fNUX6qDjXR5wXoGt7",
    visible: true,
  },
];

type CharacterImageTone =
  | "neutral"
  | "calm"
  | "joyful"
  | "anxious"
  | "tired"
  | "sad";

interface CharacterImagesData {
  version: string;
  images: Record<CharacterImageTone, string>;
}

interface SchiftCollection {
  id: string;
  name: string;
  vector_count: number;
  model: string;
  dimension: number;
}

interface SchiftWorkflow {
  id: string;
  name: string;
  description: string;
  status: string;
  block_count: number;
  updated_at: string;
}

interface SchiftStatus {
  collections: SchiftCollection[];
  workflows: SchiftWorkflow[];
}

interface SchiftRunResult {
  run: {
    run_id: string;
    status: string;
    outputs: Record<string, unknown>;
    error: string | null;
  };
}

interface ScheduleConfig {
  dailyCheckEnabled: boolean;
  dailyCheckTime: string;
  weeklyMilestoneEnabled: boolean;
  weeklyMilestoneTime: string;
  weeklyMilestoneDay: number;
  checkupReminderEnabled: boolean;
  checkupReminderTime: string;
}

type OperationKey = "refresh-yaml" | "push-send" | "proactive";

const DEFAULT_BRANDING: BrandingData = {
  mascotBucketId: "pregnancy-content",
  mascotObjectPath: "assets/penguin-nurse/app/neutral.png",
  mascotSourceFileName: "neutral.png",
  mascotAltText: "펭귄 간호사",
  surveyFormUrl: DEFAULT_EXTERNAL_SURVEYS[0]?.url ?? null,
  externalSurveys: DEFAULT_EXTERNAL_SURVEYS,
};

const DEFAULT_SCHEDULE: ScheduleConfig = {
  dailyCheckEnabled: true,
  dailyCheckTime: "09:00",
  weeklyMilestoneEnabled: true,
  weeklyMilestoneTime: "10:00",
  weeklyMilestoneDay: 1,
  checkupReminderEnabled: true,
  checkupReminderTime: "18:00",
};

const CHARACTER_IMAGE_TONES: Array<{
  key: CharacterImageTone;
  label: string;
}> = [
  { key: "neutral", label: "기본" },
  { key: "calm", label: "차분" },
  { key: "joyful", label: "기쁨" },
  { key: "anxious", label: "걱정" },
  { key: "tired", label: "피곤" },
  { key: "sad", label: "슬픔" },
];

const WEEKDAY_OPTIONS = [
  { value: "0", label: "일요일" },
  { value: "1", label: "월요일" },
  { value: "2", label: "화요일" },
  { value: "3", label: "수요일" },
  { value: "4", label: "목요일" },
  { value: "5", label: "금요일" },
  { value: "6", label: "토요일" },
];

const DEFAULT_CHARACTER_IMAGES: CharacterImagesData = {
  version: "gcs-penguin-nurse-v1",
  images: Object.fromEntries(
    CHARACTER_IMAGE_TONES.map(({ key }) => [
      key,
      `https://storage.googleapis.com/pregnancy-content/assets/penguin-nurse/app/${key}.png`,
    ]),
  ) as Record<CharacterImageTone, string>,
};

function normalizeBrandingData(data: Partial<BrandingData>): BrandingData {
  const surveysById = new Map(
    Array.isArray(data.externalSurveys)
      ? data.externalSurveys.map((survey) => [survey.id, survey])
      : [],
  );
  const externalSurveys = DEFAULT_EXTERNAL_SURVEYS.map((fallback) => ({
    ...fallback,
    ...(surveysById.get(fallback.id) ?? {}),
  }));

  return {
    ...DEFAULT_BRANDING,
    ...data,
    surveyFormUrl:
      data.surveyFormUrl ??
      externalSurveys.find((survey) => survey.visible && survey.url)?.url ??
      null,
    externalSurveys,
  };
}

export function AdminOperationsPanel() {
  // Panel 2: RAG Provider
  const [ragProvider, setRagProvider] = useState<"schift">("schift");
  const [ragLoading, setRagLoading] = useState(true);
  const [ragSaving, setRagSaving] = useState(false);
  const [ragResult, setRagResult] = useState<string | null>(null);
  const [ragError, setRagError] = useState<string | null>(null);

  const [requireApproval, setRequireApproval] = useState(true);
  const [approvalPolicyLoading, setApprovalPolicyLoading] = useState(true);
  const [approvalPolicySaving, setApprovalPolicySaving] = useState(false);
  const [approvalPolicyResult, setApprovalPolicyResult] = useState<
    string | null
  >(null);
  const [approvalPolicyError, setApprovalPolicyError] = useState<string | null>(
    null,
  );

  const [schedule, setSchedule] = useState<ScheduleConfig>(DEFAULT_SCHEDULE);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleResult, setScheduleResult] = useState<string | null>(null);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [stageMappingJson, setStageMappingJson] = useState("{}");
  const [stageMappingLoading, setStageMappingLoading] = useState(true);
  const [stageMappingSaving, setStageMappingSaving] = useState(false);
  const [stageMappingResult, setStageMappingResult] = useState<string | null>(
    null,
  );
  const [stageMappingError, setStageMappingError] = useState<string | null>(
    null,
  );

  const [operationRunning, setOperationRunning] =
    useState<OperationKey | null>(null);
  const [operationResult, setOperationResult] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  const [branding, setBranding] = useState<BrandingData>(DEFAULT_BRANDING);
  const [brandingLoading, setBrandingLoading] = useState(true);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingResult, setBrandingResult] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const [characterImages, setCharacterImages] = useState<CharacterImagesData>(
    DEFAULT_CHARACTER_IMAGES,
  );
  const [characterImagesLoading, setCharacterImagesLoading] = useState(true);
  const [characterImagesSavingTone, setCharacterImagesSavingTone] =
    useState<CharacterImageTone | null>(null);

  // Panel 6: Schift RAG status
  const [schiftStatus, setSchiftStatus] = useState<SchiftStatus | null>(null);
  const [schiftLoading, setSchiftLoading] = useState(true);
  const [schiftError, setSchiftError] = useState<string | null>(null);
  const [schiftQuery, setSchiftQuery] = useState("");
  const [schiftRunning, setSchiftRunning] = useState(false);
  const [schiftRunResult, setSchiftRunResult] =
    useState<SchiftRunResult | null>(null);
  const [schiftRunError, setSchiftRunError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchRagProvider() {
      setRagLoading(true);
      try {
        const res = await fetch("/api/admin/rag-provider");
        if (res.ok) {
          await res.json();
          if (!cancelled) setRagProvider("schift");
        }
      } catch {
      } finally {
        if (!cancelled) setRagLoading(false);
      }
    }

    async function fetchApprovalPolicy() {
      setApprovalPolicyLoading(true);
      setApprovalPolicyError(null);
      try {
        const res = await fetch("/api/admin/approval-policy");
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        const data = (await res.json()) as { requireApproval: boolean };
        if (!cancelled) setRequireApproval(data.requireApproval);
      } catch (err) {
        if (!cancelled) {
          setApprovalPolicyError(
            err instanceof Error
              ? err.message
              : "앱 사용 승인 정책을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setApprovalPolicyLoading(false);
      }
    }

    async function fetchSchedule() {
      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const res = await fetch("/api/admin/schedule");
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        const data = (await res.json()) as Partial<ScheduleConfig>;
        if (!cancelled) setSchedule({ ...DEFAULT_SCHEDULE, ...data });
      } catch (err) {
        if (!cancelled) {
          setScheduleError(
            err instanceof Error
              ? err.message
              : "알림 스케줄을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }

    async function fetchStageMapping() {
      setStageMappingLoading(true);
      setStageMappingError(null);
      try {
        const res = await fetch("/api/admin/workflow-rules/stage-mapping");
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        const data = (await res.json()) as { mapping?: unknown };
        if (!cancelled) {
          setStageMappingJson(JSON.stringify(data.mapping ?? {}, null, 2));
        }
      } catch (err) {
        if (!cancelled) {
          setStageMappingError(
            err instanceof Error
              ? err.message
              : "워크플로우 매핑을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) setStageMappingLoading(false);
      }
    }

    async function fetchBranding() {
      setBrandingLoading(true);
      try {
        const res = await fetch("/api/admin/branding");
        if (res.ok) {
          const data: Partial<BrandingData> = await res.json();
          if (!cancelled) setBranding(normalizeBrandingData(data));
        }
      } catch {
      } finally {
        if (!cancelled) setBrandingLoading(false);
      }
    }

    async function fetchCharacterImages() {
      setCharacterImagesLoading(true);
      try {
        const res = await fetch("/api/admin/branding/character-images");
        if (res.ok) {
          const data: CharacterImagesData = await res.json();
          if (!cancelled) setCharacterImages(data);
        }
      } catch {
      } finally {
        if (!cancelled) setCharacterImagesLoading(false);
      }
    }

    async function fetchSchiftStatus() {
      setSchiftLoading(true);
      setSchiftError(null);
      try {
        const res = await fetch("/api/admin/schift");
        if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
        const data = (await res.json()) as SchiftStatus;
        if (!cancelled) setSchiftStatus(data);
      } catch (err) {
        if (!cancelled)
          setSchiftError(
            err instanceof Error
              ? err.message
              : "Schift 상태를 불러오지 못했습니다.",
          );
      } finally {
        if (!cancelled) setSchiftLoading(false);
      }
    }

    void fetchRagProvider();
    void fetchApprovalPolicy();
    void fetchSchedule();
    void fetchStageMapping();
    void fetchBranding();
    void fetchCharacterImages();
    void fetchSchiftStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSaveApprovalPolicy(nextRequireApproval: boolean) {
    setApprovalPolicySaving(true);
    setApprovalPolicyResult(null);
    setApprovalPolicyError(null);
    try {
      const res = await fetch("/api/admin/approval-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requireApproval: nextRequireApproval }),
      });
      const payload = (await res.json()) as {
        requireApproval?: boolean;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? `서버 오류 (${res.status})`);
      }

      setRequireApproval(payload.requireApproval ?? nextRequireApproval);
      setApprovalPolicyResult("앱 사용 승인 정책을 저장했습니다.");
    } catch (err) {
      setApprovalPolicyError(
        err instanceof Error
          ? err.message
          : "앱 사용 승인 정책 저장에 실패했습니다.",
      );
    } finally {
      setApprovalPolicySaving(false);
    }
  }

  async function handleSaveSchedule() {
    setScheduleSaving(true);
    setScheduleResult(null);
    setScheduleError(null);
    try {
      const res = await fetch("/api/admin/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(schedule),
      });
      const payload = (await res.json()) as {
        schedule?: ScheduleConfig;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? `서버 오류 (${res.status})`);
      }

      setSchedule(payload.schedule ?? schedule);
      setScheduleResult("알림 스케줄을 저장했습니다.");
    } catch (err) {
      setScheduleError(
        err instanceof Error
          ? err.message
          : "알림 스케줄 저장에 실패했습니다.",
      );
    } finally {
      setScheduleSaving(false);
    }
  }

  async function handleSaveStageMapping() {
    setStageMappingSaving(true);
    setStageMappingResult(null);
    setStageMappingError(null);
    try {
      const mapping = JSON.parse(stageMappingJson) as unknown;
      const res = await fetch("/api/admin/workflow-rules/stage-mapping", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mapping),
      });
      const payload = (await res.json()) as {
        mapping?: unknown;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(payload.error ?? `서버 오류 (${res.status})`);
      }

      setStageMappingJson(JSON.stringify(payload.mapping ?? mapping, null, 2));
      setStageMappingResult("워크플로우 매핑을 저장했습니다.");
    } catch (err) {
      setStageMappingError(
        err instanceof SyntaxError
          ? "JSON 형식을 확인해주세요."
          : err instanceof Error
            ? err.message
            : "워크플로우 매핑 저장에 실패했습니다.",
      );
    } finally {
      setStageMappingSaving(false);
    }
  }

  async function handleRunOperation(
    key: OperationKey,
    url: string,
    body?: Record<string, unknown>,
  ) {
    setOperationRunning(key);
    setOperationResult(null);
    setOperationError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(payload.error ?? `서버 오류 (${res.status})`);
      }

      setOperationResult(JSON.stringify(payload, null, 2));
    } catch (err) {
      setOperationError(
        err instanceof Error ? err.message : "운영 실행에 실패했습니다.",
      );
    } finally {
      setOperationRunning(null);
    }
  }

  async function handleUploadMascot(file: File) {
    setBrandingSaving(true);
    setBrandingResult(null);
    setBrandingError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("bucketId", "pregnancy-content");
      formData.set("mediaScope", "week");
      formData.set("weekNumber", "0");

      const uploadRes = await fetch("/api/admin/content/media/upload", {
        method: "POST",
        body: formData,
      });
      const uploadPayload = (await uploadRes.json()) as {
        error?: string;
        bucketId?: string;
        objectPath?: string;
        sourceFileName?: string;
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
          uploadPayload.error ?? "마스코트 업로드에 실패했습니다.",
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

      const nextBranding: BrandingData = {
        mascotBucketId: uploadPayload.bucketId,
        mascotObjectPath: uploadPayload.objectPath,
        mascotSourceFileName: uploadPayload.sourceFileName ?? file.name,
        mascotAltText: branding.mascotAltText ?? "마스코트",
        surveyFormUrl: branding.surveyFormUrl ?? null,
        externalSurveys: branding.externalSurveys,
      };

      const saveRes = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextBranding),
      });
      const savePayload = (await saveRes.json()) as { error?: string };
      if (!saveRes.ok) {
        throw new Error(savePayload.error ?? "마스코트 저장에 실패했습니다.");
      }

      setBranding(nextBranding);
      setBrandingResult("FAB 마스코트를 저장했습니다.");
    } catch (error) {
      setBrandingError(
        error instanceof Error
          ? error.message
          : "FAB 마스코트 저장에 실패했습니다.",
      );
    } finally {
      setBrandingSaving(false);
    }
  }

  async function handleUploadCharacterImage(
    tone: CharacterImageTone,
    file: File,
  ) {
    setCharacterImagesSavingTone(tone);
    setBrandingResult(null);
    setBrandingError(null);
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
        ...characterImages.images,
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
          savePayload.error ?? "캐릭터 이미지 설정 저장에 실패했습니다.",
        );
      }

      setCharacterImages(savePayload.config);
      setBrandingResult("캐릭터 이미지 cache를 갱신했습니다.");
    } catch (error) {
      setBrandingError(
        error instanceof Error
          ? error.message
          : "캐릭터 이미지 저장에 실패했습니다.",
      );
    } finally {
      setCharacterImagesSavingTone(null);
    }
  }

  async function handleSaveSurveyFormUrl() {
    setBrandingSaving(true);
    setBrandingResult(null);
    setBrandingError(null);
    try {
      const saveRes = await fetch("/api/admin/branding", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...branding,
          surveyFormUrl: branding.surveyFormUrl?.trim() || null,
          externalSurveys: branding.externalSurveys.map((survey) => ({
            ...survey,
            label: survey.label.trim(),
            url: survey.url?.trim() || null,
          })),
        }),
      });
      const savePayload = (await saveRes.json()) as { error?: string };
      if (!saveRes.ok) {
        throw new Error(savePayload.error ?? "설문 링크 저장에 실패했습니다.");
      }

      setBranding((current) => ({
        ...current,
        surveyFormUrl: current.surveyFormUrl?.trim() || null,
        externalSurveys: current.externalSurveys.map((survey) => ({
          ...survey,
          label: survey.label.trim(),
          url: survey.url?.trim() || null,
        })),
      }));
      setBrandingResult("설문 링크를 저장했습니다.");
    } catch (error) {
      setBrandingError(
        error instanceof Error
          ? error.message
          : "설문 링크 저장에 실패했습니다.",
      );
    } finally {
      setBrandingSaving(false);
    }
  }

  const mascotPreviewUrl = buildPublicGcsImageUrl(
    branding.mascotBucketId,
    branding.mascotObjectPath,
  );

  async function handleSchiftRun(workflowId: string) {
    if (!schiftQuery.trim()) return;
    setSchiftRunning(true);
    setSchiftRunResult(null);
    setSchiftRunError(null);
    try {
      const res = await fetch(`/api/admin/schift/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: schiftQuery }),
      });
      if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
      const data: SchiftRunResult = await res.json();
      setSchiftRunResult(data);
    } catch (err) {
      setSchiftRunError(
        err instanceof Error ? err.message : "워크플로우 실행에 실패했습니다.",
      );
    } finally {
      setSchiftRunning(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 앱 사용 승인 정책 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm text-muted-foreground">
                앱 사용 승인 정책
              </CardTitle>
            </div>
            {!approvalPolicyLoading && (
              <Badge variant={requireApproval ? "default" : "secondary"}>
                {requireApproval ? "승인제" : "전체 공개"}
              </Badge>
            )}
          </div>
          <CardDescription>
            새로 가입한 사람이 앱을 바로 쓰게 할지, 관리자가 먼저 확인할지
            정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {approvalPolicyLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <>
              <div className="rounded-md border bg-muted p-3 text-sm">
                <p className="font-medium">
                  현재 모드:{" "}
                  {requireApproval
                    ? "관리자 확인 후 사용"
                    : "가입하면 바로 사용"}
                </p>
                <p className="mt-1 text-muted-foreground">
                  {requireApproval
                    ? "새 가입자는 사용자 관리 화면에서 승인해야 앱을 사용할 수 있습니다."
                    : "새 가입자는 관리자 승인 없이 바로 앱을 사용할 수 있습니다."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={approvalPolicySaving || requireApproval}
                  aria-busy={approvalPolicySaving}
                  onClick={() => void handleSaveApprovalPolicy(true)}
                >
                  관리자가 확인하고 승인
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={approvalPolicySaving || !requireApproval}
                  aria-busy={approvalPolicySaving}
                  onClick={() => void handleSaveApprovalPolicy(false)}
                >
                  가입하면 바로 사용
                </Button>
              </div>
            </>
          )}

          {approvalPolicyResult && (
            <Alert role="status" aria-live="polite">
              <AlertDescription>{approvalPolicyResult}</AlertDescription>
            </Alert>
          )}
          {approvalPolicyError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{approvalPolicyError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 알림 스케줄 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">
              알림 스케줄
            </CardTitle>
          </div>
          <CardDescription>
            매일 확인, 주차 변경, 검진 알림의 사용 여부와 발송 시각을
            관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {scheduleLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-md border bg-card p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      aria-label="매일 확인 알림 사용"
                      checked={schedule.dailyCheckEnabled}
                      onCheckedChange={(checked) =>
                        setSchedule((current) => ({
                          ...current,
                          dailyCheckEnabled: checked === true,
                        }))
                      }
                    />
                    매일 확인 알림
                  </label>
                  <Input
                    className="mt-3"
                    type="time"
                    aria-label="매일 확인 알림 시각"
                    value={schedule.dailyCheckTime}
                    onChange={(event) =>
                      setSchedule((current) => ({
                        ...current,
                        dailyCheckTime: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="rounded-md border bg-card p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      aria-label="주차 변경 알림 사용"
                      checked={schedule.weeklyMilestoneEnabled}
                      onCheckedChange={(checked) =>
                        setSchedule((current) => ({
                          ...current,
                          weeklyMilestoneEnabled: checked === true,
                        }))
                      }
                    />
                    주차 변경 알림
                  </label>
                  <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px]">
                    <Input
                      type="time"
                      aria-label="주차 변경 알림 시각"
                      value={schedule.weeklyMilestoneTime}
                      onChange={(event) =>
                        setSchedule((current) => ({
                          ...current,
                          weeklyMilestoneTime: event.target.value,
                        }))
                      }
                    />
                    <Select
                      value={String(schedule.weeklyMilestoneDay)}
                      onValueChange={(value) =>
                        setSchedule((current) => ({
                          ...current,
                          weeklyMilestoneDay: Number(value),
                        }))
                      }
                    >
                      <SelectTrigger aria-label="주차 변경 알림 요일">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WEEKDAY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-md border bg-card p-3">
                  <label className="flex items-center gap-2 text-sm font-medium">
                    <Checkbox
                      aria-label="검진 알림 사용"
                      checked={schedule.checkupReminderEnabled}
                      onCheckedChange={(checked) =>
                        setSchedule((current) => ({
                          ...current,
                          checkupReminderEnabled: checked === true,
                        }))
                      }
                    />
                    검진 알림
                  </label>
                  <Input
                    className="mt-3"
                    type="time"
                    aria-label="검진 알림 시각"
                    value={schedule.checkupReminderTime}
                    onChange={(event) =>
                      setSchedule((current) => ({
                        ...current,
                        checkupReminderTime: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Button
                type="button"
                className="w-fit"
                disabled={scheduleSaving}
                aria-busy={scheduleSaving}
                onClick={() => void handleSaveSchedule()}
              >
                {scheduleSaving ? "저장 중..." : "스케줄 저장"}
              </Button>
            </>
          )}

          {scheduleResult && (
            <Alert role="status" aria-live="polite">
              <AlertDescription>{scheduleResult}</AlertDescription>
            </Alert>
          )}
          {scheduleError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{scheduleError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 운영 실행 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">
              운영 실행
            </CardTitle>
          </div>
          <CardDescription>
            워크플로우 캐시, 수동 알림, stage별 워크플로우 연결을 확인합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={operationRunning !== null}
              aria-busy={operationRunning === "refresh-yaml"}
              onClick={() =>
                void handleRunOperation(
                  "refresh-yaml",
                  "/api/admin/workflow-rules/refresh-yaml",
                )
              }
            >
              <RefreshCw className="mr-1 h-4 w-4" />
              {operationRunning === "refresh-yaml"
                ? "새로고침 중..."
                : "YAML 캐시 새로고침"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={operationRunning !== null}
              aria-busy={operationRunning === "push-send"}
              onClick={() =>
                void handleRunOperation("push-send", "/api/admin/push/send")
              }
            >
              <Send className="mr-1 h-4 w-4" />
              {operationRunning === "push-send"
                ? "발송 중..."
                : "푸시 수동 발송"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={operationRunning !== null}
              aria-busy={operationRunning === "proactive"}
              onClick={() =>
                void handleRunOperation(
                  "proactive",
                  "/api/admin/proactive/trigger",
                  { triggerId: "daily_check" },
                )
              }
            >
              <MessageSquare className="mr-1 h-4 w-4" />
              {operationRunning === "proactive"
                ? "실행 중..."
                : "자동 대화 실행"}
            </Button>
          </div>

          <div className="rounded-md border bg-card p-3">
            <div className="mb-3">
              <Label htmlFor="stage-mapping-json">
                stage 워크플로우 매핑 JSON
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                router, baby_info, letter_reflection, free_chat, general에
                연결할 워크플로우 ID를 지정합니다.
              </p>
            </div>
            <Textarea
              id="stage-mapping-json"
              value={stageMappingJson}
              disabled={stageMappingLoading}
              rows={7}
              className="font-mono text-xs"
              onChange={(event) => setStageMappingJson(event.target.value)}
            />
            <Button
              type="button"
              className="mt-3"
              disabled={stageMappingLoading || stageMappingSaving}
              aria-busy={stageMappingSaving}
              onClick={() => void handleSaveStageMapping()}
            >
              {stageMappingSaving ? "저장 중..." : "매핑 저장"}
            </Button>
          </div>

          {operationResult && (
            <pre
              className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-3 text-xs"
              aria-live="polite"
            >
              {operationResult}
            </pre>
          )}
          {operationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{operationError}</AlertDescription>
            </Alert>
          )}
          {stageMappingResult && (
            <Alert role="status" aria-live="polite">
              <AlertDescription>{stageMappingResult}</AlertDescription>
            </Alert>
          )}
          {stageMappingError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{stageMappingError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* FAB 마스코트 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">
              FAB 마스코트
            </CardTitle>
          </div>
          <CardDescription>
            마이페이지에서 열리는 설문 링크와 FAB에 표시할 마스코트 이미지를
            관리합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {brandingLoading ? (
            <div className="flex flex-col gap-2" aria-live="polite">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-2/3" />
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="survey-form-url">설문 링크</Label>
                <Input
                  id="survey-form-url"
                  type="url"
                  inputMode="url"
                  placeholder="https://forms.gle/... 또는 https://docs.google.com/forms/..."
                  value={branding.surveyFormUrl ?? ""}
                  onChange={(event) =>
                    setBranding((current) => ({
                      ...current,
                      surveyFormUrl: event.target.value,
                    }))
                  }
                  aria-label="설문 링크"
                />
              </div>
              <div>
                <Button
                  type="button"
                  onClick={() => void handleSaveSurveyFormUrl()}
                  disabled={brandingSaving}
                  aria-busy={brandingSaving}
                >
                  {brandingSaving ? "저장 중..." : "설문 링크 저장"}
                </Button>
              </div>

              <div className="space-y-3 rounded-md border bg-card p-3">
                <div>
                  <h3 className="text-sm font-medium">외부 설문 노출</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    마이페이지에 보여줄 1차·2차·3차 Google 설문을 관리합니다.
                  </p>
                </div>
                {branding.externalSurveys.map((survey) => (
                  <div
                    className="grid gap-2 md:grid-cols-[120px_1fr_auto]"
                    key={survey.id}
                  >
                    <Input
                      aria-label={`${survey.label} 이름`}
                      value={survey.label}
                      onChange={(event) => {
                        const label = event.target.value;
                        setBranding((current) => ({
                          ...current,
                          externalSurveys: current.externalSurveys.map(
                            (item) =>
                              item.id === survey.id ? { ...item, label } : item,
                          ),
                        }));
                      }}
                    />
                    <Input
                      aria-label={`${survey.label} 링크`}
                      type="url"
                      inputMode="url"
                      value={survey.url ?? ""}
                      onChange={(event) => {
                        const url = event.target.value;
                        setBranding((current) => ({
                          ...current,
                          externalSurveys: current.externalSurveys.map(
                            (item) =>
                              item.id === survey.id ? { ...item, url } : item,
                          ),
                        }));
                      }}
                    />
                    <label className="flex items-center gap-2 text-sm">
                      <Checkbox
                        aria-label={`${survey.label} 보임`}
                        checked={survey.visible}
                        onCheckedChange={(checked) => {
                          setBranding((current) => ({
                            ...current,
                            externalSurveys: current.externalSurveys.map(
                              (item) =>
                                item.id === survey.id
                                  ? { ...item, visible: checked === true }
                                  : item,
                            ),
                          }));
                        }}
                      />
                      보임
                    </label>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                <BrandingImagePreview
                  src={mascotPreviewUrl}
                  alt="FAB 마스코트 미리보기"
                  className="h-28 w-28"
                />
                <div className="min-w-0 flex flex-col gap-1.5">
                  <Label htmlFor="mascot-upload">마스코트 업로드</Label>
                  <AdminFileUpload
                    id="mascot-upload"
                    label="파일 선택"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onFileSelect={(file) => {
                      void handleUploadMascot(file);
                    }}
                  />
                  {mascotPreviewUrl ? (
                    <span className="break-all text-xs text-muted-foreground">
                      {mascotPreviewUrl}
                    </span>
                  ) : null}
                </div>
              </div>
              {branding.mascotObjectPath ? (
                <p className="text-xs text-muted-foreground">
                  현재 파일:{" "}
                  {branding.mascotSourceFileName ?? branding.mascotObjectPath}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  현재 설정된 FAB 마스코트가 없습니다.
                </p>
              )}

              <Separator />

              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">간호사 캐릭터 cache</h3>
              </div>
              {characterImagesLoading ? (
                <div className="flex flex-col gap-2" aria-live="polite">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {CHARACTER_IMAGE_TONES.map(({ key, label }) => (
                    <div
                      className="flex gap-3 rounded-md border bg-card p-3"
                      key={key}
                    >
                      <BrandingImagePreview
                        src={characterImages.images[key]}
                        alt={`${label} 이미지 미리보기`}
                        className="h-20 w-20"
                      />
                      <div className="min-w-0 flex flex-1 flex-col gap-1.5">
                        <Label htmlFor={`character-image-${key}`}>
                          {label} 이미지
                        </Label>
                        <AdminFileUpload
                          id={`character-image-${key}`}
                          label="파일 선택"
                          accept="image/png,image/jpeg,image/webp"
                          disabled={characterImagesSavingTone === key}
                          onFileSelect={(file) => {
                            void handleUploadCharacterImage(key, file);
                          }}
                        />
                        <span className="break-all text-xs text-muted-foreground">
                          {characterImages.images[key]}
                        </span>
                      </div>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground">
                    앱은 시작할 때 version을 비교하고 바뀐 경우에만 이 cache를
                    다시 받습니다. 현재 version: {characterImages.version}
                  </p>
                </div>
              )}
            </>
          )}

          {brandingResult && (
            <Alert role="status" aria-live="polite">
              <AlertDescription>{brandingResult}</AlertDescription>
            </Alert>
          )}
          {brandingError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{brandingError}</AlertDescription>
            </Alert>
          )}
          {brandingSaving ? (
            <p className="text-xs text-muted-foreground">
              마스코트를 저장하는 중입니다.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {/* Schift RAG 현황 */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-sm text-muted-foreground">
              Schift RAG 현황
            </CardTitle>
          </div>
          <CardDescription>
            컬렉션과 워크플로우 상태를 확인하고 테스트 질문을 실행합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {schiftLoading ? (
            <div className="flex flex-col gap-2" aria-live="polite">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : schiftError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{schiftError}</AlertDescription>
            </Alert>
          ) : schiftStatus ? (
            <>
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">컬렉션</p>
                {schiftStatus.collections.map((col) => (
                  <div
                    key={col.id}
                    className="flex flex-wrap items-center gap-2 rounded-md border p-3"
                  >
                    <span className="text-sm font-medium">{col.name}</span>
                    <Badge variant="secondary">
                      {col.vector_count.toLocaleString("ko-KR")} vectors
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {col.model} · dim {col.dimension}
                    </span>
                  </div>
                ))}
              </div>

              {schiftStatus.workflows.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">워크플로우</p>
                  {schiftStatus.workflows.map((wf) => (
                    <div
                      key={wf.id}
                      className="flex flex-col gap-2 rounded-md border p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{wf.name}</span>
                        <Badge
                          variant={
                            wf.status === "published" ? "default" : "outline"
                          }
                        >
                          {wf.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {wf.block_count}블록 ·{" "}
                          {new Date(wf.updated_at).toLocaleDateString("ko-KR", {
                            timeZone: "Asia/Seoul",
                          })}
                        </span>
                      </div>
                      {wf.description && (
                        <p className="text-xs text-muted-foreground">
                          {wf.description}
                        </p>
                      )}
                      {wf.status === "published" && (
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            className="flex-1"
                            placeholder="테스트 질문 입력..."
                            value={schiftQuery}
                            onChange={(e) => setSchiftQuery(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !schiftRunning)
                                void handleSchiftRun(wf.id);
                            }}
                          />
                          <Button
                            type="button"
                            disabled={schiftRunning || !schiftQuery.trim()}
                            aria-busy={schiftRunning}
                            onClick={() => void handleSchiftRun(wf.id)}
                          >
                            {schiftRunning ? "실행 중..." : "테스트"}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {schiftRunResult && (
                <div className="flex flex-col gap-2">
                  <Alert role="status">
                    <AlertDescription>
                      상태: {schiftRunResult.run.status}
                      {schiftRunResult.run.run_id &&
                        ` · ${schiftRunResult.run.run_id.slice(0, 12)}...`}
                    </AlertDescription>
                  </Alert>
                  {Object.keys(schiftRunResult.run.outputs).length > 0 && (
                    <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-md border bg-muted p-3 text-xs">
                      {JSON.stringify(schiftRunResult.run.outputs, null, 2)}
                    </pre>
                  )}
                  {schiftRunResult.run.error && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {schiftRunResult.run.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
              {schiftRunError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{schiftRunError}</AlertDescription>
                </Alert>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* 벡터 검색 설정 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-sm text-muted-foreground">
                벡터 검색 설정
              </CardTitle>
            </div>
            <Badge variant="secondary">{ragProvider}</Badge>
          </div>
          <CardDescription>
            챗봇이 질문에 답할 때 사용하는 벡터 검색 제공자를 지정합니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {ragLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <div className="flex items-center gap-2 rounded-md border p-3">
              <span className="text-sm font-medium">Schift (벡터 DB)</span>
            </div>
          )}

          <div>
            <Button
              type="button"
              disabled={ragSaving || ragLoading}
              aria-busy={ragSaving}
              onClick={async () => {
                setRagSaving(true);
                setRagResult(null);
                setRagError(null);
                try {
                  const res = await fetch("/api/admin/rag-provider", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ragProvider }),
                  });
                  if (!res.ok) throw new Error(`서버 오류 (${res.status})`);
                  setRagResult("저장되었습니다.");
                } catch (err) {
                  setRagError(
                    err instanceof Error ? err.message : "저장에 실패했습니다.",
                  );
                } finally {
                  setRagSaving(false);
                }
              }}
            >
              {ragSaving ? "저장 중..." : "저장"}
            </Button>
          </div>

          {ragResult && (
            <Alert role="status">
              <AlertDescription>{ragResult}</AlertDescription>
            </Alert>
          )}
          {ragError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{ragError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
