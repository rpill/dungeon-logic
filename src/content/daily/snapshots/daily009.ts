import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-009",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    2,
    3,
    3,
    2,
    3,
    5
  ],
  "columnClues": [
    6,
    5,
    3,
    2,
    3,
    2,
    1
  ],
  "monsters": [
    {
      "x": 3,
      "y": 0
    },
    {
      "x": 6,
      "y": 0
    },
    {
      "x": 0,
      "y": 2
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 5
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "###.#..",
    "#.....#",
    "..###..",
    "##...#.",
    "##.....",
    "##...#.",
    "#####.."
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 2703757857,
  "sourceCandidateId": "generated-mixed-one-room-7-2703757857",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 55,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
