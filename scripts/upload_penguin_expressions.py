#!/usr/bin/env python3
"""Upload penguin nurse images to GCS."""
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
APP_EXPRESSION_DIR = PROJECT_ROOT / "apps" / "mobile" / "assets" / "branding" / "penguin-nurse"
BUCKET = os.environ.get("PREGNANCY_CONTENT_BUCKET", "pregnancy-content")
APP_PREFIX = "assets/penguin-nurse/app"
CACHE_CONTROL = "public, max-age=31536000, immutable"
USED_TONES = {"neutral", "calm", "joyful", "anxious", "tired", "sad"}


def upload_to_gcs(image_path: Path, object_path: str) -> str:
    subprocess.run(
        [
            "gsutil",
            "-q",
            "-h",
            f"Cache-Control:{CACHE_CONTROL}",
            "cp",
            str(image_path),
            f"gs://{BUCKET}/{object_path}",
        ],
        check=True,
    )
    return f"https://storage.googleapis.com/{BUCKET}/{object_path}"


def collect_images() -> list[tuple[str, Path, str]]:
    images: list[tuple[str, Path, str]] = []

    for image_path in sorted(APP_EXPRESSION_DIR.glob("*.png")):
        if image_path.stem not in USED_TONES:
            continue
        object_path = f"{APP_PREFIX}/{image_path.name}"
        images.append((image_path.stem, image_path, object_path))

    return images


def main() -> int:
    images = collect_images()
    if not images:
        print("No penguin nurse images found.")
        return 1

    print(f"Uploading {len(images)} penguin nurse images to gs://{BUCKET}/")

    results = []
    for name, image_path, object_path in images:
        print(f"  {name}...", end=" ", flush=True)
        public_url = upload_to_gcs(image_path, object_path)
        print("OK")
        results.append(
            {
                "name": name,
                "object_path": object_path,
                "public_url": public_url,
            },
        )

    print(f"\nDone. {len(results)} images uploaded.")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
