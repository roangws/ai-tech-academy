import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendored design-canvas mockups. Reference material, not app source.
    "mockups/**",
    /*
      Agent worktrees: a whole second checkout of this repo, on disk, inside it.

      Without this the linter walks it and reports the same file twice — 413
      problems from one worktree, against 1 from `src` — and a gate that noisy is
      a gate nobody reads. Worse, the copy is a different branch, so it fails on
      code that is not in this working tree and cannot be fixed from it.
    */
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
