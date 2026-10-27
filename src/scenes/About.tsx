import { motion } from "motion/react";
import type { ReactNode } from "react";
import { content } from "../data/content";
import type { Role } from "../data/schema";
import { Line } from "../components/Line";
import { drawRule, settle } from "../config/variants";

interface Props {
  reduced: boolean;
  small: boolean;
}

function Section({ title, i, reduced, children }: { title: string; i: number; reduced: boolean; children: ReactNode }) {
  return (
    <section className="mb-12">
      <h3 className="mb-4 text-small font-semibold" style={{ fontVariationSettings: '"wdth" 100' }}>
        <Line i={i} reduced={reduced}>
          {title}
        </Line>
      </h3>
      <motion.div variants={drawRule(reduced)} custom={i} className="mb-5 h-px origin-left bg-rule" />
      <motion.div variants={settle(reduced)} custom={i}>
        {children}
      </motion.div>
    </section>
  );
}

function Roles({ items }: { items: Role[] }) {
  return (
    <ol className="grid gap-8">
      {items.map((r) => (
        <li key={`${r.role}-${r.org}`} className="lift relative pl-5">
          <span aria-hidden="true" className="absolute left-0 top-[0.55em] h-2 w-2 rounded-full bg-accent" />
          {r.period && <p className="font-mono text-note text-dim">{r.period}</p>}
          <p className="mt-0.5 text-body font-semibold" style={{ fontVariationSettings: '"wdth" 96' }}>
            {r.role}
          </p>
          {(r.org || r.location) && (
            <p className="font-serif text-body italic">{[r.org, r.location].filter(Boolean).join(", ")}</p>
          )}
          {r.points.length > 0 && (
            <ul className="mt-2 grid gap-1 font-serif text-small leading-[1.6] text-dim">
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
 * The person behind the work: experience, study and what they lead.
 * The field to the right climbs as a staircase toward a light.
 */
export function About({ reduced, small }: Props) {
  const { about, scenes, labels, identity } = content;
  const st = settle(reduced);
  const L = labels.about;

  return (
    <div className="relative h-full w-full">
      <div
        className="own-scroll absolute inset-x-0 px-6 sm:left-[6vw] sm:right-auto sm:w-[58vw] sm:px-0"
        style={{
          top: small ? "calc(var(--safe-top) + 4.5rem)" : "calc(var(--safe-top) + 6rem)",
          bottom: "calc(var(--safe-bottom) + 3.6rem)",
          paddingTop: "1.5rem",
          paddingBottom: "3rem",
        }}
      >
        <header className="mb-10 sm:mb-[7vh]">
          <h2 id="scene-about-title" className="text-small font-semibold" style={{ fontVariationSettings: '"wdth" 100' }}>
            <Line reduced={reduced}>{scenes.about.title}</Line>
          </h2>
          {scenes.about.description && (
            <motion.p variants={st} custom={0} className="mt-1 font-serif text-body italic text-dim">
              {scenes.about.description}
            </motion.p>
          )}
          {(about.intro || identity.shortBio) && (
            <motion.p variants={st} custom={1} className="mt-6 max-w-[40ch] font-serif text-lede font-light">
              {about.intro || identity.shortBio}
            </motion.p>
          )}
        </header>

        <div className="grid gap-x-12 lg:grid-cols-2">
          <div>
            {about.experience.length > 0 && (
              <Section title={L.experience} i={1} reduced={reduced}>
                <Roles items={about.experience} />
              </Section>
            )}
            {about.leadership.length > 0 && (
              <Section title={L.leadership} i={2} reduced={reduced}>
                <Roles items={about.leadership} />
              </Section>
            )}
          </div>

          <div>
            {about.education.length > 0 && (
              <Section title={L.education} i={2} reduced={reduced}>
                <ol className="grid gap-6">
                  {about.education.map((e) => (
                    <li key={`${e.degree}-${e.school}`} className="lift">
                      {e.period && <p className="font-mono text-note text-dim">{e.period}</p>}
                      <p className="mt-0.5 text-body font-semibold" style={{ fontVariationSettings: '"wdth" 96' }}>
                        {e.degree}
                      </p>
                      {e.school && <p className="font-serif text-body italic">{e.school}</p>}
                      {e.detail && <p className="text-small text-dim">{e.detail}</p>}
                    </li>
                  ))}
                </ol>
              </Section>
            )}

            {about.skills.length > 0 && (
              <Section title={L.skills} i={3} reduced={reduced}>
                <dl className="grid gap-4">
                  {about.skills.map((g) => (
                    <div key={g.group}>
                      {g.group && <dt className="mb-1.5 font-mono text-note text-dim">{g.group}</dt>}
                      <dd>
                        <ul className="flex flex-wrap gap-2">
                          {g.items.map((it) => (
                            <li
                              key={it}
                              className="rounded-full border border-rule bg-panel/50 px-3 py-1 text-small transition-[border-color,transform] duration-500 hover:-translate-y-0.5 hover:border-accent"
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
              <Section title={L.courses} i={4} reduced={reduced}>
                <ul className="grid gap-3">
                  {about.courses.map((c) => (
                    <li key={c.title}>
                      <p className="text-body">{c.title}</p>
                      {c.provider && <p className="font-serif text-small italic text-dim">{c.provider}</p>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
