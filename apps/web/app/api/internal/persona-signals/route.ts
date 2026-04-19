import { NextRequest, NextResponse } from "next/server";

import {
  createPersonaSignalPayload,
  normalizePersonaSignal,
  parsePersonaSignalInput,
  type PersonaSignalRow,
} from "@/lib/mobile/persona/persona-signals";
import { supabaseInsert } from "@/lib/supabase/admin-client";

function isAuthorized(request: NextRequest | Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(
    secret && request.headers.get("authorization") === `Bearer ${secret}`,
  );
}

export async function POST(request: NextRequest | Request) {
  try {
    if (!isAuthorized(request)) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const input = parsePersonaSignalInput(await request.json());
    if (!input) {
      return NextResponse.json(
        { error: "invalid persona signal payload" },
        { status: 400 },
      );
    }

    const inserted = await supabaseInsert<PersonaSignalRow[]>(
      "user_persona_signals",
      createPersonaSignalPayload(input),
      { onConflict: "id", ignoreDuplicates: true },
    );

    return NextResponse.json({
      ok: true,
      signal: inserted[0] ? normalizePersonaSignal(inserted[0]) : null,
    });
  } catch (error) {
    console.error("internal persona signal webhook error", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to store persona signal",
      },
      { status: 500 },
    );
  }
}
