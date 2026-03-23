#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import shutil
import tempfile
import time
import urllib.request
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
WORKFLOW_PATH = PROJECT_ROOT / "output" / "comfy-workflows" / "fetus_compare_object_illusxl_t2i.workflow.json"
COMFY_OUTPUT_DIR = Path("/Users/jskang/Projects/ComfyUI/output")
LOCAL_OUTPUT_DIR = PROJECT_ROOT / "output" / "week-baby-images-illusxl"


def post_json(server: str, path: str, payload: dict) -> dict:
    req = urllib.request.Request(
        f"http://{server}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def get_json(server: str, path: str) -> dict:
    with urllib.request.urlopen(f"http://{server}{path}", timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8"))


def wait_for_server(server: str, timeout_s: int = 90) -> None:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            get_json(server, "/system_stats")
            return
        except Exception:
            time.sleep(1)
    raise RuntimeError(f"ComfyUI server {server} did not become ready in time.")


def queue_prompt(server: str, prompt: dict) -> str:
    response = post_json(server, "/prompt", {"prompt": prompt})
    return response["prompt_id"]


def wait_for_output(server: str, prompt_id: str, node_id: str, timeout_s: int = 900) -> Path:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        history = get_json(server, f"/history/{prompt_id}")
        if prompt_id in history:
            result = history[prompt_id]
            status = result.get("status", {})
            if status.get("status_str") == "error":
                raise RuntimeError(json.dumps(status, ensure_ascii=False))
            images = result.get("outputs", {}).get(node_id, {}).get("images", [])
            if images:
                image = images[0]
                return COMFY_OUTPUT_DIR / image.get("subfolder", "") / image["filename"]
        time.sleep(2)
    raise RuntimeError(f"Timed out waiting for output: {prompt_id}")


def login_and_fetch_weeks(base_url: str, phone: str, password: str) -> list[dict]:
    cookie_file = tempfile.NamedTemporaryFile(delete=False)
    cookie_file.close()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())
    login_req = urllib.request.Request(
        f"{base_url}/api/admin/auth/login",
        data=json.dumps({"phoneNumber": phone, "password": password}).encode(),
        headers={"Content-Type": "application/json"},
    )
    with opener.open(login_req, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError("Admin login failed.")
    with opener.open(f"{base_url}/api/admin/content/weeks", timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
        return payload.get("weeks", [])


def build_prompt_text(week: dict) -> str:
    compare_object = (week.get("babySizeCompareObject") or week.get("babySizeLabel") or "small fruit").strip()
    return (
        f"cute educational 3d clay prenatal mascot, tiny fetus baby figurine, peach clay texture, "
        f"simple black dot eyes, rounded head, tucked pose, one single {compare_object} beside the fetus, "
        f"clean white seamless studio background, centered toy-like composition, minimal and gentle, no text"
    )


def build_negative_text() -> str:
    return (
        "text, letters, typography, caption, watermark, logo, human hand, arm, fingers, person, "
        "realistic child, realistic adult, blood, gore, placenta, womb interior, duplicate baby, multiple fruits, multiple objects"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Illustrious XL fetus comparison workflow through ComfyUI.")
    parser.add_argument("--server", default="127.0.0.1:8188")
    parser.add_argument("--base-url", default="http://localhost:4000")
    parser.add_argument("--phone", default=os.environ.get("LOCAL_ADMIN_PHONE_NUMBER", "01099998888"))
    parser.add_argument("--password", default=os.environ.get("ADMIN_LOGIN_PASSWORD") or os.environ.get("LOCAL_ADMIN_PASSWORD") or "admin1234")
    parser.add_argument("--week", type=int, action="append")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--seed-base", type=int, default=8000)
    parser.add_argument("--dry-run", action="store_true")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    weeks = login_and_fetch_weeks(args.base_url, args.phone, args.password)
    weeks = [week for week in weeks if (week.get("babySizeCompareObject") or week.get("babySizeLabel"))]
    if args.week:
        allowed = set(args.week)
        weeks = [week for week in weeks if week["weekNumber"] in allowed]
    if args.limit > 0:
        weeks = weeks[: args.limit]

    if not weeks:
        raise RuntimeError("No matching weeks found.")

    workflow_template = json.loads(WORKFLOW_PATH.read_text())
    LOCAL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        for week in weeks:
            print(json.dumps({"week": week["weekNumber"], "prompt": build_prompt_text(week)}, ensure_ascii=False))
        return 0

    wait_for_server(args.server)

    for index, week in enumerate(weeks):
        workflow = json.loads(json.dumps(workflow_template))
        workflow["6"]["inputs"]["text"] = build_prompt_text(week)
        workflow["7"]["inputs"]["text"] = build_negative_text()
        workflow["3"]["inputs"]["seed"] = args.seed_base + index
        workflow["9"]["inputs"]["filename_prefix"] = f"week-baby-illusxl-w{week['weekNumber']:02d}"

        prompt_id = queue_prompt(args.server, workflow)
        output = wait_for_output(args.server, prompt_id, "9")
        local_path = LOCAL_OUTPUT_DIR / output.name
        shutil.copy2(output, local_path)
        print(f"generated week={week['weekNumber']} output={local_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
