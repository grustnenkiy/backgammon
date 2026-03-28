import type { GameState } from 'shared';
import { Checker } from '../Checker';
import './Board.css';

type BoardProps = {
  game: GameState;
  showPointLabels?: boolean;
  selectedPoint?: number | 'bar' | null;
  validDestinations?: (number | 'off')[];
  onPointClick?: (pointIndex: number) => void;
  onBarClick?: () => void;
  onBearOff?: () => void;
};

// Standard backgammon layout (white's perspective, white moves 24→1)
// Top row  (left→right): 13 14 15 16 17 18 | BAR | 19 20 21 22 23 24
// Bottom row (left→right): 12 11 10  9  8  7 | BAR |  6  5  4  3  2  1
const TOP_LEFT: number[] = [12, 13, 14, 15, 16, 17];
const TOP_RIGHT: number[] = [18, 19, 20, 21, 22, 23];
const BOTTOM_LEFT: number[] = [11, 10, 9, 8, 7, 6];
const BOTTOM_RIGHT: number[] = [5, 4, 3, 2, 1, 0];

const MAX_VISIBLE = 5;

export function Board({
  game,
  showPointLabels = false,
  selectedPoint = null,
  validDestinations = [],
  onPointClick,
  onBarClick,
  onBearOff,
}: BoardProps) {
  const destSet = new Set(validDestinations);
  const canBearOff = destSet.has('off');

  function renderPoint(pointIndex: number, position: 'top' | 'bottom', col: number) {
    const point = game.points[pointIndex]!;
    const isDark = col % 2 === 0;
    const isSelected = selectedPoint === pointIndex;
    const isValidDest = destSet.has(pointIndex);

    const classes = [
      'point',
      `point--${position}`,
      isDark ? 'point--dark' : 'point--light',
      isSelected && 'point--selected',
      isValidDest && 'point--valid-dest',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        key={pointIndex}
        className={classes}
        type="button"
        onClick={() => onPointClick?.(pointIndex)}
      >
        <div className="point__triangle" />
        <div className="point__checkers">
          {Array.from({ length: Math.min(point.count, MAX_VISIBLE) }).map((_, i) => (
            <Checker key={i} color={point.player ?? 'white'} />
          ))}
          {point.count > MAX_VISIBLE && <span className="point__extra">{point.count}</span>}
        </div>
        {showPointLabels && <span className="point__label">{pointIndex + 1}</span>}
      </button>
    );
  }

  return (
    <div className="board">
      <div className="board__surface">
        {/* Top half */}
        <div className="board__row">
          <div className="board__quadrant">
            {TOP_LEFT.map((idx, col) => renderPoint(idx, 'top', col))}
          </div>
          <button
            className={`board__bar${selectedPoint === 'bar' ? ' board__bar--selected' : ''}`}
            type="button"
            onClick={onBarClick}
          >
            {game.bar.black > 0 && (
              <div className="bar__stack">
                <Checker color="black" />
                {game.bar.black > 1 && <span className="bar__count">{game.bar.black}</span>}
              </div>
            )}
          </button>
          <div className="board__quadrant">
            {TOP_RIGHT.map((idx, col) => renderPoint(idx, 'top', col))}
          </div>
        </div>

        {/* Bottom half */}
        <div className="board__row">
          <div className="board__quadrant">
            {BOTTOM_LEFT.map((idx, col) => renderPoint(idx, 'bottom', col))}
          </div>
          <button
            className={`board__bar${selectedPoint === 'bar' ? ' board__bar--selected' : ''}`}
            type="button"
            onClick={onBarClick}
          >
            {game.bar.white > 0 && (
              <div className="bar__stack">
                <Checker color="white" />
                {game.bar.white > 1 && <span className="bar__count">{game.bar.white}</span>}
              </div>
            )}
          </button>
          <div className="board__quadrant">
            {BOTTOM_RIGHT.map((idx, col) => renderPoint(idx, 'bottom', col))}
          </div>
        </div>
      </div>

      {/* Borne-off tray */}
      <button
        className={`board__tray${canBearOff ? ' board__tray--active' : ''}`}
        type="button"
        onClick={onBearOff}
      >
        <div className="tray__section">
          {game.borneOff.black > 0 && (
            <>
              <Checker color="black" />
              <span className="tray__count">{game.borneOff.black}</span>
            </>
          )}
        </div>
        <div className="tray__section">
          {game.borneOff.white > 0 && (
            <>
              <Checker color="white" />
              <span className="tray__count">{game.borneOff.white}</span>
            </>
          )}
        </div>
      </button>
    </div>
  );
}
