import type {
  DoorDefinition,
  GridPosition,
} from '../types';

import {
  SearchCellState,
  type LineStatus,
} from '../solver/types';

import { SearchState } from '../solver/SearchState';

import {
  HumanRule,
  type HumanAssignment,
  type HumanProofStep,
} from './types';

export type DirectFixedPointResult =
  | {
      ok: true;
      steps:
        readonly HumanProofStep[];
    }
  | {
      ok: false;
      steps:
        readonly HumanProofStep[];
      contradiction: string;
    };

interface LineDescriptor {
  kind: 'row' | 'column';
  index: number;
  status: LineStatus;
}

type DirectDeductionResult =
  | {
      ok: true;
      step: HumanProofStep | null;
    }
  | {
      ok: false;
      contradiction: string;
    };

export function runDirectFixedPoint(
  state: SearchState,
): DirectFixedPointResult {
  const steps: HumanProofStep[] = [];

  while (true) {
    const deduction =
      findFirstDirectDeduction(
        state,
      );

    if (deduction.ok === false) {
      return {
        ok: false,
        steps,
        contradiction:
          deduction.contradiction,
      };
    }

    if (deduction.step === null) {
      return {
        ok: true,
        steps,
      };
    }

    for (
      const assignment
      of deduction.step.assignments
    ) {
      if (
        !state.assign(
          assignment.position.x,
          assignment.position.y,
          assignment.value,
        )
      ) {
        return {
          ok: false,
          steps,
          contradiction:
            `Cannot apply ${deduction.step.rule} assignment at (${assignment.position.x},${assignment.position.y}).`,
        };
      }
    }

    steps.push(deduction.step);
  }
}

function findFirstDirectDeduction(
  state: SearchState,
): DirectDeductionResult {
  const lineDeduction =
    findFirstLineDeduction(state);

  if (
    lineDeduction.ok === false ||
    lineDeduction.step !== null
  ) {
    return lineDeduction;
  }

  const doorDeduction =
    findFirstDoorDeduction(
      state,
    );

  if (
    doorDeduction.ok === false ||
    doorDeduction.step !== null
  ) {
    return doorDeduction;
  }

  const treasureRoomDeduction =
    findFirstTreasureRoomDeduction(
      state,
    );

  if (
    treasureRoomDeduction.ok === false ||
    treasureRoomDeduction.step !== null
  ) {
    return treasureRoomDeduction;
  }

  const monsterDeduction =
    findFirstMonsterDeduction(
      state,
    );

  if (
    monsterDeduction.ok === false ||
    monsterDeduction.step !== null
  ) {
    return monsterDeduction;
  }

  const hallwayDeduction =
    findFirstHallwayDeduction(
      state,
    );

  if (
    hallwayDeduction.ok === false ||
    hallwayDeduction.step !== null
  ) {
    return hallwayDeduction;
  }

  const open2x2Deduction =
    findFirstOpen2x2Deduction(
      state,
    );

  if (
    open2x2Deduction.ok === false ||
    open2x2Deduction.step !== null
  ) {
    return open2x2Deduction;
  }

  return findFirstConnectivityDeduction(
    state,
  );
}

function findFirstLineDeduction(
  state: SearchState,
): DirectDeductionResult {
  for (
    let y = 0;
    y < state.level.height;
    y += 1
  ) {
    const result =
      inspectLine({
        kind: 'row',
        index: y,
        status:
          state.getRowStatus(y),
      });

    if (result.ok === false) {
      return result;
    }

    if (result.step !== null) {
      return result;
    }
  }

  for (
    let x = 0;
    x < state.level.width;
    x += 1
  ) {
    const result =
      inspectLine({
        kind: 'column',
        index: x,
        status:
          state.getColumnStatus(x),
      });

    if (result.ok === false) {
      return result;
    }

    if (result.step !== null) {
      return result;
    }
  }

  return {
    ok: true,
    step: null,
  };
}

