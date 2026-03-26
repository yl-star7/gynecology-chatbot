from pathlib import Path
from shutil import copyfile

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
BRANDING_DIR = ROOT / "assets" / "branding"
IOS_ICON_PATH = ROOT / "ios" / "AI" / "Images.xcassets" / "AppIcon.appiconset" / "App-Icon-1024x1024@1x.png"

PINK = "#f6b8c9"
PINK_BORDER = "#ffdce7"
WHITE = "#ffffff"
INK = "#314d78"
PENGUIN_GREY = "#8f98a6"
PENGUIN_DARK = "#667184"
PENGUIN_LIGHT = "#f8fbff"
BLUE_SCRUB = "#b8d3f2"
BLUE_TRIM = "#7aa8da"
ORANGE = "#f5b169"
PEACH = "#ffbfac"


def rounded_rect(draw: ImageDraw.ImageDraw, xy, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)


def make_app_icon(size: int = 1024) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    padding = int(size * 0.035)
    outer = [padding, padding, size - padding, size - padding]
    inner = [padding + int(size * 0.02), padding + int(size * 0.02), size - padding - int(size * 0.02), size - padding - int(size * 0.02)]
    rounded_rect(draw, outer, int(size * 0.12), fill=WHITE)
    rounded_rect(draw, inner, int(size * 0.12), fill=PINK, outline=PINK_BORDER, width=int(size * 0.018))

    # Mother / child symbol
    head_r = size * 0.11
    child_r = size * 0.085
    head_cx, head_cy = size * 0.5, size * 0.33
    child_cx, child_cy = size * 0.5, size * 0.60
    draw.ellipse(
        [head_cx - head_r, head_cy - head_r, head_cx + head_r, head_cy + head_r],
        fill=WHITE,
    )
    draw.ellipse(
        [child_cx - child_r, child_cy - child_r, child_cx + child_r, child_cy + child_r],
        fill=WHITE,
    )

    line_width = int(size * 0.08)
    left_start = (size * 0.34, size * 0.52)
    left_mid = (size * 0.26, size * 0.71)
    left_end = (size * 0.50, size * 0.75)
    right_start = (size * 0.66, size * 0.52)
    right_mid = (size * 0.74, size * 0.71)
    right_end = (size * 0.50, size * 0.75)
    draw.line([left_start, left_mid, left_end], fill=WHITE, width=line_width, joint="curve")
    draw.line([right_start, right_mid, right_end], fill=WHITE, width=line_width, joint="curve")
    return image


def make_mark(size: int = 512) -> Image.Image:
    app_icon = make_app_icon(size)
    return app_icon.crop((0, 0, size, size))


def make_adaptive_foreground(size: int = 1024) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    inset = int(size * 0.08)
    scale = size - inset * 2

    head_r = scale * 0.13
    child_r = scale * 0.10
    head_cx, head_cy = size * 0.5, inset + scale * 0.25
    child_cx, child_cy = size * 0.5, inset + scale * 0.58
    draw.ellipse([head_cx - head_r, head_cy - head_r, head_cx + head_r, head_cy + head_r], fill=WHITE)
    draw.ellipse([child_cx - child_r, child_cy - child_r, child_cx + child_r, child_cy + child_r], fill=WHITE)

    line_width = int(scale * 0.09)
    draw.line(
        [(size * 0.36, inset + scale * 0.47), (size * 0.27, inset + scale * 0.72), (size * 0.50, inset + scale * 0.79)],
        fill=WHITE,
        width=line_width,
        joint="curve",
    )
    draw.line(
        [(size * 0.64, inset + scale * 0.47), (size * 0.73, inset + scale * 0.72), (size * 0.50, inset + scale * 0.79)],
        fill=WHITE,
        width=line_width,
        joint="curve",
    )
    return image


def make_splash_logo(size: int = 1024) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    rounded_rect(draw, [size * 0.08, size * 0.08, size * 0.92, size * 0.92], int(size * 0.18), fill=PINK, outline=PINK_BORDER, width=int(size * 0.03))

    symbol = make_adaptive_foreground(size)
    image.alpha_composite(symbol)
    return image


