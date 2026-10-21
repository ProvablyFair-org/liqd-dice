#!/usr/bin/env node
/**
 * check-standalone-build.mjs — is the committed `verify.js` / `test.js` what today's TypeScript
 * compiles to?
 *
 * Copies the build inputs (src/, tests/, tsconfig.json, package.json) into a temporary directory,
 * runs scripts/build-standalone-verifier.mjs there for both bundles with this package's own tsc,
 * and compares the results byte for byte with the committed files. It never writes into the
 * package. Needs `npm ci` (typescript is a dev dependency). Exit 0 when both match, 1 otherwise.
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const builder = path.join(root, 'scripts', 'build-standalone-verifier.mjs');
const tsc = path.join(root, 'node_modules', '.bin', 'tsc');
if (!fs.existsSync(tsc)) {
  console.error('[standalone-build] tsc not found in node_modules: run `npm ci` first');
  process.exit(2);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dice-standalone-check-'));
try {
  for (const p of ['src', 'tests', 'tsconfig.json', 'package.json']) {
    fs.cpSync(path.join(root, p), path.join(tmp, p), { recursive: true });
  }
  const env = { ...process.env, PF_TSC: tsc };
  execFileSync(process.execPath, [builder, tmp], { env, stdio: 'pipe' });
  execFileSync(process.execPath, [builder, tmp, '--tests'], { env, stdio: 'pipe' });
  let drift = 0;
  for (const f of ['verify.js', 'test.js']) {
    const same = Buffer.compare(fs.readFileSync(path.join(root, f)), fs.readFileSync(path.join(tmp, f))) === 0;
    console.log(`[standalone-build] ${f} ${same ? 'reproduces byte for byte from source' : 'DIFFERS from what the source compiles to: run npm run build:standalone'}`);
    if (!same) drift = 1;
  }
  process.exitCode = drift;
} finally {
  fs.rmSync(tmp, { recursive: true, force: true });
}
