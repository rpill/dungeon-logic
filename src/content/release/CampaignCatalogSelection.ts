import { getCampaignCurationRule } from '../campaign/curationPlan';
import { getGeneratorMonsterPolicy } from '../../puzzle/generator/CandidateFactory';
import { candidateDistance, scoreCandidate } from '../../puzzle/generator/CandidateRanker';
import { HumanRule, type HumanSolveResult } from '../../puzzle/human-solver/types';
import type { AcceptedCandidate } from '../../puzzle/generator/types';
import {
  CAMPAIGN_RELEASE_TARGET_SCORES,
  campaignReleaseStructuralFingerprint,
} from './CampaignReleaseSelection';

export interface CampaignCatalogCandidate {
  readonly accepted: AcceptedCandidate;
  readonly humanRuleCounts: HumanSolveResult['ruleCounts'];
}

export interface CampaignCatalogSelectionEntry {
  readonly slot: number;
  readonly targetScore: number;
  readonly candidate: CampaignCatalogCandidate;
  readonly difficultyDelta: number;
  readonly interestScore: number;
  readonly sequenceScore: number;
}

const ADVANCED_RULES = [
  HumanRule.TreasureRoomInterior,
  HumanRule.TreasureRoomEntrance,
  HumanRule.MonsterDeadEnd,
  HumanRule.HallwayNotDeadEnd,
  HumanRule.Open2x2,
  HumanRule.Connectivity,
] as const;

export function selectCampaignCatalogSlots(
  reservoir: readonly CampaignCatalogCandidate[],
  slots: readonly number[] = Array.from({ length: 57 }, (_, index) => index + 8),
): readonly CampaignCatalogSelectionEntry[] {
  const selected: CampaignCatalogSelectionEntry[] = [];
  const usedIds = new Set<string>();
  const usedFingerprints = new Set<string>();

  for (const slot of slots) {
    const targetScore = CAMPAIGN_RELEASE_TARGET_SCORES[slot];
    if (targetScore === undefined) throw new Error(`No campaign target score for slot ${slot}.`);
    const rule = getCampaignCurationRule(slot);

    const eligible = reservoir
      .filter(({ accepted }) => !usedIds.has(accepted.candidate.id))
      .filter(({ accepted }) => !usedFingerprints.has(campaignReleaseStructuralFingerprint(accepted.candidate.level.solution)))
      .filter(({ accepted }) => !getGeneratorMonsterPolicy(accepted.candidate).reject)
      .filter(({ accepted }) => {
        const difficulty = accepted.difficulty.band;
        return difficulty !== 'unrated'
          && rule.allowedArchetypes.includes(accepted.candidate.archetype)
          && rule.allowedDifficulties.includes(difficulty)
          && rule.allowedSizes.includes(accepted.candidate.size);
      });

    if (eligible.length === 0) throw new Error(`No catalog candidates for campaign slot ${slot}.`);

    const bestDelta = Math.min(...eligible.map(({ accepted }) => Math.abs((accepted.difficulty.score ?? 100) - targetScore)));
    if (bestDelta > 1) {
      throw new Error(`Campaign catalog cannot satisfy slot ${slot}: nearest score is ${bestDelta} from ${targetScore}.`);
    }
    let candidates = eligible.filter(({ accepted }) => Math.abs((accepted.difficulty.score ?? 100) - targetScore) === bestDelta);

    const previousThree = selected.slice(-3).map((entry) => entry.candidate.accepted);
    if (
      previousThree.length === 3
      && previousThree.every((candidate) => candidate.candidate.archetype === previousThree[0].candidate.archetype)
    ) {
      const alternatives = candidates.filter(({ accepted }) => accepted.candidate.archetype !== previousThree[0].candidate.archetype);
      if (alternatives.length > 0) candidates = alternatives;
    }

    const rowStart = Math.floor((slot - 1) / 8) * 8 + 1;
    const currentRow = selected.filter((entry) => entry.slot >= rowStart);
    const ranked = [...candidates].sort((left, right) => {
      const leftScore = campaignSequenceScore(left, selected, currentRow);
      const rightScore = campaignSequenceScore(right, selected, currentRow);
      return rightScore - leftScore
        || campaignInterestScore(right) - campaignInterestScore(left)
        || compareText(left.accepted.candidate.id, right.accepted.candidate.id)
        || left.accepted.candidate.seed - right.accepted.candidate.seed;
    });

    const picked = ranked[0];
    const fingerprint = campaignReleaseStructuralFingerprint(picked.accepted.candidate.level.solution);
    usedIds.add(picked.accepted.candidate.id);
    usedFingerprints.add(fingerprint);
    selected.push({
      slot,
      targetScore,
      candidate: picked,
      difficultyDelta: bestDelta,
      interestScore: campaignInterestScore(picked),
      sequenceScore: campaignSequenceScore(picked, selected, currentRow),
    });
  }

  return selected;
}

