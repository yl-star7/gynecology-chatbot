"use client";

import type { ElementType, ReactNode } from "react";

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function MobileCard({
  as,
  children,
  className,
  ...props
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
  [key: string]: unknown;
}) {
  const Component = (as ?? "section") as ElementType;

  return (
    <Component
      {...(props as Record<string, unknown>)}
      className={joinClasses(
        "rounded-[28px] border border-[var(--line)] bg-[var(--panel)] shadow-[var(--shadow)]",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function MobileSectionIntro({
  eyebrow,
  title,
  description,
  eyebrowTone = "accent",
  size = "hero",
  titleAs,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  eyebrowTone?: "accent" | "muted";
  size?: "hero" | "section";
  titleAs?: ElementType;
}) {
  const Heading = titleAs ?? (size === "hero" ? "h1" : "h2");

  return (
    <>
      <p
        className={joinClasses(
          "text-xs font-semibold uppercase",
          size === "hero" ? "tracking-[0.24em]" : "tracking-[0.18em]",
          eyebrowTone === "accent"
            ? "text-[var(--accent-dark)]"
            : "text-[var(--text-soft)]",
        )}
      >
        {eyebrow}
      </p>
      <Heading
        className={joinClasses(
          "font-semibold text-[var(--text)]",
          size === "hero"
            ? "mt-3 text-[30px] tracking-[-0.04em]"
            : "mt-2 text-xl",
        )}
      >
        {title}
      </Heading>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
          {description}
        </p>
      ) : null}
    </>
  );
}

export function MobileFormField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-[var(--text)]">{label}</span>
      {children}
    </label>
  );
}

export function MobileNotice({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "accent";
}) {
  return (
    <p
      aria-live="polite"
      className={joinClasses(
        "rounded-2xl border border-[var(--line)] px-3 py-2 text-sm",
        tone === "accent"
          ? "bg-[var(--accent-soft)] text-[var(--accent-dark)]"
          : "bg-[var(--panel-muted)] text-[var(--accent-dark)]",
      )}
    >
      {children}
    </p>
  );
}
