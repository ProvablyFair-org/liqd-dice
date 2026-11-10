/**
 * The companion documents (evidence.md, exploit-testing.md, SUMMARY.md) are generated from
 * MANIFEST.md, the registries under tests/ and the files on disk by scripts/build-docs.mjs. This
 * test runs the generator's check, so a fact stated in two documents cannot drift apart.
 */
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.join(__dirname, '..', '..');

describe('companion documents', () => {
  it('evidence.md, exploit-testing.md and SUMMARY.md are what scripts/build-docs.mjs generates', () => {
    let out = '';
    try { out = execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'build-docs.mjs'), '--check'], { encoding: 'utf8' }); }
    catch (e) { assert.fail(String((e as { stdout?: string }).stdout ?? e)); }
    assert.strictEqual((out.match(/is what the generator writes/g) ?? []).length, 3, out);
  });

  it('the limitation register carries one framework id per entry, DL-n beside Ln', () => {
    const rows = fs.readFileSync(path.join(ROOT, 'MANIFEST.md'), 'utf8').split('\n').filter((l) => /^\| \*\*L\d+\*\*/.test(l));
    assert.ok(rows.length > 0);
    for (const r of rows) { const m = /^\| \*\*L(\d+)\*\* \(DL-(\d+)\)/.exec(r); assert.ok(m && m[1] === m[2], r.slice(0, 40)); }
  });
});
