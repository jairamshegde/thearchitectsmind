import { describe, expect, it } from 'vitest';
import { HOME_FIELD, POST_FIELD, mulberry32, pixelCells, type FieldConfig } from '../../src/lib/pixel-field';

const at = (cells: ReturnType<typeof pixelCells>, col: number, row: number) => cells.find((c) => c.col === col && c.row === row);

describe('mulberry32', () => {
  it('repeats the same sequence for the same seed', () => {
    const a = mulberry32(7), b = mulberry32(7);
    const seqA = [a(), a(), a()], seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
    for (const n of seqA) expect(n).toBeGreaterThanOrEqual(0), expect(n).toBeLessThan(1);
  });
});

for (const [name, cfg, base, step, lo, hi] of [
  ['home', HOME_FIELD, 0.75, 0.07, 0.25, 0.8],
  ['post', POST_FIELD, 0.8, 0.09, 0.3, 0.9],
] as [string, FieldConfig, number, number, number, number][]) {
  describe(`pixelCells (${name})`, () => {
    const cells = pixelCells(cfg);
    const noise = cells.filter((c) => c.kind === 'noise');

    it('draws the same field on every call', () => {
      expect(pixelCells(cfg)).toEqual(cells);
    });

    it('leaves the centre empty for the accent square', () => {
      expect(at(cells, cfg.cx, cfg.cy)).toBeUndefined();
    });

    it('fills the four cells next to the centre as spark at 0.85', () => {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        expect(at(cells, cfg.cx + dx, cfg.cy + dy)).toMatchObject({ kind: 'spark', opacity: 0.85 });
      }
    });

    it('fades the spark arms outward and draws them after the noise', () => {
      const arm = at(cells, cfg.cx, cfg.cy - 3)!;
      expect(arm.kind).toBe('spark');
      expect(arm.opacity).toBeCloseTo(base - 3 * step, 5);
      expect(arm.delay).toBeCloseTo(1.05 + 3 * 0.06, 5);
      expect(at(cells, cfg.cx + cfg.arm, cfg.cy)?.kind).toBe('spark');
      expect(at(cells, cfg.cx + 2, cfg.cy + 2)?.kind).toBe('spark');
    });

    it('keeps noise out of the clear radius and inside its opacity and delay ranges', () => {
      expect(noise.length).toBeGreaterThan(20);
      for (const c of noise) {
        expect(Math.hypot(c.col - cfg.cx, c.row - cfg.cy)).toBeGreaterThan(cfg.clear);
        expect(c.opacity).toBeGreaterThanOrEqual(lo);
        expect(c.opacity).toBeLessThanOrEqual(hi);
        expect(c.delay).toBeGreaterThanOrEqual(0.15);
        expect(c.delay).toBeLessThanOrEqual(0.9);
      }
    });

    it('twinkles roughly one noise cell in eight', () => {
      const share = noise.filter((c) => c.twinkle).length / noise.length;
      expect(share).toBeGreaterThan(0.03);
      expect(share).toBeLessThan(0.25);
      expect(cells.filter((c) => c.kind === 'spark').every((c) => !c.twinkle)).toBe(true);
    });

    it('stays inside the grid', () => {
      for (const c of cells) {
        expect(c.col).toBeGreaterThanOrEqual(0);
        expect(c.col).toBeLessThan(cfg.cols);
        expect(c.row).toBeGreaterThanOrEqual(0);
        expect(c.row).toBeLessThan(cfg.rows);
      }
    });
  });
}
