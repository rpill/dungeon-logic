import type Phaser from 'phaser';

import type { SupportedLanguage } from '../i18n/Language';
import type { HelpRuleId, HelpUtilityId } from './HelpRules';

export type HelpIllustrationId = HelpRuleId | HelpUtilityId;

const FLOOR_KEYS = ['board-floor-01', 'board-floor-02', 'board-floor-03', 'board-floor-04'] as const;
const WALL_KEYS = ['board-wall-01', 'board-wall-02', 'board-wall-03', 'board-wall-04'] as const;
const FLOOR_MARK_KEY = 'board-floor-mark';
const MONSTER_KEY = 'monster-pink-01';
const CHEST_KEY = 'board-chest-01';

interface IllustrationOptions {
  readonly x: number;
  readonly topY: number;
  readonly width: number;
  readonly narrow: boolean;
  readonly language: SupportedLanguage;
}

function localize(options: IllustrationOptions, ru: string, en: string): string {
  return options.language === 'ru' ? ru : en;
}

function addFloor(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  variant = 0,
): Phaser.GameObjects.Image {
  return scene.add.image(x, y, FLOOR_KEYS[variant % FLOOR_KEYS.length]!)
    .setDisplaySize(size, size)
    .setDepth(3);
}

function addWall(
  scene: Phaser.Scene,
  x: number,
  y: number,
  size: number,
  variant = 0,
): Phaser.GameObjects.Image {
  return scene.add.image(x, y, WALL_KEYS[variant % WALL_KEYS.length]!)
    .setDisplaySize(size, size)
    .setDepth(4);
}

function addFloorMark(scene: Phaser.Scene, x: number, y: number, size: number): void {
  scene.add.image(x, y, FLOOR_MARK_KEY)
    .setDisplaySize(size, size)
    .setDepth(5);
}

function addMonster(scene: Phaser.Scene, x: number, y: number, size: number): void {
  addFloor(scene, x, y, size, 1);
  scene.add.image(x, y, MONSTER_KEY)
    .setDisplaySize(size * 0.92, size * 0.92)
    .setDepth(5);
}

function addChest(scene: Phaser.Scene, x: number, y: number, size: number): void {
  addFloor(scene, x, y, size, 2);
  scene.add.image(x, y, CHEST_KEY)
    .setDisplaySize(size * 0.88, size * 0.88)
    .setDepth(5);
}

function addMiniLabel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  narrow: boolean,
  color = '#b8c2d4',
): void {
  scene.add.text(x, y, text, {
    fontFamily: 'monospace',
    fontSize: narrow ? '11px' : '13px',
    color,
    fontStyle: 'bold',
    align: 'center',
  }).setOrigin(0.5).setDepth(6);
}

function renderGoal(scene: Phaser.Scene, options: IllustrationOptions): number {
  const size = options.narrow ? 44 : 54;
  const gap = options.narrow ? 6 : 8;
  const total = size * 4 + gap * 3;
  const startX = options.x - total / 2 + size / 2;
  const y = options.topY + size / 2;
  addWall(scene, startX, y, size, 0);
  addFloor(scene, startX + size + gap, y, size, 1);
  addFloorMark(scene, startX + size + gap, y, size * 0.72);
  addMonster(scene, startX + (size + gap) * 2, y, size);
  addChest(scene, startX + (size + gap) * 3, y, size);
  return size;
}

