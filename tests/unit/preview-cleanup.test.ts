import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

// preview-cleanup.yml removes closed PRs' previews from gh-pages and then rewrites each PR's
// "View preview" comment (Issue #30). The step's script is run here with bash against a local bare
// gh-pages repo and a fake `gh` on PATH, so the removal, retry and comment logic are exercised as
// they run in CI, without the network. Needs bash, git and jq on PATH (all on ubuntu-latest).
const root = path.resolve(__dirname, "../..");
const cleanupYml = readFileSync(path.join(root, ".github/workflows/preview-cleanup.yml"), "utf-8");
const deployYml = readFileSync(path.join(root, ".github/workflows/deploy.yml"), "utf-8");
const MARKER = "<!-- Sticky Pull Request Commentpr-preview -->";
const REMOVED_SENTENCE = "Preview removed because the pull request was closed.";

/** The `run: |` block of the cleanup step, de-indented. */
function runScript(): string {
  const lines = cleanupYml.split("\n");
  const start = lines.findIndex((line) => /^\s*run:\s*\|\s*$/.test(line));
  if (start < 0) throw new Error("preview-cleanup.yml: `run: |` not found");
  const first = lines.slice(start + 1).find((line) => line.trim() !== "");
  const indent = first ? first.length - first.trimStart().length : 0;
  const body: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "") {
      body.push("");
      continue;
    }
    if (line.length - line.trimStart().length < indent) break;
    body.push(line.slice(indent));
  }
  return body.join("\n");
}

/** The value of `key:` under the top-level `permissions:` block. */
function permission(key: string): string {
  const block = cleanupYml.match(/^permissions:\n((?:[ \t]+\S[^\n]*\n)+)/m);
  if (!block) throw new Error("preview-cleanup.yml: permissions block not found");
  const line = block[1].match(new RegExp(`^\\s*${key}:\\s*(\\S+)\\s*$`, "m"));
  if (!line) throw new Error(`preview-cleanup.yml: permissions.${key} not found`);
  return line[1];
}

const FAKE_GH = `#!/usr/bin/env bash
# Fake gh for the preview-cleanup test. State lives in $FAKE_GH_DIR:
#   open.json          the open PR list (or open.<call>.json for the <call>th "pr list", 1-based)
#   fail-list          present: "pr list" fails
#   comments-<n>.json  the issue comments on PR <n> (missing: an empty list)
#   fail-<n>           present: listing PR <n>'s comments fails
#   fail-edit-<id>     present: editing comment <id> fails
#   patched-<id>.txt   written with the body of each successful edit
#   calls.log          one line per invocation
set -eu
# Logged before it is counted: grep -c exits 1 on zero matches, which set -e would turn into a silent death.
printf '%s\\n' "$*" >> "$FAKE_GH_DIR/calls.log"
if [ "$1" = pr ] && [ "$2" = list ]; then
  [ -f "$FAKE_GH_DIR/fail-list" ] && { echo "fake gh: listing open PRs failed" >&2; exit 1; }
  count=$(grep -c '^pr list' "$FAKE_GH_DIR/calls.log")
  if [ -f "$FAKE_GH_DIR/open.$count.json" ]; then cat "$FAKE_GH_DIR/open.$count.json"; else cat "$FAKE_GH_DIR/open.json"; fi
  exit 0
fi
# gh api --paginate repos/<repo>/issues/<n>/comments --jq <filter>
if [ "$1" = api ] && [ "$2" = --paginate ]; then
  n="\${3##*/issues/}"; n="\${n%%/*}"
  [ -f "$FAKE_GH_DIR/fail-$n" ] && { echo "fake gh: listing comments on PR $n failed" >&2; exit 1; }
  file="$FAKE_GH_DIR/comments-$n.json"
  [ -f "$file" ] || file=/dev/null
  if [ -s "$file" ]; then jq -r "$5" "$file"; fi
  exit 0
fi
# gh api -X PATCH repos/<repo>/issues/comments/<id> --silent -f body=<body>
if [ "$1" = api ] && [ "$2" = -X ] && [ "$3" = PATCH ]; then
  id="\${4##*/}"
  [ -f "$FAKE_GH_DIR/fail-edit-$id" ] && { echo "fake gh: editing comment $id failed" >&2; exit 1; }
  printf '%s' "\${7#body=}" > "$FAKE_GH_DIR/patched-$id.txt"
  exit 0
fi
echo "fake gh: unexpected call: $*" >&2
exit 1
`;

