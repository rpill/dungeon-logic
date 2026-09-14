# Modular dungeon frame

11 PNG pieces sliced from the user-supplied 1448×1086 UI concept (desktop board).
`preview.png` is a contact sheet, not loaded by the game.

- Four transparent silhouette corners.
- Top and left rim sections; two bottom and two right stone variants.
- A blank beveled clue plaque. Its numeral and shadow were replaced using clean
  stone sampled from the same plaque. All numbers are Phaser text at runtime.

Reproduce with Pillow:

```sh
python scripts/slice-board-frame.py path/to/original-concept.png
```

Crop coordinates and silhouette masks are recorded in that script. Assets keep
their source resolution; this is a deterministic cut of the concept, not newly
generated artwork. `BoardFrameView` repeats sections per cell and keeps corners
separate. `BoardFrameMetrics` defines shared bounds for layout and UI clearance.

Rollback checkpoint before this experiment: `aa00950`.
