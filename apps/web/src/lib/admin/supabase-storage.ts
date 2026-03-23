"use server";

import { createClient } from "@supabase/supabase-js";

function getSupabaseStorageClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SERVICE_ROLE ??
    process.env.SERVICEROLE;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase storage configuration requires NEXT_PUBLIC_SUPABASE_URL and a service role key",
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function ensureStorageBucket(bucketId: string) {
  const client = getSupabaseStorageClient();
  const { data: buckets, error: listError } = await client.storage.listBuckets();
  if (listError) {
    throw listError;
  }

  if (!buckets?.some((bucket) => bucket.name === bucketId)) {
    const { error } = await client.storage.createBucket(bucketId, {
      public: false,
      fileSizeLimit: "10MB",
    });
    if (error) {
      throw error;
    }
  }

  return client;
}

