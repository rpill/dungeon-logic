Dungeon Logic — navigation/UI polish patch

Replace the files preserving paths:
- src/scenes/GameScene.ts
- src/scenes/HomeScene.ts
- src/runtime/PuzzleUiState.ts
- scripts/game-controls-settings-visual-sanity.mjs

Changes:
- Desktop Undo / Reset / Hint buttons enlarged substantially.
- Back and Menu are solid rounded controls with one full hit area each.
- Game pause/menu overlay redesigned to solid rounded dungeon-style UI.
- Removed duplicate Exit to Levels / Exit to Daily entry from the pause menu.
- Pause menu keeps Continue / Rules / Settings / Home.
- Home Tutorial and How to Play are now visible rounded utility buttons on desktop and mobile.
- All icon/text gaps inside these controls are clickable because input is owned by one full-button Zone.

After replacing, run:
  npm run build
