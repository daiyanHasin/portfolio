import { forms, mulberry32, type FormName, type Region } from "./forms";

/**
 * The field's rule: points hold their form only where they are observed.
 * On top of that the whole field flows, like air over warm ground, and a few
 * embers always rise through it.
 *
 * Every point has a target (its place in the current form) and a private drift.
 * Near the gaze (the pointer, or a slow wandering eye when nobody is pointing),
 * a point's "order" rises and its drift disappears; once the gaze leaves, order
 * decays slowly, so the field remembers where you looked for a few seconds.
 * About one point in ninety never obeys. Those are drawn in vermilion.
 */

export interface Directive {
  form: FormName;
  region: Region;
  seed: number;
  point: string;
  line: string;
  irregular: string;
  /** 0 = still, 1 = normal drift, >1 = restless. */
  entropy: number;
  /** Strength of the fluid current that bends the whole form (0 = none). */
  flow: number;
  /** Colour of the rising embers. */
  mote: string;
  /** Overall opacity of the field for this scene (0 to 1). */
  alpha: number;
  /** Soft bloom around bright points, for dark skies. */
  glow: boolean;
  /** How visible the form stays where nobody is looking (0 = only under the gaze, 1 = always). */
  presence: number;
}

type RGB = [number, number, number];

const hex = (h: string): RGB => {
  const s = h.replace("#", "");
  const v = parseInt(s.length === 3 ? s.replace(/./g, "$&$&") : s, 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const rgb = (c: RGB) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const mix = (a: RGB, b: RGB, t: number) => {
  a[0] += (b[0] - a[0]) * t;
  a[1] += (b[1] - a[1]) * t;
  a[2] += (b[2] - a[2]) * t;
};

export interface FrameInfo {
  gx: number;
  gy: number;
  gr: number;
}

export class FieldEngine {
  private ctx: CanvasRenderingContext2D;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private n = 0;

  private px = new Float32Array(0);
  private py = new Float32Array(0);
  private tx = new Float32Array(0);
  private ty = new Float32Array(0);
  private vx = new Float32Array(0);
  private vy = new Float32Array(0);
  private ord = new Float32Array(0);
  private ph = new Float32Array(0);
  private fr = new Float32Array(0);
  private k = new Float32Array(0);
  private irr = new Uint8Array(0);
  private pairs = new Int32Array(0);
  private pairCount = 0;
  /** Threads longer than this (squared, px) are not drawn: those points are still on their way. */
  private maxThread2 = 0;

  // Embers: a separate, small population that only ever rises.
  private mN = 0;
  private mx = new Float32Array(0);
  private my = new Float32Array(0);
  private ms = new Float32Array(0);
  private mp = new Float32Array(0);
  private mz = new Float32Array(0);

  private directive: Directive | null = null;
  private cPoint: RGB = [28, 26, 23];
  private cLine: RGB = [28, 26, 23];
  private cIrr: RGB = [201, 69, 42];
  private tPoint: RGB = [28, 26, 23];
  private tLine: RGB = [28, 26, 23];
  private tIrr: RGB = [201, 69, 42];
  private cMote: RGB = [255, 226, 168];
  /** Where the current form keeps its light, eased so it slides between scenes. */
  private focus = { x: 0, y: 0, r: 0, a: 0 };
  private focusTarget = { x: 0, y: 0, r: 0, a: 0 };
  private tMote: RGB = [255, 226, 168];
  private flow = 0;
  private flowTarget = 0;
  private alpha = 1;
  private alphaTarget = 1;
  private glow = 0;
  private glowTarget = 0;
  private presence = 0;
  private presenceTarget = 0;
  private entropy = 3;
  private entropyTarget = 1;
  private master = 0;
  private masterTarget = 0;

  private gaze = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0, r: 160 };
  private lastPointer = -Infinity;
  private t = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private frame = 0;
  private reduced: boolean;
  private listeners = new Set<(f: FrameInfo) => void>();

  onStat: ((order: number) => void) | null = null;

  constructor(private canvas: HTMLCanvasElement, opts: { reduced: boolean }) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error("Canvas 2D unavailable");
    this.ctx = ctx;
    this.reduced = opts.reduced;
    this.resize();
    this.gaze.x = this.gaze.tx = this.w * 0.5;
    this.gaze.y = this.gaze.ty = this.h * 0.45;
  }

  /* ---------- public API ---------- */

  subscribe(fn: (f: FrameInfo) => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setReduced(r: boolean) {
    this.reduced = r;
    this.poke();
  }

  setMaster(alpha: number, immediate = false) {
    this.masterTarget = alpha;
    if (immediate) this.master = alpha;
    this.poke();
  }

  /** Throws every point to a random place, so the next form has to assemble itself. */
  disperse() {
    for (let i = 0; i < this.n; i++) {
      this.px[i] = Math.random() * this.w;
      this.py[i] = Math.random() * this.h;
      this.ord[i] = 0;
    }
    this.entropy = 3;
    this.poke();
  }

  setDirective(d: Directive) {
    const prev = this.directive;
    this.directive = d;
    const sameShape =
      prev &&
      prev.form === d.form &&
      prev.seed === d.seed &&
      prev.region.x === d.region.x &&
      prev.region.y === d.region.y &&
      prev.region.w === d.region.w &&
      prev.region.h === d.region.h;
    if (!sameShape) this.buildTargets();
    this.tPoint = hex(d.point);
    this.tLine = hex(d.line);
    this.tIrr = hex(d.irregular);
    this.tMote = hex(d.mote);
    this.entropyTarget = d.entropy;
    this.flowTarget = d.flow;
    this.alphaTarget = d.alpha;
    this.glowTarget = d.glow ? 1 : 0;
    this.presenceTarget = d.presence;
    if (!prev) {
      this.presence = this.presenceTarget;
      this.cPoint = [...this.tPoint];
      this.cLine = [...this.tLine];
      this.cIrr = [...this.tIrr];
      this.cMote = [...this.tMote];
      this.flow = this.flowTarget;
      this.alpha = this.alphaTarget;
      this.glow = this.glowTarget;
    }
    this.poke();
  }

  pointer(x: number, y: number) {
    const g = this.gaze;
    const now = performance.now();
    if (now - this.lastPointer < 120) {
      g.vx = Math.max(-40, Math.min(40, x - g.tx));
      g.vy = Math.max(-40, Math.min(40, y - g.ty));
    }
    g.tx = x;
    g.ty = y;
    this.lastPointer = now;
    this.poke();
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    const small = w < 720;
    const s = small ? 24 : 29;
    const target = Math.max(420, Math.min(small ? 760 : 1700, Math.round((w * h) / (s * s))));
    if (this.n === 0 || Math.abs(target - this.n) / this.n > 0.12) this.alloc(target);
    this.allocMotes(small ? 70 : 150);
    this.gaze.r = Math.min(w, h) * (small ? 0.26 : 0.19);
    if (this.directive) this.buildTargets();
    this.poke();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    this.listeners.clear();
    this.onStat = null;
  }

  /* ---------- internals ---------- */

  private poke() {
    if (!document.hidden) this.start();
  }

  private alloc(n: number) {
    const oldN = this.n;
    const opx = this.px;
    const opy = this.py;
    this.n = n;
    this.px = new Float32Array(n);
    this.py = new Float32Array(n);
    this.tx = new Float32Array(n);
    this.ty = new Float32Array(n);
    this.vx = new Float32Array(n);
    this.vy = new Float32Array(n);
    this.ord = new Float32Array(n);
    this.ph = new Float32Array(n * 4);
    this.fr = new Float32Array(n);
    this.k = new Float32Array(n);
    this.irr = new Uint8Array(n);
    const rng = mulberry32(7);
    for (let i = 0; i < n; i++) {
      this.px[i] = i < oldN ? opx[i] : rng() * this.w;
      this.py[i] = i < oldN ? opy[i] : rng() * this.h;
      for (let j = 0; j < 4; j++) this.ph[i * 4 + j] = rng() * Math.PI * 2;
      this.fr[i] = 0.55 + rng() * 0.9;
      this.k[i] = 0.045 + rng() * 0.06;
      this.irr[i] = i % 89 === 41 ? 1 : 0;
    }
  }

  private allocMotes(n: number) {
    if (n === this.mN) return;
    this.mN = n;
    this.mx = new Float32Array(n);
    this.my = new Float32Array(n);
    this.ms = new Float32Array(n);
    this.mp = new Float32Array(n);
    this.mz = new Float32Array(n);
    for (let i = 0; i < n; i++) this.respawnMote(i, true);
  }

  private respawnMote(i: number, anywhere: boolean) {
    this.mx[i] = Math.random() * this.w;
    this.my[i] = anywhere ? Math.random() * this.h : this.h + 10 + Math.random() * 40;
    this.mz[i] = 0.35 + Math.random() * 0.65; // depth: nearer embers are larger, faster, brighter
    this.ms[i] = (14 + Math.random() * 30) * this.mz[i];
    this.mp[i] = Math.random() * Math.PI * 2;
  }

  private buildTargets() {
    const d = this.directive;
    if (!d) return;
    const gen = forms[d.form] ?? forms.lattice;
    const res = gen(this.n, d.region, mulberry32(d.seed));
    this.tx = res.x;
    this.ty = res.y;
    if (res.focus) {
      this.focusTarget = { ...res.focus, a: 1 };
      if (this.focus.a < 0.01) this.focus = { ...res.focus, a: 0 };
    } else {
      this.focusTarget = { ...this.focusTarget, a: 0 };
    }
    this.buildPairs(res.spacing * 1.25);
  }

  /** Connect each point to at most two nearby neighbours in the target form. */
  private buildPairs(threshold: number) {
    const n = this.n;
    const cell = Math.max(threshold, 1);
    const grid = new Map<number, number[]>();
    const key = (cx: number, cy: number) => cx * 92821 + cy;
    for (let i = 0; i < n; i++) {
      const k = key(Math.floor(this.tx[i] / cell), Math.floor(this.ty[i] / cell));
      let b = grid.get(k);
      if (!b) grid.set(k, (b = []));
      b.push(i);
    }
    const out = new Int32Array(n * 4);
    let c = 0;
    const t2 = threshold * threshold;
    for (let i = 0; i < n; i++) {
      const cx = Math.floor(this.tx[i] / cell);
      const cy = Math.floor(this.ty[i] / cell);
      let found = 0;
      for (let ox = -1; ox <= 1 && found < 2; ox++) {
        for (let oy = -1; oy <= 1 && found < 2; oy++) {
          const b = grid.get(key(cx + ox, cy + oy));
          if (!b) continue;
          for (const j of b) {
            if (j <= i) continue;
            const dx = this.tx[j] - this.tx[i];
            const dy = this.ty[j] - this.ty[i];
            if (dx * dx + dy * dy < t2) {
              out[c++] = i;
              out[c++] = j;
              if (++found >= 2) break;
            }
          }
        }
      }
    }
    this.pairs = out;
    this.pairCount = c / 2;
    this.maxThread2 = (threshold * 2.2) ** 2;
  }

  private loop = (now: number) => {
    if (!this.running) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
    this.last = now;
    const settled = this.step(dt, now);
    this.draw();
    if (this.reduced && settled) {
      this.running = false;
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  /** Advances the simulation. Returns true when nothing visible is changing. */
  private step(dt: number, now: number): boolean {
    const g = this.gaze;
    const reduced = this.reduced;
    if (!reduced) this.t += dt;

    // With no pointer for a while, the eye wanders on its own, slowly.
    if (!reduced && now - this.lastPointer > 3200) {
      const t = this.t;
      g.tx = this.w * (0.5 + 0.33 * Math.sin(t * 0.11));
      g.ty = this.h * (0.48 + 0.27 * Math.sin(t * 0.17 + 1.3));
    }
    const follow = reduced ? 1 : 0.12;
    g.x += (g.tx - g.x) * follow;
    g.y += (g.ty - g.y) * follow;
    g.vx *= 0.86;
    g.vy *= 0.86;

    const lerpC = reduced ? 1 : 0.07;
    mix(this.cPoint, this.tPoint, lerpC);
    mix(this.cLine, this.tLine, lerpC);
    mix(this.cIrr, this.tIrr, lerpC);
    mix(this.cMote, this.tMote, lerpC);
    this.flow += (this.flowTarget - this.flow) * (reduced ? 1 : 0.03);
    this.alpha += (this.alphaTarget - this.alpha) * (reduced ? 1 : 0.05);
    this.glow += (this.glowTarget - this.glow) * (reduced ? 1 : 0.05);
    this.presence += (this.presenceTarget - this.presence) * (reduced ? 1 : 0.04);
    const ft = this.focusTarget;
    const fe = reduced ? 1 : 0.06;
    this.focus.x += (ft.x - this.focus.x) * fe;
    this.focus.y += (ft.y - this.focus.y) * fe;
    this.focus.r += (ft.r - this.focus.r) * fe;
    this.focus.a += (ft.a - this.focus.a) * (reduced ? 1 : 0.04);
    this.entropy += (this.entropyTarget - this.entropy) * (reduced ? 1 : 0.025);
    this.master += (this.masterTarget - this.master) * (reduced ? 1 : 0.05);

    const amp = this.entropy * Math.min(this.w, this.h) * 0.021;
    // The current: two slow travelling waves crossing the frame, so the whole form sways like water.
    const fAmp = reduced ? 0 : this.flow * Math.min(this.w, this.h) * 0.018;
    const kf = 5.2 / Math.max(this.w, this.h);
    const R2 = g.r * g.r;
    const P2 = R2 * 0.45;
    const t = this.t;
    // Everything below is tuned per 60 fps frame; scale by elapsed time so slow devices settle just as fast.
    const f60 = reduced ? 1 : Math.min(dt * 60, 4);
    const damp = Math.pow(0.9, f60);
    const disturb = !reduced && Math.abs(g.vx) + Math.abs(g.vy) > 0.5;
    let sumOrd = 0;
    let maxMove = 0;
    let maxOrdDelta = 0;

    for (let i = 0; i < this.n; i++) {
      const x = this.px[i];
      const y = this.py[i];
      const dx = x - g.x;
      const dy = y - g.y;
      const d2 = dx * dx + dy * dy;
      const isIrr = this.irr[i] === 1;

      let o = this.ord[i];
      const want = isIrr || d2 >= R2 ? 0 : Math.min(1, (1 - d2 / R2) * 1.6);
      const before = o;
      const rate = want > o ? 0.2 : reduced ? 0.2 : 0.011;
      o += (want - o) * (1 - Math.pow(1 - rate, f60));
      this.ord[i] = o;
      if (Math.abs(o - before) > maxOrdDelta) maxOrdDelta = Math.abs(o - before);
      sumOrd += o;

      const p = i * 4;
      const f = this.fr[i];
      const a = amp * (isIrr ? 2.6 : 1) * (1 - Math.max(o, this.presence * 0.8));
      const ox = Math.sin(t * 0.55 * f + this.ph[p]) + 0.5 * Math.sin(t * 1.27 * f + this.ph[p + 1]);
      const oy = Math.cos(t * 0.47 * f + this.ph[p + 2]) + 0.5 * Math.sin(t * 1.09 * f + this.ph[p + 3]);

      if (disturb && d2 < P2) {
        const fall = 1 - d2 / P2;
        this.vx[i] += g.vx * 0.05 * fall;
        this.vy[i] += g.vy * 0.05 * fall;
      }
      this.vx[i] *= damp;
      this.vy[i] *= damp;

      let fx = 0;
      let fy = 0;
      if (fAmp > 0) {
        const tx = this.tx[i];
        const ty = this.ty[i];
        const calm = 1 - 0.45 * Math.max(o, this.presence);
        fx = fAmp * calm * (Math.sin(ty * kf + t * 0.62) + 0.6 * Math.sin((tx + ty) * kf * 0.7 - t * 0.41));
        fy = fAmp * calm * (Math.cos(tx * kf * 0.9 - t * 0.53) * 0.7 - 0.35 * Math.sin(ty * kf * 1.3 + t * 0.8));
      }

      const k = reduced ? 1 : 1 - Math.pow(1 - this.k[i], f60);
      const mx = (this.tx[i] + fx + ox * a - x) * k + this.vx[i];
      const my = (this.ty[i] + fy + oy * a - y) * k + this.vy[i];
      this.px[i] = x + mx;
      this.py[i] = y + my;
      const m = Math.abs(mx) + Math.abs(my);
      if (m > maxMove) maxMove = m;
    }

    if (!reduced) {
      for (let i = 0; i < this.mN; i++) {
        this.my[i] -= this.ms[i] * dt;
        this.mx[i] += Math.sin(t * 0.9 * this.mz[i] + this.mp[i]) * 18 * dt * this.mz[i] + fAmp * 0.02 * Math.sin(this.my[i] * kf + t);
        // Embers part around the gaze, the way dust parts around a hand.
        const dx = this.mx[i] - g.x;
        const dy = this.my[i] - g.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 * 0.5 && d2 > 1) {
          const push = (1 - d2 / (R2 * 0.5)) * 60 * dt;
          const d = Math.sqrt(d2);
          this.mx[i] += (dx / d) * push;
          this.my[i] += (dy / d) * push;
        }
        if (this.my[i] < -12 || this.mx[i] < -20 || this.mx[i] > this.w + 20) this.respawnMote(i, false);
      }
    }

    if (++this.frame % 8 === 0 && this.onStat) this.onStat(sumOrd / Math.max(this.n, 1));
    const info = { gx: g.x, gy: g.y, gr: g.r };
    this.listeners.forEach((fn) => fn(info));

    return (
      maxMove < 0.05 &&
      maxOrdDelta < 0.002 &&
      Math.abs(this.masterTarget - this.master) < 0.01 &&
      Math.abs(this.alphaTarget - this.alpha) < 0.01
    );
  }

  private draw() {
    const { ctx, dpr, n } = this;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    const m = this.master * this.alpha;
    if (m < 0.005) return;

    // The light the form reaches for: a breathing glow, and on dark skies, slowly turning rays.
    const f = this.focus;
    if (f.a > 0.01 && f.r > 1) {
      const pulse = 1 + 0.08 * Math.sin(this.t * 0.9);
      const strength = f.a * m * (0.35 + 0.65 * this.glow);
      const R = f.r * 3.2 * pulse;
      const c = this.cMote;
      const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, R);
      grad.addColorStop(0, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${0.55 * strength})`);
      grad.addColorStop(0.35, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${0.18 * strength})`);
      grad.addColorStop(1, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0)`);
      ctx.globalAlpha = 1;
      ctx.fillStyle = grad;
      ctx.fillRect(f.x - R, f.y - R, R * 2, R * 2);

      if (this.glow > 0.02) {
        const L = Math.hypot(this.w, this.h);
        const rays = new Path2D();
        const count = 12;
        for (let k = 0; k < count; k++) {
          const a = (k / count) * Math.PI * 2 + this.t * 0.035;
          const wdt = 0.035 + 0.02 * Math.sin(this.t * 0.4 + k * 1.7);
          rays.moveTo(f.x, f.y);
          rays.lineTo(f.x + Math.cos(a - wdt) * L, f.y + Math.sin(a - wdt) * L);
          rays.lineTo(f.x + Math.cos(a + wdt) * L, f.y + Math.sin(a + wdt) * L);
          rays.closePath();
        }
        const rg = ctx.createRadialGradient(f.x, f.y, f.r * 0.5, f.x, f.y, L * 0.55);
        rg.addColorStop(0, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${0.1 * strength * this.glow})`);
        rg.addColorStop(1, `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},0)`);
        ctx.fillStyle = rg;
        ctx.fill(rays);
      }
    }

    // Embers next, so the form sits in front of them.
    if (!this.reduced && this.mN) {
      const near = new Path2D();
      const far = new Path2D();
      for (let i = 0; i < this.mN; i++) {
        const z = this.mz[i];
        const r = 0.6 + z * 1.6;
        const p = z > 0.7 ? near : far;
        p.moveTo(this.mx[i] + r, this.my[i]);
        p.arc(this.mx[i], this.my[i], r, 0, Math.PI * 2);
      }
      ctx.fillStyle = rgb(this.cMote);
      const twinkle = 0.8 + 0.2 * Math.sin(this.t * 2.3);
      ctx.globalAlpha = 0.26 * m;
      ctx.fill(far);
      ctx.globalAlpha = 0.55 * m * twinkle;
      ctx.fill(near);
    }

    // Lines: only between points that are both currently held in order.
    const l1 = new Path2D();
    const l2 = new Path2D();
    const l3 = new Path2D();
    const pr = this.pairs;
    for (let c = 0; c < this.pairCount; c++) {
      const a = pr[c * 2];
      const b = pr[c * 2 + 1];
      const o = Math.max(Math.min(this.ord[a], this.ord[b]), this.presence);
      if (o < 0.3) continue;
      const ddx = this.px[b] - this.px[a];
      const ddy = this.py[b] - this.py[a];
      if (ddx * ddx + ddy * ddy > this.maxThread2) continue;
      const path = o > 0.72 ? l1 : o > 0.5 ? l2 : l3;
      path.moveTo(this.px[a], this.py[a]);
      path.lineTo(this.px[b], this.py[b]);
    }
    ctx.lineWidth = 0.75;
    ctx.strokeStyle = rgb(this.cLine);
    ctx.globalAlpha = 0.62 * m;
    ctx.stroke(l1);
    ctx.globalAlpha = 0.38 * m;
    ctx.stroke(l2);
    ctx.globalAlpha = 0.18 * m;
    ctx.stroke(l3);

    // Points, in four brightness buckets by order.
    const buckets = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
    const sizes = [1.3, 1.6, 1.9, 2.2];
    const irr = new Path2D();
    const bloom = this.glow > 0.02 ? new Path2D() : null;
    for (let i = 0; i < n; i++) {
      const x = this.px[i];
      const y = this.py[i];
      if (x < -4 || y < -4 || x > this.w + 4 || y > this.h + 4) continue;
      if (this.irr[i]) {
        irr.rect(x - 1.4, y - 1.4, 2.8, 2.8);
        continue;
      }
      const o = Math.max(this.ord[i], this.presence);
      const b = o > 0.75 ? 3 : o > 0.45 ? 2 : o > 0.15 ? 1 : 0;
      const s = sizes[b];
      buckets[b].rect(x - s / 2, y - s / 2, s, s);
      if (bloom && (b >= 2 || i % 3 === 0)) {
        bloom.moveTo(x + 4, y);
        bloom.arc(x, y, 4, 0, Math.PI * 2);
      }
    }
    if (bloom) {
      ctx.fillStyle = rgb(this.cMote);
      ctx.globalAlpha = 0.07 * m * this.glow;
      ctx.fill(bloom);
    }
    ctx.fillStyle = rgb(this.cPoint);
    const alphas = [0.3, 0.5, 0.74, 1];
    for (let b = 0; b < 4; b++) {
      ctx.globalAlpha = alphas[b] * m;
      ctx.fill(buckets[b]);
    }
    ctx.fillStyle = rgb(this.cIrr);
    ctx.globalAlpha = m;
    ctx.fill(irr);
    ctx.globalAlpha = 1;
  }
}
