import type { ManuscriptId } from '../content/campaign/types';
import type { SupportedLanguage } from './Language';

export type LevelSelectState = 'completed' | 'current' | 'unlocked' | 'locked';

export interface UiCopy {
  readonly common: {
    readonly backHome: string;
    readonly backArchive: string;
    readonly back: string;
    readonly archive: string;
    readonly statistics: string;
    readonly settings: string;
    readonly howToPlay: string;
    readonly cancel: string;
    readonly reset: string;
    readonly solved: string;
    readonly available: string;
    readonly locked: string;
    readonly loading: string;
  };
  readonly levelSelect: {
    readonly continueLevel: (slot: number) => string;
    readonly level: (slot: number) => string;
    readonly state: Readonly<Record<LevelSelectState, string>>;
  };
  readonly home: {
    readonly archiveProgress: (completed: number, total: number) => string;
    readonly chooseLevel: string;
    readonly start: string;
    readonly continue: string;
    readonly levelContext: (slot: number) => string;
    readonly manuscriptLevelContext: (roman: string, slot: number) => string;
    readonly dailyUnavailable: string;
    readonly noDailyForTrustedDate: string;
    readonly dailySolved: string;
    readonly dailyNew: string;
    readonly streakSuffix: (streak: number) => string;
    readonly best: (time: string, streakSuffix: string) => string;
    readonly today: (streakSuffix: string) => string;
  };
  readonly archive: {
    readonly title: string;
    readonly sealed: string;
    readonly completedFully: string;
    readonly nextManuscriptUnlocked: string;
    readonly available: string;
    readonly locked: string;
    readonly contentsUnknown: string;
    readonly manuscript: (roman: string) => string;
    readonly nextManuscriptProgress: (solved: number, required: number) => string;
    readonly noPublishedLevels: string;
    readonly levelSolved: string;
    readonly levelAvailable: string;
    readonly levelLocked: string;
    readonly requirement: (required: number, previousRoman: string) => string;
    readonly sealedTitle: string;
  };
  readonly settings: {
    readonly title: string;
    readonly music: string;
    readonly sound: string;
    readonly vibration: string;
    readonly language: string;
    readonly help: string;
    readonly resetProgress: string;
    readonly on: string;
    readonly off: string;
    readonly languageName: Readonly<Record<SupportedLanguage, string>>;
    readonly resetTitle: string;
    readonly resetBody: string;
  };
  readonly help: {
    readonly title: string;
  };
  readonly stats: {
    readonly title: string;
    readonly months: readonly string[];
    readonly weekdays: readonly string[];
    readonly campaign: string;
    readonly daily: string;
    readonly overall: string;
    readonly solved: (solved: number, total: number) => string;
    readonly manuscripts: (completed: number, total: number) => string;
    readonly withoutHints: (count: number) => string;
    readonly totalSolved: (count: number) => string;
    readonly streakBest: (current: string, best: number) => string;
    readonly activeTime: (duration: string) => string;
    readonly puzzlesSolved: (count: number) => string;
    readonly hints: (count: number) => string;
    readonly dailyCalendar: string;
    readonly noTrustedDate: string;
    readonly dailyMonth: (month: string, year: number) => string;
  };
  readonly game: {
    readonly back: string;
    readonly levelTitle: (slot: number, total: number) => string;
    readonly dailyTitle: string;
    readonly rules: string;
    readonly mouseControls: string;
    readonly wall: string;
    readonly floor: string;
    readonly undo: string;
    readonly reset: string;
    readonly hint: string;
    readonly hintFree: (remaining: number) => string;
    readonly hintRewarded: string;
    readonly onboardingTouchWall: string;
    readonly onboardingTouchFloor: string;
    readonly onboardingMouseWall: string;
    readonly onboardingMouseFloor: string;
    readonly hintWall: string;
    readonly hintFloor: string;
    readonly loadingAd: string;
    readonly show: string;
    readonly ad: string;
    readonly rewardedPrompt: string;
    readonly freeHintPrompt: (remaining: number) => string;
    readonly withoutHints: string;
    readonly hintsCount: (count: number) => string;
    readonly newRecord: string;
    readonly manuscriptUnlocked: (roman: string, title: string) => string;
    readonly solvedCampaign: (time: string, hintCopy: string, recordCopy: string, unlockCopy: string) => string;
    readonly archive: string;
    readonly next: string;
    readonly solvedDaily: (time: string, hintCopy: string, recordCopy: string) => string;
    readonly streakRecent: (streak: number, recent: string) => string;
    readonly home: string;
    readonly resetTitle: string;
    readonly resetBody: string;
  };
  readonly manuscripts: Readonly<Record<ManuscriptId, string>>;
}

