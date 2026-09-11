# Dungeon Logic audio feedback

Short one-shot feedback sounds used by the game. Runtime assets are 48 kHz / 16-bit PCM WAV.

V7 sound language:
- UI click: user-selected clean click source, trimmed and normalized for the game
- UI hover: very quiet fabric-like rustle used only on interactive UI buttons/cards
- Floor marker: one shared ultra-thin tick for both placing and removing the red mark
- Wall place: dense tactile tap
- Wall remove: ultra-short retro console-style collapse / explosion cue ("dysh"), RMS-matched to wall placement
- Completion: brighter, richer victory cue built from the two user-selected win samples while keeping controlled loudness
- Monster and chest clicks intentionally have no dedicated sound
- Gameplay-cell hover intentionally stays silent

User-selected Mixkit sources supplied in chat:
- `click.mp3` — source for the UI click
- `mixkit-small-win-2020.wav` — bright melodic layer for completion
- `mixkit-completion-of-a-level-2063.wav` — body/resolution layer for completion

The remaining feedback assets are project-authored sounds from the earlier sound passes.