/** Rejects the first push with a counter, and optionally moves gh-pages to $MOVE_TO while rejecting. */
const PRE_RECEIVE = `#!/usr/bin/env bash
set -eu
count_file="$FAKE_GH_DIR/pushes"
count=$(( $(cat "$count_file" 2>/dev/null || echo 0) + 1 ))
echo "$count" > "$count_file"
if [ "$count" -le "\${REJECT_PUSHES:-0}" ]; then
  if [ -f "$FAKE_GH_DIR/move-to" ]; then
    # Hooks may not move refs inside git's push quarantine; the test's commit is already outside it.
    env -u GIT_QUARANTINE_PATH git update-ref refs/heads/gh-pages "$(cat "$FAKE_GH_DIR/move-to")"
  fi
  echo "fake remote: rejecting push $count" >&2
  exit 1
fi
exit 0
`;

const gitEnv = {
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.com",
  GIT_CONFIG_GLOBAL: "/dev/null",
  GIT_CONFIG_NOSYSTEM: "1",
};

function git(cwd: string, ...args: string[]): string {
  // FAKE_GH_DIR: the bare repo's pre-receive hook counts pushes there.
  return execFileSync("git", args, { cwd, env: { ...process.env, ...gitEnv, FAKE_GH_DIR: fake }, encoding: "utf-8" }).trim();
}

/** The comment rossjrw/pr-preview-action leaves on PR `pr`, with comment ID `id`. */
function viewComment(pr: number, id: number) {
  return { id, user: { login: "github-actions[bot]" }, body: `:rocket: View preview at <br> https://x.github.io/ohsococo/pr-preview/pr-${pr}/ <br>\n${MARKER}` };
}

let tmp: string;
let bare: string;
let clone: string;
let fake: string;
let binDir: string;

/** gh-pages with index.html, dev/index.html and pr-preview/pr-<n>/index.html for each n. */
function seedRemote(prs: number[]) {
  const seed = path.join(tmp, "seed");
  mkdirSync(path.join(seed, "dev"), { recursive: true });
  writeFileSync(path.join(seed, "index.html"), "prod");
  writeFileSync(path.join(seed, "dev/index.html"), "dev");
  for (const n of prs) {
    mkdirSync(path.join(seed, `pr-preview/pr-${n}`), { recursive: true });
    writeFileSync(path.join(seed, `pr-preview/pr-${n}/index.html`), `preview ${n}`);
  }
  git(seed, "init", "-q", "-b", "gh-pages");
  git(seed, "add", "-A");
  git(seed, "commit", "-q", "-m", "seed");
  git(seed, "push", "-q", bare, "gh-pages");
  git(tmp, "clone", "-q", "-b", "gh-pages", bare, clone);
}

/** A commit on top of the remote's gh-pages built by `edit` in a working copy, for the hook to move to. */
function remoteCommit(edit: (work: string) => void): string {
  const work = path.join(tmp, "mover");
  git(tmp, "clone", "-q", "-b", "gh-pages", bare, work);
  edit(work);
  git(work, "add", "-A");
  git(work, "commit", "-q", "-m", "mover");
  const sha = git(work, "rev-parse", "HEAD");
  // Make the object reachable in the bare repo without moving the branch yet.
  git(work, "push", "-q", bare, "HEAD:refs/heads/mover");
  rmSync(work, { recursive: true, force: true });
  return sha;
}

/** A commit on top of the remote's gh-pages that writes `content` to `file`. */
function remoteCommitTouching(file: string, content: string): string {
  return remoteCommit((work) => {
    mkdirSync(path.dirname(path.join(work, file)), { recursive: true });
    writeFileSync(path.join(work, file), content);
  });
}

function run(env: Record<string, string>) {
  rmSync(path.join(fake, "pushes"), { force: true }); // the seed pushes went through the hook too
  const result = spawnSync("bash", ["-c", runScript()], {
    cwd: clone,
    encoding: "utf-8",
    env: {
      ...process.env,
      ...gitEnv,
      PATH: `${binDir}:${process.env.PATH}`,
      GH_TOKEN: "fake",
      GH_REPO: "owner/repo",
      GITHUB_SERVER_URL: "https://github.com",
      GITHUB_RUN_ID: "4242",
      FAKE_GH_DIR: fake,
      CLOSED_PR: "",
      ...env,
    },
  });
  return { status: result.status, out: result.stdout + result.stderr };
}

