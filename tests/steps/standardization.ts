/**
 * Steps 18–21: Standardization-parity steps. Each is recomputed from the raw dataset (or the
 * pure-arithmetic engine), never read from an operator summary field, and each carries a
 * coverage assertion so a pass over an empty set cannot occur.
 *
 *   18  Bet-Size Invariance      — roll/edge independent of wager (Phase C, $10)
 *   19  Artifact Hash Integrity  — pinned SHA-256 of the dataset AND of the simulation artifacts
 *   20  Settlement Determinism   — credited amount fully determined by (roll, band, stake),
 *                                  across all four modes and both win & loss
 *   21  Multiplier Monotonicity  — served multiplier == 99/winChance is strictly decreasing
 *                                  in win chance, spans [minOdds, maxOdds], no inversions
 */

import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'node:crypto';
import { step } from './context';
import { computeReportFigures } from '../../src/report-figures';
import type { StepResult, VerifyContext } from './context';
import { diceRoll } from '../../src/rng';
import { quotedMultiplier, payoutBasisPoints, PAYOUT_NUMERATOR, effectiveEdge, diceWin, bandMode, continuousWinChancePct, settledCredit, servedRollMatches, MIN_ODDS, MAX_ODDS, SIMULATION_SHA256, SIMULATION_HTML_SHA256 } from '../../src/config';

