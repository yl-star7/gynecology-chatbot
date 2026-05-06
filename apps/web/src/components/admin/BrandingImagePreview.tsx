"use client";

const DEFAULT_PUBLIC_ASSET_BUCKET = "pregnancy-content";

function cx(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

export function buildPublicGcsImageUrl(
  bucketId: string | null | undefined,
  objectPath: string | null | undefined,
) {
  const rawPath = objectPath?.trim();
  if (!rawPath) return null;

  if (/^https?:\/\//i.test(rawPath)) {
    return rawPath;
  }

  const gcsMatch = rawPath.match(/^gs:\/\/([^/]+)\/(.+)$/i);
  if (gcsMatch) {
    return encodeURI(
      `https://storage.googleapis.com/${gcsMatch[1]}/${gcsMatch[2]}`,
    );
  }

  const bucket = bucketId?.trim() || DEFAULT_PUBLIC_ASSET_BUCKET;
  const normalizedPath = rawPath.replace(/^\/+/, "");
  return encodeURI(
    `https://storage.googleapis.com/${bucket}/${normalizedPath}`,
  );
}

interface BrandingImagePreviewProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  imageClassName?: string;
}

export function BrandingImagePreview({
  src,
  alt,
  className,
  imageClassName,
}: BrandingImagePreviewProps) {
  if (!src) {
    return (
      <div
        className={cx(
          "flex h-24 w-24 shrink-0 items-center justify-center rounded-md border border-dashed bg-muted text-xs text-muted-foreground",
          className,
        )}
      >
        없음
      </div>
    );
  }

  return (
    <div
      className={cx(
        "h-24 w-24 shrink-0 overflow-hidden rounded-md border bg-muted",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        className={cx("h-full w-full object-contain", imageClassName)}
      />
    </div>
  );
}
