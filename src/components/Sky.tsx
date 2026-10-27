import type { SceneId } from "../data/schema";
import { grades, skyGradient } from "../config/palette";

/**
 * The sky behind every scene: a gradient for the hour, and three large soft
 * clouds of colour drifting on long, unsynchronised loops so the light never
 * quite repeats. Pure CSS; the field draws on top of it.
 */
const CLOUDS = [
  { cls: "sky-cloud sky-cloud-a", style: { left: "-18vmax", top: "-14vmax" } },
  { cls: "sky-cloud sky-cloud-b", style: { right: "-20vmax", top: "18vh" } },
  { cls: "sky-cloud sky-cloud-c", style: { left: "18vw", bottom: "-26vmax" } },
];

export function Sky({ scene }: { scene: SceneId }) {
  const g = grades[scene];
  return (
    <div aria-hidden="true" className="fixed inset-0 z-0 overflow-hidden" style={{ background: skyGradient(scene) }}>
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          className={c.cls}
          style={{ ...c.style, background: `radial-gradient(circle at center, ${g.clouds[i % g.clouds.length]} 0%, transparent 68%)` }}
        />
      ))}
    </div>
  );
}
