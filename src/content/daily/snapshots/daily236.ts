import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-236",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    3,
    1,
    3,
    5,
    3,
    1
  ],
  "columnClues": [
    2,
    1,
    4,
    2,
    3,
    3,
    5
  ],
  "monsters": [
    {
      "x": 2,
      "y": 0
    },
    {
      "x": 0,
      "y": 4
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
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    ".##...#",
    "......#",
    "#.#...#",
    "..#####",
    "#...##.",
    "..#...."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2133532624,
  "sourceCandidateId": "generated-mixed-one-room-7-2133532624",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 60,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 60
};
