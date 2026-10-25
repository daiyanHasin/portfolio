import { motion } from "motion/react";
import type { ReactNode } from "react";
import { rise } from "../config/variants";

interface Props {
  i?: number;
  reduced: boolean;
  className?: string;
  innerClassName?: string;
  children: ReactNode;
}

/** One line of type revealed through a clipping mask. */
export function Line({ i = 0, reduced, className = "", innerClassName = "", children }: Props) {
  return (
    <span className={`block overflow-hidden pb-[0.1em] -mb-[0.1em] ${className}`}>
      <motion.span className={`block ${innerClassName}`} variants={rise(reduced)} custom={i}>
        {children}
      </motion.span>
    </span>
  );
}
