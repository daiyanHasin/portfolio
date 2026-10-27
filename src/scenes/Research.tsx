import { motion } from "motion/react";
import { content } from "../data/content";
import type { Paper } from "../data/schema";
import { accents } from "../config/palette";
import { Line } from "../components/Line";
import { settle } from "../config/variants";

interface Props {
  reduced: boolean;
  small: boolean;
}

/** Up to this many papers sit side by side as cards; more become a centred list. */
const SIDE_BY_SIDE = 2;

function PaperBody({ p, i, reduced, compact }: { p: Paper; i: number; reduced: boolean; compact: boolean }) {
  const { labels } = content;
  const accent = accents[p.accent];
  const st = settle(reduced);
  const meta = [p.type, p.date].filter(Boolean).join(", ");
  const venue = [p.venue, p.publisher].filter(Boolean).join(", ");
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1 rounded-t-[inherit]"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
      <motion.div variants={st} custom={i} className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-note">
        {p.status && (
          <span className="rounded-full px-2.5 py-0.5 font-semibold text-white" style={{ background: accent }}>
            {p.status}
          </span>
        )}
        {meta && <span className="font-mono text-dim">{meta}</span>}
      </motion.div>

      <h3 className={compact ? "text-[clamp(1.5rem,0.9rem+1.5vw,2.3rem)] leading-[1.06] [@media(max-height:820px)]:text-[clamp(1.4rem,0.9rem+1.1vw,1.9rem)]" : "text-[clamp(1.7rem,0.9rem+2.2vw,2.9rem)] leading-[1.04]"}>
        <Line i={i} reduced={reduced}>
          <span className="block text-balance" style={{ fontVariationSettings: '"wdth" 88, "wght" 500' }}>
            {p.title}
          </span>
        </Line>
      </h3>

      <motion.div variants={st} custom={i + 1}>
        {venue && <p className="mt-2 font-serif text-body italic">{venue}</p>}
        {p.authors.length > 0 && (
          <p className="mt-1 text-small text-dim">
            <span className="sr-only">{labels.authors}: </span>
            {p.authors.join(", ")}
          </p>
        )}
        {p.objective && (
          <div className="mt-4">
            <h4 className="font-mono text-note text-dim">{labels.objective}</h4>
            <p className="mt-1 font-serif text-body [@media(max-height:820px)]:text-small">{p.objective}</p>
          </div>
        )}
        {p.contributions.length > 0 && (
          <div className="mt-4">
            <h4 className="font-mono text-note text-dim">{labels.contributions}</h4>
            <ul className="mt-1 grid gap-1 font-serif text-small leading-[1.55] [@media(max-height:820px)]:gap-0.5 [@media(max-height:820px)]:leading-[1.45]">
              {p.contributions.map((c) => (
                <li key={c} className="relative pl-4">
                  <span aria-hidden="true" className="absolute left-0 top-[0.6em] h-1.5 w-1.5 rounded-full" style={{ background: accent }} />
                  {c}
                </li>
              ))}
            </ul>
          </div>
        )}
        {p.technologies.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {p.technologies.map((t) => (
              <li key={t} className="rounded-full border border-rule px-3 py-1 text-note">
                {t}
              </li>
            ))}
          </ul>
        )}
        {(p.url || p.doi) && (
          <div className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 [@media(max-height:820px)]:mt-4">
            {p.url && (
              <a href={p.url} target="_blank" rel="noopener noreferrer" className="draw-line text-body font-semibold" data-on="true">
                {labels.readPaper}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            )}
            {p.doi && (
              <span className="break-all font-mono text-note text-dim">
                {labels.doi} {p.doi}
              </span>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
}

/**
 * Papers, centred on the page. A few sit side by side as cards over the
 * golden spiral; once there are more, they line up as a centred list.
 */
export function Research({ reduced, small }: Props) {
  const { research, scenes, labels } = content;
  const st = settle(reduced);
  const cards = research.length <= SIDE_BY_SIDE;

  return (
    <div className="relative h-full w-full">
      <div
        className="own-scroll absolute inset-x-0 px-6 sm:px-[6vw]"
        style={{
          top: small ? "calc(var(--safe-top) + 4.5rem)" : "calc(var(--safe-top) + 5rem)",
          bottom: "calc(var(--safe-bottom) + 3.6rem)",
          paddingTop: small ? "1rem" : "0.25rem",
          paddingBottom: small ? "2.5rem" : "0.5rem",
        }}
      >
        <div className={`mx-auto flex min-h-full flex-col justify-center ${cards ? "max-w-[76rem]" : "max-w-[50rem]"}`}>
          <header className="mx-auto mb-8 max-w-[44ch] text-center sm:mb-[3.5vh]">
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
            <motion.p variants={st} className="text-center font-serif text-lede text-dim">
              {labels.emptyResearch}
            </motion.p>
          ) : (
            <ol className={cards ? "grid items-stretch gap-6 md:grid-cols-2 lg:gap-8" : "grid gap-6"}>
              {research.map((p, i) => (
                <motion.li
                  key={p.id}
                  variants={st}
                  custom={i}
                  className="glass lift relative rounded-2xl p-6 sm:p-8 [@media(max-height:820px)]:sm:p-6"
                >
                  <PaperBody p={p} i={i + 1} reduced={reduced} compact={cards} />
                </motion.li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
