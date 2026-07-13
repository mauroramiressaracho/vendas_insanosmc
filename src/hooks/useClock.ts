import { useEffect, useState } from "react";
import { timeOnly } from "../utils/format";

export const useClock = () => {
  const [clock, setClock] = useState(timeOnly());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(timeOnly()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return clock;
};
