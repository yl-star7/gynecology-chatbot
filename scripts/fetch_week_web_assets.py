#!/usr/bin/env python3
from __future__ import annotations

import csv
import html
import json
import re
import sys
import time
from pathlib import Path
from typing import Iterable
from urllib.parse import quote, urlparse
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


PROJECT_ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = PROJECT_ROOT / "output" / "week-web-assets"
FETUS_DIR = OUTPUT_DIR / "fetus"
OBJECT_DIR = OUTPUT_DIR / "objects"
MANIFEST_JSON = OUTPUT_DIR / "manifest.json"
MANIFEST_CSV = OUTPUT_DIR / "manifest.csv"
GALLERY_HTML = OUTPUT_DIR / "gallery.html"

USER_AGENT = "Mozilla/5.0 (compatible; si-week-asset-fetcher/1.0)"
IMG_TAG_PATTERN = re.compile(r"<img\b[^>]*>", re.IGNORECASE)
ATTR_PATTERN = re.compile(r'([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*["\']([^"\']*)["\']')
WEEK_LINK_PATTERN = re.compile(
    r"https://femia\.health/health-library/pregnancy/week-by-week/(\d+)-weeks-pregnant/",
    re.IGNORECASE,
)


WEEK_OBJECTS = [
    {"week": 5, "label_ko": "참깨알", "titles": ["Sesame", "Sesame seed"]},
    {"week": 6, "label_ko": "완두콩", "titles": ["Pea"]},
    {"week": 7, "label_ko": "블루베리", "titles": ["Blueberry"]},
    {"week": 8, "label_ko": "체리", "titles": ["Cherry"]},
    {"week": 9, "label_ko": "포도알", "titles": ["Grape"]},
    {"week": 10, "label_ko": "딸기", "titles": ["Strawberry"]},
    {"week": 11, "label_ko": "무화과", "titles": ["Common fig", "Fig"]},
    {"week": 12, "label_ko": "자두", "titles": ["Plum"]},
    {"week": 13, "label_ko": "레몬", "titles": ["Lemon"]},
    {"week": 14, "label_ko": "복숭아", "titles": ["Peach"]},
    {"week": 15, "label_ko": "사과", "titles": ["Apple"]},
    {"week": 16, "label_ko": "아보카도", "titles": ["Avocado"]},
    {"week": 17, "label_ko": "배", "titles": ["Pear"]},
    {"week": 18, "label_ko": "피망", "titles": ["Bell pepper", "Capsicum annuum"]},
    {"week": 19, "label_ko": "석류", "titles": ["Pomegranate"]},
    {"week": 20, "label_ko": "바나나", "titles": ["Banana"]},
    {"week": 21, "label_ko": "망고", "titles": ["Mango"]},
    {"week": 22, "label_ko": "고구마", "titles": ["Sweet potato"]},
    {"week": 23, "label_ko": "자몽", "titles": ["Grapefruit"]},
    {"week": 24, "label_ko": "옥수수", "titles": ["Maize", "Corn"]},
    {"week": 25, "label_ko": "단호박", "titles": ["Kabocha", "Pumpkin"]},
    {"week": 26, "label_ko": "양상추", "titles": ["Lettuce"]},
    {"week": 27, "label_ko": "콜리플라워", "titles": ["Cauliflower"]},
    {"week": 28, "label_ko": "가지", "titles": ["Eggplant", "Aubergine"]},
    {"week": 29, "label_ko": "땅콩 호박", "titles": ["Butternut squash"]},
    {"week": 30, "label_ko": "양배추", "titles": ["Cabbage"]},
    {"week": 31, "label_ko": "코코넛", "titles": ["Coconut"]},
    {"week": 32, "label_ko": "샐러리", "titles": ["Celery"]},
    {"week": 33, "label_ko": "파인애플", "titles": ["Pineapple"]},
    {"week": 34, "label_ko": "멜론", "titles": ["Melon", "Cantaloupe"]},
    {"week": 35, "label_ko": "허니듀 멜론", "titles": ["Honeydew (melon)", "Honeydew"]},
    {"week": 36, "label_ko": "로메인 상추", "titles": ["Romaine lettuce"]},
    {"week": 37, "label_ko": "대파", "titles": ["Scallion", "Welsh onion"]},
    {"week": 38, "label_ko": "무", "titles": ["Daikon", "Radish"]},
    {"week": 39, "label_ko": "수박", "titles": ["Watermelon"]},
    {"week": 40, "label_ko": "호박", "titles": ["Pumpkin"]},
]


