Dungeon Logic — gameplay navigation/readability patch

Replace these files in the project root, preserving paths.

Changes:
- disabled gameplay action buttons are fully opaque (muted via solid color/text, not alpha);
- campaign header is "УРОВЕНЬ N" / "LEVEL N" without "/ 64";
- Back and Menu actions use bright cream labels + icons;
- menu_fill.svg from the supplied archive is normalized to menu.svg:
  32x32, viewBox 0 0 24 24, utility path removed, visible path #FFFFFF.

No SettingsScene changes are included in this patch.
