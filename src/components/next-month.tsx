"use client";

import { useEffect, useState } from "react";
import { nextMonthName } from "@/lib/content";

/** Keeps waitlist month labels correct in the reader's local timezone. */
export function NextMonth({ initial }: { initial: string }) {
  const [label, setLabel] = useState(initial);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const now = new Date();
      setLabel(nextMonthName(now));

      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      timer = setTimeout(tick, midnight.getTime() - now.getTime() + 1000);
    }

    tick();
    return () => clearTimeout(timer);
  }, []);

  return <>{label}</>;
}
