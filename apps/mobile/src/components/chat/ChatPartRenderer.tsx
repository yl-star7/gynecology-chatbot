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
  space,
  typo,
} from "../../theme";
import {
  normalizeChatMarkdownLines,
  resolveQuickReplyDisplayLabel,
} from "./ChatPartRenderer.model";

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
  weekNumber?: number;
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
  onQuickReplySelect?: (message: string, choiceId?: string) => void;
  onSurveyAnswer?: (surveyId: string, choiceId: string) => Promise<boolean>;
  surveySaveErrorText?: string;
  onDeepLinkPress?: (
    target: string,
    entityId?: string,
    meta?: {
      title?: string;
      description?: string;
      weekNumber?: number | null;
    },
  ) => void;
}

// ─── Part renderers ───────────────────────────────────────

function renderBoldInline(
  text: string,
  keyPrefix: string,
  counter: { i: number },
) {
  const nodes: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        <Text key={`${keyPrefix}-t-${counter.i++}`}>
          {text.slice(lastIndex, match.index)}
        </Text>,
      );
    }
    nodes.push(
      <Text key={`${keyPrefix}-b-${counter.i++}`} style={styles.mdBold}>
        {match[1]}
      </Text>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(
      <Text key={`${keyPrefix}-t-${counter.i++}`}>
        {text.slice(lastIndex)}
      </Text>,
    );
  }
  return nodes;
}

function renderInline(text: string, keyPrefix: string) {
  const nodes: React.ReactNode[] = [];
  const counter = { i: 0 };
  const quoteRegex = /"([^"]*\*\*[^*]+\*\*[^"]*)"/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = quoteRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        ...renderBoldInline(
          text.slice(lastIndex, match.index),
          `${keyPrefix}-pre${counter.i++}`,
          counter,
        ),
      );
    }
    const innerKey = `${keyPrefix}-q${counter.i++}`;
    nodes.push(
      <Text key={innerKey} style={styles.mdQuoteBold}>
        <Text style={styles.mdQuoteMark}>“</Text>
        {renderBoldInline(match[1], `${innerKey}-in`, counter)}
        <Text style={styles.mdQuoteMark}>”</Text>
      </Text>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    nodes.push(
      ...renderBoldInline(
        text.slice(lastIndex),
        `${keyPrefix}-post${counter.i++}`,
        counter,
      ),
    );
  }
  return nodes;
}

