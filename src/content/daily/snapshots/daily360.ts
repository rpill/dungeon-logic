import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-360",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    3,
    3,
    3,
    1,
    4
  ],
  "columnClues": [
    4,
    1,
    2,
    2,
    4,
    3,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 0,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "#.#....",
    "#...##.",
    "###....",
    "...##.#",
    "......#",
    "...####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2584382247,
  "sourceCandidateId": "generated-chest-one-room-7-2584382247",
  "sourceArchetype": "chest-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 32
};
