import { NextResponse } from "next/server";

import { createAdminAuditLogSafe } from "@/lib/admin/admin-actor";
import { readAdminSessionUser } from "@/lib/admin/auth";
import {
  resolveSnapshotModel,
  rollbackFromSnapshot,
} from "@/lib/admin/snapshot-helper";

export async function POST(
  request: Request,
  context: { params: Promise<{ resource: string; id: string }> },
) {
  const admin = await readAdminSessionUser();
  if (!admin) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { resource, id } = await context.params;
  const model = resolveSnapshotModel(resource);
  if (!model) {
    return NextResponse.json(
      { error: "unknown_resource", resource },
      { status: 404 },
    );
  }

  const restored = await rollbackFromSnapshot(model, id, admin.id);
  if (!restored) {
    return NextResponse.json({ error: "no_snapshot", id }, { status: 409 });
  }

  await createAdminAuditLogSafe({
    adminUserId: admin.id,
    actionType: "rollback",
    entityType: resource,
    entityId: id,
    reason: "previous_snapshot restore",
    beforePayload: {
      id,
      previous_snapshot: restored.previous_snapshot ?? null,
    },
    afterPayload: { restored: true },
  });

  return NextResponse.json({ ok: true, id, resource });
}
