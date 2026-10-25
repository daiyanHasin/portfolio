# An Unfinished Study

A scene-based portfolio built around one rule: **order exists only where you look.**
A field of points holds its form near the pointer and drifts apart elsewhere; the
headline and project titles follow the same rule with a variable-width typeface.

## Run it

```bash
npm install
npm run dev           # local development
npm run build         # type-check + production build into dist/
npm run build:single  # everything inlined into one dist-single/index.html
npm run preview       # serve the production build
```

Editing `src/data/portfolio.json` updates the site on the next dev reload or
rebuild. It is bundled at build time, not fetched at runtime, so a deployed site
changes only after you rebuild and redeploy.

## Editing content

All editable copy lives in `src/data/portfolio.json`. No component needs to change.

**Add a project:** append an object to `projects`:

```json
{
  "id": "project-epsilon",
  "title": "Project Epsilon",
  "category": "Research",
  "year": "2026",
  "summary": "One sentence, shown as the figure caption.",
  "description": "Two or three sentences for the opened view.",
  "problem": "Optional", "idea": "Optional", "approach": "Optional",
  "details": "Optional", "results": "Optional", "limitations": "Optional",
  "technologies": ["Python", "Graphs"],
  "links": { "live": "", "repository": "https://github.com/you/repo", "caseStudy": "" },
  "visual": { "type": "concentric", "accent": "mineral", "seed": 52 },
  "featured": true
}
```

- `id` must be unique and stable; it identifies the project in interaction state.
- Optional sections (`problem` … `limitations`) appear only when filled in.
- Empty or non-http(s) links are hidden automatically.
- `visual.type` picks the field's form: `drift`, `concentric`, `monolith`, `strata`, `lattice`, `frames`.
- `visual.accent`: `copper`, `verdigris`, `chartreuse`, `mineral`, `lavender`, `vermilion`.
- `visual.seed` changes the form's random details.
- `featured: false` sets the title smaller in the index.

Unknown values fall back to safe defaults with a warning in the dev console.

**Edit a project:** change its fields. **Remove one:** delete its object.

Other sections:

- `identity` holds the name, headline lines, gallery label and short bio.
- `statements` and `interests` (with `group`: `research` or `creative`) fill Fragments.
- `contact` holds the email, social links and closing line.
- `navigation` sets scene labels. All four scenes stay reachable even if one is omitted.
- `labels` holds every small interface string.

## Structure

```
src/
  data/       portfolio.json (content), schema.ts (types), content.ts (validation)
  config/     palette.ts (colours, scene grades), motion.ts (easing, timing), variants.ts
  field/      engine.ts (simulation + canvas), forms.ts (shape generators),
              controller.ts (bridge), Field.tsx
  scenes/     Entrance, Work, Fragments, Contact
  components/ Shutter (scene cut), Slate (navigation), TopBar, FrameMarks,
              ProjectView (dialog), GazeHeadline, Line (masked reveal)
  hooks/      useSceneNavigation, useFieldDirective, useViewport
  lib/        sound.ts
```

Design tokens live in `src/styles/index.css` (`@theme`) and mirror `config/palette.ts`.

## Behaviour notes

- **Navigation:** the slate at the bottom, arrow keys, Page Up/Down, keys 1 to 4, Home, mouse wheel and vertical swipe. Scroll areas keep their own scrolling until they reach an end.
- **Deep links:** `#work`, `#thinking` and `#contact` open that scene and skip the intro.
- **Intro:** about 2.5 seconds, skipped by any input, and shortened for the rest of the session.
- **Project view:** Escape closes it, arrow keys step between projects, and focus returns to the project you opened.
- **Reduced motion:** wipes become crossfades, the headline holds a fixed composition, and the field stops redrawing once it settles.
- **Sound:** off by default; audio starts only after the sound toggle is pressed.
- **Performance:** the field is Canvas 2D (no WebGL). It uses 420 to 1,700 points depending on screen size, pauses in background tabs, and caps device pixel ratio at 2.
