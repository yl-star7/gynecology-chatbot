// @ts-nocheck
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  palette,
  patientSurfacePalette as surface,
  radii,
  shadows,
  space,
  typo,
} from "../../theme";

// ─── Domain types ─────────────────────────────────────────

type TextPart = { type: "text"; id: string; text: string };
type ImagePart = {
  type: "image";
  id: string;
  imageUrl: string;
  alt: string;
  caption?: string;
};
type SurveyChoice = { id: string; label: string };
type SurveyPart = {
  type: "survey";
  id: string;
  title: string;
  body: string;
  choices: SurveyChoice[];
};
type CarouselCardItem = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
};
type CarouselPart = {
  type: "carousel";
  id: string;
  title: string;
  cards: CarouselCardItem[];
};
type QuickReplyChoice = { id: string; label: string; message: string };
type QuickRepliesPart = {
  type: "quickReplies";
  id: string;
  title?: string;
  choices: QuickReplyChoice[];
};
type DeepLinkPart = {
  type: "deepLink";
  id: string;
  title: string;
  description: string;
  target: string;
  entityId?: string;
};

type ChatPart =
  | TextPart
  | ImagePart
  | SurveyPart
  | CarouselPart
  | QuickRepliesPart
  | DeepLinkPart;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  createdAtLabel: string;
  parts: ChatPart[];
};

// ─── Props ────────────────────────────────────────────────

export interface ChatPartRendererProps {
  message: ChatMessage;
  onQuickReplySelect?: (message: string) => void;
  onSurveyAnswer?: (surveyId: string, choiceId: string) => Promise<boolean>;
  surveySaveErrorText?: string;
  onDeepLinkPress?: (target: string, entityId?: string) => void;
}

// ─── Part renderers ───────────────────────────────────────

function TextPartView({ part }: { part: TextPart }) {
  return <Text style={styles.text}>{part.text}</Text>;
}

function ImagePartView({ part }: { part: ImagePart }) {
  return (
    <View style={styles.imagePart}>
      <Image
        source={{ uri: part.imageUrl }}
        style={styles.image}
        resizeMode="cover"
        accessibilityLabel={part.alt}
      />
      {part.caption ? (
        <Text style={styles.imageCaption}>{part.caption}</Text>
      ) : null}
    </View>
  );
}

