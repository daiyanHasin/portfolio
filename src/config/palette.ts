import type { AccentName, SceneId } from "../data/schema";

/**
 * Design configuration (not editorial content).
 * The palette is mirrored as CSS custom properties in styles/index.css (@theme);
 * the hex values here feed the canvas, which cannot read CSS variables cheaply.
 */
export const palette = {
  silver: "#BAB5AA", // gallery wall, the dominant neutral
  ink: "#1C1A17",
  charcoal: "#2A2723",
  bone: "#E6E0D3",
  forest: "#16261E",
  ivory: "#DACDB3",
  vermilion: "#C9452A", // reserved for the one particle that never obeys, and the playhead
  copper: "#B36B43",
  verdigris: "#6F9C8B",
  chartreuse: "#C4CC3E", // appears only on the leading edge of a cut and on one study
  mineral: "#6C8595",
  lavender: "#A39CC0",
} as const;

export const accents: Record<AccentName, string> = {
  copper: palette.copper,
  verdigris: palette.verdigris,
  chartreuse: palette.chartreuse,
  mineral: palette.mineral,
  lavender: palette.lavender,
  vermilion: palette.vermilion,
};

/** A grade is a scene's colour treatment, as in film grading. */
export interface Grade {
  bg: string;
  fg: string;
  dim: string;
  rule: string;
  point: string;
  line: string;
  irregular: string;
  /** Colour of the hairline that leads a wipe into this scene. */
  leader: string;
}

export const grades: Record<SceneId, Grade> = {
  home: {
    bg: palette.silver,
    fg: palette.ink,
    dim: "rgba(28,26,23,0.72)",
    rule: "rgba(28,26,23,0.32)",
    point: palette.ink,
    line: palette.ink,
    irregular: palette.vermilion,
    leader: palette.chartreuse,
  },
  work: {
    bg: palette.charcoal,
    fg: palette.bone,
    dim: "rgba(230,224,211,0.64)",
    rule: "rgba(230,224,211,0.22)",
    point: palette.bone,
    line: palette.copper,
    irregular: palette.vermilion,
    leader: palette.copper,
  },
  thinking: {
    bg: palette.forest,
    fg: "#D6D1E2",
    dim: "rgba(214,209,226,0.66)",
    rule: "rgba(214,209,226,0.2)",
    point: palette.lavender,
    line: palette.mineral,
    irregular: palette.vermilion,
    leader: palette.lavender,
  },
  contact: {
    bg: palette.ivory,
    fg: palette.ink,
    dim: "rgba(28,26,23,0.72)",
    rule: "rgba(28,26,23,0.3)",
    point: palette.ink,
    line: palette.mineral,
    irregular: palette.vermilion,
    leader: palette.mineral,
  },
};