def make_fab_penguin(size: int = 256) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    # Soft badge
    badge_margin = int(size * 0.04)
    rounded_rect(
        draw,
        [badge_margin, badge_margin, size - badge_margin, size - badge_margin],
        int(size * 0.28),
        fill=WHITE,
    )
    rounded_rect(
        draw,
        [badge_margin + 6, badge_margin + 6, size - badge_margin - 6, size - badge_margin - 6],
        int(size * 0.26),
        fill="#eef5ff",
        outline="#dce8fa",
        width=6,
    )

    body = [size * 0.24, size * 0.12, size * 0.76, size * 0.88]
    draw.ellipse(body, fill=PENGUIN_GREY, outline=INK, width=6)
    belly = [size * 0.34, size * 0.28, size * 0.66, size * 0.86]
    draw.ellipse(belly, fill=PENGUIN_LIGHT)
    face = [size * 0.30, size * 0.20, size * 0.70, size * 0.58]
    draw.ellipse(face, fill=PENGUIN_LIGHT)

    # cap
    cap = [(size * 0.46, size * 0.12), (size * 0.54, size * 0.12), (size * 0.58, size * 0.18), (size * 0.50, size * 0.21), (size * 0.42, size * 0.18)]
    draw.polygon(cap, fill=WHITE, outline=INK)
    draw.line([(size * 0.50, size * 0.125), (size * 0.50, size * 0.195)], fill="#ef8ea8", width=4)
    draw.line([(size * 0.47, size * 0.16), (size * 0.53, size * 0.16)], fill="#ef8ea8", width=4)

    # eyes
    for cx in (size * 0.43, size * 0.57):
        draw.ellipse([cx - 15, size * 0.33 - 20, cx + 15, size * 0.33 + 20], fill=INK)
        draw.ellipse([cx - 5, size * 0.33 - 10, cx + 3, size * 0.33 - 2], fill=WHITE)
    draw.ellipse([size * 0.47, size * 0.42, size * 0.53, size * 0.49], fill=ORANGE, outline=INK, width=4)
    draw.ellipse([size * 0.485, size * 0.455, size * 0.515, size * 0.485], fill=PEACH)

    # blush
    draw.ellipse([size * 0.34, size * 0.43, size * 0.42, size * 0.49], fill=PEACH)
    draw.ellipse([size * 0.58, size * 0.43, size * 0.66, size * 0.49], fill=PEACH)

    # scrub
    scrub = [(size * 0.30, size * 0.56), (size * 0.70, size * 0.56), (size * 0.78, size * 0.86), (size * 0.22, size * 0.86)]
    draw.polygon(scrub, fill=BLUE_SCRUB, outline=INK)
    draw.line([(size * 0.41, size * 0.58), (size * 0.50, size * 0.67), (size * 0.59, size * 0.58)], fill=BLUE_TRIM, width=6)

    # book
    book = [size * 0.58, size * 0.56, size * 0.80, size * 0.77]
    rounded_rect(draw, book, 12, fill=WHITE, outline=INK, width=5)
    draw.line([(size * 0.69, size * 0.58), (size * 0.69, size * 0.76)], fill="#b8cce8", width=4)
    draw.line([(size * 0.61, size * 0.63), (size * 0.67, size * 0.63)], fill="#7ec1b1", width=4)
    draw.line([(size * 0.71, size * 0.63), (size * 0.77, size * 0.63)], fill="#7ec1b1", width=4)

    # wing hint
    draw.pieslice([size * 0.14, size * 0.44, size * 0.34, size * 0.80], start=215, end=330, fill=PENGUIN_DARK, outline=INK)
    return image


def save(image: Image.Image, path: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)


def main():
    BRANDING_DIR.mkdir(parents=True, exist_ok=True)
    app_icon = make_app_icon()
    save(app_icon, BRANDING_DIR / "app-icon.png")
    save(make_mark(), BRANDING_DIR / "app-mark.png")
    save(make_adaptive_foreground(), BRANDING_DIR / "adaptive-icon.png")
    save(make_splash_logo(), BRANDING_DIR / "splash-logo.png")
    save(make_fab_penguin(), BRANDING_DIR / "fab-nurse.png")
    copyfile(BRANDING_DIR / "app-icon.png", IOS_ICON_PATH)


if __name__ == "__main__":
    main()
