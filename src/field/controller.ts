import type { Directive, FieldEngine, FrameInfo } from "./engine";

/**
 * A tiny bridge so any component can direct the field without prop drilling.
 * Calls made before the canvas mounts are queued and applied on attach.
 */
let engine: FieldEngine | null = null;
let pendingDirective: Directive | null = null;
let pendingMaster: { a: number; immediate: boolean } | null = null;
let pendingDisperse = false;
const frameSubs = new Set<(f: FrameInfo) => void>();
const statSubs = new Set<(o: number) => void>();

export const field = {
  attach(e: FieldEngine) {
    engine = e;
    e.onStat = (o) => statSubs.forEach((fn) => fn(o));
    e.subscribe((f) => frameSubs.forEach((fn) => fn(f)));
    if (pendingDisperse) e.disperse();
    if (pendingDirective) e.setDirective(pendingDirective);
    if (pendingMaster) e.setMaster(pendingMaster.a, pendingMaster.immediate);
    pendingDisperse = false;
  },
  detach() {
    engine = null;
  },
  set(d: Directive) {
    pendingDirective = d;
    engine?.setDirective(d);
  },
  setMaster(a: number, immediate = false) {
    pendingMaster = { a, immediate };
    engine?.setMaster(a, immediate);
  },
  disperse() {
    if (engine) engine.disperse();
    else pendingDisperse = true;
  },
  onFrame(fn: (f: FrameInfo) => void) {
    frameSubs.add(fn);
    return () => void frameSubs.delete(fn);
  },
  onStat(fn: (o: number) => void) {
    statSubs.add(fn);
    return () => void statSubs.delete(fn);
  },
};
