import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";
import { revalidateAdminWeeksCache } from "@/lib/admin/admin-cache";

function parseWeekNumber(weekNumber: string) {
  const numericWeekNumber = Number(weekNumber);
  if (
    !Number.isInteger(numericWeekNumber) ||
    numericWeekNumber < 1 ||
    numericWeekNumber > 40
  ) {
    return null;
  }

  return numericWeekNumber;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ weekNumber: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { weekNumber } = await context.params;
    const numericWeekNumber = parseWeekNumber(weekNumber);
    if (!numericWeekNumber) {
      return NextResponse.json(
        { error: "invalid week number" },
        { status: 400 },
      );
    }

    return proxyAdminApiRequest(
      `content/weeks/${encodeURIComponent(String(numericWeekNumber))}`,
      { admin, method: "GET" },
    );
  } catch (error) {
    console.error("admin content week detail GET proxy error", error);
    return NextResponse.json(
      { error: "failed to load week detail" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ weekNumber: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { weekNumber } = await context.params;
    const numericWeekNumber = parseWeekNumber(weekNumber);
    if (!numericWeekNumber) {
      return NextResponse.json(
        { error: "invalid week number" },
        { status: 400 },
      );
    }

    const response = await proxyAdminApiRequest(
      `content/weeks/${encodeURIComponent(String(numericWeekNumber))}`,
      { admin, request, method: "PATCH" },
    );
    if (response.ok) {
      revalidateAdminWeeksCache(numericWeekNumber);
    }

    return response;
  } catch (error) {
    console.error("admin content week update PATCH proxy error", error);
    return NextResponse.json(
      { error: "failed to update week detail" },
      { status: 500 },
    );
  }
}
