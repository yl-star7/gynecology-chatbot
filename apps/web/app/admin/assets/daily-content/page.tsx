import type { AdminWeekDetail, AdminWeekSummary } from "@gynecology-chatbot/app-core";

import AdminPageFrame from "@/components/AdminPageFrame";
import { AdminDailyContentMatrix } from "@/components/admin/content/AdminDailyContentMatrix";
import { fetchAdminApiJson } from "@/lib/admin/api-server";
import { requireAdminSession } from "@/lib/admin/auth";

async function loadDailyContentWeeks(admin: { id: string }) {
  const { weeks } = await fetchAdminApiJson<{ weeks: AdminWeekSummary[] }>(
    "content/weeks",
    { admin },
  );

  const visibleWeeks = weeks
    .filter((week) => week.weekNumber >= 5 && week.weekNumber <= 40)
    .sort((left, right) => left.weekNumber - right.weekNumber);

  const details = await Promise.all(
    visibleWeeks.map(async (week) => {
      const payload = await fetchAdminApiJson<{ week: AdminWeekDetail }>(
        `content/weeks/${week.weekNumber}`,
        { admin },
      );
      return payload.week;
    }),
  );

  return details;
}

export default async function AdminDailyContentRoute() {
  const admin = await requireAdminSession();
  const weeks = await loadDailyContentWeeks(admin);

  return (
    <AdminPageFrame
      adminDisplayName={admin.displayName}
      currentPath="/admin/assets/daily-content"
      title="일별 콘텐츠"
    >
      <AdminDailyContentMatrix weeks={weeks} />
    </AdminPageFrame>
  );
}
