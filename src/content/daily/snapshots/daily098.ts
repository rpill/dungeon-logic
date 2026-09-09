import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-098",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    0,
    2,
    3,
    5,
    3,
    4
  ],
  "columnClues": [
    4,
    3,
    3,
    2,
    3,
    3,
    2
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 1,
      "y": 5
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...##.#",
    ".......",
    "...#.#.",
    "###....",
    "###.##.",
    "#...##.",
    "###...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3796552925,
  "sourceCandidateId": "generated-mixed-one-room-7-3796552925",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
