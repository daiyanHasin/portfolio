# Hasin Md. Daiyan, portfolio

A scene-based portfolio. Each scene is an hour of the same sky, dawn to dusk. A field
of points flows across every scene and gathers into a form: on the front page, a hand
reaching up toward a light. Where you look, the form sharpens.

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
Edit it, commit, push: Vercel rebuilds and the site updates.

**Add a project:** append an object to `projects` (optional sections appear only when filled in):

```json
{
  "id": "my-project",
  "title": "My project",
  "category": "Computer vision",
  "year": "2026",
  "summary": "One sentence, shown as the figure caption.",
  "description": "Two or three sentences for the opened view.",
  "problem": "", "idea": "", "approach": "", "details": "", "results": "", "limitations": "",
  "technologies": ["Python", "PyTorch"],
  "links": { "live": "", "repository": "https://github.com/daiyanHasin/repo", "caseStudy": "" },
  "visual": { "type": "spiral", "accent": "sky", "seed": 52 },
  "featured": true
}
```

- `visual.type`: `drift`, `concentric`, `monolith`, `strata`, `lattice`, `frames`, `spiral`, `stairs`, `ascent`.
- `visual.accent`: `coral`, `gold`, `sky`, `violet`, `teal`, `rose`.
- `featured: false` sets the title smaller. Empty links are hidden.

**Add a paper:** append to `research`. `doi` builds the link automatically when `url` is empty;
`status` (e.g. "Published", "Under review") shows as a coloured tag; empty fields are hidden.

**About page:** `about.intro`, `experience`, `leadership` (role, org, period, points),
`education` (degree, school, period, detail), `skills` (group, items), `courses` (title, provider).

**Photo:** put it in `public/` (e.g. `public/photo.jpg`, portrait orientation, face in the upper
third) and set `identity.photo` to `"/photo.jpg"`. It appears in an arch on the front page and the
About page, with a warm tint from overlays; the file itself is not changed. Empty shows initials.

**Project screenshots:** put an image in `public/projects/` and set the project's `image`
(e.g. `"/projects/koineze.webp"`) and `imageAlt`. It shows as the project's figure and in its
opened view. Projects without one show their field form instead.

**Résumé button:** put the PDF in `public/` and set `identity.resumeUrl` to `"/resume.pdf"`.

**Front page:** `identity.headline` holds the three headline lines; `identity.label` the small facts
in the corner card. `contact` holds email, phone, social links and the closing line.

Unknown values fall back to safe defaults with a warning in the dev console.

## Security

`vercel.json` sends a strict Content-Security-Policy (scripts only from this site; fonts only from
Google Fonts; no frames, forms or plugins), plus nosniff, frame-deny, referrer, permissions and HSTS
headers. Links and images from `portfolio.json` are filtered: only `https://`, `mailto:` or files in
`public/` are used, so a bad value can never become a script. If you add a new external service
(analytics, an embed), add its domain to the CSP or the browser will block it.

## Structure

```
src/
  data/       portfolio.json (content), schema.ts (types), content.ts (validation)
  config/     palette.ts (colours, scene grades), motion.ts (easing, timing), variants.ts
  field/      engine.ts (simulation + canvas), forms.ts (shape generators),
              controller.ts (bridge), Field.tsx
  scenes/     Entrance, Work, Research, About, Contact
  components/ Sky (gradient + drifting clouds), Shutter (scene cut), Slate (navigation), TopBar, FrameMarks,
              ProjectView (dialog), GazeHeadline, Line (masked reveal)
  hooks/      useSceneNavigation, useFieldDirective, useViewport
  lib/        sound.ts
```

Design tokens live in `src/styles/index.css` (`@theme`) and mirror `config/palette.ts`.

## Behaviour notes

- **Navigation:** the slate at the bottom, arrow keys, Page Up/Down, keys 1 to 5, Home, mouse wheel and vertical swipe. Scroll areas keep their own scrolling until they reach an end.
- **Deep links:** `#work`, `#research`, `#about` and `#contact` open that scene and skip the intro.
- **Intro:** about 2.5 seconds, skipped by any input, and shortened for the rest of the session.
- **Project view:** Escape closes it, arrow keys step between projects, and focus returns to the project you opened.
- **Reduced motion:** wipes become crossfades, the headline holds a fixed composition, and the field stops redrawing once it settles.
- **Sound:** off by default; audio starts only after the sound toggle is pressed.
- **Performance:** the field is Canvas 2D (no WebGL). It uses 420 to 1,700 points depending on screen size, pauses in background tabs, and caps device pixel ratio at 2.
