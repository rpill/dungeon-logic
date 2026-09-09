import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-290",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    3,
    4,
    3,
    1,
    3
  ],
  "columnClues": [
    2,
    4,
    3,
    0,
    2,
    4,
    6
  ],
  "monsters": [
    {
      "x": 0,
      "y": 1
    },
    {
      "x": 6,
      "y": 5
    },
    {
      "x": 0,
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
    ".#...##",
    ".#...##",
    "..#.###",
    "#.#...#",
    "....#..",
    ".##...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2941387039,
  "sourceCandidateId": "generated-mixed-one-room-7-2941387039",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 58
};
