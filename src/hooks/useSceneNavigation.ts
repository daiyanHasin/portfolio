import { useEffect, useRef } from "react";

interface Options {
  enabled: boolean;
  next: () => void;
  prev: () => void;
  jump: (index: number) => void;
  /** Called for any input while the intro is still playing. */
  onAnyInput?: () => void;
}

/** Does an element inside `.own-scroll` still have room to scroll in this direction? */
function canScroll(target: EventTarget | null, dir: 1 | -1): boolean {
  let el = target instanceof Element ? target.closest(".own-scroll") : null;
  while (el) {
    const h = el as HTMLElement;
    if (h.scrollHeight > h.clientHeight + 1) {
      if (dir > 0 && h.scrollTop + h.clientHeight < h.scrollHeight - 1) return true;
      if (dir < 0 && h.scrollTop > 0) return true;
    }
    el = h.parentElement?.closest(".own-scroll") ?? null;
  }
  return false;
}

const isTyping = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * Keyboard (arrows, Page Up/Down, number keys, Home), wheel and vertical swipe move
 * between scenes. Inner scroll areas keep their own scrolling until they reach
 * an end, so nothing becomes a scroll trap.
 */
export function useSceneNavigation({ enabled, next, prev, jump, onAnyInput }: Options) {
  const opts = useRef({ enabled, next, prev, jump, onAnyInput });
  opts.current = { enabled, next, prev, jump, onAnyInput };

  useEffect(() => {
    let wheelAcc = 0;
    let lockUntil = 0;
    let touchStart: { x: number; y: number; target: EventTarget | null } | null = null;

    const fire = (dir: 1 | -1) => {
      const now = performance.now();
      if (now < lockUntil) return;
      lockUntil = now + 1150;
      wheelAcc = 0;
      if (dir > 0) opts.current.next();
      else opts.current.prev();
    };

    const onKey = (e: KeyboardEvent) => {
      if (opts.current.onAnyInput) {
        opts.current.onAnyInput();
        return;
      }
      if (!opts.current.enabled || isTyping(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key;
      if (k === "ArrowRight" || k === "PageDown" || (k === "ArrowDown" && !canScroll(e.target, 1))) {
        e.preventDefault();
        opts.current.next();
      } else if (k === "ArrowLeft" || k === "PageUp" || (k === "ArrowUp" && !canScroll(e.target, -1))) {
        e.preventDefault();
        opts.current.prev();
      } else if (k === "Home") {
        e.preventDefault();
        opts.current.jump(0);
      } else if (/^[1-9]$/.test(k)) {
        opts.current.jump(Number(k) - 1);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (opts.current.onAnyInput) {
        opts.current.onAnyInput();
        return;
      }
      if (!opts.current.enabled) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      if (canScroll(e.target, dir)) {
        wheelAcc = 0;
        return;
      }
      wheelAcc += e.deltaY;
      if (Math.abs(wheelAcc) > 60) fire(wheelAcc > 0 ? 1 : -1);
    };

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStart = { x: t.clientX, y: t.clientY, target: e.target };
    };
    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart || !opts.current.enabled) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.x;
      const dy = t.clientY - touchStart.y;
      const start = touchStart;
      touchStart = null;
      if (Math.abs(dy) < 70 || Math.abs(dy) < Math.abs(dx) * 1.5) return;
      const dir = dy < 0 ? 1 : -1;
      if (canScroll(start.target, dir)) return;
      fire(dir);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);
}
