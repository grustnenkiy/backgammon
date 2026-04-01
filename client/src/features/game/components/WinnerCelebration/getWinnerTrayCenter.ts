import type { PlayerColor } from 'shared';

export type ScreenPoint = {
  x: number;
  y: number;
};

export function getWinnerTrayCenter(
  root: HTMLElement | null,
  winner: PlayerColor,
): ScreenPoint | null {
  if (!root) return null;

  const traySection = root.querySelector<HTMLElement>(`[data-tray-color="${CSS.escape(winner)}"]`);
  if (!traySection) return null;

  const rect = traySection.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
  };
}
