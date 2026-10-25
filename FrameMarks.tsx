import { motion } from "motion/react";

/** Four corner marks: the frame is implied, never drawn closed. */
export function FrameMarks({ visible, reduced }: { visible: boolean; reduced: boolean }) {
  const corners = [
    "left-3 top-3 sm:left-4 sm:top-4",
    "right-3 top-3 sm:right-4 sm:top-4 rotate-90",
    "right-3 bottom-3 sm:right-4 sm:bottom-4 rotate-180",
    "left-3 bottom-3 sm:left-4 sm:bottom-4 -rotate-90",
  ];
  return (
    <div aria-hidden="true" className="chrome pointer-events-none fixed inset-0 z-30 text-dim" style={{ padding: "var(--safe-top) 0 var(--safe-bottom)" }}>
      {corners.map((c, i) => (
        <svg key={i} className={`absolute h-4 w-4 ${c}`} viewBox="0 0 16 16" fill="none">
          <motion.path
            d="M0.5 16 V0.5 H16"
            stroke="currentColor"
            strokeWidth="1"
            initial={{ pathLength: reduced ? 1 : 0, opacity: reduced ? 0 : 1 }}
            animate={visible ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: reduced ? 0.3 : 0.9, delay: reduced ? 0 : i * 0.08, ease: [0.76, 0, 0.24, 1] }}
          />
        </svg>
      ))}
    </div>
  );
}
