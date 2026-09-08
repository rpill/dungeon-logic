import type {
  ManuscriptDefinition,
  ManuscriptId,
} from './types';

export const CAMPAIGN_MANUSCRIPTS = [
  {
    id: 'manuscript-i',
    roman: 'I',
    title: 'Азбука',
    slots: [1, 2, 3, 4, 5, 6, 7],
    requiredPreviousSolved: 0,
  },
  {
    id: 'manuscript-ii',
    roman: 'II',
    title: 'Дедукция',
    slots: [8, 9, 10, 11, 12, 13, 14],
    requiredPreviousSolved: 6,
  },
  {
    id: 'manuscript-iii',
    roman: 'III',
    title: 'Комнаты',
    slots: [15, 16, 17, 18, 19, 20, 21, 22],
    requiredPreviousSolved: 6,
  },
  {
    id: 'manuscript-iv',
    roman: 'IV',
    title: 'Мастерство',
    slots: [23, 24, 25, 26, 27, 28, 29, 30],
    requiredPreviousSolved: 7,
  },
] as const satisfies readonly ManuscriptDefinition[];

export function getManuscriptDefinition(
  id: ManuscriptId,
): ManuscriptDefinition {
  const manuscript = CAMPAIGN_MANUSCRIPTS.find((entry) => entry.id === id);
  if (manuscript === undefined) {
    throw new Error(`Unknown manuscript id: ${id}.`);
  }
  return manuscript;
}

export function getManuscriptForSlot(
  slot: number,
): ManuscriptDefinition | null {
  return CAMPAIGN_MANUSCRIPTS.find((entry) => entry.slots.some((candidate) => candidate === slot)) ?? null;
}
