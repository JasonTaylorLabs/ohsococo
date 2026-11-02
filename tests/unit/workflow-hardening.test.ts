import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// Guards the hardening from Issue #31: no `${{ }}` expression inside a shell script, every
// third-party action pinned to a commit, and no force-push from the publish steps. The workflows
// are read as text, like deploy-layout.test.ts, so this needs no YAML parser. Everything is keyed
// on indentation and on `run:` / `uses:` / `with:` keys, never on line numbers or step names.

const workflowsDir = path.resolve(__dirname, "../../.github/workflows");
const workflowFiles = readdirSync(workflowsDir)
  .filter((name) => name.endsWith(".yml"))
  .sort();
const workflows = workflowFiles.map((name) => ({
  name,
  text: readFileSync(path.join(workflowsDir, name), "utf-8"),
}));

/** The leading spaces of a line. */
function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}

/** The indent of `key:` on this line, counting a leading `- ` as part of the indent. */
function keyIndent(line: string): number {
  const dash = line.match(/^(\s*)-\s+/);
  return dash ? dash[0].length : indentOf(line);
}

/** True for a blank line or one that holds only a comment. */
function isBlankOrComment(line: string): boolean {
  return line.trim() === "" || line.trim().startsWith("#");
}

/**
 * The script of every `run:` in the file, with the line it starts on. For `run: |` and the other
 * block scalars, the script is the lines indented deeper than the `run:` key, so a sibling
 * `env:` or `with:` that follows is not part of it.
 */
function runScripts(text: string): { line: number; script: string }[] {
  const lines = text.split("\n");
  const scripts: { line: number; script: string }[] = [];
  lines.forEach((line, i) => {
    if (isBlankOrComment(line)) return;
    const match = line.match(/^\s*(?:-\s+)?run:\s*(.*)$/);
    if (!match) return;
    const value = match[1].trim();
    if (!/^[|>][+-]?\s*(#.*)?$/.test(value)) {
      scripts.push({ line: i + 1, script: value });
      return;
    }
    const indent = keyIndent(line);
    const body: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const next = lines[j];
      if (next.trim() === "") {
        body.push(next);
        continue;
      }
      if (indentOf(next) <= indent) break;
      body.push(next);
    }
    scripts.push({ line: i + 1, script: body.join("\n") });
  });
  return scripts;
}

/** Lines of `run:` scripts that contain a `${{` expression. */
export function expressionsInRunBlocks(text: string): string[] {
  return runScripts(text)
    .filter(({ script }) => script.includes("${{"))
    .map(({ line, script }) => `run: at line ${line}: ${script.trim().split("\n").find((l) => l.includes("${{"))?.trim()}`);
}

/**
 * Every `uses:` in the file. Comment lines are skipped. The ref is the value without quotes, and
 * `comment` is the trailing `# ...` if there is one.
 */
