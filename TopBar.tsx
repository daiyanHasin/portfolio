import { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { field } from "../field/controller";
import { content } from "../data/content";

interface Props {
  visible: boolean;
  soundOn: boolean;
  onSound: () => void;
  onHome: () => void;
}

/** Name on the left; on the right, a live reading of how much of the field is in order. */
export function TopBar({ visible, soundOn, onSound, onHome }: Props) {
  const readout = useRef<HTMLSpanElement>(null);
  const { identity, labels } = content;

  useEffect(
    () =>
      field.onStat((o) => {
        if (readout.current) readout.current.textContent = o.toFixed(3);
      }),
    [],
  );

  return (
    <motion.header
      className="chrome fixed inset-x-0 top-0 z-30 flex items-start justify-between px-6 text-fg sm:px-9"
      style={{ paddingTop: "calc(var(--safe-top) + 1.35rem)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
    >
      <button onClick={onHome} className="group text-left" aria-label={`${identity.displayName}, return to the index`}>
        <span className="block text-small font-medium" style={{ fontVariationSettings: '"wdth" 100' }}>
          <span className="draw-line">{identity.displayName}</span>
        </span>
        {identity.studyTitle && (
          <span className="hidden font-serif text-small italic text-dim sm:block">{identity.studyTitle}</span>
        )}
      </button>
      <div className="flex items-baseline gap-6 font-mono text-note text-dim">
        <span className="hidden tabular-nums sm:inline" aria-hidden="true">
          {labels.orderReadout} <span ref={readout}>0.000</span>
        </span>
        <button onClick={onSound} aria-pressed={soundOn} className="draw-line text-fg">
          {soundOn ? labels.soundOn : labels.soundOff}
        </button>
      </div>
    </motion.header>
  );
}
