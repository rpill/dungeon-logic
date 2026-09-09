import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-251",
  "width": 7,
  "height": 7,
  "rowClues": [
    5,
    3,
    3,
    3,
    3,
    2,
    2
  ],
  "columnClues": [
    5,
    4,
    3,
    1,
    3,
    4,
    1
  ],
  "monsters": [
    {
      "x": 5,
      "y": 0
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 0,
      "y": 6
    },
    {
      "x": 5,
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
    "#####..",
    "##...#.",
    "##...#.",
    "##...#.",
    "..#.##.",
    "#.#....",
    "....#.#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3089584596,
  "sourceCandidateId": "generated-mixed-one-room-7-3089584596",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "hard",
  "difficultyScore": 57,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 52
};
