"""Slice the generated, number-free concept into 20 reusable RGBA stones.

Run from anywhere: python scripts/slice-board-frame-v2.py
Requires Pillow. Crops retain source colors and alpha; no stone is repainted.
"""
from collections import deque
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'docs/art/board-frame-v2'
OUTPUT = ROOT / 'public/assets/board-frame/v2'
SOURCE = ART / 'concept.png'


def isolate_stone(tile):
    """Remove isolated generation specks, retaining the largest stone's soft edge."""
    alpha = tile.getchannel('A')
    width, height = tile.size
    pixels = alpha.load()
    visited = set()
    largest = []
    for y in range(height):
        for x in range(width):
            if (x, y) in visited or pixels[x, y] < 96:
                continue
            queue = deque([(x, y)])
            visited.add((x, y))
            component = []
            while queue:
                px, py = queue.popleft()
                component.append((px, py))
                for nx, ny in ((px-1, py), (px+1, py), (px, py-1), (px, py+1)):
                    if 0 <= nx < width and 0 <= ny < height and (nx, ny) not in visited and pixels[nx, ny] >= 96:
                        visited.add((nx, ny))
                        queue.append((nx, ny))
            if len(component) > len(largest):
                largest = component
    mask = Image.new('L', tile.size)
    draw = ImageDraw.Draw(mask)
    draw.point(largest, fill=255)
    mask = mask.filter(ImageFilter.MaxFilter(3))
    cleaned = Image.new('L', tile.size)
    cleaned.paste(alpha, mask=mask)
    tile.putalpha(cleaned)
    return tile.crop(tile.getbbox())


def main():
    source = Image.open(SOURCE).convert('RGBA')
    if source.size != (1254, 1254):
        raise ValueError('Expected the saved 1254 x 1254 concept')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    # Boundaries follow the transparent joints, not an assumed uniform AI grid.
    xs = [248, 433, 627, 821, 1006]
    ys = [270, 463, 657, 853, 1006]
    boxes = {}
    for i in range(4):
        boxes[f'top-{i+1}'] = [xs[i], 105, xs[i+1], 265]
        boxes[f'left-{i+1}'] = [98, ys[i], 246, ys[i+1]]
        boxes[f'right-{i+1}'] = [1008, ys[i], 1152, ys[i+1]]
        boxes[f'bottom-{i+1}'] = [xs[i], 1012, xs[i+1], 1142]
    boxes.update({
        'corner-tl': [98, 105, 248, 270],
        'corner-tr': [1006, 105, 1152, 270],
        'corner-bl': [98, 1006, 248, 1142],
        'corner-br': [1006, 1006, 1152, 1142],
    })
    manifest = {'source': 'docs/art/board-frame-v2/concept.png', 'pieces': {}}
    for name, box in boxes.items():
        tile = isolate_stone(source.crop(box))
        # A small transparent inset preserves antialiasing at texture boundaries.
        asset = Image.new('RGBA', (tile.width+2, tile.height+2))
        asset.paste(tile, (1, 1))
        asset.save(OUTPUT / f'{name}.png', optimize=True)
        manifest['pieces'][name] = {'crop': box, 'size': list(asset.size)}
    (ART / 'slices.json').write_text(json.dumps(manifest, indent=2)+'\n', encoding='utf-8')

    sheet = Image.new('RGB', (1000, 800), '#121c35')
    draw = ImageDraw.Draw(sheet)
    groups = [[f'{side}-{i}' for i in range(1, 5)] for side in ['top', 'left', 'right', 'bottom']]
    groups.append(['corner-tl', 'corner-tr', 'corner-bl', 'corner-br'])
    for row, names in enumerate(groups):
        for col, name in enumerate(names):
            tile = Image.open(OUTPUT / f'{name}.png')
            tile.thumbnail((205, 123), Image.Resampling.LANCZOS)
            x, y = col*250 + (250-tile.width)//2, row*160+8
            sheet.paste(tile, (x, y), tile)
            draw.text((col*250+24, row*160+140), name, fill='#d9dfff')
    sheet.save(ART / 'contact-sheet.png', optimize=True)
    print(f'Saved {len(boxes)} separate stones to {OUTPUT}')


if __name__ == '__main__':
    main()
