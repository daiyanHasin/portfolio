import { useEffect, useState } from "react";

export interface Viewport {
  w: number;
  h: number;
  small: boolean;
  coarse: boolean;
}

const read = (): Viewport => ({
  w: window.innerWidth,
  h: window.innerHeight,
  small: window.innerWidth < 760,
  coarse: window.matchMedia("(pointer: coarse)").matches,
});

export function useViewport(): Viewport {
  const [vp, setVp] = useState(read);
  useEffect(() => {
    let t = 0;
    const on = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => setVp(read()), 120);
    };
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("resize", on);
      window.clearTimeout(t);
    };
  }, []);
  return vp;
}