const RU: UiCopy = {
  common: {
    backHome: '← ГЛАВНАЯ',
    backArchive: '← АРХИВ',
    back: '← НАЗАД',
    archive: 'АРХИВ',
    statistics: 'СТАТИСТИКА',
    settings: 'НАСТРОЙКИ',
    howToPlay: 'ⓘ КАК ИГРАТЬ',
    cancel: 'ОТМЕНА',
    reset: 'СБРОСИТЬ',
    solved: 'РЕШЕНО',
    available: 'ДОСТУПНО',
    locked: 'ЗАКРЫТО',
    loading: 'ЗАГРУЗКА…',
  },
  levelSelect: {
    continueLevel: (slot) => `ПРОДОЛЖИТЬ · УРОВЕНЬ ${slot}`,
    level: (slot) => `Уровень ${slot}`,
    state: {
      completed: 'РЕШЁН',
      current: 'ТЕКУЩИЙ',
      unlocked: 'ДОСТУПЕН',
      locked: 'ЗАКРЫТ',
    },
  },
  home: {
    archiveProgress: (completed, total) => `Архив · ${completed} / ${total}`,
    chooseLevel: 'ВЫБРАТЬ УРОВЕНЬ',
    start: 'НАЧАТЬ',
    continue: 'ПРОДОЛЖИТЬ',
    levelContext: (slot) => `Уровень ${String(slot).padStart(2, '0')}`,
    manuscriptLevelContext: (roman, slot) => `Рукопись ${roman} · Уровень ${String(slot).padStart(2, '0')}`,
    dailyUnavailable: 'DAILY · НЕДОСТУПНО',
    noDailyForTrustedDate: 'Нет задания на доверенную дату',
    dailySolved: 'DAILY · РЕШЕНО',
    dailyNew: 'DAILY · НОВАЯ',
    streakSuffix: (streak) => streak > 0 ? ` · Серия ${streak}` : '',
    best: (time, streakSuffix) => `Лучшее ${time}${streakSuffix}`,
    today: (streakSuffix) => `Сегодня${streakSuffix}`,
  },
  archive: {
    title: 'АРХИВ',
    sealed: 'ЗАПЕЧАТАНО',
    completedFully: 'Завершено полностью',
    nextManuscriptUnlocked: 'Следующая рукопись открыта',
    available: 'Доступно',
    locked: 'Закрыто',
    contentsUnknown: 'Содержимое пока неизвестно',
    manuscript: (roman) => `РУКОПИСЬ ${roman}`,
    nextManuscriptProgress: (solved, required) => `До следующей рукописи: ${Math.min(solved, required)} / ${required}`,
    noPublishedLevels: 'В текущей сборке пока нет опубликованных уровней этой рукописи.',
    levelSolved: '✓ РЕШЕНО',
    levelAvailable: 'ДОСТУПНО',
    levelLocked: '🔒 ЗАКРЫТО',
    requirement: (required, previousRoman) => `Завершите ${required} задач рукописи ${previousRoman}`,
    sealedTitle: 'Запечатанная рукопись',
  },
  settings: {
    title: 'НАСТРОЙКИ',
    music: 'МУЗЫКА',
    sound: 'ЗВУК',
    vibration: 'ВИБРАЦИЯ',
    language: 'ЯЗЫК',
    help: 'КАК ИГРАТЬ',
    resetProgress: 'СБРОСИТЬ ПРОГРЕСС',
    on: 'ВКЛ',
    off: 'ВЫКЛ',
    languageName: { ru: 'РУССКИЙ', en: 'ENGLISH' },
    resetTitle: 'СБРОСИТЬ ПРОГРЕСС?',
    resetBody: 'Кампания, Daily, статистика и подсказки\nбудут удалены. Настройки сохранятся.',
  },
  help: {
    title: 'КАК ИГРАТЬ',
  },
  stats: {
    title: 'СТАТИСТИКА',
    months: ['ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ', 'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'],
    weekdays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
    campaign: 'КАМПАНИЯ',
    daily: 'DAILY',
    overall: 'ОБЩЕЕ',
    solved: (solved, total) => `Решено ${solved} / ${total}`,
    manuscripts: (completed, total) => `Рукописи ${completed} / ${total}`,
    withoutHints: (count) => `Без подсказок ${count}`,
    totalSolved: (count) => `Всего решено ${count}`,
    streakBest: (current, best) => `Серия ${current} · Лучшая ${best}`,
    activeTime: (duration) => `Активное время ${duration}`,
    puzzlesSolved: (count) => `Решено задач ${count}`,
    hints: (count) => `Подсказок ${count}`,
    dailyCalendar: 'DAILY · КАЛЕНДАРЬ',
    noTrustedDate: 'Недоступно без доверенной даты',
    dailyMonth: (month, year) => `DAILY · ${month} ${year}`,
  },
  game: {
    back: '← НАЗАД',
    levelTitle: (slot, total) => `УРОВЕНЬ ${slot} / ${total}`,
    dailyTitle: 'DAILY',
    rules: 'ⓘ Правила',
    mouseControls: 'ЛКМ: Стена   •   ПКМ: Пол',
    wall: 'СТЕНА',
    floor: 'ПОЛ',
    undo: 'ОТМЕНА',
    reset: 'СБРОС',
    hint: 'ПОДСКАЗКА',
    hintFree: (remaining) => `ПОДСКАЗКА ×${remaining}`,
    hintRewarded: 'ПОДСКАЗКА ▶',
    onboardingTouchWall: 'ПОСТАВЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ КАК СТЕНЫ',
    onboardingTouchFloor: 'ВЫБЕРИ ПОЛ И ОТМЕТЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ',
    onboardingMouseWall: 'ЛКМ: ПОСТАВЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ КАК СТЕНЫ',
    onboardingMouseFloor: 'ПКМ: ОТМЕТЬ ВСЕ ЗОЛОТЫЕ КЛЕТКИ КАК ПОЛ',
    hintWall: 'ПОДСКАЗКА: золотая клетка должна быть СТЕНОЙ',
    hintFloor: 'ПОДСКАЗКА: золотая клетка должна быть ПОЛОМ',
    loadingAd: 'ЗАГРУЗКА РЕКЛАМЫ…',
    show: 'ПОКАЗАТЬ',
    ad: 'РЕКЛАМА',
    rewardedPrompt: '1 РЕКЛАМА = 1 ПОДСКАЗКА. ПОКАЗАТЬ РЕКЛАМУ?',
    freeHintPrompt: (remaining) => `Показать одну клетку? Бесплатных подсказок: ${remaining}`,
    withoutHints: 'БЕЗ ПОДСКАЗОК',
    hintsCount: (count) => `ПОДСКАЗОК: ${count}`,
    newRecord: '  ·  НОВЫЙ РЕКОРД',
    manuscriptUnlocked: (roman, title) => `\nОТКРЫТА РУКОПИСЬ ${roman} · ${title.toUpperCase()}`,
    solvedCampaign: (time, hintCopy, recordCopy, unlockCopy) => `✓ РЕШЕНО  ·  ${time}  ·  ${hintCopy}${recordCopy}${unlockCopy}`,
    archive: 'АРХИВ',
    next: 'ДАЛЬШЕ',
    solvedDaily: (time, hintCopy, recordCopy) => `✓ DAILY РЕШЁН  ·  ${time}  ·  ${hintCopy}${recordCopy}`,
    streakRecent: (streak, recent) => `СЕРИЯ: ${streak}  ·  7 ДНЕЙ: ${recent}`,
    home: 'ГЛАВНАЯ',
    resetTitle: 'Сбросить задачу?',
    resetBody: 'Все отметки на этом поле будут удалены.',
  },
  manuscripts: {
    'manuscript-i': 'Азбука',
    'manuscript-ii': 'Дедукция',
    'manuscript-iii': 'Комнаты',
    'manuscript-iv': 'Мастерство',
  },
};

