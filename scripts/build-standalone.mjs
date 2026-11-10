#!/usr/bin/env node
/**
 * build-standalone.mjs — one entry point for the two standalone bundles, under the name the other
 * LIQD packages use.
 *
 *   node scripts/build-standalone.mjs           rebuild verify.js and test.js (npm run build:standalone)
 *   node scripts/build-standalone.mjs --check   rebuild in a temporary copy and compare byte for byte
 *                                               with the committed files (npm run check:standalone-build)
 *
 * It adds nothing of its own: it runs scripts/build-standalone-verifier.mjs or
 * scripts/check-standalone-build.mjs and exits with their code.
 */
import { spawnSync } from 'node:child_process';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const run = (args) => spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit' }).status ?? 1;

if (process.argv.includes('--check')) process.exit(run([path.join(here, 'check-standalone-build.mjs')]));
const builder = path.join(here, 'build-standalone-verifier.mjs');
process.exit(run([builder, '.']) || run([builder, '.', '--tests']));
