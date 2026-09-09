import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-330",
  "width": 7,
  "height": 7,
  "rowClues": [
    2,
    4,
    2,
    3,
    2,
    1,
    1
  ],
  "columnClues": [
    3,
    3,
    1,
    3,
    2,
    2,
    1
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 6
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "##.....",
    "#..###.",
    "#.#....",
    "....###",
    ".#.#...",
    ".#.....",
    "...#..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 1352977799,
  "sourceCandidateId": "generated-chest-one-room-7-1352977799",
  "sourceArchetype": "chest-one-room",
  "difficulty": "medium",
  "difficultyScore": 33,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 33
};
