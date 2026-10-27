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
  /** Optional source of light inside the form (a sun, a halo); the field glows there. */
  focus?: { x: number; y: number; r: number };
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

/** Everything collapses to one horizon with a sun half-risen on it, and a single figure standing by. */
const horizon: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const hy = r.y + r.h * 0.84;
  const sunN = Math.floor(n * 0.24);
  const sr = Math.min(r.w, r.h) * 0.16;
  const scx = r.x + r.w * 0.5;
  for (let ring = 0; ring < 4; ring++) {
    const rr = sr * (1 - ring * 0.2);
    const count = Math.floor(sunN / 4);
    for (let k = 0; k < count; k++) {
      const a = Math.PI + (k / Math.max(count - 1, 1)) * Math.PI;
      xs.push(scx + Math.cos(a) * rr);
      ys.push(hy + Math.sin(a) * rr);
    }
  }
  const line = Math.floor((n - sunN) * 0.92);
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
  const fx = r.x + r.w * 0.78;
  samplePolyline(
    [
      [fx, hy],
      [fx, hy - r.h * 0.13],
    ],
    n - sunN - line,
    false,
    xs,
    ys,
  );
  return { ...finalize(xs, ys, n, rng, (r.w * 1.04) / line), focus: { x: scx, y: hy, r: sr } };
};

/* ---------- the ascent: a hand reaching up toward a light ---------- */

/** Tapered capsule in hand space: [ax, ay, bx, by, radiusA, radiusB]. */
type Capsule = [number, number, number, number, number, number];

/** An open right hand, fingers spread and reaching up. Hand space: palm near the origin, y grows downward. */
const HAND: Capsule[] = [
  [0.06, 0.5, 0.14, 2.9, 0.33, 0.42], // forearm, widening toward the elbow
  [-0.33, -0.42, -0.52, -1.55, 0.16, 0.125], // index
  [-0.07, -0.48, -0.12, -1.76, 0.165, 0.13], // middle
  [0.18, -0.46, 0.28, -1.6, 0.155, 0.122], // ring
  [0.39, -0.36, 0.62, -1.2, 0.135, 0.105], // little
  [-0.36, 0.22, -0.92, -0.42, 0.19, 0.135], // thumb
  [-0.18, 0.36, -0.4, 0.02, 0.26, 0.24], // base of the thumb
  [-0.36, -0.4, 0.42, -0.36, 0.13, 0.13], // knuckles
  [0.42, -0.36, 0.36, 0.42, 0.13, 0.15], // outer edge of the palm
  [0.36, 0.42, -0.2, 0.5, 0.15, 0.2], // heel of the palm
];

/** The palm itself, as a polygon the capsules round off. */
const PALM: [number, number][] = [
  [-0.42, -0.42],
  [0.45, -0.38],
  [0.38, 0.45],
  [-0.25, 0.55],
  [-0.4, 0.1],
];

function inPolygon(x: number, y: number, poly: [number, number][]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function capsuleDistance(px: number, py: number, c: Capsule) {
  const [ax, ay, bx, by, ra, rb] = c;
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  const qx = ax + dx * t - px;
  const qy = ay + dy * t - py;
  return Math.hypot(qx, qy) - (ra + (rb - ra) * t);
}

const inHand = (x: number, y: number) => {
  if (inPolygon(x, y, PALM)) return true;
  for (const c of HAND) if (capsuleDistance(x, y, c) < 0) return true;
  return false;
};

/** Picks `count` items spread evenly through a list. */
function spread<T>(list: T[], count: number): T[] {
  if (count >= list.length) return list;
  const out: T[] = [];
  const step = list.length / count;
  for (let i = 0; i < count; i++) out.push(list[Math.floor(i * step)]);
  return out;
}

/**
 * The front page: a hand rises from the bottom of the frame, fingers open,
 * reaching for a light above it. Rays fall from the light toward the fingertips.
 */
const ascent: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const s = Math.min(r.h * 0.2, r.w * 0.3);
  const tilt = (-14 * Math.PI) / 180;
  const cos = Math.cos(tilt);
  const sin = Math.sin(tilt);
  // Keep the light (up and to the left of the fingers) inside the frame on narrow screens.
  const ox = Math.max(r.x + r.w * 0.56, r.x + s * 2.56);
  const oy = r.y + r.h * 0.33 + 1.74 * s;
  const place = (hx: number, hy: number): [number, number] => [ox + (hx * cos - hy * sin) * s, oy + (hx * sin + hy * cos) * s];

  // Rasterise the hand: edges carry the silhouette, a sparser fill gives it body.
  const g = 0.035;
  const edge: [number, number][] = [];
  const fill: [number, number][] = [];
  for (let hy = -1.95; hy <= 3.4; hy += g) {
    for (let hx = -1.2; hx <= 0.9; hx += g) {
      if (!inHand(hx, hy)) continue;
      const border = !inHand(hx + g, hy) || !inHand(hx - g, hy) || !inHand(hx, hy + g) || !inHand(hx, hy - g);
      (border ? edge : fill).push([hx, hy]);
    }
  }
  const nEdge = Math.floor(n * 0.58);
  const nFill = Math.floor(n * 0.24);
  for (const [hx, hy] of spread(edge, nEdge)) {
    const [x, y] = place(hx, hy);
    xs.push(x);
    ys.push(y);
  }
  for (let i = 0; i < nFill && fill.length; i++) {
    const [hx, hy] = fill[Math.floor(rng() * fill.length)];
    const [x, y] = place(hx + (rng() - 0.5) * g, hy + (rng() - 0.5) * g);
    xs.push(x);
    ys.push(y);
  }

  // The light: rings above and ahead of the index finger.
  const [lx, ly] = place(-0.95, -3.05);
  const nLight = Math.floor(n * 0.13);
  const rings = 5;
  for (let k = 0; k < rings; k++) {
    const rr = s * (0.16 + k * 0.17);
    const count = Math.floor((nLight * (k + 1)) / ((rings * (rings + 1)) / 2));
    for (let j = 0; j < count; j++) {
      const a = (j / count) * Math.PI * 2 + k * 0.4;
      xs.push(lx + Math.cos(a) * rr);
      ys.push(ly + Math.sin(a) * rr);
    }
  }

  // Whatever is left drifts as loose sparks between the fingers and the light.
  const [tx, ty] = place(-0.3, -1.9);
  while (xs.length < n) {
    const t = rng();
    xs.push(tx + (lx - tx) * t + gauss(rng) * s * 0.25);
    ys.push(ty + (ly - ty) * t + gauss(rng) * s * 0.25);
  }
  // Neighbouring outline points are about this far apart; the field wires them together.
  const edgeSpacing = (g * s * edge.length) / Math.max(nEdge, 1);
  return { ...finalize(xs, ys, n, rng, edgeSpacing * 1.15), focus: { x: lx, y: ly, r: s * 0.8 } };
};

