import { createClient } from "@supabase/supabase-js";
import {
  localSupabaseDelete,
  localSupabaseInsert,
  localSupabaseRpc,
  localSupabaseSelect,
  localSupabaseUpdate,
} from "../local-postgres";
import {
  hasDockerConfig,
  hasSupabaseConfig,
  resolveServerDataProvider,
} from "../server-data-provider";

type SchemaScopedTarget = {
  schema: "public" | "content";
  relation: string;
  search?: string;
};

const CONTENT_PUBLIC_RELATION_MAP: Record<string, string> = {
  "content.pregnancy_week_data": "content_pregnancy_week_data",
  "content.pregnancy_day_contents": "content_pregnancy_day_contents",
  "content.week_checklists": "content_week_checklists",
  "content.week_questions": "content_week_questions",
  "content.pregnancy_week_media": "content_pregnancy_week_media",
  "content.pregnancy_documents": "content_pregnancy_documents",
  "content.knowledge_items": "content_knowledge_items",
};

export type SupabaseRequestOptions = {
  schema?: "public" | "content";
};

export type SupabaseInsertOptions = SupabaseRequestOptions & {
  onConflict?: string;
  ignoreDuplicates?: boolean;
};

type QueryLike<T> = {
  eq(column: string, value: string): T;
  is(column: string, value: boolean | null): T;
  not(column: string, operator: string, value: string): T;
  in(column: string, values: string[]): T;
  gte(column: string, value: string): T;
  lte(column: string, value: string): T;
  lt(column: string, value: string): T;
  gt(column: string, value: string): T;
  order(
    column: string,
    options?: { ascending?: boolean; nullsFirst?: boolean },
  ): T;
  limit(count: number): T;
};

export function getSupabaseServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SERVICEROLE
  );
}

export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase server configuration requires NEXT_PUBLIC_SUPABASE_URL and a service role key",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function shouldUseLocalPostgres() {
  return resolveServerDataProvider() === "docker";
}

function assertSelectedProviderConfig() {
  const provider = resolveServerDataProvider();

  if (provider === "docker" && !hasDockerConfig()) {
    throw new Error("SERVER_DATA_PROVIDER=docker requires DATABASE_URL");
  }

  if (provider === "supabase" && !hasSupabaseConfig()) {
    throw new Error(
      "SERVER_DATA_PROVIDER=supabase requires NEXT_PUBLIC_SUPABASE_URL and a service-role key",
    );
  }
}

function parseSchemaScopedTarget(target: string): SchemaScopedTarget {
  const [relationPath, search = ""] = target.split("?");
  const [schemaOrRelation, maybeRelation] = relationPath.split(".", 2);

  if (
    maybeRelation &&
    (schemaOrRelation === "public" || schemaOrRelation === "content")
  ) {
    return {
      schema: schemaOrRelation,
      relation: maybeRelation,
      search,
    };
  }

  return {
    schema: "public",
    relation: relationPath,
    search,
  };
}

function remapLegacyTarget(target: string) {
  if (target.startsWith("published_weeks")) {
    const suffix = target.slice("published_weeks".length);
    const joiner = suffix ? "&" : "?";
    return `content_pregnancy_week_data${suffix}${joiner}status=eq.published`;
  }

  for (const [legacy, next] of Object.entries(CONTENT_PUBLIC_RELATION_MAP)) {
    if (target === legacy) {
      return next;
    }

    if (target.startsWith(`${legacy}?`)) {
      return `${next}${target.slice(legacy.length)}`;
    }
  }

  return target;
}

function applySchema(target: string, schema?: "public" | "content") {
  const remappedTarget = remapLegacyTarget(target);
  if (
    !schema ||
    remappedTarget.startsWith("public.") ||
    remappedTarget.startsWith("content.")
  ) {
    return remappedTarget;
  }

  return `${schema}.${remappedTarget}`;
}

function parseIsValue(value: string) {
  if (value === "null") return null;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`Unsupported is filter value: ${value}`);
}

function parseInValues(value: string) {
  const trimmed = value.trim();
  const withoutParens =
    trimmed.startsWith("(") && trimmed.endsWith(")")
      ? trimmed.slice(1, -1)
      : trimmed;
  if (!withoutParens) return [];
  return withoutParens.split(",").map((entry) => entry.trim());
}

