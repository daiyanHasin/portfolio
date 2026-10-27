import type { AccentName, SceneId } from "../data/schema";

/**
 * Design configuration (not editorial content).
 * Each scene is an hour of the same sky: dawn, morning, golden hour, afternoon, dusk.
 * The palette is mirrored as CSS custom properties in styles/index.css (@theme);
 * the hex values here feed the canvas, which cannot read CSS variables cheaply.
 */
export const palette = {
  // dawn
  indigo: "#1E2A78",
  violet: "#7A4FB5",
  coral: "#FF7E67",
  gold: "#FFC960",
  cream: "#FFF8EE",
  // day
  sky: "#2F6BFF",
  navy: "#12224F",
  mist: "#EAF2FF",
  // golden hour
  ember: "#E8590C",
  umber: "#3A1D12",
  peach: "#FFE6CC",
  // afternoon
  teal: "#0E9F8A",
  pine: "#0D3B3A",
  seafoam: "#DDF7EF",
  // dusk
  plum: "#3A1C71",
  rose: "#E5547A",
} as const;

export const accents: Record<AccentName, string> = {
  coral: palette.coral,
  gold: "#F2A900",
  sky: palette.sky,
  violet: "#7B4FE0",
  teal: palette.teal,
  rose: palette.rose,
};

/** A grade is a scene's colour treatment, as in film grading. */
export interface Grade {
  /** Solid fallback, also used for the browser chrome. */
  bg: string;
  /** Sky gradient, top to bottom. */
  sky: string[];
  /** Soft colour clouds that drift behind everything. */
  clouds: string[];
  fg: string;
  dim: string;
  rule: string;
  /** Raised surface for panels (the project view). */
  panel: string;
  point: string;
  line: string;
  irregular: string;
  /** Colour of the embers that rise through every scene. */
  mote: string;
  /** Colour of the hairline that leads a wipe into this scene. */
  leader: string;
}

export const grades: Record<SceneId, Grade> = {
  home: {
    bg: palette.indigo,
    sky: ["#141E5C", "#2B2E86", "#6A49AE", "#C9628F", "#FF8E6B", "#FFC960"],
    clouds: ["rgba(255,142,107,0.55)", "rgba(122,79,181,0.6)", "rgba(255,201,96,0.45)"],
    fg: palette.cream,
    dim: "rgba(255,248,238,0.76)",
    rule: "rgba(255,248,238,0.34)",
    panel: "#25307F",
    // The hand is a silhouette against the dawn, drawn in deep ink; the light it reaches for is gold.
    point: "#1A1650",
    line: "#2A1F72",
    irregular: "#FFFFFF",
    mote: "#FFE2A8",
    leader: palette.gold,
  },
  work: {
    bg: palette.mist,
    sky: ["#BFD8FF", "#DCEAFF", "#F2F7FF", "#FFF4E6"],
    clouds: ["rgba(47,107,255,0.22)", "rgba(255,126,103,0.2)", "rgba(123,79,224,0.18)"],
    fg: palette.navy,
    dim: "rgba(18,34,79,0.72)",
    rule: "rgba(18,34,79,0.22)",
    panel: "#FFFFFF",
    point: "#1C3A8C",
    line: palette.sky,
    irregular: palette.coral,
    mote: "#2F6BFF",
    leader: palette.sky,
  },
  research: {
    bg: palette.peach,
    sky: ["#FFD3A8", "#FFE6CC", "#FFF3E3", "#FFFAF2"],
    clouds: ["rgba(232,89,12,0.2)", "rgba(229,84,122,0.18)", "rgba(255,201,96,0.4)"],
    fg: palette.umber,
    dim: "rgba(58,29,18,0.74)",
    rule: "rgba(58,29,18,0.22)",
    panel: "#FFFFFF",
    point: "#7A2E0E",
    line: palette.ember,
    irregular: palette.rose,
    mote: "#E8590C",
    leader: palette.ember,
  },
  about: {
    bg: palette.seafoam,
    sky: ["#BDEFE2", "#DDF7EF", "#F1FCF8", "#FFFDF4"],
    clouds: ["rgba(14,159,138,0.2)", "rgba(47,107,255,0.14)", "rgba(255,201,96,0.3)"],
    fg: palette.pine,
    dim: "rgba(13,59,58,0.74)",
    rule: "rgba(13,59,58,0.22)",
    panel: "#FFFFFF",
    point: "#0B5A52",
    line: palette.teal,
    irregular: palette.coral,
    mote: "#0E9F8A",
    leader: palette.teal,
  },
  contact: {
    bg: palette.plum,
    sky: ["#1D1450", "#3A1C71", "#7B2F7E", "#D76D77", "#FFAF7B"],
    clouds: ["rgba(229,84,122,0.5)", "rgba(255,175,123,0.4)", "rgba(58,28,113,0.6)"],
    fg: palette.cream,
    dim: "rgba(255,248,238,0.76)",
    rule: "rgba(255,248,238,0.32)",
    panel: "#3A1C71",
    point: "#FFE9D6",
    line: "#FFB98A",
    irregular: "#FFFFFF",
    mote: "#FFD6A8",
    leader: "#FFAF7B",
  },
};

export const skyGradient = (s: SceneId) => `linear-gradient(180deg, ${grades[s].sky.join(", ")})`;
