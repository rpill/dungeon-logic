# Mastery System Design

## Goal

Add a visible, non-XP mastery meta-system that summarizes real player progress across Campaign, Daily, and Endless, using the approved Dungeon Logic visual concept: a compact Mastery strip on Home, a dedicated Mastery screen, and a restrained rank-up overlay after meaningful wins.

## Product rules

- Mastery is not a playable mode and does not become a fourth large Home card.
- No XP, currencies, or repeatable grind points.
- Mastery rank never decreases.
- Campaign contributes to early ranks only.
- Daily uses **best streak**, not current streak, so missing a later day never lowers rank.
- Endless uses **best clean streak**. A clean Endless solve is a solve with zero hints. Any Endless solve that used one or more hints resets the current clean streak to zero.
- Campaign Clean is not part of Mastery.
- Rank is derived from profile metrics rather than persisted separately.
- Rank-up is detected by comparing the derived rank immediately before and after a completion.

## Rank ladder

| Rank | Title (RU) | Requirements |
| --- | --- | --- |
| I | Ученик | none |
| II | Исследователь | Campaign 8 |
| III | Тактик | Campaign 24; Endless best clean streak 3 |
| IV | Стратег | Campaign 40; Daily best streak 3; Endless best clean streak 5 |
| V | Архитектор | Campaign 64; Daily best streak 5; Endless best clean streak 10 |
| VI | Аналитик | Daily best streak 10; Endless best clean streak 15 |
| VII | Эксперт | Daily best streak 15; Endless best clean streak 25 |
| VIII | Гроссмейстер | Daily best streak 20; Endless best clean streak 35 |
| MASTER | Мастер Лабиринта | Daily best streak 30; Endless best clean streak 50 |

English copy mirrors the same meanings: Apprentice, Explorer, Tactician, Strategist, Architect, Analyst, Expert, Grandmaster, Labyrinth Master.

## Home presentation

A compact horizontal Mastery strip sits between the yellow Continue CTA and the Campaign/Daily cards. It contains:

- left: labyrinth-seal emblem;
- center: `МАСТЕРСТВО III`;
- secondary line: `До ранга IV: 2 условия`;
- right: navigation chevron.

The whole strip is clickable and opens `MasteryScene`. It uses the existing high-quality Home wide-panel visual language and must not alter existing yellow/red/default buttons.

## Mastery screen

Use the standard `MetaPageHeader` with back button and title `МАСТЕРСТВО`.

Content, top to bottom:

1. Large labyrinth seal with current rank numeral / MASTER label.
2. `РАНГ III — ТАКТИК` and a short one-line descriptor.
3. `До следующего ранга` panel with only the requirements for the next rank. Completed rows use a muted gold check; incomplete rows use a cool outlined circle.
4. Rank path `I II III IV V VI VII VIII MASTER`. Past/current ranks are highlighted; future ranks are muted. The mobile path remains one compact row and does not scroll.
5. No statistics dashboard, XP, or unrelated metrics.

## Visual identity

The approved rank symbol is the **labyrinth seal**: a hexagonal dungeon-metal/stone badge with a central labyrinth glyph. Do not use stars, generic medals, trophies, shields with crowns, or F2P-style reward iconography.

Use four high-quality visual tiers while keeping one consistent shape:

- I–II: dark stone / steel;
- III–IV: polished steel with restrained gold;
- V–VIII: stronger gold labyrinth and rim accents;
- MASTER: ornate gold-dominant version.

The Roman numeral / MASTER label is rendered by UI text, not baked into the emblem asset.

## Completion integration

After any Campaign, ranked Daily, or Endless completion, compare Mastery before and after the profile mutation.

- No relevant progress: normal completion UI only.
- Relevant next-rank requirement progressed: append one compact line such as `ENDLESS: чистая серия 4 / 5`.
- Requirement completed: use a check marker in that compact line.
- Rank advanced: show the approved rank-up overlay before returning to the normal completion actions. The overlay shows `НОВЫЙ РАНГ`, the large labyrinth seal, rank/title, a restrained short descriptor, and one `ПРОДОЛЖИТЬ` button. Dismissing it returns to the already-prepared normal completion state so campaign unlock buttons / Next / Home are preserved.

Use the existing completion sound for the first implementation; do not add a new audio asset until a dedicated rank-up sound exists.

## Persistence

Profile schema advances from v5 to v6 only to add Endless clean-streak persistence:

- `endless.currentCleanStreak: number`
- `endless.bestCleanStreak: number`

Existing v5 users migrate both values to zero. Daily already persists `bestStreak`; Campaign completion count is derived from `completedLevelIds`.

## Analytics

Add events for:

- `mastery_open` with current rank;
- `mastery_rank_up` with from/to rank and source mode.

Do not emit per-frame or repeated Home-view Mastery analytics.
