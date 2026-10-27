import { motion } from "motion/react";
import type { SceneId } from "../data/schema";
import { content } from "../data/content";

interface Props {
  current: SceneId;
  visible: boolean;
  onGo: (s: SceneId) => void;
}

/**
 * Scene navigation, laid out like an edit timeline. The playhead takes the
 * colour of the scene's light.
 */
export function Slate({ current, visible, onGo }: Props) {
  const nav = content.navigation;
  const idx = Math.max(0, nav.findIndex((n) => n.target === current));
  return (
    <motion.nav
      aria-label="Scenes"
      className="chrome fixed inset-x-0 bottom-0 z-30 px-6 text-fg sm:px-9"
      style={{ paddingBottom: "calc(var(--safe-bottom) + 1.1rem)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.8 }}
    >
      <ol className="relative flex border-t border-rule">
        {nav.map((item, i) => {
          const active = item.target === current;
          return (
            <li
              key={item.id}
              className="relative min-w-0 transition-[flex-grow] duration-700"
              style={{ flexGrow: active ? 3 : 1, flexBasis: 0 }}
            >
              {active && (
                <motion.span
                  layoutId="playhead"
                  aria-hidden="true"
                  className="absolute -top-[3px] left-0 h-[5px] w-7 rounded-full bg-accent"
                  transition={{ type: "spring", stiffness: 260, damping: 32 }}
                />
              )}
              <button
                onClick={() => onGo(item.target)}
                aria-current={active ? "page" : undefined}
                className={`group flex w-full items-baseline gap-2 pt-3 text-left font-mono text-note transition-colors duration-500 ${
                  active ? "text-fg" : "text-dim hover:text-fg"
                }`}
              >
                <span className="tabular-nums" aria-hidden="true">
                  {i + 1}
                </span>
                <span className={`truncate ${active ? "" : "max-md:hidden"}`}>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="sr-only" aria-live="polite">
        {`Scene ${idx + 1} of ${nav.length}: ${nav[idx]?.label ?? ""}`}
      </p>
    </motion.nav>
  );
}