function TextPartView({ part }: { part: TextPart }) {
  const lines = normalizeChatMarkdownLines(part.text);
  const blocks: React.ReactNode[] = [];
  let paragraph: string[] = [];
  let bullets: string[] = [];

  const flushParagraph = (key: string) => {
    if (paragraph.length === 0) return;
    const joined = paragraph.join("\n");
    blocks.push(
      <Text key={key} style={styles.mdParagraph}>
        {renderInline(joined, key)}
      </Text>,
    );
    paragraph = [];
  };
  const flushBullets = (key: string) => {
    if (bullets.length === 0) return;
    blocks.push(
      <View key={key} style={styles.mdList}>
        {bullets.map((item, idx) => (
          <View key={`${key}-${idx}`} style={styles.mdListItem}>
            <Text style={styles.mdBullet}>•</Text>
            <Text style={styles.mdListItemText}>
              {renderInline(item, `${key}-${idx}`)}
            </Text>
          </View>
        ))}
      </View>,
    );
    bullets = [];
  };

  lines.forEach((raw, idx) => {
    const line = raw.trimEnd();
    const key = `ln-${idx}`;
    const headingMatch = /^(#{1,3})\s+(.*)$/.exec(line);
    const bulletMatch = /^\s*[-*]\s+(.*)$/.exec(line);
    const quoteMatch = /^\s*>\s+(.*)$/.exec(line);

    if (line.trim() === "") {
      flushParagraph(`${key}-p`);
      flushBullets(`${key}-u`);
      return;
    }
    if (headingMatch) {
      flushParagraph(`${key}-p`);
      flushBullets(`${key}-u`);
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const headingStyle =
        level === 1 ? styles.mdH1 : level === 2 ? styles.mdH2 : styles.mdH3;
      blocks.push(
        <Text key={key} style={headingStyle}>
          {renderInline(content, key)}
        </Text>,
      );
      return;
    }
    if (bulletMatch) {
      flushParagraph(`${key}-p`);
      bullets.push(bulletMatch[1]);
      return;
    }
    if (quoteMatch) {
      flushParagraph(`${key}-p`);
      flushBullets(`${key}-u`);
      blocks.push(
        <View key={key} style={styles.mdQuote}>
          <Text style={styles.mdQuoteText}>
            {renderInline(quoteMatch[1], key)}
          </Text>
        </View>,
      );
      return;
    }
    flushBullets(`${key}-u`);
    paragraph.push(line.trim());
  });
  flushParagraph("p-final");
  flushBullets("u-final");

  return <View style={styles.mdRoot}>{blocks}</View>;
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
  const [isExpanded, setIsExpanded] = useState(false);

  const shouldCollapse =
    part.choices.length > MAX_VISIBLE_SURVEY_CHOICES && !isExpanded;
  const visibleChoices = shouldCollapse
    ? part.choices.slice(0, MAX_VISIBLE_SURVEY_CHOICES)
    : part.choices;
  const hiddenCount = part.choices.length - MAX_VISIBLE_SURVEY_CHOICES;

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
        {visibleChoices.map((choice) => {
          const isSelected = choice.id === selectedId;
          return (
            <Pressable
              key={choice.id}
              style={({ pressed }) => [
                styles.surveyChoice,
                isSelected && styles.surveyChoiceSelected,
                pressed &&
                  !selectedId &&
                  !isSaving &&
                  styles.surveyChoicePressed,
              ]}
              onPress={() => handlePress(choice.id)}
              accessibilityRole="button"
              accessibilityLabel={choice.label}
              accessibilityState={{ selected: isSelected, disabled: isSaving }}
              disabled={isSaving}
            >
              <Text
                numberOfLines={2}
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
        {shouldCollapse ? (
          <Pressable
            style={styles.surveyMoreButton}
            onPress={() => setIsExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel={`더보기 (+${hiddenCount})`}
          >
            <Text
              style={styles.surveyMoreLabel}
            >{`더보기 (+${hiddenCount})`}</Text>
          </Pressable>
        ) : null}
      </View>
      {errorText ? (
        <Text style={styles.surveyErrorText}>{errorText}</Text>
      ) : null}
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
  onQuickReplySelect?: (message: string, choiceId?: string) => void;
}) {
  const [didChoose, setDidChoose] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (didChoose) {
    return null;
  }

  const shouldCollapse = part.choices.length > MAX_VISIBLE_QUICK && !isExpanded;
  const visibleChoices = shouldCollapse
    ? part.choices.slice(0, MAX_VISIBLE_QUICK)
    : part.choices;
  const hiddenCount = part.choices.length - MAX_VISIBLE_QUICK;

  return (
    <View style={styles.quickRepliesWrapper}>
      {part.title ? (
        <Text style={styles.quickRepliesTitle}>{part.title}</Text>
      ) : null}
      <View style={styles.quickRepliesRow}>
        {visibleChoices.map((choice) => (
          <Pressable
            key={choice.id}
            style={({ pressed }) => [
              styles.quickReplyPill,
              pressed && styles.quickReplyPillPressed,
            ]}
            onPress={() => {
              setDidChoose(true);
              onQuickReplySelect?.(choice.message, choice.id);
            }}
            accessibilityRole="button"
            accessibilityLabel={choice.label}
          >
            <Text numberOfLines={2} style={styles.quickReplyLabel}>
              {resolveQuickReplyDisplayLabel(choice.label)}
            </Text>
          </Pressable>
        ))}
        {shouldCollapse ? (
          <Pressable
            style={styles.quickReplyMorePill}
            onPress={() => setIsExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel={`더보기 (+${hiddenCount})`}
          >
            <Text style={styles.quickReplyLabel}>
              {`더보기 (+${hiddenCount})`}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function DeepLinkPartView({
  part,
  onDeepLinkPress,
}: {
  part: DeepLinkPart;
  onDeepLinkPress?: ChatPartRendererProps["onDeepLinkPress"];
}) {
  const title = part.title?.trim() || "연결된 정보";
  return (
    <Pressable
      style={({ pressed }) => [
        styles.deepLinkCard,
        pressed && styles.deepLinkCardPressed,
      ]}
      onPress={() =>
        onDeepLinkPress?.(part.target, part.entityId, {
          title,
          description: part.description,
          weekNumber: part.weekNumber ?? null,
        })
      }
      accessibilityRole="button"
      accessibilityLabel={`${title} — ${part.description}`}
    >
      <View style={styles.deepLinkContent}>
        <Text style={styles.deepLinkTitle} numberOfLines={2}>
          {title}
        </Text>
      </View>
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
const CHAT_IMAGE_WIDTH = space.xxxl * 5;
const MAX_VISIBLE_SURVEY_CHOICES = 3;
const MAX_VISIBLE_QUICK = 4;

// ─── Styles ───────────────────────────────────────────────

const styles = StyleSheet.create({
  // Container
  container: {
    gap: space.sm,
    alignSelf: "stretch",
    width: "100%",
  },

  // TextPart (Markdown)
  text: {
    ...typo.body,
    color: surface.textPrimary,
  },
  mdRoot: {
    gap: space.xs,
    width: "100%",
  },
  mdParagraph: {
    ...typo.body,
    color: surface.textPrimary,
    fontSize: 15.5,
    fontWeight: "500",
    lineHeight: 24,
  },
  mdBold: {
    fontWeight: "800",
    color: surface.textPrimary,
  },
  mdH1: {
    ...typo.titleSm,
    fontSize: 20,
    fontWeight: "700",
    color: surface.textPrimary,
    marginTop: space.xs,
  },
  mdH2: {
    ...typo.titleSm,
    fontSize: 17,
    fontWeight: "700",
    color: surface.textPrimary,
    marginTop: space.xs,
  },
  mdH3: {
    ...typo.body,
    fontSize: 15,
    fontWeight: "700",
    color: surface.textPrimary,
    marginTop: space.xs,
  },
  mdList: {
    gap: 2,
    paddingLeft: space.xs,
    width: "100%",
  },
  mdListItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space.xs,
  },
  mdBullet: {
    ...typo.body,
    color: palette.accent,
    lineHeight: 22,
  },
  mdListItemText: {
    ...typo.body,
    color: surface.textPrimary,
    flex: 1,
    lineHeight: 22,
  },
  mdQuote: {
    paddingLeft: space.sm,
    paddingVertical: 2,
    backgroundColor: surface.surfaceAccent,
    borderRadius: radii.sm,
  },
  mdQuoteText: {
    ...typo.body,
    color: surface.textSecondary,
    fontStyle: "italic",
  },

  // ImagePart
  imagePart: {
    borderRadius: radii.lg,
    overflow: "hidden",
  },
  image: {
    width: CHAT_IMAGE_WIDTH,
    maxWidth: "100%",
    height: 280,
    borderRadius: radii.lg,
    backgroundColor: surface.surfaceSecondary,
    alignSelf: "stretch",
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
    borderRadius: radii.lg,
    backgroundColor: surface.surfaceSecondary,
    padding: space.md,
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
    backgroundColor: surface.surfacePrimary,
    paddingVertical: space.sm,
    paddingHorizontal: space.md,
    alignItems: "center",
  },
  surveyChoiceSelected: {
    backgroundColor: surface.surfaceAccent,
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
    borderRadius: radii.lg,
    backgroundColor: surface.surfacePrimary,
    padding: space.md,
    gap: space.xs,
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
    gap: space.xs,
  },
  quickRepliesTitle: {
    ...typo.caption,
    color: surface.textSecondary,
  },
  quickRepliesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    gap: space.xs,
  },
  quickReplyPill: {
    borderRadius: radii.full,
    backgroundColor: surface.surfacePrimary,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    maxWidth: "100%",
    minWidth: 0,
    flexShrink: 1,
  },
  quickReplyPillPressed: {
    backgroundColor: surface.surfaceAccent,
    opacity: 0.8,
  },
  quickReplyLabel: {
    ...typo.caption,
    color: palette.accent,
    fontWeight: "600",
    flexShrink: 1,
    flexWrap: "wrap",
  },

  // DeepLinkPart
  deepLinkCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.full,
    backgroundColor: surface.surfaceAccent,
    paddingVertical: space.xs,
    paddingHorizontal: space.lg,
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  deepLinkCardPressed: {
    opacity: 0.75,
  },
  deepLinkContent: {
    flexShrink: 1,
    minWidth: 0,
  },
  deepLinkTitle: {
    ...typo.label,
    color: palette.accent,
    fontWeight: "700",
  },
  deepLinkDesc: {
    ...typo.caption,
    color: surface.textSecondary,
  },
});
