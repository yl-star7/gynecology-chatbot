// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Card, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import {
  readCurrentMobileSessionToken,
  readCurrentMobileUserId,
  RateLimitError,
  SessionExpiredError,
} from "../../api/mobileApi";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../theme";
import {
  resolveAnchoredKeyboardBottomOffset,
  resolveKeyboardHeightFromCoordinates,
} from "./patientScreenLayout.model";

type AskSource = {
  title: string;
  snippet: string;
};

type AskMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; sources: AskSource[] }
  | { id: string; role: "loading" }
  | { id: string; role: "error"; text: string };

function resolveApiBaseUrl() {
  return (
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    "https://agaya-api-yvdnhntt7a-du.a.run.app"
  ).replace(/\/$/, "");
}

async function requestAnswer(input: {
  query: string;
  currentWeek: number | null;
}): Promise<{ answer: string; sources: AskSource[] }> {
  const token = readCurrentMobileSessionToken();
  if (!token) {
    throw new SessionExpiredError("세션이 만료되었어요. 다시 로그인해 주세요.");
  }

  const userId = readCurrentMobileUserId();
  const response = await fetch(`${resolveApiBaseUrl()}/api/mobile/ask`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: input.query,
      currentWeek: input.currentWeek ?? undefined,
      userId: userId ?? undefined,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<{
    answer: string;
    sources: AskSource[];
    error: string;
  }>;

  if (!response.ok) {
    if (response.status === 401) {
      throw new SessionExpiredError(
        payload.error ?? "세션이 만료되었어요. 다시 로그인해 주세요.",
      );
    }
    if (response.status === 429) {
      throw new RateLimitError(payload.error ?? "잠시 후 다시 시도해 주세요.");
    }
    throw new Error(payload.error ?? "답변을 받지 못했어요.");
  }

  return {
    answer: typeof payload.answer === "string" ? payload.answer : "",
    sources: Array.isArray(payload.sources)
      ? payload.sources.filter(
          (source): source is AskSource =>
            !!source &&
            typeof source.title === "string" &&
            typeof source.snippet === "string",
        )
      : [],
  };
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

function MarkdownAnswer({ text }: { text: string }) {
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

function SourcesSection({ sources }: { sources: AskSource[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!sources || sources.length === 0) return null;

  return (
    <View style={styles.sourcesBlock}>
      <Pressable
        accessibilityRole="button"
        onPress={() => setExpanded((v) => !v)}
        style={styles.sourcesHeader}
      >
        <Text style={styles.sourcesTitle}>참고 자료 ({sources.length}개)</Text>
        <Text style={styles.sourcesChevron}>{expanded ? "▾" : "▸"}</Text>
      </Pressable>
      {expanded ? (
        <View style={styles.sourcesList}>
          {sources.map((source, index) => (
            <View key={`${source.title}-${index}`} style={styles.sourceItem}>
              <Text style={styles.sourceTitle}>{source.title}</Text>
              {source.snippet ? (
                <Text style={styles.sourceSnippet}>{source.snippet}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function makeMessageId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AskFreeSearchScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { currentUser } = useMobileAppSession();
  const [messages, setMessages] = useState<AskMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [composerHeight, setComposerHeight] = useState(0);
  const [keyboardState, setKeyboardState] = useState({
    isVisible: false,
    height: 0,
  });
  const scrollRef = useRef<ScrollView | null>(null);
  const baselineWindowHeightRef = useRef(windowHeight);

  const currentWeek =
    (currentUser as unknown as { pregnancyWeek?: number | null })
      ?.pregnancyWeek ?? null;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardState({
        isVisible: true,
        height: resolveKeyboardHeightFromCoordinates({
          reportedHeight: event.endCoordinates.height,
          keyboardScreenY: event.endCoordinates.screenY,
          viewportHeight: windowHeight,
        }),
      });
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardState({ isVisible: false, height: 0 });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [windowHeight]);

  if (!keyboardState.isVisible) {
    baselineWindowHeightRef.current = windowHeight;
  }

  const keyboardBottomOffset = resolveAnchoredKeyboardBottomOffset({
    platformOs: Platform.OS,
    isKeyboardVisible: keyboardState.isVisible,
    keyboardHeight: keyboardState.height,
    baselineWindowHeight: baselineWindowHeightRef.current,
    currentWindowHeight: windowHeight,
    bottomInset: insets.bottom,
  });

  const handleSubmit = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || isSending) return;

    const userMessage: AskMessage = {
      id: makeMessageId("u"),
      role: "user",
      text: trimmed,
    };
    const loadingMessage: AskMessage = {
      id: makeMessageId("l"),
      role: "loading",
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setDraft("");
    setIsSending(true);

    try {
      const data = await requestAnswer({
        query: trimmed,
        currentWeek:
          typeof currentWeek === "number" && Number.isFinite(currentWeek)
            ? currentWeek
            : null,
      });
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== loadingMessage.id)
          .concat({
            id: makeMessageId("a"),
            role: "assistant",
            text:
              data.answer ||
              "죄송해요, 지금은 답을 만들지 못했어요. 다른 방식으로 질문해 보세요.",
            sources: data.sources,
          }),
      );
    } catch (error) {
      const message =
        error instanceof SessionExpiredError
          ? error.message
          : error instanceof RateLimitError
            ? error.message
            : error instanceof Error
              ? error.message
              : "답변을 받지 못했어요. 잠시 후 다시 시도해 주세요.";
      setMessages((prev) =>
        prev
          .filter((m) => m.id !== loadingMessage.id)
          .concat({
            id: makeMessageId("e"),
            role: "error",
            text: message,
          }),
      );
    } finally {
      setIsSending(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [currentWeek, draft, isSending]);

  const contentPadding = {
    paddingTop: space.md,
    paddingBottom: composerHeight + keyboardBottomOffset + space.lg,
  };

  return (
    <PatientShell
      title="무엇이든 물어보세요"
      backHref="/(tabs)/profile"
      pageTone="plain"
      headerCompact
      showProfileButton={false}
    >
      <KeyboardAvoidingView
        style={styles.flex}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={[styles.content, contentPadding]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
        >
          {messages.length === 0 ? (
            <Card variant="muted" style={styles.introCard}>
              <Text style={styles.introEyebrow}>자유 검색 사전</Text>
              <Text style={styles.introTitle}>무엇이든 물어보세요</Text>
              <Text style={styles.introBody}>
                임신과 출산에 대해 궁금한 점을 자유롭게 질문해 주세요. 전문
                자료를 찾아 따뜻하게 알려드려요.
              </Text>
              <Text style={styles.introPrivacy}>
                프라이버시 보호를 위해 질문과 답변은 앱에 저장되지 않습니다.
                필요하신 내용은 별도로 메모해두세요.
              </Text>
              <Text style={styles.introHint}>
                예: "20주차에 태동은 어떻게 느껴지나요?"
              </Text>
            </Card>
          ) : null}

          {messages.map((message) => {
            if (message.role === "user") {
              return (
                <View key={message.id} style={styles.userRow}>
                  <View style={styles.userBubble}>
                    <Text style={styles.userText}>{message.text}</Text>
                  </View>
                </View>
              );
            }
            if (message.role === "loading") {
              return (
                <View key={message.id} style={styles.assistantRow}>
                  <View style={styles.assistantBubble}>
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color={palette.accent} size="small" />
                      <Text style={styles.loadingText}>
                        참고 자료를 찾고 있어요...
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }
            if (message.role === "error") {
              return (
                <View key={message.id} style={styles.assistantRow}>
                  <View style={[styles.assistantBubble, styles.errorBubble]}>
                    <Text style={styles.errorTitle}>잠시 문제가 생겼어요</Text>
                    <Text style={styles.errorBody}>{message.text}</Text>
                  </View>
                </View>
              );
            }
            return (
              <View key={message.id} style={styles.assistantRow}>
                <View style={styles.assistantBubble}>
                  <MarkdownAnswer text={message.text} />
                  <SourcesSection sources={message.sources} />
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View
          style={[
            styles.composerWrap,
            {
              bottom: keyboardBottomOffset,
              paddingBottom:
                keyboardState.isVisible && Platform.OS === "android"
                  ? space.md
                  : Math.max(insets.bottom, space.md),
            },
          ]}
          onLayout={(event) => {
            setComposerHeight(event.nativeEvent.layout.height);
          }}
        >
          <View style={styles.composerInner}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="궁금한 점을 적어주세요"
              placeholderTextColor={surface.textSecondary}
              style={styles.input}
              selectionColor={surface.accentSolid}
              underlineColorAndroid="transparent"
              multiline
              editable={!isSending}
              maxLength={1000}
              accessibilityLabel="질문 입력창"
            />
            <Pressable
              onPress={handleSubmit}
              disabled={isSending || draft.trim().length === 0}
              accessibilityRole="button"
              accessibilityLabel="질문 보내기"
              style={[
                styles.sendButton,
                (isSending || draft.trim().length === 0) &&
                  styles.sendButtonDisabled,
              ]}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={surface.surfacePrimary}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: space.lg,
    gap: space.md,
  },
  introCard: {
    gap: space.xs,
  },
  introEyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  introTitle: {
    ...typo.titleLg,
    color: surface.textPrimary,
    marginTop: space.xs,
  },
  introBody: {
    ...typo.body,
    color: surface.textSecondary,
    marginTop: space.sm,
  },
  introHint: {
    ...typo.caption,
    color: surface.textSecondary,
    marginTop: space.sm,
  },
  introPrivacy: {
    ...typo.caption,
    color: surface.textSecondary,
    marginTop: space.sm,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  userBubble: {
    maxWidth: "82%",
    backgroundColor: palette.accent,
    borderRadius: radii.lg,
    borderBottomRightRadius: radii.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + space.xs,
  },
  userText: {
    ...typo.body,
    color: surface.surfacePrimary,
  },
  assistantRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  assistantBubble: {
    maxWidth: "92%",
    backgroundColor: surface.fieldSurface,
    borderRadius: radii.lg,
    borderBottomLeftRadius: radii.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    gap: space.sm,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  loadingText: {
    ...typo.body,
    color: surface.textSecondary,
  },
  errorBubble: {
    backgroundColor: surface.surfaceAccent,
  },
  errorTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  errorBody: {
    ...typo.body,
    color: surface.textSecondary,
  },
  composerWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    backgroundColor: surface.pageBackground,
    borderTopWidth: 1,
    borderTopColor: surface.strokeSubtle,
    zIndex: 20,
  },
  composerInner: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: space.sm,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: space.xxxl * 3,
    borderRadius: radii.lg,
    backgroundColor: surface.fieldSurface,
    paddingHorizontal: space.md,
    paddingVertical: space.sm + space.xs,
    ...typo.body,
    color: surface.textPrimary,
    textAlignVertical: "top",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    backgroundColor: palette.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sourcesBlock: {
    marginTop: space.sm,
    paddingTop: space.sm,
    borderTopWidth: 1,
    borderTopColor: surface.strokeSubtle,
  },
  sourcesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sourcesTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  sourcesChevron: {
    ...typo.label,
    color: surface.textSecondary,
  },
  sourcesList: {
    gap: space.md,
    marginTop: space.sm,
  },
  sourceItem: {
    gap: space.xs,
  },
  sourceTitle: {
    ...typo.label,
    color: surface.textPrimary,
  },
  sourceSnippet: {
    ...typo.caption,
    color: surface.textSecondary,
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
