import type { Theme } from './Theme';

const CSS_VAR_MAP: Record<string, (theme: Theme) => string> = {
  '--bg': (t) => t.colors.bg,
  '--surface': (t) => t.colors.surface,
  '--ink': (t) => t.colors.ink,
  '--muted': (t) => t.colors.muted,
  '--line': (t) => t.colors.line,
  '--soft-line': (t) => t.colors.softLine,
  '--accent': (t) => t.colors.accent,
  '--accent-soft': (t) => t.colors.accentSoft,
  '--tri-dark': (t) => t.colors.triangleDark,
  '--tri-light': (t) => t.colors.triangleLight,
  '--checker-white': (t) => t.colors.checkerWhite,
  '--checker-black': (t) => t.colors.checkerBlack,
  '--checker-white-border': (t) => t.colors.checkerWhiteBorder,
  '--checker-black-border': (t) => t.colors.checkerBlackBorder,
  '--bar-bg': (t) => t.colors.bar,
  '--point-hover': (t) => t.colors.pointHover,
  '--label-bg': (t) => t.colors.labelBg,
  '--label-border': (t) => t.colors.labelBorder,
  '--notice-bg': (t) => t.colors.noticeBg,
  '--notice-text': (t) => t.colors.noticeText,
  '--highlight-fill': (t) => t.colors.highlightFill,
  '--highlight-border': (t) => t.colors.highlightBorder,

  '--font-family': (t) => t.typography.fontFamily,
  '--font-weight': (t) => String(t.typography.fontWeight),
  '--button-letter-spacing': (t) => t.typography.buttonLetterSpacing,

  '--checker-radius': (t) => t.shape.checkerRadius,
  '--pip-radius': (t) => t.shape.pipRadius,
  '--button-radius': (t) => t.shape.buttonRadius,

  '--board-border-width': (t) => t.border.boardWidth,
  '--cell-border-width': (t) => t.border.cellWidth,

  '--transition-duration': (t) => t.effects.transitionDuration,
  '--transition-timing': (t) => t.effects.transitionTimingFunction,
  '--shadow': (t) => t.effects.shadow,
  '--glow': (t) => t.effects.glow,
};

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;

  for (const [varName, getter] of Object.entries(CSS_VAR_MAP)) {
    root.style.setProperty(varName, getter(theme));
  }

  root.dataset.theme = theme.name.toLowerCase().replace(/\s+/g, '-');
}
