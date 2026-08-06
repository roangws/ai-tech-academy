import Image from "next/image";
import { BuildingsIcon, UserIcon } from "@phosphor-icons/react/dist/ssr";
import type { Img } from "@/lib/content";

/**
 * Portrait and organization-mark slots for the two rosters.
 *
 * The page shipped a version of this with monogram tiles, two grey letters in a
 * circle, framed identically to Roan's real photograph. Ten of the eleven
 * people had one, so the rosters read as ten broken images. The tiles were
 * pulled and the slots went with them, which solved the broken look by removing
 * the structure the photographs were eventually going to land in.
 *
 * These are the slots, rebuilt on the rule that fixes it: an empty slot is
 * allowed to be empty, and must say so. A dashed rule and a neutral glyph read
 * as a frame waiting for a file. A filled grey circle reads as a file that
 * failed to load. The two look nothing alike at a glance, which is the entire
 * difference between a placeholder and a defect.
 *
 * Both slots take the same shape whether they are full or not, so the roster
 * does not reflow the day the photographs arrive.
 */

/** Portrait. `image` absent renders the marked-empty frame. */
export function AvatarSlot({
  image,
  ring,
  size = 48,
}: {
  image?: Img;
  /** Path hue, drawn as a 2px ring so the card ties to the path it serves. */
  ring?: string;
  size?: number;
}) {
  const box = { width: size, height: size };

  if (image) {
    return (
      <span
        className="block flex-none overflow-hidden rounded-full bg-surface-sunken"
        style={{ ...box, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}
      >
        <Image
          src={image.src}
          alt={image.alt}
          width={size * 2}
          height={size * 2}
          sizes={`${size}px`}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="Portrait pending"
      title="Portrait pending"
      className="flex flex-none items-center justify-center rounded-full border border-dashed border-line-strong bg-surface-subtle"
      style={box}
    >
      <UserIcon
        size={Math.round(size * 0.42)}
        weight="regular"
        aria-hidden="true"
        className="text-line-strong"
      />
    </span>
  );
}

/**
 * Organization mark, 20px tall against white.
 *
 * Empty, it is a dashed frame reading "Logo", which is the honest state: this
 * page will not carry a mark its owner has not cleared, because a logo reads as
 * an endorsement by that organization. public/images/logos/README.txt has the
 * two lines that fill it.
 */
export function LogoSlot({ logo }: { logo?: Img }) {
  if (logo) {
    return (
      <Image
        src={logo.src}
        alt={logo.alt}
        width={160}
        height={40}
        sizes="80px"
        className="h-5 w-auto max-w-[104px] flex-none object-contain object-right"
      />
    );
  }

  return (
    <span
      role="img"
      aria-label="Organization mark pending"
      title="Organization mark pending"
      className="t-micro inline-flex h-6 flex-none items-center gap-1 rounded-[6px] border border-dashed border-line-strong px-2 font-medium text-ink-muted"
    >
      <BuildingsIcon size={12} weight="regular" aria-hidden="true" className="text-line-strong" />
      Logo
    </span>
  );
}
