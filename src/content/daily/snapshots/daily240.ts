import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-240",
  "width": 7,
  "height": 7,
  "rowClues": [
    3,
    4,
    2,
    4,
    1,
    2,
    4
  ],
  "columnClues": [
    4,
    4,
    2,
    3,
    2,
    1,
    4
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
    "##....#",
    "#..##.#",
    "..#...#",
    ".#..###",
    "...#...",
    "##.....",
    "####..."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 794653582,
  "sourceCandidateId": "generated-chest-one-room-7-794653582",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 65,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 64
};
