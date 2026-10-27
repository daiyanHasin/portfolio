import { motion } from "motion/react";
import { useState } from "react";
import { content } from "../data/content";
import { Line } from "../components/Line";
import { drawRule, settle } from "../config/variants";

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
export function Contact({ reduced, small, onBeginAgain }: Props) {
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
    <div className="relative h-full w-full">
      <div className="absolute inset-x-0 px-6 sm:left-[6vw] sm:px-0" style={{ top: small ? "15vh" : "17vh" }}>
        <h2 id="scene-contact-title" className="sr-only">
          {scenes.contact.title}
        </h2>
        {lines.length > 0 && (
          <p className="float-slower text-[clamp(2.9rem,0.8rem+7.6vw,9rem)] leading-[0.9]" style={{ fontVariationSettings: '"wdth" 92, "wght" 330' }}>
            {lines.map((l, i) => (
              <Line key={i} i={i} reduced={reduced} className={i === 1 ? "sm:ml-[12vw]" : ""}>
                {l}
              </Line>
            ))}
          </p>
        )}

        <motion.div variants={st} custom={0} className="mt-[6vh] max-w-[40rem] sm:ml-[12vw]">
          {scenes.contact.description && <p className="mb-2 font-serif text-body italic text-dim">{scenes.contact.description}</p>}
          {contact.email && (
            <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <a href={`mailto:${contact.email}`} className="draw-line font-serif text-lede font-light">
                {contact.email}
              </a>
              <button onClick={copy} className="draw-line font-mono text-note text-dim hover:text-fg">
                <span aria-live="polite">{copied ? labels.copied : labels.copyEmail}</span>
              </button>
            </div>
          )}
          {contact.phone && (
            <a href={`tel:${contact.phone.replace(/[^\d+]/g, "")}`} className="draw-line mt-2 inline-block font-serif text-body text-dim hover:text-fg">
              {contact.phone}
            </a>
          )}
        </motion.div>
      </div>

      <div className="absolute inset-x-0 px-6 sm:px-9" style={{ bottom: "calc(var(--safe-bottom) + 5.4rem)" }}>
        <motion.div variants={drawRule(reduced)} custom={2} className="mb-3 h-px origin-left bg-rule sm:hidden" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          {contact.socials.length > 0 && (
            <motion.ul variants={st} custom={2} className="flex flex-wrap gap-x-8 gap-y-2">
              {contact.socials.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="group block">
                    <span className="draw-line text-small font-medium">{s.label}</span>
                    <span className="block font-mono text-note text-dim opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 max-sm:opacity-100">
                      {host(s.url)}
                    </span>
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </motion.ul>
          )}
          <motion.div variants={st} custom={3} className="flex items-baseline gap-8 font-mono text-note text-dim">
            {(identity.location || identity.status) && (
              <span>{[identity.location, identity.status].filter(Boolean).join(", ")}</span>
            )}
            <button onClick={onBeginAgain} className="draw-line shrink-0 whitespace-nowrap text-fg">
              {labels.beginAgain}
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
