import type { DailySnapshotProvenance } from '../types';
import type { LevelDefinition } from '../../../puzzle/types';

export const level: LevelDefinition = {
  "id": "daily-049",
  "width": 7,
  "height": 7,
  "rowClues": [
    4,
    4,
    3,
    5,
    1,
    4,
    3
  ],
  "columnClues": [
    5,
    3,
    0,
    2,
    5,
    5,
    4
  ],
  "monsters": [
    {
      "x": 6,
      "y": 2
    },
    {
      "x": 0,
      "y": 4
    },
    {
      "x": 5,
      "y": 6
    }
  ],
  "chests": [
    {
      "x": 3,
      "y": 1
    }
  ],
  "blockers": [],
  "doors": [],
  "solution": [
    "#...###",
    "#...###",
    "#...##.",
    "##.###.",
    ".#.....",
    "...####",
    "##....#"
  ]
};

export const provenance: DailySnapshotProvenance = {
  "sourceSeed": 20260909,
  "sourceCandidateSeed": 3680821131,
  "sourceCandidateId": "generated-mixed-one-room-7-3680821131",
  "sourceArchetype": "mixed-one-room",
  "difficulty": "medium",
  "difficultyScore": 44,
  "humanStatus": "solved-with-contradiction",
  "targetScore": 41
};
