import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-320",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    1,
    3,
    5,
    3,
    2,
    3
  ],
  "columnClues": [
    4,
    3,
    2,
    2,
    3,
    2,
    4
  ],
  "monsters": [
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 4,
      "y": 3
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 3,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 4,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 2,
      "y": 2
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...##.",
    "#......",
    "#...#.#",
    "####..#",
    ".##.#..",
    ".#....#",
    "...#.##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 72027662,
  "sourceCandidateId": "generated-mixed-one-room-7-72027662",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 59
};
