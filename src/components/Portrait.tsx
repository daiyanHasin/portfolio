import { useState } from "react";
import { content } from "../data/content";

interface Props {
  className?: string;
  /** Tint that matches the scene's light. */
  tone?: "dawn" | "day";
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z]/.test(w) && !/^md\.?$/i.test(w))
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

/**
 * The portrait sits in an arch, a window onto the same sky as the scene.
 * The photo gets a warm grade from overlays only; the file itself is never altered.
 * With no photo set (or if it fails to load), initials are drawn instead.
 */
export function Portrait({ className = "", tone = "dawn" }: Props) {
  const { identity } = content;
  const [failed, setFailed] = useState(false);
  const show = identity.photo && !failed;
  const arch = "rounded-t-[999px] rounded-b-[1.25rem]";

  return (
    <figure className={`relative shrink-0 ${className}`}>
      {/* A soft halo behind the arch, breathing with the field. */}
      <div
        aria-hidden="true"
        className={`float-slow absolute -inset-3 ${arch} opacity-70 blur-xl`}
        style={{
          background:
            tone === "dawn"
              ? "radial-gradient(circle at 50% 30%, rgba(255,201,96,0.75), rgba(255,126,103,0.25) 60%, transparent 75%)"
              : "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.9), rgba(14,159,138,0.25) 60%, transparent 75%)",
        }}
      />
      <div className={`relative h-full w-full overflow-hidden ${arch} ring-1 ring-[rgba(255,248,238,0.55)]`}>
        {show ? (
          <>
            <img
              src={identity.photo}
              alt={identity.photoAlt}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover object-[50%_25%]"
              style={{ filter: "contrast(1.04) saturate(1.06)" }}
            />
            {/* Dawn grade: warm light from above, a little dusk at the feet. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{ background: "linear-gradient(180deg, rgba(255,201,96,0.55), rgba(255,126,103,0.25) 55%, rgba(42,44,132,0.55))" }}
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
              style={{ background: "linear-gradient(180deg, transparent, rgba(27,36,112,0.35))" }}
            />
          </>
        ) : (
          <svg viewBox="0 0 120 150" className="h-full w-full" role="img" aria-label={identity.photoAlt}>
            <defs>
              <linearGradient id="portrait-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFC960" />
                <stop offset="0.45" stopColor="#FF7E67" />
                <stop offset="1" stopColor="#43308F" />
              </linearGradient>
            </defs>
            <rect width="120" height="150" fill="url(#portrait-sky)" />
            <circle cx="60" cy="46" r="20" fill="#FFF8EE" opacity="0.35" />
            <text
              x="60"
              y="104"
              textAnchor="middle"
              fill="#FFF8EE"
              style={{ font: "600 40px Archivo, Helvetica Neue, Arial, sans-serif", letterSpacing: "0.02em" }}
            >
              {initials(identity.displayName)}
            </text>
          </svg>
        )}
      </div>
    </figure>
  );
}
