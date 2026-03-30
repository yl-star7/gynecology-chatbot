#!/usr/bin/env python3
"""Generate clay baby + fruit comparison images for pregnancy weeks 5-40 via ComfyUI API."""
from __future__ import annotations

import argparse
import json
import shutil
import time
import urllib.request
from pathlib import Path

WORKFLOW_PATH = Path(__file__).resolve().parents[1] / "output" / "comfy-workflows" / "fetus_compare_object_zimage_t2i.workflow.json"
COMFY_OUTPUT_DIR = Path("/Users/jskang/Projects/ComfyUI/output")
LOCAL_OUTPUT_DIR = Path(__file__).resolve().parents[1] / "output" / "week-baby-images-clay-full"

WEEK_FRUIT_MAP = {
    5: ("참깨알", "sesame seed"),
    6: ("완두콩", "pea"),
    7: ("블루베리", "blueberry"),
    8: ("체리", "cherry"),
    9: ("포도알", "grape"),
    10: ("딸기", "strawberry"),
    11: ("무화과", "fig"),
    12: ("자두", "plum"),
    13: ("레몬", "lemon"),
    14: ("복숭아", "peach"),
    15: ("사과", "apple"),
    16: ("아보카도", "avocado"),
    17: ("배", "pear"),
    18: ("피망", "bell pepper"),
    19: ("석류", "pomegranate"),
    20: ("바나나", "banana"),
    21: ("망고", "mango"),
    22: ("고구마", "sweet potato"),
    23: ("자몽", "grapefruit"),
    24: ("옥수수", "corn"),
    25: ("단호박", "kabocha squash"),
    26: ("양상추", "lettuce"),
    27: ("콜리플라워", "cauliflower"),
    28: ("가지", "eggplant"),
    29: ("땅콩 호박", "butternut squash"),
    30: ("양배추", "cabbage"),
    31: ("코코넛", "coconut"),
    32: ("샐러리", "celery"),
    33: ("파인애플", "pineapple"),
    34: ("멜론", "melon"),
    35: ("허니듀 멜론", "honeydew melon"),
    36: ("로메인 상추", "romaine lettuce"),
    37: ("대파", "green onion"),
    38: ("무", "radish"),
    39: ("수박", "watermelon"),
    40: ("호박", "pumpkin"),
}

# Pose varies by baby size relative to fruit
def get_pose(week: int) -> str:
    if week <= 10:
        return "placed right next to"
    elif week <= 16:
        return "sitting beside"
    elif week <= 24:
        return "gently leaning on"
    elif week <= 32:
        return "hugging"
    else:
        return "sitting beside"


def build_prompt(week: int, fruit_en: str) -> str:
    pose = get_pose(week)
    if week <= 12:
        baby_desc = (
            f"a tiny {week}-week embryo-shaped clay figurine with a rounded head, "
            f"minimal features, smooth translucent peach surface, simple developmental form"
        )
    elif week <= 24:
        baby_desc = (
            f"a small {week}-week fetus-shaped clay figurine with a round head, "
            f"tiny dot eyes, small smile, soft peach color, emerging limbs"
        )
    else:
        baby_desc = (
            f"a cute {week}-week baby-shaped clay figurine with a round head, "
            f"tiny dot eyes, tiny nose, gentle smile, soft peach color, chubby limbs"
        )

    return (
        f"No text, no letters, no label, no caption, no typography. "
        f"A cute educational 3D claymorphism miniature on a pure white seamless studio background. "
        f"{baby_desc}, {pose} a realistic {fruit_en} for size comparison. "
        f"Soft product photography lighting, centered composition, "
        f"minimal kawaii style, smooth clay surfaces, icon set consistency. "
        f"Pure white background, no shadows on backdrop."
    )


NEGATIVE = (
    "text, letters, words, typography, caption, watermark, logo, frame, border, "
    "realistic skin, human hand, arm, fingers, realistic anatomy, gore, blood, "
    "womb interior, placenta, multiple babies, duplicate, "
    "dark background, gray background, gradient, cluttered, props, "
    "extra limbs, malformed, deformed"
)


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


def wait_for_output(server: str, prompt_id: str, node_id: str, timeout_s: int = 600) -> Path:
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
        time.sleep(3)
    raise RuntimeError(f"Timed out waiting for output: {prompt_id}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--server", default="127.0.0.1:8188")
    parser.add_argument("--week", type=int, action="append", help="Specific week(s) to generate")
    parser.add_argument("--seed-base", type=int, default=42000)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    weeks = sorted(WEEK_FRUIT_MAP.keys())
    if args.week:
        weeks = [w for w in weeks if w in args.week]

    workflow_template = json.loads(WORKFLOW_PATH.read_text())
    LOCAL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        for w in weeks:
            _, fruit_en = WEEK_FRUIT_MAP[w]
            print(f"w{w:02d}: {fruit_en} | {build_prompt(w, fruit_en)[:80]}...")
        return 0

    # Check server
    try:
        get_json(args.server, "/system_stats")
    except Exception:
        print(f"ERROR: ComfyUI server not reachable at {args.server}")
        return 1

    for idx, w in enumerate(weeks):
        fruit_kr, fruit_en = WEEK_FRUIT_MAP[w]
        prompt_text = build_prompt(w, fruit_en)

        wf = json.loads(json.dumps(workflow_template))
        wf["5"]["inputs"]["text"] = prompt_text
        wf["6"]["inputs"]["text"] = NEGATIVE
        wf["8"]["inputs"]["seed"] = args.seed_base + idx
        wf["10"]["inputs"]["filename_prefix"] = f"week-baby-clay-w{w:02d}"

        print(f"[{idx+1}/{len(weeks)}] Generating week {w} ({fruit_kr}/{fruit_en})...")
        resp = post_json(args.server, "/prompt", {"prompt": wf})
        prompt_id = resp["prompt_id"]

        output_path = wait_for_output(args.server, prompt_id, "10")
        local_path = LOCAL_OUTPUT_DIR / f"w{w:02d}-{fruit_en.replace(' ', '-')}.png"
        shutil.copy2(output_path, local_path)
        print(f"  -> {local_path.name}")

    print(f"\nDone! {len(weeks)} images saved to {LOCAL_OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
