import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { field } from "../field/controller";
import { rise } from "../config/variants";

interface Props {
  lines: string[];
  reduced: boolean;
  id?: string;
  offsets: string[];
}

/** Reduced-motion composition: each line holds one fixed width. */
const STATIC_WIDTHS = [76, 100, 124];

/**
 * The headline obeys the field's rule. Letters near the gaze open up to their
 * widest, lightest form; letters far from it compress and darken.
 */
export function GazeHeadline({ lines, reduced, id, offsets }: Props) {
  const letters = useRef<HTMLSpanElement[]>([]);
  letters.current = [];

  useEffect(() => {
    if (reduced) return;
    const els = letters.current;
    const cur = els.map(() => 0);
    let centers: { x: number; y: number }[] = [];
    let frame = 0;
    const measure = () => {
      centers = els.map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      });
    };
    const off = field.onFrame(({ gx, gy, gr }) => {
      if (frame++ % 24 === 0) measure();
      const reach = gr * 1.35;
      for (let i = 0; i < els.length; i++) {
        const c = centers[i];
        if (!c) continue;
        const d = Math.hypot(c.x - gx, (c.y - gy) * 1.4);
        const t = Math.max(0, 1 - d / reach);
        const eased = t * t * (3 - 2 * t);
        const next = cur[i] + (eased - cur[i]) * 0.12;
        if (Math.abs(next - cur[i]) > 0.002 || frame < 3) {
          cur[i] = next;
          const wdth = 66 + 59 * next;
          const wght = 600 - 420 * next;
          els[i].style.fontVariationSettings = `"wdth" ${wdth.toFixed(1)}, "wght" ${wght.toFixed(0)}`;
        }
      }
    });
    return off;
  }, [reduced, lines]);

  return (
    <h1 id={id} aria-label={lines.join(" ")} className="font-display text-[15.5vw] leading-[0.86] tracking-[-0.015em] sm:text-headline">
      {lines.map((line, li) => (
        <span key={li} aria-hidden="true" className="block overflow-hidden pb-[0.06em]" style={{ marginLeft: offsets[li % offsets.length] }}>
          <motion.span className="block whitespace-nowrap" variants={rise(reduced)} custom={li}>
            {Array.from(line).map((ch, ci) =>
              ch === " " ? (
                <span key={ci}> </span>
              ) : (
                <span
                  key={ci}
                  ref={(el) => {
                    if (el) letters.current.push(el);
                  }}
                  className="inline-block"
                  style={{
                    fontVariationSettings: reduced
                      ? `"wdth" ${STATIC_WIDTHS[li % 3]}, "wght" 380`
                      : `"wdth" 66, "wght" 600`,
                  }}
                >
                  {ch}
                </span>
              ),
            )}
          </motion.span>
        </span>
      ))}
    </h1>
  );
}
