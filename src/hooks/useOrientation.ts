import { useEffect, useState } from "react";

const getOrientation = () => (window.innerWidth >= window.innerHeight ? "landscape" : "portrait");

export const useOrientation = () => {
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(() => getOrientation());

  useEffect(() => {
    const onResize = () => setOrientation(getOrientation());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return orientation;
};
