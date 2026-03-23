#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import subprocess
import urllib.request
from pathlib import Path
from urllib.parse import urlparse


PROJECT_ROOT = Path(__file__).resolve().parents[1]
IMAGE_DIR = PROJECT_ROOT / "output" / "week-baby-images"
BASE_URL = "http://localhost:4000"


def latest_week_images() -> dict[int, Path]:
    latest: dict[int, tuple[int, Path]] = {}
    pattern = re.compile(r"week-baby-w(\d+)_(\d+)_\.png$")
    for path in sorted(IMAGE_DIR.glob("week-baby-w*.png")):
      match = pattern.search(path.name)
      if not match:
        continue
      week = int(match.group(1))
      version = int(match.group(2))
      current = latest.get(week)
      if current is None or version > current[0]:
        latest[week] = (version, path)
    return {week: entry[1] for week, entry in latest.items()}


def login_cookie(phone: str, password: str) -> str:
    import tempfile

    cookie_file = tempfile.NamedTemporaryFile(delete=False)
    cookie_file.close()
    payload = json.dumps({"phoneNumber": phone, "password": password})
    result = subprocess.run(
        [
            "curl",
            "-s",
            "-c",
            cookie_file.name,
            "-H",
            "Content-Type: application/json",
            "-d",
            payload,
            f"{BASE_URL}/api/admin/auth/login",
        ],
        capture_output=True,
        text=True,
        check=True,
    )
    if '"admin"' not in result.stdout:
        raise RuntimeError("Admin login failed")
    return cookie_file.name


def issue_signed_upload(cookie_file: str, week_number: int, image_path: Path):
    curl_cmd = [
        "curl",
        "-s",
        "-b",
        cookie_file,
        "-F",
        f"file=@{image_path}",
        "-F",
        "bucketId=pregnancy-content",
        "-F",
        "mediaScope=week",
        "-F",
        f"weekNumber={week_number}",
        f"{BASE_URL}/api/admin/content/media/upload",
    ]
    result = subprocess.run(curl_cmd, capture_output=True, text=True, check=True)
    payload = json.loads(result.stdout)
    if "signedUrl" not in payload:
        raise RuntimeError(result.stdout)
    return payload


def upload_binary(signed_url: str, image_path: Path, content_type: str) -> None:
    req = urllib.request.Request(
        signed_url,
        data=image_path.read_bytes(),
        headers={"content-type": content_type, "x-upsert": "true"},
        method="PUT",
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        if resp.status not in {200, 201}:
            raise RuntimeError(f"Signed upload failed: {resp.status}")


def query_week_ids() -> dict[int, str]:
    db_url = os.environ["DATABASE_URL"]
    password = urlparse(db_url).password or ""
    sql = "select week_number, id from content.pregnancy_week_data where week_number between 5 and 40 order by week_number;"
    result = subprocess.run(
        ["direnv", "exec", str(PROJECT_ROOT), "psql", db_url, "-Atc", sql],
        env={**os.environ, "PGPASSWORD": password},
        capture_output=True,
        text=True,
        check=True,
    )
    mapping: dict[int, str] = {}
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        week, week_id = line.split("|", 1)
        mapping[int(week)] = week_id
    return mapping


def upsert_week_reference_image(week_id: str, week_number: int, object_path: str, source_name: str) -> None:
    db_url = os.environ["DATABASE_URL"]
    password = urlparse(db_url).password or ""
    sql = f"""
    DELETE FROM content.pregnancy_week_media
    WHERE week_data_id = '{week_id}'::uuid
      AND media_scope = 'week'
      AND media_role = 'reference';

    INSERT INTO content.pregnancy_week_media (
      id, week_data_id, day_content_id, day_number, media_scope, bucket_id,
      object_path, media_role, alt_text, source_file_name, display_order
    )
    VALUES (
      gen_random_uuid(),
      '{week_id}'::uuid,
      NULL,
      NULL,
      'week',
      'pregnancy-content',
      '{object_path}',
      'reference',
      '주차 비교 이미지',
      '{source_name}',
      1
    );
    """
    subprocess.run(
        ["direnv", "exec", str(PROJECT_ROOT), "psql", db_url, "-v", "ON_ERROR_STOP=1", "-c", sql],
        env={**os.environ, "PGPASSWORD": password},
        capture_output=True,
        text=True,
        check=True,
    )


def main() -> int:
    phone = os.environ.get("LOCAL_ADMIN_PHONE_NUMBER", "01099998888")
    password = os.environ.get("ADMIN_LOGIN_PASSWORD") or os.environ.get("LOCAL_ADMIN_PASSWORD") or "admin1234"
    images = latest_week_images()
    week_ids = query_week_ids()

    if not images:
        raise RuntimeError("No generated week images found.")

    cookie_file = login_cookie(phone, password)
    uploaded = []
    for week in sorted(images):
        if week not in week_ids:
            continue
        image_path = images[week]
        sign = issue_signed_upload(cookie_file, week, image_path)
        upload_binary(sign["signedUrl"], image_path, sign.get("contentType") or "image/png")
        upsert_week_reference_image(
            week_ids[week],
            week,
            sign["objectPath"],
            sign["sourceFileName"],
        )
        uploaded.append((week, sign["objectPath"]))

    print(json.dumps(uploaded, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
