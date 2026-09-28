import type { GameLaunchContext } from '../campaign/types';

export function usesRunTimer(mode: GameLaunchContext['mode']): boolean {
  return mode === 'daily' || mode === 'endless';
}
