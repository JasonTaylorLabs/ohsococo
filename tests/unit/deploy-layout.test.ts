import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { SUBSITES } from "../../src/lib/paths";

// The subsite 404 redirect (Issue #18) only works while these folder names match the deploy
// workflow. Read the workflow as text and match on keys, never line numbers (Issue #26).
const root = path.resolve(__dirname, "../..");
const deployYml = readFileSync(path.join(root, ".github/workflows/deploy.yml"), "utf-8");

function required(match: RegExpMatchArray | null, what: string): string {
  if (!match) throw new Error(`deploy.yml: ${what} not found`);
  return match[1].trim();
}

/** The `base=` echoed in the branch of the target script whose condition contains `condition`. */
function baseFor(condition: string): string {
  const escaped = condition.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return required(
    deployYml.match(new RegExp(`${escaped}[^\\n]*\\n\\s*echo "base=([^"]*)"`)),
    `base= line for ${condition}`,
  );
}

/** The single-line value of `key:` in the workflow. */
function valueOf(key: string): string {
  return required(deployYml.match(new RegExp(`^\\s*${key}:[ \\t]*(\\S[^\\n]*)$`, "m")), `key "${key}:"`);
}

/** The text of the step whose `if:` targets this kind of build. */
function stepFor(kind: string): string {
  return required(
    deployYml.match(new RegExp(`\\n(\\s*- name:[^\\n]*\\n\\s*if: steps\\.target\\.outputs\\.kind == '${kind}'[\\s\\S]*?)(?=\\n\\s*- (?:name|uses|run):|$)`)),
    `step for kind == '${kind}'`,
  );
}

/** The block-list values under `key: |` in `text`. */
function listOf(text: string, key: string, where: string): string[] {
  const match = text.match(new RegExp(`^(\\s*)${key}:\\s*\\|\\s*\\n((?:\\1\\s+\\S[^\\n]*\\n?)+)`, "m"));
  return required(match ? [match[0], match[2]] : null, `key "${key}: |" in ${where}`)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

describe("deploy.yml subsite layout matches SUBSITES in src/lib/paths.ts", () => {
  const prodBase = baseFor(`"$REF_NAME" = "main"`);

  it("dev builds at <prod base>/<SUBSITES.dev>", () => {
    expect(baseFor(`"$REF_NAME" = "dev"`)).toBe(`${prodBase}/${SUBSITES.dev}`);
  });

  it("PR previews build at <prod base>/<umbrella>/<prefix><PR number>", () => {
    expect(baseFor(`"$EVENT_NAME" = "pull_request"`)).toBe(
      `${prodBase}/${SUBSITES.previewUmbrella}/${SUBSITES.previewPrefix}$PR_NUMBER`,
    );
  });

  it("dev publishes into the SUBSITES.dev folder", () => {
    expect(valueOf("target-folder")).toBe(SUBSITES.dev);
  });

  it("previews publish under the SUBSITES.previewUmbrella folder", () => {
    expect(valueOf("umbrella-dir")).toBe(SUBSITES.previewUmbrella);
  });

  it("a production deploy keeps the dev and preview folders", () => {
    const excluded = listOf(stepFor("production"), "clean-exclude", "the production step");
    expect(excluded).toContain(SUBSITES.dev);
    expect(excluded).toContain(SUBSITES.previewUmbrella);
  });
});
