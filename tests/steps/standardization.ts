/**
 * Steps 18–21: Standardization-parity steps. Each is recomputed from the raw dataset (or the
 * pure-arithmetic engine), never read from an operator summary field, and each carries a
 * coverage assertion so a pass over an empty set cannot occur.
 *
 *   18  Bet-Size Invariance      — roll/edge independent of wager (Phase C, $10)
 *   19  Artifact Hash + Value-Domain Integrity — pinned SHA-256 of the dataset AND of the
 *                                  simulation artifacts, plus a value-domain check of every numeric
 *                                  leaf of the committed simulation-results.json / report-figures.json
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
import { quotedMultiplier, payoutBasisPoints, PAYOUT_NUMERATOR, effectiveEdge, diceWin, bandMode, continuousWinChancePct, settledCredit, servedRollMatches, SCALE, MIN_ODDS, MAX_ODDS, SIMULATION_SHA256, SIMULATION_HTML_SHA256 } from '../../src/config';
import { domainRules, validateDomains, describeDomainFailures } from '../../src/domains';

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
      const local = diceRoll(ss, b.clientSeed, b.nonce) / SCALE;
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

  // ── Step 19: Artifact Hash Integrity ────────────────────────────────────────
  // Three artifacts of record, all reconciled here:
  //   • the pinned capture — its SHA-256 must equal the pin in src/config.ts;
  //   • outputs/simulation-results.json (+ its twin chart) — the simulation Steps 16–17 score.
  //     Pinned, because otherwise `npm test` regenerates it from fresh
  //     seeds seconds before scoring it, and the artifact of record is whatever the last run
  //     happened to produce. `SIM_FRESH=1` (set by `npm run test:full`) RECORDS the fresh hash
  //     instead of enforcing the pin, so a deliberate regeneration is not a false alarm.
  //     DELIBERATELY NOT AN ABORT: exiting before any scored step on a sim-hash mismatch means
  //     an artifact forgery is reported by a forged-artifact battery
  //     as NOT RUN rather than CAUGHT — a pin that pre-empts the guards
  //     tells you the pin works and nothing about whether the statistics are real. Here the run
  //     continues, the statistical guards in Step 16/17 get their shot, and this step records the
  //     mismatch. Nor is the pin a defence against a fabricating auditor, who re-pins in the same
  //     commit; that is what Step 16's two-sided screen and its structural validation are for.
  //   • outputs/report-figures.json — the derived figures the REPORT quotes. Every number in it
  //     is a deterministic function of the pinned capture, so the committed file must equal a
  //     fresh recomputation exactly. Without this the file would be an unscored artifact: a
  //     forged settled-RTP span or Phase-D z-score would change the published prose and no step
  //     would notice.
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
      // A regeneration that reproduces the pinned bytes records exactly what the default path
      // records: the mode of the run is not evidence, and a committed artifact must not change with
      // it (F8/F9 — run metadata absent, not excluded). Only a fresh run that DISAGREES with the pin
      // is described differently, and that disagreement is then a real diff against the committed copy.
      if (simFresh && actual !== pin.expected) {
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
    // FIVE outcomes, each named and each a HARD FAIL except agreement:
    //
    //   absent | parse-error | schema-error | dataset-mismatch | field-mismatch  → FAIL
    //   agreement                                                                → PASS
    //
    // ── WHY EVERY NON-AGREEMENT IS A FAIL ────────────────────────────────────────────────────────
    // Swallowing a `JSON.parse` throw (`catch { storedBody = '<unparseable>' }`) leaves `storedHash`
    // as the empty string, which falls into the "computed from a different dataset" branch, which
    // reads as STALE — a benign condition that "this run regenerates". A required artifact of
    // record containing the literal bytes `{not JSON` then scores a clean 21/21 Full Pass, and the
    // run rewrites the file, erasing the thing it failed to read. A verifier must never approve
    // an artifact it could not read, and a parse failure is not permission to regenerate.
    //
    // There is no stale branch either. A `datasetSha256` that does not match the capture being
    // scored means the shipped figures were derived from some other capture; that is a mismatch to
    // report, not a licence to silently overwrite. Regeneration lives in one explicit place
    // (`npm run report`), so this step can afford to be strict — and `npm run verify` no longer
    // writes here at all, which is what makes "running twice fails twice" true.
    //
    // ── WHY ABSENCE IS A FAIL ────────────────────────────────────────────────────────────────────
    // A branch reading `absent — this run writes it` and leaving the step PASSING is the
    // existsSync fall-through a forged-artifact battery flags: deleting a shipped
    // artifact then scores a clean 21/21 Full Pass.
    //
    // The question the fall-through begs is whether report-figures.json is an ARTIFACT OF RECORD
    // or a RUN PRODUCT, and the repo answers it in three places already: `.gitignore` un-ignores it
    // explicitly (`!outputs/report-figures.json`), MANIFEST.md#evidence lists it as evidence item **E15**,
    // and the overview cites it BY NAME as the trace for published figures (`report-figures.json →
    // boundary`, `→ cherryPickPower`). It is a producing
    // artifact — the source those numbers are allowed to trace to. So it is an artifact of
    // record, and its absence means the shipped copy of the report's derived figures is gone: nobody
    // can check that the published numbers are the ones this pipeline produced. That must FAIL.
    //
    // It is NOT sufficient that a deleted file regenerates byte-identically. It does — verified —
    // but that only shows the figures are a deterministic function of the pinned dataset. A repo
    // with a genuine absent-artifact defect regenerates identically too, so byte-identity cannot
    // separate the two cases; the repo has to make the call. This is the call. Declared as
    // limitation L16 in MANIFEST.md.
    //
    // CONSEQUENCE, stated so it is not a surprise: outputs/report-figures.json MUST be committed.
    // A clone that does not carry it fails Step 19 on its first run, by design.
    // The schema this artifact must satisfy, declared here rather than inferred from whatever the
    // file happens to contain: the two envelope fields plus every top-level figure group the report
    // cites. Derived from the producer (`computeReportFigures`) so the two cannot drift apart.
    // No generatedAt: the artifact carries no run metadata (absent, not excluded — F8).
    const RF_ENVELOPE_FIELDS = ['datasetSha256'] as const;
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
          delete body.datasetSha256;
          const storedBody = JSON.stringify(body, null, 2);
          if (storedBody !== fresh) {
            rfForged = true;
            // Name the first disagreeing top-level group, so the failure points somewhere.
            const firstBad = Object.keys(freshObj).find((k) => JSON.stringify(body[k]) !== JSON.stringify(freshObj[k]))
              ?? Object.keys(body).find((k) => !(k in freshObj)) ?? '(field order)';
            rfNote = `outputs/report-figures.json FIELD MISMATCH — it claims THIS dataset but DISAGREES with recomputation from it (first disagreeing group: ${firstBad}) — the report's derived figures do not follow from the capture`;
          } else {
            rfNote = 'outputs/report-figures.json reconciles with a fresh recomputation from the pinned dataset, field for field '
              + `(${RF_REQUIRED_FIELDS.length}/${RF_REQUIRED_FIELDS.length} required fields present, dataset hash matches)`;
          }
        }
      }
    }
    // ── VALUE DOMAINS of the committed artifacts of record ──────────────────────────────────────
    // A SHA-256 pin proves the bytes did not move since we pinned them; it says nothing about
    // whether a value inside is physically possible, and a forger re-pins in the same commit. So
    // every numeric leaf of the two committed artifacts the report quotes — simulation-results.json
    // (pinned) and report-figures.json (recomputed above) — must be a value the game physically
    // admits, with EVERY BOUND derived from src/domains.ts (which reads src/config.ts: the audited
    // population, the sample depths, the odds limits, the roll grid) and NEVER from the file being
    // checked. A leaf with NO declared domain fails too, so a new unbounded field cannot slip in
    // quietly. Ported from the sibling liqd-plinko src/domains.ts. (DICE-27.)
    const rules = domainRules();
    const domainBad: string[] = [];
    let domainLeaves = 0;
    for (const rel of ['simulation-results.json', 'report-figures.json'] as const) {
      const p = path.join(ctx.outputsDir, rel);
      if (!fs.existsSync(p)) {
        // Absence is already a FAIL above (sim) / a FAIL in the report-figures branch; Step 19 does
        // not double-report it, but it must not silently score a file it never read.
        domainBad.push(`${rel}: not present, so its values were not domain-checked`);
        continue;
      }
      let doc: unknown;
      try { doc = JSON.parse(fs.readFileSync(p, 'utf8')); }
      catch (e) { domainBad.push(`${rel}: not valid JSON (${(e as Error).message})`); continue; }
      const r = validateDomains(doc, rules[rel]);
      domainLeaves += r.checked;
      domainBad.push(...describeDomainFailures(rel, r));
    }
    const domainOk = domainBad.length === 0;

    out.push(step(19, 'Artifact Hash + Value-Domain Integrity', hashOk && !rfForged && !simForged && domainOk ? 'PASS' : 'FAIL',
      `SHA-256 of data/dice-master-6700bets.json = ${ctx.datasetSha256.slice(0, 16)}… ${hashOk ? 'matches' : '≠'} the pin ${ctx.expectedDatasetHash.slice(0, 16)}… (loader aborts on mismatch before any step runs); `
      + `${simNotes.join('; ')} — the pin proves the scored simulation is the committed one, NOT that its statistics are real (that is Step 16's two-sided uniformity screen plus its structural validation of the win counts and standard errors); `
      + `${rfNote}`
      + `; value domains: ${domainLeaves} numeric leaf/leaves of the committed simulation-results.json and report-figures.json checked against bounds derived from src/config.ts (a leaf out of domain OR with no declared domain fails)`
      + (domainOk ? '' : ` — FAIL: ${domainBad.slice(0, 5).join('; ')}${domainBad.length > 5 ? `; +${domainBad.length - 5} more` : ''}`)));
  }

  // ── Step 20: Settlement Determinism (settlement table) ──────────────────────
  // ANTI-CIRCULAR AND EXACT. The expected credit is built from the auditor's OWN derived
  // multiplier — pure band arithmetic; the served `multiplier` field is never read here, Step 7 is
  // what pins that — and settled through the same two-stage rule as Steps 8/10, with ZERO tolerance.
  //
  // ── WHICH DERIVATION, AND WHY IT MATTERS ─────────────────────────────────────────────────────
  // The multiplier is the rational 9900/basisPoints. Reaching it through
  // `quotedMultiplier(params)`, the float closed form `(100/winChance%)·(1−edge)`, gives the SAME
  // NUMBER over the rationals and a DIFFERENT binary64. `continuousWinChancePct` computes
  // `upper − lower` in binary64, and for many 2-dp bands that lands a fraction of an ULP off, which
  // survives the divide and then changes the 8-dp stage-1 rounding:
  //
  //   over 79.52  → wc 20.480000000000004 → float 4.833984374999999 → round8 4.83398437
  //                                       → quotient 9900/2048 = 4.833984375 → round8 4.83398438
  //   over 99.99  → wc 0.010000000000005116 → float 9899.999999994936 → round8 9899.99999999
  //                                       → quotient 9900/1 = 9900   → round8 9900
  //
  // At a $1 stake those are different credits, so a CORRECT operator payout of $9,900.00 would be
  // rejected as a one-unit discrepancy. Swept exhaustively over every 2-dp band in all four
  // modes, the two paths disagree on 12,046 bands at exactly three basis points — 1, 2048 and 6144 —
  // and nowhere else. None of them occurs in this capture, which is why the float path never fires
  // here; "the data happens not to expose it" is not a reason to keep a wrong comparator, and the
  // bands concerned include the 9900× extreme a production recapture is meant to probe.
  //
  // The expected multiplier is derived from the BAND, never from the served field; what matters is
  // which exact arithmetic derives it. `PAYOUT_NUMERATOR / payoutBasisPoints(p)` is an
  // integer-over-integer quotient — the operator's own number system (see `creditResidualSign`).
  // Regression vectors: `tests/dice/settlementTests.ts`, "Step 20 expected-credit derivation".
  //
  // A credit compared against the RAW product `betAmount × quotedMultiplier` at 1e-6 could not see
  // a wallet- or credit-sized edit either, which is why there is no tolerance here.
  // `round8(quotedMultiplier(params))` is verified equal to
  // `round8(servedMultiplier)` on all 2,807 captured wins, so the derived path settles to exactly
  // the same 8-dp credit as the served path — the equality is exact, not approximate.
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
      `${chk}/${bets.length} bets: outcome (win/loss) and credited amount are fully determined by (roll, band, stake) — credit == ROUND_HALF_EVEN_8(stake × ROUND_8(PAYOUT_NUMERATOR/basisPoints)), the integer-basis-point quotient rather than the float closed form (D16), with zero tolerance — and match the served settlement — ${bad} mismatch` +
      (fails.length ? ` (e.g. ${fails.join('; ')})` : '') +
      `; coverage: modes [${[...modesSeen].join(',')}], ${wins} wins / ${losses} losses` +
      (coverOk ? '' : '; COVERAGE FAIL')));
  }

  // ── Step 21: Multiplier Monotonicity & Range ────────────────────────────────
  {
    // Distinct captured win chances → their QUOTED multiplier (the formula 99/winChance computed from
    // each captured band; this step never reads the served field — on wins Step 7 binds the served
    // value to the same rational, 9900/basisPoints), sorted by win chance ascending.
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
    const rangeOk = rangeMin >= MIN_ODDS && rangeMax <= MAX_ODDS;   // exact bound, no tolerance
    const spanOk = sorted.length >= 100;      // a rich win-chance sweep, not a handful of points
    out.push(step(21, 'Multiplier Monotonicity & Range', inversions === 0 && rangeOk && spanOk ? 'PASS' : 'FAIL',
      `${sorted.length} distinct win-chance points; quoted multiplier (formula 99/winChance, computed from each captured band; on wins Step 7 binds the served value to the same rational, 9900/basisPoints) strictly decreasing in win chance (${inversions} inversions); ` +
      `quoted multipliers for the captured bands span ${rangeMin.toFixed(4)}×–${rangeMax.toFixed(4)}× within [${MIN_ODDS}, ${MAX_ODDS}] (${rangeOk ? 'in range' : 'OUT OF RANGE'})`));
  }

  return out;
}
