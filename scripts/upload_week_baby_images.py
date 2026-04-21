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
IMAGE_DIR = Path(
    os.environ.get(
        "WEEK_BABY_IMAGE_DIR",
        PROJECT_ROOT / "output" / "week-baby-images-clay-full",
    )
)
BASE_URL = os.environ.get("ADMIN_BASE_URL", "http://localhost:4000").rstrip("/")


def latest_week_images() -> dict[int, Path]:
    latest: dict[int, tuple[int, Path]] = {}
    pattern = re.compile(r"week-baby-w(\d+)_(\d+)_\.png$")
    stable_pattern = re.compile(r"w(\d{2})-[a-z0-9-]+\.png$")
    bundled_pattern = re.compile(r"week-baby-w(\d{2})\.png$")
    for path in sorted(IMAGE_DIR.glob("week-baby-w*.png")):
        match = pattern.search(path.name)
        if not match:
            continue
        week = int(match.group(1))
        version = int(match.group(2))
        current = latest.get(week)
        if current is None or version > current[0]:
            latest[week] = (version, path)
    for path in sorted(IMAGE_DIR.glob("*.png")):
        match = stable_pattern.fullmatch(path.name) or bundled_pattern.fullmatch(
            path.name
        )
        if not match:
            continue
        week = int(match.group(1))
        latest.setdefault(week, (0, path))
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
    object_path = f"weeks/{week_number:02d}/{image_path.name}"
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
        "-F",
        f"objectPath={object_path}",
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


def run_psql(sql: str) -> str:
    db_url = os.environ["DATABASE_URL"]
    password = urlparse(db_url).password or ""
    result = subprocess.run(
        [
            "direnv",
            "exec",
            str(PROJECT_ROOT),
            "psql",
            db_url,
            "-v",
            "ON_ERROR_STOP=1",
            "-Atc",
            sql,
        ],
        env={**os.environ, "PGPASSWORD": password},
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout


def sql_literal(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def resolve_content_tables() -> tuple[str, str]:
    local_schema = os.environ.get("LOCAL_DB_SCHEMA", "").strip()
    local_data_table = f"{local_schema}.content_pregnancy_week_data"
    local_media_table = f"{local_schema}.content_pregnancy_week_media"
    sql = """
    SELECT CASE
      WHEN to_regclass('content.pregnancy_week_data') IS NOT NULL THEN 'content.pregnancy_week_data|content.pregnancy_week_media'
      WHEN to_regclass('public.content_pregnancy_week_data') IS NOT NULL THEN 'public.content_pregnancy_week_data|public.content_pregnancy_week_media'
      WHEN %s <> '' AND to_regclass(%s) IS NOT NULL THEN %s
      ELSE ''
    END;
    """ % (
        sql_literal(local_schema),
        sql_literal(local_data_table),
        sql_literal(f"{local_data_table}|{local_media_table}"),
    )
    value = run_psql(sql).strip()
    if not value:
        raise RuntimeError("No pregnancy week content tables found")
    data_table, media_table = value.split("|", 1)
    return data_table, media_table


def query_week_ids(data_table: str) -> dict[int, str]:
    sql = f"""
    select week_number, id
    from {data_table}
    where week_number between 5 and 40
    order by week_number;
    """
    output = run_psql(sql)
    mapping: dict[int, str] = {}
    for line in output.splitlines():
        if not line.strip():
            continue
        week, week_id = line.split("|", 1)
        mapping[int(week)] = week_id
    return mapping


def upsert_week_reference_image(
    media_table: str,
    week_id: str,
    object_path: str,
    source_name: str,
) -> None:
    db_url = os.environ["DATABASE_URL"]
    password = urlparse(db_url).password or ""
    sql = f"""
    DELETE FROM {media_table}
    WHERE week_data_id = '{week_id}'::uuid
      AND media_scope = 'week'
      AND media_role IN ('hero', 'reference', 'weekly_summary');

    INSERT INTO {media_table} (
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
      {sql_literal(object_path)},
      'hero',
      '주차 대표 이미지',
      {sql_literal(source_name)},
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
    password = (
        os.environ.get("ADMIN_LOGIN_PASSWORD")
        or os.environ.get("LOCAL_ADMIN_PASSWORD")
        or "admin1234"
    )
    images = latest_week_images()
    data_table, media_table = resolve_content_tables()
    week_ids = query_week_ids(data_table)

    if not images:
        raise RuntimeError("No generated week images found.")

    cookie_file = login_cookie(phone, password)
    uploaded = []
    for week in sorted(images):
        if week not in week_ids:
            continue
        image_path = images[week]
        sign = issue_signed_upload(cookie_file, week, image_path)
        upload_binary(
            sign["signedUrl"],
            image_path,
            sign.get("contentType") or "image/png",
        )
        upsert_week_reference_image(
            media_table,
            week_ids[week],
            sign["objectPath"],
            sign["sourceFileName"],
        )
        uploaded.append((week, sign["objectPath"]))

    print(json.dumps(uploaded, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
