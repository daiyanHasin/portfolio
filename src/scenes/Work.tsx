import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import { content } from "../data/content";
import { accents } from "../config/palette";
import { Line } from "../components/Line";
import { drawRule, settle } from "../config/variants";
import { sound } from "../lib/sound";

interface Props {
  reduced: boolean;
  small: boolean;
  focusId: string | null;
  openId: string | null;
  onFocusProject: (id: string | null) => void;
  onOpen: (id: string, trigger: HTMLElement) => void;
}

/**
 * The index of projects. Titles are compressed until attended to, then open up,
 * the same rule the field follows. The field to the right takes the form of
 * whichever study is under attention; there are no thumbnails.
 */
export function Work({ reduced, small, focusId, openId, onFocusProject, onOpen }: Props) {
  const { projects, scenes, labels } = content;
  const listRef = useRef<HTMLOListElement>(null);
  const focused = projects.find((p) => p.id === focusId) ?? null;
  const focusedIndex = focused ? projects.indexOf(focused) : -1;
  const st = settle(reduced);

  // Arrive with the first project selected, so its figure is already showing.
  useEffect(() => {
    if (focusId === null && projects.length > 0) onFocusProject(projects[0].id);
    // Only on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const figure = focused && !openId && (
    <motion.figure
      key={focused.id}
      initial={{ opacity: 0, y: reduced ? 0 : 14, scale: reduced ? 1 : 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ opacity: 0, y: reduced ? 0 : -8, transition: { duration: 0.18 } }}
    >
      {focused.image && (
        <div className="float-slow mb-4 overflow-hidden rounded-xl bg-white shadow-[0_24px_60px_-20px_rgba(18,34,79,0.45)] ring-1 ring-[rgba(18,34,79,0.12)]">
          <img src={focused.image} alt={focused.imageAlt} decoding="async" className="block max-h-[46vh] w-full object-cover object-top" />
        </div>
      )}
      <figcaption className="font-serif text-body italic leading-[1.45]">
        <span className="mr-2 font-mono text-note not-italic font-semibold" style={{ color: accents[focused.visual.accent] }}>
          {labels.figurePrefix} {focusedIndex + 1}
        </span>
        {focused.summary}
      </figcaption>
      {focused.technologies.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 font-mono text-note text-dim">
          {focused.technologies.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
    </motion.figure>
  );

  return (
    <div className="relative h-full w-full">
      <div
        className="own-scroll absolute inset-x-0 px-6 transition-opacity duration-700 sm:left-[6vw] sm:right-auto sm:w-[50vw] sm:px-0"
        style={{
          opacity: openId ? 0.04 : 1,
          top: small ? "42vh" : "calc(var(--safe-top) + 6rem)",
          bottom: "calc(var(--safe-bottom) + 3.6rem)",
          paddingTop: "1.5rem",
          paddingBottom: "2.5rem",
        }}
      >
        <header className="mb-8 max-w-[38ch] sm:mb-[9vh]">
          <h2 id="scene-work-title" className="text-small font-semibold" style={{ fontVariationSettings: '"wdth" 100' }}>
            <Line reduced={reduced}>{scenes.work.title}</Line>
          </h2>
          {scenes.work.description && (
            <motion.p variants={st} custom={0} className="mt-1 font-serif text-body italic text-dim">
              {scenes.work.description}
            </motion.p>
          )}
        </header>

        {projects.length === 0 ? (
          <motion.p variants={st} className="font-serif text-lede text-dim">
            {labels.emptyWork}
          </motion.p>
        ) : (
          <ol ref={listRef}>
            {projects.map((p, i) => {
              const active = p.id === focusId;
              const dimmed = focusId !== null && !active;
              return (
                <li key={p.id} className="relative">
                  <motion.div
                    variants={drawRule(reduced)}
                    custom={i + 1}
                    className="h-px origin-left bg-rule"
                  />
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-describedby={`summary-${p.id}`}
                    onMouseEnter={() => {
                      if (!active) sound.tick();
                      onFocusProject(p.id);
                    }}
                    onFocus={() => onFocusProject(p.id)}
                    onClick={(e) => onOpen(p.id, e.currentTarget)}
                    className="group grid w-full grid-cols-[3.2rem_1fr] items-baseline py-3 text-left sm:grid-cols-[4.5rem_1fr] sm:py-4"
                    style={{ opacity: dimmed ? 0.55 : 1, transition: "opacity .6s var(--ease-settle)" }}
                  >
                    <span className="font-mono text-note text-dim tabular-nums">
                      {labels.studyPrefix} {i + 1}
                    </span>
                    <Line i={i + 1} reduced={reduced}>
                      <span
                        className={`block text-balance ${p.featured ? "text-[clamp(2.1rem,0.8rem+3.8vw,4.6rem)] leading-[0.95]" : "text-[clamp(1.5rem,0.9rem+1.9vw,2.6rem)] leading-[1]"}`}
                        style={{
                          fontVariationSettings: active ? '"wdth" 106, "wght" 270' : '"wdth" 68, "wght" 560',
                          transition: "font-variation-settings .7s var(--ease-settle)",
                        }}
                      >
                        {p.title}
                      </span>
                    </Line>
                    <span className="col-start-2 mt-1 font-mono text-note text-dim">
                      {[p.category, p.year].filter(Boolean).join(", ")}
                    </span>
                    <span id={`summary-${p.id}`} className="sr-only">
                      {p.summary}
                    </span>
                  </button>
                </li>
              );
            })}
            <motion.li aria-hidden="true" variants={drawRule(reduced)} custom={projects.length + 1} className="h-px origin-left bg-rule" />
          </ol>
        )}
      </div>

      {/* The selected project's figure: a screenshot when there is one, otherwise the field takes its form. */}
      {!small ? (
        <div
          className="pointer-events-none absolute right-9 w-[min(30rem,36vw)]"
          style={focused?.image ? { top: "calc(var(--safe-top) + 7rem)" } : { bottom: "calc(var(--safe-bottom) + 5.8rem)" }}
        >
          <AnimatePresence mode="wait">{figure}</AnimatePresence>
        </div>
      ) : (
        focused?.image &&
        !openId && (
          <div className="pointer-events-none absolute inset-x-6" style={{ top: "calc(var(--safe-top) + 4.6rem)", height: "calc(42vh - 5.6rem)" }}>
            <AnimatePresence mode="wait">
              <motion.img
                key={focused.id}
                src={focused.image}
                alt={focused.imageAlt}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full w-full rounded-xl object-cover object-top shadow-[0_18px_40px_-18px_rgba(18,34,79,0.5)]"
              />
            </AnimatePresence>
          </div>
        )
      )}
    </div>
  );
}
