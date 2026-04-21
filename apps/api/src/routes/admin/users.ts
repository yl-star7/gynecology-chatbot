import { Hono } from "hono";
import { prisma } from "@gynecology-chatbot/db/prisma";
import { normalizePhoneNumberToE164 } from "@gynecology-chatbot/mobile-api/solapi-sms";
import {
  createPhoneNumberStorage,
  decryptPhoneNumber,
  redactPhoneNumber,
} from "@gynecology-chatbot/mobile-api/privacy/phone-crypto";

import { createAdminAuditLog } from "./audit.js";
import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

function normalizeManagedPhoneNumber(phoneNumber: string) {
  const trimmed = phoneNumber.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    return normalizePhoneNumberToE164(trimmed);
  } catch {
    return trimmed;
  }
}

function mapAllowedPhoneNumber(row: {
  id: string;
  phone_number_encrypted: string;
  display_name: string | null;
  note: string | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: row.id,
    phoneNumber: decryptPhoneNumber(row.phone_number_encrypted),
    displayName: row.display_name,
    note: row.note,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const allowedPhoneNumberSelect = {
  id: true,
  phone_number_encrypted: true,
  display_name: true,
  note: true,
  created_at: true,
  updated_at: true,
} as const;

app.get("/allowed-phone-numbers", async (c) => {
  try {
    const rows = await prisma.blocked_phone_numbers.findMany({
      select: allowedPhoneNumberSelect,
      orderBy: { updated_at: "desc" },
    });

    return c.json({ allowedPhoneNumbers: rows.map(mapAllowedPhoneNumber) });
  } catch (error) {
    console.error("admin api allowed phone numbers get error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to load allowed phone numbers",
      },
      400,
    );
  }
});

app.post("/allowed-phone-numbers", async (c) => {
  try {
    const body = await c.req.json();
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!phoneNumber) {
      return c.json({ error: "phoneNumber is required" }, 400);
    }

    const normalizedPhoneNumber = normalizeManagedPhoneNumber(phoneNumber);
    const storage = createPhoneNumberStorage(normalizedPhoneNumber);
    const existingRow = await prisma.blocked_phone_numbers.findUnique({
      where: { phone_number_blind_index: storage.phoneNumberBlindIndex },
      select: allowedPhoneNumberSelect,
    });

    if (existingRow) {
      const updated = await prisma.blocked_phone_numbers.update({
        where: { id: existingRow.id },
        data: {
          phone_number_encrypted: storage.phoneNumberEncrypted,
          phone_number_blind_index: storage.phoneNumberBlindIndex,
          phone_number_last4: storage.phoneNumberLast4,
          display_name: displayName || existingRow.display_name,
          note: note || existingRow.note,
          updated_at: new Date(),
        },
        select: allowedPhoneNumberSelect,
      });
      return c.json({ allowedPhoneNumber: mapAllowedPhoneNumber(updated) });
    }

    const inserted = await prisma.blocked_phone_numbers.create({
      data: {
        phone_number_encrypted: storage.phoneNumberEncrypted,
        phone_number_blind_index: storage.phoneNumberBlindIndex,
        phone_number_last4: storage.phoneNumberLast4,
        display_name: displayName || null,
        note: note || null,
        updated_at: new Date(),
      },
      select: allowedPhoneNumberSelect,
    });
    const createdEntry = mapAllowedPhoneNumber(inserted);

    await createAdminAuditLog({
      adminUserId: c.get("adminUserId"),
      targetUserId: null,
      actionType: "content_update",
      entityType: "blocked_phone_number",
      entityId: createdEntry.id,
      reason: "blocked_phone_number_create",
      beforePayload: {},
      afterPayload: {
        phone_number: redactPhoneNumber(createdEntry.phoneNumber),
        display_name: createdEntry.displayName,
        note: createdEntry.note,
      },
    });

    return c.json({ allowedPhoneNumber: createdEntry });
  } catch (error) {
    console.error("admin api allowed phone numbers post error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to create allowed phone number",
      },
      400,
    );
  }
});

app.put("/allowed-phone-numbers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const displayName =
      typeof body.displayName === "string" ? body.displayName.trim() : "";
    const note = typeof body.note === "string" ? body.note.trim() : "";

    if (!phoneNumber) {
      return c.json({ error: "phoneNumber is required" }, 400);
    }

    const beforeRow = await prisma.blocked_phone_numbers.findUnique({
      where: { id },
      select: {
        id: true,
        phone_number_encrypted: true,
        display_name: true,
        note: true,
      },
    });
    const normalizedPhoneNumber = normalizeManagedPhoneNumber(phoneNumber);
    const storage = createPhoneNumberStorage(normalizedPhoneNumber);
    const updated = await prisma.blocked_phone_numbers.update({
      where: { id },
      data: {
        phone_number_encrypted: storage.phoneNumberEncrypted,
        phone_number_blind_index: storage.phoneNumberBlindIndex,
        phone_number_last4: storage.phoneNumberLast4,
        display_name: displayName || null,
        note: note || null,
        updated_at: new Date(),
      },
      select: allowedPhoneNumberSelect,
    });
    const updatedEntry = mapAllowedPhoneNumber(updated);

    await createAdminAuditLog({
      adminUserId: c.get("adminUserId"),
      targetUserId: null,
      actionType: "content_update",
      entityType: "blocked_phone_number",
      entityId: updatedEntry.id,
      reason: "blocked_phone_number_update",
      beforePayload: beforeRow
        ? {
            ...beforeRow,
            phone_number: redactPhoneNumber(
              decryptPhoneNumber(beforeRow.phone_number_encrypted),
            ),
          }
        : {},
      afterPayload: {
        phone_number: redactPhoneNumber(updatedEntry.phoneNumber),
        display_name: updatedEntry.displayName,
        note: updatedEntry.note,
      },
    });

    return c.json({ allowedPhoneNumber: updatedEntry });
  } catch (error) {
    console.error("admin api allowed phone numbers put error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to update allowed phone number",
      },
      400,
    );
  }
});

