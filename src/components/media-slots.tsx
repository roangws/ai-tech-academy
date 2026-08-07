import Image from "next/image";
import { UserIcon } from "@phosphor-icons/react/dist/ssr";
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
 * Organization mark, 20px tall against white. Renders nothing when empty.
 *
 * The empty state used to be a dashed frame reading "Logo", on the same
 * reasoning as the portrait frame above: mark the slot, do not fake it. That
 * reasoning holds for a portrait and does not hold here, and the difference is
 * how many there are. One dashed frame is a slot. Ten of them, which is what
 * the two rosters had, is a page that looks like it failed to finish loading,
 * and they were the last thing on it still reading that way once the portraits
 * arrived.
 *
 * A portrait frame also has a job when it is empty, because it holds the card's
 * layout: drop it and the roster reflows the day the photographs land. A mark
 * sits at the end of a flex row and takes its own width, so an absent one costs
 * the card nothing.
 *
 * The footnote under each roster still says marks appear as employers clear
 * them, so the state is stated once in words instead of ten times in dashes.
 * public/images/logos/README.txt has the two lines that fill one.
 */
export function LogoSlot({ logo }: { logo?: Img }) {
  if (!logo) return null;

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