const EN: UiCopy = {
  common: {
    backHome: '← HOME',
    backArchive: '← ARCHIVE',
    back: '← BACK',
    archive: 'ARCHIVE',
    statistics: 'STATISTICS',
    settings: 'SETTINGS',
    howToPlay: 'ⓘ HOW TO PLAY',
    cancel: 'CANCEL',
    reset: 'RESET',
    solved: 'SOLVED',
    available: 'AVAILABLE',
    locked: 'LOCKED',
    loading: 'LOADING…',
  },
  levelSelect: {
    continueLevel: (slot) => `CONTINUE · LEVEL ${slot}`,
    level: (slot) => `Level ${slot}`,
    state: {
      completed: 'COMPLETED',
      current: 'CURRENT',
      unlocked: 'UNLOCKED',
      locked: 'LOCKED',
    },
  },
  home: {
    archiveProgress: (completed, total) => `Archive · ${completed} / ${total}`,
    chooseLevel: 'CHOOSE LEVEL',
    start: 'START',
    continue: 'CONTINUE',
    levelContext: (slot) => `Level ${String(slot).padStart(2, '0')}`,
    manuscriptLevelContext: (roman, slot) => `Manuscript ${roman} · Level ${String(slot).padStart(2, '0')}`,
    dailyUnavailable: 'DAILY · UNAVAILABLE',
    noDailyForTrustedDate: 'No puzzle for the trusted date',
    dailySolved: 'DAILY · SOLVED',
    dailyNew: 'DAILY · NEW',
    streakSuffix: (streak) => streak > 0 ? ` · Streak ${streak}` : '',
    best: (time, streakSuffix) => `Best ${time}${streakSuffix}`,
    today: (streakSuffix) => `Today${streakSuffix}`,
  },
  archive: {
    title: 'ARCHIVE',
    sealed: 'SEALED',
    completedFully: 'Fully completed',
    nextManuscriptUnlocked: 'Next manuscript unlocked',
    available: 'Available',
    locked: 'Locked',
    contentsUnknown: 'Contents are still unknown',
    manuscript: (roman) => `MANUSCRIPT ${roman}`,
    nextManuscriptProgress: (solved, required) => `Until next manuscript: ${Math.min(solved, required)} / ${required}`,
    noPublishedLevels: 'This manuscript has no published levels in the current build yet.',
    levelSolved: '✓ SOLVED',
    levelAvailable: 'AVAILABLE',
    levelLocked: '🔒 LOCKED',
    requirement: (required, previousRoman) => `Complete ${required} puzzles in Manuscript ${previousRoman}`,
    sealedTitle: 'Sealed manuscript',
  },
  settings: {
    title: 'SETTINGS',
    music: 'MUSIC',
    sound: 'SOUND',
    vibration: 'VIBRATION',
    language: 'LANGUAGE',
    help: 'HOW TO PLAY',
    resetProgress: 'RESET PROGRESS',
    on: 'ON',
    off: 'OFF',
    languageName: { ru: 'РУССКИЙ', en: 'ENGLISH' },
    resetTitle: 'RESET PROGRESS?',
    resetBody: 'Campaign, Daily, statistics and hints\nwill be deleted. Settings will be kept.',
  },
  help: {
    title: 'HOW TO PLAY',
  },
  stats: {
    title: 'STATISTICS',
    months: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
    weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    campaign: 'CAMPAIGN',
    daily: 'DAILY',
    overall: 'OVERALL',
    solved: (solved, total) => `Solved ${solved} / ${total}`,
    manuscripts: (completed, total) => `Manuscripts ${completed} / ${total}`,
    withoutHints: (count) => `Without hints ${count}`,
    totalSolved: (count) => `Total solved ${count}`,
    streakBest: (current, best) => `Streak ${current} · Best ${best}`,
    activeTime: (duration) => `Active time ${duration}`,
    puzzlesSolved: (count) => `Puzzles solved ${count}`,
    hints: (count) => `Hints ${count}`,
    dailyCalendar: 'DAILY · CALENDAR',
    noTrustedDate: 'Unavailable without a trusted date',
    dailyMonth: (month, year) => `DAILY · ${month} ${year}`,
  },
  game: {
    back: '← BACK',
    levelTitle: (slot, total) => `LEVEL ${slot} / ${total}`,
    dailyTitle: 'DAILY',
    rules: 'ⓘ Rules',
    mouseControls: 'LMB: Wall   •   RMB: Floor',
    wall: 'WALL',
    floor: 'FLOOR',
    undo: 'UNDO',
    reset: 'RESET',
    hint: 'HINT',
    hintFree: (remaining) => `HINT ×${remaining}`,
    hintRewarded: 'HINT ▶',
    onboardingTouchWall: 'MARK ALL GOLD CELLS AS WALLS',
    onboardingTouchFloor: 'SELECT FLOOR AND MARK ALL GOLD CELLS',
    onboardingMouseWall: 'LMB: MARK ALL GOLD CELLS AS WALLS',
    onboardingMouseFloor: 'RMB: MARK ALL GOLD CELLS AS FLOOR',
    hintWall: 'HINT: the gold cell must be a WALL',
    hintFloor: 'HINT: the gold cell must be FLOOR',
    loadingAd: 'LOADING AD…',
    show: 'SHOW',
    ad: 'AD',
    rewardedPrompt: '1 AD = 1 HINT. SHOW AN AD?',
    freeHintPrompt: (remaining) => `Reveal one cell? Free hints: ${remaining}`,
    withoutHints: 'NO HINTS',
    hintsCount: (count) => `HINTS: ${count}`,
    newRecord: '  ·  NEW RECORD',
    manuscriptUnlocked: (roman, title) => `\nMANUSCRIPT ${roman} UNLOCKED · ${title.toUpperCase()}`,
    solvedCampaign: (time, hintCopy, recordCopy, unlockCopy) => `✓ SOLVED  ·  ${time}  ·  ${hintCopy}${recordCopy}${unlockCopy}`,
    archive: 'ARCHIVE',
    next: 'NEXT',
    solvedDaily: (time, hintCopy, recordCopy) => `✓ DAILY SOLVED  ·  ${time}  ·  ${hintCopy}${recordCopy}`,
    streakRecent: (streak, recent) => `STREAK: ${streak}  ·  7 DAYS: ${recent}`,
    home: 'HOME',
    resetTitle: 'Reset puzzle?',
    resetBody: 'All marks on this board will be cleared.',
  },
  manuscripts: {
    'manuscript-i': 'Primer',
    'manuscript-ii': 'Deduction',
    'manuscript-iii': 'Rooms',
    'manuscript-iv': 'Mastery',
  },
};

export function getUiCopy(language: SupportedLanguage): UiCopy {
  return language === 'ru' ? RU : EN;
}
