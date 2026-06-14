#!/usr/bin/env python3

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--text-file", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--width", type=int, required=True)
    parser.add_argument("--height", type=int, required=True)
    parser.add_argument("--font-file", required=True)
    parser.add_argument("--font-size", type=int, required=True)
    parser.add_argument("--y", type=int, required=True)
    parser.add_argument("--line-spacing", type=int, default=10)
    parser.add_argument("--stroke-width", type=int, default=5)
    parser.add_argument("--font-color", default="#FFFFFF")
    parser.add_argument("--stroke-color", default="#17322BD1")
    parser.add_argument("--panel-fill", default="#00000000")
    parser.add_argument("--panel-stroke", default="#00000000")
    parser.add_argument("--panel-radius", type=int, default=0)
    parser.add_argument("--padding-x", type=int, default=0)
    parser.add_argument("--padding-y", type=int, default=0)
    parser.add_argument("--shadow-color", default="#00000000")
    parser.add_argument("--shadow-offset-x", type=int, default=0)
    parser.add_argument("--shadow-offset-y", type=int, default=0)
    return parser.parse_args()


def parse_hex_color(value):
    value = value.strip().lstrip("#")
    if len(value) == 6:
        value += "FF"
    if len(value) != 8:
        raise ValueError(f"Unsupported color value: {value}")
    return tuple(int(value[index:index + 2], 16) for index in range(0, 8, 2))


def main():
    args = parse_args()
    text = Path(args.text_file).read_text(encoding="utf-8").strip()
    image = Image.new("RGBA", (args.width, args.height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(args.font_file, args.font_size)

    bbox = draw.multiline_textbbox(
        (0, 0),
        text,
        font=font,
        align="center",
        spacing=args.line_spacing,
        stroke_width=args.stroke_width,
    )
    text_width = bbox[2] - bbox[0]
    x = int((args.width - text_width) / 2 - bbox[0])
    y = int(args.y - bbox[1])

    panel_left = x + bbox[0] - args.padding_x
    panel_top = y + bbox[1] - args.padding_y
    panel_right = x + bbox[2] + args.padding_x
    panel_bottom = y + bbox[3] + args.padding_y

    if args.shadow_color != "#00000000":
        draw.rounded_rectangle(
            (
                panel_left + args.shadow_offset_x,
                panel_top + args.shadow_offset_y,
                panel_right + args.shadow_offset_x,
                panel_bottom + args.shadow_offset_y,
            ),
            radius=args.panel_radius,
            fill=parse_hex_color(args.shadow_color),
        )

    if args.panel_fill != "#00000000" or args.panel_stroke != "#00000000":
        draw.rounded_rectangle(
            (panel_left, panel_top, panel_right, panel_bottom),
            radius=args.panel_radius,
            fill=parse_hex_color(args.panel_fill),
            outline=parse_hex_color(args.panel_stroke),
            width=2,
        )

    draw.multiline_text(
        (x, y),
        text,
        font=font,
        fill=parse_hex_color(args.font_color),
        align="center",
        spacing=args.line_spacing,
        stroke_width=args.stroke_width,
        stroke_fill=parse_hex_color(args.stroke_color),
    )

    Path(args.output).parent.mkdir(parents=True, exist_ok=True)
    image.save(args.output)


if __name__ == "__main__":
    main()