function inspectLine(
  line: LineDescriptor,
): DirectDeductionResult {
  const {
    target,
    wallsPlaced,
    unassigned,
  } = line.status;

  const wallsNeeded =
    target - wallsPlaced;

  if (
    wallsNeeded < 0 ||
    wallsNeeded >
      unassigned.length
  ) {
    return {
      ok: false,
      contradiction:
        `${describeLine(line)} cannot satisfy clue ${target}: ${wallsPlaced} walls are placed with ${unassigned.length} mutable cells remaining.`,
    };
  }

  if (unassigned.length === 0) {
    return {
      ok: true,
      step: null,
    };
  }

  if (wallsNeeded === 0) {
    return {
      ok: true,
      step: {
        rule:
          HumanRule.LineComplete,
        assignments:
          createAssignments(
            unassigned,
            SearchCellState.Open,
          ),
        explanation:
          `${describeLine(line)} already has all ${target} required walls, so its ${unassigned.length} remaining mutable cells are OPEN.`,
      },
    };
  }

  if (
    wallsNeeded ===
    unassigned.length
  ) {
    return {
      ok: true,
      step: {
        rule:
          HumanRule.LineFill,
        assignments:
          createAssignments(
            unassigned,
            SearchCellState.Wall,
          ),
        explanation:
          `${describeLine(line)} still needs ${wallsNeeded} walls and has exactly ${unassigned.length} mutable cells remaining, so all of them are WALL.`,
      },
    };
  }

  return {
    ok: true,
    step: null,
  };
}

function findFirstDoorDeduction(
  state: SearchState,
): DirectDeductionResult {
  for (
    const door
    of state.level.doors
  ) {
    const result =
      inspectDoor(
        state,
        door,
      );

    if (result.ok === false) {
      return result;
    }

    if (result.step !== null) {
      return result;
    }
  }

  return {
    ok: true,
    step: null,
  };
}

function inspectDoor(
  state: SearchState,
  door: DoorDefinition,
): DirectDeductionResult {
  const {
    x,
    y,
  } = door.position;

  const required:
    readonly {
      position: GridPosition;
      value:
        | typeof SearchCellState.Wall
        | typeof SearchCellState.Open;
    }[] =
    door.orientation ===
    'horizontal'
      ? [
          {
            position: {
              x: x - 1,
              y,
            },
            value:
              SearchCellState.Open,
          },
          {
            position: {
              x: x + 1,
              y,
            },
            value:
              SearchCellState.Open,
          },
          {
            position: {
              x,
              y: y - 1,
            },
            value:
              SearchCellState.Wall,
          },
          {
            position: {
              x,
              y: y + 1,
            },
            value:
              SearchCellState.Wall,
          },
        ]
      : [
          {
            position: {
              x,
              y: y - 1,
            },
            value:
              SearchCellState.Open,
          },
          {
            position: {
              x,
              y: y + 1,
            },
            value:
              SearchCellState.Open,
          },
          {
            position: {
              x: x - 1,
              y,
            },
            value:
              SearchCellState.Wall,
          },
          {
            position: {
              x: x + 1,
              y,
            },
            value:
              SearchCellState.Wall,
          },
        ];

  const assignments:
    HumanAssignment[] = [];

  for (
    const requirement
    of required
  ) {
    const {
      position,
      value,
    } = requirement;

    if (
      position.x < 0 ||
      position.x >=
        state.level.width ||
      position.y < 0 ||
      position.y >=
        state.level.height
    ) {
      return {
        ok: false,
        contradiction:
          `${describeDoor(door)} requires ${value.toUpperCase()} at (${position.x},${position.y}), which is outside the board.`,
      };
    }

    const current =
      state.getCellState(
        position.x,
        position.y,
      );

    if (current === value) {
      continue;
    }

    if (
      current === null
    ) {
      return {
        ok: false,
        contradiction:
          `${describeDoor(door)} requires ordinary ${value.toUpperCase()} at (${position.x},${position.y}), but that cell is a Fixed Blocker.`,
      };
    }

    if (
      current !==
      SearchCellState.Unassigned
    ) {
      return {
        ok: false,
        contradiction:
          `${describeDoor(door)} requires ${value.toUpperCase()} at (${position.x},${position.y}), but the cell is already ${current.toUpperCase()}.`,
      };
    }

    if (
      !state.isMutableCell(
        position.x,
        position.y,
      )
    ) {
      return {
        ok: false,
        contradiction:
          `${describeDoor(door)} cannot assign ${value.toUpperCase()} at fixed cell (${position.x},${position.y}).`,
      };
    }

    assignments.push({
      position: {
        x: position.x,
        y: position.y,
      },
      value,
    });
  }

  if (assignments.length === 0) {
    return {
      ok: true,
      step: null,
    };
  }

  return {
    ok: true,
    step: {
      rule: HumanRule.Door,
      assignments,
      explanation:
        `${describeDoor(door)} forces passage cells along its orientation to OPEN and perpendicular framing cells to ordinary WALL.`,
    },
  };
}

