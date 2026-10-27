/**
 * Shape of src/data/portfolio.json after validation.
 * Everything optional in the JSON is normalised to a safe value by content.ts,
 * so components can rely on these types without defensive checks.
 */

export type SceneId = "home" | "work" | "research" | "about" | "contact";
export const SCENE_IDS: readonly SceneId[] = ["home", "work", "research", "about", "contact"];

/** Field forms a project may request. Mapped to generators in field/forms.ts. */
export type ProjectVisualType =
  | "drift"
  | "concentric"
  | "monolith"
  | "strata"
  | "lattice"
  | "frames"
  | "spiral"
  | "stairs"
  | "ascent";
export const PROJECT_VISUAL_TYPES: readonly ProjectVisualType[] = [
  "drift",
  "concentric",
  "monolith",
  "strata",
  "lattice",
  "frames",
  "spiral",
  "stairs",
  "ascent",
];

/** Accent names resolve to palette tokens in config/palette.ts. */
export type AccentName = "coral" | "gold" | "sky" | "violet" | "teal" | "rose";
export const ACCENT_NAMES: readonly AccentName[] = ["coral", "gold", "sky", "violet", "teal", "rose"];

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
  resumeUrl: string;
  /** Portrait: a file in public/ (e.g. "/photo.jpg") or an https URL. Empty shows initials. */
  photo: string;
  photoAlt: string;
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
  /** Optional screenshot shown as the project's figure: a file in public/ or an https URL. */
  image: string;
  imageAlt: string;
  visual: ProjectVisual;
  featured: boolean;
}

export interface Paper {
  id: string;
  title: string;
  type: string;
  venue: string;
  publisher: string;
  date: string;
  status: string;
  doi: string;
  url: string;
  authors: string[];
  objective: string;
  contributions: string[];
  technologies: string[];
  accent: AccentName;
}

export interface Role {
  role: string;
  org: string;
  period: string;
  location: string;
  points: string[];
}

export interface Education {
  degree: string;
  school: string;
  period: string;
  detail: string;
}

export interface SkillGroup {
  group: string;
  items: string[];
}

export interface Course {
  title: string;
  provider: string;
}

export interface About {
  intro: string;
  experience: Role[];
  education: Education[];
  skills: SkillGroup[];
  courses: Course[];
  leadership: Role[];
}

export interface Social {
  label: string;
  url: string;
}

export interface Contact {
  email: string;
  phone: string;
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
  pointerHint: string;
  touchHint: string;
  keyboardHint: string;
  studyPrefix: string;
  figurePrefix: string;
  methods: string;
  copyEmail: string;
  copied: string;
  emptyWork: string;
  emptyResearch: string;
  resume: string;
  seeWork: string;
  readPaper: string;
  doi: string;
  objective: string;
  contributions: string;
  authors: string;
  links: Record<keyof ProjectLinks, string>;
  sections: Record<ProjectSectionKey, string>;
  about: { experience: string; education: string; skills: string; courses: string; leadership: string };
}

export interface Portfolio {
  meta: { siteTitle: string; siteDescription: string; locale: string; version: string };
  identity: Identity;
  navigation: NavItem[];
  scenes: Record<SceneId, SceneCopy>;
  projects: Project[];
  research: Paper[];
  about: About;
  contact: Contact;
  labels: Labels;
}
