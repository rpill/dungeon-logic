import type {
  GridPosition,
} from '../types';

import {
  SearchCellState,
} from '../solver/types';

export const HumanSolveStatus = {
  SolvedDirect: 'solved-direct',
  SolvedWithContradiction:
    'solved-with-contradiction',
  Stuck: 'stuck',
  Invalid: 'invalid',
} as const;

export type HumanSolveStatus =
  typeof HumanSolveStatus[
    keyof typeof HumanSolveStatus
  ];

export const HumanDeductionTier = {
  Direct: 'direct',
  Contradiction: 'contradiction',
} as const;

export type HumanDeductionTier =
  typeof HumanDeductionTier[
    keyof typeof HumanDeductionTier
  ];

export const HumanRule = {
  LineComplete: 'line-complete',
  LineFill: 'line-fill',
  Door: 'door',
  TreasureRoomInterior:
    'treasure-room-interior',
  TreasureRoomEntrance:
    'treasure-room-entrance',
  TreasureRoomVariant:
    'treasure-room-variant',
  TreasureRoomStructuralConsensus:
    'treasure-room-structural-consensus',
  TreasureRoomHypothesisConsequence:
    'treasure-room-hypothesis-consequence',
  MonsterDeadEnd: 'monster-dead-end',
  HallwayNotDeadEnd:
    'hallway-not-dead-end',
  Open2x2: 'open-2x2',
  Connectivity: 'connectivity',
  Contradiction: 'contradiction',
} as const;

export type HumanRule =
  typeof HumanRule[
    keyof typeof HumanRule
  ];

export type HumanLineKind = 'row' | 'column';

export type DirectHumanRule =
  Exclude<
    HumanRule,
    | typeof HumanRule.Contradiction
    | typeof HumanRule.TreasureRoomVariant
    | typeof HumanRule.TreasureRoomStructuralConsensus
    | typeof HumanRule.TreasureRoomHypothesisConsequence
  >;

export interface HumanAssignment {
  position: GridPosition;
  value:
    | typeof SearchCellState.Wall
    | typeof SearchCellState.Open;
}

export interface HumanProofStep {
  rule: DirectHumanRule;
  /** Present for row/column clue deductions so UI explanations can name the visible axis. */
  lineKind?: HumanLineKind;
  assignments:
    readonly HumanAssignment[];
  explanation: string;
}

export interface HumanContradictionProof {
  assumption: HumanAssignment;
  deductions:
    readonly HumanProofStep[];
  contradiction: string;
}

export interface HumanSolveStep {
  index: number;
  /** Present when this step comes directly from a row/column clue. */
  lineKind?: HumanLineKind;
  tier: HumanDeductionTier;
  rule: HumanRule;
  assignments:
    readonly HumanAssignment[];
  explanation: string;
  proof:
    HumanContradictionProof | null;
}

export interface HumanSolveResult {
  status: HumanSolveStatus;
  directSteps: number;
  contradictionSteps: number;
  assignments: number;
  unknownRemaining: number;
  ruleCounts:
    Readonly<
      Record<
        HumanRule,
        number
      >
    >;
  steps: readonly HumanSolveStep[];
}

export function createEmptyHumanRuleCounts():
  Record<HumanRule, number> {
  return {
    [HumanRule.LineComplete]: 0,
    [HumanRule.LineFill]: 0,
    [HumanRule.Door]: 0,
    [HumanRule.TreasureRoomInterior]: 0,
    [HumanRule.TreasureRoomEntrance]: 0,
    [HumanRule.TreasureRoomVariant]: 0,
    [HumanRule.TreasureRoomStructuralConsensus]: 0,
    [HumanRule.TreasureRoomHypothesisConsequence]: 0,
    [HumanRule.MonsterDeadEnd]: 0,
    [HumanRule.HallwayNotDeadEnd]: 0,
    [HumanRule.Open2x2]: 0,
    [HumanRule.Connectivity]: 0,
    [HumanRule.Contradiction]: 0,
  };
}
