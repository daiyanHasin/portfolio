/**
 * Optional sound. Muted by default; the AudioContext is created only after the
 * visitor turns sound on (a user gesture), and nothing ever autoplays.
 */
let ctx: AudioContext | null = null;
let enabled = false;

export const sound = {
  get enabled() {
    return enabled;
  },
  setEnabled(on: boolean) {
    enabled = on;
    if (on && !ctx) {
      try {
        ctx = new AudioContext();
      } catch {
        enabled = false;
      }
    }
    if (on) void ctx?.resume();
  },
  /** A short filtered breath of noise, like a shutter, for scene cuts. */
  cut() {
    if (!enabled || !ctx) return;
    const len = Math.floor(ctx.sampleRate * 0.22);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 0.22);
    const gain = ctx.createGain();
    gain.gain.value = 0.08;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  },
  /** A barely audible tick for hover and focus on projects. */
  tick() {
    if (!enabled || !ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 1760;
    gain.gain.setValueAtTime(0.018, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  },
};
