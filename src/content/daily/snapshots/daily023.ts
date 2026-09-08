import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-023",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    1,
    5,
    1,
    5,
    4
  ],
  "columnClues": [
    4,
    1,
    2,
    3,
    3,
    5,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 0,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    ".....##",
    "...#...",
    "####.#.",
    "#......",
    "#.#.###",
    "#...###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 860051705,
  "sourceCandidateId": "generated-chest-one-room-7-860051705",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 54
};
