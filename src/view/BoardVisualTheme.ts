export type BoardThemeTextureKey =
  | 'oryx-terrain'
  | 'oryx-heroes-simple'
  | 'oryx-items'
  | 'graveyard-floor'
  | 'graveyard-wall-a'
  | 'graveyard-wall-b'
  | 'graveyard-wall-c'
  | 'graveyard-clue-tile'
  | 'graveyard-clue-corner'
  | 'graveyard-floor-mark'
  | 'graveyard-border-top'
  | 'graveyard-border-left'
  | 'graveyard-border-right'
  | 'graveyard-border-bottom';

export interface SpriteFrameRef {
  readonly textureKey: BoardThemeTextureKey;
  readonly frame: number;
}

export interface BoardVisualTheme {
  readonly id: string;
  readonly board: {
    /** Base material for Unknown and Floor-marked cells. */
    readonly floor: SpriteFrameRef;
    /** One logical cell = one wall sprite. Variants may only alter surface detail. */
    readonly wallFrames: readonly SpriteFrameRef[];
    /** Backing material for row/column clue cells. */
    readonly clueTile: SpriteFrameRef;
    /** Optional dedicated tile for the empty top-left clue corner. */
    readonly clueCorner?: SpriteFrameRef;
    /** Treasure-room floor remains visually neutral until explicitly revealed by gameplay. */
    readonly roomFloor: SpriteFrameRef;
    /** Optional graphic floor mark; themes without one fall back to the text marker. */
    readonly floorMark?: SpriteFrameRef;
    /** Optional decorative frame drawn inside the outer edge of the board+clue rectangle. */
    readonly border?: {
      readonly top: SpriteFrameRef;
      readonly left: SpriteFrameRef;
      readonly right: SpriteFrameRef;
      readonly bottom: SpriteFrameRef;
    };
  };
  readonly entities: {
    readonly monsterFrames: readonly SpriteFrameRef[];
    readonly chest: SpriteFrameRef;
  };
  readonly decoration: {
    readonly propFrames: readonly SpriteFrameRef[];
  };
}

const FRAME_LIMITS: Readonly<Record<BoardThemeTextureKey, number>> = {
  'oryx-terrain': 760,
  'oryx-heroes-simple': 130,
  'oryx-items': 484,
  'graveyard-floor': 1,
  'graveyard-wall-a': 1,
  'graveyard-wall-b': 1,
  'graveyard-wall-c': 1,
  'graveyard-clue-tile': 1,
  'graveyard-clue-corner': 1,
  'graveyard-floor-mark': 1,
  'graveyard-border-top': 1,
  'graveyard-border-left': 1,
  'graveyard-border-right': 1,
  'graveyard-border-bottom': 1,
};

function validateFrameRef(ref: SpriteFrameRef, label: string): void {
  const limit = FRAME_LIMITS[ref.textureKey];
  if (!Number.isInteger(ref.frame) || ref.frame < 0 || ref.frame >= limit) {
    throw new Error(
      `Invalid ${label} frame ${ref.frame} for ${ref.textureKey}; expected 0..${limit - 1}.`,
    );
  }
}

export function validateBoardVisualTheme(theme: BoardVisualTheme): void {
  if (theme.id.trim().length === 0) {
    throw new Error('Board visual theme id must be non-empty.');
  }

  validateFrameRef(theme.board.floor, 'board.floor');
  if (theme.board.wallFrames.length === 0) {
    throw new Error(`Board visual theme ${theme.id} must define at least one wall frame.`);
  }
  theme.board.wallFrames.forEach((ref, index) => {
    validateFrameRef(ref, `board.wallFrames[${index}]`);
  });
  validateFrameRef(theme.board.clueTile, 'board.clueTile');
  if (theme.board.clueCorner !== undefined) {
    validateFrameRef(theme.board.clueCorner, 'board.clueCorner');
  }
  validateFrameRef(theme.board.roomFloor, 'board.roomFloor');
  if (theme.board.floorMark !== undefined) {
    validateFrameRef(theme.board.floorMark, 'board.floorMark');
  }
  if (theme.board.border !== undefined) {
    validateFrameRef(theme.board.border.top, 'board.border.top');
    validateFrameRef(theme.board.border.left, 'board.border.left');
    validateFrameRef(theme.board.border.right, 'board.border.right');
    validateFrameRef(theme.board.border.bottom, 'board.border.bottom');
  }

  if (theme.entities.monsterFrames.length === 0) {
    throw new Error(`Board visual theme ${theme.id} must define at least one Monster frame.`);
  }

  theme.entities.monsterFrames.forEach((ref, index) => {
    validateFrameRef(ref, `entities.monsterFrames[${index}]`);
  });
  validateFrameRef(theme.entities.chest, 'entities.chest');
  theme.decoration.propFrames.forEach((ref, index) => {
    validateFrameRef(ref, `decoration.propFrames[${index}]`);
  });
}
