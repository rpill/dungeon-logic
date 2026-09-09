import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-224",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    2,
    3,
    4,
    3,
    3,
    3
  ],
  "columnClues": [
    3,
    1,
    2,
    6,
    5,
    2,
    2
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 5,
      "y": 1
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 4,
      "y": 4
    },
    {
      "x": 6,
      "y": 5
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
    "...###.",
    "...##..",
    "...###.",
    "#.###..",
    "..##..#",
    "#..##..",
    "##....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2622162240,
  "sourceCandidateId": "generated-mixed-one-room-7-2622162240",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 36
};
