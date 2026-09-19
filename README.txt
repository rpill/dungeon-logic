Dungeon Logic - remove UI hover audio

1. Extract BOTH files from this archive into the project root (next to package.json).
2. Run apply-remove-ui-hover.cmd.

The patch:
- removes every ui-hover playback call from UI buttons/cards/toolbars;
- removes ui-hover from AudioFeedbackService;
- removes ui-hover preload/key;
- deletes public/assets/audio/ui-hover.wav;
- keeps visual hover states and ui-click / gameplay sounds unchanged;
- updates audio sanity checks to enforce that hover audio stays removed.
