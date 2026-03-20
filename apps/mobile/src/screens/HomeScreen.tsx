// @ts-nocheck
import type { HomeViewData } from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Pressable } from "../components/ui";
import { MobileScreenFrame } from "../components/MobileScreenFrame";
import { useMobileServices } from "../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../theme";

const CALENDAR_COLS = 7;
const CALENDAR_GAP = 3;
const CARD_H_PADDING = space.xl * 2;
const OUTER_H_PADDING = space.xl * 2;
const CALENDAR_CELL_SIZE = Math.floor(
  (Dimensions.get("window").width - OUTER_H_PADDING - CARD_H_PADDING - CALENDAR_GAP * (CALENDAR_COLS - 1)) / CALENDAR_COLS,
);

function getDotColor(day) {
  if (day.emotionTone === "joyful") return "#5b7d6a";
  if (day.emotionTone === "calm") return palette.accent;
  if (day.emotionTone === "anxious") return "#b67087";
  if (day.emotionTone === "tired") return "#a46d3e";
  if (day.emotionTone === "sad") return palette.subInk;
  if (day.hasChat) return palette.accent;
  return null;
}

export function HomeScreen() {
  const services = useMobileServices();
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHome = useCallback(async () => {
    try {
      const nextHome = await services.homePort.getHomeView();
      setHome(nextHome);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "홈 정보를 불러오지 못했어요.");
    }
  }, [services]);

  useEffect(() => {
    let isMounted = true;
    fetchHome().then(() => { if (!isMounted) { /* cancelled */ } });
    return () => { isMounted = false; };
  }, [fetchHome]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchHome();
    setRefreshing(false);
  }, [fetchHome]);

  const calendarDays = useMemo(
    () =>
      home?.calendarDays ??
      Array.from({ length: 31 }, (_, index) => ({
        isoDate: `placeholder-${index + 1}`,
        dayLabel: String(index + 1),
        hasChat: false,
        emotionTone: null,
      })),
    [home],
  );

  return (
    <MobileScreenFrame title="홈" showProfileButton showChatFab>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={palette.accent} />}
      >
        <Text style={styles.eyebrow}>오늘의 기록</Text>
        <Text style={styles.title}>
          {home ? `${home.userName}님,\n임신 ${home.pregnancyDayCount}일째예요` : "잠시만요, 준비 중이에요"}
        </Text>
        <Text style={styles.subtitle}>
          {error ?? "오늘 하루도 아기와 함께 잘 보내고 계시죠?"}
        </Text>

        <Card variant="accent" style={styles.heroCard}>
          <Text style={styles.heroLabel}>지금 우리 아기는</Text>
          <Text style={styles.heroValue}>{home?.pregnancyWeekLabel ?? "정보를 불러오고 있어요"}</Text>
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>이번 달 기록</Text>
          <Text style={styles.sectionDescription}>날짜를 눌러 기록을 확인해보세요.</Text>
          <View style={styles.weekdayRow}>
            {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
              <Text key={d} style={styles.weekdayLabel}>{d}</Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day) => {
              const dotColor = getDotColor(day);
              return (
                <Pressable
                  key={day.isoDate}
                  style={styles.calendarCell}
                  onPress={() => {
                    if (day.isoDate && !day.isoDate.startsWith("placeholder")) {
                      router.push(`/chat/link/records?entityId=${day.isoDate}`);
                    }
                  }}
                >
                  <Text style={styles.calendarLabel}>{day.dayLabel}</Text>
                  <View style={[styles.dot, dotColor ? { backgroundColor: dotColor } : styles.dotHidden]} />
                </Pressable>
              );
            })}
          </View>
        </Card>

        <View style={styles.shortcutRow}>
          <Pressable style={[styles.shortcutCard, shadows.card]} onPress={() => router.replace("/notebook")}>
            <View style={styles.shortcutIcon}>
              <Ionicons name="book-outline" size={20} color={palette.accent} />
            </View>
            <Text style={styles.shortcutTitle}>임신수첩</Text>
            <Text style={styles.shortcutDescription}>체크리스트와 메모</Text>
          </Pressable>
          <Pressable style={[styles.shortcutCard, shadows.card]} onPress={() => router.replace("/knowledge")}>
            <View style={styles.shortcutIcon}>
              <Ionicons name="library-outline" size={20} color={palette.accent} />
            </View>
            <Text style={styles.shortcutTitle}>임신 지식</Text>
            <Text style={styles.shortcutDescription}>주차별 변화 안내</Text>
          </Pressable>
        </View>
      </ScrollView>
    </MobileScreenFrame>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: space.xl,
    paddingBottom: 120,
  },
  eyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  title: {
    marginTop: space.sm,
    ...typo.titleMd,
    color: palette.ink,
  },
  subtitle: {
    marginTop: 6,
    ...typo.body,
    color: palette.subInk,
  },
  heroCard: {
    marginTop: space.xl,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: palette.accent,
  },
  heroValue: {
    marginTop: 6,
    fontSize: 22,
    fontWeight: "700",
    color: palette.ink,
  },
  sectionCard: {
    marginTop: space.lg,
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  sectionDescription: {
    marginTop: space.xs,
    ...typo.caption,
    color: surface.textSecondary,
  },
  calendarGrid: {
    marginTop: space.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
    justifyContent: "flex-start",
  },
  calendarCell: {
    width: CALENDAR_CELL_SIZE,
    height: CALENDAR_CELL_SIZE,
    borderRadius: 8,
    backgroundColor: surface.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdayRow: {
    marginTop: space.md,
    flexDirection: "row",
    gap: CALENDAR_GAP,
  },
  weekdayLabel: {
    width: CALENDAR_CELL_SIZE,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: surface.textSecondary,
  },
  calendarLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: surface.textPrimary,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
  },
  dotHidden: {
    backgroundColor: "transparent",
  },
  shortcutRow: {
    marginTop: space.lg,
    flexDirection: "row",
    gap: space.md,
  },
  shortcutCard: {
    flex: 1,
    padding: space.lg,
    borderRadius: radii.lg,
    backgroundColor: surface.surfacePrimary,
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: surface.surfaceAccent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: space.sm,
  },
  shortcutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: surface.textPrimary,
  },
  shortcutDescription: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    color: surface.textSecondary,
  },
});
