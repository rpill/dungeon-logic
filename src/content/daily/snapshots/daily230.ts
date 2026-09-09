import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-230",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    2,
    3,
    3,
    3,
    3,
    4
  ],
  "columnClues": [
    4,
    5,
    3,
    0,
    2,
    3,
    3
  ],
  "monsters": [
    {
      "x": 1,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 6,
      "y": 5
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#.#....",
    "....#.#",
    ".##...#",
    ".##.#..",
    "##...#.",
    "##...#.",
    "##...##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2624585772,
  "sourceCandidateId": "generated-mixed-one-room-7-2624585772",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};
