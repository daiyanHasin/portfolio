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
 * The portrait sits in an arch, a window onto the same sky as the scene: the
 * light rises behind the head, and the bottom dissolves into the page.
 * Works best with a cut-out (transparent background) photo, like public/photo.webp.
 * With no photo set (or if it fails to load), initials are drawn instead.
 */
export function Portrait({ className = "", tone = "dawn" }: Props) {
  const { identity } = content;
  const [failed, setFailed] = useState(false);
  // Files in public/ are served from the site root; respect a non-root base path if one is ever set.
  const src = /^https:\/\//.test(identity.photo)
    ? identity.photo
    : `${import.meta.env.BASE_URL.replace(/\/$/, "")}${identity.photo}`;
  const show = identity.photo && !failed;
  const arch = "rounded-t-[999px] rounded-b-[1.25rem]";

  const dawn = tone === "dawn";
  // Inside the arch: the scene's own light rising behind the head.
  const skyInArch = dawn
    ? "radial-gradient(120% 70% at 50% 18%, #FFE3A6 0%, #FFC960 18%, #FF7E67 42%, #6A49AE 72%, #2A2C84 100%)"
    : "radial-gradient(120% 70% at 50% 18%, #FFFFFF 0%, #F1FCF8 25%, #BDEFE2 55%, #6CCDB8 85%, #0E9F8A 100%)";
  // The bottom of the portrait dissolves into the page instead of ending on a hard edge.
  const melt = "linear-gradient(180deg, #000 0%, #000 68%, rgba(0,0,0,0.55) 84%, transparent 100%)";

  return (
    <figure className={`relative shrink-0 ${className}`}>
      {/* A soft halo behind the arch, breathing with the field. */}
      <div
        aria-hidden="true"
        className={`float-slow absolute -inset-4 ${arch} opacity-80 blur-2xl`}
        style={{
          background: dawn
            ? "radial-gradient(circle at 50% 28%, rgba(255,201,96,0.7), rgba(255,126,103,0.25) 55%, transparent 75%)"
            : "radial-gradient(circle at 50% 28%, rgba(255,255,255,0.95), rgba(14,159,138,0.22) 55%, transparent 75%)",
        }}
      />
      <div
        className={`relative h-full w-full overflow-hidden ${arch}`}
        style={{
          background: skyInArch,
          WebkitMaskImage: show ? melt : undefined,
          maskImage: show ? melt : undefined,
          boxShadow: dawn ? "inset 0 0 0 1px rgba(255,248,238,0.4)" : "inset 0 0 0 1px rgba(255,255,255,0.7)",
        }}
      >
        {show ? (
          <>
            <img
              src={src}
              alt={identity.photoAlt}
              loading="eager"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => {
                // Say exactly what was tried, so a wrong path or a missing file is easy to spot.
                console.warn(`[portrait] Could not load "${src}". Check the file is in public/ at the repo root and the name matches exactly.`);
                setFailed(true);
              }}
              className="absolute inset-x-0 bottom-0 mx-auto h-[100%] w-auto max-w-none object-contain object-bottom"
              style={{
                left: "50%",
                transform: "translateX(-50%) scale(0.95)",
                transformOrigin: "50% 100%",
                // Rim light from the sunrise behind, so the edges sit in the same light as the sky.
                filter: dawn
                  ? "drop-shadow(0 0 10px rgba(255,201,96,0.45)) drop-shadow(0 -2px 2px rgba(255,227,166,0.35))"
                  : "drop-shadow(0 0 10px rgba(255,255,255,0.7))",
              }}
            />
            {/* A breath of the scene's colour over the whole figure, so it belongs to the page. */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{
                background: dawn
                  ? "linear-gradient(180deg, rgba(255,201,96,0.25), rgba(122,79,181,0.25) 70%, rgba(42,44,132,0.45))"
                  : "linear-gradient(180deg, rgba(255,255,255,0.2), rgba(14,159,138,0.18))",
              }}
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
