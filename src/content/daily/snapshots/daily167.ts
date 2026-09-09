import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-167",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    4,
    2,
    2,
    3
  ],
  "columnClues": [
    3,
    4,
    3,
    0,
    2,
    5,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 5,
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
    "##...##",
    "##...##",
    ".#...##",
    "..#.###",
    "#.#....",
    "....##.",
    ".##...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 4056634242,
  "sourceCandidateId": "generated-mixed-one-room-7-4056634242",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 62,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
