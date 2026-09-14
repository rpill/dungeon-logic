"""Slice the user-provided 1448x1086 concept. Usage: python scripts/slice-board-frame.py SOURCE.png

No generated artwork: crops, silhouette masks, and a blank patch sampled from
the same plaque. Coordinates refer to the larger (desktop) board in the concept.
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

source = Image.open(sys.argv[1]).convert('RGBA')
if source.size != (1448, 1086):
    raise ValueError('Expected the original 1448x1086 concept')
output = Path(__file__).resolve().parents[1] / 'public/assets/board-frame'
output.mkdir(parents=True, exist_ok=True)


def cut(name, box, polygon=None):
    asset = source.crop(box)
    if polygon:
        mask = Image.new('L', asset.size)
        ImageDraw.Draw(mask).polygon([(x-box[0], y-box[1]) for x, y in polygon], fill=255)
        asset.putalpha(mask)
    asset.save(output / f'{name}.png', optimize=True)
    return asset


cut('top', (878, 293, 928, 309))
cut('bottom-a', (864, 718, 922, 754))
cut('bottom-b', (925, 718, 999, 754))
cut('left', (716, 463, 736, 510))
cut('right-a', (1134, 466, 1185, 541))
cut('right-b', (1134, 544, 1185, 608))
cut('corner-tl', (712, 291, 784, 359), [
    (713, 324), (729, 307), (735, 307), (735, 299), (745, 291),
    (777, 292), (784, 303), (783, 337), (772, 350), (722, 359), (712, 352)])
cut('corner-tr', (1127, 290, 1191, 360), [
    (1127, 298), (1138, 290), (1162, 291), (1171, 303), (1170, 311),
    (1177, 307), (1190, 322), (1191, 351), (1184, 360), (1142, 350), (1127, 335)])
cut('corner-bl', (702, 707, 774, 773), [
    (702, 718), (712, 707), (751, 708), (767, 720), (768, 753),
    (774, 764), (768, 773), (738, 771), (730, 760), (729, 750), (709, 751), (702, 747)])
cut('corner-br', (1137, 707, 1202, 773), [
    (1156, 709), (1194, 707), (1202, 714), (1201, 747), (1195, 753),
    (1179, 753), (1170, 769), (1148, 773), (1137, 764), (1138, 724)])

# Keep the original bevel. Replace the entire digit area with blank stone
# from the top of the same tile; no numeral pixels enter the exported asset.
plaque = source.crop((829, 307, 877, 349))
blank = source.crop((836, 312, 870, 316)).resize((34, 30), Image.Resampling.BICUBIC)
plaque.paste(blank, (7, 6))
plaque.save(output / 'clue.png', optimize=True)

sheet = Image.new('RGB', (520, 220), '#10172b')
for i, path in enumerate(sorted(p for p in output.glob('*.png') if p.stem != 'preview')):
    tile = Image.open(path)
    tile.thumbnail((80, 72))
    x, y = 6 + (i % 6) * 86, 6 + (i // 6) * 104
    sheet.paste(tile, (x, y), tile)
    ImageDraw.Draw(sheet).text((x, y + 76), path.stem, fill='#ccd0e0')
sheet.save(output / 'preview.png')
print(f'Saved 11 frame pieces and preview to {output}')
