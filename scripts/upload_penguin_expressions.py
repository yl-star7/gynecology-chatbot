#!/usr/bin/env python3
"""Upload penguin nurse expression images to Supabase Storage."""
from __future__ import annotations

import json
import os
import subprocess
import urllib.request
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = PROJECT_ROOT / "output" / "penguin-nurse-expressions"
BUCKET = "pregnancy-content"
STORAGE_PREFIX = "assets/penguin-nurse/expressions"

# Supabase config from .env
SUPABASE_URL = None
SUPABASE_SERVICE_KEY = None


def load_env():
    global SUPABASE_URL, SUPABASE_SERVICE_KEY
    env_file = PROJECT_ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k, v = line.split("=", 1)
                k, v = k.strip(), v.strip().strip('"').strip("'")
                if k == "NEXT_PUBLIC_SUPABASE_URL":
                    SUPABASE_URL = v
                elif k == "SUPABASE_SERVICE_ROLE_KEY":
                    SUPABASE_SERVICE_KEY = v

    # .env file takes precedence over shell environment
    if not SUPABASE_URL:
        SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    if not SUPABASE_SERVICE_KEY:
        SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")


def upload_to_storage(image_path: Path, object_path: str) -> str:
    """Upload file to Supabase Storage via REST API. Returns public URL."""
    url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{object_path}"
    data = image_path.read_bytes()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
            "apikey": SUPABASE_SERVICE_KEY,
            "Content-Type": "image/png",
            "x-upsert": "true",
            "Cache-Control": "3600",
        },
        method="PUT",
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise RuntimeError(f"Upload failed ({e.code}): {body}") from e

    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{object_path}"
    return public_url


def main() -> int:
    load_env()

    images = sorted(IMAGE_DIR.glob("*.png"))
    if not images:
        print("No images found in", IMAGE_DIR)
        return 1

    print(f"Uploading {len(images)} penguin expressions to {BUCKET}/{STORAGE_PREFIX}/")

    results = []
    for img in images:
        name = img.stem  # e.g. "happy", "sad"
        object_path = f"{STORAGE_PREFIX}/{img.name}"
        print(f"  {name}...", end=" ", flush=True)
        public_url = upload_to_storage(img, object_path)
        print("OK")
        results.append({"expression": name, "object_path": object_path, "public_url": public_url})

    print(f"\nDone! {len(results)} images uploaded.")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
