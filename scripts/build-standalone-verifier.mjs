#!/usr/bin/env node
/**
 * build-standalone-verifier.mjs <package-dir> [entry]
 *
 * The generator of this package's `verify.js` and `test.js`, shipped so a reader can rebuild both from
 * the TypeScript in `src/` and `tests/` (`npm run build:standalone`) and check that the committed
 * files are what that source compiles to (`npm run check:standalone-build`). It is ProvablyFair.org's
 * standalone builder; the file the two bundles' headers name as `audit-framework/tools/…` is this one.
 *
 * Emits `<package-dir>/verify.js` — ONE file, plain CommonJS, Node built-ins only. A reviewer who
 * unzips the package can run
 *
 *     node verify.js
 *
 * and get the full scored verdict with NO `npm install`, no mocha, no ts-node, no network.
 *
 * ── WHY THIS EXISTS ──────────────────────────────────────────────────────────────────────────────
 * `npm test` needs an install (mocha, ts-node). A third party checking the audit should not need one
 * to get the verdict.
 *
 * ── WHY IT IS GENERATED AND NOT WRITTEN ──────────────────────────────────────────────────────────
 * A hand-written second verifier is a second implementation, and two implementations drift. That is
 * the exact failure the audit checks already guard against (a package once shipped with two copies of
 * the result formula and one of them was wrong). So this file does not re-implement anything: it
 * runs the package's OWN TypeScript through `tsc` and links the emitted CommonJS into a single file.
 * The bundle is a build product of the source, the way a compiled binary is.
 *
 * `scripts/check-standalone-build.mjs` re-runs this build in a temporary copy and fails if the
 * committed `verify.js` or `test.js` differs, so a bundle cannot silently fall behind its source.
 *
 * ── RUNTIME CONTRACT ─────────────────────────────────────────────────────────────────────────────
 * · Zero third-party modules. Only `node:*` built-ins are reachable — any other bare specifier is a
 *   hard error at build time, not a mystery at run time.
 * · `__dirname` / `__filename` inside each linked module keep their ORIGINAL package-relative
 *   locations, resolved at run time from wherever the bundle sits. Every `fs` read of `data/`,
 *   `outputs/` and `evidence/` therefore resolves exactly as it does under ts-node. Verification
 *   reads real artifacts off disk; a bundle that quietly re-rooted those paths would score nothing.
 * · Writes are the source's own business. `tests/verify.ts` writes only under `outputs/run/` unless
 *   PF_EMIT=1, and that behaviour is inherited unchanged — the bundle adds no write of its own.
 */

import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const argv = process.argv.slice(2);
const TESTS_MODE = argv.includes('--tests');   // bundle the unit suite instead of the verifier
const positional = argv.filter((a) => !a.startsWith('--'));
const pkgDir = positional[0];

if (!pkgDir) {
  console.error('build-standalone-verifier: NO PACKAGE GIVEN — nothing built ✗');
  console.error('usage: build-standalone-verifier.mjs <package-dir> [entry.ts]');
  console.error('       build-standalone-verifier.mjs <package-dir> --tests   (bundles tests/**/*Tests.ts)');
  process.exit(2);
}
const pkg = path.resolve(pkgDir);

// In --tests mode the entry is SYNTHETIC: a generated module that requires every unit-test file the
// package's own .mocharc names, so the bundled suite is the same suite by construction rather than
// by a list somebody maintains.
const SPEC_SUFFIX = 'Tests.ts';
function findTests(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) findTests(p, out);
    else if (e.name.endsWith(SPEC_SUFFIX)) out.push(path.relative(pkg, p).split(path.sep).join('/'));
  }
  return out;
}

let entryRel;
let synthetic = null;
if (TESTS_MODE) {
  const specs = findTests(path.join(pkg, 'tests')).sort();
  if (!specs.length) {
    console.error(`build-standalone-verifier: no tests/**/*${SPEC_SUFFIX} found in ${pkg} ✗`);
    process.exit(2);
  }
  entryRel = 'tests/__standalone-entry.ts';
  synthetic = specs
    .map((s) => `import './${s.replace(/^tests\//, '').replace(/\.ts$/, '')}';`)
    .join('\n') + '\n';
  fs.writeFileSync(path.join(pkg, entryRel), synthetic);
  console.log(`build-standalone-verifier: --tests — ${specs.length} spec files\n  ${specs.join('\n  ')}`);
} else {
  entryRel = positional[1] ?? 'tests/verify.ts';
}

