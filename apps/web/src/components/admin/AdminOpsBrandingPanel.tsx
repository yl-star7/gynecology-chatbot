"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BrandingImagePreview,
  buildPublicGcsImageUrl,
} from "./BrandingImagePreview";
import { AdminFileUpload } from "./ui";
import { Checkbox } from "@/components/ui/checkbox";

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

const DEFAULT_BRANDING: BrandingData = {
  mascotBucketId: "pregnancy-content",
  mascotObjectPath: "assets/penguin-nurse/app/neutral.png",
  mascotSourceFileName: "neutral.png",
  mascotAltText: "펭귄 간호사",
  surveyFormUrl: DEFAULT_EXTERNAL_SURVEYS[0]?.url ?? null,
  externalSurveys: DEFAULT_EXTERNAL_SURVEYS,
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

export function AdminOpsBrandingPanel() {
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

  useEffect(() => {
    let cancelled = false;

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

    void fetchBranding();
    void fetchCharacterImages();
    return () => {
      cancelled = true;
    };
  }, []);

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

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg">FAB 마스코트</CardTitle>
        <CardDescription>
          마이페이지에서 열리는 설문 링크와 FAB에 표시할 마스코트 이미지를
          관리합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {brandingLoading ? (
          <div className="space-y-2" aria-live="polite">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-2/3" />
          </div>
        ) : (
          <>
            <div className="space-y-1.5">
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
              />
            </div>
            <Button
              type="button"
              onClick={() => void handleSaveSurveyFormUrl()}
              disabled={brandingSaving}
              aria-busy={brandingSaving}
            >
              {brandingSaving ? "저장 중..." : "설문 링크 저장"}
            </Button>

            <div className="space-y-3 rounded-md border bg-card p-3">
              <div>
                <h3 className="text-sm font-medium">외부 설문 노출</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  마이페이지에 보여줄 1차·2차·3차 Google 설문을 관리합니다.
                </p>
              </div>
              {branding.externalSurveys.map((survey) => (
                <div className="grid gap-2 md:grid-cols-[120px_1fr_auto]" key={survey.id}>
                  <Input
                    aria-label={`${survey.label} 이름`}
                    value={survey.label}
                    onChange={(event) => {
                      const label = event.target.value;
                      setBranding((current) => ({
                        ...current,
                        externalSurveys: current.externalSurveys.map((item) =>
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
                        externalSurveys: current.externalSurveys.map((item) =>
                          item.id === survey.id ? { ...item, url } : item,
                        ),
                      }));
                    }}
                  />
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={survey.visible}
                      onCheckedChange={(checked) => {
                        setBranding((current) => ({
                          ...current,
                          externalSurveys: current.externalSurveys.map((item) =>
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
              <div className="min-w-0 space-y-1.5">
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
                  <p className="break-all text-xs text-muted-foreground">
                    {mascotPreviewUrl}
                  </p>
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
            <p className="text-xs text-muted-foreground">
              마이페이지에서 설문 화면을 열 때 이 링크를 사용합니다.
            </p>

            <Separator />

            <div>
              <h3 className="text-sm font-medium">간호사 캐릭터 cache</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                현재 version: {characterImages.version}
              </p>
            </div>
            {characterImagesLoading ? (
              <div className="space-y-2" aria-live="polite">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
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
                    <div className="min-w-0 flex-1 space-y-1.5">
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
                      <p className="break-all text-xs text-muted-foreground">
                        {characterImages.images[key]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {brandingResult ? (
          <Alert role="status" aria-live="polite">
            <AlertDescription>{brandingResult}</AlertDescription>
          </Alert>
        ) : null}
        {brandingError ? (
          <Alert variant="destructive">
            <AlertDescription>{brandingError}</AlertDescription>
          </Alert>
        ) : null}
        {brandingSaving ? (
          <p className="text-xs text-muted-foreground">
            마스코트를 저장하는 중입니다.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
