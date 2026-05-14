// omg-origin: kit=oh-my-game-kit-core | repo=The1Studio/oh-my-game-kit-core | module=omg-maintainer | protected=true
'use strict';
/**
 * comment-ingestion.test.cjs — Phase 05 / Issue #39 guard.
 *
 * Purpose: prove that omg-triage's SKILL.md and companion fixture encode the
 * comment-aware classifier contract required by Issue #39 and the #37 meta-bug.
 *
 * Strategy: static analysis + pure-function simulation. The real classifier
 * runs inside Codex at triage time (no standalone binary), so these tests:
 *   1. Assert SKILL.md documents Step 1c, cap-20, batch-of-5, throttle,
 *      privacy, per-item failure isolation, and Step 2c signals.
 *   2. Assert the fixture mirrors the #37 shape (title="Problem A",
 *      body="problem A", OWNER comment mentions root cause "B").
 *   3. Simulate the deterministic helpers (author-authority ranking,
 *      cap-at-20 slicing, status-marker regex, per-item failure isolation)
 *      and assert expected outputs on the fixture.
 *
 * NO live gh calls. NO network. Pure node.
 *
 * Run: node .agents/skillsomg-triage/tests/comment-ingestion.test.cjs
 */

const fs = require('fs');
const path = require('path');

// ── Harness ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures = [];

