// @ts-nocheck
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMobilePregnancyWeekDayLabel } from "@gynecology-chatbot/app-core";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import {
  readCurrentMobileSessionToken,
  readCurrentMobileUserId,
  RateLimitError,
  SessionExpiredError,
} from "../../api/mobileApi";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";

type LexiconItem = {
  id: string;
  title: string;
  week: number | null;
  day: number | null;
  surface: string | null;
  snippet: string;
};

type LexiconResponse = {
  items: LexiconItem[];
};

type FetchState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; items: LexiconItem[] }
  | { kind: "error"; message: string };

const WEEK_OPTIONS: { label: string; value: number | null }[] = [
  { label: "전체", value: null },
  ...Array.from({ length: 36 }, (_, i) => ({
    label: `${i + 5}주차`,
    value: i + 5,
  })),
];

function resolveItemMeta(item: LexiconItem) {
  if (item.surface === "week_overview") return "주차 개요";
  if (item.surface === "week_day" && typeof item.day === "number") {
    return typeof item.week === "number"
      ? formatMobilePregnancyWeekDayLabel(item.week, item.day)
      : `${Math.max(0, item.day - 1)}일`;
  }
  if (item.surface === "week_day") return "일차 자료";
  return "자료";
}

function resolveApiBaseUrl() {
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://agaya-api-yvdnhntt7a-du.a.run.app"
  ).replace(/\/$/, "");
}

