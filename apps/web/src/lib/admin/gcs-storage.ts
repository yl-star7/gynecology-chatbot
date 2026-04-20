"use server";

import { Storage } from "@google-cloud/storage";

const DEFAULT_UPLOAD_TTL_MS = 15 * 60 * 1000;
const DEFAULT_READ_TTL_MS = 24 * 60 * 60 * 1000;

function getGcsProjectId() {
  return (
    process.env.GCS_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || undefined
  );
}

function getGcsStorage() {
  return new Storage({ projectId: getGcsProjectId() });
}

function getBucket(bucketId: string) {
  return getGcsStorage().bucket(bucketId);
}

export async function ensureStorageBucket(bucketId: string) {
  return ensureStorageBucketWithOptions(bucketId);
}

export async function ensureStorageBucketWithOptions(
  bucketId: string,
  options: { isPublic?: boolean } = {},
) {
  const bucket = getBucket(bucketId);
  const [exists] = await bucket.exists();

  if (!exists) {
    await bucket.create();
  }

  if (options.isPublic) {
    await bucket.makePublic({ includeFiles: false }).catch(() => undefined);
  }

  return bucket;
}

export async function createSignedUploadUrl(input: {
  bucketId: string;
  objectPath: string;
  contentType: string;
  expiresMs?: number;
}) {
  const bucket = await ensureStorageBucketWithOptions(input.bucketId, {
    isPublic: input.bucketId === "pregnancy-content",
  });
  const file = bucket.file(input.objectPath);
  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + (input.expiresMs ?? DEFAULT_UPLOAD_TTL_MS),
    contentType: input.contentType,
  });

  return { signedUrl };
}

export async function createSignedReadUrl(input: {
  bucketId: string;
  objectPath: string;
  expiresMs?: number;
}) {
  const bucket = await ensureStorageBucket(input.bucketId);
  const file = bucket.file(input.objectPath);
  const [signedUrl] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + (input.expiresMs ?? DEFAULT_READ_TTL_MS),
  });

  return { signedUrl };
}

export async function uploadBufferToStorage(input: {
  bucketId: string;
  objectPath: string;
  buffer: Buffer;
  contentType: string;
}) {
  const bucket = await ensureStorageBucketWithOptions(input.bucketId, {
    isPublic: input.bucketId === "pregnancy-content",
  });
  const file = bucket.file(input.objectPath);
  await file.save(input.buffer, {
    resumable: false,
    contentType: input.contentType,
    validation: false,
  });
}

export async function deleteStorageObject(input: {
  bucketId: string;
  objectPath: string;
}) {
  const bucket = await ensureStorageBucket(input.bucketId);
  const file = bucket.file(input.objectPath);
  await file.delete({ ignoreNotFound: true });
}
