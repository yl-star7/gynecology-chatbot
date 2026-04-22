import { randomUUID } from "crypto";
import { Hono } from "hono";
import type { Prisma } from "@gynecology-chatbot/db/prisma";
import { prisma } from "@gynecology-chatbot/db/prisma";
import {
  getHomeCopyItemsForAdmin,
  HOME_COPY_CONFIG_KEY,
  normalizeHomeCopyItemInput,
  type HomeCopyItem,
  type HomeCopyItemInput,
} from "@gynecology-chatbot/app-core";

import { requireAdminProxy, type AdminProxyVariables } from "./auth.js";

const app = new Hono<{ Variables: AdminProxyVariables }>();

app.use("*", requireAdminProxy);

function sortHomeCopyItems(items: HomeCopyItem[]) {
  return [...items].sort((left, right) => {
    const orderDelta = left.displayOrder - right.displayOrder;
    if (orderDelta !== 0) return orderDelta;
    return left.title.localeCompare(right.title, "ko-KR");
  });
}

async function listHomeCopyItems() {
  const row = await prisma.system_config.findUnique({
    where: { key: HOME_COPY_CONFIG_KEY },
    select: { value: true },
  });
  return getHomeCopyItemsForAdmin(row?.value);
}

async function writeHomeCopyItems(items: HomeCopyItem[]) {
  const sortedItems = sortHomeCopyItems(items);
  await prisma.system_config.upsert({
    where: { key: HOME_COPY_CONFIG_KEY },
    create: {
      key: HOME_COPY_CONFIG_KEY,
      value: sortedItems as unknown as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
    update: {
      value: sortedItems as unknown as Prisma.InputJsonValue,
      updated_at: new Date(),
    },
  });
  return sortedItems;
}

app.get("/content/home-copy", async (c) => {
  return c.json({ homeCopyItems: await listHomeCopyItems() });
});

app.post("/content/home-copy", async (c) => {
  const payload = normalizeHomeCopyItemInput(await c.req.json());
  if (!payload) return c.json({ error: "invalid home copy payload" }, 400);
  const currentItems = await listHomeCopyItems();
  const item = buildHomeCopyItem(payload, currentItems);
  const items = await writeHomeCopyItems([item, ...currentItems]);
  return c.json({ homeCopyItem: item, homeCopyItems: items });
});

app.patch("/content/home-copy/:id", async (c) => {
  const id = c.req.param("id");
  const payload = normalizeHomeCopyItemInput(await c.req.json());
  if (!id || !payload) return c.json({ error: "invalid home copy payload" }, 400);
  const currentItems = await listHomeCopyItems();
  const currentItem = currentItems.find((item) => item.id === id);
  if (!currentItem) return c.json({ error: "home copy item not found" }, 404);
  const nextItem: HomeCopyItem = {
    ...currentItem,
    slot: payload.slot,
    variant: payload.variant ?? null,
    title: payload.title,
    body: payload.body,
    status: payload.status,
    displayOrder:
      payload.displayOrder && payload.displayOrder > 0
        ? payload.displayOrder
        : currentItem.displayOrder,
    updatedAt: new Date().toISOString(),
  };
  const items = await writeHomeCopyItems(
    currentItems.map((item) => (item.id === id ? nextItem : item)),
  );
  return c.json({ homeCopyItem: nextItem, homeCopyItems: items });
});

app.delete("/content/home-copy/:id", async (c) => {
  const id = c.req.param("id");
  const currentItems = await listHomeCopyItems();
  const item = currentItems.find((currentItem) => currentItem.id === id);
  if (!item) return c.json({ error: "home copy item not found" }, 404);
  const items = await writeHomeCopyItems(
    currentItems.filter((currentItem) => currentItem.id !== id),
  );
  return c.json({ ok: true, homeCopyItem: item, homeCopyItems: items });
});

function buildHomeCopyItem(
  input: HomeCopyItemInput,
  currentItems: HomeCopyItem[],
): HomeCopyItem {
  const nextDisplayOrder =
    input.displayOrder && input.displayOrder > 0
      ? input.displayOrder
      : Math.max(0, ...currentItems.map((item) => item.displayOrder)) + 1;
  return {
    id: randomUUID(),
    slot: input.slot,
    variant: input.variant ?? null,
    title: input.title,
    body: input.body,
    status: input.status,
    displayOrder: nextDisplayOrder,
    updatedAt: new Date().toISOString(),
  };
}

export default app;
