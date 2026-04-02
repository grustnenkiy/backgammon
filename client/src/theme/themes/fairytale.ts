import type { Theme } from '../Theme';

export const fairytaleTheme: Theme = {
  name: 'Fairytale',

  colors: {
    bg: '#fff7fb',
    surface: '#ffe0f0',
    ink: '#4b3f5c',
    muted: '#9c8fb0',
    line: '#d8c9ee',
    softLine: '#e6d8ff',
    accent: '#ff5fa2',
    accentSoft: '#ffd27a',
    triangleDark: '#c7a4ff',
    triangleLight: '#f5cedf',
    checkerWhite: '#ffffff',
    checkerBlack: '#7a5bbf',
    checkerWhiteBorder: '#e6d8ff',
    checkerBlackBorder: '#ffffff',
    bar: '#f1d2ff',
    pointHover: '#ffc4e0',
    labelBg: 'rgba(199, 164, 255, 0.55)',
    labelBorder: '#e6d8ff',
    noticeBg: '#ffd27a',
    noticeText: '#4b3f5c',
    highlightFill: 'rgba(255, 170, 210, 0.4)',
    highlightBorder: '#ff5fa2',
  },

  typography: {
    fontFamily: "'Nunito', 'Quicksand', sans-serif",
    fontWeight: 600,
    buttonLetterSpacing: '0.03em',
  },

  shape: {
    checkerRadius: '50%',
    pipRadius: '8px',
    buttonRadius: '12px',
  },

  border: {
    boardWidth: '2px',
    cellWidth: '1px',
  },

  effects: {
    transitionDuration: '120ms',
    transitionTimingFunction: 'ease-out',
    animationStyle: 'smooth',
    shadow: '0 4px 12px rgba(150, 120, 200, 0.2)',
    glow: '0 0 8px rgba(255, 182, 213, 0.6)',
  },
};
