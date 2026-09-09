import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-194",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    3,
    3,
    2,
    1
  ],
  "columnClues": [
    5,
    3,
    0,
    2,
    3,
    5,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "#...###",
    "#...##.",
    "##.#...",
    "##...#.",
    "...#.#.",
    ".#....."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2350236383,
  "sourceCandidateId": "generated-mixed-one-room-7-2350236383",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};
