"""Build compact contact sheets from QA screenshots for visual review."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import sys

root = Path(__file__).resolve().parents[1] / 'visual-qa' / 'screenshots'
viewport = sys.argv[1] if len(sys.argv) > 1 else '390x844'
source = root / viewport
if not source.is_dir():
    raise SystemExit(f'Missing screenshots: {source}')

groups = {
    'Home': ['home-'], 'Levels': ['levels-'], 'Daily': ['daily-'],
    'Leaderboards': ['leaderboard-', 'master-rating'], 'Mastery': ['mastery-'],
    'Challenge': ['challenge-'], 'Gameplay': ['game-'],
    'Completion': ['completion-'], 'Rank Up': ['rankup-'],
    'Modals': ['modal-'], 'Tutorial': ['tutorial-'],
}
font = ImageFont.load_default()
for group, prefixes in groups.items():
    paths = sorted(path for path in source.glob('*.png') if any(path.stem.startswith(prefix) for prefix in prefixes))
    if not paths:
        continue
    columns = min(5, len(paths))
    tile_w, tile_h, label_h, gap = 230, 330, 26, 14
    rows = (len(paths) + columns - 1) // columns
    sheet = Image.new('RGB', (gap + columns * (tile_w + gap), gap + rows * (tile_h + label_h + gap)), '#16233a')
    draw = ImageDraw.Draw(sheet)
    for index, path in enumerate(paths):
        with Image.open(path) as shot:
            shot.thumbnail((tile_w, tile_h), Image.Resampling.LANCZOS)
            x = gap + (index % columns) * (tile_w + gap) + (tile_w - shot.width) // 2
            y = gap + (index // columns) * (tile_h + label_h + gap)
            sheet.paste(shot.convert('RGB'), (x, y))
            draw.text((gap + (index % columns) * (tile_w + gap), y + tile_h + 5), path.stem, fill='#f7ebce', font=font)
    target = root / f'contact-{viewport}-{group.lower().replace(" ", "-")}.png'
    sheet.save(target)
    print(target)
