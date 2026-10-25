import raw from "./portfolio.json";
import {
  ACCENT_NAMES,
  PROJECT_SECTION_KEYS,
  PROJECT_VISUAL_TYPES,
  SCENE_IDS,
  type AccentName,
  type Interest,
  type NavItem,
  type Portfolio,
  type Project,
  type ProjectSectionKey,
  type ProjectVisualType,
  type SceneCopy,
  type SceneId,
} from "./schema";

/*
 * The JSON is treated as untrusted input: every field is read through a small
 * validator that falls back to a safe value and warns in development.
 * Components only ever see the normalised `content` export.
 */

type Unknown = Record<string, unknown>;
const isObj = (v: unknown): v is Unknown => typeof v === "object" && v !== null && !Array.isArray(v);

const warn = (path: string, msg: string) => {
  if (import.meta.env.DEV) console.warn(`[portfolio.json] ${path}: ${msg}`);
};

function str(o: Unknown | undefined, key: string, fallback = "", path = ""): string {
  const v = o?.[key];
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (v !== undefined) warn(`${path}.${key}`, "expected a string");
  return fallback;
}

function strList(v: unknown, path: string): string[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    warn(path, "expected an array of strings");
    return [];
  }
  return v.filter((x): x is string => typeof x === "string" && x.trim() !== "").map((x) => x.trim());
}

function objList(v: unknown, path: string): Unknown[] {
  if (v === undefined) return [];
  if (!Array.isArray(v)) {
    warn(path, "expected an array");
    return [];
  }
  return v.filter(isObj);
}

function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T, path: string): T {
  if (typeof v === "string" && (allowed as readonly string[]).includes(v)) return v as T;
  if (v !== undefined) warn(path, `"${String(v)}" is not one of ${allowed.join(", ")}; using "${fallback}"`);
  return fallback;
}

