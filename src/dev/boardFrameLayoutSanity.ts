import assert from 'node:assert/strict';
import { calculateGameBoardLayout, useInlineTouchToolbar } from '../scenes/GameBoardLayout';
import { calculatePuzzleToolbarLayout } from '../runtime/PuzzleUiState';

// Includes rectangular boards, short landscape, and the minimum phone width.
for (const [width, height] of [[320, 568], [390, 844], [430, 932], [844, 390], [1280, 720], [1920, 1080]]) {
  for (const [columns, rows] of [[5, 5], [6, 6], [7, 7], [10, 10], [4, 9], [9, 4]]) {
    for (const touch of [false, true]) {
      const layout = calculateGameBoardLayout(width, height, columns, rows, touch);
      const s = layout.cellSize;
      const left = layout.originX - s * 0.9;
      const right = layout.originX + layout.boardWidth + s * 0.5;
      const top = layout.originY - s * 0.9;
      const bottom = layout.originY + layout.boardHeight + s * 0.5;
      const narrow = width < 700;
      const margin = narrow ? 12 : 24;
      const label = `${width}x${height}, ${columns}x${rows}`;
      assert(left >= margin - 0.001 && right <= width - margin + 0.001, `Entire frame fits width: ${label}`);
      assert(Math.abs((left + right) / 2 - width / 2) < 0.001, `Entire frame is centered: ${label}`);
      assert(top >= (narrow ? 72 : 92) - 0.001, `Frame clears header: ${label}`);
      assert(bottom <= height - (narrow ? 132 : 96) + 0.001, `Frame clears toolbar: ${label}`);
      if (touch) {
        const toolbar = calculatePuzzleToolbarLayout(width, height, 0, true, bottom);
        const toolbarTop = Math.min(...toolbar.buttons.map(button => button.y - button.height / 2));
        assert(bottom + 10 <= toolbarTop, `Touch controls clear the frame: ${label}`);
      }
    }
  }
}
// The toolbar chooses its mode from the physical viewport, before tutorial reserves.
for (const height of [320, 390, 550, 600]) {
  const reserve = 86;
  const layout = calculateGameBoardLayout(844, height - reserve, 5, 5, true, useInlineTouchToolbar(844, height));
  const worstBottom = layout.originY + layout.boardHeight + layout.cellSize * 0.5 + reserve;
  const toolbar = calculatePuzzleToolbarLayout(844, height, 0, true, worstBottom);
  const top = Math.min(...toolbar.buttons.map(button => button.y - button.height / 2));
  assert(worstBottom + 10 <= top, `Tutorial frame clears controls at 844x${height}`);
}
console.info('[Dungeon Logic] Board frame: 72 viewport/board/input combinations + 4 tutorial cases passed');
