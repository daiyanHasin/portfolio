import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { content } from "../data/content";
import { PROJECT_SECTION_KEYS, type Project, type ProjectLinks } from "../data/schema";
import { accents, grades } from "../config/palette";
import { ease } from "../config/motion";
import { Line } from "./Line";
import { settle } from "../config/variants";

interface Props {
  project: Project;
  index: number;
  total: number;
  reduced: boolean;
  small: boolean;
  onClose: () => void;
  onStep: (dir: 1 | -1) => void;
}

const LINK_ORDER: (keyof ProjectLinks)[] = ["live", "repository", "caseStudy"];

/**
 * A study, opened. The panel wipes in from the right (the same grammar as a
 * scene cut, turned sideways) while the field moves left to keep the study's
 * form in view. Escape closes; arrow keys step between studies.
 */
export function ProjectView({ project, index, total, reduced, small, onClose, onStep }: Props) {
  const { labels } = content;
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const accent = accents[project.visual.accent];
  const st = settle(reduced);
  const links = LINK_ORDER.filter((k) => project.links[k]);
  const sections = PROJECT_SECTION_KEYS.filter((k) => project.sections[k]);

  useEffect(() => {
    closeBtn.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    panel.current?.scrollTo({ top: 0 });
  }, [project.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight" && total > 1) {
        onStep(1);
      } else if (e.key === "ArrowLeft" && total > 1) {
        onStep(-1);
      } else if (e.key === "Tab" && panel.current) {
        // Keep focus inside the open dialog; Escape is always the way out.
        const f = panel.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onStep, total]);

  const enterClip = small ? "inset(100% 0 0 0)" : "inset(0 0 0 100%)";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`dialog-title-${project.id}`}
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[58vw]"
      style={{ top: small ? "30vh" : 0, color: grades.work.fg }}
      initial={reduced ? { opacity: 0 } : { clipPath: enterClip }}
      animate={reduced ? { opacity: 1 } : { clipPath: "inset(0 0 0 0)", transition: { duration: 0.75, ease: ease.cut } }}
      exit={reduced ? { opacity: 0 } : { clipPath: enterClip, transition: { duration: 0.5, ease: ease.cut } }}
    >
      <div className="absolute inset-0 border-rule bg-charcoal-raised sm:border-l" style={{ ["--rule" as string]: grades.work.rule }} />
      <div
        ref={panel}
        className="own-scroll relative h-full px-6 sm:px-[5vw]"
        style={{
          ["--fg" as string]: grades.work.fg,
          ["--dim" as string]: grades.work.dim,
          ["--rule" as string]: grades.work.rule,
          paddingTop: small ? "1.5rem" : "calc(var(--safe-top) + 6rem)",
          paddingBottom: "calc(var(--safe-bottom) + 3rem)",
        }}
      >
        <motion.div key={project.id} initial="hidden" animate="shown" className="max-w-[44rem]">
          <div className="mb-10 flex items-baseline justify-between gap-4 font-mono text-note text-dim">
            <span className="tabular-nums">
              <span style={{ color: accent }}>
                {labels.studyPrefix} {index + 1}
              </span>
              <span className="ml-4">{[project.category, project.year].filter(Boolean).join(", ")}</span>
            </span>
            <button ref={closeBtn} onClick={onClose} className="draw-line text-fg">
              {labels.close}
              <span className="sr-only"> (Escape)</span>
            </button>
          </div>

          <h2 id={`dialog-title-${project.id}`} className="text-title" style={{ fontVariationSettings: '"wdth" 112, "wght" 280' }}>
            <Line reduced={reduced}>{project.title}</Line>
          </h2>
          {project.summary && (
            <motion.p variants={st} custom={0} className="mt-5 max-w-[34ch] font-serif text-lede italic">
              {project.summary}
            </motion.p>
          )}
          {project.description && (
            <motion.p variants={st} custom={1} className="mt-5 max-w-[60ch] font-serif text-body text-dim">
              {project.description}
            </motion.p>
          )}

          {sections.length > 0 && (
            <motion.dl variants={st} custom={2} className="mt-12 border-t border-rule">
              {sections.map((k) => (
                <div key={k} className="grid gap-1 border-b border-rule py-5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="font-mono text-note text-dim">{labels.sections[k]}</dt>
                  <dd className="max-w-[60ch] font-serif text-body">{project.sections[k]}</dd>
                </div>
              ))}
            </motion.dl>
          )}

          {project.technologies.length > 0 && (
            <motion.div variants={st} custom={3} className="mt-10 grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <h3 className="font-mono text-note text-dim">{labels.methods}</h3>
              <ul className="flex flex-wrap gap-x-5 gap-y-1 text-small">
                {project.technologies.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </motion.div>
          )}

          {links.length > 0 && (
            <motion.ul variants={st} custom={4} className="mt-10 flex flex-wrap gap-x-8 gap-y-2 text-body">
              {links.map((k) => (
                <li key={k}>
                  <a href={project.links[k]} target="_blank" rel="noopener noreferrer" className="draw-line" data-on="true">
                    {labels.links[k]}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </motion.ul>
          )}

          {total > 1 && (
            <motion.div variants={st} custom={5} className="mt-16 flex justify-between font-mono text-note">
              <button onClick={() => onStep(-1)} className="draw-line text-dim hover:text-fg">
                {labels.previousProject}
              </button>
              <button onClick={() => onStep(1)} className="draw-line text-dim hover:text-fg">
                {labels.nextProject}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
