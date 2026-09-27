export const UI_THEME = {
  colors: {
    background: { deep: 0x0d1127, blue: 0x121d3a, overlay: 0x070b19 },
    surface: { inset: 0x0f2039, base: 0x1b2a4d, raised: 0x2f4b69, highlight: 0x3c5887 },
    border: { dark: 0x18314f, normal: 0x536c94, bright: 0x7894ba },
    text: { primary: 0xf8f1da, secondary: 0xcbd3e0, muted: 0x8e9bb4, disabled: 0xaab6ca },
    semantic: { gold: 0xefb146, goldBright: 0xeec358, success: 0x71cdb8, danger: 0xc86672, warning: 0xe7954b },
  },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 },
  radius: { small: 8, medium: 12, large: 16 },
  typography: {
    display: { comfortable: 34, compact: 28, mobile: 24 },
    heading: { comfortable: 24, compact: 21, mobile: 19 },
    bodyStrong: { comfortable: 17, compact: 16, mobile: 15 },
    body: { comfortable: 15, compact: 14, mobile: 13 },
    meta: { comfortable: 12, compact: 11, mobile: 10 },
  },
} as const;

export type UiTheme = typeof UI_THEME;

export function uiColorHex(color: number): string {
  return `#${color.toString(16).padStart(6, '0')}`;
}