export function campaignInterestScore(candidate: CampaignCatalogCandidate): number {
  const accepted = candidate.accepted;
  const activeAdvanced = ADVANCED_RULES.filter((rule) => candidate.humanRuleCounts[rule] > 0).length;
  const advancedStepVariety = ADVANCED_RULES.reduce(
    (sum, rule) => sum + Math.min(3, candidate.humanRuleCounts[rule]),
    0,
  );
  const objectAssistance = Math.min(8, accepted.quality.metrics.objectAssistedForcedWallCount);
  const mixedBonus = accepted.candidate.archetype === 'mixed-one-room' ? 3 : 0;
  const chestBonus = accepted.candidate.archetype === 'chest-one-room' ? 2 : 0;

  return round(
    scoreCandidate(accepted)
      + activeAdvanced * 4
      + advancedStepVariety * 0.75
      + objectAssistance * 0.45
      + accepted.difficulty.components.advancedRuleLoad * 8
      + mixedBonus
      + chestBonus,
  );
}

function campaignSequenceScore(
  candidate: CampaignCatalogCandidate,
  selected: readonly CampaignCatalogSelectionEntry[],
  currentRow: readonly CampaignCatalogSelectionEntry[],
): number {
  const accepted = candidate.accepted;
  const previous = selected.at(-1)?.candidate.accepted ?? null;
  const recent = selected.slice(-3);
  const rowArchetypes = new Set(currentRow.map((entry) => entry.candidate.accepted.candidate.archetype));
  const rowSizes = new Set(currentRow.map((entry) => entry.candidate.accepted.candidate.size));
  const rowRules = new Set(
    currentRow.flatMap((entry) => activeAdvancedRules(entry.candidate)),
  );
  const activeRules = activeAdvancedRules(candidate);
  const newRuleCount = activeRules.filter((rule) => !rowRules.has(rule)).length;

  let score = campaignInterestScore(candidate);
  if (!rowArchetypes.has(accepted.candidate.archetype)) score += 8;
  if (!rowSizes.has(accepted.candidate.size)) score += 5;
  score += newRuleCount * 4;

  if (previous !== null) {
    score += candidateDistance(accepted, previous) * 24;
    if (accepted.candidate.archetype === previous.candidate.archetype) score -= 4;
    if (accepted.candidate.size === previous.candidate.size) score -= 2;
  }

  const sameArchetypeRecent = recent.filter(
    (entry) => entry.candidate.accepted.candidate.archetype === accepted.candidate.archetype,
  ).length;
  score -= sameArchetypeRecent * 3;

  const signature = activeRules.join('|');
  if (recent.some((entry) => activeAdvancedRules(entry.candidate).join('|') === signature)) score -= 4;

  return round(score);
}

function activeAdvancedRules(candidate: CampaignCatalogCandidate): string[] {
  return ADVANCED_RULES.filter((rule) => candidate.humanRuleCounts[rule] > 0);
}

function compareText(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function round(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}
