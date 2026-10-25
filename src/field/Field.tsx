import { useEffect, useRef } from "react";
import { FieldEngine } from "./engine";
import { field } from "./controller";

/** The canvas that every scene shares. Purely decorative for assistive tech. */
export function Field({ reduced }: { reduced: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<FieldEngine | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let engine: FieldEngine;
    try {
      engine = new FieldEngine(canvas, { reduced });
    } catch {
      // No canvas support: the site still works, it simply has no field.
      return;
    }
    engineRef.current = engine;
    field.attach(engine);

    const onMove = (e: PointerEvent) => engine.pointer(e.clientX, e.clientY);
    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => engine.resize(), 120);
    };
    const onVisibility = () => (document.hidden ? engine.stop() : engine.start());

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);
    engine.start();

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearTimeout(resizeTimer);
      engine.destroy();
      field.detach();
      engineRef.current = null;
    };
    // The engine is created once; reduced-motion changes are pushed below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    engineRef.current?.setReduced(reduced);
  }, [reduced]);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-10" />;
}
