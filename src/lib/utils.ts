import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * The shadcn class helper, added with the liquid-glass button.
 *
 * `clsx` flattens conditionals and arrays; `tailwind-merge` resolves conflicts
 * so a class passed in by a caller beats the component's own default rather
 * than losing a coin toss on stylesheet order. That second half is not
 * cosmetic here: this project already shipped a bug where `hidden` passed
 * through `className` lost to an `inline-flex` baked into a component's base
 * string, and "Sign in" rendered at 390px because of it. `cn` is the general
 * fix for that class of problem.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