function usesRefs(text: string): { line: number; ref: string; comment: string }[] {
  const refs: { line: number; ref: string; comment: string }[] = [];
  text.split("\n").forEach((line, i) => {
    if (isBlankOrComment(line)) return;
    const match = line.match(/^\s*(?:-\s+)?uses:\s*["']?([^\s"']+)["']?\s*(#.*)?$/);
    if (!match) return;
    refs.push({ line: i + 1, ref: match[1], comment: (match[2] ?? "").trim() });
  });
  return refs;
}

/**
 * Third-party `uses:` lines that are not pinned as `owner/repo[/path]@<40 hex> # v<version>`.
 * First-party `actions/*` steps are exempt (the Issue keeps them on major tags); `./local` actions
 * have no ref to pin. A docker:// ref is reported, since it needs a digest rather than a SHA.
 */
export function unpinnedThirdPartyUses(text: string): string[] {
  return usesRefs(text)
    .filter(({ ref }) => !ref.startsWith("actions/") && !ref.startsWith("./"))
    .filter(({ ref, comment }) => !(/^[^@]+@[0-9a-f]{40}$/.test(ref) && /^#\s*v\d+(\.\d+)*$/.test(comment)))
    .map(({ line, ref, comment }) => `uses: at line ${line}: ${ref} ${comment}`.trim());
}

/**
 * The text of each step (from its `- ` to the next step at the same indent) whose `uses:` starts
 * with `prefix`.
 */
function stepsUsing(text: string, prefix: string): { line: number; step: string }[] {
  const lines = text.split("\n");
  const steps: { line: number; step: string }[] = [];
  lines.forEach((line, i) => {
    if (isBlankOrComment(line)) return;
    const match = line.match(/^\s*(?:-\s+)?uses:\s*["']?([^\s"']+)/);
    if (!match || !match[1].startsWith(prefix)) return;
    const indent = keyIndent(line);
    let start = i;
    while (start > 0 && !(indentOf(lines[start]) === indent - 2 && /^\s*-\s/.test(lines[start]))) start--;
    let end = i + 1;
    while (end < lines.length && !(indentOf(lines[end]) <= indent - 2 && lines[end].trim() !== "")) end++;
    steps.push({ line: start + 1, step: lines.slice(start, end).join("\n") });
  });
  return steps;
}

const deployActionPrefix = "JamesIves/github-pages-deploy-action@";

/**
 * Steps that call the GitHub Pages deploy action without `force: false` under `with:`. Without it
 * the action force-pushes, which can overwrite a commit another workflow just put on gh-pages.
 */
export function deployStepsWithoutForceFalse(text: string): string[] {
  return stepsUsing(text, deployActionPrefix)
    .filter(({ step }) => {
      const withBlock = step.match(/^(\s*)with:\s*\n((?:\1\s+[^\n]*\n?|\s*\n)+)/m);
      return !withBlock || !/^\s*force:\s*false\s*$/m.test(withBlock[2]);
    })
    .map(({ line, step }) => `step at line ${line}: ${step.trim().split("\n")[0].trim()}`);
}

describe("workflow hardening (Issue #31)", () => {
  it("reads every workflow file", () => {
    expect(workflowFiles).toContain("deploy.yml");
    expect(workflowFiles).toContain("ci.yml");
  });

  for (const { name, text } of workflows) {
    describe(name, () => {
      it("has no ${{ }} expression inside a run: script", () => {
        expect(expressionsInRunBlocks(text)).toEqual([]);
      });

      it("pins every third-party action to a commit SHA with a release comment", () => {
        expect(unpinnedThirdPartyUses(text)).toEqual([]);
      });
    });
  }

  it("deploy.yml publishes with force: false on every GitHub Pages deploy step", () => {
    const deploy = workflows.find((w) => w.name === "deploy.yml")!.text;
    expect(stepsUsing(deploy, deployActionPrefix).length).toBeGreaterThanOrEqual(2);
    expect(deployStepsWithoutForceFalse(deploy)).toEqual([]);
  });
});

describe("the hardening checks fail on the bad patterns", () => {
  it("flags ${{ inside a run: | block, but not in a sibling env:", () => {
    const bad = [
      "      - name: Pick",
      "        run: |",
      '          if [ "${{ github.ref_name }}" = "main" ]; then',
      "            echo ok",
      "          fi",
      "        env:",
      "          REF: ${{ github.ref_name }}",
    ].join("\n");
    expect(expressionsInRunBlocks(bad)).toEqual([
      'run: at line 2: if [ "${{ github.ref_name }}" = "main" ]; then',
    ]);
  });

  it("flags ${{ in an inline run:, but not in an env: or with: that follows it", () => {
    const bad = ["      - run: echo ${{ github.event.number }}", "        env:", "          X: ${{ github.sha }}"].join("\n");
    expect(expressionsInRunBlocks(bad)).toEqual(["run: at line 1: echo ${{ github.event.number }}"]);
    const good = ["      - run: npm run build", "        env:", "          X: ${{ github.sha }}", "      - run: |", "          echo plain", "        with:", "          y: ${{ github.sha }}"].join("\n");
    expect(expressionsInRunBlocks(good)).toEqual([]);
  });

  it("flags a third-party uses: on a tag, on a short SHA, or on a SHA with no release comment", () => {
    const bad = [
      "      - uses: rossjrw/pr-preview-action@v1",
      "      - uses: gitleaks/gitleaks-action@ff98106 # v2.3.9",
      "        uses: JamesIves/github-pages-deploy-action@fa24774553152dd7873cd16ebd8d959b010c5445",
      "      - uses: actions-rs/toolchain@v1",
    ].join("\n");
    expect(unpinnedThirdPartyUses(bad)).toEqual([
      "uses: at line 1: rossjrw/pr-preview-action@v1",
      "uses: at line 2: gitleaks/gitleaks-action@ff98106 # v2.3.9",
      "uses: at line 3: JamesIves/github-pages-deploy-action@fa24774553152dd7873cd16ebd8d959b010c5445",
      "uses: at line 4: actions-rs/toolchain@v1",
    ]);
  });

  it("accepts actions/* on a tag, a local action, a commented-out uses:, and a correct pin", () => {
    const good = [
      "      - uses: actions/checkout@v4",
      "      - uses: ./.github/actions/local",
      "      # uses: rossjrw/pr-preview-action@v1",
      "      - uses: rossjrw/pr-preview-action@873417d2df72380da1f3978378fb58560bcde976 # v1.8.2",
      "      - uses: 'gitleaks/gitleaks-action@ff98106e4c7b2bc287b24eaf42907196329070c7' # v2.3.9",
    ].join("\n");
    expect(unpinnedThirdPartyUses(good)).toEqual([]);
  });

  it("flags a GitHub Pages deploy step whose with: lacks force: false", () => {
    const bad = [
      "      - name: Publish dev",
      "        if: steps.target.outputs.kind == 'dev'",
      "        uses: JamesIves/github-pages-deploy-action@fa24774553152dd7873cd16ebd8d959b010c5445 # v4.9.0",
      "        with:",
      "          branch: gh-pages",
      "          folder: out",
      "          target-folder: dev",
      "",
      "      - name: Publish preview",
      "        uses: rossjrw/pr-preview-action@873417d2df72380da1f3978378fb58560bcde976 # v1.8.2",
      "        with:",
      "          force: false",
    ].join("\n");
    expect(deployStepsWithoutForceFalse(bad)).toEqual(["step at line 1: - name: Publish dev"]);
  });

  it("does not accept force: \"false\" or force: true, and only looks under with:", () => {
    const quoted = ["      - uses: JamesIves/github-pages-deploy-action@fa24774553152dd7873cd16ebd8d959b010c5445 # v4.9.0", "        with:", '          force: "false"'].join("\n");
    expect(deployStepsWithoutForceFalse(quoted)).toHaveLength(1);
    const forced = ["      - uses: JamesIves/github-pages-deploy-action@fa24774553152dd7873cd16ebd8d959b010c5445 # v4.9.0", "        with:", "          force: true"].join("\n");
    expect(deployStepsWithoutForceFalse(forced)).toHaveLength(1);
    const outside = ["      - uses: JamesIves/github-pages-deploy-action@fa24774553152dd7873cd16ebd8d959b010c5445 # v4.9.0", "        env:", "          force: false"].join("\n");
    expect(deployStepsWithoutForceFalse(outside)).toHaveLength(1);
    const good = [
      "      - name: Publish production",
      "        uses: JamesIves/github-pages-deploy-action@fa24774553152dd7873cd16ebd8d959b010c5445 # v4.9.0",
      "        with:",
      "          branch: gh-pages",
      "          clean-exclude: |",
      "            dev",
      "          force: false",
    ].join("\n");
    expect(deployStepsWithoutForceFalse(good)).toEqual([]);
  });
});