if (!fs.existsSync(path.join(pkg, entryRel))) {
  console.error(`build-standalone-verifier: ${entryRel} not found in ${pkg} ✗`);
  process.exit(2);
}

// ── 1. compile ───────────────────────────────────────────────────────────────────────────────────
// tsc is a BUILD dependency, resolved from the package's own node_modules (or PF_TSC). It is
// never needed to RUN the result. Using tsc rather than a hand-rolled transform is the whole point:
// ESM→CJS semantics (namespace imports, default interop, re-exports) are subtle and tsc already
// gets them right, against this package's own tsconfig.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'pf-standalone-'));
// The package ships without node_modules, so building needs `npm ci` first (typescript is a dev
// dependency). PF_TSC overrides the lookup.
const tscCandidates = [
  process.env.PF_TSC,
  path.join(pkg, 'node_modules', '.bin', 'tsc'),
].filter(Boolean);
// Resolved to an ABSOLUTE path: tsc is spawned with cwd set to the package, so a relative
// PF_TSC would be looked up against the package and silently ENOENT into "emitted nothing".
const tscFound = tscCandidates.find((c) => fs.existsSync(c));
const tsc = tscFound ? path.resolve(tscFound) : undefined;
if (!tsc) {
  console.error('build-standalone-verifier: tsc not found ✗');
  console.error('  looked in:\n    ' + tscCandidates.join('\n    '));
  console.error('  set PF_TSC=/path/to/tsc, or `npm ci` in the package or its source repo.');
  process.exit(2);
}

try {
  execFileSync(tsc, [
    entryRel,
    '--outDir', tmp,
    '--rootDir', '.',
    '--module', 'commonjs',
    '--moduleResolution', 'node',
    '--target', 'es2020',
    '--esModuleInterop',
    '--resolveJsonModule',
    '--skipLibCheck',
    // NB: tsc's CLI booleans take no value — `--sourceMap false` makes tsc treat `false` as an
    // input FILE. Omit them; neither is on by default for this invocation.
  ], { cwd: pkg, stdio: 'pipe' });
} catch (e) {
  // tsc exits non-zero on type errors while still emitting. Emit is what we need; a type error is
  // reported so it is not silently carried into a shipped artifact.
  const out = (e.stdout?.toString() ?? '') + (e.stderr?.toString() ?? '');
  if (out.trim()) {
    console.error('build-standalone-verifier: tsc reported diagnostics —');
    console.error(out.trim().split('\n').slice(0, 20).map((l) => '  ' + l).join('\n'));
  }
  if (!fs.existsSync(tmp) || fs.readdirSync(tmp).length === 0) {
    console.error('build-standalone-verifier: tsc emitted nothing ✗');
    process.exit(1);
  }
  console.error('  (emit succeeded; continuing)');
}

// ── 2. collect ───────────────────────────────────────────────────────────────────────────────────
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name.endsWith('.js') || e.name.endsWith('.json')) files.push(p);
  }
})(tmp);

const modules = new Map();          // "tests/verify.js" -> source text
for (const abs of files) {
  modules.set(path.relative(tmp, abs).split(path.sep).join('/'), fs.readFileSync(abs, 'utf8'));
}

// ── 3. verify the zero-dependency claim BEFORE writing anything ──────────────────────────────────
// A bare specifier that is not a node: built-in would make the bundle silently need an install —
// precisely the defect being fixed. Fail the build instead of shipping it.
const { builtinModules } = await import('node:module');
const BUILTINS = new Set(builtinModules);

