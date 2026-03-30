"use client";

import styles from "./AdminConsoleLayout.module.css";

interface DailyTrendItem {
  date: string;
  sessions: number;
  logins: number;
  messages: number;
}

interface AdminTrendChartProps {
  dailyTrend: DailyTrendItem[];
}

const CHART_WIDTH = 560;
const CHART_HEIGHT = 220;
const PADDING_LEFT = 40;
const PADDING_RIGHT = 16;
const PADDING_TOP = 12;
const PADDING_BOTTOM = 32;

const COLOR_SESSIONS = "#0f62fe"; // --admin-accent
const COLOR_LOGINS = "#198038"; // --admin-success
const COLOR_MESSAGES = "#8a3ffc"; // purple

export function AdminTrendChart({ dailyTrend }: AdminTrendChartProps) {
  if (!dailyTrend || dailyTrend.length === 0) return null;

  const maxValue = Math.max(
    ...dailyTrend.map((d) => Math.max(d.sessions, d.logins, d.messages)),
    1,
  );

  const niceMax = Math.ceil(maxValue / 5) * 5 || 5;

  const plotWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
  const plotHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

  const groupWidth = plotWidth / dailyTrend.length;
  const barWidth = Math.min(groupWidth * 0.22, 18);
  const barGap = Math.max(barWidth * 0.15, 2);

  const yTicks = [0, Math.round(niceMax / 2), niceMax];

  function yPos(value: number): number {
    return PADDING_TOP + plotHeight - (value / niceMax) * plotHeight;
  }

  return (
    <div className={styles.trendChartSection}>
      <p className={styles.trendChartHeader}>주간 활동 추이</p>
      <div className={styles.trendChartContainer}>
        <div className={styles.trendLegend}>
          <span className={styles.trendLegendItem}>
            <span className={styles.trendLegendDot} style={{ background: COLOR_SESSIONS }} />
            상담
          </span>
          <span className={styles.trendLegendItem}>
            <span className={styles.trendLegendDot} style={{ background: COLOR_LOGINS }} />
            로그인
          </span>
          <span className={styles.trendLegendItem}>
            <span className={styles.trendLegendDot} style={{ background: COLOR_MESSAGES }} />
            메시지
          </span>
        </div>

        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          width="100%"
          height="auto"
          role="img"
          aria-label="주간 활동 추이 차트"
          style={{ display: "block", maxWidth: CHART_WIDTH }}
        >
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={PADDING_LEFT}
                y1={yPos(tick)}
                x2={CHART_WIDTH - PADDING_RIGHT}
                y2={yPos(tick)}
                stroke="#d9e1ec"
                strokeWidth={1}
                strokeDasharray={tick === 0 ? "0" : "4 3"}
              />
              <text
                x={PADDING_LEFT - 8}
                y={yPos(tick) + 4}
                textAnchor="end"
                fontSize={11}
                fill="#74829a"
              >
                {tick}
              </text>
            </g>
          ))}

          {dailyTrend.map((day, i) => {
            const groupX = PADDING_LEFT + groupWidth * i + groupWidth / 2;
            const totalBarSpan = barWidth * 3 + barGap * 2;
            const startX = groupX - totalBarSpan / 2;

            const bars = [
              { value: day.sessions, color: COLOR_SESSIONS, label: "상담" },
              { value: day.logins, color: COLOR_LOGINS, label: "로그인" },
              { value: day.messages, color: COLOR_MESSAGES, label: "메시지" },
            ];

            return (
              <g key={day.date}>
                {bars.map((bar, bi) => {
                  const bx = startX + bi * (barWidth + barGap);
                  const bh = (bar.value / niceMax) * plotHeight;
                  return (
                    <g key={bar.label}>
                      <rect
                        x={bx}
                        y={yPos(bar.value)}
                        width={barWidth}
                        height={Math.max(bh, 0)}
                        rx={3}
                        fill={bar.color}
                        opacity={0.85}
                      >
                        <title>{`${day.date} ${bar.label}: ${bar.value}`}</title>
                      </rect>
                      {bar.value > 0 && (
                        <text
                          x={bx + barWidth / 2}
                          y={yPos(bar.value) - 4}
                          textAnchor="middle"
                          fontSize={9}
                          fontWeight={600}
                          fill={bar.color}
                        >
                          {bar.value}
                        </text>
                      )}
                    </g>
                  );
                })}
                <text
                  x={groupX}
                  y={CHART_HEIGHT - 8}
                  textAnchor="middle"
                  fontSize={11}
                  fill="#74829a"
                >
                  {day.date}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ── 사용자 분포 도넛 차트 ────────────────────────────────────

interface UserDistributionProps {
  totalUsers: number;
  onboardedUsers: number;
  pushEnabled: number;
}

const DONUT_SIZE = 160;
const DONUT_RADIUS = 60;
const DONUT_STROKE = 20;
const DONUT_CENTER = DONUT_SIZE / 2;

export function AdminUserDistributionChart({
  totalUsers,
  onboardedUsers,
  pushEnabled,
}: UserDistributionProps) {
  if (totalUsers === 0) return null;

  const segments = [
    { label: "푸시 활성", value: pushEnabled, color: "#198038" },
    { label: "온보딩 완료", value: Math.max(onboardedUsers - pushEnabled, 0), color: "#0f62fe" },
    { label: "미온보딩", value: Math.max(totalUsers - onboardedUsers, 0), color: "#d9e1ec" },
  ].filter((s) => s.value > 0);

  const circumference = 2 * Math.PI * DONUT_RADIUS;
  let offset = 0;

  return (
    <div className={styles.trendChartSection}>
      <p className={styles.trendChartHeader}>사용자 분포</p>
      <div className={styles.trendChartContainer} style={{ display: "flex", alignItems: "center", gap: 32 }}>
        <svg
          viewBox={`0 0 ${DONUT_SIZE} ${DONUT_SIZE}`}
          width={DONUT_SIZE}
          height={DONUT_SIZE}
          role="img"
          aria-label="사용자 분포 차트"
        >
          {segments.map((seg) => {
            const ratio = seg.value / totalUsers;
            const dashLength = ratio * circumference;
            const dashOffset = -offset;
            offset += dashLength;
            return (
              <circle
                key={seg.label}
                cx={DONUT_CENTER}
                cy={DONUT_CENTER}
                r={DONUT_RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth={DONUT_STROKE}
                strokeDasharray={`${dashLength} ${circumference - dashLength}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${DONUT_CENTER} ${DONUT_CENTER})`}
              >
                <title>{`${seg.label}: ${seg.value}명`}</title>
              </circle>
            );
          })}
          <text
            x={DONUT_CENTER}
            y={DONUT_CENTER - 6}
            textAnchor="middle"
            fontSize={22}
            fontWeight={700}
            fill="#21272a"
          >
            {totalUsers}
          </text>
          <text
            x={DONUT_CENTER}
            y={DONUT_CENTER + 12}
            textAnchor="middle"
            fontSize={11}
            fill="#74829a"
          >
            전체
          </text>
        </svg>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {segments.map((seg) => (
            <span key={seg.label} className={styles.trendLegendItem} style={{ fontSize: 13 }}>
              <span className={styles.trendLegendDot} style={{ background: seg.color }} />
              {seg.label}: {seg.value}명
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
