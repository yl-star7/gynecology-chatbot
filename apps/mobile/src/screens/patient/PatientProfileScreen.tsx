// @ts-nocheck
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import type { HomeViewData, MobileProfileViewData, RecentChatSummary } from "@gynecology-chatbot/app-core";
import { Button, Card, LabeledInput, Pressable } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientTodayTabs } from "../../components/patient/PatientTodayTabs";
import { useMobileAppSession } from "../../core/MobileAppSessionProvider";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { palette, patientSurfacePalette as surface, radii, shadows, space, typo } from "../../theme";
import { getWeekBabyImageSource } from "./week-baby-images";

function buildMonthGrid(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const leadingEmpty = firstDay.getDay();
  const days = [];

  for (let index = 0; index < leadingEmpty; index += 1) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(day);
  }

  return days;
}

export function PatientProfileScreen() {
  const { currentUser, signOut } = useMobileAppSession();
  const { profilePort, homePort, chatPort } = useMobileServices();
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tonePreference, setTonePreference] = useState("");
  const [babyNickname, setBabyNickname] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [notificationTime, setNotificationTime] = useState("08:30");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("records");

  useEffect(() => {
    if (!currentUser) {
      router.replace("/auth/login");
      return;
    }

    Promise.all([
      profilePort.getProfile(),
      homePort.getHomeView(),
      chatPort.listRecentChats(),
    ]).then(([nextProfile, nextHome, nextSessions]) => {
      setProfile(nextProfile);
      setHome(nextHome);
      setRecentSessions(nextSessions);
      setDisplayName(nextProfile.displayName);
      setDueDate(nextProfile.dueDate ?? "");
      setTonePreference(nextProfile.tonePreference ?? "");
      setBabyNickname(nextProfile.babyNickname ?? "");
      setHospitalName(nextProfile.hospitalName ?? "");
      setNotificationTime(nextProfile.notificationTime ?? "08:30");
    }).catch((nextError) => {
      setError(nextError instanceof Error ? nextError.message : "내 정보를 불러오지 못했어요.");
    });
  }, [chatPort, currentUser, homePort, profilePort]);

  async function handleSave() {
    if (!currentUser) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await profilePort.updateProfile({
        userId: currentUser.id,
        displayName: displayName.trim(),
        dueDate: dueDate || null,
        tonePreference: tonePreference.trim(),
        babyNickname: babyNickname.trim() || null,
        hospitalName: hospitalName.trim() || null,
        notificationTime,
      });
      const refreshed = await profilePort.getProfile();
      setProfile(refreshed);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "저장하지 못했어요. 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLogout() {
    await signOut();
    router.replace("/auth/login");
  }

  const calendarDays = useMemo(() => buildMonthGrid(new Date()), []);
  const activeDays = new Set((home?.calendarDays ?? []).map((day) => Number(day.dayLabel)));
  const babyName = profile?.babyNickname?.trim() || "아기";
  const babyImageSource = getWeekBabyImageSource(profile?.pregnancyWeekLabel);

  return (
    <PatientShell activeTab="profile" title="마이페이지" showProfileButton={false}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card style={styles.heroCard}>
            <View style={styles.heroRow}>
              <View style={styles.avatarCircle}>
                <Image source={babyImageSource} style={styles.avatarImage} resizeMode="cover" />
              </View>
              <View style={styles.heroText}>
                <Text style={styles.title}>{babyName}</Text>
                <Text style={styles.description}>
                  {profile ? `${profile.pregnancyWeekLabel} · 임신 ${profile.pregnancyDayCount}일째예요.` : "아기와 함께한 시간을 정리해보세요."}
                </Text>
                <Text style={styles.heroMeta}>
                  {profile?.dueDate ? `예정일 ${profile.dueDate}` : "출산 예정일을 입력하면 더 정확히 보여드려요."}
                </Text>
              </View>
            </View>
          </Card>

          <Card style={styles.calendarCard}>
            <Text style={styles.sectionTitle}>활동 캘린더</Text>
            <Text style={styles.sectionDescription}>활동이 있었던 날을 한눈에 볼 수 있어요.</Text>
            <View style={styles.weekdayRow}>
              {["일", "월", "화", "수", "목", "금", "토"].map((label) => (
                <Text key={label} style={styles.weekdayLabel}>{label}</Text>
              ))}
            </View>
            <View style={styles.calendarGrid}>
              {calendarDays.map((day, index) => (
                <View key={`day-${index}`} style={[styles.calendarCell, day && activeDays.has(day) ? styles.calendarCellActive : null]}>
                  <Text style={[styles.calendarLabel, day && activeDays.has(day) ? styles.calendarLabelActive : null]}>
                    {day ? String(day) : ""}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <Card style={styles.historySectionCard}>
            <Text style={styles.sectionTitle}>이전 기록</Text>
            <PatientTodayTabs
              sections={[
                { id: "records", label: "체크리스트" },
                { id: "reflections", label: "대화" },
              ]}
              activeSection={activeTab}
              onChange={setActiveTab}
            />
            {activeTab === "records" ? (
              <View style={styles.historyList}>
                {(home?.calendarDays ?? []).filter((day) => day.hasChat || day.emotionTone).slice(0, 5).map((day) => (
                  <Pressable
                    key={day.isoDate}
                    style={[styles.historyCard, shadows.card]}
                    onPress={() => router.push(`/chat/link/records?entityId=${encodeURIComponent(day.isoDate)}`)}
                  >
                    <Text style={styles.historyDate}>{day.isoDate}</Text>
                    <Text style={styles.historyBody}>{day.summary ?? "이 날의 기록을 다시 볼 수 있어요."}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {activeTab === "reflections" ? (
              <View style={styles.historyList}>
                {recentSessions.slice(0, 5).map((session) => (
                  <Pressable
                    key={session.id}
                    style={[styles.historyCard, shadows.card]}
                    onPress={() => router.replace(`/chat/${session.id}`)}
                  >
                    <Text style={styles.historyDate}>{session.updatedAtLabel}</Text>
                    <Text style={styles.historyTitle}>{session.title}</Text>
                    <Text style={styles.historyBody}>{session.preview}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </Card>

          <Card variant="muted">
            <Text style={styles.sectionTitle}>아기 정보 관리</Text>
            <Text style={styles.sectionDescription}>태명, 예정일, 알림과 상담 분위기를 조절할 수 있어요.</Text>
            <View style={styles.form}>
              <LabeledInput label="이름" value={displayName} onChangeText={setDisplayName} />
              <LabeledInput label="태명" value={babyNickname} onChangeText={setBabyNickname} placeholder="우리 아기 별명" />
              <LabeledInput label="출산 예정일" value={dueDate} onChangeText={setDueDate} placeholder="2026-08-01" />
              <LabeledInput label="병원" value={hospitalName} onChangeText={setHospitalName} placeholder="다니는 병원 이름" />
              <LabeledInput label="알림 시간" value={notificationTime} onChangeText={setNotificationTime} placeholder="08:30" />
              <LabeledInput label="상담 분위기" value={tonePreference} onChangeText={setTonePreference} placeholder="차분하게, 따뜻하게" />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <Button label={isSaving ? "저장 중이에요..." : "저장하기"} onPress={handleSave} disabled={isSaving} />
            </View>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>계정</Text>
            <Text style={styles.sectionDescription}>기기를 바꾸거나 다른 계정으로 들어갈 때 로그아웃하세요.</Text>
            <View style={styles.accountRow}>
              <Button label="로그아웃" variant="text" onPress={handleLogout} />
            </View>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 140,
    gap: space.xl,
  },
  heroCard: {
    paddingVertical: space.xxl,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
  },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: radii.full,
    backgroundColor: surface.surfaceAccent,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  heroText: {
    flex: 1,
  },
  title: {
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  description: {
    marginTop: space.xs,
    ...typo.body,
    color: surface.textSecondary,
  },
  heroMeta: {
    marginTop: space.sm,
    ...typo.caption,
    color: surface.textSecondary,
  },
  calendarCard: {
    paddingTop: space.xl,
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
  weekdayRow: {
    marginTop: space.lg,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekdayLabel: {
    width: "14%",
    textAlign: "center",
    ...typo.caption,
    color: surface.textSecondary,
  },
  calendarGrid: {
    marginTop: space.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.xs,
    justifyContent: "space-between",
  },
  calendarCell: {
    width: "12.8%",
    aspectRatio: 1,
    borderRadius: radii.sm,
    backgroundColor: "#f2e8ed",
    alignItems: "center",
    justifyContent: "center",
  },
  calendarCellActive: {
    backgroundColor: "#c97f98",
  },
  calendarLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: surface.textSecondary,
  },
  calendarLabelActive: {
    color: "#ffffff",
    fontWeight: "700",
  },
  historySectionCard: {
    paddingTop: space.xl,
  },
  historyList: {
    marginTop: space.lg,
    gap: space.sm,
  },
  historyCard: {
    borderRadius: radii.xl,
    backgroundColor: "#fffafc",
    padding: space.xl,
  },
  historyDate: {
    ...typo.caption,
    color: "#b87089",
  },
  historyTitle: {
    marginTop: space.sm,
    ...typo.label,
    color: surface.textPrimary,
  },
  historyBody: {
    marginTop: space.sm,
    ...typo.caption,
    color: "#776873",
  },
  form: {
    marginTop: space.lg,
    gap: space.md,
  },
  accountRow: {
    marginTop: space.md,
  },
  errorText: {
    ...typo.caption,
    color: palette.errorText,
  },
});