function findFirstTreasureRoomDeduction(
  state: SearchState,
): DirectDeductionResult {
  for (
    const chest
    of state.level.chests
  ) {
    const viable =
      state
        .getViableTreasureRoomCandidates(
          chest,
        );

    if (viable.length === 0) {
      return {
        ok: false,
        contradiction:
          `Chest at (${chest.x},${chest.y}) has no viable 3x3 Treasure Room.`,
      };
    }

    if (viable.length !== 1) {
      continue;
    }

    const candidate =
      viable[0];

    const assignments:
      HumanAssignment[] = [];

    for (
      const position
      of candidate.cells
    ) {
      const current =
        state.getCellState(
          position.x,
          position.y,
        );

      if (
        current ===
        SearchCellState.Open
      ) {
        continue;
      }

      if (
        current ===
          SearchCellState.Unassigned &&
        state.isMutableCell(
          position.x,
          position.y,
        )
      ) {
        assignments.push({
          position: {
            x: position.x,
            y: position.y,
          },
          value:
            SearchCellState.Open,
        });
        continue;
      }

      return {
        ok: false,
        contradiction:
          `The only viable Treasure Room for Chest at (${chest.x},${chest.y}) cannot keep interior cell (${position.x},${position.y}) OPEN.`,
      };
    }

    if (
      assignments.length > 0
    ) {
      const topLeft =
        candidate.cells[0];

      return {
        ok: true,
        step: {
          rule:
            HumanRule
              .TreasureRoomInterior,
          assignments,
          explanation:
            `Chest at (${chest.x},${chest.y}) has exactly one viable 3x3 Treasure Room, with top-left (${topLeft.x},${topLeft.y}), so every remaining interior cell must be OPEN.`,
        },
      };
    }

    const confirmedOpen:
      GridPosition[] = [];
    const possibleOpen:
      GridPosition[] = [];

    for (
      const position
      of candidate.boundary
    ) {
      const current =
        state.getCellState(
          position.x,
          position.y,
        );

      if (
        current ===
        SearchCellState.Open
      ) {
        confirmedOpen.push(
          position,
        );
        continue;
      }

      if (
        current ===
          SearchCellState.Unassigned &&
        state.isMutableCell(
          position.x,
          position.y,
        )
      ) {
        possibleOpen.push(
          position,
        );
      }
    }

    if (
      confirmedOpen.length > 1
    ) {
      return {
        ok: false,
        contradiction:
          `The only viable Treasure Room for Chest at (${chest.x},${chest.y}) has more than one confirmed entrance.`,
      };
    }

    if (
      confirmedOpen.length === 1
    ) {
      const entranceAssignments =
        possibleOpen.map(
          (position) => ({
            position: {
              x: position.x,
              y: position.y,
            },
            value:
              SearchCellState.Wall,
          }),
        );

      if (
        entranceAssignments.length ===
        0
      ) {
        continue;
      }

      const entrance =
        confirmedOpen[0];

      return {
        ok: true,
        step: {
          rule:
            HumanRule
              .TreasureRoomEntrance,
          assignments:
            entranceAssignments,
          explanation:
            `Chest at (${chest.x},${chest.y}) already has its single Treasure Room entrance at (${entrance.x},${entrance.y}), so every other remaining boundary cell must be WALL.`,
        },
      };
    }

    if (
      possibleOpen.length === 0
    ) {
      return {
        ok: false,
        contradiction:
          `The only viable Treasure Room for Chest at (${chest.x},${chest.y}) has no possible entrance.`,
      };
    }

    if (
      possibleOpen.length === 1
    ) {
      const entrance =
        possibleOpen[0];

      return {
        ok: true,
        step: {
          rule:
            HumanRule
              .TreasureRoomEntrance,
          assignments: [
            {
              position: {
                x: entrance.x,
                y: entrance.y,
              },
              value:
                SearchCellState.Open,
            },
          ],
          explanation:
            `Chest at (${chest.x},${chest.y}) has only one possible Treasure Room entrance remaining, at (${entrance.x},${entrance.y}), so it must be OPEN.`,
        },
      };
    }
  }

  return {
    ok: true,
    step: null,
  };
}

