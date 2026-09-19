import type { CampaignRowUnlockTransition } from '../campaign/types';

/**
 * Scene-local one-shot gate for campaign row unlock presentation.
 *
 * Phaser scene instances survive shutdown/start cycles, while scene data may be
 * supplied again on a later start/restart. The unlock animation is presentation
 * state, not persistent campaign state, so each next-row transition must only be
 * consumed once per live LevelSelectScene instance.
 */
export class CampaignRowUnlockGate {
  private lastConsumedNextRowStartSlot: number | null = null;

  consume(
    transition: CampaignRowUnlockTransition | null | undefined,
  ): CampaignRowUnlockTransition | null {
    if (transition === null || transition === undefined) return null;
    if (transition.nextRowStartSlot === this.lastConsumedNextRowStartSlot) return null;

    this.lastConsumedNextRowStartSlot = transition.nextRowStartSlot;
    return transition;
  }
}
