import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-365",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    1,
    2,
    4,
    5,
    5,
    5
  ],
  "columnClues": [
    5,
    2,
    4,
    2,
    3,
    4,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 1,
      "y": 4
    },
    {
      "x": 4,
      "y": 5
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..##...",
    "#......",
    "..##...",
    "#...###",
    "#.#.###",
    "###..##",
    "##..###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 393668746,
  "sourceCandidateId": "generated-mixed-one-room-7-393668746",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 31
};
