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
  return ensureStorageBucketWithOptions(bucketId);
}

export async function ensureStorageBucketWithOptions(
  bucketId: string,
  options: { isPublic?: boolean } = {},
) {
  const client = getSupabaseStorageClient();
  const { data: buckets, error: listError } =
    await client.storage.listBuckets();
  if (listError) {
    throw listError;
  }

  const existingBucket = buckets?.find((bucket) => bucket.name === bucketId);
  const isPublic = options.isPublic ?? false;

  if (!existingBucket) {
    const { error } = await client.storage.createBucket(bucketId, {
      public: isPublic,
      fileSizeLimit: "10MB",
    });
    if (error) {
      throw error;
    }
  } else if (
    typeof existingBucket.public === "boolean" &&
    existingBucket.public !== isPublic
  ) {
    const { error } = await client.storage.updateBucket(bucketId, {
      public: isPublic,
      fileSizeLimit: "10MB",
    });
    if (error) {
      throw error;
    }
  }

  return client;
}
