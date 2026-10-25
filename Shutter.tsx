import { useEffect, useRef } from "react";
import type { SceneId } from "../data/schema";
import { grades } from "../config/palette";
import { duration, easeCss } from "../config/motion";

interface Props {
  from: SceneId;
  to: SceneId;
  direction: 1 | -1;
  reduced: boolean;
  label: string;
  onDone: () => void;
}

/**
 * The cut. The next scene's ground wipes across the frame behind the field,
 * led by a single hairline in that scene's leader colour. Forward cuts travel
 * upward, backward cuts downward. The field itself never cuts: it stays on
 * screen and re-forms, which is what carries the eye across the edit.
 */
export function Shutter({ from, to, direction, reduced, label, onDone }: Props) {
  const plate = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    if (from === to) return;
    const p = plate.current;
    const e = edge.current;
    if (!p || !e) return;
    const ms = reduced ? 260 : duration.wipe * 1000;
    const anims: Animation[] = [];
    if (reduced) {
      anims.push(p.animate([{ opacity: 0 }, { opacity: 1 }], { duration: ms, fill: "forwards" }));
    } else {
      const startClip = direction > 0 ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)";
      anims.push(
        p.animate([{ clipPath: startClip }, { clipPath: "inset(0 0 0 0)" }], { duration: ms, easing: easeCss.cut, fill: "forwards" }),
      );
      anims.push(
        e.animate(
          direction > 0
            ? [{ transform: "translateY(100vh)", opacity: 1 }, { transform: "translateY(0)", opacity: 1 }, { opacity: 0 }]
            : [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(100vh)", opacity: 1 }, { opacity: 0 }],
          { duration: ms * 1.15, easing: easeCss.cut, fill: "forwards" },
        ),
      );
    }
    let cancelled = false;
    anims[0].finished.then(() => !cancelled && done.current()).catch(() => {});
    return () => {
      cancelled = true;
      anims.forEach((a) => a.cancel());
    };
  }, [from, to, direction, reduced]);

  if (from === to) return null;
  const g = grades[to];
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[1]">
      <div ref={plate} className="absolute inset-0" style={{ background: g.bg, clipPath: reduced ? undefined : "inset(100% 0 0 0)", opacity: reduced ? 0 : 1 }} />
      {!reduced && (
        <div ref={edge} className="absolute inset-x-0 top-0" style={{ opacity: 0 }}>
          <div className="h-px w-full" style={{ background: g.leader }} />
          <div className="absolute right-6 -top-6 font-mono text-note" style={{ color: g.leader }}>
            {label}
          </div>
        </div>
      )}
    </div>
  );
}
