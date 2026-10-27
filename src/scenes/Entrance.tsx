import { motion } from "motion/react";
import { content } from "../data/content";
import { GazeHeadline } from "../components/GazeHeadline";
import { Portrait } from "../components/Portrait";
import { drawRule, settle } from "../config/variants";

interface Props {
  reduced: boolean;
  coarse: boolean;
  small: boolean;
  /** False until the intro reaches the type. */
  revealed: boolean;
  detailsRevealed: boolean;
  onSeeWork: () => void;
}

/**
 * The first frame. The field rises as a hand reaching for a light; the headline
 * says what the hand is doing. A small card in the corner says who this is.
 */
export function Entrance({ reduced, coarse, small, revealed, detailsRevealed, onSeeWork }: Props) {
  const { identity, labels, scenes } = content;
  // The short bio lives on the About scene; here it is only read out to screen readers.
  const st = settle(reduced);
  return (
    <div className="legible relative h-full w-full">
      <motion.div
        className="absolute left-[6vw] right-0 top-[15vh] sm:top-[16vh]"
        style={{
          // Short laptop screens: let the headline shrink with the height too, so it never meets the card below.
          ["--text-headline" as string]: "min(clamp(3.2rem, 0.5rem + 9.4vw, 10.5rem), 15vh)",
        }}
        initial="hidden"
        animate={revealed ? "shown" : "hidden"}
      >
        <GazeHeadline
          id="scene-home-title"
          lines={identity.headline}
          reduced={reduced}
          offsets={small ? ["0", "4vw", "8vw"] : ["0", "5vw", "10vw"]}
        />
      </motion.div>

      <motion.div
        initial="hidden"
        animate={detailsRevealed ? "shown" : "hidden"}
        className="absolute inset-x-0 flex flex-col items-start gap-6 px-6 sm:flex-row sm:items-end sm:justify-between sm:pl-[6vw] sm:pr-9"
        style={{ bottom: "calc(var(--safe-bottom) + 5.2rem)" }}
      >
        <aside aria-label="About" className="flex w-[min(36rem,100%)] items-end gap-5 sm:gap-7">
          <motion.div variants={st} custom={0} className="h-[8.5rem] w-[6.8rem] sm:h-[13.5rem] sm:w-[10.5rem]">
            <Portrait className="h-full w-full" />
          </motion.div>
          <div className="min-w-0 flex-1">
          <motion.div variants={drawRule(reduced)} custom={0} className="mb-3 h-px origin-left bg-rule" />
          <motion.p variants={st} custom={1} className="text-body font-semibold" style={{ fontVariationSettings: '"wdth" 100' }}>
            {identity.displayName}
          </motion.p>
          {(identity.positioning || identity.studyTitle) && (
            <motion.p variants={st} custom={2} className="font-serif text-body italic">
              {identity.positioning || identity.studyTitle}
            </motion.p>
          )}
          {identity.label.length > 0 && (
            <motion.dl variants={st} custom={3} className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-small text-dim">
              {identity.label.map((e) => (
                <div key={e.key} className="contents">
                  <dt className="font-mono text-note leading-[1.9]">{e.key}</dt>
                  <dd>{e.value}</dd>
                </div>
              ))}
            </motion.dl>
          )}
          <motion.div variants={st} custom={5} className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onSeeWork}
              className="rounded-full bg-cream px-5 py-2.5 text-small font-semibold text-indigo transition-transform duration-500 hover:-translate-y-0.5"
            >
              {labels.seeWork}
            </button>
            {identity.resumeUrl && (
              <a
                href={identity.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-rule px-5 py-2.5 text-small font-medium transition-colors duration-500 hover:border-fg"
              >
                {labels.resume}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
          </motion.div>
          </div>
        </aside>

        <motion.p variants={st} custom={0} className="hidden max-w-[24ch] text-right font-mono text-note text-dim sm:block">
          {coarse ? labels.touchHint : labels.pointerHint}
          {!coarse && labels.keyboardHint && <span className="mt-1 block">{labels.keyboardHint}</span>}
        </motion.p>
        <p className="sr-only">{scenes.home.description}</p>
        {identity.shortBio && <p className="sr-only">{identity.shortBio}</p>}
      </motion.div>
    </div>
  );
}
