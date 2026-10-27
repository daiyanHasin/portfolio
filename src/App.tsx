import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { content } from "./data/content";
import { SCENE_IDS, type SceneId } from "./data/schema";
import { grades } from "./config/palette";
import { duration, intro } from "./config/motion";
import { sceneVariants } from "./config/variants";
import { Field } from "./field/Field";
import { field } from "./field/controller";
import { useViewport } from "./hooks/useViewport";
import { useSceneNavigation } from "./hooks/useSceneNavigation";
import { useFieldDirective } from "./hooks/useFieldDirective";
import { Shutter } from "./components/Shutter";
import { FrameMarks } from "./components/FrameMarks";
import { TopBar } from "./components/TopBar";
import { Slate } from "./components/Slate";
import { ProjectView } from "./components/ProjectView";
import { Entrance } from "./scenes/Entrance";
import { Work } from "./scenes/Work";
import { Research } from "./scenes/Research";
import { About } from "./scenes/About";
import { Sky } from "./components/Sky";
import { Contact } from "./scenes/Contact";
import { sound } from "./lib/sound";

/** Intro stages: 0 empty frame, 1 marks, 2 field, 3 type, 4 details, 5 interactive. */
const DONE = 5;
const SEEN_KEY = "portfolio:intro-seen";

const sceneFromHash = (): SceneId => {
  const raw = window.location.hash.slice(1);
  // Older links pointed at #thinking; that content now lives under About.
  const h = raw === "thinking" ? "about" : raw;
  return (SCENE_IDS as readonly string[]).includes(h) ? (h as SceneId) : "home";
};

const gradeVars = (s: SceneId): CSSProperties => {
  const g = grades[s];
  return {
    ["--fg" as string]: g.fg,
    ["--dim" as string]: g.dim,
    ["--rule" as string]: g.rule,
    ["--accent" as string]: g.leader,
    ["--panel" as string]: g.panel,
    color: g.fg,
  };
};

