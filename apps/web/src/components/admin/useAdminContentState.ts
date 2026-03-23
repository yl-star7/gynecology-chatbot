"use client";

import { useEffect, useState } from "react";

import type {
  AdminDashboardData,
  AdminKnowledgeItem,
  AdminWeekAsset,
  AdminWeekDay,
  AdminWeekDetail,
  AdminWeekMedia,
  AdminWeekSection,
  AdminWeekSummary,
  AdminWorkflowRule,
} from "@gynecology-chatbot/app-core";

type OrderedItem = { displayOrder: number };

function sortOrderedItems<T extends OrderedItem>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftDayNumber =
      "dayNumber" in left && typeof left.dayNumber === "number"
        ? left.dayNumber
        : -1;
    const rightDayNumber =
      "dayNumber" in right && typeof right.dayNumber === "number"
        ? right.dayNumber
        : -1;
    const dayDelta = leftDayNumber - rightDayNumber;
    if (dayDelta !== 0) {
      return dayDelta;
    }

    const orderDelta = left.displayOrder - right.displayOrder;
    if (orderDelta !== 0) {
      return orderDelta;
    }

    return 0;
  });
}

function moveOrderedItem<T extends OrderedItem>(
  items: T[],
  index: number,
  direction: -1 | 1,
) {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  [nextItems[index], nextItems[targetIndex]] = [
    nextItems[targetIndex],
    nextItems[index],
  ];

  return nextItems.map((item, nextIndex) => ({
    ...item,
    displayOrder: nextIndex + 1,
  }));
}

function removeOrderedItem<T extends OrderedItem>(items: T[], index: number) {
  return items
    .filter((_, currentIndex) => currentIndex !== index)
    .map((item, nextIndex) => ({
      ...item,
      displayOrder: nextIndex + 1,
    }));
}

