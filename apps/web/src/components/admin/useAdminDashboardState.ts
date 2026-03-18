"use client";

import type {
  AdminDashboardData,
  AdminWeekAsset,
  AdminWeekDetail,
  AdminWeekSection,
  AdminWeekSummary,
} from "@gynecology-chatbot/app-core";
import { useEffect, useMemo, useState } from "react";

type OrderedItem = { displayOrder: number };

function sortOrderedItems<T extends OrderedItem>(items: T[]) {
  return [...items].sort((left, right) => {
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

export function useAdminDashboardState(dashboard: AdminDashboardData) {
  const [managedUsers, setManagedUsers] = useState(dashboard.managedUsers);
  const [focusedUserId, setFocusedUserId] = useState(
    dashboard.historyUsers[0]?.id ?? dashboard.managedUsers[0]?.id ?? "",
  );
  const [selectedUserId, setSelectedUserId] = useState(
    dashboard.managedUsers[0]?.id ?? "",
  );
  const [phoneNumber, setPhoneNumber] = useState(
    dashboard.managedUsers[0]?.phoneNumber ?? "",
  );
  const [reason, setReason] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);
  const [isRagSubmitting, setIsRagSubmitting] = useState(false);
  const [ragDocuments, setRagDocuments] = useState(dashboard.ragDocuments);
  const [ragTitle, setRagTitle] = useState("");
  const [ragCategory, setRagCategory] = useState("");
  const [ragWeek, setRagWeek] = useState("");
  const [ragContent, setRagContent] = useState("");
  const [contentMessage, setContentMessage] = useState<string | null>(null);
  const [isWeekSaving, setIsWeekSaving] = useState(false);
  const [weekSummaries, setWeekSummaries] = useState<AdminWeekSummary[]>([]);
  const [selectedWeekNumber, setSelectedWeekNumber] = useState<number | null>(
    null,
  );
  const [selectedWeekDetail, setSelectedWeekDetail] =
    useState<AdminWeekDetail | null>(null);
  const [isLoadingWeeks, setIsLoadingWeeks] = useState(false);

  const focusedHistoryUser = useMemo(
    () =>
      dashboard.historyUsers.find((user) => user.id === focusedUserId) ??
      dashboard.historyUsers[0],
    [dashboard.historyUsers, focusedUserId],
  );
  const focusedUserActions = useMemo(
    () =>
      dashboard.userActions
        .filter((action) => action.userId === focusedHistoryUser?.id)
        .slice(0, 8),
    [dashboard.userActions, focusedHistoryUser?.id],
  );
  const attentionUserCount = useMemo(
    () => managedUsers.filter((user) => user.status === "attention").length,
    [managedUsers],
  );
  const readyDocumentCount = useMemo(
    () => ragDocuments.filter((document) => document.status === "ready").length,
    [ragDocuments],
  );

  useEffect(() => {
    let cancelled = false;

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

    void loadWeeks();

    return () => {
      cancelled = true;
    };
  }, []);

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
        sections: sortOrderedItems(payload.week.sections),
        assets: sortOrderedItems(payload.week.assets),
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
    value: string | number | boolean,
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
    value: string | number | null,
  ) {
    updateWeekDetail((current) => ({
      ...current,
      assets: current.assets.map((asset, currentIndex) =>
        currentIndex === index ? { ...asset, [field]: value } : asset,
      ),
    }));
  }

  function handleAddWeekSection() {
    updateWeekDetail((current) => ({
      ...current,
      sections: [
        ...current.sections,
        {
          id: "",
          sectionKey: `section_new_${current.sections.length + 1}`,
          title: "",
          body: "",
          displayOrder: current.sections.length + 1,
          isRequired: false,
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
          assetType: "illustration",
          storagePath: "",
          altText: null,
          styleKey: null,
          displayOrder: current.assets.length + 1,
        },
      ],
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
          sections: sortOrderedItems(selectedWeekDetail.sections).map(
            (section) => ({
              id: section.id,
              sectionKey: section.sectionKey,
              title: section.title,
              body: section.body,
              displayOrder: section.displayOrder,
              isRequired: section.isRequired,
            }),
          ),
          assets: sortOrderedItems(selectedWeekDetail.assets).map((asset) => ({
            id: asset.id,
            assetType: asset.assetType,
            storagePath: asset.storagePath,
            altText: asset.altText,
            styleKey: asset.styleKey,
            displayOrder: asset.displayOrder,
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
      sections: sortOrderedItems(payload.week.sections),
      assets: sortOrderedItems(payload.week.assets),
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

  function syncSelectedUser(userId: string) {
    setSelectedUserId(userId);
    const nextUser = managedUsers.find((user) => user.id === userId);
    setPhoneNumber(nextUser?.phoneNumber ?? "");
  }

  async function handleUpdatePhoneNumber() {
    setIsAccountSubmitting(true);
    setActionMessage(null);

    const response = await fetch("/api/admin/users/update-phone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: selectedUserId, phoneNumber, reason }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setActionMessage(payload.error ?? "전화번호 변경에 실패했습니다.");
      setIsAccountSubmitting(false);
      return;
    }

    setManagedUsers((current) =>
      current.map((user) =>
        user.id === selectedUserId
          ? { ...user, phoneNumber, latestIssue: "전화번호 변경 완료" }
          : user,
      ),
    );
    setReason("");
    setActionMessage("전화번호를 변경했습니다.");
    setIsAccountSubmitting(false);
  }

  async function handleResetPassword() {
    setIsAccountSubmitting(true);
    setActionMessage(null);

    const response = await fetch("/api/admin/users/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUserId,
        reason: reason || "운영자 수동 초기화",
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setActionMessage(payload.error ?? "비밀번호 초기화에 실패했습니다.");
      setIsAccountSubmitting(false);
      return;
    }

    setManagedUsers((current) =>
      current.map((user) =>
        user.id === selectedUserId
          ? { ...user, latestIssue: "비밀번호 초기화 요청 처리" }
          : user,
      ),
    );
    setReason("");
    setActionMessage("비밀번호 초기화 요청을 처리했습니다.");
    setIsAccountSubmitting(false);
  }

  async function handleUploadRagDocument() {
    setIsRagSubmitting(true);
    setActionMessage(null);

    const response = await fetch("/api/admin/rag/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: ragTitle,
        category: ragCategory,
        pregnancyWeek: ragWeek ? Number(ragWeek) : null,
        content: ragContent,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      id?: string | null;
    };
    if (!response.ok) {
      setActionMessage(payload.error ?? "RAG 문서 업로드에 실패했습니다.");
      setIsRagSubmitting(false);
      return;
    }

    setRagDocuments((current) => [
      {
        id: payload.id ?? `rag-${Date.now()}`,
        title: ragTitle,
        pregnancyWeekLabel: ragWeek ? `${ragWeek}주차` : "공통",
        category: ragCategory,
        chunkCount: 1,
        updatedAt: "방금 전",
        status: "ready",
      },
      ...current,
    ]);
    setRagTitle("");
    setRagCategory("");
    setRagWeek("");
    setRagContent("");
    setContentMessage("RAG 문서를 업로드했습니다.");
    setIsRagSubmitting(false);
  }

  return {
    managedUsers,
    focusedHistoryUser,
    focusedUserActions,
    selectedUserId,
    phoneNumber,
    reason,
    actionMessage,
    contentMessage,
    isAccountSubmitting,
    isRagSubmitting,
    isWeekSaving,
    ragDocuments,
    ragTitle,
    ragCategory,
    ragWeek,
    ragContent,
    weekSummaries,
    selectedWeekNumber,
    selectedWeekDetail,
    isLoadingWeeks,
    attentionUserCount,
    readyDocumentCount,
    setFocusedUserId,
    syncSelectedUser,
    setPhoneNumber,
    setReason,
    handleUpdatePhoneNumber,
    handleResetPassword,
    setRagTitle,
    setRagCategory,
    setRagWeek,
    setRagContent,
    handleUploadRagDocument,
    handleSelectWeek,
    handleWeekFieldChange,
    handleWeekStatusChange,
    handleWeekSectionChange,
    handleWeekAssetChange,
    handleAddWeekSection,
    handleAddWeekAsset,
    handleMoveWeekSection,
    handleMoveWeekAsset,
    handleRemoveWeekSection,
    handleRemoveWeekAsset,
    handleSaveWeek,
  };
}