function remoteDirs(): string[] {
  const out = git(bare, "ls-tree", "-d", "--name-only", "gh-pages", "--", "pr-preview/");
  return out ? out.split("\n") : [];
}

function patched(): Record<string, string> {
  const result: Record<string, string> = {};
  for (const file of readdirSync(fake)) {
    const m = file.match(/^patched-(\d+)\.txt$/);
    if (m) result[m[1]] = readFileSync(path.join(fake, file), "utf-8");
  }
  return result;
}

function expectRemovedBody(body: string) {
  expect(body).toContain(REMOVED_SENTENCE);
  expect(body).not.toContain("pr-preview/pr-");
  expect(body).not.toContain("View preview");
  expect(body.trimEnd().endsWith(MARKER)).toBe(true);
}

beforeAll(() => {
  // The script and the fake gh both run jq; without it every script test fails with a buried
  // "jq: command not found", so say so up front.
  if (spawnSync("jq", ["--version"]).status !== 0) {
    throw new Error("jq is required on PATH to run tests/unit/preview-cleanup.test.ts");
  }
});

beforeEach(() => {
  tmp = mkdtempSync(path.join(tmpdir(), "preview-cleanup-"));
  bare = path.join(tmp, "origin.git");
  clone = path.join(tmp, "clone");
  fake = path.join(tmp, "fake-gh");
  binDir = path.join(tmp, "bin");
  mkdirSync(fake);
  mkdirSync(binDir);
  writeFileSync(path.join(binDir, "gh"), FAKE_GH);
  chmodSync(path.join(binDir, "gh"), 0o755);
  git(tmp, "init", "-q", "--bare", "-b", "gh-pages", bare);
  mkdirSync(path.join(bare, "hooks"), { recursive: true });
  writeFileSync(path.join(bare, "hooks/pre-receive"), PRE_RECEIVE);
  chmodSync(path.join(bare, "hooks/pre-receive"), 0o755);
  writeFileSync(path.join(fake, "open.json"), "[]");
  writeFileSync(path.join(fake, "calls.log"), "");
});

afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe("preview-cleanup.yml", () => {
  it("may edit PR comments and still push to gh-pages", () => {
    expect(permission("pull-requests")).toBe("write");
    expect(permission("contents")).toBe("write");
  });

  it("passes the closing PR's number through env, and uses no expressions inside run:", () => {
    expect(cleanupYml).toMatch(/^\s*CLOSED_PR: \$\{\{ github\.event\.pull_request\.number \}\}$/m);
    expect(runScript()).not.toContain("${{");
  });

  it("is valid bash", () => {
    const result = spawnSync("bash", ["-n"], { input: runScript(), encoding: "utf-8" });
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
  });
});

describe("deploy.yml", () => {
  it("names the preview step for what it does now that cleanup lives elsewhere", () => {
    expect(deployYml).toContain("- name: Publish PR preview\n");
    expect(deployYml).not.toContain("Publish or remove PR preview");
  });
});