function renderClues(scene: Phaser.Scene, options: IllustrationOptions): number {
  const size = options.narrow ? 34 : 42;
  const boardSize = size * 3;
  const boardLeft = options.x - boardSize / 2;
  const boardTop = options.topY + (options.narrow ? 24 : 28);

  const walls = new Set(['0,0', '1,0', '1,1', '2,2']);
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const x = boardLeft + col * size + size / 2;
      const y = boardTop + row * size + size / 2;
      if (walls.has(`${col},${row}`)) addWall(scene, x, y, size - 2, row + col);
      else {
        addFloor(scene, x, y, size - 2, row + col);
        addFloorMark(scene, x, y, size * 0.55);
      }
    }
  }

  scene.add.text(boardLeft + size * 1.5, boardTop - (options.narrow ? 15 : 18), '2', {
    fontFamily: 'monospace',
    fontSize: options.narrow ? '19px' : '23px',
    color: '#f0b14f',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(6);
  scene.add.text(boardLeft - (options.narrow ? 15 : 18), boardTop + size / 2, '2', {
    fontFamily: 'monospace',
    fontSize: options.narrow ? '19px' : '23px',
    color: '#f0b14f',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(6);

  return boardSize + (options.narrow ? 24 : 28);
}

function renderWallFloor(scene: Phaser.Scene, options: IllustrationOptions): number {
  const size = options.narrow ? 58 : 70;
  const gap = options.narrow ? 42 : 66;
  const leftX = options.x - size / 2 - gap / 2;
  const rightX = options.x + size / 2 + gap / 2;
  const tileY = options.topY + size / 2;
  addWall(scene, leftX, tileY, size, 0);
  addFloor(scene, rightX, tileY, size, 1);
  addFloorMark(scene, rightX, tileY, size * 0.68);
  const labelY = tileY + size / 2 + (options.narrow ? 14 : 17);
  addMiniLabel(scene, leftX, labelY, localize(options, 'СТЕНА', 'WALL'), options.narrow, '#f4ead7');
  addMiniLabel(scene, rightX, labelY, localize(options, 'ПОЛ', 'FLOOR'), options.narrow, '#f4ead7');
  return size + (options.narrow ? 28 : 34);
}

function renderTreasureRoom(scene: Phaser.Scene, options: IllustrationOptions): number {
  const size = options.narrow ? 25 : 31;
  const gridSize = size * 5;
  const left = options.x - gridSize / 2;
  const top = options.topY;
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const x = left + col * size + size / 2;
      const y = top + row * size + size / 2;
      const perimeter = row === 0 || row === 4 || col === 0 || col === 4;
      const entrance = row === 0 && col === 2;
      if (perimeter && !entrance) addWall(scene, x, y, size - 1, row + col);
      else addFloor(scene, x, y, size - 1, row + col);
    }
  }
  addChest(scene, left + size * 2.5, top + size * 2.5, size - 2);
  addMiniLabel(scene, options.x, top + gridSize + (options.narrow ? 13 : 16), localize(options, 'КОМНАТА 3×3', '3×3 ROOM'), options.narrow, '#f0bd63');
  return gridSize + (options.narrow ? 24 : 29);
}

function renderMonsterExample(scene: Phaser.Scene, cx: number, topY: number, size: number, correct: boolean): void {
  const left = cx - size * 1.5;
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const x = left + col * size + size / 2;
      const y = topY + row * size + size / 2;
      const center = row === 1 && col === 1;
      const exitRight = row === 1 && col === 2;
      const extraExitDown = !correct && row === 2 && col === 1;
      if (center) addMonster(scene, x, y, size - 1);
      else if (exitRight || extraExitDown) addFloor(scene, x, y, size - 1, row + col);
      else addWall(scene, x, y, size - 1, row + col);
    }
  }
}

function renderMonsters(scene: Phaser.Scene, options: IllustrationOptions): number {
  const size = options.narrow ? 25 : 30;
  const exampleWidth = size * 3;
  const gap = options.narrow ? 20 : 34;
  const leftCx = options.x - exampleWidth / 2 - gap / 2;
  const rightCx = options.x + exampleWidth / 2 + gap / 2;
  renderMonsterExample(scene, leftCx, options.topY, size, true);
  renderMonsterExample(scene, rightCx, options.topY, size, false);
  const labelY = options.topY + size * 3 + (options.narrow ? 13 : 16);
  addMiniLabel(scene, leftCx, labelY, localize(options, 'ПРАВИЛЬНО', 'CORRECT'), options.narrow, '#9fd6be');
  addMiniLabel(scene, rightCx, labelY, localize(options, 'НЕПРАВИЛЬНО', 'WRONG'), options.narrow, '#d99595');
  return size * 3 + (options.narrow ? 25 : 30);
}

function renderConnectivityPattern(
  scene: Phaser.Scene,
  cx: number,
  topY: number,
  size: number,
  disconnected: boolean,
): void {
  const left = cx - size * 2;
  const open = disconnected
    ? new Set(['0,1', '1,1', '3,0', '3,1'])
    : new Set(['0,1', '1,1', '2,1', '3,1', '3,0']);
  for (let row = 0; row < 2; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      const x = left + col * size + size / 2;
      const y = topY + row * size + size / 2;
      if (open.has(`${col},${row}`)) addFloor(scene, x, y, size - 1, row + col);
      else addWall(scene, x, y, size - 1, row + col);
    }
  }
}

function renderConnectivity(scene: Phaser.Scene, options: IllustrationOptions): number {
  const size = options.narrow ? 24 : 29;
  const exampleWidth = size * 4;
  const gap = options.narrow ? 16 : 28;
  const leftCx = options.x - exampleWidth / 2 - gap / 2;
  const rightCx = options.x + exampleWidth / 2 + gap / 2;
  renderConnectivityPattern(scene, leftCx, options.topY, size, false);
  renderConnectivityPattern(scene, rightCx, options.topY, size, true);
  const labelY = options.topY + size * 2 + (options.narrow ? 13 : 16);
  addMiniLabel(scene, leftCx, labelY, localize(options, 'СВЯЗАНО', 'CONNECTED'), options.narrow, '#9fd6be');
  addMiniLabel(scene, rightCx, labelY, localize(options, 'РАЗОРВАНО', 'SEPARATE'), options.narrow, '#d99595');
  return size * 2 + (options.narrow ? 25 : 30);
}

