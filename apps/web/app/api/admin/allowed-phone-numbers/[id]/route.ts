import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

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
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    return proxyAdminApiRequest(
      `allowed-phone-numbers/${encodeURIComponent(id)}`,
      {
        admin,
        request,
        method: "PUT",
      },
    );
  } catch (error) {
    console.error("admin allowed phone numbers PATCH proxy error", error);
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

    return proxyAdminApiRequest(
      `allowed-phone-numbers/${encodeURIComponent(id)}`,
      {
        admin,
        method: "DELETE",
      },
    );
  } catch (error) {
    console.error("admin allowed phone numbers DELETE proxy error", error);
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