const foreign = new Set();
for (const [name, src] of modules) {
  if (name.endsWith('.json')) continue;
  for (const m of src.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) {
    const spec = m[1];
    if (spec.startsWith('.')) continue;
    const bare = spec.startsWith('node:') ? spec.slice(5) : spec;
    if (!BUILTINS.has(bare)) foreign.add(`${spec}  (from ${name})`);
  }
}
if (foreign.size) {
  console.error('build-standalone-verifier: bundle would need third-party modules ✗');
  for (const f of foreign) console.error('  · ' + f);
  console.error('  A standalone verifier must reach nothing but node built-ins.');
  process.exit(1);
}

// ── 4. link ──────────────────────────────────────────────────────────────────────────────────────
const entryJs = entryRel.replace(/\.ts$/, '.js');
if (!modules.has(entryJs)) {
  console.error(`build-standalone-verifier: entry ${entryJs} missing from emit ✗`);
  process.exit(1);
}

// ── 4a. test-mode prelude ────────────────────────────────────────────────────────────────────────
// The unit suite is written for mocha: bare `describe` / `it` globals. Node has shipped an
// equivalent runner as `node:test` since 18, so the suite needs a shim, not a rewrite — rewriting
// 108 assertions to a different API the night before publication is how a green suite acquires a
// silent hole. The shim is six lines and the assertions are untouched.
// The one place the two runners genuinely differ is mocha's test CONTEXT: `this.timeout(ms)` inside
// a test body. Node's runner calls the body with a TestContext that has no such method, so those
// tests throw `this.timeout is not a function` — measured on blackjack's Wizard-of-Odds anchor
// test, which passed under mocha and failed here, 76 vs 77. Every such call in the audited
// packages only RAISES a limit; Node's runner imposes no default timeout at all, so
// honouring them as no-ops preserves the behaviour exactly. No test uses the callback (`done`)
// style, which is why the wrapper can safely take no arguments.
const TEST_PRELUDE = `
var __nodeTest = require('node:test');
function __mochaCtx() {
  return { timeout: function () {}, slow: function () {}, retries: function () {} };
}
function __wrap(fn) {
  if (typeof fn !== 'function') return fn;
  return function () { return fn.call(__mochaCtx()); };
}
function __bind(name) {
  var orig = __nodeTest[name];
  var bound = function (desc, fn) { return orig(desc, __wrap(fn)); };
  // carry .skip / .only / .todo through so a suite can still disable a case
  for (var k in orig) { if (typeof orig[k] === 'function') bound[k] = orig[k]; }
  bound.skip = orig.skip; bound.only = orig.only; bound.todo = orig.todo;
  return bound;
}
// HOOKS NEED THE SHIM TOO, and leaving them out is not a cosmetic miss. mines' QA-01 suite calls
// this.timeout(600_000) inside a before(...) hook for a million-round replay. Unwrapped, that hook
// threw, Node cancelled every test in the suite, and the run reported "38 pass, 0 fail" while
// SEVEN tests had silently never executed — a green result over a hole. Caught 2026-09-11 by the
// unit-count parity check (mocha 45 vs standalone 38), which is the entire reason that check exists.
function __bindHook(name) {
  var orig = __nodeTest[name];
  return function (fn) { return orig(__wrap(fn)); };
}
globalThis.describe   = __bind('describe');
globalThis.it         = __bind('it');
globalThis.before     = __bindHook('before');
globalThis.after      = __bindHook('after');
globalThis.beforeEach = __bindHook('beforeEach');
globalThis.afterEach  = __bindHook('afterEach');
`;