function SurveyPartView({
  part,
  onSurveyAnswer,
  surveySaveErrorText,
}: {
  part: SurveyPart;
  onSurveyAnswer?: (surveyId: string, choiceId: string) => Promise<boolean>;
  surveySaveErrorText?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  async function handlePress(choiceId: string) {
    if (selectedId !== null || isSaving) return;
    setSelectedId(choiceId);
    setErrorText(null);

    if (!onSurveyAnswer) {
      return;
    }

    setIsSaving(true);
    try {
      const didSave = await onSurveyAnswer(part.id, choiceId);
      if (!didSave) {
        setSelectedId(null);
        setErrorText(surveySaveErrorText ?? "답변을 저장하지 못했어요.");
      }
    } catch {
      setSelectedId(null);
      setErrorText(surveySaveErrorText ?? "답변을 저장하지 못했어요.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.surveyCard}>
      <Text style={styles.surveyTitle}>{part.title}</Text>
      <Text style={styles.surveyBody}>{part.body}</Text>
      <View style={styles.surveyChoices}>
        {part.choices.map((choice) => {
          const isSelected = choice.id === selectedId;
          return (
            <Pressable
              key={choice.id}
              style={({ pressed }) => [
                styles.surveyChoice,
                isSelected && styles.surveyChoiceSelected,
                pressed && !selectedId && !isSaving && styles.surveyChoicePressed,
              ]}
              onPress={() => handlePress(choice.id)}
              accessibilityRole="button"
              accessibilityLabel={choice.label}
              accessibilityState={{ selected: isSelected, disabled: isSaving }}
              disabled={isSaving}
            >
              <Text
                style={[
                  styles.surveyChoiceLabel,
                  isSelected && styles.surveyChoiceLabelSelected,
                ]}
              >
                {choice.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errorText ? <Text style={styles.surveyErrorText}>{errorText}</Text> : null}
    </View>
  );
}

function CarouselPartView({ part }: { part: CarouselPart }) {
  return (
    <View style={styles.carouselWrapper}>
      {part.title ? (
        <Text style={styles.carouselTitle}>{part.title}</Text>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CAROUSEL_CARD_WIDTH + space.md}
        snapToAlignment="start"
        contentContainerStyle={styles.carouselScroll}
        accessibilityRole="list"
      >
        {part.cards.map((card) => (
          <View key={card.id} style={styles.carouselCard}>
            <Text style={styles.carouselEyebrow} numberOfLines={1}>
              {card.eyebrow.toUpperCase()}
            </Text>
            <Text style={styles.carouselCardTitle} numberOfLines={2}>
              {card.title}
            </Text>
            <Text style={styles.carouselCardDesc} numberOfLines={3}>
              {card.description}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function QuickRepliesPartView({
  part,
  onQuickReplySelect,
}: {
  part: QuickRepliesPart;
  onQuickReplySelect?: (message: string) => void;
}) {
  return (
    <View style={styles.quickRepliesWrapper}>
      {part.title ? (
        <Text style={styles.quickRepliesTitle}>{part.title}</Text>
      ) : null}
      <View style={styles.quickRepliesRow}>
        {part.choices.map((choice) => (
          <Pressable
            key={choice.id}
            style={({ pressed }) => [
              styles.quickReplyPill,
              pressed && styles.quickReplyPillPressed,
            ]}
            onPress={() => onQuickReplySelect?.(choice.message)}
            accessibilityRole="button"
            accessibilityLabel={choice.label}
          >
            <Text style={styles.quickReplyLabel}>{choice.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function DeepLinkPartView({
  part,
  onDeepLinkPress,
}: {
  part: DeepLinkPart;
  onDeepLinkPress?: (target: string, entityId?: string) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.deepLinkCard,
        pressed && styles.deepLinkCardPressed,
      ]}
      onPress={() => onDeepLinkPress?.(part.target, part.entityId)}
      accessibilityRole="button"
      accessibilityLabel={`${part.title} — ${part.description}`}
    >
      <View style={styles.deepLinkContent}>
        <Text style={styles.deepLinkTitle}>{part.title}</Text>
        <Text style={styles.deepLinkDesc}>{part.description}</Text>
      </View>
      <Ionicons
        name="chevron-forward-outline"
        size={20}
        color={palette.accent}
      />
    </Pressable>
  );
}

// ─── Main component ───────────────────────────────────────

export function ChatPartRenderer({
  message,
  onQuickReplySelect,
  onSurveyAnswer,
  surveySaveErrorText,
  onDeepLinkPress,
}: ChatPartRendererProps): JSX.Element {
  return (
    <View style={styles.container}>
      {message.parts.map((part) => {
        switch (part.type) {
          case "text":
            return <TextPartView key={part.id} part={part} />;
          case "image":
            return <ImagePartView key={part.id} part={part} />;
          case "survey":
            return (
              <SurveyPartView
                key={part.id}
                part={part}
                onSurveyAnswer={onSurveyAnswer}
                surveySaveErrorText={surveySaveErrorText}
              />
            );
          case "carousel":
            return <CarouselPartView key={part.id} part={part} />;
          case "quickReplies":
            return (
              <QuickRepliesPartView
                key={part.id}
                part={part}
                onQuickReplySelect={onQuickReplySelect}
              />
            );
          case "deepLink":
            return (
              <DeepLinkPartView
                key={part.id}
                part={part}
                onDeepLinkPress={onDeepLinkPress}
              />
            );
          default:
            return null;
        }
      })}
    </View>
  );
}

// ─── Constants ────────────────────────────────────────────

const CAROUSEL_CARD_WIDTH = 240;

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  // Container
  container: {
    gap: space.sm,
  },

  // TextPart
  text: {
    ...typo.body,
    color: surface.textPrimary,
  },

  // ImagePart
  imagePart: {
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: 280,
    borderRadius: radii.lg,
    backgroundColor: surface.surfaceSecondary,
  },
  imageCaption: {
    ...typo.caption,
    color: surface.textSecondary,
    textAlign: "center",
    marginTop: space.xs,
    paddingHorizontal: space.xs,
  },

  // SurveyPart
  surveyCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
    ...shadows.card,
  },
  surveyTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
    marginBottom: space.sm,
  },
  surveyBody: {
    ...typo.body,
    color: surface.textSecondary,
    marginBottom: space.lg,
  },
  surveyChoices: {
    gap: space.sm,
  },
  surveyChoice: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    backgroundColor: surface.surfaceSecondary,
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    alignItems: "center",
  },
  surveyChoiceSelected: {
    backgroundColor: surface.surfaceAccent,
    borderColor: palette.accent,
  },
  surveyChoicePressed: {
    opacity: 0.7,
  },
  surveyChoiceLabel: {
    ...typo.body,
    color: surface.textPrimary,
  },
  surveyChoiceLabelSelected: {
    color: palette.accent,
    fontWeight: "600",
  },
  surveyErrorText: {
    ...typo.caption,
    color: palette.errorText,
    marginTop: space.sm,
    textAlign: "center",
  },

  // CarouselPart
  carouselWrapper: {
    gap: space.sm,
  },
  carouselTitle: {
    ...typo.label,
    color: surface.textSecondary,
  },
  carouselScroll: {
    paddingRight: space.lg,
    gap: space.md,
  },
  carouselCard: {
    width: CAROUSEL_CARD_WIDTH,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: surface.strokeSubtle,
    backgroundColor: surface.surfacePrimary,
    padding: space.xl,
    gap: space.xs,
    ...shadows.card,
  },
  carouselEyebrow: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: palette.accent,
  },
  carouselCardTitle: {
    ...typo.titleSm,
    color: surface.textPrimary,
  },
  carouselCardDesc: {
    ...typo.caption,
    color: surface.textSecondary,
    lineHeight: 18,
  },

  // QuickRepliesPart
  quickRepliesWrapper: {
    gap: space.sm,
  },
  quickRepliesTitle: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  quickRepliesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  quickReplyPill: {
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: palette.accent,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
  },
  quickReplyPillPressed: {
    backgroundColor: surface.surfaceAccent,
    opacity: 0.8,
  },
  quickReplyLabel: {
    ...typo.caption,
    color: palette.accent,
    fontWeight: "600",
  },

  // DeepLinkPart
  deepLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.xl,
    backgroundColor: surface.surfaceAccent,
    padding: space.xl,
    gap: space.md,
  },
  deepLinkCardPressed: {
    opacity: 0.75,
  },
  deepLinkContent: {
    flex: 1,
    gap: space.xs,
  },
  deepLinkTitle: {
    ...typo.body,
    color: surface.textPrimary,
    fontWeight: "700",
  },
  deepLinkDesc: {
    ...typo.caption,
    color: surface.textSecondary,
  },
});
