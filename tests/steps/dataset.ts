/**
 * Steps 11–12: Dataset Integrity & Coverage
 *
 * POPULATION BINDING (G-BIND). Taking the audited population from the dataset's OWN header makes the
 * plan self-referential: comparing `bets.length` to a planned total in the header, or the observed
 * phase counts to `meta.phases`, reads fields inside the file being scored. Shrink the data, doctor
 * the header, re-pin `DATASET_SHA256`, and the repo is internally consistent again. The SHA pin
 * cannot help; it proves the file has not changed since WE pinned it, not that it is the capture.
 *
 * The expected cardinality therefore comes from CODE constants (`EXPECTED_BETS`, `EXPECTED_SEEDS`,
 * `EXPECTED_EPOCHS`, `EXPECTED_PHASES` in `src/config.ts`) and `meta` is checked AGAINST them: the
 * header is evidence to be reconciled, not the plan. Registered as `coherent population shrink` in
 * `tests/mutations.json`.
 */

import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { bandMode, payoutBasisPoints, PAYOUT_NUMERATOR, EXPECTED_BETS, EXPECTED_SEEDS, EXPECTED_CAPTURES, EXPECTED_EPOCHS, EXPECTED_PHASES, EXPECTED_PHASE_BETS, EXPECTED_WIN_CHANCES, BASE_STAKE, ELEVATED_STAKE, PHASE_A_MIN_BETS_PER_CLASS } from '../../src/config';

const MODES = ['under', 'over', 'inside', 'outside'] as const;
/** 9900/bp as a display value (the exact quotient). */
const PAYOUT_NUMERATOR_OVER = (bp: number) => PAYOUT_NUMERATOR / bp;

