import { motion } from "motion/react";
import type { ReactNode } from "react";
import { content } from "../data/content";
import type { Role } from "../data/schema";
import { Line } from "../components/Line";
import { Portrait } from "../components/Portrait";
import { drawRule, settle } from "../config/variants";

interface Props {
  reduced: boolean;
  small: boolean;
}

function Section({ title, i, reduced, children }: { title: string; i: number; reduced: boolean; children: ReactNode }) {
  return (
    <section className="mb-7 last:mb-0 [@media(max-height:740px)]:mb-5">
      <h3 className="text-small font-semibold" style={{ fontVariationSettings: '"wdth" 100' }}>
        <Line i={i} reduced={reduced}>
          {title}
        </Line>
      </h3>
      <motion.div variants={drawRule(reduced)} custom={i} className="mb-3 mt-1.5 h-px origin-left bg-rule" />
      <motion.div variants={settle(reduced)} custom={i}>
        {children}
      </motion.div>
    </section>
  );
}

function Roles({ items }: { items: Role[] }) {
  return (
    <ol className="grid gap-5 [@media(max-height:740px)]:gap-3">
      {items.map((r) => (
        <li key={`${r.role}-${r.org}`} className="lift relative pl-4">
          <span aria-hidden="true" className="absolute left-0 top-[0.45em] h-2 w-2 rounded-full bg-accent" />
          {r.period && <p className="font-mono text-note text-dim">{r.period}</p>}
          <p className="text-small font-semibold leading-snug" style={{ fontVariationSettings: '"wdth" 96' }}>
            {r.role}
          </p>
          {(r.org || r.location) && (
            <p className="font-serif text-small italic leading-snug">{[r.org, r.location].filter(Boolean).join(", ")}</p>
          )}
          {r.points.length > 0 && (
            <ul className="mt-1.5 grid gap-1 font-serif text-[0.84rem] leading-[1.45] text-dim [@media(max-height:740px)]:gap-0.5 [@media(max-height:740px)]:text-[0.78rem] [@media(max-height:740px)]:leading-[1.38]">
              {r.points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * Everything on one page: who, where they've worked, what they've studied and
 * led, and what they work with. Four columns on a laptop, read at a glance;
 * phones scroll, because a phone screen cannot hold all of it.
 */
export function About({ reduced, small }: Props) {
  const { about, scenes, labels, identity } = content;
  const st = settle(reduced);
  const L = labels.about;
  const intro = about.intro || identity.shortBio;

  return (
    <div className="relative h-full w-full">
      <div
        className="own-scroll absolute inset-x-0 px-6 sm:px-[5vw]"
        style={{
          top: small ? "calc(var(--safe-top) + 4.5rem)" : "calc(var(--safe-top) + 5rem)",
          bottom: "calc(var(--safe-bottom) + 3.6rem)",
          paddingTop: small ? "0.75rem" : "0.25rem",
          paddingBottom: small ? "2.5rem" : "0.25rem",
        }}
      >
        <div className="mx-auto grid min-h-full max-w-[96rem] content-center items-start gap-x-10 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
          {/* 1: who */}
          <div>
            <div className="flex items-end gap-5">
              <motion.div
                variants={st}
                custom={1}
                className="h-[9.5rem] w-[7.5rem] shrink-0 xl:h-[12rem] xl:w-[9.4rem] [@media(max-height:820px)]:xl:h-[8.6rem] [@media(max-height:820px)]:xl:w-[6.8rem]"
              >
                <Portrait className="h-full w-full" tone="day" />
              </motion.div>
              <div className="min-w-0 pb-1">
                <h2 id="scene-about-title" className="text-small font-semibold" style={{ fontVariationSettings: '"wdth" 100' }}>
                  <Line reduced={reduced}>{scenes.about.title}</Line>
                </h2>
                {scenes.about.description && (
                  <motion.p variants={st} custom={0} className="font-serif text-small italic text-dim">
                    {scenes.about.description}
                  </motion.p>
                )}
              </div>
            </div>
            {intro && (
              <motion.p
                variants={st}
                custom={1}
                className="mt-5 font-serif text-body leading-[1.55] [@media(max-height:820px)]:text-small"
              >
                {intro}
              </motion.p>
            )}

            {/* On four-column screens, courses sit under the intro, where there is room. */}
            {about.courses.length > 0 && (
              <div className="mt-6 hidden xl:block">
                <Section title={L.courses} i={5} reduced={reduced}>
                  <Courses />
                </Section>
              </div>
            )}

            {/* On three-column screens, education joins the first column. */}
            {about.education.length > 0 && (
              <div className="mt-7 hidden lg:block xl:hidden">
                <Section title={L.education} i={2} reduced={reduced}>
                  <Education />
                </Section>
              </div>
            )}
          </div>

          {/* 2: work */}
          <div>
            {about.experience.length > 0 && (
              <Section title={L.experience} i={2} reduced={reduced}>
                <Roles items={about.experience} />
              </Section>
            )}
            {about.leadership.length > 0 && (
              <div className="xl:hidden">
                <Section title={L.leadership} i={3} reduced={reduced}>
                  <Roles items={about.leadership} />
                </Section>
              </div>
            )}
          </div>

          {/* 3: study and leading (four-column screens) */}
          <div className="lg:hidden xl:block">
            {about.education.length > 0 && (
              <Section title={L.education} i={3} reduced={reduced}>
                <Education />
              </Section>
            )}
            {about.leadership.length > 0 && (
              <div className="hidden xl:block">
                <Section title={L.leadership} i={4} reduced={reduced}>
                  <Roles items={about.leadership} />
                </Section>
              </div>
            )}
          </div>

          {/* 4: tools and learning */}
          <div>
            {about.skills.length > 0 && (
              <Section title={L.skills} i={4} reduced={reduced}>
                <dl className="grid gap-2.5">
                  {about.skills.map((g) => (
                    <div key={g.group}>
                      {g.group && <dt className="mb-1 font-mono text-note text-dim">{g.group}</dt>}
                      <dd>
                        <ul className="flex flex-wrap gap-1.5">
                          {g.items.map((it) => (
                            <li
                              key={it}
                              className="rounded-full border border-rule bg-panel/60 px-2.5 py-0.5 text-[0.8rem] transition-[border-color,transform] duration-500 hover:-translate-y-0.5 hover:border-accent"
                            >
                              {it}
                            </li>
                          ))}
                        </ul>
                      </dd>
                    </div>
                  ))}
                </dl>
              </Section>
            )}
            {about.courses.length > 0 && (
              <div className="xl:hidden">
                <Section title={L.courses} i={5} reduced={reduced}>
                  <Courses />
                </Section>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Education() {
  const { about } = content;
  return (
    <ol className="grid gap-4 [@media(max-height:740px)]:gap-2.5">
      {about.education.map((e) => (
        <li key={`${e.degree}-${e.school}`} className="lift leading-snug">
          {e.period && <p className="font-mono text-note text-dim">{e.period}</p>}
          <p className="text-small font-semibold" style={{ fontVariationSettings: '"wdth" 96' }}>
            {e.degree}
          </p>
          {e.school && <p className="font-serif text-small italic">{e.school}</p>}
          {e.detail && <p className="text-note text-dim">{e.detail}</p>}
        </li>
      ))}
    </ol>
  );
}

function Courses() {
  const { about } = content;
  return (
    <ul className="grid gap-2">
      {about.courses.map((c) => (
        <li key={c.title} className="leading-snug">
          <p className="text-small">{c.title}</p>
          {c.provider && <p className="font-serif text-note italic text-dim">{c.provider}</p>}
        </li>
      ))}
    </ul>
  );
}
