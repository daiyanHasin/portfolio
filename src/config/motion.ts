/**
 * The motion language. Every animated thing in the site draws from these.
 *  - cut:    scene changes. Slow out of rest, fast through the middle, soft landing.
 *  - settle: things arriving and coming to rest (text, overlays).
 *  - exit:   things leaving. Quicker than arrivals, so the eye goes to what is new.
 */
export const ease = {
  cut: [0.76, 0, 0.24, 1] as const,
  settle: [0.16, 1, 0.3, 1] as const,
  exit: [0.55, 0, 1, 0.45] as const,
};

export const easeCss = {
  cut: "cubic-bezier(0.76, 0, 0.24, 1)",
  settle: "cubic-bezier(0.16, 1, 0.3, 1)",
};

export const duration = {
  wipe: 0.82,
  exit: 0.28,
  enter: 0.9,
  stagger: 0.07,
  /** Delay before a new scene's type arrives, so it follows the wipe. */
  enterDelay: 0.36,
};

/** Intro sequence timings in ms. Shortened for returning visitors. */
export const intro = {
  full: { marks: 250, field: 520, type: 980, details: 1700, done: 2500 },
  short: { marks: 0, field: 80, type: 220, details: 520, done: 800 },
};
