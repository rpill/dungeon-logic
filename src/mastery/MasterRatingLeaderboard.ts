import { getMasterySnapshot } from './MasteryProgress';
import type { LeaderboardsPort, LeaderboardSubmitResult } from '../platform/services';
import type { PlayerProfile } from '../profile/types';

export const MASTER_RATING_LEADERBOARD_NAME = 'masterrating' as const;

export type MasterRatingSyncResult = LeaderboardSubmitResult | 'locked';

export async function syncMasterRatingLeaderboard(
  profile: PlayerProfile,
  leaderboards: LeaderboardsPort,
): Promise<MasterRatingSyncResult> {
  if (getMasterySnapshot(profile).currentRank !== 'MASTER') return 'locked';
  if (!await leaderboards.isAuthorized()) return 'unauthorized';
  return leaderboards.submitScore(
    MASTER_RATING_LEADERBOARD_NAME,
    Math.max(0, Math.floor(profile.mastery.rating)),
    JSON.stringify({ rating: Math.max(0, Math.floor(profile.mastery.rating)) }),
  );
}
