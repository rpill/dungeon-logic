# Dungeon Logic — physical display QA

Automated screenshots and brightness filters screen for problems; they do not establish how the game looks on a physical OLED or IPS panel.

## Devices and conditions

- Test at least one ordinary OLED phone and one ordinary IPS phone in portrait, plus a desktop monitor. Record model, OS, browser, viewport and display scaling.
- On each phone, repeat at roughly 100%, 50% and 20% brightness in normal indoor light. Turn off adaptive brightness, night filters and extra dimming while comparing; record if the device forces them on.
- On desktop, check 1920×1080, 1366×768 and a window about 640 px high. Repeat with the browser zoom at its normal setting.

## Check at each brightness

- Gameplay: identify floor versus walls, cell boundaries, red and completed clues, placed WALL and FLOOR, monsters, chest, selected tool, hint target and enabled versus disabled buttons without relying only on hue.
- Levels: distinguish current, started, completed, unstarted and locked cards. Started thumbnails must show saved walls; completed thumbnails show the solution. FLOOR is not added to thumbnails.
- Daily: distinguish today, completed, missed, future and unavailable days; verify the selected day and disabled month arrow. Check a 31-day month and archive boundaries.
- Mastery and Rank Up: read the emblem, requirement values, progress bars and the phone rank track, including MASTER.
- Leaderboards: read own result, own row, long nicknames and large values; check empty and unavailable messages.
- Dialogs and Completion: read Hint explanation, confirmation text, result statistics and both CTA labels. The solved board should remain identifiable behind Completion.
- Rules: read both languages and reach the bottom action by scrolling; check that examples and dividers remain distinct.
- Test hover, pressed, disabled and locked controls where the device supports those interactions.

## Result record

For each issue record **device / display type / brightness / ambient light / viewport / screen and state / expected distinction / observed problem / photo or screenshot / severity**. Mark a state as passed only after looking at the physical display. A failed distinction in functional information requires a visual fix; decorative background detail may disappear at low brightness.
