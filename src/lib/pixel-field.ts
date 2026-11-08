/**
 * The pixel field: pale noise settling into a small four-point spark.
 * Pure and seeded, so the pattern is identical on every build and every load.
 */
export interface FieldConfig {
  cols: number; rows: number;
  cell: number; gap: number;
  /** Spark centre, 0-based column and row. */
  cx: number; cy: number;
  arm: number;
  /** Noise is never drawn within this distance of the centre. */
  clear: number;
  falloff: number;
  seed: number;
  /** Arm opacity is sparkBase - m * sparkStep, m = max(|dx|, |dy|). */
  sparkBase: number; sparkStep: number;
  noiseMin: number; noiseMax: number;
}

export const HOME_FIELD: FieldConfig = {
  cols: 25, rows: 22, cell: 14, gap: 6, cx: 15, cy: 11, arm: 7, clear: 3.5, falloff: 12, seed: 7,
  sparkBase: 0.75, sparkStep: 0.07, noiseMin: 0.25, noiseMax: 0.8,
};

export const POST_FIELD: FieldConfig = {
  cols: 19, rows: 15, cell: 12, gap: 5, cx: 11, cy: 7, arm: 5, clear: 3, falloff: 10, seed: 11,
  sparkBase: 0.8, sparkStep: 0.09, noiseMin: 0.3, noiseMax: 0.9,
};

export type Cell = { col: number; row: number; kind: 'spark' | 'noise'; opacity: number; delay: number; twinkle: boolean };

export function mulberry32(seed: number): () => number {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Filled cells only, in row-major order. */
export function pixelCells(c: FieldConfig): Cell[] {
  const rnd = mulberry32(c.seed);
  const cells: Cell[] = [];
  for (let row = 0; row < c.rows; row++) {
    for (let col = 0; col < c.cols; col++) {
      const dx = col - c.cx, dy = row - c.cy, ax = Math.abs(dx), ay = Math.abs(dy);
      const roll = rnd(); // one draw per cell keeps the noise stable if the spark rules change
      const m = Math.max(ax, ay);
      if (ax + ay === 0) continue;
      if (ax + ay === 1) {
        cells.push({ col, row, kind: 'spark', opacity: 0.85, delay: round(1.05 + 0.06), twinkle: false });
        continue;
      }
      const arm = (dx === 0 && ay <= c.arm) || (dy === 0 && ax <= c.arm) || (ax === ay && ax <= 2);
      if (arm) {
        cells.push({ col, row, kind: 'spark', opacity: round(c.sparkBase - m * c.sparkStep), delay: round(1.05 + m * 0.06), twinkle: false });
        continue;
      }
      const d = Math.hypot(dx, dy);
      const p = Math.min(1, Math.max(0, (d - c.clear) / c.falloff)) * 0.5;
      if (roll >= p) continue;
      const opacity = round(c.noiseMin + rnd() * (c.noiseMax - c.noiseMin));
      const delay = round(0.15 + rnd() * 0.75);
      const twinkle = rnd() < 0.12;
      cells.push({ col, row, kind: 'noise', opacity, delay, twinkle });
    }
  }
  return cells;
}
