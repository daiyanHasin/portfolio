import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { content } from "../data/content";
import { Line } from "../components/Line";
import { drawRule, settle } from "../config/variants";
import { ease } from "../config/motion";

interface Props {
  reduced: boolean;
  small: boolean;
}

/** Column starts for statements on a 12-column grid: deliberately uneven. */
const PLACEMENT = ["sm:col-start-1", "sm:col-start-4", "sm:col-start-2", "sm:col-start-5"];

/**
 * Fragments: a few statements set loosely on the page, and a margin of
 * interests that open in place. The field lies under them as strata.
 */
export function Fragments({ reduced, small }: Props) {
  const { statements, interests, scenes, labels } = content;
  const [open, setOpen] = useState<string | null>(null);
  const st = settle(reduced);
  const groups = (["research", "creative"] as const)
    .map((g) => ({ g, items: interests.filter((i) => i.group === g) }))
    .filter((x) => x.items.length);

  return (
    <div className="relative h-full w-full">
      {!small && (
        <motion.div variants={st} custom={0} className="vertical absolute left-9 top-1/2 -translate-y-1/2 text-small">
          <span className="font-semibold" style={{ fontVariationSettings: '"wdth" 100' }}>
            {scenes.thinking.title}
          </span>
          <span className="ms-4 font-serif italic text-dim">{scenes.thinking.description}</span>
        </motion.div>
      )}

      <div
        className="own-scroll absolute inset-x-0 px-6 sm:pl-[11vw] sm:pr-9"
        style={{
          top: "calc(var(--safe-top) + 4.5rem)",
          bottom: "calc(var(--safe-bottom) + 3.6rem)",
          paddingTop: "2rem",
          paddingBottom: "2.5rem",
        }}
      >
        {small && (
          <header className="mb-10">
            <h2 id="scene-thinking-title" className="text-small font-semibold" style={{ fontVariationSettings: '"wdth" 100' }}>
              {scenes.thinking.title}
            </h2>
            <p className="font-serif text-body italic text-dim">{scenes.thinking.description}</p>
          </header>
        )}
        {!small && (
          <h2 id="scene-thinking-title" className="sr-only">
            {scenes.thinking.title}
          </h2>
        )}

        <div className="grid gap-y-14 sm:min-h-full sm:grid-cols-12 sm:items-center sm:gap-x-8">
          <ul className="grid gap-y-10 sm:col-span-8 sm:grid-cols-8 sm:gap-y-[7vh]">
            {statements.map((s, i) => (
              <li key={i} className={`sm:col-span-5 ${PLACEMENT[i % PLACEMENT.length]}`}>
                <motion.span variants={drawRule(reduced)} custom={i} className="mb-3 block h-px w-8 origin-left bg-fg" aria-hidden="true" />
                <blockquote className="font-serif text-fragment font-light">
                  <Line i={i} reduced={reduced}>
                    {s}
                  </Line>
                </blockquote>
              </li>
            ))}
          </ul>

          <motion.aside variants={st} custom={2} aria-label="Interests" className="sm:col-span-4 sm:col-start-9">
            {groups.map(({ g, items }) => (
              <section key={g} className="mb-8">
                <h3 className="mb-2 font-mono text-note text-dim">{labels.interestGroups[g]}</h3>
                <ul className="border-t border-rule">
                  {items.map((it) => {
                    const isOpen = open === it.id;
                    return (
                      <li key={it.id} className="border-b border-rule">
                        <button
                          aria-expanded={isOpen}
                          aria-controls={`interest-${it.id}`}
                          onClick={() => setOpen(isOpen ? null : it.id)}
                          className="flex w-full items-baseline justify-between gap-4 py-3 text-left text-body"
                        >
                          <span
                            style={{
                              fontVariationSettings: isOpen ? '"wdth" 112, "wght" 330' : '"wdth" 86, "wght" 450',
                              transition: "font-variation-settings .6s var(--ease-settle)",
                            }}
                          >
                            {it.title}
                          </span>
                          <span
                            aria-hidden="true"
                            className="relative h-2.5 w-2.5 shrink-0"
                          >
                            <span className="absolute inset-x-0 top-1/2 h-px bg-current" />
                            <span
                              className="absolute inset-y-0 left-1/2 w-px bg-current transition-transform duration-500"
                              style={{ transform: isOpen ? "scaleY(0)" : "scaleY(1)" }}
                            />
                          </span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen && it.description && (
                            <motion.div
                              id={`interest-${it.id}`}
                              key="d"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1, transition: { duration: reduced ? 0.2 : 0.55, ease: ease.settle } }}
                              exit={{ height: 0, opacity: 0, transition: { duration: reduced ? 0.15 : 0.35, ease: ease.cut } }}
                              className="overflow-hidden"
                            >
                              <p className="max-w-[46ch] pb-4 font-serif text-small leading-[1.6] text-dim">{it.description}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </motion.aside>
        </div>
      </div>
    </div>
  );
}