export function useAdminContentState(
  dashboard: AdminDashboardData,
  view: "documents" | "static" | "weeks" | "policies",
) {
  const [knowledgeItems, setKnowledgeItems] = useState<AdminKnowledgeItem[]>([]);
  const [selectedKnowledgeItemId, setSelectedKnowledgeItemId] = useState("");
  const [knowledgeSlug, setKnowledgeSlug] = useState("");
  const [knowledgeSection, setKnowledgeSection] = useState<
    AdminKnowledgeItem["section"]
  >("knowledge");
  const [knowledgeTitle, setKnowledgeTitle] = useState("");
  const [knowledgeBody, setKnowledgeBody] = useState("");
  const [knowledgeStatus, setKnowledgeStatus] = useState<
    AdminKnowledgeItem["status"]
  >("draft");
  const [ragDocuments, setRagDocuments] = useState(dashboard.ragDocuments);
  const [selectedRagDocumentId, setSelectedRagDocumentId] = useState("");
  const [ragTitle, setRagTitle] = useState("");
  const [ragCategory, setRagCategory] = useState("");
  const [ragWeek, setRagWeek] = useState("");
  const [ragContent, setRagContent] = useState("");
  const [workflowRules, setWorkflowRules] = useState(dashboard.workflowRules);
  const [selectedWorkflowRuleId, setSelectedWorkflowRuleId] = useState(
    dashboard.workflowRules[0]?.id ?? "",
  );
  const [workflowName, setWorkflowName] = useState(
    dashboard.workflowRules[0]?.name ?? "",
  );
  const [workflowTrigger, setWorkflowTrigger] = useState(
    dashboard.workflowRules[0]?.trigger ?? "",
  );
  const [workflowRetrievalScope, setWorkflowRetrievalScope] = useState(
    dashboard.workflowRules[0]?.retrievalScope ?? "",
  );
  const [workflowModelName, setWorkflowModelName] = useState(
    dashboard.workflowRules[0]?.modelName ?? "",
  );
  const [workflowStatus, setWorkflowStatus] = useState<
    AdminWorkflowRule["status"]
  >(dashboard.workflowRules[0]?.status ?? "review");
  const [contentMessage, setContentMessage] = useState<string | null>(null);
  const [isRagSubmitting, setIsRagSubmitting] = useState(false);
  const [isKnowledgeSaving, setIsKnowledgeSaving] = useState(false);
  const [isWorkflowSaving, setIsWorkflowSaving] = useState(false);
  const [isWeekSaving, setIsWeekSaving] = useState(false);
  const [weekSummaries, setWeekSummaries] = useState<AdminWeekSummary[]>([]);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(
    null,
  );
  const [selectedWeekDetail, setSelectedWeekDetail] =
    useState<AdminWeekDetail | null>(null);
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(false);
  const [uploadingMediaIndex, setUploadingMediaIndex] = useState<number | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    const needsKnowledgeItems = view === "static";
    const needsWeeks = view === "weeks";

    async function loadKnowledgeItems() {
      try {
        const response = await fetch("/api/admin/content/knowledge-items");
        const payload = (await response.json()) as {
          error?: string;
          knowledgeItems?: AdminKnowledgeItem[];
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "지식 문서 목록을 불러오지 못했습니다.");
        }

        if (cancelled) {
          return;
        }

        const nextKnowledgeItems = payload.knowledgeItems ?? [];
        setKnowledgeItems(nextKnowledgeItems);

        const firstItem = nextKnowledgeItems[0];
        if (firstItem) {
          setSelectedKnowledgeItemId(firstItem.id);
          setKnowledgeSlug(firstItem.slug);
          setKnowledgeSection(firstItem.section);
          setKnowledgeTitle(firstItem.title);
          setKnowledgeBody(firstItem.body);
          setKnowledgeStatus(firstItem.status);
        }
      } catch (error) {
        if (!cancelled) {
          setContentMessage(
            error instanceof Error
              ? error.message
              : "지식 문서 목록을 불러오지 못했습니다.",
          );
        }
      }
    }

    async function loadWeeks() {
      setIsLoadingWeeks(true);

      try {
        const response = await fetch("/api/admin/content/weeks");
        const payload = (await response.json()) as {
          error?: string;
          weeks?: AdminWeekSummary[];
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "주차 목록을 불러오지 못했습니다.");
        }

        const weeks = payload.weeks ?? [];
        if (cancelled) {
          return;
        }

        setWeekSummaries(weeks);

        const initialWeekNumber = weeks[0]?.weekNumber ?? null;
        if (!initialWeekNumber) {
          setSelectedWeekNumber(null);
          setSelectedWeekDetail(null);
          setContentMessage(null);
          return;
        }

        await loadWeekDetail(initialWeekNumber, cancelled);
      } catch (error) {
        if (!cancelled) {
          setContentMessage(
            error instanceof Error
              ? error.message
              : "주차 목록을 불러오지 못했습니다.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingWeeks(false);
        }
      }
    }

    if (needsKnowledgeItems) {
      void loadKnowledgeItems();
    }

    if (needsWeeks) {
      void loadWeeks();
    }

    return () => {
      cancelled = true;
    };
  }, [view]);

  function mapDetailToSummary(detail: AdminWeekDetail): AdminWeekSummary {
    return {
      id: detail.id,
      weekNumber: detail.weekNumber,
      title: detail.title,
      babySizeLabel: detail.babySizeLabel,
      babySizeCompareObject: detail.babySizeCompareObject,
      babySummary: detail.babySummary,
      motherSummary: detail.motherSummary,
      heroImagePath: detail.heroImagePath,
      compareImagePath: detail.compareImagePath,
      status: detail.status,
      updatedAt: detail.updatedAt,
    };
  }

  async function loadWeekDetail(weekNumber: number, cancelled = false) {
    setIsLoadingWeeks(true);

    try {
      const response = await fetch(`/api/admin/content/weeks/${weekNumber}`);
      const payload = (await response.json()) as {
        error?: string;
        week?: AdminWeekDetail;
      };

      if (!response.ok || !payload.week) {
        throw new Error(payload.error ?? "주차 상세를 불러오지 못했습니다.");
      }

      if (cancelled) {
        return;
      }

      setSelectedWeekNumber(weekNumber);
      setSelectedWeekDetail({
        ...payload.week,
        days: sortOrderedItems(payload.week.days),
        sections: sortOrderedItems(payload.week.sections),
        assets: sortOrderedItems(payload.week.assets),
        media: sortOrderedItems(payload.week.media),
      });
      setContentMessage(null);
    } catch (error) {
      if (!cancelled) {
        setContentMessage(
          error instanceof Error
            ? error.message
            : "주차 상세를 불러오지 못했습니다.",
        );
      }
    } finally {
      if (!cancelled) {
        setIsLoadingWeeks(false);
      }
    }
  }

  function updateWeekDetail(
    updater: (current: AdminWeekDetail) => AdminWeekDetail,
  ) {
    setSelectedWeekDetail((current) => (current ? updater(current) : current));
  }

  function handleSelectWeek(weekNumber: number) {
    void loadWeekDetail(weekNumber);
  }

  function handleWeekFieldChange(
    field:
      | "title"
      | "babySizeLabel"
      | "babySizeCompareObject"
      | "babySummary"
      | "motherSummary"
      | "heroImagePath"
      | "compareImagePath",
    value: string,
  ) {
    updateWeekDetail((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleWeekStatusChange(value: AdminWeekDetail["status"]) {
    updateWeekDetail((current) => ({
      ...current,
      status: value,
    }));
  }

  function handleWeekSectionChange(
    index: number,
    field: keyof AdminWeekSection,
    value: string | number | boolean | null,
  ) {
    updateWeekDetail((current) => ({
      ...current,
      sections: current.sections.map((section, currentIndex) =>
        currentIndex === index ? { ...section, [field]: value } : section,
      ),
    }));
  }

  function handleWeekAssetChange(
    index: number,
    field: keyof AdminWeekAsset,
    value: string | number | boolean | null,
  ) {
    updateWeekDetail((current) => ({
      ...current,
      assets: current.assets.map((asset, currentIndex) =>
        currentIndex === index ? { ...asset, [field]: value } : asset,
      ),
    }));
  }

  function handleWeekDayChange(
    index: number,
    field: keyof AdminWeekDay,
    value: string | number | string[] | null,
  ) {
    updateWeekDetail((current) => ({
      ...current,
      days: current.days.map((day, currentIndex) =>
        currentIndex === index ? { ...day, [field]: value } : day,
      ),
    }));
  }

  function handleWeekMediaChange(
    index: number,
    field: keyof AdminWeekMedia,
    value: string | number | null,
  ) {
    updateWeekDetail((current) => ({
      ...current,
      media: current.media.map((entry, currentIndex) =>
        currentIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  }

  async function handleUploadWeekMedia(index: number, file: File) {
    if (!selectedWeekDetail || !selectedWeekNumber) {
      setContentMessage("먼저 주차를 선택해 주세요.");
      return;
    }

    const targetMedia = selectedWeekDetail.media[index];
    if (!targetMedia) {
      return;
    }

    setUploadingMediaIndex(index);
    setContentMessage(null);

    const formData = new FormData();
    formData.set("file", file);
    formData.set("bucketId", targetMedia.bucketId || "pregnancy-content");
    formData.set("mediaScope", targetMedia.mediaScope);
    formData.set("weekNumber", String(selectedWeekNumber));
    if (targetMedia.dayNumber !== null && targetMedia.dayNumber !== undefined) {
      formData.set("dayNumber", String(targetMedia.dayNumber));
    }

    try {
      const response = await fetch("/api/admin/content/media/upload", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        error?: string;
        bucketId?: string;
        objectPath?: string;
        sourceFileName?: string;
      };

      if (!response.ok || !payload.bucketId || !payload.objectPath) {
        throw new Error(payload.error ?? "이미지 업로드에 실패했습니다.");
      }

      updateWeekDetail((current) => ({
        ...current,
        media: current.media.map((media, currentIndex) =>
          currentIndex === index
            ? {
                ...media,
                bucketId: payload.bucketId ?? media.bucketId,
                objectPath: payload.objectPath ?? media.objectPath,
                sourceFileName: payload.sourceFileName ?? media.sourceFileName,
              }
            : media,
        ),
      }));
      setContentMessage("이미지를 업로드했습니다. 주차 저장을 눌러 반영해 주세요.");
    } catch (error) {
      setContentMessage(
        error instanceof Error ? error.message : "이미지 업로드에 실패했습니다.",
      );
    } finally {
      setUploadingMediaIndex(null);
    }
  }

  function handleAddWeekDay() {
    updateWeekDetail((current) => {
      const usedDayNumbers = new Set(current.days.map((day) => day.dayNumber));
      const nextDayNumber =
        [1, 2, 3, 4, 5, 6, 7].find((dayNumber) => !usedDayNumbers.has(dayNumber)) ??
        current.days.length + 1;

      if (nextDayNumber > 7) {
        return current;
      }

      return {
        ...current,
        days: [
          ...current.days,
          {
            id: "",
            dayNumber: nextDayNumber,
            title: `Day ${nextDayNumber}`,
            babyDevelopmentItems: [],
            babyMessage: null,
            motherChangesItems: [],
            displayOrder: nextDayNumber,
          },
        ],
      };
    });
  }

  function handleAddWeekSection() {
    updateWeekDetail((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: "",
          dayNumber: current.days[0]?.dayNumber ?? null,
          sectionKey: `section_new_${current.sections.length + 1}`,
          title: "",
          body: "",
          displayOrder: current.sections.length + 1,
          isRequired: false,
          isActive: true,
        },
      ],
    }));
  }

  function handleAddWeekAsset() {
    updateWeekDetail((current) => ({
      ...current,
      assets: [
        ...current.assets,
        {
          id: "",
          dayNumber: current.days[0]?.dayNumber ?? null,
          assetType: "illustration",
          storagePath: "",
          altText: null,
          styleKey: null,
          displayOrder: current.assets.length + 1,
          isRequired: false,
          isActive: true,
        },
      ],
    }));
  }

  function handleAddWeekMedia() {
    updateWeekDetail((current) => ({
      ...current,
      media: [
        ...current.media,
        {
          id: "",
          dayNumber: null,
          mediaScope: "week",
          bucketId: "pregnancy-content",
          objectPath: "",
          mediaRole: "reference",
          altText: null,
          sourceFileName: null,
          displayOrder: current.media.length + 1,
        },
      ],
    }));
  }

  function handleMoveWeekDay(index: number, direction: -1 | 1) {
    updateWeekDetail((current) => ({
      ...current,
      days: moveOrderedItem(current.days, index, direction),
    }));
  }

  function handleRemoveWeekDay(index: number) {
    updateWeekDetail((current) => ({
      ...current,
      days: removeOrderedItem(current.days, index),
    }));
  }

  function handleMoveWeekSection(index: number, direction: -1 | 1) {
    updateWeekDetail((current) => ({
      ...current,
      sections: moveOrderedItem(current.sections, index, direction),
    }));
  }

  function handleRemoveWeekSection(index: number) {
    updateWeekDetail((current) => ({
      ...current,
      sections: removeOrderedItem(current.sections, index),
    }));
  }

  function handleMoveWeekAsset(index: number, direction: -1 | 1) {
    updateWeekDetail((current) => ({
      ...current,
      assets: moveOrderedItem(current.assets, index, direction),
    }));
  }

  function handleRemoveWeekAsset(index: number) {
    updateWeekDetail((current) => ({
      ...current,
      assets: removeOrderedItem(current.assets, index),
    }));
  }

  function handleMoveWeekMedia(index: number, direction: -1 | 1) {
    updateWeekDetail((current) => ({
      ...current,
      media: moveOrderedItem(current.media, index, direction),
    }));
  }

  function handleRemoveWeekMedia(index: number) {
    updateWeekDetail((current) => ({
      ...current,
      media: removeOrderedItem(current.media, index),
    }));
  }

  async function handleSaveWeek() {
    if (!selectedWeekDetail || !selectedWeekNumber) {
      return;
    }

    setIsWeekSaving(true);
    setContentMessage(null);

    const response = await fetch(
      `/api/admin/content/weeks/${selectedWeekNumber}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedWeekDetail.title,
          babySizeLabel: selectedWeekDetail.babySizeLabel,
          babySizeCompareObject: selectedWeekDetail.babySizeCompareObject,
          babySummary: selectedWeekDetail.babySummary,
          motherSummary: selectedWeekDetail.motherSummary,
          heroImagePath: selectedWeekDetail.heroImagePath,
          compareImagePath: selectedWeekDetail.compareImagePath,
          status: selectedWeekDetail.status,
          days: sortOrderedItems(selectedWeekDetail.days).map((day) => ({
            id: day.id,
            dayNumber: day.dayNumber,
            title: day.title,
            babyDevelopmentItems: day.babyDevelopmentItems,
            babyMessage: day.babyMessage,
            motherChangesItems: day.motherChangesItems,
            displayOrder: day.displayOrder,
          })),
          sections: sortOrderedItems(selectedWeekDetail.sections).map(
            (section) => ({
              id: section.id,
              dayNumber: section.dayNumber,
              sectionKey: section.sectionKey,
              title: section.title,
              body: section.body,
              displayOrder: section.displayOrder,
              isRequired: section.isRequired,
              isActive: section.isActive,
            }),
          ),
          assets: sortOrderedItems(selectedWeekDetail.assets).map((asset) => ({
            id: asset.id,
            dayNumber: asset.dayNumber,
            assetType: asset.assetType,
            storagePath: asset.storagePath,
            altText: asset.altText,
            styleKey: asset.styleKey,
            displayOrder: asset.displayOrder,
            isRequired: asset.isRequired,
            isActive: asset.isActive,
          })),
          media: sortOrderedItems(selectedWeekDetail.media).map((media) => ({
            id: media.id,
            dayNumber: media.dayNumber,
            mediaScope: media.mediaScope,
            bucketId: media.bucketId,
            objectPath: media.objectPath,
            mediaRole: media.mediaRole,
            altText: media.altText,
            sourceFileName: media.sourceFileName,
            displayOrder: media.displayOrder,
          })),
        }),
      },
    );

    const payload = (await response.json()) as {
      error?: string;
      week?: AdminWeekDetail;
    };
    if (!response.ok || !payload.week) {
      setContentMessage(payload.error ?? "주차 저장에 실패했습니다.");
      setIsWeekSaving(false);
      return;
    }

    setSelectedWeekDetail({
      ...payload.week,
      days: sortOrderedItems(payload.week.days),
      sections: sortOrderedItems(payload.week.sections),
      assets: sortOrderedItems(payload.week.assets),
      media: sortOrderedItems(payload.week.media),
    });
    setWeekSummaries((current) => {
      const nextSummary = mapDetailToSummary(payload.week as AdminWeekDetail);
      return current.map((week) =>
        week.weekNumber === nextSummary.weekNumber ? nextSummary : week,
      );
    });
    setContentMessage(`${payload.week.weekNumber}주차 데이터를 저장했습니다.`);
    setIsWeekSaving(false);
  }

  function syncSelectedKnowledgeItem(id: string) {
    setSelectedKnowledgeItemId(id);
    const nextItem = knowledgeItems.find((item) => item.id === id);
    setKnowledgeSlug(nextItem?.slug ?? "");
    setKnowledgeSection(nextItem?.section ?? "knowledge");
    setKnowledgeTitle(nextItem?.title ?? "");
    setKnowledgeBody(nextItem?.body ?? "");
    setKnowledgeStatus(nextItem?.status ?? "draft");
  }

  async function syncSelectedRagDocument(id: string) {
    setSelectedRagDocumentId(id);
    setContentMessage(null);

    const response = await fetch(
      `/api/admin/rag/documents/${encodeURIComponent(id)}`,
      {
        cache: "no-store",
      },
    );
    const payload = (await response.json()) as {
      error?: string;
      document?: {
        title: string;
        pregnancyWeek: number | null;
        category: string;
        content: string;
      };
    };

    if (!response.ok || !payload.document) {
      setContentMessage(payload.error ?? "문서 상세를 불러오지 못했습니다.");
      return;
    }

    setRagTitle(payload.document.title);
    setRagCategory(payload.document.category);
    setRagWeek(
      payload.document.pregnancyWeek
        ? String(payload.document.pregnancyWeek)
        : "",
    );
    setRagContent(payload.document.content);
  }

  function resetRagDocumentForm() {
    setSelectedRagDocumentId("");
    setRagTitle("");
    setRagCategory("");
    setRagWeek("");
    setRagContent("");
    setContentMessage(null);
  }

  function syncSelectedWorkflowRule(id: string) {
    setSelectedWorkflowRuleId(id);
    const nextRule = workflowRules.find((rule) => rule.id === id);
    setWorkflowName(nextRule?.name ?? "");
    setWorkflowTrigger(nextRule?.trigger ?? "");
    setWorkflowRetrievalScope(nextRule?.retrievalScope ?? "");
    setWorkflowModelName(nextRule?.modelName ?? "");
    setWorkflowStatus(nextRule?.status ?? "review");
  }

  async function handleUploadRagDocument() {
    if (!ragTitle.trim() || !ragCategory.trim() || !ragContent.trim()) {
      setContentMessage("문서 제목, 카테고리, 본문을 모두 입력해 주세요.");
      return;
    }

    setIsRagSubmitting(true);
    setContentMessage(null);

    const isUpdating = Boolean(selectedRagDocumentId);
    const response = await fetch(
      isUpdating
        ? `/api/admin/rag/documents/${encodeURIComponent(selectedRagDocumentId)}`
        : "/api/admin/rag/upload",
      {
        method: isUpdating ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: ragTitle,
          category: ragCategory,
          pregnancyWeek: ragWeek ? Number(ragWeek) : null,
          content: ragContent,
        }),
      },
    );

    const payload = (await response.json()) as {
      error?: string;
      id?: string | null;
      document?: {
        id: string;
        title: string;
        pregnancyWeekLabel: string;
        category: string;
        chunkCount: number;
        updatedAt: string;
        status: "ready" | "draft";
      };
    };
    if (!response.ok) {
      setContentMessage(payload.error ?? "RAG 문서 저장에 실패했습니다.");
      setIsRagSubmitting(false);
      return;
    }

    if (payload.document) {
      setRagDocuments((current) =>
        current.map((document) =>
          document.id === payload.document?.id ? payload.document : document,
        ),
      );
      setContentMessage("RAG 문서를 수정했습니다.");
    } else {
      const nextDocument = {
        id: payload.id ?? `rag-${Date.now()}`,
        title: ragTitle,
        pregnancyWeekLabel: ragWeek ? `${ragWeek}주차` : "공통",
        category: ragCategory,
        chunkCount: 1,
        updatedAt: "방금 전",
        status: "ready" as const,
      };
      setRagDocuments((current) => [nextDocument, ...current]);
      setSelectedRagDocumentId(nextDocument.id);
      setContentMessage("RAG 문서를 업로드했습니다.");
    }
    setIsRagSubmitting(false);
  }

  async function handleDeleteRagDocument() {
    if (!selectedRagDocumentId) {
      setContentMessage("삭제할 문서를 먼저 선택해 주세요.");
      return;
    }

    setIsRagSubmitting(true);
    setContentMessage(null);

    const response = await fetch(
      `/api/admin/rag/documents/${encodeURIComponent(selectedRagDocumentId)}`,
      {
        method: "DELETE",
      },
    );
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setContentMessage(payload.error ?? "RAG 문서 삭제에 실패했습니다.");
      setIsRagSubmitting(false);
      return;
    }

    setRagDocuments((current) =>
      current.filter((document) => document.id !== selectedRagDocumentId),
    );
    resetRagDocumentForm();
    setContentMessage("RAG 문서를 삭제했습니다.");
    setIsRagSubmitting(false);
  }

  async function handleSaveWorkflowRule() {
    if (
      !selectedWorkflowRuleId ||
      !workflowName.trim() ||
      !workflowTrigger.trim() ||
      !workflowRetrievalScope.trim() ||
      !workflowModelName.trim()
    ) {
      setContentMessage("수정할 응답 정책을 선택하고 필수 필드를 모두 입력해 주세요.");
      return;
    }

    setIsWorkflowSaving(true);
    setContentMessage(null);

    const response = await fetch(
      `/api/admin/workflow-rules/${encodeURIComponent(selectedWorkflowRuleId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          trigger: workflowTrigger,
          retrievalScope: workflowRetrievalScope,
          modelName: workflowModelName,
          status: workflowStatus,
        }),
      },
    );
    const payload = (await response.json()) as {
      error?: string;
      workflowRule?: AdminWorkflowRule;
    };
    if (!response.ok || !payload.workflowRule) {
      setContentMessage(payload.error ?? "응답 정책 저장에 실패했습니다.");
      setIsWorkflowSaving(false);
      return;
    }

    setWorkflowRules((current) =>
      current.map((rule) =>
        rule.id === payload.workflowRule?.id
          ? (payload.workflowRule as AdminWorkflowRule)
          : rule,
      ),
    );
    setSelectedWorkflowRuleId(payload.workflowRule.id);
    setWorkflowName(payload.workflowRule.name);
    setWorkflowTrigger(payload.workflowRule.trigger);
    setWorkflowRetrievalScope(payload.workflowRule.retrievalScope);
    setWorkflowModelName(payload.workflowRule.modelName);
    setWorkflowStatus(payload.workflowRule.status);
    setContentMessage("응답 정책을 저장했습니다.");
    setIsWorkflowSaving(false);
  }

  async function handleCreateKnowledgeItem() {
    if (!knowledgeSlug.trim() || !knowledgeTitle.trim() || !knowledgeBody.trim()) {
      setContentMessage("슬러그, 제목, 본문을 모두 입력해 주세요.");
      return;
    }

    setIsKnowledgeSaving(true);
    setContentMessage(null);

    const response = await fetch("/api/admin/content/knowledge-items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: knowledgeSlug,
        section: knowledgeSection,
        title: knowledgeTitle,
        body: knowledgeBody,
        status: knowledgeStatus,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      knowledgeItem?: AdminKnowledgeItem;
    };

    if (!response.ok || !payload.knowledgeItem) {
      setContentMessage(payload.error ?? "지식 문서 생성에 실패했습니다.");
      setIsKnowledgeSaving(false);
      return;
    }

    setKnowledgeItems((current) => [
      payload.knowledgeItem as AdminKnowledgeItem,
      ...current.filter((item) => item.id !== payload.knowledgeItem?.id),
    ]);
    setSelectedKnowledgeItemId(payload.knowledgeItem.id);
    setContentMessage("지식 문서를 생성했습니다.");
    setIsKnowledgeSaving(false);
  }

  async function handleUpdateKnowledgeItem() {
    if (
      !selectedKnowledgeItemId ||
      !knowledgeSlug.trim() ||
      !knowledgeTitle.trim() ||
      !knowledgeBody.trim()
    ) {
      setContentMessage("수정할 문서를 선택하고 슬러그, 제목, 본문을 모두 입력해 주세요.");
      return;
    }

    setIsKnowledgeSaving(true);
    setContentMessage(null);

    const response = await fetch(
      `/api/admin/content/knowledge-items/${encodeURIComponent(selectedKnowledgeItemId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: knowledgeSlug,
          section: knowledgeSection,
          title: knowledgeTitle,
          body: knowledgeBody,
          status: knowledgeStatus,
        }),
      },
    );

    const payload = (await response.json()) as {
      error?: string;
      knowledgeItem?: AdminKnowledgeItem;
    };

    if (!response.ok || !payload.knowledgeItem) {
      setContentMessage(payload.error ?? "지식 문서 수정에 실패했습니다.");
      setIsKnowledgeSaving(false);
      return;
    }

    setKnowledgeItems((current) =>
      current.map((item) =>
        item.id === payload.knowledgeItem?.id
          ? (payload.knowledgeItem as AdminKnowledgeItem)
          : item,
      ),
    );
    setContentMessage("지식 문서를 수정했습니다.");
    setIsKnowledgeSaving(false);
  }

  async function handleDeleteKnowledgeItem() {
    if (!selectedKnowledgeItemId) {
      setContentMessage("삭제할 문서를 먼저 선택해 주세요.");
      return;
    }

    setIsKnowledgeSaving(true);
    setContentMessage(null);

    const response = await fetch(
      `/api/admin/content/knowledge-items/${encodeURIComponent(selectedKnowledgeItemId)}`,
      {
        method: "DELETE",
      },
    );

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setContentMessage(payload.error ?? "지식 문서 삭제에 실패했습니다.");
      setIsKnowledgeSaving(false);
      return;
    }

    const nextKnowledgeItems = knowledgeItems.filter(
      (item) => item.id !== selectedKnowledgeItemId,
    );
    setKnowledgeItems(nextKnowledgeItems);
    const nextItem = nextKnowledgeItems[0];
    setSelectedKnowledgeItemId(nextItem?.id ?? "");
    setKnowledgeSlug(nextItem?.slug ?? "");
    setKnowledgeSection(nextItem?.section ?? "knowledge");
    setKnowledgeTitle(nextItem?.title ?? "");
    setKnowledgeBody(nextItem?.body ?? "");
    setKnowledgeStatus(nextItem?.status ?? "draft");
    setContentMessage("지식 문서를 삭제했습니다.");
    setIsKnowledgeSaving(false);
  }

  return {
    knowledgeItems,
    selectedKnowledgeItemId,
    knowledgeSlug,
    knowledgeSection,
    knowledgeTitle,
    knowledgeBody,
    knowledgeStatus,
    ragDocuments,
    selectedRagDocumentId,
    ragTitle,
    ragCategory,
    ragWeek,
    ragContent,
    workflowRules,
    selectedWorkflowRuleId,
    workflowName,
    workflowTrigger,
    workflowRetrievalScope,
    workflowModelName,
    workflowStatus,
    contentMessage,
    isRagSubmitting,
    isKnowledgeSaving,
    isWorkflowSaving,
    isWeekSaving,
    weekSummaries,
    selectedWeekNumber,
    selectedWeekDetail,
    isLoadingWeeks,
    uploadingMediaIndex,
    syncSelectedKnowledgeItem,
    syncSelectedRagDocument,
    resetRagDocumentForm,
    syncSelectedWorkflowRule,
    setKnowledgeSlug,
    setKnowledgeSection,
    setKnowledgeTitle,
    setKnowledgeBody,
    setKnowledgeStatus,
    setRagTitle,
    setRagCategory,
    setRagWeek,
    setRagContent,
    setWorkflowName,
    setWorkflowTrigger,
    setWorkflowRetrievalScope,
    setWorkflowModelName,
    setWorkflowStatus,
    handleCreateKnowledgeItem,
    handleUpdateKnowledgeItem,
    handleDeleteKnowledgeItem,
    handleUploadRagDocument,
    handleDeleteRagDocument,
    handleSaveWorkflowRule,
    handleSelectWeek,
    handleWeekFieldChange,
    handleWeekStatusChange,
    handleWeekSectionChange,
    handleWeekAssetChange,
    handleWeekDayChange,
    handleWeekMediaChange,
    handleUploadWeekMedia,
    handleAddWeekDay,
    handleAddWeekSection,
    handleAddWeekAsset,
    handleAddWeekMedia,
    handleMoveWeekDay,
    handleMoveWeekSection,
    handleMoveWeekAsset,
    handleMoveWeekMedia,
    handleRemoveWeekDay,
    handleRemoveWeekSection,
    handleRemoveWeekAsset,
    handleRemoveWeekMedia,
    handleSaveWeek,
  };
}
