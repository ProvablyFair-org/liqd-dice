/**
 * Artifacts of record — the committed files this audit's verdict is computed from.
 *
 * WHY. A `npm test` that ran `npm run simulate` and then scored the file it had just written would
 * make `outputs/simulation-results.json` whatever the last run happened to produce, pinned by
 * nothing. It is pinned in `src/config.ts` and scored by Step 19; these tests assert the same pins
 * at the mocha layer, so a mismatch surfaces before the verifier runs.
 *
 * The chart test is deliberately stronger than a hash. `outputs/rtp-convergence.html` is the twin of
 * the JSON's 98-target mean series (`pass1.targetConvergence`, since 22 October 2026) and is what a reader looks at; a hash proves only that the file has
 * not changed. Re-rendering it from the committed series and asserting byte identity proves the
 * picture IS the data — the two cannot drift apart while both are committed.
 */

import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { DATASET_SHA256, SIMULATION_SHA256, SIMULATION_HTML_SHA256, EXPECTED_BETS, EXPECTED_SEEDS, EXPECTED_EPOCH_SIZE, EXPECTED_PHASE_BETS } from '../../src/config';
import { renderConvergenceChart } from '../../src/chart';

const REPO = path.join(__dirname, '../..');
const sha = (p: string) => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const SIM_JSON = path.join(REPO, 'outputs/simulation-results.json');
const SIM_HTML = path.join(REPO, 'outputs/rtp-convergence.html');
const DATASET = path.join(REPO, 'data/dice-master-6700bets.json');

describe('LIQD Dice artifacts of record', () => {
  it('data/dice-master-6700bets.json hash matches DATASET_SHA256', () => {
    assert.strictEqual(sha(DATASET), DATASET_SHA256);
  });

  it('outputs/simulation-results.json hash matches SIMULATION_SHA256', () => {
    assert.strictEqual(sha(SIM_JSON), SIMULATION_SHA256,
      'the committed simulation is not the pinned one — re-pin in src/config.ts if the regeneration was deliberate');
  });

  it('outputs/rtp-convergence.html hash matches SIMULATION_HTML_SHA256', () => {
    assert.strictEqual(sha(SIM_HTML), SIMULATION_HTML_SHA256);
  });

  it('the committed chart IS the committed 98-target mean series, byte for byte', () => {
    const sim = JSON.parse(fs.readFileSync(SIM_JSON, 'utf8'));
    const rendered = renderConvergenceChart(sim.pass1.targetConvergence);
    assert.strictEqual(rendered, fs.readFileSync(SIM_HTML, 'utf8'),
      'the chart and the JSON come from different simulation runs');
  });

  it('the dataset carries the audited population (G-BIND, constants not header fields)', () => {
    // The same binding Steps 11/12 enforce, asserted here too so a shrunken-and-re-pinned dataset
    // fails at the mocha layer as well. The counts come from src/config.ts; `meta` is reconciled
    // against them, never read as the plan.
    const ds = JSON.parse(fs.readFileSync(DATASET, 'utf8'));
    assert.strictEqual(ds.bets.length, EXPECTED_BETS);
    assert.strictEqual(ds.seeds.length, EXPECTED_SEEDS);
    const perEpoch = new Map<number, number>();
    for (const b of ds.bets) perEpoch.set(b.epoch, (perEpoch.get(b.epoch) ?? 0) + 1);
    assert.strictEqual(perEpoch.size, EXPECTED_SEEDS);
    for (const [e, n] of perEpoch) assert.strictEqual(n, EXPECTED_EPOCH_SIZE, `epoch ${e}`);
    const byPhase: Record<string, number> = {};
    for (const b of ds.bets) byPhase[b.phase] = (byPhase[b.phase] ?? 0) + 1;
    assert.deepStrictEqual(byPhase, { ...EXPECTED_PHASE_BETS });
    assert.strictEqual(ds.meta.plannedTotal, EXPECTED_BETS);
    assert.strictEqual(ds.meta.epochSize, EXPECTED_EPOCH_SIZE);
  });
});
