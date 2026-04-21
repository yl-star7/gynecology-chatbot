import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import {
  deleteHomeCopyItem,
  parseHomeCopyPayload,
  updateHomeCopyItem,
} from "@/lib/admin/home-copy-config";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const payload = parseHomeCopyPayload(await request.json());
    if (!payload) {
      return NextResponse.json(
        { error: "invalid home copy payload" },
        { status: 400 },
      );
    }

    const result = await updateHomeCopyItem(id, payload);
    if (!result) {
      return NextResponse.json(
        { error: "home copy item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      homeCopyItem: result.item,
      homeCopyItems: result.items,
    });
  } catch (error) {
    console.error("admin home copy PATCH route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to update home copy item",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await deleteHomeCopyItem(id);
    if (!result) {
      return NextResponse.json(
        { error: "home copy item not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      homeCopyItem: result.item,
      homeCopyItems: result.items,
    });
  } catch (error) {
    console.error("admin home copy DELETE route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to delete home copy item",
      },
      { status: 400 },
    );
  }
}
