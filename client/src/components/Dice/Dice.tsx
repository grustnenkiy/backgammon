import clsx from 'clsx';
import './Dice.css';

type DiceProps = {
  values: number[];
  usedDice?: number[];
};

const dotPositions: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [25, 25],
    [75, 75],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [25, 25],
    [75, 25],
    [25, 75],
    [75, 75],
  ],
  5: [
    [25, 25],
    [75, 25],
    [50, 50],
    [25, 75],
    [75, 75],
  ],
  6: [
    [25, 25],
    [75, 25],
    [25, 50],
    [75, 50],
    [25, 75],
    [75, 75],
  ],
};

export function Dice({ values, usedDice = [] }: DiceProps) {
  const used = [...usedDice];
  const dice = values.map((value) => {
    const idx = used.indexOf(value);
    if (idx !== -1) {
      used.splice(idx, 1);
      return { value, isUsed: true };
    }
    return { value, isUsed: false };
  });

  return (
    <div className="dice">
      {dice.length ? (
        dice.map((die, index) => (
          <div
            key={`${die.value}-${index}`}
            className={clsx('die', die.isUsed && 'die--used')}
          >
            {(dotPositions[die.value] ?? []).map(([x, y], dotIdx) => (
              <div
                key={dotIdx}
                className="die__pip"
                style={{ left: `${x}%`, top: `${y}%` }}
              />
            ))}
          </div>
        ))
      ) : (
        <span className="dice__hint">Roll the dice</span>
      )}
    </div>
  );
}
