import { unstable_cache, revalidateTag } from "next/cache";

import { createAdminServices } from "./create-admin-services";

const ADMIN_DASHBOARD_TAG = "admin-dashboard";
const ADMIN_WEEKS_TAG = "admin-content-weeks";
const ADMIN_KNOWLEDGE_TAG = "admin-content-knowledge";
const ADMIN_DOCUMENTS_TAG = "admin-content-documents";
const ADMIN_WORKFLOWS_TAG = "admin-content-workflows";

export function getAdminDashboardTag() {
  return ADMIN_DASHBOARD_TAG;
}

export function getAdminWeeksTag() {
  return ADMIN_WEEKS_TAG;
}

export function getAdminKnowledgeTag() {
  return ADMIN_KNOWLEDGE_TAG;
}

export function getAdminDocumentsTag() {
  return ADMIN_DOCUMENTS_TAG;
}

export function getAdminWorkflowsTag() {
  return ADMIN_WORKFLOWS_TAG;
}

export function getAdminWeekDetailTag(weekNumber: number) {
  return `admin-content-week-${weekNumber}`;
}

export const loadCachedAdminDashboard = unstable_cache(
  async () => {
    const services = createAdminServices();
    return services.adminDashboardPort.getDashboard();
  },
  ["admin-dashboard"],
  {
    revalidate: 30,
    tags: [
      ADMIN_DASHBOARD_TAG,
      ADMIN_DOCUMENTS_TAG,
      ADMIN_WORKFLOWS_TAG,
      ADMIN_WEEKS_TAG,
    ],
  },
);

export const loadCachedAdminWeeks = unstable_cache(
  async () => {
    const services = createAdminServices();
    return services.adminContentPort.listWeeks();
  },
  ["admin-content-weeks"],
  {
    revalidate: 30,
    tags: [ADMIN_WEEKS_TAG],
  },
);

export async function loadCachedAdminWeekDetail(weekNumber: number) {
  return unstable_cache(
    async () => {
      const services = createAdminServices();
      return services.adminContentPort.getWeek(weekNumber);
    },
    ["admin-content-week", String(weekNumber)],
    {
      revalidate: 30,
      tags: [ADMIN_WEEKS_TAG, getAdminWeekDetailTag(weekNumber)],
    },
  )();
}

export const loadCachedAdminKnowledgeItems = unstable_cache(
  async () => {
    const services = createAdminServices();
    return services.adminContentPort.listKnowledgeItems();
  },
  ["admin-content-knowledge"],
  {
    revalidate: 30,
    tags: [ADMIN_KNOWLEDGE_TAG],
  },
);

export function revalidateAdminDashboardCache() {
  revalidateTag(ADMIN_DASHBOARD_TAG);
}

export function revalidateAdminWeeksCache(weekNumber?: number) {
  revalidateTag(ADMIN_WEEKS_TAG);
  if (typeof weekNumber === "number") {
    revalidateTag(getAdminWeekDetailTag(weekNumber));
  }
  revalidateTag(ADMIN_DASHBOARD_TAG);
}

export function revalidateAdminKnowledgeCache() {
  revalidateTag(ADMIN_KNOWLEDGE_TAG);
}

export function revalidateAdminDocumentsCache() {
  revalidateTag(ADMIN_DOCUMENTS_TAG);
  revalidateTag(ADMIN_DASHBOARD_TAG);
}

export function revalidateAdminWorkflowCache() {
  revalidateTag(ADMIN_WORKFLOWS_TAG);
  revalidateTag(ADMIN_DASHBOARD_TAG);
}
