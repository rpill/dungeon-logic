import type { MasteryRankId } from '../mastery/MasteryProgress';
import type { SupportedLanguage } from './Language';

export type LevelSelectState = 'completed' | 'current' | 'unlocked' | 'locked';

export interface UiCopy {
  readonly common: {
    readonly backHome: string;
    readonly back: string;
    readonly levels: string;
    readonly statistics: string;
    readonly leaderboard: string;
    readonly settings: string;
    readonly howToPlay: string;
    readonly tutorial: string;
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
    readonly progress: (completed: number, total: number) => string;
    readonly state: Readonly<Record<LevelSelectState, string>>;
  };
  readonly home: {
    readonly levelsProgress: (completed: number, total: number) => string;
    readonly chooseLevel: string;
    readonly start: string;
    readonly continue: string;
    readonly tutorialStart: string;
    readonly tutorialContinue: string;
    readonly tutorialReplay: string;
    readonly levelContext: (slot: number) => string;
    readonly dailyLockedAfterLevel: string;
    readonly dailyUnavailable: string;
    readonly noDailyForTrustedDate: string;
    readonly dailySolved: string;
    readonly dailyNew: string;
    readonly streakSuffix: (streak: number) => string;
    readonly best: (time: string, streakSuffix: string) => string;
    readonly today: (streakSuffix: string) => string;
    readonly dailyLockedShort: string;
    readonly dailyUnavailableShort: string;
    readonly dailyNewShort: string;
    readonly dailySolvedShort: string;
    readonly dailyStreak: (streak: number) => string;
    readonly endless: string;
    readonly endlessSoon: string;
    readonly endlessLockedAfterLevel: string;
    readonly endlessSolved: (completed: number) => string;
    readonly endlessStreak: (current: number, best: number) => string;
    readonly endlessProgress: (completed: number, total: number, current: number, best: number) => string;
    readonly endlessFreePlay: (total: number) => string;
  };
  readonly mastery: {
    readonly title: string;
    readonly homeTitle: (rank: MasteryRankId) => string;
    readonly homeNext: (rank: MasteryRankId, remaining: number) => string;
    readonly maxRank: string;
    readonly nextRank: string;
    readonly newRank: string;
    readonly ratingMilestoneTitle: string;
    readonly ratingMilestoneReached: (milestone: string) => string;
    readonly continue: string;
    readonly rankLabel: (rank: MasteryRankId, title: string) => string;
    readonly campaign: string;
    readonly daily: string;
    readonly endless: string;
    readonly campaignRequirement: (target: number) => string;
    readonly dailyRequirement: (target: number) => string;
    readonly endlessRequirement: (target: number) => string;
    readonly rankTitles: Readonly<Record<MasteryRankId, string>>;
    readonly rankDescriptions: Readonly<Record<MasteryRankId, string>>;
    readonly rating: (rating: string) => string;
    readonly ratingLeaderboard: string;
  };
  readonly settings: {
    readonly title: string;
    readonly music: string;
    readonly sound: string;
    readonly language: string;
    readonly helpAndInfo: string;
    readonly rules: string;
    readonly on: string;
    readonly off: string;
    readonly languageName: Readonly<Record<SupportedLanguage, string>>;
  };
  readonly help: {
    readonly title: string;
    readonly utilityTitle: string;
    readonly done: string;
  };
  readonly stats: {
    readonly title: string;
    readonly months: readonly string[];
    readonly weekdays: readonly string[];
    readonly campaign: string;
    readonly daily: string;
    readonly overall: string;
    readonly solved: (solved: number, total: number) => string;
    readonly withoutHints: (count: number) => string;
    readonly totalSolved: (count: number) => string;
    readonly streakBest: (current: string, best: number) => string;
    readonly activeTime: (duration: string) => string;
    readonly puzzlesSolved: (count: number) => string;
    readonly hints: (count: number) => string;
  };
  readonly dailyHub: {
    readonly title: string;
    readonly todayTitle: string;
    readonly archiveTitle: string;
    readonly playToday: string;
    readonly replayToday: string;
    readonly leaderboard: string;
    readonly todayAttemptRules: string;
    readonly todayReplayRules: string;
    readonly todaySolved: (time: string) => string;
    readonly todaySolvedOutsideRating: (time: string) => string;
    readonly todayUnsolved: string;
    readonly todayUnavailable: string;
    readonly archiveProgress: (solved: number, total: number) => string;
    readonly archiveNotSolved: string;
    readonly archiveFirstResult: (time: string) => string;
    readonly archivePlay: string;
    readonly archiveReplay: string;
    readonly archiveOutsideRating: string;
    readonly archiveEmpty: string;
  };
  readonly masterRatingLeaderboard: {
    readonly title: string;
    readonly subtitle: string;
    readonly yourRating: (rating: string) => string;
    readonly yourPlace: (place: number) => string;
    readonly noEntry: string;
    readonly signInBody: string;
  };
  readonly leaderboard: {
    readonly title: string;
    readonly back: string;
    readonly subtitle: (date: string) => string;
    readonly firstResultOnly: string;
    readonly yourResult: (time: string) => string;
    readonly yourPlace: (place: number) => string;
    readonly noResult: string;
    readonly assistedResult: string;
    readonly playToRank: string;
    readonly signInTitle: string;
    readonly signInBody: string;
    readonly signIn: string;
    readonly unavailable: string;
    readonly localUnavailable: string;
    readonly noEntries: string;
    readonly playerFallback: string;
    readonly currentPlayerSuffix: string;
  };
  readonly game: {
    readonly back: string;
    readonly levelTitle: (slot: number) => string;
    readonly dailyTitle: string;
    readonly endlessTitle: (ordinal: number) => string;
    readonly endlessStreak: (streak: number) => string;
    readonly endlessFreePlayTitle: (ordinal: number) => string;
    readonly endlessFreePlayNoRating: string;
    readonly skip: string;
    readonly skipTitle: string;
    readonly skipBody: string;
    readonly skipFreePlayBody: string;
    readonly tutorialTitle: (slot: number, total: number) => string;
    readonly tutorialComplete: string;
    readonly startLevels: string;
    readonly rules: string;
    readonly menu: string;
    readonly continueGame: string;
    readonly exitLevels: string;
    readonly exitDaily: string;
    readonly exitHome: string;
    readonly mouseControls: string;
    readonly wall: string;
    readonly floor: string;
    readonly undo: string;
    readonly reset: string;
    readonly hint: string;
    readonly hintFree: (remaining: number) => string;
    readonly hintRewarded: string;
    readonly hintLocked: (time: string) => string;
    readonly hintRechargeStatus: (time: string) => string;
    readonly dailyHintOutsideRating: string;
    readonly onboardingDismiss: string;
    readonly hintWall: string;
    readonly hintFloor: string;
    readonly loadingAd: string;
    readonly show: string;
    readonly ad: string;
    readonly rewardedPrompt: string;
    readonly freeHintPrompt: (remaining: number) => string;
    readonly hintConfirmTitle: string;
    readonly freeHintsRemaining: (remaining: number) => string;
    readonly rewardedHintConfirmTitle: string;
    readonly rewardedHintConfirmMeta: string;
    readonly withoutHints: string;
    readonly hintsCount: (count: number) => string;
    readonly newRecord: string;
    readonly featuresUnlocked: string;
    readonly endlessUnlocked: string;
    readonly solvedCampaign: (time: string, hintCopy: string, recordCopy: string, unlockCopy: string) => string;
    readonly next: string;
    readonly solvedDaily: (time: string, hintCopy: string, recordCopy: string) => string;
    readonly dailyPractice: string;
    readonly dailyResultFixed: string;
    readonly dailyPlace: (place: number) => string;
    readonly dailyArchiveComplete: string;
    readonly dailyArchiveOutsideRating: string;
    readonly dailyArchiveFirstResult: (time: string) => string;
    readonly streakRecent: (streak: number, recent: string) => string;
    readonly home: string;
    readonly resetTitle: string;
    readonly resetBody: string;
  };
}


