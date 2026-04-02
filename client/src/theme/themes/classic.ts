import type { Theme } from '../Theme';

export const classicTheme: Theme = {
  name: 'Classic',

  colors: {
    bg: '#ddd9d3',
    surface: '#f3f2f0',
    ink: '#1a1a1b',
    muted: '#8d8b86',
    line: '#1f2022',
    softLine: '#c9c5be',
    accent: '#ef3216',
    accentSoft: '#ffd9d2',
    triangleDark: '#4f5053',
    triangleLight: '#c3bfb8',
    checkerWhite: '#f7f7f6',
    checkerBlack: '#18191b',
    checkerWhiteBorder: '#1f2022',
    checkerBlackBorder: '#f3f2f0',
    bar: '#d3d0cb',
    pointHover: '#eceae6',
    labelBg: 'rgba(251, 251, 250, 0.92)',
    labelBorder: '#ccc8c1',
    noticeBg: '#fffbe6',
    noticeText: '#7a5a00',
    highlightFill: '#ffd9d2',
    highlightBorder: '#ef3216',
  },

  typography: {
    fontFamily: "'Archivo', 'Segoe UI', sans-serif",
    fontWeight: 600,
    buttonLetterSpacing: '0.1em',
  },

  shape: {
    checkerRadius: '999px',
    pipRadius: '999px',
    buttonRadius: '0px',
  },

  border: {
    boardWidth: '3px',
    cellWidth: '1px',
  },

  effects: {
    transitionDuration: '120ms',
    transitionTimingFunction: 'ease',
    animationStyle: 'smooth',
    shadow: 'none',
    glow: 'none',
  },
};
