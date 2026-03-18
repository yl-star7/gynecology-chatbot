// @ts-nocheck
import type { HomeViewData } from "@gynecology-chatbot/app-core";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMobileServices } from "../core/MobileServicesProvider";
import { palette } from "../theme";

export function HomeScreen() {
  const services = useMobileServices();
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    services.homePort
      .getHomeView()
      .then((nextHome) => {
        if (isMounted) {
          setHome(nextHome);
        }
      })
      .catch((nextError) => {
        if (isMounted) {
          setError(nextError instanceof Error ? nextError.message : "홈 데이터를 불러오지 못했습니다.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [services]);

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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>Gynecology Chatbot</Text>
        <Text style={styles.title}>
          {home ? `안녕하세요 ${home.userName}님, 임신 ${home.pregnancyDayCount}일차네요.` : "홈 데이터를 불러오는 중입니다."}
        </Text>
        <Text style={styles.subtitle}>
          {error ?? "캘린더, 임신수첩, 임신 지식을 한 화면에서 보고 채팅으로 이동합니다."}
        </Text>

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>현재 주차</Text>
          <Text style={styles.heroValue}>{home?.pregnancyWeekLabel ?? "정보 연결 대기"}</Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Calendar View</Text>
          <Text style={styles.sectionDescription}>일자별 채팅 여부는 dot로, 감정은 색상으로 표시합니다.</Text>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day) => (
              <View key={day.isoDate} style={[styles.calendarCell, day.hasChat ? styles.calendarCellActive : null]}>
                <Text style={styles.calendarLabel}>{day.dayLabel}</Text>
                {day.hasChat ? <View style={styles.dot} /> : null}
              </View>
            ))}
          </View>
        </View>

        <View style={styles.shortcutRow}>
          <Pressable style={styles.shortcutCard} onPress={() => router.push("/(tabs)/notebook")}>
            <Text style={styles.shortcutTitle}>임신수첩</Text>
            <Text style={styles.shortcutDescription}>저장 답변과 체크리스트</Text>
          </Pressable>
          <Pressable style={styles.shortcutCard} onPress={() => router.push("/(tabs)/knowledge")}>
            <Text style={styles.shortcutTitle}>임신 지식</Text>
            <Text style={styles.shortcutDescription}>주차별 지식과 위험 신호</Text>
          </Pressable>
        </View>
      </ScrollView>

      <Pressable style={styles.fab} onPress={() => router.push("/chat/new")} accessibilityLabel="채팅 열기">
        <Ionicons name="chatbubble-ellipses-outline" size={24} color="#ffffff" />
        <Text style={styles.fabLabel}>Ham</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: palette.accent,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    marginTop: 10,
    fontSize: 28,
    fontWeight: "700",
    color: palette.ink,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: palette.subInk,
  },
  heroCard: {
    marginTop: 20,
    padding: 18,
    borderRadius: 20,
    backgroundColor: palette.warm,
  },
  heroLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: palette.subInk,
  },
  heroValue: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "700",
    color: palette.ink,
  },
  sectionCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: palette.ink,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: palette.subInk,
  },
  calendarGrid: {
    marginTop: 16,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  calendarCell: {
    width: "12.5%",
    aspectRatio: 1,
    borderRadius: 14,
    backgroundColor: "#f1f4f1",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCellActive: {
    backgroundColor: palette.accentSoft,
  },
  calendarLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: palette.ink,
  },
  dot: {
    position: "absolute",
    bottom: 8,
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: palette.dot,
  },
  shortcutRow: {
    marginTop: 18,
    gap: 12,
  },
  shortcutCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.line,
  },
  shortcutTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.ink,
  },
  shortcutDescription: {
    marginTop: 8,
    fontSize: 14,
    color: palette.subInk,
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: palette.accent,
  },
  fabLabel: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
