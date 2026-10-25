import type { ProjectVisualType } from "../data/schema";

/**
 * Forms are the shapes the field can be asked to hold. Each generator returns
 * exactly `n` target positions inside a region, plus the typical spacing
 * between neighbours (used to decide which points get connected by lines).
 *
 * Forms are selected by name from validated JSON, never by executable strings.
 */

export type FormName = ProjectVisualType | "horizon";

export interface Region {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FormResult {
  x: Float32Array;
  y: Float32Array;
  spacing: number;
}

type Rng = () => number;
type Gen = (n: number, r: Region, rng: Rng) => FormResult;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const gauss = (rng: Rng) => {
  const u = Math.max(rng(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
};

/** Pads (with jittered copies) or trims point lists to exactly n. */
function finalize(xs: number[], ys: number[], n: number, rng: Rng, spacing: number): FormResult {
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const m = xs.length;
  for (let i = 0; i < n; i++) {
    if (i < m) {
      x[i] = xs[i];
      y[i] = ys[i];
    } else {
      const j = Math.floor(rng() * Math.max(m, 1));
      x[i] = (xs[j] ?? 0) + (rng() - 0.5) * spacing;
      y[i] = (ys[j] ?? 0) + (rng() - 0.5) * spacing;
    }
  }
  return { x, y, spacing };
}

/** Evenly samples `count` points along a closed or open polyline. */
function samplePolyline(pts: [number, number][], count: number, closed: boolean, xs: number[], ys: number[]) {
  if (count <= 0 || pts.length < 2) return;
  const segs: [number, number, number, number, number][] = [];
  let total = 0;
  const len = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < len; i++) {
    const [ax, ay] = pts[i];
    const [bx, by] = pts[(i + 1) % pts.length];
    const l = Math.hypot(bx - ax, by - ay);
    segs.push([ax, ay, bx, by, l]);
    total += l;
  }
  const step = total / (closed ? count : Math.max(count - 1, 1));
  let seg = 0;
  let acc = 0;
  for (let k = 0; k < count; k++) {
    const d = k * step;
    while (seg < segs.length - 1 && acc + segs[seg][4] < d) {
      acc += segs[seg][4];
      seg++;
    }
    const [ax, ay, bx, by, l] = segs[seg];
    const t = l > 0 ? Math.min((d - acc) / l, 1) : 0;
    xs.push(ax + (bx - ax) * t);
    ys.push(ay + (by - ay) * t);
  }
}

const rectPts = (cx: number, cy: number, w: number, h: number, rot = 0): [number, number][] => {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  return (
    [
      [-w / 2, -h / 2],
      [w / 2, -h / 2],
      [w / 2, h / 2],
      [-w / 2, h / 2],
    ] as [number, number][]
  ).map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]);
};

function gridInto(n: number, x0: number, y0: number, w: number, h: number, xs: number[], ys: number[]) {
  const cols = Math.max(2, Math.round(Math.sqrt((n * w) / Math.max(h, 1))));
  const rows = Math.max(2, Math.ceil(n / cols));
  const sx = w / (cols - 1);
  const sy = h / (rows - 1);
  const s = Math.min(sx, sy);
  const gw = s * (cols - 1);
  const gh = s * (rows - 1);
  const ox = x0 + (w - gw) / 2;
  const oy = y0 + (h - gh) / 2;
  for (let i = 0; i < n; i++) {
    xs.push(ox + (i % cols) * s);
    ys.push(oy + Math.floor(i / cols) * s);
  }
  return s;
}

/** The entrance: a calm lattice that drifts apart wherever nobody is looking. */
const lattice: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const s = gridInto(n, r.x, r.y, r.w, r.h, xs, ys);
  return finalize(xs, ys, n, rng, s);
};

