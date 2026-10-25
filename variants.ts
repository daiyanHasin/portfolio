import type { Variants } from "motion/react";
import { duration, ease } from "./motion";

/**
 * Shared variants. Scenes use initial="hidden" animate="shown" exit="gone";
 * children receive `custom` = their position in the reveal order.
 * Reduced-motion variants keep the same rhythm but replace travel with opacity.
 */
export const sceneVariants: Variants = {
  hidden: {},
  shown: {},
  gone: { opacity: 0, transition: { duration: duration.exit, ease: ease.exit } },
};

/** A line of type rising out of a mask. The parent must clip (overflow-hidden). */
export const rise = (reduced: boolean): Variants =>
  reduced
    ? {
        hidden: { opacity: 0 },
        shown: (i: number = 0) => ({ opacity: 1, transition: { duration: 0.3, delay: 0.1 + i * 0.03 } }),
        gone: { opacity: 0, transition: { duration: 0.15 } },
      }
    : {
        hidden: { y: "112%" },
        shown: (i: number = 0) => ({
          y: "0%",
          transition: { duration: duration.enter, ease: ease.settle, delay: duration.enterDelay + i * duration.stagger },
        }),
        gone: { y: "-112%", transition: { duration: duration.exit, ease: ease.exit } },
      };

/** Secondary details: they arrive after the type, without travelling. */
export const settle = (reduced: boolean): Variants => ({
  hidden: { opacity: 0 },
  shown: (i: number = 0) => ({
    opacity: 1,
    transition: { duration: reduced ? 0.3 : 0.7, ease: ease.settle, delay: (reduced ? 0.1 : duration.enterDelay + 0.25) + i * 0.06 },
  }),
  gone: { opacity: 0, transition: { duration: 0.18 } },
});

/** A hairline drawing itself from the left. */
export const drawRule = (reduced: boolean): Variants => ({
  hidden: { scaleX: reduced ? 1 : 0, opacity: reduced ? 0 : 1 },
  shown: (i: number = 0) => ({
    scaleX: 1,
    opacity: 1,
    transition: { duration: reduced ? 0.3 : 1.1, ease: ease.cut, delay: duration.enterDelay + i * duration.stagger },
  }),
  gone: { opacity: 0, transition: { duration: 0.18 } },
});