app.delete("/allowed-phone-numbers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const beforeRow = await prisma.blocked_phone_numbers.findUnique({
      where: { id },
      select: {
        id: true,
        phone_number_encrypted: true,
        display_name: true,
        note: true,
      },
    });

    await prisma.blocked_phone_numbers.delete({ where: { id } });
    await createAdminAuditLog({
      adminUserId: c.get("adminUserId"),
      targetUserId: null,
      actionType: "content_update",
      entityType: "blocked_phone_number",
      entityId: id,
      reason: "blocked_phone_number_delete",
      beforePayload: beforeRow
        ? {
            ...beforeRow,
            phone_number: redactPhoneNumber(
              decryptPhoneNumber(beforeRow.phone_number_encrypted),
            ),
          }
        : {},
      afterPayload: {},
    });

    return c.json({ ok: true });
  } catch (error) {
    console.error("admin api allowed phone numbers delete error", error);
    return c.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "failed to delete allowed phone number",
      },
      400,
    );
  }
});

app.post("/users/update-phone", async (c) => {
  try {
    const body = await c.req.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const phoneNumber =
      typeof body.phoneNumber === "string" ? body.phoneNumber.trim() : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!userId || !phoneNumber || !reason) {
      return c.json(
        { error: "userId, phoneNumber, and reason are required" },
        400,
      );
    }

    const existingUser = await prisma.users.findUnique({
      where: { id: userId },
      select: { phone_number_encrypted: true },
    });
    const beforePhoneNumber = existingUser?.phone_number_encrypted
      ? decryptPhoneNumber(existingUser.phone_number_encrypted)
      : null;
    const normalizedPhoneNumber = normalizeManagedPhoneNumber(phoneNumber);
    const storage = createPhoneNumberStorage(normalizedPhoneNumber);

    await prisma.users.update({
      where: { id: userId },
      data: {
        phone_number_encrypted: storage.phoneNumberEncrypted,
        phone_number_blind_index: storage.phoneNumberBlindIndex,
        phone_number_last4: storage.phoneNumberLast4,
        updated_at: new Date(),
      },
    });

    await createAdminAuditLog({
      adminUserId: c.get("adminUserId"),
      targetUserId: userId,
      actionType: "phone_change",
      entityType: "user",
      entityId: userId,
      reason,
      beforePayload: {
        phone_number: beforePhoneNumber
          ? redactPhoneNumber(beforePhoneNumber)
          : null,
      },
      afterPayload: {
        phone_number: redactPhoneNumber(normalizedPhoneNumber),
      },
    });

    return c.json({ ok: true });
  } catch (error) {
    console.error("admin api update phone error", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "failed to update phone number",
      },
      400,
    );
  }
});

app.post("/users/reset-session", async (c) => {
  try {
    const body = await c.req.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!userId || !reason) {
      return c.json({ error: "userId and reason are required" }, 400);
    }

    await prisma.users.update({
      where: { id: userId },
      data: {
        account_status: "pending_recovery",
        updated_at: new Date(),
      },
    });
    await createAdminAuditLog({
      adminUserId: c.get("adminUserId"),
      targetUserId: userId,
      actionType: "session_reset",
      entityType: "user",
      entityId: userId,
      reason,
      beforePayload: {},
      afterPayload: { account_status: "pending_recovery" },
    });

    return c.json({ ok: true });
  } catch (error) {
    console.error("admin api reset session error", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "failed to reset session",
      },
      400,
    );
  }
});

app.post("/users/status", async (c) => {
  try {
    const body = await c.req.json();
    const userId = typeof body.userId === "string" ? body.userId : "";
    const status =
      body.status === "paused"
        ? "paused"
        : body.status === "active"
          ? "active"
          : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!userId || !status || !reason) {
      return c.json({ error: "userId, status, and reason are required" }, 400);
    }

    await prisma.users.update({
      where: { id: userId },
      data: {
        account_status: status,
        updated_at: new Date(),
      },
    });
    await createAdminAuditLog({
      adminUserId: c.get("adminUserId"),
      targetUserId: userId,
      actionType: status === "paused" ? "account_pause" : "account_resume",
      entityType: "user",
      entityId: userId,
      reason,
      beforePayload: {},
      afterPayload: { account_status: status },
    });

    return c.json({ ok: true });
  } catch (error) {
    console.error("admin api update user status error", error);
    return c.json(
      {
        error:
          error instanceof Error ? error.message : "failed to update user status",
      },
      400,
    );
  }
});

export default app;
