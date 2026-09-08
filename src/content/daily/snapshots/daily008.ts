import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-008",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    1,
    4,
    1,
    4,
    2
  ],
  "columnClues": [
    4,
    4,
    2,
    3,
    2,
    2,
    1
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 0
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "####...",
    "##.....",
    "...#...",
    ".#..###",
    "..#....",
    "#..###.",
    "##....."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2724640094,
  "sourceCandidateId": "generated-chest-one-room-7-2724640094",
  "sourceArchetype": "chest-one-room",
  "difficulty": "medium",
  "difficultyScore": 45,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 48
};