function applyFilters<T extends QueryLike<T>>(
  query: T,
  searchParams: URLSearchParams,
) {
  let nextQuery = query;

  for (const [column, rawValue] of searchParams.entries()) {
    if (column === "select" || column === "order" || column === "limit")
      continue;

    if (rawValue.startsWith("eq.")) {
      nextQuery = nextQuery.eq(column, rawValue.slice(3));
      continue;
    }
    if (rawValue.startsWith("is.")) {
      nextQuery = nextQuery.is(column, parseIsValue(rawValue.slice(3)));
      continue;
    }
    if (rawValue.startsWith("not.is.")) {
      nextQuery = nextQuery.not(column, "is", rawValue.slice(7));
      continue;
    }
    if (rawValue.startsWith("in.")) {
      nextQuery = nextQuery.in(column, parseInValues(rawValue.slice(3)));
      continue;
    }
    if (rawValue.startsWith("gte.")) {
      nextQuery = nextQuery.gte(column, rawValue.slice(4));
      continue;
    }
    if (rawValue.startsWith("lte.")) {
      nextQuery = nextQuery.lte(column, rawValue.slice(4));
      continue;
    }
    if (rawValue.startsWith("lt.")) {
      nextQuery = nextQuery.lt(column, rawValue.slice(3));
      continue;
    }
    if (rawValue.startsWith("gt.")) {
      nextQuery = nextQuery.gt(column, rawValue.slice(3));
      continue;
    }

    throw new Error(`Unsupported Supabase filter: ${column}=${rawValue}`);
  }

  const orderValue = searchParams.get("order");
  if (orderValue) {
    const specs = orderValue
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
    for (const spec of specs) {
      const [column, direction = "asc", nulls] = spec.split(".");
      nextQuery = nextQuery.order(column, {
        ascending: direction !== "desc",
        ...(nulls === "nullsfirst"
          ? { nullsFirst: true }
          : nulls === "nullslast"
            ? { nullsFirst: false }
            : {}),
      });
    }
  }

  const limitValue = searchParams.get("limit");
  if (limitValue) {
    nextQuery = nextQuery.limit(Number(limitValue));
  }

  return nextQuery;
}

export async function supabaseSelect<T>(
  path: string,
  options: SupabaseRequestOptions = {},
) {
  assertSelectedProviderConfig();
  if (shouldUseLocalPostgres()) {
    return localSupabaseSelect<T>(applySchema(path, options.schema));
  }

  const target = parseSchemaScopedTarget(applySchema(path, options.schema));
  const client = getSupabaseAdminClient();
  const searchParams = new URLSearchParams(target.search);
  const selectClause = searchParams.get("select") ?? "*";

  let query = client
    .schema(target.schema)
    .from(target.relation)
    .select(selectClause);
  query = applyFilters(query, searchParams);
  const { data, error } = await query;
  if (error) throw new Error(`Supabase select failed: ${error.message}`);
  return (data ?? []) as T;
}

export async function supabaseInsert<T>(
  table: string,
  payload: object | object[],
  options: SupabaseInsertOptions = {},
) {
  assertSelectedProviderConfig();
  if (shouldUseLocalPostgres()) {
    return localSupabaseInsert<T>(applySchema(table, options.schema), payload);
  }

  const target = parseSchemaScopedTarget(applySchema(table, options.schema));
  const query = options.onConflict
    ? getSupabaseAdminClient()
        .schema(target.schema)
        .from(target.relation)
        .upsert(payload, {
          onConflict: options.onConflict,
          ignoreDuplicates: options.ignoreDuplicates,
        })
    : getSupabaseAdminClient()
        .schema(target.schema)
        .from(target.relation)
        .insert(payload);

  const { data, error } = await query.select();
  if (error) throw new Error(`Supabase insert failed: ${error.message}`);
  return (data ?? []) as T;
}

export async function supabaseUpdate<T>(
  path: string,
  payload: object,
  options: SupabaseRequestOptions = {},
) {
  assertSelectedProviderConfig();
  if (shouldUseLocalPostgres()) {
    return localSupabaseUpdate<T>(applySchema(path, options.schema), payload);
  }

  const target = parseSchemaScopedTarget(applySchema(path, options.schema));
  const searchParams = new URLSearchParams(target.search);
  let query = getSupabaseAdminClient()
    .schema(target.schema)
    .from(target.relation)
    .update(payload)
    .select();
  query = applyFilters(query, searchParams);
  const { data, error } = await query;
  if (error) throw new Error(`Supabase update failed: ${error.message}`);
  return (data ?? []) as T;
}

export async function supabaseDelete<T>(
  path: string,
  options: SupabaseRequestOptions = {},
) {
  assertSelectedProviderConfig();
  if (shouldUseLocalPostgres()) {
    return localSupabaseDelete<T>(applySchema(path, options.schema));
  }

  const target = parseSchemaScopedTarget(applySchema(path, options.schema));
  const searchParams = new URLSearchParams(target.search);
  let query = getSupabaseAdminClient()
    .schema(target.schema)
    .from(target.relation)
    .delete()
    .select();
  query = applyFilters(query, searchParams);
  const { data, error } = await query;
  if (error) throw new Error(`Supabase delete failed: ${error.message}`);
  return (data ?? []) as T;
}

export async function supabaseRpc<T>(fn: string, payload: object) {
  assertSelectedProviderConfig();
  if (shouldUseLocalPostgres()) {
    return localSupabaseRpc<T>(fn, payload as Record<string, unknown>);
  }

  const { data, error } = await getSupabaseAdminClient().rpc(fn, payload);
  if (error) throw new Error(`Supabase rpc failed: ${error.message}`);
  return data as T;
}