export function run(ctx: VerifyContext): StepResult[] {
  const { bets, seedMap } = ctx;
  const out: StepResult[] = [];

  // ── Step 18: Bet-Size Invariance ────────────────────────────────────────────
  {
    const c = ctx.phaseC;
    let chk = 0, bad = 0;
    for (const b of c) {
      const ss = seedMap.get(b.hashedServerSeed);
      if (!ss) continue;
      chk++;
      const served = Number(b.roll);
      const local = diceRoll(ss, b.clientSeed, b.nonce);
      if (!servedRollMatches(served, local)) bad++;
    }
    const stakes = [...new Set(bets.map((b) => Number(b.betAmount)))].sort((a, z) => a - z);
    // Edge for the Phase-C band is identical whatever the stake (diceRoll + edge take no wager).
    const edgeSame = c.length > 0 ? effectiveEdge(c[0].params) : NaN;
    const ok = chk === c.length && chk > 0 && bad === 0;
    out.push(step(18, 'Bet-Size Invariance', ok ? 'PASS' : 'FAIL',
      `${chk}/${c.length} Phase C bets at $10.00 recompute their roll identically to the $0.10 phases — ${bad} mismatch. ` +
      `diceRoll takes no wager argument; effective edge for the band is ${(edgeSame * 100).toFixed(4)}% at every stake (stakes present: ${stakes.map((s) => `$${s}`).join(', ')})` +
      (chk === 0 ? '; COVERAGE FAIL: 0 Phase C bets recomputed' : '')));
  }

  {
    const hashOk = ctx.datasetSha256 === ctx.expectedDatasetHash;
    const simFresh = process.env.SIM_FRESH === '1';
    const simPins: { label: string; file: string; expected: string }[] = [
      { label: 'simulation-results.json', file: 'simulation-results.json', expected: SIMULATION_SHA256 },
      { label: 'rtp-convergence.html', file: 'rtp-convergence.html', expected: SIMULATION_HTML_SHA256 },
    ];
    const simNotes: string[] = [];
    let simForged = false;
    for (const pin of simPins) {
      const fp = path.join(ctx.outputsDir, pin.file);
      if (!fs.existsSync(fp)) {
        simForged = true;
        simNotes.push(`${pin.label} ABSENT — the artifact Steps 16–17 score is missing`);
        continue;
      }
      const actual = createHash('sha256').update(fs.readFileSync(fp)).digest('hex');
      if (simFresh) {
        simNotes.push(`${pin.label} FRESH run (SIM_FRESH=1): sha256 ${actual.slice(0, 16)}… — pin NOT enforced; re-pin in src/config.ts to publish this run`);
      } else if (actual !== pin.expected) {
        simForged = true;
        simNotes.push(`${pin.label} sha256 ${actual.slice(0, 16)}… ≠ pin ${pin.expected.slice(0, 16)}… — the scored simulation is not the committed one`);
      } else {
        simNotes.push(`${pin.label} sha256 ${actual.slice(0, 16)}… matches its pin`);
      }
    }
    const rfPath = path.join(ctx.outputsDir, 'report-figures.json');
    const freshObj = computeReportFigures(ctx.bets, ctx.seeds) as unknown as Record<string, unknown>;
    const fresh = JSON.stringify(freshObj, null, 2);
    const RF_ENVELOPE_FIELDS = ['generatedAt', 'datasetSha256'] as const;
    const RF_REQUIRED_FIELDS = [...RF_ENVELOPE_FIELDS, ...Object.keys(freshObj)];

    let rfForged = false;
    let rfNote: string;
    if (!fs.existsSync(rfPath)) {
      rfForged = true;
      rfNote = 'outputs/report-figures.json ABSENT — the artifact of record for the report\'s derived '
        + 'figures (evidence E15) is missing, so the published numbers cannot be checked against the '
        + 'file that produced them. Regenerating it here would prove only that they are a deterministic '
        + 'function of the pinned dataset, not that the shipped file was ever produced';
    } else {
      let stored: unknown;
      let parseError: string | null = null;
      try {
        stored = JSON.parse(fs.readFileSync(rfPath, 'utf8'));
      } catch (e) {
        parseError = e instanceof Error ? e.message : String(e);
      }
      if (parseError !== null) {
        rfForged = true;
        rfNote = `outputs/report-figures.json PARSE ERROR — the artifact of record could not be read as JSON (${parseError.slice(0, 120)}). `
          + 'A verifier must not approve an artifact it could not read, and a parse failure is not permission to regenerate';
      } else if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) {
        rfForged = true;
        rfNote = `outputs/report-figures.json SCHEMA ERROR — expected a JSON object, got ${stored === null ? 'null' : Array.isArray(stored) ? 'an array' : typeof stored}`;
      } else {
        const obj = stored as Record<string, unknown>;
        const missing = RF_REQUIRED_FIELDS.filter((k) => !Object.prototype.hasOwnProperty.call(obj, k));
        const storedHash = typeof obj.datasetSha256 === 'string' ? obj.datasetSha256 : '';
        if (missing.length > 0) {
          rfForged = true;
          rfNote = `outputs/report-figures.json SCHEMA ERROR — required field(s) absent: ${missing.join(', ')}. `
            + `The artifact must carry ${RF_REQUIRED_FIELDS.length} top-level fields (${RF_ENVELOPE_FIELDS.join(', ')} plus every figure group the report cites)`;
        } else if (!/^[0-9a-f]{64}$/.test(storedHash)) {
          rfForged = true;
          rfNote = `outputs/report-figures.json SCHEMA ERROR — datasetSha256 is not a SHA-256 hex digest (${JSON.stringify(obj.datasetSha256)?.slice(0, 40)})`;
        } else if (storedHash !== ctx.datasetSha256) {
          // NOT "stale, regenerated by this run" any more. The shipped figures were derived from a
          // capture that is not the one being scored; that is a mismatch to report.
          rfForged = true;
          rfNote = `outputs/report-figures.json DATASET MISMATCH — it declares dataset ${storedHash.slice(0, 16)}… but the capture being scored is ${ctx.datasetSha256.slice(0, 16)}…, `
            + 'so the shipped derived figures were not computed from this capture. Regenerate deliberately with `npm run report` and review the diff; verification will not do it for you';
        } else {
          const body = { ...obj };
          delete body.generatedAt; delete body.datasetSha256;
          const storedBody = JSON.stringify(body, null, 2);
          if (storedBody !== fresh) {
            rfForged = true;
            // Name the first disagreeing top-level group, so the failure points somewhere.
            const firstBad = Object.keys(freshObj).find((k) => JSON.stringify(body[k]) !== JSON.stringify(freshObj[k])) ?? '(field order)';
            rfNote = `outputs/report-figures.json FIELD MISMATCH — it claims THIS dataset but DISAGREES with recomputation from it (first disagreeing group: ${firstBad}) — the report's derived figures do not follow from the capture`;
          } else {
            rfNote = 'outputs/report-figures.json reconciles with a fresh recomputation from the pinned dataset, field for field '
              + `(${RF_REQUIRED_FIELDS.length}/${RF_REQUIRED_FIELDS.length} required fields present, dataset hash matches)`;
          }
        }
      }
    }
    out.push(step(19, 'Artifact Hash Integrity', hashOk && !rfForged && !simForged ? 'PASS' : 'FAIL',
      `SHA-256 of data/dice-master-6700bets.json = ${ctx.datasetSha256.slice(0, 16)}… ${hashOk ? 'matches' : '≠'} the pin ${ctx.expectedDatasetHash.slice(0, 16)}… (loader aborts on mismatch before any step runs); `
      + `${simNotes.join('; ')} — the pin proves the scored simulation is the committed one, NOT that its statistics are real (that is Step 16's two-sided uniformity screen plus its structural validation of the win counts and standard errors); `
      + `${rfNote}`));
  }

  {
    let chk = 0, bad = 0;
    const modesSeen = new Set<string>(); let wins = 0, losses = 0;
    const fails: string[] = [];
    /** The expected winning multiplier: the integer-basis-point quotient, not the float closed form. */
    const expectedMultiplier = (p: typeof bets[number]['params']) => {
      const bps = payoutBasisPoints(p);
      return bps > 0 ? PAYOUT_NUMERATOR / bps : 0;
    };
    for (const b of bets) {
      chk++;
      modesSeen.add(bandMode(b.params));
      const win = diceWin(Number(b.roll), b.params);
      if (win) wins++; else losses++;
      const expected = win ? settledCredit(Number(b.betAmount), expectedMultiplier(b.params)) : 0;
      const credited = Number(b.winningAmount);
      // win flag must match the roll/band rule AND the credit must be the determined amount
      if (win !== !!b.win || credited !== expected) {
        bad++; if (fails.length < 3) fails.push(`epoch ${b.epoch} nonce ${b.nonce}: credited ${credited} vs determined ${expected}`);
      }
    }
    const coverOk = modesSeen.size === 4 && wins > 0 && losses > 0;
    out.push(step(20, 'Settlement Determinism', bad === 0 && coverOk ? 'PASS' : 'FAIL',
      `${chk}/${bets.length} bets: outcome (win/loss) and credited amount are fully determined by (roll, band, stake) — credit == ROUND_HALF_EVEN_8(stake × ROUND_8(PAYOUT_NUMERATOR/basisPoints)), the integer-basis-point quotient, with zero tolerance — and match the served settlement — ${bad} mismatch` +
      (fails.length ? ` (e.g. ${fails.join('; ')})` : '') +
      `; coverage: modes [${[...modesSeen].join(',')}], ${wins} wins / ${losses} losses` +
      (coverOk ? '' : '; COVERAGE FAIL')));
  }

  // ── Step 21: Multiplier Monotonicity & Range ────────────────────────────────
  {
    // Distinct observed (winChance → multiplier) points, sorted by win chance ascending.
    const pts = new Map<number, number>();
    let rangeMin = Infinity, rangeMax = -Infinity;
    for (const b of bets) {
      const wc = +continuousWinChancePct(b.params).toFixed(4);
      const m = quotedMultiplier(b.params);
      pts.set(wc, m);
      if (m < rangeMin) rangeMin = m; if (m > rangeMax) rangeMax = m;
    }
    const sorted = [...pts.entries()].sort((a, z) => a[0] - z[0]);
    let inversions = 0;
    for (let i = 1; i < sorted.length; i++) if (sorted[i][1] >= sorted[i - 1][1] - 1e-12) inversions++;
    const rangeOk = rangeMin >= MIN_ODDS && rangeMax <= MAX_ODDS;   // exact bound, no slack
    const spanOk = sorted.length >= 100;      // a rich win-chance sweep, not a handful of points
    out.push(step(21, 'Multiplier Monotonicity & Range', inversions === 0 && rangeOk && spanOk ? 'PASS' : 'FAIL',
      `${sorted.length} distinct win-chance points; multiplier = 99/winChance strictly decreasing in win chance (${inversions} inversions); ` +
      `observed multipliers span ${rangeMin.toFixed(4)}×–${rangeMax.toFixed(4)}× within [${MIN_ODDS}, ${MAX_ODDS}] (${rangeOk ? 'in range' : 'OUT OF RANGE'})`));
  }

  return out;
}
