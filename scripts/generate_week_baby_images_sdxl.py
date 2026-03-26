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
COMFY_OUTPUT_DIR = Path("/Users/jskang/Projects/ComfyUI/output")
LOCAL_OUTPUT_DIR = PROJECT_ROOT / "output" / "week-baby-images-sdxl"
DEFAULT_SERVER = "127.0.0.1:8188"
DEFAULT_CHECKPOINT = "Illustrious-XL-v1.1.safetensors"
DEFAULT_LORA = "sdxl/clay-myst-v1.safetensors"


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
        f"a cute educational 3d claymorphism fetus mascot, tiny pink clay baby, "
        f"simple face, tiny black dot eyes, smooth round head, rounded limbs, "
        f"one single {compare_object} placed beside the baby, both fully visible, "
        f"pure white seamless background, centered studio composition, soft shadow, "
        f"minimal premium product render, no text, no label, no caption"
    )


def build_negative_text() -> str:
    return (
        "text, letters, typography, korean text, english text, caption, watermark, logo, "
        "human hand, hands, arm, fingers, palm, realistic person, realistic skin, photo, "
        "multiple fruits, multiple objects, duplicate baby, womb, umbilical cord, gore, blood, "
        "creepy, uncanny, dark background, clutter, extra limbs, malformed anatomy"
    )


def build_workflow(
    prompt_text: str,
    negative_text: str,
    checkpoint: str,
    lora_name: str | None,
    lora_strength: float,
    seed: int,
    width: int,
    height: int,
    prefix: str,
) -> dict:
    workflow = {
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": checkpoint},
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": prompt_text},
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {"clip": ["4", 1], "text": negative_text},
        },
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "model": ["76", 0] if lora_name else ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
                "seed": seed,
                "steps": 24,
                "cfg": 6,
                "sampler_name": "dpmpp_2m",
                "scheduler": "karras",
                "denoise": 1,
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"images": ["8", 0], "filename_prefix": prefix},
        },
    }
    if lora_name:
        workflow["76"] = {
            "class_type": "LoraLoaderModelOnly",
            "inputs": {
                "model": ["4", 0],
                "lora_name": lora_name,
                "strength_model": lora_strength,
            },
        }
    return workflow


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate week baby images with an SDXL checkpoint via ComfyUI.")
    parser.add_argument("--server", default=DEFAULT_SERVER)
    parser.add_argument("--base-url", default="http://localhost:4000")
    parser.add_argument("--phone", default=os.environ.get("LOCAL_ADMIN_PHONE_NUMBER", "01099998888"))
    parser.add_argument("--password", default=os.environ.get("ADMIN_LOGIN_PASSWORD") or os.environ.get("LOCAL_ADMIN_PASSWORD") or "admin1234")
    parser.add_argument("--checkpoint", default=DEFAULT_CHECKPOINT)
    parser.add_argument("--lora", default=DEFAULT_LORA)
    parser.add_argument("--lora-strength", type=float, default=0.8)
    parser.add_argument("--week", type=int, action="append")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--width", type=int, default=1024)
    parser.add_argument("--height", type=int, default=1024)
    parser.add_argument("--seed-base", type=int, default=7000)
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
            print(json.dumps({"week": week["weekNumber"], "prompt": build_prompt_text(week)}, ensure_ascii=False))
        return 0

    wait_for_server(args.server)

    for index, week in enumerate(weeks):
        prefix = f"week-baby-sdxl-w{week['weekNumber']:02d}"
        workflow = build_workflow(
            prompt_text=build_prompt_text(week),
            negative_text=build_negative_text(),
            checkpoint=args.checkpoint,
            lora_name=args.lora if args.lora else None,
            lora_strength=args.lora_strength,
            seed=args.seed_base + index,
            width=args.width,
            height=args.height,
            prefix=prefix,
        )
        prompt_id = queue_prompt(args.server, workflow)
        output = wait_for_output(args.server, prompt_id, "9")
        local_path = LOCAL_OUTPUT_DIR / output.name
        shutil.copy2(output, local_path)
        print(f"generated week={week['weekNumber']} output={local_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
