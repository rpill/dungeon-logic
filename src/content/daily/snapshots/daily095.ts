import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-095",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    1,
    5,
    3,
    2,
    3
  ],
  "columnClues": [
    2,
    2,
    2,
    1,
    3,
    6,
    5
  ],
  "monsters": [
    {
      "x": 0,
      "y": 0
    },
    {
      "x": 6,
      "y": 1
    },
    {
      "x": 0,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "....###",
    "#.#.##.",
    "#......",
    "..#####",
    ".#...##",
    ".....##",
    ".#...##"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3215687831,
  "sourceCandidateId": "generated-mixed-one-room-7-3215687831",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 67,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 66
};
