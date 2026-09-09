import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-212",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    1,
    3,
    3,
    3,
    4,
    4
  ],
  "columnClues": [
    3,
    4,
    5,
    3,
    0,
    2,
    3
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    ".#.#...",
    ".....#.",
    "#.##...",
    "..##.#.",
    ".##...#",
    "###...#",
    "###...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2993133117,
  "sourceCandidateId": "generated-mixed-one-room-7-2993133117",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 46
};
