import { NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";

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
    const numericWeekNumber = Number(weekNumber);
    if (
      !Number.isInteger(numericWeekNumber) ||
      numericWeekNumber < 1 ||
      numericWeekNumber > 40
    ) {
      return NextResponse.json(
        { error: "invalid week number" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    const week = await services.adminContentPort.getWeek(numericWeekNumber);
    if (!week) {
      return NextResponse.json({ error: "week not found" }, { status: 404 });
    }

    return NextResponse.json({ week });
  } catch (error) {
    console.error("admin content week detail route error", error);
    return NextResponse.json(
      { error: "failed to load week detail" },
      { status: 500 },
    );
  }
}
