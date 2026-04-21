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

async function writeHomeCopyItems(items: HomeCopyItem[]) {
  const sortedItems = sortHomeCopyItems(items);
  await prisma.system_config.upsert({
    where: { key: HOME_COPY_CONFIG_KEY },
    update: {
      value: sortedItems as unknown as Prisma.InputJsonValue,
      updated_at: new Date(),
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

export async function createHomeCopyItem(input: HomeCopyItemInput) {
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
  const items = await writeHomeCopyItems([item, ...currentItems]);

  return { item, items };
}

export async function updateHomeCopyItem(id: string, input: HomeCopyItemInput) {
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
  );

  return { item: nextItem, items };
}

export async function deleteHomeCopyItem(id: string) {
  const currentItems = await listHomeCopyItems();
  const item = currentItems.find((currentItem) => currentItem.id === id);
  if (!item) {
    return null;
  }

  const items = await writeHomeCopyItems(
    currentItems.filter((currentItem) => currentItem.id !== id),
  );

  return { item, items };
}
