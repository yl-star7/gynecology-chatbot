"use client";

import { useEffect, useState } from "react";

import type { AdminMetric } from "@gynecology-chatbot/app-core";

import styles from "./AdminConsoleLayout.module.css";
import { AdminTrendChart, AdminUserDistributionChart } from "./AdminTrendChart";

interface AdminMetricsBarProps {
  metrics: AdminMetric[];
}

interface DailyTrendItem {
  date: string;
  sessions: number;
  logins: number;
  messages: number;
}

interface LiveAnalytics {
  totalUsers: number;
  onboardedUsers: number;
  todaySessions: number;
  weekMessages: number;
  todayLogins: number;
  weekLogins: number;
  todayEmotions: number;
  pushEnabled: number;
  dailyTrend?: DailyTrendItem[];
}

type NumericAnalyticsKey = Exclude<keyof LiveAnalytics, "dailyTrend">;

const ANALYTICS_CARDS: {
  key: NumericAnalyticsKey;
  label: string;
}[] = [
  { key: "totalUsers", label: "전체 사용자" },
  { key: "onboardedUsers", label: "온보딩 완료" },
  { key: "todaySessions", label: "오늘 상담" },
  { key: "weekMessages", label: "주간 메시지" },
  { key: "todayLogins", label: "오늘 로그인" },
  { key: "weekLogins", label: "주간 로그인" },
  { key: "todayEmotions", label: "오늘 감정 체크인" },
  { key: "pushEnabled", label: "푸시 활성" },
];

export function AdminMetricsBar({ metrics }: AdminMetricsBarProps) {
  const [analytics, setAnalytics] = useState<LiveAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalytics() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) {
          throw new Error(`서버 오류 (${res.status})`);
        }
        const data: LiveAnalytics = await res.json();
        if (!cancelled) {
          setAnalytics(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "데이터를 불러오지 못했습니다.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void fetchAnalytics();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section>
      <div className={styles.metricsGrid}>
        {metrics.map((metric) => (
          <article key={metric.id} className={styles.metricCard}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <span>{metric.changeLabel}</span>
          </article>
        ))}
      </div>

      <div className={styles.analyticsSection}>
        <p className={styles.analyticsSectionHeader}>실시간 운영 현황</p>

        {loading && (
          <div className={styles.analyticsLoading} role="status" aria-live="polite">
            데이터를 불러오는 중...
          </div>
        )}

        {error && !loading && (
          <div className={styles.analyticsError} role="alert">
            {error}
          </div>
        )}

        {analytics && !loading && (
          <div className={styles.analyticsGrid}>
            {ANALYTICS_CARDS.map(({ key, label }) => (
              <article key={key} className={styles.analyticsCard}>
                <span>{label}</span>
                <strong>{analytics[key]}</strong>
              </article>
            ))}
          </div>
        )}

        {analytics?.dailyTrend && analytics.dailyTrend.length > 0 && !loading && (
          <AdminTrendChart dailyTrend={analytics.dailyTrend} />
        )}

        {analytics && !loading && (
          <AdminUserDistributionChart
            totalUsers={analytics.totalUsers}
            onboardedUsers={analytics.onboardedUsers}
            pushEnabled={analytics.pushEnabled}
          />
        )}
      </div>
    </section>
  );
}
