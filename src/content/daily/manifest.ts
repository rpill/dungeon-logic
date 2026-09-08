import {
  level001,
  level002,
  level003,
  level004,
  level005,
} from '../../data/levels';
import type { DailyEntry } from './types';

/**
 * Temporary development fixtures only.
 *
 * The release build must replace this tiny fixture set with the separately
 * curated pool of prevalidated Daily snapshots. Runtime Daily selection must
 * never invoke the puzzle generator on the player's device.
 */
export const DAILY_FIXTURE_ENTRIES: readonly DailyEntry[] = [
  {
    id: 'daily-fixture-2099-01-01',
    dateKey: '2099-01-01',
    level: level001,
  },
  {
    id: 'daily-fixture-2099-01-02',
    dateKey: '2099-01-02',
    level: level002,
  },
  {
    id: 'daily-fixture-2099-01-03',
    dateKey: '2099-01-03',
    level: level003,
  },
  {
    id: 'daily-fixture-2099-01-04',
    dateKey: '2099-01-04',
    level: level004,
  },
  {
    id: 'daily-fixture-2099-01-05',
    dateKey: '2099-01-05',
    level: level005,
  },
] as const;