/** A golden spiral unwinding upward: a question widening as it is followed. */
const spiral: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const cx = r.x + r.w * 0.5;
  const cy = r.y + r.h * 0.55;
  const R = Math.min(r.w, r.h) * 0.46;
  const b = Math.log(1.618) / (Math.PI / 2);
  const turns = 3.4;
  const tMax = turns * Math.PI * 2;
  const a = R / Math.exp(b * tMax);
  const main = Math.floor(n * 0.78);
  for (let i = 0; i < main; i++) {
    const t = (i / main) * tMax;
    const rr = a * Math.exp(b * t);
    const th = -t - Math.PI / 2;
    const jitter = (rng() - 0.5) * rr * 0.04;
    xs.push(cx + Math.cos(th) * (rr + jitter));
    ys.push(cy + Math.sin(th) * (rr + jitter));
  }
  const ring = n - main;
  for (let i = 0; i < ring; i++) {
    const th = (i / ring) * Math.PI * 2;
    xs.push(cx + Math.cos(th) * R * 1.04);
    ys.push(cy + Math.sin(th) * R * 1.04);
  }
  return { ...finalize(xs, ys, n, rng, (R * 2 * Math.PI * turns) / main), focus: { x: cx, y: cy, r: R * 0.35 } };
};

/** A staircase climbing from the lower left to a light at the top. */
const stairs: Gen = (n, r, rng) => {
  const xs: number[] = [];
  const ys: number[] = [];
  const steps = 8;
  const sw = (r.w * 0.82) / steps;
  const sh = (r.h * 0.62) / steps;
  const x0 = r.x + r.w * 0.06;
  const y0 = r.y + r.h * 0.92;
  const pts: [number, number][] = [[x0, y0]];
  for (let k = 0; k < steps; k++) {
    const x = x0 + k * sw;
    const y = y0 - (k + 1) * sh;
    pts.push([x, y], [x + sw, y]);
  }
  const outline = Math.floor(n * 0.62);
  samplePolyline(pts, outline, false, xs, ys);
  // Each step casts a faint shadow line beneath it.
  const shade = Math.floor(n * 0.18);
  for (let i = 0; i < shade; i++) {
    const k = Math.floor(rng() * steps);
    const x = x0 + k * sw + rng() * sw;
    const top = y0 - (k + 1) * sh;
    xs.push(x);
    ys.push(top + sh * 0.35 + rng() * (y0 - top - sh * 0.35));
  }
  const glowN = n - outline - shade;
  const gx = x0 + steps * sw;
  const gy = y0 - steps * sh - sh * 1.4;
  for (let i = 0; i < glowN; i++) {
    const th = (i / glowN) * Math.PI * 2 * 3;
    const rr = sh * (0.4 + (i / glowN) * 0.9);
    xs.push(gx + Math.cos(th) * rr);
    ys.push(gy + Math.sin(th) * rr);
  }
  return { ...finalize(xs, ys, n, rng, (r.w * 0.82 + r.h * 0.62) / outline), focus: { x: gx, y: gy, r: sh * 1.4 } };
};

export const forms: Record<FormName, Gen> = {
  lattice,
  frames,
  drift,
  concentric,
  monolith,
  strata,
  horizon,
  ascent,
  spiral,
  stairs,
};
