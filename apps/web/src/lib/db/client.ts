import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import * as contentSchema from "@/lib/db/schema/content";
import * as publicSchema from "@/lib/db/schema/public";

const schema = {
  ...contentSchema,
  ...publicSchema,
};

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }

  if (!pool) {
    pool = new Pool({ connectionString });
  }

  return pool;
}

export function getDb() {
  if (!db) {
    db = drizzle(getPool(), { schema });
  }

  return db;
}

export type DbClient = ReturnType<typeof getDb>;
