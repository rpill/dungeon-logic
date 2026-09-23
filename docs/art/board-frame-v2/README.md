# Modular matte stone board frame

The final concept matches the muted blue-lavender, grainy stone of the home
screen panels. Generated and retextured with the built-in ImageGen tool. The
20 PNG assets are cropped directly from this single number-free concept.

- `concept.png`: full source with transparent center/background.
- `contact-sheet.png`: all exported pieces, labeled for inspection.
- `slices.json`: exact crop coordinates and output sizes.
- `desktop.png`, `phone.png`, `small.png`, `landscape.png`, `rectangular.png`:
  captures from the running game.
- `verification.json`: browser checks for viewports, board sizes, cell input,
  decorative frame input isolation, and resize reuse/state preservation.
- `prompts.md`: generation and material-edit prompts.

Runtime assets: `public/assets/board-frame/v2/`.

| Pieces | Count | Placement, in cell units |
| --- | --- | --- |
| `top-1` ... `top-4` | 4 | 1 wide, 0.9 high; includes blank clue face |
| `left-1` ... `left-4` | 4 | 0.9 wide, 1 high; includes blank clue face |
| `right-1` ... `right-4` | 4 | 0.5 wide, 1 high |
| `bottom-1` ... `bottom-4` | 4 | 1 wide, 0.5 high |
| `corner-tl/tr/bl/br` | 4 | Intersections of the corresponding side extents |

`BoardFrameView` repeats variants by cell index. A W by H board uses
`2 * W + 2 * H + 4` images. Each stone uses the same cell-relative dimensions
at every board size. Resize repositions existing images. Clues are separate
runtime text; these assets contain no numbers. The frame has no input handlers.

Recreate PNGs and contact sheet with Python + Pillow:

```sh
python scripts/slice-board-frame-v2.py
```

The slicer retains original RGB and edge alpha, removes isolated generation
specks, trims the silhouette, and adds a one-pixel transparent inset. It does
not repaint the stones. The previous frame assets remain available for history.

The existing layout test exposed outdated space reserved for touch controls.
The reserve now includes both 68px rows, the 22px inter-row gap, bottom margin,
and a 12px gap above the controls. Wide touch layouts reserve their 72px row.
The board also clears the real timer panel bottom by at least 10px; the old
header reserve allowed the timer to cover top clues on small or tall boards.

## Verification

Passed: TypeScript compilation, Vite production build, game-board assets sanity,
board-frame layout (viewport/input/rectangular-board and tutorial-reserve cases),
game-board layout, puzzle interaction, live resize, tutorial-text-above-board,
and browser checks recorded in `verification.json`.

Other existing checks still fail on expectations outside this frame change:

- `src/dev/boardTileVisualSanity.ts`: expects the old temporary `M` monster
  text marker, while monsters already render as sprites.
- `scripts/tutorial-board-stability-sanity.mjs`: searches for an old literal
  `calculateStableBoardLayout` call including arguments no longer present.
- `src/dev/puzzleHeaderLayoutSanity.ts`: checks a historical header reserve
  smaller than the current timer panel. The frame test now checks the actual
  panel bottom directly.

An exploratory browser check that restarted the running GameScene hit an
existing timer/shutdown error (`Text.updateText` after its texture was destroyed).
Final board-size checks boot fresh game instances; resize in a live instance
is verified and preserves an edited cell. Scene-shutdown behavior was not changed.

The production build reports its existing SDK script and large-chunk warnings.
