import {
  DAILY_RELEASE_DATE_KEYS,
  DAILY_RELEASE_END_DATE_KEY,
  DAILY_RELEASE_START_DATE_KEY,
} from './calendar';
import { curatedDailySnapshots } from './snapshots';
import type { DailyEntry } from './types';

if (DAILY_RELEASE_DATE_KEYS.length !== curatedDailySnapshots.length) {
  throw new Error(
    `Daily release calendar has ${DAILY_RELEASE_DATE_KEYS.length} dates for ${curatedDailySnapshots.length} curated snapshots.`,
  );
}

export { DAILY_RELEASE_DATE_KEYS, DAILY_RELEASE_END_DATE_KEY, DAILY_RELEASE_START_DATE_KEY };

/**
 * Immutable v1 Daily release calendar.
 *
 * Every curated snapshot is bound to exactly one trusted UTC date. Runtime
 * Daily selection only reads this static mapping; it never generates puzzles
 * on the player's device.
 */
export const DAILY_RELEASE_ENTRIES: readonly DailyEntry[] = curatedDailySnapshots.map(
  (snapshot, index): DailyEntry => ({
    id: snapshot.id,
    dateKey: DAILY_RELEASE_DATE_KEYS[index],
    level: snapshot.level,
  }),
);