export default function App() {
  const reduced = !!useReducedMotion();
  const vp = useViewport();
  const { navigation, projects, scenes, meta, labels } = content;
  const order = useMemo(() => navigation.map((n) => n.target), [navigation]);

  const [initial] = useState(sceneFromHash);
  const [scene, setScene] = useState<SceneId>(initial);
  const [base, setBase] = useState<SceneId>(initial);
  const [chromeScene, setChromeScene] = useState<SceneId>(initial);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [stage, setStage] = useState(initial === "home" ? 0 : DONE);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [soundOn, setSoundOn] = useState(false);
  const trigger = useRef<HTMLElement | null>(null);
  const timers = useRef<number[]>([]);
  const queued = useRef<SceneId | null>(null);
  const [retake, setRetake] = useState(0);

  const busy = scene !== base;
  const introDone = stage >= DONE;
  const focusedProject = projects.find((p) => p.id === (openId ?? focusId)) ?? null;
  const openIndex = openId ? projects.findIndex((p) => p.id === openId) : -1;

  useFieldDirective({ scene, project: scene === "work" ? focusedProject : null, projectOpen: !!openId, vp });

  /* ---------- intro ---------- */

  const finishIntro = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStage(DONE);
    field.setMaster(1);
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage unavailable: the intro will simply play in full again */
    }
  }, []);

  useEffect(() => {
    if (initial !== "home") {
      field.setMaster(1, true);
      return;
    }
    let seen = false;
    try {
      seen = sessionStorage.getItem(SEEN_KEY) === "1";
    } catch {
      seen = false;
    }
    const t = reduced || seen ? intro.short : intro.full;
    field.setMaster(0, true);
    if (!reduced) field.disperse();
    const at = (ms: number, fn: () => void) => timers.current.push(window.setTimeout(fn, ms));
    at(t.marks, () => setStage(1));
    at(t.field, () => {
      setStage(2);
      field.setMaster(1);
    });
    at(t.type, () => setStage(3));
    at(t.details, () => setStage(4));
    at(t.done, finishIntro);
    return () => timers.current.forEach(clearTimeout);
  }, [initial, reduced, finishIntro]);

  useEffect(() => {
    if (introDone) return;
    const skip = () => finishIntro();
    window.addEventListener("pointerdown", skip);
    return () => window.removeEventListener("pointerdown", skip);
  }, [introDone, finishIntro]);

  /* ---------- navigation ---------- */

  const go = useCallback(
    (to: SceneId) => {
      if (!introDone) return finishIntro();
      // Mid-cut: remember the latest request and take it as soon as the wipe lands,
      // instead of silently dropping the click.
      if (busy) {
        queued.current = to;
        return;
      }
      // Already here: answer anyway. The field breaks apart and re-forms (a retake),
      // and on the index the headline plays its entrance again.
      if (to === scene) {
        setOpenId(null);
        if (!reduced) field.disperse();
        if (to === "home") setRetake((n) => n + 1);
        sound.cut();
        return;
      }
      setDirection(order.indexOf(to) > order.indexOf(scene) ? 1 : -1);
      setScene(to);
      setFocusId(null);
      setOpenId(null);
      sound.cut();
      timers.current.push(window.setTimeout(() => setChromeScene(to), duration.wipe * 450));
      try {
        const url = to === "home" ? window.location.pathname + window.location.search : `#${to}`;
        window.history.replaceState(null, "", url);
      } catch {
        /* history unavailable inside some embeds */
      }
    },
    [introDone, finishIntro, scene, busy, order, reduced],
  );

  useEffect(() => {
    if (busy || !queued.current) return;
    const next = queued.current;
    queued.current = null;
    if (next !== scene) go(next);
  }, [busy, scene, go]);

  const step = (d: 1 | -1) => {
    const i = order.indexOf(scene);
    const next = order[i + d];
    if (next) go(next);
  };

  useSceneNavigation({
    enabled: introDone && !openId,
    next: () => step(1),
    prev: () => step(-1),
    jump: (i) => order[i] && go(order[i]),
    onAnyInput: introDone ? undefined : finishIntro,
  });

  /* ---------- chrome colours follow the cut ---------- */

  useEffect(() => {
    const g = grades[chromeScene];
    const root = document.documentElement.style;
    root.setProperty("--fg", g.fg);
    root.setProperty("--dim", g.dim);
    root.setProperty("--rule", g.rule);
    root.setProperty("--accent", g.leader);
    root.setProperty("--panel", g.panel);
    root.setProperty("--bg", grades[base].bg);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", grades[base].bg);
  }, [chromeScene, base]);

  useEffect(() => {
    document.title = scene === "home" ? meta.siteTitle : `${scenes[scene].title}, ${meta.siteTitle}`;
  }, [scene, scenes, meta.siteTitle]);

  /* ---------- projects ---------- */

  const openProject = (id: string, el: HTMLElement) => {
    trigger.current = el;
    setFocusId(id);
    setOpenId(id);
    sound.cut();
  };
  const closeProject = useCallback(() => {
    setOpenId(null);
    window.setTimeout(() => trigger.current?.focus({ preventScroll: true }), 30);
  }, []);
  const stepProject = useCallback(
    (d: 1 | -1) => {
      if (openIndex < 0 || projects.length < 2) return;
      const next = projects[(openIndex + d + projects.length) % projects.length];
      setOpenId(next.id);
      setFocusId(next.id);
      sound.tick();
      trigger.current = document.querySelector<HTMLElement>(`[aria-describedby="summary-${next.id}"]`);
    },
    [openIndex, projects],
  );

  const toggleSound = () => {
    const on = !soundOn;
    sound.setEnabled(on);
    setSoundOn(on);
    if (on) sound.tick();
  };

  const sceneNode = (s: SceneId) => {
    switch (s) {
      case "home":
        return (
          <Entrance
            key={retake}
            reduced={reduced}
            coarse={vp.coarse}
            small={vp.small}
            revealed={stage >= 3}
            detailsRevealed={stage >= 4}
            onSeeWork={() => go("work")}
          />
        );
      case "work":
        return (
          <Work
            reduced={reduced}
            small={vp.small}
            focusId={focusId}
            openId={openId}
            onFocusProject={setFocusId}
            onOpen={openProject}
          />
        );
      case "research":
        return <Research reduced={reduced} small={vp.small} />;
      case "about":
        return <About reduced={reduced} small={vp.small} />;
      case "contact":
        return (
          <Contact
            reduced={reduced}
            small={vp.small}
            onBeginAgain={() => {
              if (!reduced) field.disperse();
              go("home");
            }}
          />
        );
    }
  };

  const sceneLabel = (s: SceneId) => {
    const i = order.indexOf(s);
    return `${i + 1} ${navigation[i]?.label ?? ""}`;
  };

  return (
    <>
      <Sky scene={base} />
      <Shutter from={base} to={scene} direction={direction} reduced={reduced} label={sceneLabel(scene)} onDone={() => setBase(scene)} />
      <Field reduced={reduced} />

      <main className="contents">
        <AnimatePresence mode="wait">
          <motion.section
            key={scene}
            aria-labelledby={`scene-${scene}-title`}
            className="fixed inset-0 z-20"
            style={gradeVars(scene)}
            variants={sceneVariants}
            initial="hidden"
            animate="shown"
            exit="gone"
          >
            {sceneNode(scene)}
          </motion.section>
        </AnimatePresence>
      </main>

      <FrameMarks visible={stage >= 1} reduced={reduced} />
      <TopBar visible={stage >= 4} soundOn={soundOn} onSound={toggleSound} onHome={() => go("home")} />
      <Slate current={scene} visible={stage >= 4} onGo={go} />

      <AnimatePresence>
        {!introDone && scene === "home" && (
          <motion.button
            key="skip"
            onClick={finishIntro}
            className="fixed right-6 z-50 font-mono text-note text-fg sm:right-9"
            style={{ bottom: "calc(var(--safe-bottom) + 1.4rem)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { delay: 0.3 } }}
            exit={{ opacity: 0 }}
          >
            <span className="draw-line">{labels.skipIntro}</span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openId && openIndex >= 0 && scene === "work" && (
          <>
            {!vp.small && (
              <motion.div
                key="catcher"
                aria-hidden="true"
                className="fixed inset-y-0 left-0 z-40 w-[42vw] cursor-pointer"
                onClick={closeProject}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            <ProjectView
              key="dialog"
              project={projects[openIndex]}
              index={openIndex}
              total={projects.length}
              reduced={reduced}
              small={vp.small}
              onClose={closeProject}
              onStep={stepProject}
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