export function run(ctx: VerifyContext): StepResult[] {
  const { bets, seeds, meta, datasetSha256, expectedDatasetHash } = ctx;

  // ── Step 11: Dataset integrity ───────────────────────────────────────────────
  const hashOk = datasetSha256 === expectedDatasetHash;
  const seed0Ok = seeds.length > 0 && seeds[0].serverSeed != null;      // recurring miss guard
  const allRevealed = seeds.every(s => s.serverSeed != null);
  // (a) the population IS the audited population, against src/config.ts, never against meta
  const betCountOk = bets.length === EXPECTED_BETS;
  const seedCountOk = seeds.length === EXPECTED_SEEDS;
  // (b) every epoch is the epoch the plan says it is: its size, its phase, its capture file
  const perEpoch = new Map<number, number>();
  for (const b of bets) perEpoch.set(b.epoch, (perEpoch.get(b.epoch) ?? 0) + 1);
  const seedOf = new Map(seeds.map((s) => [s.epoch, s]));
  let epochPlanOk = 0;
  for (const e of EXPECTED_EPOCHS) {
    const s = seedOf.get(e.epoch);
    if (perEpoch.get(e.epoch) === e.bets && s && s.phaseId === e.phaseId && s.phase === e.phase && s.capture === e.capture && s.plannedBets === e.bets) epochPlanOk++;
  }
  const epochsOk = perEpoch.size === EXPECTED_SEEDS && epochPlanOk === EXPECTED_SEEDS;
  // (c) each epoch's nonces are exactly 0..size−1 with the size from the plan: a withheld trailing
  //     bet cannot be absorbed by shrinking a declared size, because the size is not declared here
  let nonceGaps = 0;
  const byEpochNonces = new Map<number, Set<number>>();
  for (const b of bets) {
    let ns = byEpochNonces.get(b.epoch); if (!ns) { ns = new Set(); byEpochNonces.set(b.epoch, ns); }
    ns.add(b.nonce);
  }
  for (const e of EXPECTED_EPOCHS) {
    const ns = byEpochNonces.get(e.epoch);
    let gap = !ns || ns.size !== e.bets;
    for (let i = 0; !gap && i < e.bets; i++) if (!ns!.has(i)) gap = true;
    if (gap) nonceGaps++;
  }
  // (d) the header is RECONCILED against the constants, not trusted as the plan
  const captures = Array.isArray(meta.captures) ? meta.captures : [];
  const captureBets = (c: number) => EXPECTED_EPOCHS.filter((e) => e.capture === c).reduce((a, e) => a + e.bets, 0);
  const captureEpochs = (c: number) => EXPECTED_EPOCHS.filter((e) => e.capture === c).length;
  const capturesOk = captures.length === EXPECTED_CAPTURES
    && captures.every((c, i) => c.index === i && c.bets === captureBets(i) && c.epochs?.count === captureEpochs(i) && c.status === 'completed' && c.verifierReplies === captureBets(i));
  const metaAgrees = meta.plannedTotal === EXPECTED_BETS && meta.epochs === EXPECTED_SEEDS && capturesOk;
  // (e) one id per bet: a round counted twice would inflate every count above
  const idsOk = new Set(bets.map((b) => b.id)).size === bets.length;
  const countsOk = betCountOk && seedCountOk && epochsOk && nonceGaps === 0 && metaAgrees && idsOk;
  const sizes = [...new Set(EXPECTED_EPOCHS.map((e) => e.bets))].sort((x, y) => x - y);
  const s11 = step(11, 'Dataset Integrity',
    hashOk && seed0Ok && allRevealed && countsOk ? 'PASS' : 'FAIL',
    `SHA-256 pin ${hashOk ? 'match' : 'MISMATCH'}; population bound to src/config.ts, NOT to the dataset header (G-BIND): `
    + `${bets.length}/${EXPECTED_BETS} bets (${betCountOk ? 'ok' : 'WRONG POPULATION'}), ${seeds.length}/${EXPECTED_SEEDS} seeds (${seedCountOk ? 'ok' : 'WRONG POPULATION'}), `
    + `${epochPlanOk}/${EXPECTED_SEEDS} epochs match the plan row for row (size ${sizes.join(' / ')}, phase, capture file) (${epochsOk ? 'ok' : 'EPOCH PLAN MISMATCH'}), ${nonceGaps} epoch(s) not holding exactly the nonces 0..size−1; ${new Set(bets.map((b) => b.id)).size} distinct bet ids (${idsOk ? 'ok' : 'DUPLICATE'}); `
    + `dataset header reconciles with those constants (meta.plannedTotal=${meta.plannedTotal}, meta.epochs=${meta.epochs}, ${captures.length} capture files each complete, with its own epoch and bet counts: ${metaAgrees ? 'ok' : 'DISAGREES'}); `
    + `seed[0].serverSeed ${seed0Ok ? 'present' : 'NULL'}; ${seeds.filter(s => s.serverSeed != null).length}/${seeds.length} seeds revealed (100% verifiable ${allRevealed ? 'yes' : 'NO'})`,
  );

  // ── Step 12: Phase & mode coverage (DICE-15) ─────────────────────────────────
  // The plan is EXPECTED_PHASES (code), not meta.phases (inside the evidence). Both directions:
  // every planned phase present at its planned count, and no phase in the data that is not planned.
  const byPhase: Record<string, number> = {};
  for (const b of bets) byPhase[b.phaseId] = (byPhase[b.phaseId] || 0) + 1;
  const planOk = Object.entries(EXPECTED_PHASE_BETS).every(([k, n]) => byPhase[k] === n)
    && Object.keys(byPhase).every(k => k in EXPECTED_PHASE_BETS);
  // meta.phases is reconciled against the same constants rather than believed.
  const metaPhasesOk = EXPECTED_PHASES.every((ph) => meta.phases?.[ph.id]?.bets === EXPECTED_PHASE_BETS[ph.id] && meta.phases?.[ph.id]?.stake === ph.stake && meta.phases?.[ph.id]?.phase === ph.phase)
    && Object.keys(meta.phases ?? {}).every(k => k in EXPECTED_PHASE_BETS);
  // Per phase: the phase letter, the one stake (the served 8-dp string) and the win chances are the plan's.
  const phaseNotes: string[] = [];
  let phasesOk = true;
  for (const ph of EXPECTED_PHASES) {
    const pb = bets.filter((b) => b.phaseId === ph.id);
    const letterOk = pb.every((b) => b.phase === ph.phase);
    const stakeOk = pb.length > 0 && pb.every((b) => String(b.betAmount) === ph.stake);
    const wantBps = new Set(ph.winChances.map((w) => Math.round(w * 100)));
    const gotBps = new Set(pb.map((b) => payoutBasisPoints(b.params)));
    const bpsOk = gotBps.size === wantBps.size && [...gotBps].every((x) => wantBps.has(x));
    const modes = new Set(pb.map((b) => bandMode(b.params)));
    if (!(letterOk && stakeOk && bpsOk)) phasesOk = false;
    phaseNotes.push(`${ph.id} ${pb.length} at ${ph.stake} (${stakeOk ? 'ok' : 'STAKE MISMATCH'}), win chance ${[...gotBps].sort((x, y) => x - y).map((x) => x / 100).join('/')}% (${bpsOk ? 'the plan\'s' : 'NOT the plan\'s'}), modes ${[...modes].join(',')}`);
  }
  // Both stake tiers present (the base stake and the elevated Phase C stake), and no other.
  const stakes = new Set(bets.map(b => String(b.betAmount)));
  const tiersOk = stakes.size === 2 && stakes.has(BASE_STAKE) && stakes.has(ELEVATED_STAKE);
  // Phase A coverage (the phase letter A: the 7 Nov rounds and the A+ top-up): every planned win
  // chance in every one of the four modes, at least PHASE_A_MIN_BETS_PER_CLASS rounds per
  // (mode, win chance) class, both ends of the range (the lowest and the highest planned win chance).
  const aBets = bets.filter((b) => b.phase === 'A');
  const aPlanBps = [...new Set(EXPECTED_PHASES.filter((ph) => ph.phase === 'A').flatMap((ph) => ph.winChances))].map((w) => Math.round(w * 100));
  const cellCount = new Map<string, number>();
  for (const b of aBets) { const k = `${bandMode(b.params)}/${payoutBasisPoints(b.params)}`; cellCount.set(k, (cellCount.get(k) ?? 0) + 1); }
  const wantCells = MODES.flatMap((m) => aPlanBps.map((bp) => `${m}/${bp}`));
  const cellsPresent = wantCells.filter((k) => (cellCount.get(k) ?? 0) >= PHASE_A_MIN_BETS_PER_CLASS).length;
  const cellMin = Math.min(...wantCells.map((k) => cellCount.get(k) ?? 0));
  const cellsOk = cellsPresent === wantCells.length && cellCount.size === wantCells.length;
  const allBps = new Set(bets.map((b) => payoutBasisPoints(b.params)));
  const planAll = EXPECTED_WIN_CHANCES.map((w) => Math.round(w * 100));
  const endsOk = allBps.has(Math.min(...planAll)) && allBps.has(Math.max(...planAll)) && allBps.size === planAll.length;
  const modesAll = new Set(bets.map(b => bandMode(b.params)));
  const modesOk = MODES.every(m => modesAll.has(m));
  const s12 = step(12, 'Phase & Mode Coverage',
    planOk && metaPhasesOk && phasesOk && tiersOk && cellsOk && endsOk && modesOk ? 'PASS' : 'FAIL',
    `phases ${JSON.stringify(byPhase)} match the CODE plan ${JSON.stringify(EXPECTED_PHASE_BETS)} (${planOk}); dataset header meta.phases reconciles with it (${metaPhasesOk}); `
    + `per phase: ${phaseNotes.join('; ')}; `
    + `both stake tiers present, ${BASE_STAKE} and ${ELEVATED_STAKE} USDT, and no other (${tiersOk}); `
    + `Phase A (A and the A+ top-up, ${aBets.length} rounds): ${cellsPresent}/${wantCells.length} (mode × win chance) classes hold at least ${PHASE_A_MIN_BETS_PER_CLASS} rounds (fewest ${cellMin}), all 4 modes [${[...modesAll].join(',')}] at each of the ${aPlanBps.length} planned win chances (${cellsOk}); `
    + `both ends of the planned range played, ${Math.min(...planAll) / 100}% (${PAYOUT_NUMERATOR_OVER(Math.min(...planAll))}×) and ${Math.max(...planAll) / 100}% (${PAYOUT_NUMERATOR_OVER(Math.max(...planAll))}×) (${endsOk}). There is no separate tail phase: the 99× setting is the A+ top-up and the 49.5× setting is the 2% win chance of Phase A`,
  );

  return [s11, s12];
}