/** A vertical strip of frames. Inside each, a horizon rises a little further: a sequence. */
const frames: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const sw = Math.min(r.w * 0.66, r.h * 0.62);
  const fh = sw / 1.5;
  const gap = fh * 0.18;
  const cx = r.x + r.w / 2;
  const top = r.y - fh * 0.42;
  const count = Math.ceil((r.h + fh * 0.84) / (fh + gap));
  const perimeterBudget = Math.floor(n * 0.48);
  const holeBudget = Math.floor(n * 0.14);
  const innerBudget = n - perimeterBudget - holeBudget;
  for (let k = 0; k < count; k++) {
    const fy = top + k * (fh + gap) + fh / 2;
    samplePolyline(rectPts(cx, fy, sw, fh), Math.floor(perimeterBudget / count), true, xs, ys);
    const t = count > 1 ? k / (count - 1) : 0;
    const hy = fy + fh * (0.3 - 0.52 * t);
    samplePolyline(
      [
        [cx - sw * 0.42, hy],
        [cx + sw * 0.42, hy],
      ],
      Math.floor(innerBudget / count),
      false,
      xs,
      ys,
    );
  }
  const stripTop = top;
  const stripLen = count * (fh + gap);
  const perSide = Math.floor(holeBudget / 2);
  for (let i = 0; i < perSide; i++) {
    const y = stripTop + (i / perSide) * stripLen;
    xs.push(cx - sw / 2 - sw * 0.08, cx + sw / 2 + sw * 0.08);
    ys.push(y, y);
  }
  return finalize(xs, ys, n, rng, (2 * (sw + fh) * count) / Math.max(perimeterBudget, 1));
};

/** Two uneven clouds: information before it has been organised. */
const drift: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const sigma = Math.min(r.w, r.h) * 0.17;
  for (let i = 0; i < n; i++) {
    const second = rng() < 0.3;
    const cx = r.x + r.w * (second ? 0.68 : 0.42);
    const cy = r.y + r.h * (second ? 0.64 : 0.44);
    const sg = second ? sigma * 0.55 : sigma;
    xs.push(cx + gauss(rng) * sg * 1.15);
    ys.push(cy + gauss(rng) * sg);
  }
  return finalize(xs, ys, n, rng, (sigma * 2.4) / Math.sqrt(n));
};

/** Nested squares, each turned a few degrees more than the last. Order, slowly losing count. */
const concentric: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const m = 11;
  const S = Math.min(r.w, r.h) * 0.78;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  let totalPerim = 0;
  for (let i = 0; i < m; i++) totalPerim += 4 * S * (1 - i / m);
  for (let i = 0; i < m; i++) {
    const side = S * (1 - i / m);
    const count = Math.round((n * 4 * side) / totalPerim);
    samplePolyline(rectPts(cx, cy, side, side, (i * i * 0.6 * Math.PI) / 180), count, true, xs, ys);
  }
  return finalize(xs, ys, n, rng, totalPerim / n);
};

/** A solid slab in proportion 4:9, standing on a floor line. */
const monolith: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const h = r.h * 0.74;
  const w = Math.min((h * 4) / 9, r.w * 0.5);
  const cx = r.x + r.w * 0.5;
  const bottom = r.y + r.h * 0.5 + h / 2;
  const slab = Math.floor(n * 0.86);
  const s = gridInto(slab, cx - w / 2, bottom - h, w, h, xs, ys);
  samplePolyline(
    [
      [r.x + r.w * 0.06, bottom + s * 2.5],
      [r.x + r.w * 0.94, bottom + s * 2.5],
    ],
    n - slab,
    false,
    xs,
    ys,
  );
  return finalize(xs, ys, n, rng, s);
};

/** Horizontal strata. The top lines are level; each lower line is a little less sure. */
const strata: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const L = 15;
  const per = Math.floor(n / L);
  for (let i = 0; i < L; i++) {
    const t = i / (L - 1);
    const base = r.y + r.h * (0.12 + 0.76 * t);
    const amp = t * t * r.h * 0.06;
    const phase = i * 0.7;
    for (let k = 0; k < per; k++) {
      const u = k / (per - 1);
      const x = r.x + r.w * (0.04 + 0.92 * u);
      xs.push(x);
      ys.push(base + amp * Math.sin(u * Math.PI * 3 + phase));
    }
  }
  return finalize(xs, ys, n, rng, (r.w * 0.92) / per);
};

/** Everything collapses to one horizon, and a single vertical stroke stands on it. */
const horizon: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const hy = r.y + r.h * 0.7;
  const line = Math.floor(n * 0.93);
  samplePolyline(
    [
      [r.x - r.w * 0.02, hy],
      [r.x + r.w * 1.02, hy],
    ],
    line,
    false,
    xs,
    ys,
  );
  const fx = r.x + r.w * 0.66;
  samplePolyline(
    [
      [fx, hy],
      [fx, hy - r.h * 0.13],
    ],
    n - line,
    false,
    xs,
    ys,
  );
  return finalize(xs, ys, n, rng, (r.w * 1.04) / line);
};

export const forms: Record<FormName, Gen> = {
  lattice,
  frames,
  drift,
  concentric,
  monolith,
  strata,
  horizon,
};
