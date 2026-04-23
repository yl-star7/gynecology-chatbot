"use client";

import {
  MOBILE_THEME_OPTIONS,
  type MobileThemeKey,
} from "@gynecology-chatbot/app-core";

const THEME_BUTTON_LABELS: Record<MobileThemeKey, string> = {
  "rose-sand": "핑크",
  "soft-peach": "피치",
  "mint-neutral": "연두",
  "sky-blue": "하늘색",
};

export function MobileThemePresetButtons({
  selectedThemeKey,
  onSelect,
  label = "빠른 테마",
  compact = false,
}: {
  selectedThemeKey: MobileThemeKey;
  onSelect: (themeKey: MobileThemeKey) => void;
  label?: string;
  compact?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[var(--text)]">{label}</span>
        <span className="text-xs text-[var(--text-soft)]">
          한 번 누르면 바로 적용
        </span>
      </div>
      <div
        aria-label={label}
        className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-3"}`}
        role="group"
      >
        {MOBILE_THEME_OPTIONS.map((option) => {
          const isSelected = option.key === selectedThemeKey;

          return (
            <button
              key={option.key}
              aria-label={`${THEME_BUTTON_LABELS[option.key]} 테마 적용`}
              aria-pressed={isSelected}
              className={`rounded-[18px] border px-3 py-3 text-left transition ${
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent-soft)]"
                  : "border-[var(--line)] bg-[var(--panel-muted)]"
              }`}
              onClick={() => onSelect(option.key)}
              type="button"
            >
              <span className="block text-sm font-semibold text-[var(--text)]">
                {THEME_BUTTON_LABELS[option.key]}
              </span>
              <span className="mt-1 block text-[11px] leading-5 text-[var(--text-soft)]">
                {compact ? option.label : option.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
