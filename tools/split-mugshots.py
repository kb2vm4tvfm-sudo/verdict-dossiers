#!/usr/bin/env python3
"""Split a 2x2 mugshot sheet into four suspect photos.

The suspect wall wants one portrait per person, but a generated mugshot sheet
arrives as a single grid. This cuts it in reading order — top-left, top-right,
bottom-left, bottom-right — which is the order suspects are listed in the case
file, so photo N lands on suspect N.

    python3 tools/split-mugshots.py <sheet.jpg> <case-id> [--rows 2 --cols 2]

Writes assets/covers/<case-id>-suspect-1.jpg … -4.jpg
"""
import argparse
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required:  python3 -m pip install Pillow")

ROOT = Path(__file__).resolve().parent.parent
COVERS = ROOT / "assets" / "covers"


def to_portrait(tile, aspect):
    """Centre-crop a tile to the suspect wall's portrait ratio.

    A mugshot sheet is generated in landscape tiles, but the suspect card slot
    is 3:4. Letting CSS `object-fit: cover` do the reduction crops the sides off
    a face that is already centred, so the cut is made here instead — where the
    subject is known to be in the middle of the frame.
    """
    try:
        aw, ah = (int(part) for part in aspect.split(":"))
        if aw <= 0 or ah <= 0:
            raise ValueError
    except ValueError:
        sys.exit(f"--aspect must look like 3:4, got {aspect!r}")

    target = aw / ah
    current = tile.width / tile.height
    if abs(current - target) < 0.01:
        return tile

    if current > target:                      # too wide — trim the sides
        new_w = int(round(tile.height * target))
        left = (tile.width - new_w) // 2
        return tile.crop((left, 0, left + new_w, tile.height))

    new_h = int(round(tile.width / target))   # too tall — trim top and bottom,
    top = (tile.height - new_h) // 3          # biased up to keep the head in
    return tile.crop((0, top, tile.width, top + new_h))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("sheet", type=Path)
    ap.add_argument("case_id")
    ap.add_argument("--rows", type=int, default=2)
    ap.add_argument("--cols", type=int, default=2)
    ap.add_argument("--quality", type=int, default=88)
    ap.add_argument(
        "--aspect", default="3:4",
        help="Portrait ratio for the suspect wall, W:H (default 3:4). "
             "Use 'none' to keep the raw tile.",
    )
    args = ap.parse_args()

    if not args.sheet.exists():
        sys.exit(f"No such file: {args.sheet}")

    COVERS.mkdir(parents=True, exist_ok=True)
    sheet = Image.open(args.sheet).convert("RGB")
    tile_w = sheet.width // args.cols
    tile_h = sheet.height // args.rows

    written = []
    n = 0
    for row in range(args.rows):
        for col in range(args.cols):
            n += 1
            box = (col * tile_w, row * tile_h, (col + 1) * tile_w, (row + 1) * tile_h)
            tile = sheet.crop(box)
            if args.aspect != "none":
                tile = to_portrait(tile, args.aspect)
            out = COVERS / f"{args.case_id}-suspect-{n}.jpg"
            tile.save(out, "JPEG", quality=args.quality, optimize=True)
            written.append((out, tile.width, tile.height))

    for path, w, h in written:
        print(f"  {path.relative_to(ROOT)}  {w}x{h}")
    print(f"\n{len(written)} portraits written to {COVERS.relative_to(ROOT)}/")


if __name__ == "__main__":
    main()