def fetch_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(5):
        try:
            with urlopen(request, timeout=60) as response:
                charset = response.headers.get_content_charset() or "utf-8"
                return response.read().decode(charset, errors="replace")
        except HTTPError as error:
            if error.code in {429, 502, 503, 504} and attempt < 4:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
        except URLError:
            if attempt < 4:
                time.sleep(1.5 * (attempt + 1))
                continue
            raise
    raise RuntimeError(f"Failed to fetch text: {url}")


def fetch_bytes(url: str) -> bytes:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    for attempt in range(6):
        try:
            with urlopen(request, timeout=60) as response:
                return response.read()
        except HTTPError as error:
            if error.code in {429, 502, 503, 504} and attempt < 5:
                time.sleep(2 * (attempt + 1))
                continue
            raise
        except URLError:
            if attempt < 5:
                time.sleep(2 * (attempt + 1))
                continue
            raise
    raise RuntimeError(f"Failed to fetch bytes: {url}")


def parse_img_attrs(tag: str) -> dict[str, str]:
    return {key.lower(): html.unescape(value) for key, value in ATTR_PATTERN.findall(tag)}


def normalize_url(candidate: str, page_url: str) -> str:
    if candidate.startswith("//"):
        return f"https:{candidate}"
    if candidate.startswith("/"):
        parsed = urlparse(page_url)
        return f"{parsed.scheme}://{parsed.netloc}{candidate}"
    return candidate


def collect_femia_week_pages() -> dict[int, str]:
    pages: dict[int, str] = {}
    for index in range(1, 7):
        page_url = "https://femia.health/health-library/pregnancy/week-by-week/"
        if index > 1:
            page_url += f"page/{index}/"
        html_text = fetch_text(page_url)
        for week_text in WEEK_LINK_PATTERN.findall(html_text):
            week = int(week_text)
            pages.setdefault(
                week,
                f"https://femia.health/health-library/pregnancy/week-by-week/{week}-weeks-pregnant/",
            )
    return {week: url for week, url in pages.items() if 5 <= week <= 40}


def extract_fetus_image(page_url: str, week: int) -> tuple[str, str]:
    html_text = fetch_text(page_url)
    candidates: list[tuple[int, str, str]] = []
    for tag in IMG_TAG_PATTERN.findall(html_text):
        attrs = parse_img_attrs(tag)
        alt = attrs.get("alt", "").strip()
        src = attrs.get("src") or attrs.get("data-src") or attrs.get("data-lazy-src")
        if not src or src.startswith("data:image/"):
            continue
        score = 0
        alt_lower = alt.lower()
        if f"{week} weeks pregnant" in alt_lower:
            score += 10
        if "illustration" in alt_lower:
            score += 5
        if "embryo" in alt_lower or "fetus" in alt_lower or "uterus" in alt_lower:
            score += 3
        if week >= 10 and "preview" in src:
            score += 1
        if score > 0:
            candidates.append((score, normalize_url(src, page_url), alt))
    if not candidates:
        raise RuntimeError(f"Could not find fetus illustration for week {week}: {page_url}")
    candidates.sort(key=lambda item: (-item[0], len(item[1])))
    _, image_url, alt = candidates[0]
    return image_url, alt


def fetch_wikipedia_summary(title: str) -> dict[str, str] | None:
    url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{quote(title)}"
    try:
        payload = json.loads(fetch_text(url))
    except Exception:
        return None
    image_url = (
        payload.get("thumbnail", {}) or payload.get("originalimage", {})
    ).get("source")
    page_url = (
        payload.get("content_urls", {})
        .get("desktop", {})
        .get("page", f"https://en.wikipedia.org/wiki/{quote(title.replace(' ', '_'))}")
    )
    description = payload.get("description") or payload.get("extract") or ""
    if not image_url:
        return None
    return {
        "title": payload.get("title", title),
        "page_url": page_url,
        "image_url": image_url,
        "description": description,
    }


def choose_object_image(titles: Iterable[str]) -> dict[str, str]:
    for title in titles:
        summary = fetch_wikipedia_summary(title)
        if summary:
            return summary
    raise RuntimeError(f"Could not resolve object image for titles: {', '.join(titles)}")


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def file_suffix_from_url(url: str) -> str:
    suffix = Path(urlparse(url).path).suffix.lower()
    return suffix if suffix in {".png", ".jpg", ".jpeg", ".webp", ".gif"} else ".jpg"


