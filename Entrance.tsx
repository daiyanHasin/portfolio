import { motion } from "motion/react";
import { content } from "../data/content";
import { GazeHeadline } from "../components/GazeHeadline";
import { drawRule, settle } from "../config/variants";

interface Props {
  reduced: boolean;
  coarse: boolean;
  small: boolean;
  /** False until the intro reaches the type. */
  revealed: boolean;
  detailsRevealed: boolean;
}

/**
 * The first frame. A headline that responds to where you look, and a small
 * gallery label in the corner. Nothing else asks for attention.
 */
export function Entrance({ reduced, coarse, small, revealed, detailsRevealed }: Props) {
  const { identity, labels, scenes } = content;
  const st = settle(reduced);
  return (
    <div className="relative h-full w-full">
      <motion.div
        className="absolute left-[6vw] right-0 top-[17vh] sm:top-[18vh]"
        initial="hidden"
        animate={revealed ? "shown" : "hidden"}
      >
        <GazeHeadline
          id="scene-home-title"
          lines={identity.headline}
          reduced={reduced}
          offsets={small ? ["0", "5vw", "14vw"] : ["0", "9vw", "27vw"]}
        />
      </motion.div>

      <motion.div
        initial="hidden"
        animate={detailsRevealed ? "shown" : "hidden"}
        className="absolute inset-x-0 flex flex-col-reverse items-start gap-7 px-6 sm:flex-row sm:items-end sm:justify-between sm:pl-[6vw] sm:pr-9"
        style={{ bottom: "calc(var(--safe-bottom) + 5.6rem)" }}
      >
        <motion.p variants={st} custom={0} className="max-w-[24ch] font-mono text-note text-dim">
          {coarse ? labels.touchHint : labels.pointerHint}
          {!coarse && labels.keyboardHint && <span className="mt-1 block">{labels.keyboardHint}</span>}
        </motion.p>

        <aside aria-label="About this study" className="w-[min(20rem,100%)]">
          <motion.div variants={drawRule(reduced)} custom={0} className="mb-3 h-px origin-left bg-rule" />
          <motion.p variants={st} custom={1} className="text-small font-semibold" style={{ fontVariationSettings: '"wdth" 100' }}>
            {identity.displayName}
          </motion.p>
          {identity.studyTitle && (
            <motion.p variants={st} custom={2} className="font-serif text-body italic">
              {identity.studyTitle}
            </motion.p>
          )}
          {identity.label.length > 0 && (
            <motion.dl variants={st} custom={3} className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 font-mono text-note text-dim">
              {identity.label.map((e) => (
                <div key={e.key} className="contents">
                  <dt>{e.key}</dt>
                  <dd>{e.value}</dd>
                </div>
              ))}
            </motion.dl>
          )}
          {identity.shortBio && !small && (
            <motion.p variants={st} custom={4} className="mt-3 font-serif text-small leading-[1.55] text-dim">
              {identity.shortBio}
            </motion.p>
          )}
        </aside>
        <p className="sr-only">{scenes.home.description}</p>
      </motion.div>
    </div>
  );
}
