# Dungeon Logic UI System — Design Spec

## 1. Цель
Привести все экраны Dungeon Logic к одному визуальному языку без переделки игрового поля и фона. Главная сцена служит базовым ориентиром, но её карточки не копируются буквально во все окна. Итог: любой экран должен восприниматься как часть одной игры, а не как смесь старых и новых UI-систем.

## 2. Визуальные принципы
1. Moody dungeon: фон атмосферный, но не конкурирует с UI.
2. Readable puzzle UI: текст и данные читаются мгновенно.
3. Warm goals, cool surfaces: холодные синие поверхности, тёплое золото для CTA/акцентов.
4. Soft fantasy stone: стилизованный игровой камень, без тяжёлой реалистичной рамки.
5. Component-first: новые окна собираются из готовых компонентов, а не рисуются отдельно.

## 3. Цветовые токены
### Background
- `bg.deep` = `#0D1127`
- `bg.blue` = `#121D3A`
- `bg.overlay` = `#070B19`

### Surfaces
- `surface.inset` = `#0F2039`
- `surface.base` = `#1B2A4D`
- `surface.raised` = `#2F4B69`
- `surface.highlight` = `#3C5887`

### Borders
- `border.dark` = `#18314F`
- `border.normal` = `#536C94`
- `border.bright` = `#7894BA`

### Text
- `text.primary` = `#F8F1DA`
- `text.secondary` = `#CBD3E0`
- `text.muted` = `#8E9BB4`
- `text.disabled` = `#66738D`

### Semantic
- `accent.gold` = `#EFB146`
- `accent.goldBright` = `#EEC358`
- `success` = `#71CDB8`
- `danger` = `#C86672`
- `warning` = `#E7954B`

## 4. Роли цветов
- Gold: primary CTA, selected/current, важный прогресс.
- Blue: стандартные поверхности и UI chrome.
- Dark inset: строки данных, stats, settings rows, mastery rows.
- Teal: complete/success.
- Red: destructive actions only.
- Gameplay red/orange marks остаются отдельным semantic layer и не привязываются к `danger`.

## 5. Surface hierarchy
### Level 1 — Shell
Большая внешняя поверхность: Home card, Mastery panel, Daily top panel, leaderboard body, modal.

### Level 2 — Inset
Простой тёмный rounded rectangle с мягким border. Без ассета, болтов и сколов. Используется для rows, stats, settings, leaderboard entries, tutorial/info.

### Level 3 — Control
Интерактивный элемент: primary / secondary / danger button, switch, selector.

## 6. Core components
Нужно централизовать следующие компоненты:
- `UiPanel`
- `UiInsetRow`
- `UiModal`
- `UiButton`
- `UiSceneHeader`
- `UiSectionHeader`
- `UiProgressBar`
- `UiStatusBadge`

Сцены не должны рисовать собственные случайные rounded rectangles, borders, shadows и цвета, если это покрывается компонентом.

## 7. Modal system
### Compact modal
Reset, hint confirm, pause/confirm.
- лёгкий shell
- тонкая рамка
- слабая тень
- padding 20–24
- без огромных креплений

### Tall modal
Rank-up / reward moment.
- декоративнее compact modal
- главный акцент на эмблеме/награде, не на рамке
- кнопка всегда внутри видимой панели

### Tutorial/info panel
Не modal. Это `UiInsetRow/UiInfoPanel`: тёмный fill, тонкий border, без stone asset.

## 8. Typography roles
- `display`: scene title — 30–34 desktop, 26–30 compact, 22–26 mobile
- `heading`: panel/modal title — 20–24 desktop, 18–20 mobile
- `bodyStrong`: 15–17 desktop, 14–16 mobile
- `body`: 13–15 desktop, 12–14 mobile
- `meta`: 11–12 desktop minimum, 10–11 mobile minimum

Запрещается использовать мелкий технический текст <10px для пользовательской информации.

## 9. Spacing scale
Единая шкала: `4 / 8 / 12 / 16 / 24 / 32 / 48`.

- Card padding desktop: 24
- Compact desktop: 16–20
- Mobile: 12–16
- Tight group gap: 8
- Normal gap: 12–16
- Section gap: 24–32

## 10. Density modes
Вместо случайных breakpoint'ов в каждой сцене вводятся три density:
- `comfortable`: обычный desktop
- `compact`: низкий desktop (примерно 640–800px высоты)
- `mobile`: portrait phone

Компонент остаётся тем же, меняются только размеры/spacing/fonts.

## 11. Background contrast rules
- центральная content-safe zone должна быть спокойнее фона по контрасту;
- яркие фоновые элементы не должны пересекаться с текстовыми зонами;
- overlay затемняет фон единообразно через `bg.overlay`, а не локальными случайными alpha/shadow решениями;
- UI shell должен иметь достаточный contrast относительно фона без чрезмерно яркого синего.

## 12. Экранные решения
### Home
Эталон meta-UI. Сохраняется как база, только нормализуются secondary text / spacing / mastery strip.

### Mastery
Большой shell + inset rows + единый progress component. Без новых декоративных рамок.

### Daily
Top shell + чёткая hierarchy. Calendar states стандартизируются: future / available / solved / today / selected.

### Settings
Один shell, внутри inset rows. Убираются SaaS-like двойные рамки.

### Leaderboard
Shell + header + data rows + user highlight + top-3 states + empty state.

### Gameplay
Поле не трогаем. Header/HUD переводим на общие tokens/components без изменения игровой логики.

### Pause / Reset / Hint
Собираются из compact modal.

### Tutorial
Собирается из info/inset panel, не из modal asset.

### Rank-up
Tall modal с emphasis на seal, гарантированный containment.

### Victory
Собирается из общей shell/row/button системы, без отдельного UI-языка.

## 13. Технические ограничения
- Phaser + TypeScript.
- Без массовой генерации новых ассетов: ассет нужен только там, где surface реально требует art-texture.
- NineSlice только для shell/modal/card families.
- Inset rows рисуются программно.
- Все цвета/типографика/spacing берутся из theme, а не hardcode в Scene.
- Mobile только portrait.
- Desktop должен корректно работать на высоте ~640px и выше.

## 14. Rollout
### Phase 1 — Foundation
- `UiTheme`
- density resolver
- typography helpers
- `UiPanel`
- `UiInsetRow`
- `UiButton`
- `UiModal`
- `UiSceneHeader`
- `UiProgressBar`

### Phase 2 — Reference screens
1. Home
2. Mastery
3. Gameplay

Проверка на 1920×1080, 1920×650, mobile portrait.

### Phase 3 — Meta screens
4. Levels
5. Daily
6. Settings
7. Leaderboard

### Phase 4 — Overlays / completion
8. Pause
9. Reset
10. Hint confirm
11. Tutorial
12. Rank-up
13. Victory

## 15. Definition of done
UI-system считается внедрённой, когда:
- в сценах нет случайных hardcoded цветов/бордеров для стандартных UI-компонентов;
- одна и та же semantic роль выглядит одинаково на всех экранах;
- нет пользовательского текста <10px;
- все окна помещаются на desktop 640–650px и mobile portrait;
- модалки не выходят за свои видимые bounds;
- Home, Mastery, Daily, Settings, Leaderboard, Gameplay визуально воспринимаются как одна игра;
- contrast проверен на фоне без потери вторичного текста.
