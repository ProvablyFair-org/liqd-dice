/**
 * Informational items (NOT scored) — realized RTP + per-mode effective edge + roll spread.
 * Authoritative statistical evidence is the Pass 1 simulation (fresh seeds, 2M draws).
 */

import type { InfoItem } from './context';
import type { VerifyContext } from './context';
import { effectiveEdge, bandMode, quotedMultiplier, MAX_ODDS } from '../../src/config';

export function run(ctx: VerifyContext): InfoItem[] {
  const { bets } = ctx;
  const items: InfoItem[] = [];
  if (bets.length === 0) { items.push({ label: 'Live bets', detail: 'No bets in dataset' }); return items; }

  // Realized RTP (informational — variance over 6,700 bets, not the theoretical edge).
  const totalPayout = bets.reduce((s, b) => s + Number(b.winningAmount), 0);
  const totalWagered = bets.reduce((s, b) => s + Number(b.betAmount), 0);
  items.push({
    label: 'Realized RTP (variance)',
    detail: `${(totalPayout / totalWagered * 100).toFixed(2)}% ($${totalWagered.toFixed(2)} wagered, $${totalPayout.toFixed(2)} returned over ${bets.length} bets — informational; authoritative edge is the deterministic effective edge, Step 15).`,
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

  const mults = bets.map(b => quotedMultiplier(b.params));
  const lim = ctx.meta.limits;
  items.push({
    label: 'Odds settings and recorded acceptance',
    detail: `recorded settings (meta.limits): minOdds ${lim?.minOdds}, maxOdds ${lim?.maxOdds}; E14 records acceptance at ${MAX_ODDS}× (auditor attestation, F-LIMITS); captured multiplier span ${Math.min(...mults).toFixed(4)}×–${Math.max(...mults).toFixed(4)}×; maximum enforcement is outside scope`,
  });

  items.push({
    label: 'Capture-side self-check fields',
    detail: `meta.edgeScan and local self-check fields are capture annotations. Scored verification independently derives results from recorded inputs; see AUDIT_CONTEXT.md §3.`,
  });

  return items;
}
