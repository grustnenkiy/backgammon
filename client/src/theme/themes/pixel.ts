import type { Theme } from '../Theme';

export const pixelTheme: Theme = {
  name: 'Pixel Retro',

  colors: {
    bg: '#1b2350',
    surface: '#3070d0',
    ink: '#fff1e8',
    muted: '#b0c4e8',
    line: '#1a2040',
    softLine: '#2550a0',
    accent: '#ff004d',
    accentSoft: '#2a3f88',
    triangleDark: '#1840a0',
    triangleLight: '#60a0f0',
    checkerWhite: '#fff1e8',
    checkerBlack: '#181828',
    checkerWhiteBorder: '#1a2040',
    checkerBlackBorder: '#8090c0',
    bar: '#2058b8',
    pointHover: '#4088e0',
    labelBg: '#1840a0',
    labelBorder: '#4080d0',
    noticeBg: '#ffa300',
    noticeText: '#141830',
    highlightFill: 'rgba(160, 200, 255, 0.16)',
    highlightBorder: '#ff004d',
  },

  typography: {
    fontFamily: "'Press Start 2P', 'Courier New', monospace",
    fontWeight: 400,
    buttonLetterSpacing: '0.05em',
  },

  shape: {
    checkerRadius: '0px',
    pipRadius: '0px',
    buttonRadius: '0px',
  },

  border: {
    boardWidth: '4px',
    cellWidth: '2px',
  },

  effects: {
    transitionDuration: '0ms',
    transitionTimingFunction: 'steps(1)',
    animationStyle: 'step',
    shadow: 'none',
    glow: 'none',
  },
};
