import { motion } from "motion/react";
import { useState } from "react";
import { content } from "../data/content";
import { Line } from "../components/Line";
import { settle } from "../config/variants";

interface Props {
  reduced: boolean;
  small: boolean;
  onBeginAgain: () => void;
}

const host = (url: string) => {
  try {
    const u = new URL(url);
    return (u.host + u.pathname).replace(/^www\./, "").replace(/\/$/, "");
  } catch {
    return url;
  }
};

/** The field settles into a single horizon. Above it, one sentence and an address. */
export function Contact({ reduced, onBeginAgain }: Props) {
  const { contact, scenes, labels, identity } = content;
  const [copied, setCopied] = useState(false);
  const st = settle(reduced);
  const words = contact.closingStatement.split(" ");
  // Break the closing statement into two roughly equal lines.
  const mid = Math.ceil(words.length / 2);
  const lines = contact.closingStatement ? [words.slice(0, mid).join(" "), words.slice(mid).join(" ")] : [];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="legible relative h-full w-full">
      <div
        className="own-scroll absolute inset-x-0 flex flex-col items-center px-6 text-center"
        style={{
          top: "calc(var(--safe-top) + 4.5rem)",
          bottom: "calc(var(--safe-bottom) + 3.6rem)",
          paddingTop: "1rem",
          paddingBottom: "1.5rem",
        }}
      >
        <div className="my-auto flex w-full max-w-[60rem] flex-col items-center">
          <h2 id="scene-contact-title" className="sr-only">
            {scenes.contact.title}
          </h2>
          {lines.length > 0 && (
            <p
              className="float-slower text-[clamp(2.6rem,0.8rem+6vw,7.2rem)] leading-[0.92]"
              style={{ fontVariationSettings: '"wdth" 92, "wght" 330' }}
            >
              {lines.map((l, i) => (
                <Line key={i} i={i} reduced={reduced}>
                  {l}
                </Line>
              ))}
            </p>
          )}

          <motion.div variants={st} custom={0} className="mt-[5vh] flex flex-col items-center">
            {scenes.contact.description && (
              <p className="mb-3 max-w-[44ch] font-serif text-body italic text-dim">{scenes.contact.description}</p>
            )}
            {contact.email && (
              <div className="flex flex-wrap items-baseline justify-center gap-x-5 gap-y-1">
                <a href={`mailto:${contact.email}`} className="draw-line font-serif text-lede">
                  {contact.email}
                </a>
                <button onClick={copy} className="draw-line font-mono text-note text-dim hover:text-fg">
                  <span aria-live="polite">{copied ? labels.copied : labels.copyEmail}</span>
                </button>
              </div>
            )}
            {contact.phone && (
              <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="draw-line mt-2 font-serif text-body text-dim hover:text-fg">
                {contact.phone}
              </a>
            )}
          </motion.div>

          {contact.socials.length > 0 && (
            <motion.ul variants={st} custom={2} className="mt-8 flex flex-wrap justify-center gap-3">
              {contact.socials.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-full border border-rule bg-[rgba(255,248,238,0.06)] px-5 py-2 backdrop-blur-sm transition-[background-color,border-color,transform] duration-500 hover:-translate-y-0.5 hover:border-fg hover:bg-[rgba(255,248,238,0.14)]"
                  >
                    <span className="text-small font-semibold">{s.label}</span>
                    <span className="ml-2 font-mono text-note text-dim">{host(s.url)}</span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </motion.ul>
          )}

          <motion.div
            variants={st}
            custom={3}
            className="mt-8 flex flex-wrap items-baseline justify-center gap-x-8 gap-y-2 font-mono text-note text-dim"
          >
            {(identity.location || identity.status) && <span>{[identity.location, identity.status].filter(Boolean).join(", ")}</span>}
            <button onClick={onBeginAgain} className="draw-line whitespace-nowrap text-fg">
              {labels.beginAgain}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
