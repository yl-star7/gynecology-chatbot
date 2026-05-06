import { randomUUID } from "crypto";

import type { Prisma } from "@gynecology-chatbot/db/prisma";
import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  getHomeCopyItemsForAdmin,
  HOME_COPY_CONFIG_KEY,
  normalizeHomeCopyItemInput,
  type HomeCopyItem,
  type HomeCopyItemInput,
} from "@gynecology-chatbot/app-core";
import { resolveAdminActorId } from "./admin-actor";
import { toJsonSafeSnapshot } from "./snapshot-helper";

/**
 * system_config은 key 기반 PK라 saveSnapshotAndUpdate를 직접 쓸 수 없다.
 * upsert 직전에 현재 row를 previous_snapshot으로 캡처해서 함께 저장한다.
 */
async function readSystemConfigSnapshot(key: string) {
  const row = await prisma.system_config.findUnique({
    where: { key },
  });
  if (!row) return null;
  const { previous_snapshot: _ignored, ...rest } = row as unknown as Record<
    string,
    unknown
  >;
  return toJsonSafeSnapshot(rest) as Record<string, unknown>;
}

function sortHomeCopyItems(items: HomeCopyItem[]) {
  return [...items].sort((left, right) => {
    const orderDelta = left.displayOrder - right.displayOrder;
    if (orderDelta !== 0) return orderDelta;
    return left.title.localeCompare(right.title, "ko-KR");
  });
}

async function readHomeCopyConfigValue() {
  const row = await prisma.system_config.findUnique({
    where: { key: HOME_COPY_CONFIG_KEY },
    select: { value: true },
  });

  return row?.value;
}

async function writeHomeCopyItems(
  items: HomeCopyItem[],
  actorId?: string | null,
) {
  const sortedItems = sortHomeCopyItems(items);
  const snapshot = await readSystemConfigSnapshot(HOME_COPY_CONFIG_KEY);
  const updatedBy = await resolveAdminActorId(actorId);
  await prisma.system_config.upsert({
    where: { key: HOME_COPY_CONFIG_KEY },
    update: {
      value: sortedItems as unknown as Prisma.InputJsonValue,
      updated_at: new Date(),
      previous_snapshot: snapshot as unknown as Prisma.InputJsonValue,
      updated_by: updatedBy,
    },
    create: {
      key: HOME_COPY_CONFIG_KEY,
      value: sortedItems as unknown as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
  });

  return sortedItems;
}

export async function listHomeCopyItems() {
  return getHomeCopyItemsForAdmin(await readHomeCopyConfigValue());
}

export function parseHomeCopyPayload(payload: unknown) {
  return normalizeHomeCopyItemInput(payload);
}

export async function createHomeCopyItem(
  input: HomeCopyItemInput,
  actorId?: string | null,
) {
  const currentItems = await listHomeCopyItems();
  const now = new Date().toISOString();
  const nextDisplayOrder =
    input.displayOrder && input.displayOrder > 0
      ? input.displayOrder
      : Math.max(0, ...currentItems.map((item) => item.displayOrder)) + 1;
  const item: HomeCopyItem = {
    id: randomUUID(),
    slot: input.slot,
    variant: input.variant ?? null,
    title: input.title,
    body: input.body,
    status: input.status,
    displayOrder: nextDisplayOrder,
    updatedAt: now,
  };
  const items = await writeHomeCopyItems([item, ...currentItems], actorId);

  return { item, items };
}

export async function updateHomeCopyItem(
  id: string,
  input: HomeCopyItemInput,
  actorId?: string | null,
) {
  const currentItems = await listHomeCopyItems();
  const currentItem = currentItems.find((item) => item.id === id);
  if (!currentItem) {
    return null;
  }

  const nextItem: HomeCopyItem = {
    ...currentItem,
    slot: input.slot,
    variant: input.variant ?? null,
    title: input.title,
    body: input.body,
    status: input.status,
    displayOrder:
      input.displayOrder && input.displayOrder > 0
        ? input.displayOrder
        : currentItem.displayOrder,
    updatedAt: new Date().toISOString(),
  };
  const items = await writeHomeCopyItems(
    currentItems.map((item) => (item.id === id ? nextItem : item)),
    actorId,
  );

  return { item: nextItem, items };
}

export async function deleteHomeCopyItem(id: string, actorId?: string | null) {
  const currentItems = await listHomeCopyItems();
  const item = currentItems.find((currentItem) => currentItem.id === id);
  if (!item) {
    return null;
  }

  const items = await writeHomeCopyItems(
    currentItems.filter((currentItem) => currentItem.id !== id),
    actorId,
  );

  return { item, items };
}