function findFirstMonsterDeduction(
  state: SearchState,
): DirectDeductionResult {
  for (
    const monster
    of state.level.monsters
  ) {
    const neighbors =
      getOrthogonalNeighbors(
        state,
        monster,
      );

    const confirmedOpen =
      neighbors.filter(
        (position) =>
          state.getCellState(
            position.x,
            position.y,
          ) ===
          SearchCellState.Open,
      );

    const possibleOpen =
      neighbors.filter(
        (position) =>
          state.getCellState(
            position.x,
            position.y,
          ) ===
            SearchCellState.Unassigned &&
          state.isMutableCell(
            position.x,
            position.y,
          ),
      );

    if (
      confirmedOpen.length > 1
    ) {
      return {
        ok: false,
        contradiction:
          `Monster at (${monster.x},${monster.y}) has more than one confirmed OPEN hallway exit.`,
      };
    }

    if (
      confirmedOpen.length === 0 &&
      possibleOpen.length === 0
    ) {
      return {
        ok: false,
        contradiction:
          `Monster at (${monster.x},${monster.y}) has no possible OPEN hallway exit.`,
      };
    }

    if (
      confirmedOpen.length === 1
    ) {
      const assignments:
        HumanAssignment[] =
        possibleOpen.map(
          (position) => ({
            position: {
              x: position.x,
              y: position.y,
            },
            value:
              SearchCellState.Wall,
          }),
        );

      if (
        assignments.length === 0
      ) {
        continue;
      }

      const exit =
        confirmedOpen[0];

      return {
        ok: true,
        step: {
          rule:
            HumanRule.MonsterDeadEnd,
          assignments,
          explanation:
            `Monster at (${monster.x},${monster.y}) already has its single OPEN hallway exit at (${exit.x},${exit.y}), so every other remaining neighboring cell must be WALL.`,
        },
      };
    }

    if (
      confirmedOpen.length === 0 &&
      possibleOpen.length === 1
    ) {
      const exit =
        possibleOpen[0];

      return {
        ok: true,
        step: {
          rule:
            HumanRule.MonsterDeadEnd,
          assignments: [
            {
              position: {
                x: exit.x,
                y: exit.y,
              },
              value:
                SearchCellState.Open,
            },
          ],
          explanation:
            `Monster at (${monster.x},${monster.y}) has no confirmed hallway exit and only one possible neighboring cell remains, at (${exit.x},${exit.y}), so it must be OPEN.`,
        },
      };
    }
  }

  return {
    ok: true,
    step: null,
  };
}

