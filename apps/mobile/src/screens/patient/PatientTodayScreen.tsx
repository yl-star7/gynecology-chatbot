// @ts-nocheck
import { useEffect, useState } from "react";
import { router } from "expo-router";
import type { HomeViewData, MobileProfileViewData, RecentChatSummary } from "@gynecology-chatbot/app-core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/ui";
import { PatientShell } from "../../components/patient/PatientShell";
import { PatientTodayTabs } from "../../components/patient/PatientTodayTabs";
import { useMobileServices } from "../../core/MobileServicesProvider";
import { palette, radii, space, typo } from "../../theme";
import { buildPatientTodayViewModel } from "./view-models";

export function PatientTodayScreen() {
  const services = useMobileServices();
  const [home, setHome] = useState<HomeViewData | null>(null);
  const [profile, setProfile] = useState<MobileProfileViewData | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentChatSummary[]>([]);
  const [activeSection, setActiveSection] = useState("baby-mom");

  useEffect(() => {
    Promise.all([
      services.homePort.getHomeView(),
      services.profilePort.getProfile(),
      services.chatPort.listRecentChats(),
    ])
      .then(([nextHome, nextProfile, nextRecentSessions]) => {
        setHome(nextHome);
        setProfile(nextProfile);
        setRecentSessions(nextRecentSessions);
      })
      .catch(() => undefined);
  }, [services]);

  const viewModel = buildPatientTodayViewModel({
    home,
    profile,
    session: null,
    recentSessions,
  });

  return (
    <PatientShell activeTab="today" title="오늘,우리">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PatientTodayTabs
          sections={viewModel.sections}
          activeSection={activeSection}
          onChange={(sectionId) => {
            if (sectionId === "conversation") {
              router.replace("/chat/heart-talk");
              return;
            }
            setActiveSection(sectionId);
          }}
        />

        {activeSection === "baby-mom" ? (
          <View style={styles.stack}>
            <Card>
              <View style={styles.iconTitleRow}>
                <View style={[styles.sectionIconWrap, styles.babyIconWrap]}>
                  <Ionicons name="happy-outline" size={18} color={palette.accent} />
                </View>
                <Text style={styles.sectionTitle}>오늘 아기는요</Text>
              </View>
              <View style={styles.innerPanel}>
                <Text style={styles.sectionBody}>{viewModel.babyCard.body}</Text>
              </View>
            </Card>

            <Card>
              <View style={styles.iconTitleRow}>
                <View style={[styles.sectionIconWrap, styles.momIconWrap]}>
                  <Ionicons name="heart-outline" size={18} color={palette.accent} />
                </View>
                <Text style={styles.sectionTitle}>오늘 엄마는요</Text>
              </View>
              <View style={styles.innerPanel}>
                <Text style={styles.sectionBody}>{viewModel.momCard.body}</Text>
              </View>
            </Card>
          </View>
        ) : null}

        {activeSection === "checklist" ? (
          <Card>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.iconTitleRow}>
                <View style={[styles.sectionIconWrap, styles.checklistIconWrap]}>
                  <Ionicons name="checkmark-circle-outline" size={18} color={palette.successText} />
                </View>
                <Text style={styles.sectionTitle}>오늘의 체크리스트</Text>
              </View>
              <Text style={styles.progressLabel}>{viewModel.checklistProgressLabel}</Text>
            </View>

            <View style={styles.checklist}>
              {viewModel.checklistItems.map((item) => (
                <View key={item.id} style={styles.checklistRow}>
                  <View style={styles.checkbox} />
                  <Text style={styles.checklistLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: "0%" }]} />
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </PatientShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    paddingBottom: 140,
    gap: space.lg,
  },
  stack: {
    gap: space.md,
  },
  iconTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.sm,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  babyIconWrap: {
    backgroundColor: "#fde4ee",
  },
  momIconWrap: {
    backgroundColor: "#f3e7ff",
  },
  checklistIconWrap: {
    backgroundColor: "#edf8ef",
  },
  sectionTitle: {
    ...typo.titleSm,
    color: "#1f1a1d",
  },
  innerPanel: {
    marginTop: space.lg,
    borderRadius: radii.xl,
    backgroundColor: "#fbf1f7",
    padding: space.lg,
  },
  sectionBody: {
    ...typo.body,
    color: "#5d5a67",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space.sm,
  },
  progressLabel: {
    ...typo.label,
    color: "#34a853",
  },
  checklist: {
    marginTop: space.xl,
    gap: space.xl,
  },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#d9dde5",
    backgroundColor: "#f8f9fb",
  },
  checklistLabel: {
    ...typo.titleSm,
    color: "#30313a",
    flex: 1,
  },
  progressTrack: {
    marginTop: space.xl,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: "#e7eaf0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34a853",
  },
});
