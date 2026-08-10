"use client";

import { useEffect, useState } from "react";
import { startsOn } from "@/lib/content";

/**
 * Today's date, in the reader's timezone, for the enrol button's second line.
 *
 * ------------------------------------------------------ why this is a client
 *
 * The date has to be the reader's, and a server does not know it. Rendered on
 * the server this string is the *server's* local date, which is a day out for
 * anybody far enough east or west, and on a statically prerendered page it is
 * not even that: it is whatever the day was when the HTML was built.
 *
 * So the server value is a starting point and the client is the authority.
 * `initial` is rendered into the HTML, hydration matches it exactly, and the
 * effect below replaces it with the reader's own date on the frame after mount.
 * The page ships `revalidate = 3600` for the same reason from the other end, so
 * the prerendered value the reader sees for that one frame is at most an hour
 * old rather than as old as the last deploy.
 *
 * Computing it in `useState` instead would be the shorter version and it is the
 * wrong one: the initialiser runs during the server render too, so the server
 * would emit its own date and the client would emit a different one into the
 * same slot, which is a hydration mismatch on a string inside the page's primary
 * control.
 *
 * ------------------------------------------------------------ and at midnight
 *
 * A page left open overnight would otherwise keep yesterday's date and be wrong
 * about it all day. One timer to the next local midnight, rescheduled each time
 * it fires, so the button is correct for a tab nobody reloads. `setTimeout`
 * rather than an interval, because the distance to midnight is not a constant
 * and an interval would drift into the wrong side of it.
 */
export function StartDate({ initial }: { initial: string }) {
  const [label, setLabel] = useState(initial);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    function tick() {
      const now = new Date();
      /* No `timeZone`, deliberately: this is the half that is allowed to know the
         reader's own. The server passes `REFERENCE_ZONE` because it cannot know it
         and UTC was the wrong guess — content.ts has that note. */
      setLabel(startsOn(now));

      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      // A one-second cushion, so a timer that fires a hair early does not read
      // the old date and then wait another full day to correct itself.
      timer = setTimeout(tick, midnight.getTime() - now.getTime() + 1000);
    }

    tick();
    return () => clearTimeout(timer);
  }, []);

  return <>{label}</>;
}
