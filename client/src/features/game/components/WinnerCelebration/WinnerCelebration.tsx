import { useEffect, useRef } from 'react';
import type { PlayerColor } from 'shared';
import type { ScreenPoint } from './getWinnerTrayCenter';
import './WinnerCelebration.css';

type WinnerCelebrationProps = {
  winner: PlayerColor;
  checkerCount: number;
  origin: ScreenPoint | null;
  onComplete?: () => void;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  spin: number;
  radius: number;
  restitution: number;
};

const GRAVITY = 1850;
const DURATION_MS = 6200;
const FADE_MS = 900;

function randomInRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function getVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function checkerFill(color: PlayerColor) {
  return color === 'white'
    ? (getVar('--checker-white') || '#f7f7f6')
    : (getVar('--checker-black') || '#18191b');
}

function checkerStroke(color: PlayerColor) {
  return color === 'white'
    ? (getVar('--checker-white-border') || '#1f1f1f')
    : (getVar('--checker-black-border') || '#f2efe9');
}

function checkerCornerRadius(fallbackSize: number) {
  const raw = getVar('--checker-radius');
  if (!raw) return fallbackSize * 0.5;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return fallbackSize * 0.5;
  return parsed;
}

function drawCheckerPath(ctx: CanvasRenderingContext2D, size: number, cornerRadius: number) {
  const half = size * 0.5;
  const r = Math.max(0, Math.min(cornerRadius, half));

  if (r === 0) {
    ctx.rect(-half, -half, size, size);
    return;
  }

  if (r >= half) {
    ctx.arc(0, 0, half, 0, Math.PI * 2);
    return;
  }

  ctx.moveTo(-half + r, -half);
  ctx.lineTo(half - r, -half);
  ctx.arcTo(half, -half, half, -half + r, r);
  ctx.lineTo(half, half - r);
  ctx.arcTo(half, half, half - r, half, r);
  ctx.lineTo(-half + r, half);
  ctx.arcTo(-half, half, -half, half - r, r);
  ctx.lineTo(-half, -half + r);
  ctx.arcTo(-half, -half, -half + r, -half, r);
  ctx.closePath();
}

export function WinnerCelebration({
  winner,
  checkerCount,
  origin,
  onComplete,
}: WinnerCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onCompleteRef.current?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getViewport = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
      dpr: window.devicePixelRatio || 1,
    });

    const resize = () => {
      const { width, height, dpr } = getViewport();
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const { width, height } = getViewport();
    const count = Math.min(15, Math.max(1, checkerCount));
    const baseRadius = Math.max(11, Math.min(22, Math.min(width, height) * 0.018));
    const launchOrigin = origin ?? { x: width * 0.5, y: height * 0.6 };
    const particles: Particle[] = Array.from({ length: count }, (_, i) => {
      const speed = randomInRange(520, 980);
      const angle = randomInRange(-2.35, -0.82);
      const lateralSpread = randomInRange(-120, 120);

      return {
        x: launchOrigin.x + lateralSpread * 0.04,
        y: launchOrigin.y + randomInRange(-6, 6),
        vx:
          Math.cos(angle) * speed +
          (i % 2 === 0 ? randomInRange(-200, 100) : randomInRange(-100, 200)),
        vy: Math.sin(angle) * speed - randomInRange(80, 180),
        angle: randomInRange(0, Math.PI * 2),
        spin: randomInRange(-5.8, 5.8),
        radius: baseRadius + randomInRange(-2.4, 2.4),
        restitution: randomInRange(0.74, 0.89),
      };
    });

    const checkerSize = baseRadius * 2;
    const cornerRadius = checkerCornerRadius(checkerSize);

    let rafId = 0;
    let previous = performance.now();
    const start = previous;

    const render = (now: number) => {
      const elapsed = now - start;
      const fadeProgress = Math.max(0, elapsed - (DURATION_MS - FADE_MS)) / FADE_MS;
      const alpha = 1 - Math.min(1, fadeProgress);
      const dt = Math.min((now - previous) / 1000, 0.033);
      previous = now;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      ctx.clearRect(0, 0, viewportWidth, viewportHeight);
      ctx.globalAlpha = alpha;

      for (const piece of particles) {
        piece.vy += GRAVITY * dt;
        piece.x += piece.vx * dt;
        piece.y += piece.vy * dt;
        piece.angle += piece.spin * dt;

        if (piece.x - piece.radius < 0) {
          piece.x = piece.radius;
          piece.vx = Math.abs(piece.vx) * piece.restitution;
        } else if (piece.x + piece.radius > viewportWidth) {
          piece.x = viewportWidth - piece.radius;
          piece.vx = -Math.abs(piece.vx) * piece.restitution;
        }

        if (piece.y - piece.radius < 0) {
          piece.y = piece.radius;
          piece.vy = Math.abs(piece.vy) * piece.restitution;
        } else if (piece.y + piece.radius > viewportHeight) {
          piece.y = viewportHeight - piece.radius;
          piece.vy = -Math.abs(piece.vy) * piece.restitution;
          piece.vx *= 0.985;
          piece.spin *= 0.992;
        }

        ctx.save();
        ctx.translate(piece.x, piece.y + piece.radius * 0.92);
        ctx.scale(1.06, 0.4);
        ctx.globalAlpha = alpha * 0.24;
        ctx.fillStyle = '#101113';
        ctx.beginPath();
        drawCheckerPath(ctx, piece.radius * 2, cornerRadius);
        ctx.fill();
        ctx.restore();

        ctx.save();
        ctx.translate(piece.x, piece.y);
        ctx.rotate(piece.angle);
        ctx.fillStyle = checkerFill(winner);
        ctx.strokeStyle = checkerStroke(winner);
        ctx.lineWidth = 2;
        ctx.shadowBlur = 9;
        ctx.shadowColor = winner === 'white' ? 'rgba(244, 244, 244, 0.72)' : 'rgba(8, 8, 8, 0.75)';
        ctx.beginPath();
        drawCheckerPath(ctx, piece.radius * 2, cornerRadius);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      if (elapsed < DURATION_MS) {
        rafId = window.requestAnimationFrame(render);
        return;
      }

      onCompleteRef.current?.();
    };

    rafId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [checkerCount, origin, winner]);

  return (
    <div className="winner-celebration" aria-hidden="true">
      <canvas className="winner-celebration__canvas" ref={canvasRef} />
    </div>
  );
}