def download(url: str, target: Path) -> None:
    if target.exists():
        return
    time.sleep(0.4)
    target.write_bytes(fetch_bytes(url))


def write_csv(rows: list[dict[str, str]]) -> None:
    if not rows:
        return
    with MANIFEST_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_gallery(rows: list[dict[str, str]]) -> None:
    cards = []
    for row in rows:
        cards.append(
            f"""
            <article class="card">
              <h2>{row['week']}주</h2>
              <p class="label">비교 대상: {html.escape(row['object_label_ko'])}</p>
              <div class="grid">
                <figure>
                  <img src="{html.escape(row['fetus_local_path'])}" alt="{html.escape(row['fetus_alt'])}" />
                  <figcaption><a href="{html.escape(row['fetus_page_url'])}">태아 출처</a></figcaption>
                </figure>
                <figure>
                  <img src="{html.escape(row['object_local_path'])}" alt="{html.escape(row['object_wikipedia_title'])}" />
                  <figcaption><a href="{html.escape(row['object_page_url'])}">사물 출처</a></figcaption>
                </figure>
              </div>
            </article>
            """
        )
    GALLERY_HTML.write_text(
        f"""<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>주차별 태아/사물 이미지 모음</title>
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 24px; background: #f8f5ef; color: #2a251e; }}
    h1 {{ margin-bottom: 8px; }}
    p {{ margin-top: 0; }}
    .card {{ background: white; border-radius: 18px; padding: 20px; margin: 16px 0; box-shadow: 0 8px 24px rgba(0,0,0,0.08); }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }}
    figure {{ margin: 0; }}
    img {{ width: 100%; height: 260px; object-fit: cover; border-radius: 14px; background: #f0ece4; }}
    figcaption {{ margin-top: 8px; font-size: 14px; }}
    .label {{ color: #6c6255; font-size: 14px; }}
  </style>
</head>
<body>
  <h1>주차별 태아/비교 사물 이미지 모음</h1>
  <p>태아 이미지는 Femia 주차별 페이지, 사물 이미지는 Wikipedia 요약 API의 대표 이미지를 사용했습니다.</p>
  {''.join(cards)}
</body>
</html>
""",
        encoding="utf-8",
    )


def main() -> int:
    ensure_dir(FETUS_DIR)
    ensure_dir(OBJECT_DIR)

    femia_pages = collect_femia_week_pages()
    missing_pages = [week for week in range(5, 41) if week not in femia_pages]
    if missing_pages:
        raise RuntimeError(f"Missing Femia pages for weeks: {missing_pages}")

    rows: list[dict[str, str]] = []
    for item in WEEK_OBJECTS:
        week = item["week"]
        fetus_page_url = femia_pages[week]
        fetus_image_url, fetus_alt = extract_fetus_image(fetus_page_url, week)
        object_info = choose_object_image(item["titles"])

        fetus_suffix = file_suffix_from_url(fetus_image_url)
        object_suffix = file_suffix_from_url(object_info["image_url"])
        fetus_path = FETUS_DIR / f"week-{week:02d}{fetus_suffix}"
        object_slug = re.sub(r"[^a-z0-9]+", "-", object_info["title"].lower()).strip("-")
        object_path = OBJECT_DIR / f"week-{week:02d}-{object_slug}{object_suffix}"

        download(fetus_image_url, fetus_path)
        download(object_info["image_url"], object_path)

        rows.append(
            {
                "week": str(week),
                "object_label_ko": item["label_ko"],
                "object_wikipedia_title": object_info["title"],
                "fetus_page_url": fetus_page_url,
                "fetus_image_url": fetus_image_url,
                "fetus_alt": fetus_alt,
                "fetus_local_path": str(fetus_path.relative_to(OUTPUT_DIR)),
                "object_page_url": object_info["page_url"],
                "object_image_url": object_info["image_url"],
                "object_local_path": str(object_path.relative_to(OUTPUT_DIR)),
                "object_description": object_info["description"],
            }
        )

    MANIFEST_JSON.write_text(
        json.dumps(
            {
                "fetus_source": "Femia week-by-week pregnancy pages",
                "object_source": "Wikipedia REST summary API",
                "items": rows,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    write_csv(rows)
    write_gallery(rows)

    print(f"Wrote {len(rows)} rows to {MANIFEST_JSON}")
    print(f"Gallery: {GALLERY_HTML}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        raise
