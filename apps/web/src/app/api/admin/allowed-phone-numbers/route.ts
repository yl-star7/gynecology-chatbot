import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const services = createAdminServices();
    const allowedPhoneNumbers =
      await services.adminUserPort.listAllowedPhoneNumbers();

    return NextResponse.json({ allowedPhoneNumbers });
  } catch (error) {
    console.error("admin allowed phone numbers get route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to load allowed phone numbers",
      },
      { status: 400 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "phoneNumber is required" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    const allowedPhoneNumber =
      await services.adminUserPort.createAllowedPhoneNumber({
        actorId: admin.id,
        phoneNumber,
        displayName: displayName || null,
        note: note || null,
      });

    return NextResponse.json({ allowedPhoneNumber });
  } catch (error) {
    console.error("admin allowed phone numbers post route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to create allowed phone number",
      },
      { status: 400 },
    );
  }
}