function findFirstHallwayDeduction(
  state: SearchState,
): DirectDeductionResult {
  for (
    let y = 0;
    y < state.level.height;
    y += 1
  ) {
    for (
      let x = 0;
      x < state.level.width;
      x += 1
    ) {
      if (
        state.getCellState(
          x,
          y,
        ) !== SearchCellState.Open
      ) {
        continue;
      }

      const position = {
        x,
        y,
      };

      if (
        isMonsterPosition(
          state,
          position,
        )
      ) {
        continue;
      }

      if (
        isInsideAnyViableTreasureRoom(
          state,
          position,
        )
      ) {
        continue;
      }

      const neighbors =
        getOrthogonalNeighbors(
          state,
          position,
        );

      const confirmedOpen =
        neighbors.filter(
          (neighbor) =>
            state.getCellState(
              neighbor.x,
              neighbor.y,
            ) ===
            SearchCellState.Open,
        );

      const possibleOpen =
        neighbors.filter(
          (neighbor) =>
            state.getCellState(
              neighbor.x,
              neighbor.y,
            ) ===
              SearchCellState.Unassigned &&
            state.isMutableCell(
              neighbor.x,
              neighbor.y,
            ),
        );

      const maximumDegree =
        confirmedOpen.length +
        possibleOpen.length;

      if (maximumDegree < 2) {
        return {
          ok: false,
          contradiction:
            `Confirmed non-Monster hallway cell at (${x},${y}) can reach at most ${maximumDegree} OPEN neighbors, so it would be a forbidden dead end.`,
        };
      }

      if (
        maximumDegree !== 2 ||
        possibleOpen.length === 0
      ) {
        continue;
      }

      const assignments =
        possibleOpen.map(
          (neighbor) => ({
            position: {
              x: neighbor.x,
              y: neighbor.y,
            },
            value:
              SearchCellState.Open,
          }),
        );

      const forcedCoordinates =
        assignments
          .map(
            (assignment) =>
              `(${assignment.position.x},${assignment.position.y})`,
          )
          .join(', ');

      return {
        ok: true,
        step: {
          rule:
            HumanRule
              .HallwayNotDeadEnd,
          assignments,
          explanation:
            `Confirmed non-Monster hallway cell at (${x},${y}) must have at least two OPEN neighbors. Only ${maximumDegree} neighbors can still be OPEN, so ${forcedCoordinates} must be OPEN.`,
        },
      };
    }
  }

  return {
    ok: true,
    step: null,
  };
}

function findFirstOpen2x2Deduction(
  state: SearchState,
): DirectDeductionResult {
  for (
    let y = 0;
    y < state.level.height - 1;
    y += 1
  ) {
    for (
      let x = 0;
      x < state.level.width - 1;
      x += 1
    ) {
      const block:
        readonly GridPosition[] = [
          { x, y },
          { x: x + 1, y },
          { x, y: y + 1 },
          {
            x: x + 1,
            y: y + 1,
          },
        ];

      if (
        canBlockFitInAnyViableTreasureRoom(
          state,
          block,
        )
      ) {
        continue;
      }

      const confirmedOpen =
        block.filter(
          (position) =>
            state.getCellState(
              position.x,
              position.y,
            ) ===
            SearchCellState.Open,
        );

      if (
        confirmedOpen.length === 4
      ) {
        return {
          ok: false,
          contradiction:
            `Cells (${x},${y}) through (${x + 1},${y + 1}) form a forbidden OPEN 2x2 outside every viable Treasure Room.`,
        };
      }

      if (
        confirmedOpen.length !== 3
      ) {
        continue;
      }

      const undecided =
        block.filter(
          (position) =>
            state.getCellState(
              position.x,
              position.y,
            ) ===
              SearchCellState.Unassigned &&
            state.isMutableCell(
              position.x,
              position.y,
            ),
        );

      if (
        undecided.length !== 1
      ) {
        continue;
      }

      const forced =
        undecided[0];

      return {
        ok: true,
        step: {
          rule:
            HumanRule.Open2x2,
          assignments: [
            {
              position: {
                x: forced.x,
                y: forced.y,
              },
              value:
                SearchCellState.Wall,
            },
          ],
          explanation:
            `Three cells in the 2x2 at (${x},${y}) are already OPEN, and no viable Treasure Room can contain all four cells, so (${forced.x},${forced.y}) must be WALL.`,
        },
      };
    }
  }

  return {
    ok: true,
    step: null,
  };
}

