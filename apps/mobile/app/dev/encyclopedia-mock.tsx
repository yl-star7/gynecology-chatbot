// @ts-nocheck
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { PatientShell } from "../../src/components/patient/PatientShell";
import { Card, Pressable } from "../../src/components/ui";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  space,
  typo,
} from "../../src/theme";
import { getWeekBabyImageSource } from "../../src/screens/patient/week-baby-images";

const guideItems = [
  "몸의 변화에 귀 기울이고, 편안한 옷차림으로 나를 존중하는 시간을 가져보세요.",
  "물을 충분히 마시고, 숨이 차면 잠시 앉아 천천히 호흡해요.",
  "아기에게 자주 목소리를 들려주며 익숙한 소리를 쌓아가요.",
];

const cautionItems = [
  "휴식을 취해도 사라지지 않는 강한 통증이 이어지면 의료진과 상담해요.",
  "발열, 심한 어지러움, 상복부 압통이 함께 있으면 바로 확인이 필요해요.",
  "코피가 반복되거나 숨이 많이 차면 증상과 시간을 기록해요.",
];

const faqItems = [
  {
    question: "배 모양이 다른 사람과 달라도 괜찮나요?",
    answer:
      "키, 체형, 근육, 이전 임신 경험에 따라 배 모양은 다르게 보여요. 진료에서 아기 성장과 엄마 체중 증가가 괜찮다면 대부분 자연스러운 차이예요.",
  },
  {
    question: "아직 태동이 뚜렷하지 않아도 괜찮나요?",
    answer:
      "19주차에는 개인차가 커요. 움직임이 아주 미세하게 느껴지거나 아직 잘 모르겠을 수도 있어요.",
  },
];

