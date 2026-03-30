#!/usr/bin/env python3
"""Generate penguin nurse expression DB via ComfyUI API (z_image_turbo t2i)."""
from __future__ import annotations

import argparse
import json
import shutil
import time
import urllib.request
from pathlib import Path

COMFY_OUTPUT_DIR = Path("/Users/jskang/Projects/ComfyUI/output")
LOCAL_OUTPUT_DIR = Path(__file__).resolve().parents[1] / "output" / "penguin-nurse-expressions"

EXPRESSIONS = {
    "neutral":      "neutral calm expression, gentle default face",
    "happy":        "happy joyful expression, big bright eyes, wide cheerful smile",
    "excited":      "very excited expression, sparkly eyes, open mouth smile, bouncing energy",
    "sad":          "sad expression, downturned eyes, small frown, droopy posture",
    "crying":       "crying expression, teary eyes, tears streaming, open mouth wailing",
    "angry":        "angry frustrated expression, furrowed brow, puffed cheeks, frowning",
    "surprised":    "surprised shocked expression, wide round eyes, small open mouth, raised eyebrows",
    "worried":      "worried anxious expression, slightly furrowed brow, uneasy frown, concerned eyes",
    "sleepy":       "sleepy drowsy expression, half-closed droopy eyes, yawning mouth, relaxed posture",
    "love":         "loving expression, heart-shaped eyes, warm smile, blush marks on cheeks",
    "thinking":     "thinking pondering expression, one wing on chin, eyes looking up, slight head tilt",
    "proud":        "proud confident expression, chest puffed out, eyes closed with satisfaction, big smile",
    "shy":          "shy bashful expression, blushing cheeks, eyes looking away, slight smile",
    "confused":     "confused puzzled expression, tilted head, question mark energy, one raised eyebrow",
    "determined":   "determined focused expression, serious eyes, firm mouth, resolute posture",
    "winking":      "playful winking expression, one eye closed, tongue out slightly, cheeky grin",
    "cheering":     "cheering celebrating expression, wings raised high, big open smile, joyful energy",
    "comforting":   "gentle comforting expression, warm soft eyes, reassuring smile, open wings gesture",
    "explaining":   "explaining teaching expression, one wing pointing up, attentive eyes, slight smile",
    "thumbs-up":    "giving thumbs up expression, one wing up with approval gesture, confident smile, encouraging",
}


def build_prompt(expression_desc: str) -> str:
    return (
        f"No text, no letters, no label, no caption. "
        f"A super cute KakaoTalk emoticon style illustration of a small round chubby penguin nurse character, "
        f"2-head-tall chibi proportions, dark gray-navy blue head and back, white round belly and face, "
        f"small orange triangular beak, large expressive round eyes, soft pink blush circles on cheeks, "
        f"a cute heart-shaped tuft of feathers on top of head, "
        f"wearing oversized light blue medical scrubs with a small ID badge lanyard, holding a tiny medical chart, "
        f"{expression_desc}, "
        f"KakaoTalk sticker style, very simple flat colors, minimal clean outlines, "
        f"exaggerated cute expressions, rounded soft shapes, no sharp edges, "
        f"pure white background, centered, single character emoticon."
    )


NEGATIVE = (
    "text, letters, words, typography, caption, watermark, logo, "
    "3D, realistic, photograph, gradient background, shadow, "
    "multiple characters, human, extra limbs, deformed, "
    "dark background, complex background, detailed background"
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
        time.sleep(3)
    raise RuntimeError(f"Timed out: {prompt_id}")


WORKFLOW = {
    "1": {
        "class_type": "CLIPLoader",
        "inputs": {"clip_name": "qwen_3_4b.safetensors", "type": "lumina2", "device": "default"}
    },
    "2": {
        "class_type": "UNETLoader",
        "inputs": {"unet_name": "z_image_turbo_bf16.safetensors", "weight_dtype": "default"}
    },
    "3": {
        "class_type": "VAELoader",
        "inputs": {"vae_name": "ae.safetensors"}
    },
    "4": {
        "class_type": "EmptySD3LatentImage",
        "inputs": {"width": 1024, "height": 1024, "batch_size": 1}
    },
    "5": {
        "class_type": "CLIPTextEncode",
        "inputs": {"text": "", "clip": ["1", 0]}
    },
    "6": {
        "class_type": "CLIPTextEncode",
        "inputs": {"text": NEGATIVE, "clip": ["1", 0]}
    },
    "8": {
        "class_type": "KSampler",
        "inputs": {
            "model": ["2", 0], "positive": ["5", 0], "negative": ["6", 0],
            "latent_image": ["4", 0], "seed": 55000,
            "control_after_generate": "randomize",
            "steps": 9, "cfg": 1, "sampler_name": "euler", "scheduler": "simple", "denoise": 1
        }
    },
    "9": {
        "class_type": "VAEDecode",
        "inputs": {"samples": ["8", 0], "vae": ["3", 0]}
    },
    "10": {
        "class_type": "SaveImage",
        "inputs": {"images": ["9", 0], "filename_prefix": "penguin-expr"}
    }
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--server", default="127.0.0.1:8188")
    parser.add_argument("--expr", type=str, action="append", help="Specific expression(s)")
    parser.add_argument("--seed-base", type=int, default=55000)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    expressions = list(EXPRESSIONS.items())
    if args.expr:
        expressions = [(k, v) for k, v in expressions if k in args.expr]

    LOCAL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    if args.dry_run:
        for name, desc in expressions:
            print(f"{name}: {build_prompt(desc)[:100]}...")
        return 0

    try:
        get_json(args.server, "/system_stats")
    except Exception:
        print(f"ERROR: ComfyUI not reachable at {args.server}")
        return 1

    for idx, (name, desc) in enumerate(expressions):
        wf = json.loads(json.dumps(WORKFLOW))
        wf["5"]["inputs"]["text"] = build_prompt(desc)
        wf["8"]["inputs"]["seed"] = args.seed_base + idx
        wf["10"]["inputs"]["filename_prefix"] = f"penguin-expr-{name}"

        print(f"[{idx+1}/{len(expressions)}] {name}...")
        resp = post_json(args.server, "/prompt", {"prompt": wf})
        prompt_id = resp["prompt_id"]

        output_path = wait_for_output(args.server, prompt_id, "10")
        local_path = LOCAL_OUTPUT_DIR / f"{name}.png"
        shutil.copy2(output_path, local_path)
        print(f"  -> {local_path.name}")

    print(f"\nDone! {len(expressions)} expressions saved to {LOCAL_OUTPUT_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