function canBlockFitInAnyViableTreasureRoom(
  state: SearchState,
  block: readonly GridPosition[],
): boolean {
  for (
    const chest
    of state.level.chests
  ) {
    const viable =
      state
        .getViableTreasureRoomCandidates(
          chest,
        );

    for (
      const candidate
      of viable
    ) {
      if (
        block.every(
          (position) =>
            candidate.cells.some(
              (cell) =>
                cell.x ===
                  position.x &&
                cell.y ===
                  position.y,
            ),
        )
      ) {
        return true;
      }
    }
  }

  return false;
}

function findFirstConnectivityDeduction(
  state: SearchState,
): DirectDeductionResult {
  if (
    !state.isPotentialConnectivityValid()
  ) {
    return {
      ok: false,
      contradiction:
        'Mandatory OPEN cells can no longer be connected through the remaining potential OPEN graph.',
    };
  }

  for (
    const position
    of state
      .getUnassignedMutablePositions()
  ) {
    const checkpoint =
      state.checkpoint();

    const assigned =
      state.assign(
        position.x,
        position.y,
        SearchCellState.Wall,
      );

    if (!assigned) {
      state.rollback(
        checkpoint,
      );
      continue;
    }

    const remainsConnected =
      state
        .isPotentialConnectivityValid();

    state.rollback(
      checkpoint,
    );

    if (remainsConnected) {
      continue;
    }

    return {
      ok: true,
      step: {
        rule:
          HumanRule.Connectivity,
        assignments: [
          {
            position: {
              x: position.x,
              y: position.y,
            },
            value:
              SearchCellState.Open,
          },
        ],
        explanation:
          `If (${position.x},${position.y}) were WALL, the already mandatory OPEN regions could no longer connect, so this articulation cell must be OPEN.`,
      },
    };
  }

  return {
    ok: true,
    step: null,
  };
}

function isMonsterPosition(
  state: SearchState,
  position: GridPosition,
): boolean {
  return state.level.monsters.some(
    (monster) =>
      monster.x === position.x &&
      monster.y === position.y,
  );
}

function isInsideAnyViableTreasureRoom(
  state: SearchState,
  position: GridPosition,
): boolean {
  for (
    const chest
    of state.level.chests
  ) {
    const viable =
      state
        .getViableTreasureRoomCandidates(
          chest,
        );

    if (
      viable.some(
        (candidate) =>
          candidate.cells.some(
            (cell) =>
              cell.x === position.x &&
              cell.y === position.y,
          ),
      )
    ) {
      return true;
    }
  }

  return false;
}

function getOrthogonalNeighbors(
  state: SearchState,
  position: GridPosition,
): readonly GridPosition[] {
  const candidates = [
    {
      x: position.x,
      y: position.y - 1,
    },
    {
      x: position.x - 1,
      y: position.y,
    },
    {
      x: position.x + 1,
      y: position.y,
    },
    {
      x: position.x,
      y: position.y + 1,
    },
  ];

  return candidates.filter(
    (candidate) =>
      candidate.x >= 0 &&
      candidate.x <
        state.level.width &&
      candidate.y >= 0 &&
      candidate.y <
        state.level.height,
  );
}

function createAssignments(
  positions:
    readonly {
      x: number;
      y: number;
    }[],
  value:
    | typeof SearchCellState.Wall
    | typeof SearchCellState.Open,
): readonly HumanAssignment[] {
  return positions.map(
    (position) => ({
      position: {
        x: position.x,
        y: position.y,
      },
      value,
    }),
  );
}

function describeLine(
  line: LineDescriptor,
): string {
  return (
    line.kind === 'row'
      ? `Row ${line.index}`
      : `Column ${line.index}`
  );
}

function describeDoor(
  door: DoorDefinition,
): string {
  return (
    `${door.orientation} Door at ` +
    `(${door.position.x},${door.position.y})`
  );
}
