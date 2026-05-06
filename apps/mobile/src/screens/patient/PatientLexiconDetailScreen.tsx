// @ts-nocheck
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatMobilePregnancyWeekDayLabel } from "@gynecology-chatbot/app-core";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Card } from "../../components/ui";
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
  space,
  typo,
} from "../../theme";

type LexiconDetail = {
  id: string;
  title: string;
  week: number | null;
  day: number | null;
  surface: string | null;
  snippet: string;
  content: string;
};

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; data: LexiconDetail }
  | { kind: "error"; message: string };

function resolveApiBaseUrl() {
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL ?? "https://agaya-api-yvdnhntt7a-du.a.run.app"
  ).replace(/\/$/, "");
}

async function fetchLexiconDetail(id: string): Promise<LexiconDetail> {
  const token = readCurrentMobileSessionToken();
  if (!token) {
    throw new SessionExpiredError("세션이 만료되었어요. 다시 로그인해 주세요.");
  }
  const userId = readCurrentMobileUserId();
  const params = new URLSearchParams();
  if (userId) params.set("userId", userId);
  const qs = params.toString();
  const url = `${resolveApiBaseUrl()}/api/mobile/lexicon/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<
    LexiconDetail & { error: string }
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
    if (response.status === 404) {
      throw new Error(payload.error ?? "자료를 찾지 못했어요.");
    }
    throw new Error(payload.error ?? "자료를 불러오지 못했어요.");
  }

  return {
    id: typeof payload.id === "string" ? payload.id : id,
    title: typeof payload.title === "string" ? payload.title : "",
    week: typeof payload.week === "number" ? payload.week : null,
    day: typeof payload.day === "number" ? payload.day : null,
    surface: typeof payload.surface === "string" ? payload.surface : null,
    snippet: typeof payload.snippet === "string" ? payload.snippet : "",
    content: typeof payload.content === "string" ? payload.content : "",
  };
}

function resolveDetailMeta(data: LexiconDetail) {
  const weekLabel = data.week ? `${data.week}주차` : "주차 미지정";
  if (data.surface === "week_overview") return `${weekLabel} · 주차 개요`;
  if (data.surface === "week_day" && data.day) {
    const dayLabel =
      typeof data.week === "number"
        ? formatMobilePregnancyWeekDayLabel(data.week, data.day)
        : `${Math.max(0, data.day - 1)}일`;
    return `${weekLabel} · ${dayLabel}`;
  }
  return weekLabel;
}

function renderBold(text: string, keyPrefix: string) {
  const nodes: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Text key={`${keyPrefix}-t-${i++}`}>
          {text.slice(lastIndex, match.index)}
        </Text>,
      );
    }
    nodes.push(
      <Text key={`${keyPrefix}-b-${i++}`} style={styles.mdBold}>
        {match[1]}
      </Text>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(
      <Text key={`${keyPrefix}-t-${i++}`}>{text.slice(lastIndex)}</Text>,
    );
  }
  return nodes;
}

function MarkdownContent({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.split(/\r?\n/);
    const out: React.ReactNode[] = [];
    let paragraph: string[] = [];
    let bullets: string[] = [];

    const flushParagraph = (key: string) => {
      if (paragraph.length === 0) return;
      out.push(
        <Text key={key} style={styles.mdParagraph}>
          {renderBold(paragraph.join(" "), key)}
        </Text>,
      );
      paragraph = [];
    };
    const flushBullets = (key: string) => {
      if (bullets.length === 0) return;
      out.push(
        <View key={key} style={styles.mdList}>
          {bullets.map((item, idx) => (
            <View key={`${key}-${idx}`} style={styles.mdListItem}>
              <Text style={styles.mdBullet}>•</Text>
              <Text style={styles.mdListItemText}>
                {renderBold(item, `${key}-${idx}`)}
              </Text>
            </View>
          ))}
        </View>,
      );
      bullets = [];
    };

    lines.forEach((raw, idx) => {
      const line = raw.trim();
      const key = `ln-${idx}`;
      if (!line) {
        flushParagraph(`${key}-p`);
        flushBullets(`${key}-u`);
        return;
      }
      const heading = /^(#{1,3})\s+(.*)$/.exec(line);
      if (heading) {
        flushParagraph(`${key}-p`);
        flushBullets(`${key}-u`);
        const level = heading[1].length;
        const style =
          level === 1 ? styles.mdH1 : level === 2 ? styles.mdH2 : styles.mdH3;
        out.push(
          <Text key={key} style={style}>
            {renderBold(heading[2], key)}
          </Text>,
        );
        return;
      }
      const bullet = /^[-*]\s+(.*)$/.exec(line);
      if (bullet) {
        flushParagraph(`${key}-p`);
        bullets.push(bullet[1]);
        return;
      }
      flushBullets(`${key}-u`);
      paragraph.push(line);
    });
    flushParagraph("p-final");
    flushBullets("u-final");
    return out;
  }, [text]);

  return <View style={styles.mdRoot}>{blocks}</View>;
}

export function PatientLexiconDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === "string" ? params.id : "";
  const [state, setState] = useState<State>({ kind: "idle" });

  const load = useCallback(async () => {
    if (!id) {
      setState({ kind: "error", message: "자료 식별자가 없어요." });
      return;
    }
    setState({ kind: "loading" });
    try {
      const data = await fetchLexiconDetail(id);
      setState({ kind: "success", data });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "자료를 불러오지 못했어요.";
      setState({ kind: "error", message });
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const contentPadding = {
    paddingTop: space.md,
    paddingBottom: Math.max(insets.bottom + space.xl, space.xxxl),
  };

  const title =
    state.kind === "success" && state.data.title
      ? state.data.title
      : "사전 자료";

  return (
    <PatientShell
      title={title}
      backHref="/lexicon"
      pageTone="plain"
      headerCompact
    >
      <ScrollView
        contentContainerStyle={[styles.content, contentPadding]}
        showsVerticalScrollIndicator={false}
      >
        {state.kind === "loading" ? (
          <Card style={styles.statusCard}>
            <ActivityIndicator color={palette.accent} />
            <Text style={styles.statusText}>자료를 불러오고 있어요...</Text>
          </Card>
        ) : null}

        {state.kind === "error" ? (
          <Card variant="accent" style={styles.statusCard}>
            <Text style={styles.errorTitle}>자료를 보여드리지 못했어요</Text>
            <Text style={styles.statusText}>{state.message}</Text>
          </Card>
        ) : null}

        {state.kind === "success" ? (
          <>
            <Card style={styles.headerCard}>
              <Text style={styles.eyebrow}>{resolveDetailMeta(state.data)}</Text>
              <Text style={styles.title}>{state.data.title}</Text>
              {state.data.snippet ? (
                <Text style={styles.snippet}>{state.data.snippet}</Text>
              ) : null}
            </Card>
            <Card style={styles.bodyCard}>
              {state.data.content ? (
                <MarkdownContent text={state.data.content} />
              ) : (
                <Text style={styles.statusText}>
                  자료 본문을 정리하고 있어요.
                </Text>
              )}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    gap: space.lg,
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
  headerCard: {
    gap: space.xs,
  },
  eyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  title: {
    ...typo.titleLg,
    color: surface.textPrimary,
  },
  snippet: {
    ...typo.body,
    color: surface.textSecondary,
  },
  bodyCard: {
    gap: space.sm,
  },
  mdRoot: {
    gap: space.sm,
  },
  mdParagraph: {
    ...typo.body,
    color: surface.textPrimary,
  },
  mdBold: {
    fontWeight: "700",
    color: surface.textPrimary,
  },
  mdH1: {
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  mdH2: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  mdH3: {
    ...typo.label,
    color: surface.textPrimary,
  },
  mdList: {
    gap: space.xs,
  },
  mdListItem: {
    flexDirection: "row",
    gap: space.sm,
  },
  mdBullet: {
    ...typo.body,
    color: palette.accent,
  },
  mdListItemText: {
    ...typo.body,
    color: surface.textPrimary,
    flex: 1,
  },
});
