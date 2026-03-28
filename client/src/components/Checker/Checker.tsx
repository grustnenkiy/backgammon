import clsx from 'clsx';
import './Checker.css';

type CheckerProps = {
  color: 'white' | 'black';
};

export function Checker({ color }: CheckerProps) {
  return <div className={clsx('checker', `checker--player-${color}`)} />;
}
