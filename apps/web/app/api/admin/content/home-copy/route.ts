import { NextRequest, NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import {
  createHomeCopyItem,
  listHomeCopyItems,
  parseHomeCopyPayload,
} from "@/lib/admin/home-copy-config";

export async function GET() {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const homeCopyItems = await listHomeCopyItems();
    return NextResponse.json({ homeCopyItems });
  } catch (error) {
    console.error("admin home copy GET route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to load home copy items",
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

    const payload = parseHomeCopyPayload(await request.json());
    if (!payload) {
      return NextResponse.json(
        { error: "invalid home copy payload" },
        { status: 400 },
      );
    }

    const result = await createHomeCopyItem(payload);
    return NextResponse.json({
      homeCopyItem: result.item,
      homeCopyItems: result.items,
    });
  } catch (error) {
    console.error("admin home copy POST route error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to create home copy item",
      },
      { status: 400 },
    );
  }
}
