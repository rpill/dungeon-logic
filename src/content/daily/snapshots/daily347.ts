import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-347",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    3,
    4,
    1,
    4,
    3
  ],
  "columnClues": [
    3,
    4,
    1,
    3,
    1,
    4,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 2,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 4,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#...##",
    ".....##",
    ".#...##",
    "..###.#",
    "#......",
    "##.#.#.",
    "##.#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1145033153,
  "sourceCandidateId": "generated-mixed-one-room-7-1145033153",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
