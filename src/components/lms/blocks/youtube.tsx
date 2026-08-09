"use client";

import { useRef, useState } from "react";
import { PlayIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * A YouTube lesson, as a facade.
 *
 * ------------------------------------------------------------- why not an iframe
 *
 * An `<iframe>` on the page at rest costs roughly half a megabyte of Google's
 * player, several requests to three hosts, and a cookie-bearing connection to
 * YouTube before the reader has decided to watch anything. On a course where
 * most lessons are video, that is the entire page weight of the product spent on
 * players nobody has pressed.
 *
 * So at rest this is a button and an image. The iframe is created on the click
 * that means "play", pointed at `youtube-nocookie.com`, with `autoplay=1` so the
 * press that swapped it in is also the press that starts it.
 *
 * ------------------------------------------------------- the poster is ours
 *
 * `poster` is served from our own bucket, not from `i.ytimg.com`. Pulling the
 * thumbnail from Google's CDN would make a request to Google on every lesson
 * page load, which is the exact thing `youtube-nocookie` is chosen to avoid —
 * the privacy win would be undone by the picture advertising it. A lesson with
 * no poster gets a plain ground rather than a Google request.
 *
 * ------------------------------------------------------------ the focus dance
 *
 * The trigger unmounts the instant state flips, and the browser's answer to
 * "the focused element no longer exists" is to move focus to `<body>`. A
 * keyboard reader would press Enter on Play and land at the top of the document
 * with the video playing somewhere below them. So focus is moved into the frame
 * on the next frame, once it exists. This is lifted from
 * src/components/video-player.tsx, which found it first and explains it at
 * length; it is the most valuable twenty lines in that file.
 *
 * ------------------------------------------------------------------ no API
 *
 * No `window.YT`, no IFrame Player API, no third-party script. That means no
 * watch-progress events, which is deliberate: "watched" is unfalsifiable
 * anyway (seek to the end and you are at 100%), and completion here is a fact a
 * learner asserts by pressing a button, not one inferred from a player.
 */
export function YouTubeBlock({
  id,
  title,
  poster,
}: {
  id: string;
  title: string;
  poster: string | null;
}) {
  const [playing, setPlaying] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  /* Warm the connection on intent rather than on load, so the handshake is done
     by the time the click lands but nothing is contacted for a reader who never
     plays. */
  const warm = () => {
    if (document.head.querySelector('link[data-yt-warm="1"]')) return;
    for (const href of ["https://www.youtube-nocookie.com", "https://i.ytimg.com"]) {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = href;
      link.dataset.ytWarm = "1";
      document.head.append(link);
    }
  };

  if (playing) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-feature)] border border-line bg-black">
        <iframe
          ref={frame}
          title={title}
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          tabIndex={-1}
          className="aspect-video w-full border-0"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onPointerEnter={warm}
      onFocus={warm}
      onClick={() => {
        setPlaying(true);
        requestAnimationFrame(() => frame.current?.focus());
      }}
      className="group relative block aspect-video w-full overflow-hidden rounded-[var(--radius-feature)] border border-line bg-surface-sunken"
    >
      {poster ? (
        /* Plain <img>: the object lives on a per-project Supabase host, and
           next/image would need that host in `images.remotePatterns` for a
           picture that is already exactly the size it renders at. Same reasoning
           as components/lms/avatar.tsx. */
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt=""
          className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
      ) : null}

      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
      />

      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-16 place-items-center rounded-full bg-accent text-on-accent shadow-e2 transition-transform duration-200 group-hover:scale-105">
          <PlayIcon size={26} weight="fill" aria-hidden="true" />
        </span>
      </span>

      <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 p-4 text-left">
        <span className="t-card-title text-white drop-shadow">{title}</span>
      </span>

      <span className="sr-only">Play: {title}</span>
    </button>
  );
}
