export type MonsterSkinId = 'monster_pink' | 'ghost';

export const MONSTER_VISUAL_POOLS: Readonly<Record<number, readonly MonsterSkinId[]>> = {
  1: ['monster_pink', 'ghost'],
};

const MONSTER_VISUAL_VERSION_BY_LEVEL: Readonly<Record<string, number>> = {};

export function getMonsterVisualVersion(levelId: string): number {
  return MONSTER_VISUAL_VERSION_BY_LEVEL[levelId] ?? 1;
}

function hashMonsterCell(levelId: string, x: number, y: number): number {
  let hash = 2_166_136_261;
  const value = `${levelId}:${x}:${y}`;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16_777_619);
  }
  return hash >>> 0;
}

export function resolveMonsterSkin(
  levelId: string,
  x: number,
  y: number,
  version = getMonsterVisualVersion(levelId),
): MonsterSkinId {
  const pool = MONSTER_VISUAL_POOLS[version] ?? MONSTER_VISUAL_POOLS[1]!;
  return pool[hashMonsterCell(levelId, x, y) % pool.length]!;
}
