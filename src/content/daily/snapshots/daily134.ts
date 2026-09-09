import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-134",
  "width": 7,
  "height": 7,
  "rowClues": [
    1,
    1,
    1,
    6,
    4,
    3,
    6
  ],
  "columnClues": [
    4,
    4,
    2,
    4,
    3,
    2,
    3
  ],
  "monsters": [
    {
      "x": 2,
      "y": 4
    },
    {
      "x": 6,
      "y": 4
    },
    {
      "x": 3,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 0,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...#...",
    ".....#.",
    "...#...",
    "#####.#",
    "##.##..",
    "##....#",
    "###.###"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2968286234,
  "sourceCandidateId": "generated-mixed-one-room-7-2968286234",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 32,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 34
};
