import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-209",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    3,
    4,
    2,
    3,
    4
  ],
  "columnClues": [
    3,
    1,
    4,
    3,
    1,
    3,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
      "y": 3
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
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
      "x": 5,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".##...#",
    "......#",
    "#.#...#",
    "#..###.",
    "..##...",
    "#....##",
    "..##.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3346700851,
  "sourceCandidateId": "generated-mixed-one-room-7-3346700851",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 43,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 40
};
