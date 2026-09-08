import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-047",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    1,
    3,
    3,
    5,
    2,
    5
  ],
  "columnClues": [
    4,
    0,
    4,
    3,
    3,
    3,
    4
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 0,
      "y": 3
    },
    {
      "x": 5,
      "y": 5
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 5,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "..##...",
    "#......",
    "#.##...",
    "....###",
    "#.#.###",
    "#.....#",
    "..#####"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3160720178,
  "sourceCandidateId": "generated-mixed-one-room-7-3160720178",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 30,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 35
};
