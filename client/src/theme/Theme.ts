export type AnimationStyle = 'smooth' | 'step' | 'none';

export type Theme = {
  name: string;

  colors: {
    bg: string;
    surface: string;
    ink: string;
    muted: string;
    line: string;
    softLine: string;
    accent: string;
    accentSoft: string;
    triangleDark: string;
    triangleLight: string;
    checkerWhite: string;
    checkerBlack: string;
    checkerWhiteBorder: string;
    checkerBlackBorder: string;
    bar: string;
    pointHover: string;
    labelBg: string;
    labelBorder: string;
    noticeBg: string;
    noticeText: string;
    highlightFill: string;
    highlightBorder: string;
  };

  typography: {
    fontFamily: string;
    fontWeight: number;
    buttonLetterSpacing: string;
  };

  shape: {
    checkerRadius: string;
    pipRadius: string;
    buttonRadius: string;
  };

  border: {
    boardWidth: string;
    cellWidth: string;
  };

  effects: {
    transitionDuration: string;
    transitionTimingFunction: string;
    animationStyle: AnimationStyle;
  };
};