const header = TESTS_MODE ? `/**
 * STANDALONE UNIT SUITE — generated, do not edit.
 *
 *     node test.js
 *
 * Runs the package's own unit tests with no \`npm install\` and no mocha. The test sources are
 * unchanged; \`describe\`/\`it\` are bound to Node's built-in \`node:test\` runner instead of mocha's.
 *
 * It is a BUILD PRODUCT of every unit-test file under \`tests/\` (the *Tests.ts spec set).
 * Rebuild with \`audit-framework/tools/build-standalone-verifier.mjs <package> --tests\`.
 *
 * Linked modules: ${modules.size}
 */
'use strict';
${TEST_PRELUDE}
` : `/**
 * STANDALONE VERIFIER — generated, do not edit.
 *
 *     node verify.js
 *
 * Runs the full scored verification with no \`npm install\`: this file contains the package's own
 * compiled verification code and reaches nothing outside Node's built-in modules. It reads the
 * committed artifacts from their normal locations and, exactly like \`npm run verify\`, writes only
 * under \`outputs/run/\` (PF_EMIT=1 still being the sole thing that rewrites a committed artifact).
 *
 * It is a BUILD PRODUCT of \`${entryRel}\` and the sources it imports — not a second implementation.
 * Rebuild with \`audit-framework/tools/build-standalone-verifier.mjs <package>\`;
 * \`check-standalone.sh\` fails the gate if this file and the TypeScript have drifted apart.
 *
 * Source entry : ${entryRel}
 * Linked modules: ${modules.size}
 */
'use strict';
`;

// Each module keeps the __dirname it had in the package, rebuilt at run time from the bundle's own
// location, so every artifact path inside the audit resolves the way it does under ts-node.
const registry = [...modules]
  .map(([name, src]) => {
    if (name.endsWith('.json')) {
      return `  ${JSON.stringify(name)}: function (module) { module.exports = ${src.trim()}; },`;
    }
    return `  ${JSON.stringify(name)}: function (module, exports, require, __filename, __dirname) {\n${src}\n  },`;
  })
  .join('\n');

const runtime = `
var __PF_ROOT__ = __dirname;
var __nodeRequire = require;
var __modules = {
${registry}
};
var __cache = {};

function __flatten(from, spec) {
  var base = from ? from.split('/').slice(0, -1).join('/') : '';
  var parts = (base ? base + '/' + spec : spec).split('/');
  var out = [];
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i];
    if (p === '' || p === '.') continue;
    if (p === '..') { out.pop(); continue; }
    out.push(p);
  }
  return out.join('/');
}

function __resolve(from, spec) {
  var joined = __flatten(from, spec);
  var candidates = [joined, joined + '.js', joined + '.json', joined + '/index.js'];
  for (var c = 0; c < candidates.length; c++) {
    if (Object.prototype.hasOwnProperty.call(__modules, candidates[c])) return candidates[c];
  }
  return null;
}

function __require(from, spec) {
  if (!spec.startsWith('.')) return __nodeRequire(spec);
  var id = __resolve(from, spec);
  if (!id) {
    // Not TypeScript, so tsc never emitted it — a .mjs/.cjs/.json asset the package SHIPS, such as
    // a capture reference module. Load the real file off disk relative to the package root. The
    // bundle stays self-contained for compiled code without pretending the package has no other
    // files; if the asset is genuinely missing, the error names it rather than hiding it.
    var abs = __PF_ROOT__ + '/' + __flatten(from, spec);
    try { return __nodeRequire(abs); } catch (e) {
      throw new Error('standalone verifier: unresolved module "' + spec + '" from "' + from + '" (' + e.message + ')');
    }
  }
  if (__cache[id]) return __cache[id].exports;
  var module = { exports: {} };
  __cache[id] = module;
  var dir = id.split('/').slice(0, -1).join('/');
  __modules[id](
    module,
    module.exports,
    function (s) { return __require(id, s); },
    __PF_ROOT__ + '/' + id,
    dir ? __PF_ROOT__ + '/' + dir : __PF_ROOT__
  );
  return module.exports;
}

__require('', './${entryJs}');
`;

const bundle = header + runtime;
const outPath = path.join(pkg, TESTS_MODE ? 'test.js' : 'verify.js');
fs.writeFileSync(outPath, bundle);
fs.rmSync(tmp, { recursive: true, force: true });
// The synthetic entry is scaffolding, not a deliverable — it must not survive into the package.
if (synthetic) fs.rmSync(path.join(pkg, entryRel), { force: true });

const kb = (Buffer.byteLength(bundle) / 1024).toFixed(0);
console.log(`build-standalone-verifier: wrote ${path.relative(process.cwd(), outPath)}  (${modules.size} modules, ${kb} KB, 0 third-party requires)`);