async function fetchLexicon(input: {
  week: number | null;
}): Promise<LexiconResponse> {
  const token = readCurrentMobileSessionToken();
  if (!token) {
    throw new SessionExpiredError("세션이 만료되었어요. 다시 로그인해 주세요.");
  }
  const userId = readCurrentMobileUserId();
  const params = new URLSearchParams();
  if (typeof input.week === "number") params.set("week", String(input.week));
  if (userId) params.set("userId", userId);

  const qs = params.toString();
  const url = `${resolveApiBaseUrl()}/api/mobile/lexicon${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<
    LexiconResponse & { error: string }
  >;

  if (!response.ok) {
    if (response.status === 401) {
      throw new SessionExpiredError(
        payload.error ?? "세션이 만료되었어요. 다시 로그인해 주세요.",
      );
    }
    if (response.status === 429) {
      throw new RateLimitError(payload.error ?? "잠시 후 다시 시도해 주세요.");
    }
    throw new Error(payload.error ?? "사전 자료를 불러오지 못했어요.");
  }

  return {
    items: Array.isArray(payload.items)
      ? payload.items.filter(
          (item): item is LexiconItem =>
            !!item &&
            typeof item.id === "string" &&
            typeof item.title === "string",
        )
      : [],
  };
}

export function groupItemsByWeek(items: LexiconItem[]) {
  const groups = new Map<number | "none", LexiconItem[]>();
  items.forEach((item) => {
    const key = typeof item.week === "number" ? item.week : "none";
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  });
  return Array.from(groups.entries())
    .sort(([a], [b]) => {
      if (a === "none") return 1;
      if (b === "none") return -1;
      return (a as number) - (b as number);
    })
    .map(([key, list]) => ({
      key,
      label: key === "none" ? "주차 없음" : `${key}주차`,
      items: list,
    }));
}

export function PatientLexiconBrowseScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [state, setState] = useState<FetchState>({ kind: "idle" });
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [searchText, setSearchText] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const load = useCallback(async (week: number | null) => {
    setState({ kind: "loading" });
    try {
      const data = await fetchLexicon({ week });
      setState({ kind: "success", items: data.items });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "사전 자료를 불러오지 못했어요.";
      setState({ kind: "error", message });
    }
  }, []);

  useEffect(() => {
    void load(selectedWeek);
  }, [load, selectedWeek]);

  const filteredItems = useMemo(() => {
    if (state.kind !== "success") return [] as LexiconItem[];
    const q = searchText.trim().toLowerCase();
    if (!q) return state.items;
    return state.items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.snippet.toLowerCase().includes(q),
    );
  }, [state, searchText]);

  const groups = useMemo(
    () => groupItemsByWeek(filteredItems),
    [filteredItems],
  );

  const contentPadding = {
    paddingTop: space.md,
    paddingBottom: Math.max(insets.bottom + space.xl, space.xxxl),
  };

  return (
    <PatientShell
      title="사전"
      backHref="/(tabs)/profile"
      pageTone="plain"
      headerCompact
    >
      <ScrollView
        contentContainerStyle={[styles.content, contentPadding]}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>주차별 자료</Text>
        <Text style={styles.heading}>사전</Text>
        <Text style={styles.description}>
          몸의 변화와 아기의 성장을 차분히 확인해요.
        </Text>

        <Card style={styles.filterCard}>
          <Text style={styles.filterLabel}>주차 선택</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.weekChipsRow}
          >
            {WEEK_OPTIONS.map((option) => {
              const active = option.value === selectedWeek;
              return (
                <Pressable
                  key={option.label}
                  onPress={() => setSelectedWeek(option.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`${option.label} 보기`}
                  style={[
                    styles.weekChip,
                    active ? styles.weekChipActive : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekChipLabel,
                      active ? styles.weekChipLabelActive : null,
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.filterLabel}>검색</Text>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="제목이나 내용으로 검색해요"
            placeholderTextColor={surface.textSecondary}
            style={styles.searchInput}
            selectionColor={surface.accentSolid}
            underlineColorAndroid="transparent"
            autoCorrect={false}
            accessibilityLabel="사전 검색 입력창"
          />
        </Card>

        {state.kind === "loading" ? (
          <Card style={styles.statusCard}>
            <ActivityIndicator color={palette.accent} />
            <Text style={styles.statusText}>자료를 불러오고 있어요...</Text>
          </Card>
        ) : null}

        {state.kind === "error" ? (
          <Card variant="accent" style={styles.statusCard}>
            <Text style={styles.errorTitle}>잠시 문제가 생겼어요</Text>
            <Text style={styles.statusText}>{state.message}</Text>
            <Pressable
              onPress={() => load(selectedWeek)}
              accessibilityRole="button"
              style={styles.retryButton}
            >
              <Text style={styles.retryLabel}>다시 시도</Text>
            </Pressable>
          </Card>
        ) : null}

        {state.kind === "success" && groups.length === 0 ? (
          <Card>
            <Text style={styles.emptyTitle}>찾는 자료가 없어요</Text>
            <Text style={styles.statusText}>
              다른 주차나 검색어로 다시 찾아보세요.
            </Text>
          </Card>
        ) : null}

        {state.kind === "success"
          ? groups.map((group) => {
              const groupKey = String(group.key);
              const isCollapsed = collapsed[groupKey] ?? false;
              return (
                <Card key={groupKey} style={styles.groupCard}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${group.label} ${isCollapsed ? "펼치기" : "접기"}`}
                    onPress={() =>
                      setCollapsed((prev) => ({
                        ...prev,
                        [groupKey]: !isCollapsed,
                      }))
                    }
                    style={styles.groupHeader}
                  >
                    <Text style={styles.groupTitle}>{group.label}</Text>
                    <Text style={styles.groupChevron}>
                      {isCollapsed ? "▸" : "▾"} {group.items.length}개
                    </Text>
                  </Pressable>
                  {!isCollapsed ? (
                    <View style={styles.groupItems}>
                      {group.items.map((item) => (
                        <Pressable
                          key={item.id}
                          onPress={() =>
                            router.push(`/lexicon/${item.id}` as never)
                          }
                          accessibilityRole="button"
                          accessibilityLabel={`${item.title} 자세히 보기`}
                          style={styles.itemRow}
                        >
                          <View style={styles.itemHeader}>
                            <Text style={styles.itemTitle}>{item.title}</Text>
                            <View style={styles.itemBadge}>
                              <Text style={styles.itemBadgeText}>
                                {resolveItemMeta(item)}
                              </Text>
                            </View>
                          </View>
                          {item.snippet ? (
                            <Text style={styles.itemSnippet} numberOfLines={3}>
                              {item.snippet}
                            </Text>
                          ) : null}
                        </Pressable>
                      ))}
                    </View>
                  ) : null}
                </Card>
              );
            })
          : null}
      </ScrollView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    gap: space.lg,
  },
  eyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  heading: {
    ...typo.titleLg,
    color: surface.textPrimary,
    marginTop: space.xs,
  },
  description: {
    ...typo.body,
    color: surface.textSecondary,
  },
  filterCard: {
    gap: space.sm,
  },
  filterLabel: {
    ...typo.label,
    color: surface.textSecondary,
  },
  weekChipsRow: {
    gap: space.xs,
    paddingVertical: space.xs,
  },
  weekChip: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.full,
    backgroundColor: surface.fieldSurface,
    marginRight: space.xs,
  },
  weekChipActive: {
    backgroundColor: surface.accentSolid,
  },
  weekChipLabel: {
    ...typo.label,
    color: surface.textSecondary,
  },
  weekChipLabelActive: {
    color: surface.surfacePrimary,
  },
  searchInput: {
    borderRadius: radii.md,
    backgroundColor: surface.fieldSurface,
    padding: space.md,
    ...typo.body,
    color: surface.textPrimary,
  },
  statusCard: {
    alignItems: "center",
    gap: space.sm,
  },
  statusText: {
    ...typo.body,
    color: surface.textSecondary,
    textAlign: "center",
  },
  errorTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  retryButton: {
    paddingHorizontal: space.md,
    paddingVertical: space.xs,
    borderRadius: radii.md,
    backgroundColor: surface.accentSolid,
  },
  retryLabel: {
    ...typo.label,
    color: surface.surfacePrimary,
  },
  emptyTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  groupCard: {
    gap: space.sm,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  groupTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  groupChevron: {
    ...typo.label,
    color: surface.textSecondary,
  },
  groupItems: {
    gap: space.sm,
    marginTop: space.xs,
  },
  itemRow: {
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    borderRadius: radii.md,
    backgroundColor: surface.fieldSurface,
    gap: space.xs,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: space.sm,
  },
  itemTitle: {
    ...typo.label,
    color: surface.textPrimary,
    flex: 1,
  },
  itemBadge: {
    borderRadius: radii.full,
    backgroundColor: surface.surfacePrimary,
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
  },
  itemBadgeText: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  itemSnippet: {
    ...typo.caption,
    color: surface.textSecondary,
  },
});
