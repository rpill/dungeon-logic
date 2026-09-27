import type { LeaderboardsPort } from '../platform/services';
import type { PlayerProfileService } from './PlayerProfileService';

export async function isProfileAuthorizationReady(
  profileService: PlayerProfileService,
  leaderboards: LeaderboardsPort,
): Promise<boolean> {
  return (await leaderboards.isAuthorized()) && !profileService.hasPendingPlatformAccountTransition();
}

export async function requestAuthorizationWithProfileMerge(
  profileService: PlayerProfileService,
  leaderboards: LeaderboardsPort,
): Promise<boolean> {
  const alreadyAuthorized = await leaderboards.isAuthorized();
  if (alreadyAuthorized) {
    if (!profileService.hasPendingPlatformAccountTransition()) return true;
    try {
      await profileService.completePlatformAccountTransition();
      return true;
    } catch (error) {
      console.warn('[Dungeon Logic] Could not finish pending account profile merge.', error);
      return false;
    }
  }

  await profileService.beginPlatformAccountTransition();
  let authorized = false;
  try {
    authorized = await leaderboards.requestAuthorization();
  } catch (error) {
    console.warn('[Dungeon Logic] Authorization state could not be refreshed safely; keeping account writes guarded.', error);
    return false;
  }
  if (!authorized) {
    profileService.cancelPlatformAccountTransition();
    return false;
  }

  try {
    await profileService.completePlatformAccountTransition();
    return true;
  } catch (error) {
    console.warn('[Dungeon Logic] Authorization succeeded, but the account profile could not be loaded safely.', error);
    return false;
  }
}
