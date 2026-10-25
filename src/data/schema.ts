/**
 * Shape of src/data/portfolio.json after validation.
 * Everything optional in the JSON is normalised to a safe value by content.ts,
 * so components can rely on these types without defensive checks.
 */

export type SceneId = "home" | "work" | "thinking" | "contact";
export const SCENE_IDS: readonly SceneId[] = ["home", "work", "thinking", "contact"];

/** Field forms a project may request. Mapped to generators in field/forms.ts. */
export type ProjectVisualType = "drift" | "concentric" | "monolith" | "strata" | "lattice" | "frames";
export const PROJECT_VISUAL_TYPES: readonly ProjectVisualType[] = [
  "drift",
  "concentric",
  "monolith",
  "strata",
  "lattice",
  "frames",
];

/** Accent names resolve to palette tokens in config/palette.ts. */
export type AccentName = "copper" | "verdigris" | "chartreuse" | "mineral" | "lavender" | "vermilion";
export const ACCENT_NAMES: readonly AccentName[] = [
  "copper",
  "verdigris",
  "chartreuse",
  "mineral",
  "lavender",
  "vermilion",
];

export interface LabelEntry {
  key: string;
  value: string;
}

export interface Identity {
  displayName: string;
  studyTitle: string;
  headline: string[];
  shortBio: string;
  positioning: string;
  status: string;
  location: string;
  label: LabelEntry[];
}

export interface NavItem {
  id: string;
  label: string;
  target: SceneId;
}

export interface SceneCopy {
  title: string;
  description: string;
}

export interface Interest {
  id: string;
  group: "research" | "creative";
  title: string;
  description: string;
}

export interface ProjectLinks {
  live: string;
  repository: string;
  caseStudy: string;
}

export interface ProjectVisual {
  type: ProjectVisualType;
  accent: AccentName;
  seed: number;
}

/** Optional long-form sections, rendered in this order when present. */
export type ProjectSectionKey = "problem" | "idea" | "approach" | "details" | "results" | "limitations";
export const PROJECT_SECTION_KEYS: readonly ProjectSectionKey[] = [
  "problem",
  "idea",
  "approach",
  "details",
  "results",
  "limitations",
];

export interface Project {
  id: string;
  title: string;
  category: string;
  year: string;
  summary: string;
  description: string;
  sections: Partial<Record<ProjectSectionKey, string>>;
  technologies: string[];
  links: ProjectLinks;
  visual: ProjectVisual;
  featured: boolean;
}

export interface Social {
  label: string;
  url: string;
}

export interface Contact {
  email: string;
  socials: Social[];
  closingStatement: string;
}

export interface Labels {
  skipIntro: string;
  soundOn: string;
  soundOff: string;
  close: string;
  nextProject: string;
  previousProject: string;
  beginAgain: string;
  orderReadout: string;
  pointerHint: string;
  touchHint: string;
  keyboardHint: string;
  studyPrefix: string;
  figurePrefix: string;
  methods: string;
  copyEmail: string;
  copied: string;
  emptyWork: string;
  interestGroups: Record<Interest["group"], string>;
  links: Record<keyof ProjectLinks, string>;
  sections: Record<ProjectSectionKey, string>;
}

export interface Portfolio {
  meta: { siteTitle: string; siteDescription: string; locale: string; version: string };
  identity: Identity;
  navigation: NavItem[];
  scenes: Record<SceneId, SceneCopy>;
  interests: Interest[];
  statements: string[];
  projects: Project[];
  contact: Contact;
  labels: Labels;
}
