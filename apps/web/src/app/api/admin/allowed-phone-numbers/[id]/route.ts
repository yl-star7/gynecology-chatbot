import { NextRequest, NextResponse } from "next/server";
import { readAdminSessionUser } from "@/lib/admin/auth";
import { createAdminServices } from "@/lib/admin/create-admin-services";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!id || !phoneNumber) {
      return NextResponse.json(
        { error: "id and phoneNumber are required" },
        { status: 400 },
      );
    }

    const services = createAdminServices();
    const allowedPhoneNumber =
      await services.adminUserPort.updateAllowedPhoneNumber({
        actorId: admin.id,
        id,
        phoneNumber,
        displayName: displayName || null,
        note: note || null,
      });

    return NextResponse.json({ allowedPhoneNumber });
  } catch (error) {
    console.error("admin allowed phone numbers patch route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to update allowed phone number",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const services = createAdminServices();
    await services.adminUserPort.deleteAllowedPhoneNumber({
      actorId: admin.id,
      id,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("admin allowed phone numbers delete route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to delete allowed phone number",
      },
      { status: 400 },
    );
  }
}
