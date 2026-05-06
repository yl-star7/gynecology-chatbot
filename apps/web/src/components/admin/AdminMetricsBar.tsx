"use client";

import { useEffect, useState } from "react";

import type { AdminMetric } from "@gynecology-chatbot/app-core";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

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
  { key: "todaySessions", label: "오늘 상담" },
  { key: "weekMessages", label: "주간 메시지" },
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
          setError(
            err instanceof Error
              ? err.message
              : "데이터를 불러오지 못했습니다.",
          );
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
    <section className="space-y-6">
      <div className="space-y-4">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          핵심 운영 지표
        </p>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {ANALYTICS_CARDS.slice(0, 4).map(({ key }) => (
              <Skeleton key={key} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : null}

        {error && !loading ? (
          <div className="space-y-3">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            {metrics.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {metrics.slice(0, 4).map((metric) => (
                  <Card key={metric.id} className="shadow-sm">
                    <CardHeader className="pb-2">
                      <CardDescription>{metric.label}</CardDescription>
                      <CardTitle className="text-2xl">{metric.value}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {metric.changeLabel}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {analytics && !loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {ANALYTICS_CARDS.map(({ key, label }) => (
              <Card key={key} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>{label}</CardDescription>
                  <CardTitle className="text-2xl">{analytics[key]}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : null}

        {analytics?.dailyTrend &&
        analytics.dailyTrend.length > 0 &&
        !loading ? (
          <AdminTrendChart dailyTrend={analytics.dailyTrend} />
        ) : null}

        {analytics && !loading ? (
          <AdminUserDistributionChart
            totalUsers={analytics.totalUsers}
            onboardedUsers={analytics.onboardedUsers}
            pushEnabled={analytics.pushEnabled}
          />
        ) : null}
      </div>
    </section>
  );
}
