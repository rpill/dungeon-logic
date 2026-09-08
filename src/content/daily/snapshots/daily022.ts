import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-022",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    4,
    3,
    3,
    1,
    3
  ],
  "columnClues": [
    6,
    3,
    2,
    0,
    3,
    4,
    4
  ],
  "monsters": [
    {
      "x": 1,
      "y": 3
    },
    {
      "x": 6,
      "y": 3
    },
    {
      "x": 0,
      "y": 5
    },
    {
      "x": 6,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##...##",
    "##...##",
    "##...##",
    "#.#.#..",
    "#...#.#",
    "..#....",
    "#...##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3979842936,
  "sourceCandidateId": "generated-mixed-one-room-7-3979842936",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};
