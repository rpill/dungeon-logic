import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-149",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    3,
    6,
    3,
    1,
    4
  ],
  "columnClues": [
    2,
    2,
    5,
    2,
    2,
    3,
    5
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 3,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#...#",
    "......#",
    ".##...#",
    ".######",
    "..#.##.",
    "#......",
    "..##.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1884369869,
  "sourceCandidateId": "generated-mixed-one-room-7-1884369869",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 63,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