function renderOpen2x2(scene: Phaser.Scene, options: IllustrationOptions): number {
  const size = options.narrow ? 31 : 38;
  const exampleWidth = size * 2;
  const gap = options.narrow ? 30 : 46;
  const leftCx = options.x - exampleWidth / 2 - gap / 2;
  const rightCx = options.x + exampleWidth / 2 + gap / 2;

  for (const [cx, allowed] of [[leftCx, false], [rightCx, true]] as const) {
    const left = cx - size;
    for (let row = 0; row < 2; row += 1) {
      for (let col = 0; col < 2; col += 1) {
        const x = left + col * size + size / 2;
        const y = options.topY + row * size + size / 2;
        if (allowed && row === 0 && col === 1) addWall(scene, x, y, size - 1, row + col);
        else addFloor(scene, x, y, size - 1, row + col);
      }
    }
  }
  const labelY = options.topY + size * 2 + (options.narrow ? 13 : 16);
  addMiniLabel(scene, leftCx, labelY, localize(options, 'НЕЛЬЗЯ', 'NOT OK'), options.narrow, '#d99595');
  addMiniLabel(scene, rightCx, labelY, localize(options, 'МОЖНО', 'OK'), options.narrow, '#9fd6be');
  return size * 2 + (options.narrow ? 25 : 30);
}

function renderCompletion(scene: Phaser.Scene, options: IllustrationOptions): number {
  const size = options.narrow ? 37 : 45;
  const gap = 3;
  const states = ['wall', 'floor', 'wall', 'floor', 'wall'] as const;
  const total = states.length * size + gap * (states.length - 1);
  const startX = options.x - total / 2 + size / 2;
  const y = options.topY + size / 2;
  states.forEach((state, index) => {
    const x = startX + index * (size + gap);
    if (state === 'wall') addWall(scene, x, y, size, index);
    else addFloor(scene, x, y, size, index);
  });
  return size;
}

function renderControls(scene: Phaser.Scene, options: IllustrationOptions): number {
  const iconSize = options.narrow ? 23 : 27;
  const cellSize = options.narrow ? 42 : 50;
  const gap = options.narrow ? 12 : 18;
  const items = options.language === 'ru'
    ? [
        { key: 'board-wall-01', label: 'СТЕНА' },
        { key: FLOOR_MARK_KEY, label: 'ПОЛ' },
        { key: 'ui-icon-undo', label: 'ОТМЕНА' },
        { key: 'ui-icon-reset', label: 'СБРОС' },
        { key: 'ui-icon-hint', label: 'ПОДСКАЗКА' },
      ] as const
    : [
        { key: 'board-wall-01', label: 'WALL' },
        { key: FLOOR_MARK_KEY, label: 'FLOOR' },
        { key: 'ui-icon-undo', label: 'UNDO' },
        { key: 'ui-icon-reset', label: 'RESET' },
        { key: 'ui-icon-hint', label: 'HINT' },
      ] as const;
  const itemWidth = options.narrow ? 54 : 70;
  const total = items.length * itemWidth + gap * (items.length - 1);
  const startX = options.x - total / 2 + itemWidth / 2;
  items.forEach((item, index) => {
    const x = startX + index * (itemWidth + gap);
    const g = scene.add.graphics().setDepth(2);
    g.fillStyle(0x162541, 0.96);
    g.fillRoundedRect(x - itemWidth / 2, options.topY, itemWidth, cellSize, 7);
    g.lineStyle(1, 0x4b6386, 0.8);
    g.strokeRoundedRect(x - itemWidth / 2, options.topY, itemWidth, cellSize, 7);
    const image = scene.add.image(x, options.topY + cellSize / 2, item.key)
      .setDisplaySize(iconSize, iconSize)
      .setDepth(4);
    if (item.key.startsWith('ui-icon-')) image.setTint(0xf4ead7);
    addMiniLabel(scene, x, options.topY + cellSize + (options.narrow ? 12 : 14), item.label, options.narrow, '#b8c2d4');
  });
  return cellSize + (options.narrow ? 24 : 28);
}

function renderFeedback(scene: Phaser.Scene, options: IllustrationOptions): number {
  const size = options.narrow ? 44 : 52;
  const gap = 5;
  const y = options.topY + size / 2;
  const leftX = options.x - size - gap;
  const rightX = options.x + gap;
  addWall(scene, leftX, y, size, 0).setTint(0xb85d63);
  addWall(scene, rightX, y, size, 1).setTint(0xb85d63);
  scene.add.text(leftX - size * 0.72, y, '1', {
    fontFamily: 'monospace',
    fontSize: options.narrow ? '20px' : '24px',
    color: '#c96568',
    fontStyle: 'bold',
  }).setOrigin(0.5).setDepth(6);
  return size;
}

export function renderHelpIllustration(
  scene: Phaser.Scene,
  id: HelpIllustrationId,
  options: IllustrationOptions,
): number {
  switch (id) {
    case 'goal': return renderGoal(scene, options);
    case 'clues': return renderClues(scene, options);
    case 'floor': return renderWallFloor(scene, options);
    case 'treasure-room': return renderTreasureRoom(scene, options);
    case 'monsters': return renderMonsters(scene, options);
    case 'connectivity': return renderConnectivity(scene, options);
    case 'open-2x2': return renderOpen2x2(scene, options);
    case 'completion': return renderCompletion(scene, options);
    case 'controls': return renderControls(scene, options);
    case 'feedback': return renderFeedback(scene, options);
  }
  const exhaustive: never = id;
  return exhaustive;
}
