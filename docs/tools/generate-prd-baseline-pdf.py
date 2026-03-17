#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
from html import escape
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    ListFlowable,
    ListItem,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


FONT_CANDIDATES = [
    "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
]


def register_font() -> str:
    for font_path in FONT_CANDIDATES:
        path = Path(font_path)
        if path.exists():
            pdfmetrics.registerFont(TTFont("DocFont", str(path)))
            return "DocFont"
    raise FileNotFoundError("Korean-capable font not found on this system.")


def is_table_delimiter(line: str) -> bool:
    body = line.strip().strip("|").replace("-", "").replace(":", "").replace(" ", "")
    return body == ""


def parse_table_rows(block: list[str]) -> list[list[str]]:
    rows: list[list[str]] = []
    for raw in block:
        if is_table_delimiter(raw):
            continue
        cols = [col.strip() for col in raw.strip().strip("|").split("|")]
        rows.append(cols)
    if not rows:
        return []

    width = max(len(r) for r in rows)
    normalized = [r + [""] * (width - len(r)) for r in rows]
    return normalized


def inline_markup(text: str) -> str:
    escaped = escape(text)
    return re.sub(r"`([^`]+)`", r"<font face='Courier'>\1</font>", escaped)


def build_story(md_text: str, styles: dict[str, ParagraphStyle]):
    lines = md_text.splitlines()
    story = []
    i = 0

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            story.append(Spacer(1, 8))
            i += 1
            continue

        if stripped.startswith("# "):
            story.append(Paragraph(inline_markup(stripped[2:].strip()), styles["h1"]))
            story.append(Spacer(1, 6))
            i += 1
            continue

        if stripped.startswith("## "):
            story.append(Paragraph(inline_markup(stripped[3:].strip()), styles["h2"]))
            story.append(Spacer(1, 4))
            i += 1
            continue

        if stripped.startswith("### "):
            story.append(Paragraph(inline_markup(stripped[4:].strip()), styles["h3"]))
            story.append(Spacer(1, 3))
            i += 1
            continue

        if stripped.startswith(">"):
            quote_lines = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                quote_lines.append(lines[i].strip()[1:].strip())
                i += 1
            quote_text = "<br/>".join(inline_markup(q) for q in quote_lines)
            story.append(Paragraph(quote_text, styles["quote"]))
            story.append(Spacer(1, 6))
            continue

        if stripped.startswith("|"):
            table_block = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                table_block.append(lines[i])
                i += 1

            rows = parse_table_rows(table_block)
            if rows:
                table_data = [
                    [Paragraph(inline_markup(cell), styles["table"]) for cell in row]
                    for row in rows
                ]
                table = Table(table_data, repeatRows=1)
                table.setStyle(
                    TableStyle(
                        [
                            ("FONTNAME", (0, 0), (-1, -1), styles["table"].fontName),
                            ("FONTSIZE", (0, 0), (-1, -1), styles["table"].fontSize),
                            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F2F4F8")),
                            ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#C8CDD4")),
                            ("VALIGN", (0, 0), (-1, -1), "TOP"),
                            ("LEFTPADDING", (0, 0), (-1, -1), 5),
                            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                            ("TOPPADDING", (0, 0), (-1, -1), 4),
                            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                        ]
                    )
                )
                story.append(table)
                story.append(Spacer(1, 8))
            continue

        if re.match(r"^\d+\.\s+", stripped):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i].strip()):
                item_text = re.sub(r"^\d+\.\s+", "", lines[i].strip())
                items.append(
                    ListItem(Paragraph(inline_markup(item_text), styles["body"]))
                )
                i += 1
            story.append(ListFlowable(items, bulletType="1", leftIndent=14))
            story.append(Spacer(1, 6))
            continue

        if stripped.startswith("- "):
            items = []
            while i < len(lines) and lines[i].strip().startswith("- "):
                item_text = lines[i].strip()[2:].strip()
                items.append(
                    ListItem(Paragraph(inline_markup(item_text), styles["body"]))
                )
                i += 1
            story.append(ListFlowable(items, bulletType="bullet", leftIndent=14))
            story.append(Spacer(1, 6))
            continue

        paragraph_lines = [stripped]
        i += 1
        while i < len(lines):
            nxt = lines[i].strip()
            if (
                not nxt
                or nxt.startswith(("#", ">", "|", "- "))
                or re.match(r"^\d+\.\s+", nxt)
            ):
                break
            paragraph_lines.append(nxt)
            i += 1

        story.append(
            Paragraph(inline_markup(" ".join(paragraph_lines)), styles["body"])
        )
        story.append(Spacer(1, 6))

    return story


def build_pdf(input_path: Path, output_path: Path) -> None:
    font_name = register_font()
    base = getSampleStyleSheet()

    styles = {
        "h1": ParagraphStyle(
            "h1",
            parent=base["Heading1"],
            fontName=font_name,
            fontSize=17,
            leading=22,
            spaceAfter=4,
        ),
        "h2": ParagraphStyle(
            "h2",
            parent=base["Heading2"],
            fontName=font_name,
            fontSize=13,
            leading=18,
            spaceAfter=3,
        ),
        "h3": ParagraphStyle(
            "h3",
            parent=base["Heading3"],
            fontName=font_name,
            fontSize=11.5,
            leading=16,
            spaceAfter=2,
        ),
        "body": ParagraphStyle(
            "body",
            parent=base["BodyText"],
            fontName=font_name,
            fontSize=10.2,
            leading=14.5,
        ),
        "quote": ParagraphStyle(
            "quote",
            parent=base["BodyText"],
            fontName=font_name,
            fontSize=9.8,
            leading=14,
            textColor=colors.HexColor("#1F2937"),
            leftIndent=10,
            borderPadding=6,
            backColor=colors.HexColor("#F8FAFC"),
        ),
        "table": ParagraphStyle(
            "table",
            parent=base["BodyText"],
            fontName=font_name,
            fontSize=9.4,
            leading=12,
        ),
    }

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=28,
        rightMargin=28,
        topMargin=28,
        bottomMargin=28,
        title="PRD Scope Baseline",
        author="Room821",
    )

    text = input_path.read_text(encoding="utf-8")
    story = build_story(text, styles)
    doc.build(story)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate locked PDF from PRD baseline markdown."
    )
    parser.add_argument("--input", required=True, help="Input markdown path")
    parser.add_argument("--output", required=True, help="Output pdf path")
    args = parser.parse_args()

    input_path = Path(args.input)
    output_path = Path(args.output)
    build_pdf(input_path, output_path)
    print(f"PDF generated: {output_path}")


if __name__ == "__main__":
    main()
