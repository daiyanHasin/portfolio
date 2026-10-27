import { useEffect } from "react";
import { field } from "../field/controller";
import type { Directive } from "../field/engine";
import type { Region } from "../field/forms";
import type { Project, SceneId } from "../data/schema";
import { accents, grades } from "../config/palette";
import type { Viewport } from "./useViewport";

interface Input {
  scene: SceneId;
  project: Project | null;
  projectOpen: boolean;
  vp: Viewport;
}

const r = (vp: Viewport, x: number, y: number, w: number, h: number): Region => ({
  x: vp.w * x,
  y: vp.h * y,
  w: vp.w * w,
  h: vp.h * h,
});

/** Decides what the field should be doing for the current scene and selection. */
export function directiveFor({ scene, project, projectOpen, vp }: Input): Directive {
  const g = grades[scene];
  const base = {
    point: g.point,
    line: g.line,
    irregular: g.irregular,
    mote: g.mote,
    alpha: 1,
    glow: false,
    presence: 0,
  };
  switch (scene) {
    case "home":
      // The hand stands to the right of the headline; on phones it rises behind it, fainter.
      return {
        ...base,
        form: "ascent",
        seed: 3,
        entropy: 0.35,
        flow: 0.5,
        glow: true,
        presence: 0.62,
        alpha: vp.small ? 0.7 : 1,
        region: vp.small ? r(vp, 0.08, 0.02, 0.84, 0.98) : r(vp, 0.46, 0, 0.5, 1),
      };
    case "work": {
      if (project) {
        const region = projectOpen
          ? vp.small
            ? r(vp, 0.1, 0.06, 0.8, 0.2)
            : r(vp, 0.04, 0.14, 0.36, 0.7)
          : vp.small
            ? r(vp, 0.1, 0.12, 0.8, 0.28)
            : r(vp, 0.58, 0.14, 0.36, 0.62);
        return {
          ...base,
          line: accents[project.visual.accent],
          form: project.visual.type,
          seed: project.visual.seed,
          entropy: 0.6,
          flow: 0.7,
          region,
        };
      }
      return {
        ...base,
        form: "frames",
        seed: 5,
        entropy: 0.5,
        flow: 0.9,
        region: vp.small ? r(vp, 0.14, 0.08, 0.72, 0.34) : r(vp, 0.6, 0, 0.32, 1),
      };
    }
    case "research":
      return {
        ...base,
        form: "spiral",
        seed: 9,
        presence: 0.2,
        entropy: 0.7,
        flow: 0.9,
        alpha: vp.small ? 0.45 : 1,
        region: vp.small ? r(vp, 0.05, 0.1, 0.9, 0.5) : r(vp, 0.6, 0.1, 0.36, 0.8),
      };
    case "about":
      return {
        ...base,
        form: "stairs",
        seed: 17,
        presence: 0.2,
        entropy: 0.6,
        flow: 0.8,
        alpha: vp.small ? 0.35 : 0.85,
        region: vp.small ? r(vp, 0, 0.3, 1, 0.65) : r(vp, 0.62, 0.12, 0.34, 0.76),
      };
    case "contact":
      return { ...base, form: "horizon", seed: 13, entropy: 0.6, flow: 1.1, glow: true, presence: 0.3, region: r(vp, 0, 0, 1, 1) };
  }
}

export function useFieldDirective(input: Input) {
  const { scene, project, projectOpen, vp } = input;
  useEffect(() => {
    field.set(directiveFor({ scene, project, projectOpen, vp }));
  }, [scene, project, projectOpen, vp]);
}
