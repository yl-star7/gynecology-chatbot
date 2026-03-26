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
COMFY_ROOT = Path("/Users/jskang/Projects/ComfyUI")
COMFY_OUTPUT_DIR = COMFY_ROOT / "output"
LOCAL_OUTPUT_DIR = PROJECT_ROOT / "output" / "week-baby-images"
DEFAULT_SERVER = "127.0.0.1:8188"


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


def get_history(server: str, prompt_id: str) -> dict:
    return get_json(server, f"/history/{prompt_id}")


def find_latest_output(prefix: str, started_at: float) -> Path | None:
    candidates = [
        path
        for path in COMFY_OUTPUT_DIR.rglob(f"{prefix}*.png")
        if path.is_file() and path.stat().st_mtime >= started_at - 1
    ]
    if not candidates:
        return None
    return max(candidates, key=lambda path: path.stat().st_mtime)


def wait_for_output(
    server: str,
    prompt_id: str,
    node_id: str,
    prefix: str,
    started_at: float,
    timeout_s: int = 900,
) -> Path:
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        history = get_history(server, prompt_id)
        if prompt_id in history:
            result = history[prompt_id]
            status = result.get("status", {})
            if status.get("status_str") == "error":
                raise RuntimeError(json.dumps(status, ensure_ascii=False))
            images = result.get("outputs", {}).get(node_id, {}).get("images", [])
            if images:
                image = images[0]
                return COMFY_OUTPUT_DIR / image.get("subfolder", "") / image["filename"]

        candidate = find_latest_output(prefix, started_at)
        if candidate is not None:
            return candidate
        time.sleep(2)

    raise RuntimeError(f"Timed out waiting for image output: {prefix}")


def login_and_fetch_weeks(base_url: str, phone: str, password: str) -> list[dict]:
    cookie_file = tempfile.NamedTemporaryFile(delete=False)
    cookie_file.close()

    login_payload = json.dumps({"phoneNumber": phone, "password": password}).encode()
    login_req = urllib.request.Request(
        f"{base_url}/api/admin/auth/login",
        data=login_payload,
        headers={"Content-Type": "application/json"},
    )
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor())
    with opener.open(login_req, timeout=30) as response:
        if response.status != 200:
            raise RuntimeError("Admin login failed.")

    with opener.open(f"{base_url}/api/admin/content/weeks", timeout=30) as response:
        payload = json.loads(response.read().decode("utf-8"))
        return payload.get("weeks", [])


def build_prompt_text(week: dict) -> str:
    compare_object = (week.get("babySizeCompareObject") or week.get("babySizeLabel") or "").strip()
    week_number = week["weekNumber"]
    title = (week.get("title") or f"{week_number} weeks").strip()

    return (
        f"cute educational 3d clay render of a tiny fetus mascot for {week_number} weeks pregnancy, "
        f"soft peach clay material, minimal studio background, centered composition, "
        f"one tiny baby figure next to {compare_object or 'a matching size comparison object'}, "
        f"gentle premium pediatric medical illustration style, rounded simple forms, no womb, no blood, "
        f"no text in image, no label, no typography, no realistic skin pores, no uncanny anatomy, "
        f"clean white backdrop, subtle soft shadow, collectible figurine quality, size-comparison poster style, {title}"
    )


def build_negative_text() -> str:
    return (
        "text, letters, typography, caption, label, watermark, logo, collage, busy background, "
        "gore, blood, surgery, dissected anatomy, horror, monster, mutation, realistic adult body, "
        "uncanny face, extra limbs, malformed hands, detailed genitals, dark scene, photoreal skin"
    )


def build_workflow(prompt_text: str, negative_text: str, seed: int, width: int, height: int, prefix: str) -> dict:
    return {
        "1": {"class_type": "VAELoader", "inputs": {"vae_name": "ae.safetensors"}},
        "2": {
            "class_type": "UNETLoader",
            "inputs": {"unet_name": "z_image_turbo_bf16.safetensors", "weight_dtype": "default"},
        },
        "3": {
            "class_type": "ModelSamplingAuraFlow",
            "inputs": {"model": ["2", 0], "shift": 3},
        },
        "4": {
            "class_type": "CLIPLoader",
            "inputs": {
                "clip_name": "qwen_3_4b.safetensors",
                "type": "lumina2",
                "device": "default",
            },
        },
        "5": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": prompt_text, "clip": ["4", 0]},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"text": negative_text, "clip": ["4", 0]},
        },
        "7": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "8": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["3", 0],
                "seed": seed,
                "steps": 6,
                "cfg": 1,
                "sampler_name": "res_multistep",
                "scheduler": "simple",
                "positive": ["5", 0],
                "negative": ["6", 0],
                "latent_image": ["7", 0],
                "denoise": 1,
            },
        },
        "9": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["8", 0], "vae": ["1", 0]},
        },
        "10": {
            "class_type": "SaveImage",
            "inputs": {"images": ["9", 0], "filename_prefix": prefix},
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate week baby images from compare-object fields via ComfyUI.")
    parser.add_argument("--server", default=DEFAULT_SERVER)
    parser.add_argument("--base-url", default="http://localhost:4000")
    parser.add_argument("--phone", default=os.environ.get("LOCAL_ADMIN_PHONE_NUMBER", "01099998888"))
    parser.add_argument("--password", default=os.environ.get("ADMIN_LOGIN_PASSWORD") or os.environ.get("LOCAL_ADMIN_PASSWORD") or "admin1234")
    parser.add_argument("--week", type=int, action="append", help="Only generate for specific week(s).")
    parser.add_argument("--limit", type=int, default=0, help="Generate only the first N matched weeks.")
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=1024)
    parser.add_argument("--seed-base", type=int, default=5000)
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

    LOCAL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print(f"matched_weeks={[week['weekNumber'] for week in weeks]}")
    if args.dry_run:
        for week in weeks:
            print(json.dumps({
                "week": week["weekNumber"],
                "title": week.get("title"),
                "compare": week.get("babySizeCompareObject") or week.get("babySizeLabel"),
                "prompt": build_prompt_text(week),
            }, ensure_ascii=False))
        return 0

    wait_for_server(args.server)

    for index, week in enumerate(weeks):
        prefix = f"week-baby-w{week['weekNumber']:02d}"
        prompt = build_workflow(
            prompt_text=build_prompt_text(week),
            negative_text=build_negative_text(),
            seed=args.seed_base + index,
            width=args.width,
            height=args.height,
            prefix=prefix,
        )
        started_at = time.time()
        prompt_id = queue_prompt(args.server, prompt)
        image_path = wait_for_output(args.server, prompt_id, "10", prefix, started_at)
        local_path = LOCAL_OUTPUT_DIR / image_path.name
        shutil.copy2(image_path, local_path)
        print(f"generated week={week['weekNumber']} output={local_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