// Each script test spawns dozens of git, bash and jq processes; the slowest takes ~2 s on a quiet
// Mac, so give them room when a build or e2e run shares the machine.
describe("the cleanup script", { timeout: 20_000 }, () => {
  it("removes closed previews, keeps open ones, and marks only the removed PRs' comments", () => {
    seedRemote([1, 2, 3]);
    writeFileSync(path.join(fake, "open.json"), JSON.stringify([{ number: 1 }]));
    for (const n of [1, 2, 3]) {
      writeFileSync(path.join(fake, `comments-${n}.json`), JSON.stringify([
        { id: n * 10, user: { login: "someone" }, body: "a human comment" },
        viewComment(n, n * 100),
      ]));
    }
    const { status, out } = run({});
    expect(status).toBe(0);
    expect(out).toContain("keep   pr-preview/pr-1 (PR #1 is open)");
    expect(out).toContain("remove pr-preview/pr-2");
    expect(out).toContain("remove pr-preview/pr-3");
    expect(out).toContain("Stale previews removed.");
    expect(remoteDirs()).toEqual(["pr-preview/pr-1"]);
    const edits = patched();
    expect(Object.keys(edits).sort()).toEqual(["200", "300"]);
    expectRemovedBody(edits["200"]);
    expectRemovedBody(edits["300"]);
    expect(edits["200"]).toContain("https://github.com/owner/repo/actions/runs/4242");
    expect(out).toContain("Marked the preview on PR #2 as removed (comment 200).");
    expect(out).not.toContain("::warning::");
  });

  it("matches PR numbers whole, so an open PR 12 does not keep PR 1's preview or its comment", () => {
    seedRemote([1, 12]);
    writeFileSync(path.join(fake, "open.json"), JSON.stringify([{ number: 12 }]));
    writeFileSync(path.join(fake, "comments-1.json"), JSON.stringify([viewComment(1, 100)]));
    writeFileSync(path.join(fake, "comments-12.json"), JSON.stringify([viewComment(12, 1200)]));
    const { status, out } = run({ CLOSED_PR: "1" });
    expect(status).toBe(0);
    expect(out).toContain("remove pr-preview/pr-1");
    expect(out).toContain("keep   pr-preview/pr-12 (PR #12 is open)");
    expect(out).not.toContain("PR #1 is open again");
    expect(remoteDirs()).toEqual(["pr-preview/pr-12"]);
    expect(Object.keys(patched())).toEqual(["100"]);
  });

  it("stops before removing anything when the open PR list cannot be fetched", () => {
    // The open list is the only thing between a failed API call and deleting every live preview.
    seedRemote([1, 2]);
    writeFileSync(path.join(fake, "fail-list"), "");
    writeFileSync(path.join(fake, "comments-2.json"), JSON.stringify([viewComment(2, 200)]));
    const { status, out } = run({ CLOSED_PR: "2" });
    expect(status).not.toBe(0);
    expect(out).not.toContain("remove pr-preview");
    expect(remoteDirs()).toEqual(["pr-preview/pr-1", "pr-preview/pr-2"]);
    expect(patched()).toEqual({});
  });

  it("stops before removing anything when the open PR list is not a JSON array", () => {
    // An object whose values still answer `.[].number`, so only the array check can catch it.
    seedRemote([1, 2]);
    writeFileSync(path.join(fake, "open.json"), JSON.stringify({ first: { number: 1 } }));
    writeFileSync(path.join(fake, "comments-2.json"), JSON.stringify([viewComment(2, 200)]));
    const { status, out } = run({ CLOSED_PR: "2" });
    expect(status).not.toBe(0);
    expect(out).not.toContain("remove pr-preview");
    expect(remoteDirs()).toEqual(["pr-preview/pr-1", "pr-preview/pr-2"]);
    expect(patched()).toEqual({});
  });

  it("marks the closing PR's comment on the no-stale path, and exits 0", () => {
    seedRemote([1]);
    writeFileSync(path.join(fake, "open.json"), JSON.stringify([{ number: 1 }]));
    writeFileSync(path.join(fake, "comments-7.json"), JSON.stringify([viewComment(7, 700)]));
    const { status, out } = run({ CLOSED_PR: "7" });
    expect(status).toBe(0);
    expect(out).toContain("No stale previews. Nothing to commit.");
    expect(Object.keys(patched())).toEqual(["700"]);
    expectRemovedBody(patched()["700"]);
    expect(remoteDirs()).toEqual(["pr-preview/pr-1"]);
  });

  it("leaves the closing PR's comment alone when the PR is open again by the time the run starts", () => {
    // Closed, then reopened and redeployed while this run waited in the concurrency queue.
    seedRemote([7]);
    writeFileSync(path.join(fake, "open.json"), JSON.stringify([{ number: 7 }]));
    writeFileSync(path.join(fake, "comments-7.json"), JSON.stringify([viewComment(7, 700)]));
    const { status, out } = run({ CLOSED_PR: "7" });
    expect(status).toBe(0);
    expect(out).toContain("PR #7 is open again. Leaving its preview comment alone.");
    expect(patched()).toEqual({});
    expect(remoteDirs()).toEqual(["pr-preview/pr-7"]);
  });

  it("treats a zero-padded directory as the PR it names", () => {
    // pr-preview/pr-039 is junk (not a valid preview path), so it is removed; but 039 must not be
    // taken for a PR other than 39, whose preview is live and whose comment must stay.
    seedRemote([1]);
    mkdirSync(path.join(clone, "pr-preview/pr-039"), { recursive: true });
    writeFileSync(path.join(clone, "pr-preview/pr-039/index.html"), "junk");
    mkdirSync(path.join(clone, "pr-preview/pr-39"), { recursive: true });
    writeFileSync(path.join(clone, "pr-preview/pr-39/index.html"), "preview 39");
    git(clone, "add", "-A");
    git(clone, "commit", "-q", "-m", "junk and 39");
    git(clone, "push", "-q", "origin", "HEAD:gh-pages");
    writeFileSync(path.join(fake, "open.json"), JSON.stringify([{ number: 1 }, { number: 39 }]));
    writeFileSync(path.join(fake, "comments-39.json"), JSON.stringify([viewComment(39, 3900)]));
    const { status, out } = run({});
    expect(status).toBe(0);
    expect(out).toContain("remove pr-preview/pr-039");
    expect(out).toContain("PR #39 is open again. Leaving its preview comment alone.");
    expect(remoteDirs()).toEqual(["pr-preview/pr-1", "pr-preview/pr-39"]);
    expect(patched()).toEqual({});
    expect(readFileSync(path.join(fake, "calls.log"), "utf-8")).not.toContain("issues/039/");
  });

  it("warns instead of calling the API when the lookup returns something that is not a comment ID", () => {
    seedRemote([2]);
    writeFileSync(path.join(fake, "comments-2.json"), JSON.stringify([{ ...viewComment(2, 200), id: "200; rm" }]));
    const { status, out } = run({});
    expect(status).toBe(0);
    expect(remoteDirs()).toEqual([]);
    expect(out).toMatch(/^::warning::.*PR #2.*not a comment ID/m);
    expect(patched()).toEqual({});
    expect(readFileSync(path.join(fake, "calls.log"), "utf-8")).not.toContain("PATCH");
  });

  it("marks the closing PR once when its own directory is removed in the same run", () => {
    seedRemote([2]);
    writeFileSync(path.join(fake, "comments-2.json"), JSON.stringify([viewComment(2, 200)]));
    const { status, out } = run({ CLOSED_PR: "2" });
    expect(status).toBe(0);
    expect(remoteDirs()).toEqual([]);
    expect(Object.keys(patched())).toEqual(["200"]);
    expect(out.match(/Marked the preview on PR #2/g)).toHaveLength(1);
  });

  it("skips a PR with no preview comment and never creates one", () => {
    seedRemote([2]);
    writeFileSync(path.join(fake, "comments-2.json"), JSON.stringify([
      { id: 20, user: { login: "someone" }, body: `a human comment quoting ${MARKER}` },
      { id: 21, user: { login: "github-actions[bot]" }, body: "a bot comment without the marker" },
    ]));
    const { status, out } = run({});
    expect(status).toBe(0);
    expect(remoteDirs()).toEqual([]);
    expect(out).toContain("PR #2 has no preview comment to update.");
    expect(patched()).toEqual({});
    expect(readFileSync(path.join(fake, "calls.log"), "utf-8")).not.toContain("PATCH");
    expect(readFileSync(path.join(fake, "calls.log"), "utf-8")).not.toContain("POST");
  });

  it("warns and carries on when a lookup or an edit fails, and still exits 0", () => {
    seedRemote([2, 3, 4]);
    writeFileSync(path.join(fake, "fail-2"), "");
    writeFileSync(path.join(fake, "comments-3.json"), JSON.stringify([viewComment(3, 300)]));
    writeFileSync(path.join(fake, "fail-edit-300"), "");
    writeFileSync(path.join(fake, "comments-4.json"), JSON.stringify([viewComment(4, 400)]));
    const { status, out } = run({});
    expect(status).toBe(0);
    expect(remoteDirs()).toEqual([]);
    expect(out).toMatch(/^::warning::.*PR #2/m);
    expect(out).toMatch(/^::warning::.*PR #3/m);
    expect(Object.keys(patched())).toEqual(["400"]);
  });

  it("does not edit any comment while the push is still failing", () => {
    seedRemote([2]);
    writeFileSync(path.join(fake, "comments-2.json"), JSON.stringify([viewComment(2, 200)]));
    const { status, out } = run({ REJECT_PUSHES: "99" });
    expect(status).toBe(1);
    expect(out).toContain("Could not push after 5 attempts.");
    expect(patched()).toEqual({});
    expect(remoteDirs()).toEqual(["pr-preview/pr-2"]);
  });

  it("after a clean rebase, marks the PRs of every commit that was pushed", () => {
    seedRemote([1, 2, 3]);
    // First pass: only PR 2 is closed. The push is rejected because dev/ moved; the rebase succeeds.
    // Second pass: PR 3 has closed too, so a second commit removes it. Both are pushed together.
    writeFileSync(path.join(fake, "open.1.json"), JSON.stringify([{ number: 1 }, { number: 3 }]));
    writeFileSync(path.join(fake, "open.json"), JSON.stringify([{ number: 1 }]));
    writeFileSync(path.join(fake, "move-to"), remoteCommitTouching("dev/index.html", "dev v2"));
    for (const n of [2, 3]) writeFileSync(path.join(fake, `comments-${n}.json`), JSON.stringify([viewComment(n, n * 100)]));
    const { status, out } = run({ REJECT_PUSHES: "1" });
    expect(status).toBe(0);
    expect(out).toContain("Rebasing and retrying (attempt 1 of 5)");
    expect(out).not.toContain("Rebase conflicted");
    expect(remoteDirs()).toEqual(["pr-preview/pr-1"]);
    expect(readFileSync(path.join(clone, "dev/index.html"), "utf-8")).toBe("dev v2");
    expect(Object.keys(patched()).sort()).toEqual(["200", "300"]);
  });

  it("after a conflicting rebase, rebuilds the list from the commit that was actually pushed", () => {
    seedRemote([1, 2, 3]);
    // First pass: PRs 2 and 3 are closed and removed. The push is rejected because gh-pages
    // redeployed pr-3 (it was reopened), so the rebase conflicts and the removal starts over.
    // Second pass: PR 3 is open again, so only pr-2 is removed. PR 3's comment must stay as it is.
    writeFileSync(path.join(fake, "open.1.json"), JSON.stringify([{ number: 1 }]));
    writeFileSync(path.join(fake, "open.json"), JSON.stringify([{ number: 1 }, { number: 3 }]));
    writeFileSync(path.join(fake, "move-to"), remoteCommitTouching("pr-preview/pr-3/index.html", "preview 3 v2"));
    for (const n of [2, 3]) writeFileSync(path.join(fake, `comments-${n}.json`), JSON.stringify([viewComment(n, n * 100)]));
    const { status, out } = run({ REJECT_PUSHES: "1" });
    expect(status).toBe(0);
    expect(out).toContain("Rebase conflicted");
    expect(out).toContain("keep   pr-preview/pr-3 (PR #3 is open)");
    expect(remoteDirs()).toEqual(["pr-preview/pr-1", "pr-preview/pr-3"]);
    expect(Object.keys(patched())).toEqual(["200"]);
  });

  it("after a conflicting rebase, forgets the PRs of the commit that was thrown away", () => {
    seedRemote([1, 2, 3]);
    // First pass: PRs 2 and 3 are closed and removed. Meanwhile gh-pages redeployed pr-3 (reopened)
    // and another run removed pr-2. The rebase conflicts on pr-3; the second pass finds nothing to
    // remove, so no comment may be edited: this run removed nothing, and PR 3 is open.
    writeFileSync(path.join(fake, "open.1.json"), JSON.stringify([{ number: 1 }]));
    writeFileSync(path.join(fake, "open.json"), JSON.stringify([{ number: 1 }, { number: 3 }]));
    writeFileSync(path.join(fake, "move-to"), remoteCommit((work) => {
      writeFileSync(path.join(work, "pr-preview/pr-3/index.html"), "preview 3 v2");
      rmSync(path.join(work, "pr-preview/pr-2"), { recursive: true });
    }));
    for (const n of [2, 3]) writeFileSync(path.join(fake, `comments-${n}.json`), JSON.stringify([viewComment(n, n * 100)]));
    const { status, out } = run({ REJECT_PUSHES: "1" });
    expect(status).toBe(0);
    expect(out).toContain("Rebase conflicted");
    expect(out).toContain("No stale previews. Nothing to commit.");
    expect(remoteDirs()).toEqual(["pr-preview/pr-1", "pr-preview/pr-3"]);
    expect(patched()).toEqual({});
  });

  it("edits only the first preview comment when a PR has more than one", () => {
    seedRemote([2]);
    writeFileSync(path.join(fake, "comments-2.json"), JSON.stringify([viewComment(2, 200), viewComment(2, 201)]));
    const { status } = run({});
    expect(status).toBe(0);
    expect(Object.keys(patched())).toEqual(["200"]);
    expect(readFileSync(path.join(fake, "calls.log"), "utf-8").match(/PATCH/g)).toHaveLength(1);
  });
});
