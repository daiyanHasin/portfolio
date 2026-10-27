import { motion } from "motion/react";
import { content } from "../data/content";
import { accents } from "../config/palette";
import { Line } from "../components/Line";
import { drawRule, settle } from "../config/variants";

interface Props {
  reduced: boolean;
  small: boolean;
}

/**
 * Papers, set large on the left. The field to the right winds into a golden
 * spiral; each paper carries its own accent along its edge.
 */
export function Research({ reduced, small }: Props) {
  const { research, scenes, labels } = content;
  const st = settle(reduced);

  return (
    <div className="relative h-full w-full">
      <div
        className="own-scroll absolute inset-x-0 px-6 sm:left-[6vw] sm:right-auto sm:w-[54vw] sm:px-0"
        style={{
          top: small ? "calc(var(--safe-top) + 4.5rem)" : "calc(var(--safe-top) + 6rem)",
          bottom: "calc(var(--safe-bottom) + 3.6rem)",
          paddingTop: "1.5rem",
          paddingBottom: "3rem",
        }}
      >
        <header className="mb-10 max-w-[40ch] sm:mb-[7vh]">
          <h2 id="scene-research-title" className="text-small font-semibold" style={{ fontVariationSettings: '"wdth" 100' }}>
            <Line reduced={reduced}>{scenes.research.title}</Line>
          </h2>
          {scenes.research.description && (
            <motion.p variants={st} custom={0} className="mt-1 font-serif text-body italic text-dim">
              {scenes.research.description}
            </motion.p>
          )}
        </header>

        {research.length === 0 ? (
          <motion.p variants={st} className="font-serif text-lede text-dim">
            {labels.emptyResearch}
          </motion.p>
        ) : (
          <ol className="grid gap-14 sm:gap-[8vh]">
            {research.map((p, i) => {
              const accent = accents[p.accent];
              const meta = [p.type, p.date].filter(Boolean).join(", ");
              const venue = [p.venue, p.publisher].filter(Boolean).join(", ");
              return (
                <li key={p.id} className="group relative pl-5 sm:pl-7">
                  <motion.span
                    aria-hidden="true"
                    variants={drawRule(reduced)}
                    custom={i + 1}
                    className="absolute left-0 top-1 block h-[calc(100%-0.25rem)] w-[3px] origin-top rounded-full"
                    style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }}
                  />
                  <motion.div variants={st} custom={i + 1} className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-note">
                    {p.status && (
                      <span className="rounded-full px-2.5 py-0.5 font-semibold text-white" style={{ background: accent }}>
                        {p.status}
                      </span>
                    )}
                    {meta && <span className="font-mono text-dim">{meta}</span>}
                  </motion.div>

                  <h3 className="text-[clamp(1.7rem,0.9rem+2.4vw,3.1rem)] leading-[1.02]">
                    <Line i={i + 1} reduced={reduced}>
                      <span
                        className="block"
                        style={{ fontVariationSettings: '"wdth" 84, "wght" 520', transition: "font-variation-settings .8s var(--ease-settle)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.fontVariationSettings = '"wdth" 100, "wght" 360')}
                        onMouseLeave={(e) => (e.currentTarget.style.fontVariationSettings = '"wdth" 84, "wght" 520')}
                      >
                        {p.title}
                      </span>
                    </Line>
                  </h3>

                  <motion.div variants={st} custom={i + 2} className="mt-3 max-w-[62ch]">
                    {venue && <p className="font-serif text-body italic">{venue}</p>}
                    {p.authors.length > 0 && (
                      <p className="mt-1 text-small text-dim">
                        <span className="sr-only">{labels.authors}: </span>
                        {p.authors.join(", ")}
                      </p>
                    )}

                    {p.objective && (
                      <div className="mt-5 grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-5">
                        <h4 className="font-mono text-note text-dim">{labels.objective}</h4>
                        <p className="font-serif text-body">{p.objective}</p>
                      </div>
                    )}
                    {p.contributions.length > 0 && (
                      <div className="mt-4 grid gap-1 sm:grid-cols-[8.5rem_1fr] sm:gap-5">
                        <h4 className="font-mono text-note text-dim">{labels.contributions}</h4>
                        <ul className="grid gap-1.5 font-serif text-body">
                          {p.contributions.map((c) => (
                            <li key={c} className="relative pl-4">
                              <span aria-hidden="true" className="absolute left-0 top-[0.7em] h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {p.technologies.length > 0 && (
                      <ul className="mt-5 flex flex-wrap gap-2">
                        {p.technologies.map((t) => (
                          <li key={t} className="rounded-full border border-rule px-3 py-1 text-note">
                            {t}
                          </li>
                        ))}
                      </ul>
                    )}
                    {(p.url || p.doi) && (
                      <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2">
                        {p.url && (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="draw-line text-body font-medium" data-on="true">
                            {labels.readPaper}
                            <span className="sr-only"> (opens in a new tab)</span>
                          </a>
                        )}
                        {p.doi && (
                          <span className="font-mono text-note text-dim">
                            {labels.doi} {p.doi}
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
