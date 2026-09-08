import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-027",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    1,
    3,
    4,
    1,
    4,
    6
  ],
  "columnClues": [
    2,
    3,
    2,
    5,
    1,
    4,
    4
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 2,
      "y": 5
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 1,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...##..",
    "......#",
    "...#.##",
    "####...",
    ".....#.",
    ".#.#.##",
    "####.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1613757372,
  "sourceCandidateId": "generated-mixed-one-room-7-1613757372",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