/** Only http(s) and mailto links survive; anything else is dropped (and hidden in the UI). */
function safeUrl(v: unknown): string {
  if (typeof v !== "string") return "";
  const s = v.trim();
  return /^(https?:\/\/|mailto:)/i.test(s) ? s : "";
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function uniqueIds<T extends { id: string }>(items: T[], path: string): T[] {
  const seen = new Set<string>();
  return items.map((item, i) => {
    let id = item.id || `item-${i + 1}`;
    if (seen.has(id)) {
      warn(path, `duplicate id "${id}"`);
      id = `${id}-${i + 1}`;
    }
    seen.add(id);
    return { ...item, id };
  });
}

function parseProject(p: Unknown, i: number): Project {
  const path = `projects[${i}]`;
  const title = str(p, "title", `Untitled ${i + 1}`, path);
  const visualRaw = isObj(p.visual) ? p.visual : {};
  const linksRaw = isObj(p.links) ? p.links : {};
  const sections: Partial<Record<ProjectSectionKey, string>> = {};
  for (const key of PROJECT_SECTION_KEYS) {
    const v = str(p, key, "", path);
    if (v) sections[key] = v;
  }
  const seedRaw = visualRaw.seed;
  return {
    id: str(p, "id", "", path) || slug(title) || `project-${i + 1}`,
    title,
    category: str(p, "category", "", path),
    year: str(p, "year", "", path),
    summary: str(p, "summary", "", path),
    description: str(p, "description", "", path),
    sections,
    technologies: strList(p.technologies, `${path}.technologies`),
    links: {
      live: safeUrl(linksRaw.live),
      repository: safeUrl(linksRaw.repository),
      caseStudy: safeUrl(linksRaw.caseStudy),
    },
    visual: {
      type: oneOf<ProjectVisualType>(visualRaw.type, PROJECT_VISUAL_TYPES, "drift", `${path}.visual.type`),
      accent: oneOf<AccentName>(visualRaw.accent, ACCENT_NAMES, "copper", `${path}.visual.accent`),
      seed: typeof seedRaw === "number" && Number.isFinite(seedRaw) ? seedRaw : (i + 1) * 17,
    },
    featured: p.featured !== false,
  };
}

function parse(input: unknown): Portfolio {
  const r = isObj(input) ? input : {};
  const meta = isObj(r.meta) ? r.meta : {};
  const id = isObj(r.identity) ? r.identity : {};
  const scenesRaw = isObj(r.scenes) ? r.scenes : {};
  const contactRaw = isObj(r.contact) ? r.contact : {};
  const labelsRaw = isObj(r.labels) ? r.labels : {};
  const linkLabels = isObj(labelsRaw.links) ? labelsRaw.links : {};
  const sectionLabels = isObj(labelsRaw.sections) ? labelsRaw.sections : {};
  const groupLabels = isObj(labelsRaw.interestGroups) ? labelsRaw.interestGroups : {};

  const defaultNav: NavItem[] = [
    { id: "home", label: "Index", target: "home" },
    { id: "work", label: "Selected work", target: "work" },
    { id: "thinking", label: "Fragments", target: "thinking" },
    { id: "contact", label: "Contact", target: "contact" },
  ];
  let navigation = objList(r.navigation, "navigation").map((n, i) => ({
    id: str(n, "id", "", `navigation[${i}]`),
    label: str(n, "label", "", `navigation[${i}]`),
    target: oneOf<SceneId>(n.target, SCENE_IDS, "home", `navigation[${i}].target`),
  }));
  // Every scene must stay reachable, whatever the JSON says.
  for (const d of defaultNav) {
    if (!navigation.some((n) => n.target === d.target)) navigation.push(d);
  }
  navigation = uniqueIds(
    navigation
      .map((n) => ({ ...n, label: n.label || defaultNav.find((d) => d.target === n.target)!.label }))
      .sort((a, b) => SCENE_IDS.indexOf(a.target) - SCENE_IDS.indexOf(b.target))
      .filter((n, i, all) => all.findIndex((m) => m.target === n.target) === i),
    "navigation",
  );

  const scenes = Object.fromEntries(
    SCENE_IDS.map((sid) => {
      const s = isObj(scenesRaw[sid]) ? (scenesRaw[sid] as Unknown) : {};
      const navLabel = navigation.find((n) => n.target === sid)?.label ?? sid;
      return [sid, { title: str(s, "title", navLabel), description: str(s, "description") } satisfies SceneCopy];
    }),
  ) as Record<SceneId, SceneCopy>;

  const interests: Interest[] = uniqueIds(
    objList(r.interests, "interests").map((it, i) => ({
      id: str(it, "id", "", `interests[${i}]`) || slug(str(it, "title")),
      group: oneOf<"research" | "creative">(it.group, ["research", "creative"], "research", `interests[${i}].group`),
      title: str(it, "title", "", `interests[${i}]`),
      description: str(it, "description", "", `interests[${i}]`),
    })),
    "interests",
  ).filter((it) => it.title);

  const headline = strList(id.headline, "identity.headline");

  const label = objList(id.label, "identity.label")
    .map((e) => ({ key: str(e, "key"), value: str(e, "value") }))
    .filter((e) => e.key && e.value);

  const projects = uniqueIds(objList(r.projects, "projects").map(parseProject), "projects");

  return {
    meta: {
      siteTitle: str(meta, "siteTitle", "Portfolio"),
      siteDescription: str(meta, "siteDescription"),
      locale: str(meta, "locale", "en"),
      version: str(meta, "version", "1.0.0"),
    },
    identity: {
      displayName: str(id, "displayName", "Your Name"),
      studyTitle: str(id, "studyTitle"),
      headline: headline.length ? headline : ["Between systems", "and possibility."],
      shortBio: str(id, "shortBio"),
      positioning: str(id, "positioning"),
      status: str(id, "status"),
      location: str(id, "location"),
      label,
    },
    navigation,
    scenes,
    interests,
    statements: strList(r.statements, "statements"),
    projects,
    contact: {
      email: str(contactRaw, "email").replace(/^mailto:/i, ""),
      socials: objList(contactRaw.socials, "contact.socials")
        .map((s) => ({ label: str(s, "label"), url: safeUrl(s.url) }))
        .filter((s) => s.label && s.url),
      closingStatement: str(contactRaw, "closingStatement"),
    },
    labels: {
      skipIntro: str(labelsRaw, "skipIntro", "Skip intro"),
      soundOn: str(labelsRaw, "soundOn", "Sound on"),
      soundOff: str(labelsRaw, "soundOff", "Sound off"),
      close: str(labelsRaw, "close", "Close"),
      nextProject: str(labelsRaw, "nextProject", "Next"),
      previousProject: str(labelsRaw, "previousProject", "Previous"),
      beginAgain: str(labelsRaw, "beginAgain", "Begin again"),
      orderReadout: str(labelsRaw, "orderReadout", "Order"),
      pointerHint: str(labelsRaw, "pointerHint", "Move to look"),
      touchHint: str(labelsRaw, "touchHint", "Touch to look"),
      keyboardHint: str(labelsRaw, "keyboardHint", ""),
      studyPrefix: str(labelsRaw, "studyPrefix", "No."),
      figurePrefix: str(labelsRaw, "figurePrefix", "Fig."),
      methods: str(labelsRaw, "methods", "Methods"),
      copyEmail: str(labelsRaw, "copyEmail", "Copy address"),
      copied: str(labelsRaw, "copied", "Copied"),
      emptyWork: str(labelsRaw, "emptyWork", "No projects yet."),
      interestGroups: {
        research: str(groupLabels, "research", "Research"),
        creative: str(groupLabels, "creative", "Creative"),
      },
      links: {
        live: str(linkLabels, "live", "Live version"),
        repository: str(linkLabels, "repository", "Repository"),
        caseStudy: str(linkLabels, "caseStudy", "Case study"),
      },
      sections: {
        problem: str(sectionLabels, "problem", "The question"),
        idea: str(sectionLabels, "idea", "The idea"),
        approach: str(sectionLabels, "approach", "Approach"),
        details: str(sectionLabels, "details", "Details"),
        results: str(sectionLabels, "results", "Results"),
        limitations: str(sectionLabels, "limitations", "Limitations"),
      },
    },
  };
}

export const content: Portfolio = parse(raw);
