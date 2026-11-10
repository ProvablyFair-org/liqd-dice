/**
 * Informational items (NOT scored) — realized RTP + per-mode effective edge + roll spread.
 * Authoritative statistical evidence is the Pass 1 simulation (fresh seeds, 2M draws).
 */

import type { InfoItem } from './context';
import type { VerifyContext } from './context';
import { effectiveEdge, bandMode, quotedMultiplier, amountUnits, EXPECTED_PHASES } from '../../src/config';

export function run(ctx: VerifyContext): InfoItem[] {
  const { bets } = ctx;
  const items: InfoItem[] = [];
  if (bets.length === 0) { items.push({ label: 'Live bets', detail: 'No bets in dataset' }); return items; }

  // Realized RTP (informational: variance over the captured bets, not the theoretical edge), summed
  // in exact 1e-8 units from the served decimal strings, in total and per phase.
  const usdt = (u: bigint) => `${u / 100000000n}.${String(u % 100000000n).padStart(8, '0')}`;
  const sums = (list: typeof bets) => {
    let w = 0n, r = 0n;
    for (const b of list) { w += amountUnits(b.betAmount) ?? 0n; r += amountUnits(b.winningAmount) ?? 0n; }
    return { w, r, pct: w > 0n ? Number(r * 1000000n / w) / 10000 : NaN };
  };
  const all = sums(bets);
  items.push({
    label: 'Realized RTP (variance)',
    detail: `${all.pct.toFixed(2)}% (${usdt(all.w)} USDT wagered, ${usdt(all.r)} USDT returned over ${bets.length} bets; informational, a variance illustration only: the edge evidence is the deterministic effective edge, Step 15, and the simulation, Step 16). `
      + `Per phase: ${EXPECTED_PHASES.map((ph) => { const x = sums(bets.filter((b) => b.phaseId === ph.id)); return `${ph.id} ${x.pct.toFixed(2)}% (${usdt(x.w)} wagered, ${usdt(x.r)} returned)`; }).join('; ')}.`,
  });

  // Deterministic mean effective edge + per-mode spread (the finding, from arithmetic).
  const modeAgg: Record<string, { n: number; sum: number; min: number; max: number }> = {};
  let sumAll = 0;
  for (const b of bets) {
    const e = effectiveEdge(b.params); sumAll += e;
    const m = bandMode(b.params);
    (modeAgg[m] ||= { n: 0, sum: 0, min: Infinity, max: -Infinity });
    const g = modeAgg[m]; g.n++; g.sum += e; if (e < g.min) g.min = e; if (e > g.max) g.max = e;
  }
  items.push({ label: 'Mean effective edge', detail: `${(sumAll / bets.length * 100).toFixed(4)}% (target 1.00%; exact under the half-open grid rule)` });
  for (const [m, g] of Object.entries(modeAgg)) {
    items.push({ label: `Effective edge — ${m}`, detail: `mean ${(g.sum / g.n * 100).toFixed(3)}%, range ${(g.min * 100).toFixed(3)}–${(g.max * 100).toFixed(3)}% (n=${g.n})` });
  }

  // Roll spread sanity.
  const rolls = bets.map(b => Number(b.roll));
  items.push({ label: 'Roll range', detail: `min ${Math.min(...rolls).toFixed(2)}, max ${Math.max(...rolls).toFixed(2)} (ceiling 99.99), mean ${(rolls.reduce((a, b) => a + b, 0) / rolls.length).toFixed(3)}` });

  const wins = bets.filter(b => b.win).length;
  items.push({ label: 'Live win rate', detail: `${wins}/${bets.length} = ${(wins / bets.length * 100).toFixed(2)}% (mixed win chances — informational)` });

  // Odds limits: not read from the operator. The production dice replies serve no limits field.
  const mults = bets.map(b => quotedMultiplier(b.params));
  items.push({
    label: 'Odds limits',
    detail: `no operator odds or bet-limit configuration is in the production capture (none is served in the dice replies, none was read from the site); captured multiplier span ${Math.min(...mults).toFixed(4)}×–${Math.max(...mults).toFixed(4)}×. What LIQD accepts outside that span was not measured (declared limitation L7).`,
  });

  // Converter-side self-check fields present and ignored.
  items.push({
    label: 'Converter-side self-check fields',
    detail: 'per-bet and per-seed self-check fields written by the converter (localRoll, localWin, verified, commitVerified, chainLinkOk) are present in the dataset but IGNORED by verification; every scored figure is re-derived from primitives. See MANIFEST.md#dataset-and-capture.',
  });

  return items;
}