export default function EncyclopediaMockRoute() {
  if (!__DEV__) {
    return null;
  }

  return (
    <PatientShell
      activeTab="profile"
      title="임신백과"
      backHref="/dev/chat-mock"
      showProfileButton={false}
      pageTone="plain"
      headerCompact
    >
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.heroCard}>
          <View style={styles.heroRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.eyebrow}>이번 주 백과</Text>
              <Text style={styles.heroTitle}>19주차</Text>
              <Text style={styles.bodyText}>
                아기의 고유한 무늬와 오감 발달이 시작되는 시기예요.
              </Text>
            </View>
            <View style={styles.babyImageFrame}>
              <Image
                source={getWeekBabyImageSource("19주")}
                style={styles.babyImage}
                resizeMode="contain"
              />
            </View>
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>19주차 한눈에 보기</Text>
          <Text style={styles.bodyText}>
            아기는 이제 세상의 소리를 듣고, 맛을 느끼며, 촉감을 경험하는 등
            오감을 발달시키고 있어요. 엄마의 몸도 눈에 띄게 변화하며 숨참,
            피부 변화, 다리 불편감이 함께 나타날 수 있어요.
          </Text>
        </Card>

        <Card>
          <Text style={styles.eyebrow}>주차별 사전</Text>
          <View style={styles.contentBlock}>
            <Text style={styles.sectionTitle}>태아 발달</Text>
            <Text style={styles.bodyText}>
              아기는 약 24~25cm, 270~300g 정도로 자랐고 손가락과 발가락에
              고유한 지문과 발자국 무늬가 만들어지고 있어요. 폐와 갈색 지방도
              태어난 뒤를 준비하며 조금씩 성숙해져요.
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.contentBlock}>
            <Text style={styles.sectionTitle}>엄마 몸 변화</Text>
            <Text style={styles.bodyText}>
              자궁이 배꼽 근처까지 올라오면서 배가 더 둥글게 보일 수 있어요.
              숨이 차거나 어지럽고, 피부색 변화나 다리 경련이 나타날 수 있어요.
            </Text>
          </View>
        </Card>

        <Card variant="muted">
          <Text style={styles.sectionTitle}>건강한 생활을 위한 안내</Text>
          <Text style={styles.bodyText}>
            몸의 변화가 많아지는 시기라, 작은 불편도 무시하지 않고 천천히
            살펴보는 것이 좋아요.
          </Text>
          <GuideList items={guideItems} />
        </Card>

        <Card variant="muted">
          <Text style={styles.sectionTitle}>주의해야 할 점</Text>
          <Text style={styles.bodyText}>
            아래 신호는 가볍게 넘기지 말고 의료진과 상의해 주세요.
          </Text>
          <GuideList items={cautionItems} />
        </Card>

        <Card variant="muted">
          <Text style={styles.sectionTitle}>궁금해요</Text>
          <View style={styles.faqList}>
            {faqItems.map((item) => (
              <View key={item.question} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>{item.question}</Text>
                <Text style={styles.bodyText}>{item.answer}</Text>
              </View>
            ))}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>주차 선택</Text>
          <Text style={styles.bodyText}>다른 주차도 사전처럼 확인할 수 있어요.</Text>
          <View style={styles.weekGrid}>
            {[17, 18, 19, 20, 21, 22, 23, 24].map((week) => (
              <Pressable
                key={week}
                style={[
                  styles.weekCell,
                  week === 19 ? styles.weekCellCurrent : null,
                ]}
              >
                <Text
                  style={[
                    styles.weekCellLabel,
                    week === 19 ? styles.weekCellLabelActive : null,
                  ]}
                >
                  {week}주
                </Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </ScrollView>
    </PatientShell>
  );
}

function GuideList({ items }: { items: string[] }) {
  return (
    <View style={styles.guideList}>
      {items.map((item) => (
        <View key={item} style={styles.guideItem}>
          <View style={styles.guideBullet} />
          <Text style={styles.guideText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: space.lg,
    paddingTop: space.sm,
    paddingBottom: space.xxxl * 2,
    gap: space.lg,
  },
  heroCard: {
    paddingVertical: space.xl,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.lg,
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    ...typo.eyebrow,
    color: palette.accent,
  },
  heroTitle: {
    marginTop: space.xs,
    ...typo.titleMd,
    color: surface.textPrimary,
  },
  bodyText: {
    marginTop: space.sm,
    ...typo.body,
    color: surface.textSecondary,
  },
  babyImageFrame: {
    width: space.xxxl * 3,
    height: space.xxxl * 3,
    borderRadius: radii.full,
    backgroundColor: surface.fieldSurface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  babyImage: {
    width: "92%",
    height: "92%",
  },
  sectionTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  contentBlock: {
    marginTop: space.md,
  },
  divider: {
    height: 1,
    backgroundColor: surface.strokeSubtle,
    marginVertical: space.lg,
  },
  guideList: {
    marginTop: space.md,
    gap: space.sm,
  },
  guideItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.md,
    borderRadius: radii.lg,
    backgroundColor: surface.fieldSurface,
    padding: space.md,
  },
  guideBullet: {
    width: space.sm,
    height: space.sm,
    borderRadius: radii.full,
    backgroundColor: palette.accent,
    marginTop: space.sm,
  },
  guideText: {
    flex: 1,
    ...typo.body,
    color: surface.textSecondary,
  },
  faqList: {
    marginTop: space.md,
    gap: space.md,
  },
  faqItem: {
    borderRadius: radii.lg,
    backgroundColor: surface.fieldSurface,
    padding: space.md,
  },
  faqQuestion: {
    ...typo.label,
    color: surface.textPrimary,
  },
  weekGrid: {
    marginTop: space.lg,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  weekCell: {
    minWidth: "22%",
    borderRadius: radii.md,
    backgroundColor: surface.fieldSurface,
    paddingVertical: space.md,
    alignItems: "center",
    justifyContent: "center",
  },
  weekCellCurrent: {
    backgroundColor: surface.surfaceAccent,
  },
  weekCellLabel: {
    ...typo.label,
    color: surface.textSecondary,
  },
  weekCellLabelActive: {
    color: palette.accent,
  },
});
