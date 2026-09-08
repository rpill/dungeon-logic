import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-058",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    5,
    1,
    3,
    3,
    3,
    4
  ],
  "columnClues": [
    4,
    2,
    3,
    5,
    3,
    2,
    4
  ],
  "monsters": [],
  "chests": [
    {
      "x": 6,
      "y": 3
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "...####",
    ".#.####",
    "...#...",
    "#.##...",
    "#.##...",
    "#...#.#",
    "###...#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3512546275,
  "sourceCandidateId": "generated-chest-one-room-7-3512546275",
  "sourceArchetype": "chest-one-room",
  "difficulty": "hard",
  "difficultyScore": 59,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 56
};
