import { NextResponse } from "next/server";

import { readAdminSessionUser } from "@/lib/admin/auth";
import { proxyAdminApiRequest } from "@/lib/admin/api-server";

export async function GET(request: Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest(`content/paraphrases${new URL(request.url).search}`, {
      admin,
      method: "GET",
    });
  } catch (error) {
    console.error("admin content paraphrases GET proxy error", error);
    return NextResponse.json(
      { error: "failed to load paraphrases" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await readAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    return proxyAdminApiRequest("content/paraphrases", { admin, request });
  } catch (error) {
    console.error("admin content paraphrases PATCH proxy error", error);
    return NextResponse.json(
      { error: "failed to update paraphrase" },
      { status: 500 },
    );
  }
}