function ruCountForm(value: number, one: string, few: string, many: string): string {
  const integer = Math.abs(Math.floor(value));
  const mod10 = integer % 10;
  const mod100 = integer % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

const RU: UiCopy = {
  common: {
    backHome: '← ГЛАВНАЯ',
    back: '← НАЗАД',
    levels: 'УРОВНИ',
    statistics: 'СТАТИСТИКА',
    leaderboard: 'ТАБЛИЦА ЛИДЕРОВ',
    settings: 'НАСТРОЙКИ',
    howToPlay: 'КАК ИГРАТЬ',
    tutorial: 'ОБУЧЕНИЕ',
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
    progress: (completed, total) => `Пройдено: ${completed} / ${total}`,
    state: {
      completed: 'РЕШЁН',
      current: 'ТЕКУЩИЙ',
      unlocked: 'ДОСТУПЕН',
      locked: 'ЗАКРЫТ',
    },
  },
  home: {
    levelsProgress: (completed, total) => `Уровни · ${completed} / ${total}`,
    chooseLevel: 'ВЫБРАТЬ УРОВЕНЬ',
    start: 'НАЧАТЬ',
    continue: 'ПРОДОЛЖИТЬ',
    tutorialStart: 'НАЧАТЬ ОБУЧЕНИЕ',
    tutorialContinue: 'ПРОДОЛЖИТЬ ОБУЧЕНИЕ',
    tutorialReplay: 'ПРОЙТИ ОБУЧЕНИЕ СНОВА',
    levelContext: (slot) => `Уровень ${String(slot).padStart(2, '0')}`,
    dailyLockedAfterLevel: 'DAILY · ПОСЛЕ УРОВНЯ 5',
    dailyUnavailable: 'DAILY · НЕДОСТУПНО',
    noDailyForTrustedDate: 'Нет задания на доверенную дату',
    dailySolved: 'DAILY · РЕШЕНО',
    dailyNew: 'DAILY · НОВАЯ',
    streakSuffix: (streak) => streak > 0 ? ` · Серия ${streak}` : '',
    best: (time, streakSuffix) => `Результат ${time}${streakSuffix}`,
    today: (streakSuffix) => `Сегодня${streakSuffix}`,
    dailyLockedShort: 'ПОСЛЕ УРОВНЯ 5',
    dailyUnavailableShort: 'НЕДОСТУПНО',
    dailyNewShort: 'СЕГОДНЯ НОВАЯ',
    dailySolvedShort: 'СЕГОДНЯ РЕШЕНО',
    dailyStreak: (streak) => `Серия: ${streak}`,
    endless: 'ИСПЫТАНИЕ',
    endlessSoon: 'СКОРО',
    endlessLockedAfterLevel: 'ПОСЛЕ УРОВНЯ 8',
    endlessSolved: (completed) => `Решено: ${completed}`,
    endlessStreak: (current, best) => `Серия: ${current} · рекорд ${best}`,
    endlessProgress: (completed, total, current, best) => `Решено ${completed} / ${total} · серия ${current} · рекорд ${best}`,
    endlessFreePlay: (total) => `СВОБОДНАЯ ИГРА · ${total} / ${total}`,
  },
  mastery: {
    title: 'МАСТЕРСТВО',
    homeTitle: (rank) => `МАСТЕРСТВО ${rank}`,
    homeNext: (rank, remaining) => {
      const suffix = remaining % 10 === 1 && remaining % 100 !== 11
        ? 'условие'
        : remaining % 10 >= 2 && remaining % 10 <= 4 && (remaining % 100 < 12 || remaining % 100 > 14)
          ? 'условия'
          : 'условий';
      return `До ранга ${rank}: ${remaining} ${suffix}`;
    },
    maxRank: 'МАКСИМАЛЬНЫЙ РАНГ',
    nextRank: 'ДО СЛЕДУЮЩЕГО РАНГА',
    newRank: 'НОВЫЙ РАНГ',
    ratingMilestoneTitle: 'РЕЙТИНГ МАСТЕРА',
    ratingMilestoneReached: (milestone) => `ДОСТИГНУТА ОТМЕТКА ${milestone}`,
    continue: 'ПРОДОЛЖИТЬ',
    rankLabel: (rank, title) => `РАНГ ${rank} — ${title}`,
    campaign: 'Кампания',
    daily: 'Daily: решено',
    endless: 'Испытание: решено',
    campaignRequirement: (target) => `Кампания: пройдите ${target} ${ruCountForm(target, 'уровень', 'уровня', 'уровней')}`,
    dailyRequirement: (target) => `Daily: решите ${target} ${ruCountForm(target, 'задание', 'задания', 'заданий')}`,
    endlessRequirement: (target) => `Испытание: решите ${target} ${ruCountForm(target, 'головоломку', 'головоломки', 'головоломок')}`,
    rankTitles: {
      I: 'УЧЕНИК',
      II: 'ИССЛЕДОВАТЕЛЬ',
      III: 'ТАКТИК',
      IV: 'СТРАТЕГ',
      V: 'АРХИТЕКТОР',
      VI: 'АНАЛИТИК',
      VII: 'ЭКСПЕРТ',
      VIII: 'ГРОССМЕЙСТЕР',
      MASTER: 'МАСТЕР ЛАБИРИНТА',
    },
    rankDescriptions: {
      I: 'Вы начинаете читать язык лабиринта.',
      II: 'Базовые правила уже работают на вас.',
      III: 'Вы видите больше и думаете глубже.',
      IV: 'Сложные задачи больше не пугают.',
      V: 'Вы строите решение целиком.',
      VI: 'Закономерности видны раньше подсказок.',
      VII: 'Редкие сочетания правил стали привычными.',
      VIII: 'Вы решаете точно и без лишних ходов.',
      MASTER: 'Лабиринт больше не скрывает свою логику.',
    },
    rating: (rating) => `РЕЙТИНГ МАСТЕРА: ${rating}`,
    ratingLeaderboard: 'ТАБЛИЦА РЕЙТИНГА',
  },
  settings: {
    title: 'НАСТРОЙКИ',
    music: 'МУЗЫКА',
    sound: 'ЗВУК',
    language: 'ЯЗЫК',
    helpAndInfo: 'ПОМОЩЬ И ИНФОРМАЦИЯ',
    rules: 'ПРАВИЛА',
    on: 'ВКЛ',
    off: 'ВЫКЛ',
    languageName: { ru: 'РУССКИЙ', en: 'ENGLISH' },
  },
  help: {
    title: 'ПРАВИЛА',
    utilityTitle: 'УПРАВЛЕНИЕ',
    done: 'ПОНЯТНО',
  },
  stats: {
    title: 'СТАТИСТИКА',
    months: ['ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ', 'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'],
    weekdays: ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
    campaign: 'КАМПАНИЯ',
    daily: 'DAILY',
    overall: 'ОБЩЕЕ',
    solved: (solved, total) => `Решено ${solved} / ${total}`,
    withoutHints: (count) => `Без подсказок ${count}`,
    totalSolved: (count) => `Всего решено ${count}`,
    streakBest: (current, best) => `Серия ${current} · Лучшая ${best}`,
    activeTime: (duration) => `Активное время ${duration}`,
    puzzlesSolved: (count) => `Решено задач ${count}`,
    hints: (count) => `Подсказок ${count}`,
  },
  dailyHub: {
    title: 'DAILY',
    todayTitle: 'СЕГОДНЯ',
    archiveTitle: 'КАЛЕНДАРЬ',
    playToday: 'ИГРАТЬ СЕГОДНЯ',
    replayToday: 'ПОВТОРИТЬ',
    leaderboard: 'ТАБЛИЦА ЛИДЕРОВ',
    todayAttemptRules: 'Время идёт до завершения, даже если выйти.',
    todayReplayRules: 'Результат уже зафиксирован. Повтор его не изменит.',
    todaySolved: (time) => `Результат зафиксирован · ${time}`,
    todaySolvedOutsideRating: (time) => `Пройдено вне таблицы лидеров · ${time}`,
    todayUnsolved: 'Первое прохождение без подсказок попадёт в таблицу лидеров.',
    todayUnavailable: 'На доверенную сегодняшнюю дату задания нет.',
    archiveProgress: (solved, total) => `Пройдено ${solved} / ${total}`,
    archiveNotSolved: 'НЕ ПРОЙДЕНО',
    archiveFirstResult: (time) => `Первое время · ${time}`,
    archivePlay: 'ИГРАТЬ',
    archiveReplay: 'ПЕРЕИГРАТЬ',
    archiveOutsideRating: 'Архивные Daily не участвуют в таблице лидеров.',
    archiveEmpty: 'Старых Daily пока нет.',
  },
  masterRatingLeaderboard: {
    title: 'РЕЙТИНГ МАСТЕРОВ',
    subtitle: 'MASTER RATING',
    yourRating: (rating) => `Твой рейтинг · ${rating}`,
    yourPlace: (place) => `Твоё место · #${place}`,
    noEntry: 'Получи ранг MASTER, чтобы попасть в таблицу.',
    signInBody: 'Войди в Яндекс, чтобы сохранить рейтинг и увидеть своё место.',
  },
  leaderboard: {
    title: 'ТАБЛИЦА ЛИДЕРОВ',
    back: '← DAILY',
    subtitle: (date) => `DAILY · ${date}`,
    firstResultOnly: 'В зачёт идёт только первое успешное прохождение без подсказок.',
    yourResult: (time) => `Твой результат · ${time}`,
    yourPlace: (place) => `Твоё место · #${place}`,
    noResult: 'У тебя пока нет результата сегодня.',
    assistedResult: 'Результат с подсказками не участвует в таблице лидеров.',
    playToRank: 'Пройди Daily без подсказок, чтобы попасть в таблицу лидеров.',
    signInTitle: 'ВОЙДИ В ЯНДЕКС',
    signInBody: 'Войди, чтобы сохранить результат и увидеть своё место.',
    signIn: 'ВОЙТИ В ЯНДЕКС',
    unavailable: 'Таблица лидеров сейчас недоступна.',
    localUnavailable: 'Таблица лидеров доступна в версии Яндекс Игр.',
    noEntries: 'Пока нет результатов.',
    playerFallback: 'Игрок',
    currentPlayerSuffix: ' · ВЫ',
  },
  game: {
    back: '← НАЗАД',
    levelTitle: (slot) => `УРОВЕНЬ ${slot}`,
    dailyTitle: 'DAILY',
    endlessTitle: (ordinal) => `ИСПЫТАНИЕ ${ordinal}`,
    endlessStreak: (streak) => `СЕРИЯ ${streak}`,
    endlessFreePlayTitle: (ordinal) => `СВОБОДНАЯ ИГРА ${ordinal}`,
    endlessFreePlayNoRating: 'КАТАЛОГ ПРОЙДЕН · РЕЙТИНГ НЕ НАЧИСЛЯЕТСЯ',
    skip: 'ПРОПУСТИТЬ',
    skipTitle: 'ПРОПУСТИТЬ УРОВЕНЬ?',
    skipBody: 'Серия сбросится. Этот уровень вернётся позже.',
    skipFreePlayBody: 'Перейти к следующему уровню? Рейтинг уже не меняется.',
    tutorialTitle: (slot, total) => `ОБУЧЕНИЕ ${slot} / ${total}`,
    tutorialComplete: 'ОБУЧЕНИЕ ПРОЙДЕНО\nТы знаешь все правила подземелья.',
    startLevels: 'НАЧАТЬ ИГРУ',
    rules: 'ПРАВИЛА',
    menu: 'МЕНЮ',
    continueGame: 'ПРОДОЛЖИТЬ',
    exitLevels: 'ВЫЙТИ В УРОВНИ',
    exitDaily: 'ВЫЙТИ В DAILY',
    exitHome: 'ВЫЙТИ НА ГЛАВНУЮ',
    mouseControls: 'ЛКМ: Стена   •   ПКМ: Пол',
    wall: 'СТЕНА',
    floor: 'ПОЛ',
    undo: 'ОТМЕНА',
    reset: 'СБРОС',
    hint: 'ПОДСКАЗКА',
    hintFree: (remaining) => `ПОДСКАЗКА ×${remaining}`,
    hintRewarded: 'ПОДСКАЗКА',
    hintLocked: (time) => `🔒 ${time}`,
    hintRechargeStatus: (time) => `Бесплатная подсказка через ${time}`,
    dailyHintOutsideRating: 'Подсказка поможет пройти Daily, но результат не попадёт в таблицу лидеров.',
    onboardingDismiss: 'НАЖМИ НА СООБЩЕНИЕ, ЧТОБЫ ЗАКРЫТЬ',
    hintWall: 'Мигающая клетка — СТЕНА',
    hintFloor: 'Мигающая клетка — ПОЛ',
    loadingAd: 'ЗАГРУЗКА РЕКЛАМЫ…',
    show: 'ПОКАЗАТЬ',
    ad: 'РЕКЛАМА',
    rewardedPrompt: '1 РЕКЛАМА = 1 ПОДСКАЗКА. ПОКАЗАТЬ РЕКЛАМУ?',
    freeHintPrompt: (remaining) => `Показать подсказку? Бесплатных подсказок: ${remaining}`,
    hintConfirmTitle: 'ПОКАЗАТЬ ПОДСКАЗКУ?',
    freeHintsRemaining: (remaining) => `БЕСПЛАТНЫХ ПОДСКАЗОК: ${remaining}`,
    rewardedHintConfirmTitle: 'ПОКАЗАТЬ ПОДСКАЗКУ?',
    rewardedHintConfirmMeta: '1 РЕКЛАМА = 1 ПОДСКАЗКА',
    withoutHints: 'БЕЗ ПОДСКАЗОК',
    hintsCount: (count) => `ПОДСКАЗОК: ${count}`,
    newRecord: '  ·  НОВЫЙ РЕКОРД',
    featuresUnlocked: 'ОТКРЫТО: DAILY\nМожно открыть сейчас или продолжить кампанию.',
    endlessUnlocked: 'ОТКРЫТО: ИСПЫТАНИЕ\nМожно открыть сейчас или продолжить кампанию.',
    solvedCampaign: (time, hintCopy, recordCopy, unlockCopy) => `✓ РЕШЕНО  ·  ${time}  ·  ${hintCopy}${recordCopy}${unlockCopy}`,
    next: 'ДАЛЬШЕ',
    solvedDaily: (time, hintCopy, recordCopy) => `✓ DAILY РЕШЁН  ·  ${time}  ·  ${hintCopy}${recordCopy}`,
    dailyPractice: 'ВНЕ ЗАЧЁТА',
    dailyResultFixed: 'РЕЗУЛЬТАТ ЗАФИКСИРОВАН',
    dailyPlace: (place) => `МЕСТО #${place}` ,
    dailyArchiveComplete: 'АРХИВНЫЙ DAILY ПРОЙДЕН',
    dailyArchiveOutsideRating: 'ЭТОТ РЕЗУЛЬТАТ НЕ УЧАСТВУЕТ В ТАБЛИЦЕ ЛИДЕРОВ',
    dailyArchiveFirstResult: (time) => `ПЕРВОЕ ВРЕМЯ · ${time}`,
    streakRecent: (streak, recent) => `СЕРИЯ: ${streak}  ·  7 ДНЕЙ: ${recent}`,
    home: 'ГЛАВНАЯ',
    resetTitle: 'СБРОСИТЬ ЗАДАЧУ?',
    resetBody: 'Все отметки на этом поле будут удалены.',
  },
};

const EN: UiCopy = {
  common: {
    backHome: '← HOME',
    back: '← BACK',
    levels: 'LEVELS',
    statistics: 'STATISTICS',
    leaderboard: 'LEADERBOARD',
    settings: 'SETTINGS',
    howToPlay: 'HOW TO PLAY',
    tutorial: 'TUTORIAL',
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
    progress: (completed, total) => `Completed: ${completed} / ${total}`,
    state: {
      completed: 'COMPLETED',
      current: 'CURRENT',
      unlocked: 'UNLOCKED',
      locked: 'LOCKED',
    },
  },
  home: {
    levelsProgress: (completed, total) => `Levels · ${completed} / ${total}`,
    chooseLevel: 'CHOOSE LEVEL',
    start: 'START',
    continue: 'CONTINUE',
    tutorialStart: 'START TUTORIAL',
    tutorialContinue: 'CONTINUE TUTORIAL',
    tutorialReplay: 'REPLAY TUTORIAL',
    levelContext: (slot) => `Level ${String(slot).padStart(2, '0')}`,
    dailyLockedAfterLevel: 'DAILY · AFTER LEVEL 5',
    dailyUnavailable: 'DAILY · UNAVAILABLE',
    noDailyForTrustedDate: 'No puzzle for the trusted date',
    dailySolved: 'DAILY · SOLVED',
    dailyNew: 'DAILY · NEW',
    streakSuffix: (streak) => streak > 0 ? ` · Streak ${streak}` : '',
    best: (time, streakSuffix) => `Result ${time}${streakSuffix}`,
    today: (streakSuffix) => `Today${streakSuffix}`,
    dailyLockedShort: 'AFTER LEVEL 5',
    dailyUnavailableShort: 'UNAVAILABLE',
    dailyNewShort: 'NEW TODAY',
    dailySolvedShort: 'SOLVED TODAY',
    dailyStreak: (streak) => `Streak: ${streak}`,
    endless: 'CHALLENGE',
    endlessSoon: 'COMING SOON',
    endlessLockedAfterLevel: 'AFTER LEVEL 8',
    endlessSolved: (completed) => `Solved: ${completed}`,
    endlessStreak: (current, best) => `Streak: ${current} · best ${best}`,
    endlessProgress: (completed, total, current, best) => `Solved ${completed} / ${total} · streak ${current} · best ${best}`,
    endlessFreePlay: (total) => `FREE PLAY · ${total} / ${total}`,
  },
  mastery: {
    title: 'MASTERY',
    homeTitle: (rank) => `MASTERY ${rank}`,
    homeNext: (rank, remaining) => `To rank ${rank}: ${remaining} ${remaining === 1 ? 'condition' : 'conditions'}`,
    maxRank: 'MAXIMUM RANK',
    nextRank: 'TO THE NEXT RANK',
    newRank: 'NEW RANK',
    ratingMilestoneTitle: 'MASTER RATING',
    ratingMilestoneReached: (milestone) => `MILESTONE ${milestone} REACHED`,
    continue: 'CONTINUE',
    rankLabel: (rank, title) => `RANK ${rank} — ${title}`,
    campaign: 'Campaign',
    daily: 'Daily: solved',
    endless: 'Challenge: solved',
    campaignRequirement: (target) => `Campaign: complete ${target} ${target === 1 ? 'level' : 'levels'}`,
    dailyRequirement: (target) => `Daily: solve ${target} ${target === 1 ? 'puzzle' : 'puzzles'}`,
    endlessRequirement: (target) => `Challenge: solve ${target} ${target === 1 ? 'puzzle' : 'puzzles'}`,
    rankTitles: {
      I: 'APPRENTICE',
      II: 'EXPLORER',
      III: 'TACTICIAN',
      IV: 'STRATEGIST',
      V: 'ARCHITECT',
      VI: 'ANALYST',
      VII: 'EXPERT',
      VIII: 'GRANDMASTER',
      MASTER: 'LABYRINTH MASTER',
    },
    rankDescriptions: {
      I: 'You are learning the language of the labyrinth.',
      II: 'The basic rules now work in your favor.',
      III: 'You see more and think deeper.',
      IV: 'Harder puzzles no longer intimidate you.',
      V: 'You build the whole solution, not just moves.',
      VI: 'Patterns appear before hints are needed.',
      VII: 'Rare rule combinations feel familiar.',
      VIII: 'You solve precisely and without wasted moves.',
      MASTER: 'The labyrinth no longer hides its logic.',
    },
    rating: (rating) => `MASTER RATING: ${rating}`,
    ratingLeaderboard: 'RATING LEADERBOARD',
  },
  settings: {
    title: 'SETTINGS',
    music: 'MUSIC',
    sound: 'SOUND',
    language: 'LANGUAGE',
    helpAndInfo: 'HELP & INFORMATION',
    rules: 'RULES',
    on: 'ON',
    off: 'OFF',
    languageName: { ru: 'РУССКИЙ', en: 'ENGLISH' },
  },
  help: {
    title: 'RULES',
    utilityTitle: 'CONTROLS',
    done: 'GOT IT',
  },
  stats: {
    title: 'STATISTICS',
    months: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
    weekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'],
    campaign: 'CAMPAIGN',
    daily: 'DAILY',
    overall: 'OVERALL',
    solved: (solved, total) => `Solved ${solved} / ${total}`,
    withoutHints: (count) => `Without hints ${count}`,
    totalSolved: (count) => `Total solved ${count}`,
    streakBest: (current, best) => `Streak ${current} · Best ${best}`,
    activeTime: (duration) => `Active time ${duration}`,
    puzzlesSolved: (count) => `Puzzles solved ${count}`,
    hints: (count) => `Hints ${count}`,
  },
  dailyHub: {
    title: 'DAILY',
    todayTitle: 'TODAY',
    archiveTitle: 'CALENDAR',
    playToday: 'PLAY TODAY',
    replayToday: 'REPLAY',
    leaderboard: 'LEADERBOARD',
    todayAttemptRules: 'Time keeps running until completion, even if you leave.',
    todayReplayRules: 'Your result is already locked. Replays will not change it.',
    todaySolved: (time) => `Result locked · ${time}`,
    todaySolvedOutsideRating: (time) => `Completed outside leaderboard · ${time}`,
    todayUnsolved: 'Your first solve without hints enters the leaderboard.',
    todayUnavailable: 'There is no puzzle for the trusted date today.',
    archiveProgress: (solved, total) => `Solved ${solved} / ${total}`,
    archiveNotSolved: 'NOT SOLVED',
    archiveFirstResult: (time) => `First time · ${time}`,
    archivePlay: 'PLAY',
    archiveReplay: 'REPLAY',
    archiveOutsideRating: 'Archived Dailies do not enter the leaderboard.',
    archiveEmpty: 'No older Dailies yet.',
  },
  masterRatingLeaderboard: {
    title: 'MASTER RATING',
    subtitle: 'MASTER RATING',
    yourRating: (rating) => `Your rating · ${rating}`,
    yourPlace: (place) => `Your place · #${place}`,
    noEntry: 'Reach MASTER rank to enter this leaderboard.',
    signInBody: 'Sign in to Yandex to save your rating and see your place.',
  },
  leaderboard: {
    title: 'LEADERBOARD',
    back: '← DAILY',
    subtitle: (date) => `DAILY · ${date}`,
    firstResultOnly: 'Only the first successful solve without hints counts.',
    yourResult: (time) => `Your result · ${time}`,
    yourPlace: (place) => `Your place · #${place}`,
    noResult: 'You do not have a result for today yet.',
    assistedResult: 'Results with hints do not enter the leaderboard.',
    playToRank: 'Solve today’s Daily without hints to enter the leaderboard.',
    signInTitle: 'SIGN IN TO YANDEX',
    signInBody: 'Sign in to save your result and see your place.',
    signIn: 'SIGN IN TO YANDEX',
    unavailable: 'Leaderboard is currently unavailable.',
    localUnavailable: 'The leaderboard is available in the Yandex Games version.',
    noEntries: 'No results yet.',
    playerFallback: 'Player',
    currentPlayerSuffix: ' · YOU',
  },
  game: {
    back: '← BACK',
    levelTitle: (slot) => `LEVEL ${slot}`,
    dailyTitle: 'DAILY',
    endlessTitle: (ordinal) => `CHALLENGE ${ordinal}`,
    endlessStreak: (streak) => `STREAK ${streak}`,
    endlessFreePlayTitle: (ordinal) => `FREE PLAY ${ordinal}`,
    endlessFreePlayNoRating: 'CATALOG COMPLETE · NO RATING AWARDED',
    skip: 'SKIP',
    skipTitle: 'SKIP THIS PUZZLE?',
    skipBody: 'Your streak will reset. This puzzle will return later.',
    skipFreePlayBody: 'Move to the next puzzle? Rating no longer changes.',
    tutorialTitle: (slot, total) => `TUTORIAL ${slot} / ${total}`,
    tutorialComplete: 'TUTORIAL COMPLETE\nYou know every dungeon rule.',
    startLevels: 'START GAME',
    rules: 'RULES',
    menu: 'MENU',
    continueGame: 'CONTINUE',
    exitLevels: 'EXIT TO LEVELS',
    exitDaily: 'EXIT TO DAILY',
    exitHome: 'EXIT TO HOME',
    mouseControls: 'LMB: Wall   •   RMB: Floor',
    wall: 'WALL',
    floor: 'FLOOR',
    undo: 'UNDO',
    reset: 'RESET',
    hint: 'HINT',
    hintFree: (remaining) => `HINT ×${remaining}`,
    hintRewarded: 'HINT',
    hintLocked: (time) => `🔒 ${time}`,
    hintRechargeStatus: (time) => `Free hint in ${time}`,
    dailyHintOutsideRating: 'A hint can finish the Daily, but this run will not enter the leaderboard.',
    onboardingDismiss: 'CLICK THE MESSAGE TO CLOSE',
    hintWall: 'Blinking cell — WALL',
    hintFloor: 'Blinking cell — FLOOR',
    loadingAd: 'LOADING AD…',
    show: 'SHOW',
    ad: 'AD',
    rewardedPrompt: '1 AD = 1 HINT. SHOW AN AD?',
    freeHintPrompt: (remaining) => `Show a hint? Free hints: ${remaining}`,
    hintConfirmTitle: 'SHOW A HINT?',
    freeHintsRemaining: (remaining) => `FREE HINTS: ${remaining}`,
    rewardedHintConfirmTitle: 'SHOW A HINT?',
    rewardedHintConfirmMeta: '1 AD = 1 HINT',
    withoutHints: 'NO HINTS',
    hintsCount: (count) => `HINTS: ${count}`,
    newRecord: '  ·  NEW RECORD',
    featuresUnlocked: 'UNLOCKED: DAILY\nOpen it now or continue the Campaign.',
    endlessUnlocked: 'UNLOCKED: CHALLENGE\nOpen it now or continue the Campaign.',
    solvedCampaign: (time, hintCopy, recordCopy, unlockCopy) => `✓ SOLVED  ·  ${time}  ·  ${hintCopy}${recordCopy}${unlockCopy}`,
    next: 'NEXT',
    solvedDaily: (time, hintCopy, recordCopy) => `✓ DAILY SOLVED  ·  ${time}  ·  ${hintCopy}${recordCopy}`,
    dailyPractice: 'PRACTICE · UNRANKED',
    dailyResultFixed: 'RESULT LOCKED',
    dailyPlace: (place) => `PLACE #${place}`,
    dailyArchiveComplete: 'ARCHIVED DAILY COMPLETE',
    dailyArchiveOutsideRating: 'THIS RESULT DOES NOT ENTER THE LEADERBOARD',
    dailyArchiveFirstResult: (time) => `FIRST TIME · ${time}`,
    streakRecent: (streak, recent) => `STREAK: ${streak}  ·  7 DAYS: ${recent}`,
    home: 'HOME',
    resetTitle: 'RESET PUZZLE?',
    resetBody: 'All marks on this board will be cleared.',
  },
};

export function getUiCopy(language: SupportedLanguage): UiCopy {
  return language === 'ru' ? RU : EN;
}