function run(name, fn) {
  try {
    fn();
    passed++;
    process.stdout.write(`  PASS  ${name}\n`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    process.stdout.write(`  FAIL  ${name}\n       ${err.message}\n`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// ── Load artifacts ──────────────────────────────────────────────────────────

const SKILL_MD = path.resolve(__dirname, '../SKILL.md');
const PROMPT_MD = path.resolve(__dirname, '../references/comment-classifier-prompt.md');
const FIXTURE = path.resolve(__dirname, 'comment-fixture.json');

const skill = fs.readFileSync(SKILL_MD, 'utf8');
const prompt = fs.readFileSync(PROMPT_MD, 'utf8');
const fixture = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));

// ── Deterministic helpers (mirror the classifier's non-LLM bits) ────────────

const AUTHOR_RANK = {
  OWNER: 4,
  MEMBER: 3,
  COLLABORATOR: 2,
  CONTRIBUTOR: 1,
  NONE: 0,
};

function authorWeight(assoc) {
  return AUTHOR_RANK[assoc] ?? 0;
}

const STATUS_MARKER = /(fixed in|see #|blocked on|resolved by|root cause|wontfix)\s*#?\d*/i;

function capComments(comments, cap = 20) {
  return (comments ?? []).slice(-cap);
}

function sumThumbsUp(comment) {
  const groups = comment.reactionGroups ?? [];
  return groups
    .filter((g) => g.content === 'THUMBS_UP')
    .reduce((sum, g) => sum + (g.users?.totalCount ?? 0), 0);
}

// Simulated classifier pipeline — deterministic portion only
function classify(item) {
  const comments = capComments(item.comments);
  // pick highest-authority comment that trips a status marker
  const authoritative = comments
    .slice()
    .sort((a, b) => authorWeight(b.authorAssociation) - authorWeight(a.authorAssociation))
    .find((c) => STATUS_MARKER.test(c.body ?? ''));

  let rootCause = null;
  if (authoritative) {
    const m = authoritative.body.match(/root cause[^\.]*/i);
    if (m) rootCause = m[0];
  }

  const thumbsUpCount = comments.reduce((sum, c) => sum + sumThumbsUp(c), 0);
  return {
    number: item.number,
    rootCause,
    thumbsUpCount,
    commentCountAfterCap: comments.length,
  };
}

// Mock gh with per-item failure for isolation test
async function mockGh(numbers, failOn) {
  const results = [];
  for (const n of numbers) {
    if (n === failOn) {
      // Per SKILL.md: log + skip comments for that item, continue triage.
      results.push({ number: n, ok: false });
    } else {
      results.push({ number: n, ok: true });
    }
  }
  return results;
}

// ── Tests ───────────────────────────────────────────────────────────────────

process.stdout.write('comment-ingestion.test.cjs\n');

// --- SKILL.md documentation gate ---

run('SKILL.md documents Step 1c per-item enrichment', () => {
  assert(/### Step 1c/.test(skill), 'Step 1c header missing');
  assert(/gh issue view/.test(skill), 'gh issue view example missing');
  assert(/gh pr view/.test(skill), 'gh pr view example missing');
});

run('SKILL.md caps comments at 20 (last 20, newest)', () => {
  assert(/slice\(-20\)/.test(skill), 'slice(-20) cap missing');
  assert(/last 20/i.test(skill), 'documentation of "last 20" missing');
});

run('SKILL.md mandates batch of 5 + 100ms throttle', () => {
  assert(/batches of 5/i.test(skill), 'batch-of-5 missing');
  assert(/100\s*ms/i.test(skill), '100ms throttle missing');
});

run('SKILL.md isolates per-item failures', () => {
  assert(
    /per-item failure/i.test(skill) && /continue triage/i.test(skill),
    'per-item failure isolation rule missing'
  );
});

run('SKILL.md forbids persisting comment bodies to telemetry', () => {
  assert(
    /NEVER persist comment bodies to telemetry/i.test(skill),
    'privacy invariant missing'
  );
});

run('SKILL.md Step 2c covers author authority, markers, reactions, recency', () => {
  assert(/### Step 2c/.test(skill), 'Step 2c header missing');
  assert(/OWNER.*MEMBER/i.test(skill), 'author authority ladder missing');
  assert(/fixed in/i.test(skill) && /wontfix/i.test(skill), 'status markers missing');
  assert(/THUMBS_UP/.test(skill), 'thumbs-up reaction signal missing');
  assert(/recency/i.test(skill), 'recency signal missing');
});

run('SKILL.md Step 2c requires rootCause output field', () => {
  assert(/rootCause/.test(skill), 'rootCause field requirement missing');
});

run('classifier prompt reference exists and defines output schema', () => {
  assert(/rootCause/.test(prompt), 'prompt missing rootCause schema');
  assert(/supersededBy/.test(prompt), 'prompt missing supersededBy schema');
  assert(/blockedBy/.test(prompt), 'prompt missing blockedBy schema');
  assert(/Privacy/i.test(prompt), 'prompt missing privacy directive');
});

// --- Fixture shape gate (#37 mirror) ---

run('fixture mirrors Issue #37 shape (title=Problem A, OWNER root-cause-B)', () => {
  assert(fixture.title === 'Problem A', `fixture.title was ${fixture.title}`);
  assert(fixture.body === 'problem A', `fixture.body was ${fixture.body}`);
  const owner = fixture.comments.find((c) => c.authorAssociation === 'OWNER');
  assert(owner, 'no OWNER comment in fixture');
  assert(/root cause is B/i.test(owner.body), 'OWNER comment does not cite root cause B');
});

// --- Deterministic classifier simulation ---

run('Classifier surfaces OWNER comment root cause', () => {
  const out = classify(fixture);
  assert(out.rootCause, 'rootCause not surfaced');
  assert(/\bB\b/.test(out.rootCause), `rootCause "${out.rootCause}" does not mention B`);
});

run('Classifier weights MEMBER comments above NONE', () => {
  const item = {
    number: 1,
    title: 't',
    body: 'b',
    comments: [
      {
        authorAssociation: 'NONE',
        body: 'root cause is drive-by-A',
        reactionGroups: [],
      },
      {
        authorAssociation: 'MEMBER',
        body: 'root cause is member-B',
        reactionGroups: [],
      },
    ],
  };
  const out = classify(item);
  assert(/member-B/.test(out.rootCause), `expected MEMBER claim to win, got ${out.rootCause}`);
});

run('Comments capped at 20 (last 20 kept, newest)', () => {
  const many = Array.from({ length: 50 }, (_, i) => ({
    authorAssociation: 'NONE',
    body: `comment-${i}`,
    reactionGroups: [],
    createdAt: `2026-04-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
  }));
  const out = classify({ number: 2, title: 't', body: 'b', comments: many });
  assert(
    out.commentCountAfterCap === 20,
    `expected 20 comments after cap, got ${out.commentCountAfterCap}`
  );
  // Verify we kept the LAST 20 (newest), not the first
  const capped = capComments(many);
  assert(capped[0].body === 'comment-30', `expected comment-30 first after cap, got ${capped[0].body}`);
  assert(capped[19].body === 'comment-49', `expected comment-49 last, got ${capped[19].body}`);
});

run('Status marker detection: "fixed in #99" flags superseded', () => {
  const body = 'fixed in #99 — closing as dup';
  assert(STATUS_MARKER.test(body), 'status marker regex did not match "fixed in #99"');
  const m = body.match(STATUS_MARKER);
  assert(/fixed in/i.test(m[0]), `match captured wrong substring: ${m[0]}`);
});

run('Per-item failure isolates (other items still processed)', async () => {
  const results = await mockGh([10, 11, 12], 11);
  assert(results.length === 3, `expected 3 results, got ${results.length}`);
  assert(results[0].ok === true, 'item 10 should have succeeded');
  assert(results[1].ok === false, 'item 11 should have failed (mocked)');
  assert(results[2].ok === true, 'item 12 should have succeeded despite 11 failing');
});

run('E2E: classifier promotes root-cause fixture to cookable', () => {
  const out = classify(fixture);
  // Fixture has OWNER thumbs-up (4) — priority boost eligible.
  assert(out.thumbsUpCount >= 3, `expected thumbsUpCount >= 3 for boost, got ${out.thumbsUpCount}`);
  assert(out.rootCause, 'E2E: rootCause must be populated');
  assert(/\bB\b/.test(out.rootCause), 'E2E: rootCause must mention B');
});

run('Privacy: fixture comment bodies never appear in SKILL.md', () => {
  for (const c of fixture.comments) {
    const snippet = c.body.slice(0, 20);
    assert(
      !skill.includes(snippet),
      `SKILL.md contains fixture comment body snippet "${snippet}" — privacy violation`
    );
  }
});

// ── Report ─────────────────────────────────────────────────────────────────

process.stdout.write(`\n${passed} passed, ${failed} failed\n`);
if (failed > 0) {
  process.stdout.write('\nFailures:\n');
  for (const f of failures) {
    process.stdout.write(`  - ${f.name}: ${f.error}\n`);
  }
  process.exit(1);
}
process.exit(0);
