"use client";

import type { AdminMetric } from "@gynecology-chatbot/app-core";

import styles from "./AdminConsoleLayout.module.css";

interface AdminMetricsBarProps {
  metrics: AdminMetric[];
}

export function AdminMetricsBar({ metrics }: AdminMetricsBarProps) {
  return (
    <section className={styles.metricsGrid}>
      {metrics.map((metric) => (
        <article key={metric.id} className={styles.metricCard}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          <span>{metric.changeLabel}</span>
        </article>
      ))}
    </section>
  );
}
