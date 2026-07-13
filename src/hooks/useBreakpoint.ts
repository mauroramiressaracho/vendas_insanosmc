import { useEffect, useState } from "react";

export type Breakpoint = "smallMobile" | "mobile" | "tablet" | "desktop";

const getBreakpoint = (): Breakpoint => {
  const width = window.innerWidth;
  if (width <= 479) return "smallMobile";
  if (width <= 767) return "mobile";
  if (width <= 1199) return "tablet";
  return "desktop";
};

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => getBreakpoint());

  useEffect(() => {
    const onResize = () => setBreakpoint(getBreakpoint());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === "smallMobile" || breakpoint === "mobile",
    isTablet: breakpoint === "tablet",
    isDesktop: breakpoint === "desktop",
  };
};
