import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-034",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    3,
    4,
    3,
    2,
    2
  ],
  "columnClues": [
    6,
    4,
    2,
    0,
    3,
    5,
    1
  ],
  "monsters": [
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 5,
      "y": 3
    },
    {
      "x": 0,
      "y": 6
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
    "##...#.",
    "##...#.",
    "###.#..",
    "#...##.",
    "#.#....",
    "....##."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4285378288,
  "sourceCandidateId": "generated-mixed-one-room-7-4285378288",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 31,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 38
};
