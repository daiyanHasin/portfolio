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
  const base = { point: g.point, line: g.line, irregular: g.irregular };
  switch (scene) {
    case "home":
      return { ...base, form: "lattice", seed: 3, entropy: 0.6, region: r(vp, 0.05, 0.1, 0.9, 0.8) };
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
          region,
        };
      }
      return {
        ...base,
        form: "frames",
        seed: 5,
        entropy: 0.5,
        region: vp.small ? r(vp, 0.14, 0.08, 0.72, 0.34) : r(vp, 0.6, 0, 0.32, 1),
      };
    }
    case "thinking":
      return { ...base, form: "strata", seed: 9, entropy: 1.15, region: r(vp, 0, 0.04, 1, 0.92) };
    case "contact":
      return { ...base, form: "horizon", seed: 13, entropy: 0.6, region: r(vp, 0, 0, 1, 1) };
  }
}

export function useFieldDirective(input: Input) {
  const { scene, project, projectOpen, vp } = input;
  useEffect(() => {
    field.set(directiveFor({ scene, project, projectOpen, vp }));
  }, [scene, project, projectOpen, vp]);
}
