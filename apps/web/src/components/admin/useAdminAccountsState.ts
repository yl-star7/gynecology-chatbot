"use client";

import { useEffect, useState } from "react";

import type {
  AdminAllowedPhoneNumber,
  AdminDashboardData,
} from "@gynecology-chatbot/app-core";

export function useAdminAccountsState(
  dashboard: AdminDashboardData,
  initialSelectedUserId?: string,
  initialSelectedAllowedPhoneId?: string,
) {
  const [managedUsers, setManagedUsers] = useState(dashboard.managedUsers);
  const [selectedUserId, setSelectedUserId] = useState(
    initialSelectedUserId &&
      dashboard.managedUsers.some((user) => user.id === initialSelectedUserId)
      ? initialSelectedUserId
      : (dashboard.managedUsers[0]?.id ?? ""),
  );
  const [phoneNumber, setPhoneNumber] = useState(
    dashboard.managedUsers.find((user) => user.id === initialSelectedUserId)
      ?.phoneNumber ??
      dashboard.managedUsers[0]?.phoneNumber ??
      "",
  );
  const [reason, setReason] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isAccountSubmitting, setIsAccountSubmitting] = useState(false);
  const [allowedPhoneNumbers, setAllowedPhoneNumbers] = useState<
    AdminAllowedPhoneNumber[]
  >([]);
  const [selectedAllowedPhoneId, setSelectedAllowedPhoneId] = useState("");
  const [allowedPhoneNumber, setAllowedPhoneNumber] = useState("");
  const [allowedDisplayName, setAllowedDisplayName] = useState("");
  const [allowedNote, setAllowedNote] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAllowedPhoneNumbers() {
      try {
        const response = await fetch("/api/admin/allowed-phone-numbers");
        const payload = (await response.json()) as {
          error?: string;
          allowedPhoneNumbers?: AdminAllowedPhoneNumber[];
        };

        if (!response.ok) {
          throw new Error(
            payload.error ?? "허용 전화번호 목록을 불러오지 못했습니다.",
          );
        }

        if (cancelled) {
          return;
        }

        const nextAllowedPhoneNumbers = payload.allowedPhoneNumbers ?? [];
        setAllowedPhoneNumbers(nextAllowedPhoneNumbers);

        const initialEntry = initialSelectedAllowedPhoneId
          ? nextAllowedPhoneNumbers.find(
              (entry) => entry.id === initialSelectedAllowedPhoneId,
            )
          : null;
        const firstEntry = initialEntry ?? nextAllowedPhoneNumbers[0];
        if (firstEntry) {
          setSelectedAllowedPhoneId(firstEntry.id);
          setAllowedPhoneNumber(firstEntry.phoneNumber);
          setAllowedDisplayName(firstEntry.displayName ?? "");
          setAllowedNote(firstEntry.note ?? "");
        }
      } catch (error) {
        if (!cancelled) {
          setActionMessage(
            error instanceof Error
              ? error.message
              : "허용 전화번호 목록을 불러오지 못했습니다.",
          );
        }
      }
    }

    void loadAllowedPhoneNumbers();

    return () => {
      cancelled = true;
    };
  }, [initialSelectedAllowedPhoneId]);

  function syncSelectedUser(userId: string) {
    setSelectedUserId(userId);
    const nextUser = managedUsers.find((user) => user.id === userId);
    setPhoneNumber(nextUser?.phoneNumber ?? "");
  }

  function syncSelectedAllowedPhone(id: string) {
    setSelectedAllowedPhoneId(id);
    const nextEntry = allowedPhoneNumbers.find((entry) => entry.id === id);
    setAllowedPhoneNumber(nextEntry?.phoneNumber ?? "");
    setAllowedDisplayName(nextEntry?.displayName ?? "");
    setAllowedNote(nextEntry?.note ?? "");
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

  async function handleResetSession() {
    setIsAccountSubmitting(true);
    setActionMessage(null);

    const response = await fetch("/api/admin/users/reset-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: selectedUserId,
        reason: reason || "운영자 수동 초기화",
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setActionMessage(payload.error ?? "세션 초기화에 실패했습니다.");
      setIsAccountSubmitting(false);
      return;
    }

    setManagedUsers((current) =>
      current.map((user) =>
        user.id === selectedUserId
          ? { ...user, latestIssue: "세션 초기화 요청 처리" }
          : user,
      ),
    );
    setReason("");
    setActionMessage("세션 초기화 요청을 처리했습니다.");
    setIsAccountSubmitting(false);
  }

  async function updateUserStatus(
    userId: string,
    status: "active" | "paused",
    action: "approve" | "reject" | "pause" | "resume",
  ) {
    setIsAccountSubmitting(true);
    setActionMessage(null);

    const actionReason =
      reason ||
      (action === "approve"
        ? "운영자 가입 승인"
        : action === "reject"
          ? "운영자 가입 거절"
          : action === "pause"
            ? "운영자 수동 사용 중단"
            : "운영자 수동 사용 재개");

    const response = await fetch("/api/admin/users/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        status,
        reason: actionReason,
      }),
    });

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setActionMessage(
        payload.error ??
          (action === "approve"
            ? "사용 승인 처리에 실패했습니다."
            : action === "reject"
              ? "가입 거절 처리에 실패했습니다."
              : status === "paused"
                ? "사용 중단 처리에 실패했습니다."
                : "사용 재개 처리에 실패했습니다."),
      );
      setIsAccountSubmitting(false);
      return;
    }

    setManagedUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? {
              ...user,
              status: status === "paused" ? "paused" : "active",
              accountStatus: status,
              latestIssue:
                action === "approve"
                  ? "사용 승인 완료"
                  : action === "reject"
                    ? "가입 거절 완료"
                    : status === "paused"
                      ? "사용 중단 처리 완료"
                      : "사용 재개 처리 완료",
            }
          : user,
      ),
    );
    setReason("");
    setActionMessage(
      action === "approve"
        ? "사용자 이용을 승인했습니다."
        : action === "reject"
          ? "사용자 가입을 거절했습니다."
          : status === "paused"
            ? "사용자 이용을 잠시 중단했습니다."
            : "사용자 이용을 다시 열었습니다.",
    );
    setIsAccountSubmitting(false);
  }

  async function handleCreateAllowedPhoneNumber() {
    if (!allowedPhoneNumber.trim()) {
      setActionMessage("허용할 전화번호를 먼저 입력해 주세요.");
      return;
    }

    setIsAccountSubmitting(true);
    setActionMessage(null);

    const response = await fetch("/api/admin/allowed-phone-numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber: allowedPhoneNumber,
        displayName: allowedDisplayName,
        note: allowedNote,
      }),
    });

    const payload = (await response.json()) as {
      error?: string;
      allowedPhoneNumber?: AdminAllowedPhoneNumber;
    };

    if (!response.ok || !payload.allowedPhoneNumber) {
      setActionMessage(payload.error ?? "허용 전화번호 추가에 실패했습니다.");
      setIsAccountSubmitting(false);
      return;
    }

    setAllowedPhoneNumbers((current) => [
      payload.allowedPhoneNumber as AdminAllowedPhoneNumber,
      ...current.filter((entry) => entry.id !== payload.allowedPhoneNumber?.id),
    ]);
    setSelectedAllowedPhoneId(payload.allowedPhoneNumber.id);
    setAllowedPhoneNumber(payload.allowedPhoneNumber.phoneNumber);
    setAllowedDisplayName(payload.allowedPhoneNumber.displayName ?? "");
    setAllowedNote(payload.allowedPhoneNumber.note ?? "");
    setActionMessage("허용 전화번호를 추가했습니다.");
    setIsAccountSubmitting(false);
  }

  async function handleUpdateAllowedPhoneNumber() {
    if (!selectedAllowedPhoneId || !allowedPhoneNumber.trim()) {
      setActionMessage("수정할 허용 전화번호를 선택해 주세요.");
      return;
    }

    setIsAccountSubmitting(true);
    setActionMessage(null);

    const response = await fetch(
      `/api/admin/allowed-phone-numbers/${encodeURIComponent(selectedAllowedPhoneId)}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: allowedPhoneNumber,
          displayName: allowedDisplayName,
          note: allowedNote,
        }),
      },
    );

    const payload = (await response.json()) as {
      error?: string;
      allowedPhoneNumber?: AdminAllowedPhoneNumber;
    };

    if (!response.ok || !payload.allowedPhoneNumber) {
      setActionMessage(payload.error ?? "허용 전화번호 수정에 실패했습니다.");
      setIsAccountSubmitting(false);
      return;
    }

    setAllowedPhoneNumbers((current) =>
      current.map((entry) =>
        entry.id === payload.allowedPhoneNumber?.id
          ? (payload.allowedPhoneNumber as AdminAllowedPhoneNumber)
          : entry,
      ),
    );
    setActionMessage("허용 전화번호를 수정했습니다.");
    setIsAccountSubmitting(false);
  }

  async function handleDeleteAllowedPhoneNumber() {
    if (!selectedAllowedPhoneId) {
      setActionMessage("삭제할 허용 전화번호를 먼저 선택해 주세요.");
      return;
    }

    setIsAccountSubmitting(true);
    setActionMessage(null);

    const response = await fetch(
      `/api/admin/allowed-phone-numbers/${encodeURIComponent(selectedAllowedPhoneId)}`,
      {
        method: "DELETE",
      },
    );

    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setActionMessage(payload.error ?? "허용 전화번호 삭제에 실패했습니다.");
      setIsAccountSubmitting(false);
      return;
    }

    const nextAllowedPhoneNumbers = allowedPhoneNumbers.filter(
      (entry) => entry.id !== selectedAllowedPhoneId,
    );
    setAllowedPhoneNumbers(nextAllowedPhoneNumbers);
    const nextEntry = nextAllowedPhoneNumbers[0];
    setSelectedAllowedPhoneId(nextEntry?.id ?? "");
    setAllowedPhoneNumber(nextEntry?.phoneNumber ?? "");
    setAllowedDisplayName(nextEntry?.displayName ?? "");
    setAllowedNote(nextEntry?.note ?? "");
    setActionMessage("허용 전화번호를 삭제했습니다.");
    setIsAccountSubmitting(false);
  }

  return {
    managedUsers,
    selectedUserId,
    phoneNumber,
    reason,
    actionMessage,
    isAccountSubmitting,
    allowedPhoneNumbers,
    selectedAllowedPhoneId,
    allowedPhoneNumber,
    allowedDisplayName,
    allowedNote,
    syncSelectedUser,
    setPhoneNumber,
    setReason,
    syncSelectedAllowedPhone,
    setAllowedPhoneNumber,
    setAllowedDisplayName,
    setAllowedNote,
    handleUpdatePhoneNumber,
    handleResetSession,
    handlePauseUser: () => updateUserStatus(selectedUserId, "paused", "pause"),
    handleResumeUser: () =>
      updateUserStatus(selectedUserId, "active", "resume"),
    handleApproveUser: (userId: string) =>
      updateUserStatus(userId, "active", "approve"),
    handleRejectUser: (userId: string) =>
      updateUserStatus(userId, "paused", "reject"),
    handleCreateAllowedPhoneNumber,
    handleUpdateAllowedPhoneNumber,
    handleDeleteAllowedPhoneNumber,
  };
}
