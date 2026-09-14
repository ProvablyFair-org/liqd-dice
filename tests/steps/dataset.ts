
import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { bandMode, EXPECTED_BETS, EXPECTED_SEEDS, EXPECTED_EPOCH_SIZE, EXPECTED_PHASE_BETS } from '../../src/config';

export function run(ctx: VerifyContext): StepResult[] {
  const { bets, seeds, meta, datasetSha256, expectedDatasetHash } = ctx;

  // ── Step 11: Dataset integrity ───────────────────────────────────────────────
  const hashOk = datasetSha256 === expectedDatasetHash;
  const seed0Ok = seeds.length > 0 && seeds[0].serverSeed != null;      // recurring miss guard
  const allRevealed = seeds.every(s => s.serverSeed != null);
  // (a) the population IS the audited population — against src/config.ts, never against meta
  const betCountOk = bets.length === EXPECTED_BETS;
  const seedCountOk = seeds.length === EXPECTED_SEEDS;
  // (b) every epoch is a full epoch, and the epoch size is the audited one
  const perEpoch = new Map<number, number>();
  for (const b of bets) perEpoch.set(b.epoch, (perEpoch.get(b.epoch) ?? 0) + 1);
  const epochsOk = perEpoch.size === EXPECTED_SEEDS
    && [...perEpoch.values()].every(n => n === EXPECTED_EPOCH_SIZE)
    && EXPECTED_SEEDS * EXPECTED_EPOCH_SIZE === EXPECTED_BETS;
  // (c) each epoch's nonces are exactly 0..EXPECTED_EPOCH_SIZE−1 — a withheld trailing bet cannot
  //     be absorbed by shrinking the declared epoch size, because the size is no longer declared here
  let nonceGaps = 0;
  const byEpochNonces = new Map<number, Set<number>>();
  for (const b of bets) {
    let s = byEpochNonces.get(b.epoch); if (!s) { s = new Set(); byEpochNonces.set(b.epoch, s); }
    s.add(b.nonce);
  }
  for (const [, ns] of byEpochNonces) {
    for (let i = 0; i < EXPECTED_EPOCH_SIZE; i++) if (!ns.has(i)) { nonceGaps++; break; }
  }
  // (d) the header is RECONCILED against the constants, not trusted as the plan
  const metaAgrees = meta.plannedTotal === EXPECTED_BETS && meta.epochSize === EXPECTED_EPOCH_SIZE;
  const countsOk = betCountOk && seedCountOk && epochsOk && nonceGaps === 0 && metaAgrees;
  const s11 = step(11, 'Dataset Integrity',
    hashOk && seed0Ok && allRevealed && countsOk ? 'PASS' : 'FAIL',
    `SHA-256 pin ${hashOk ? 'match' : 'MISMATCH'}; population bound to src/config.ts, NOT to the dataset header (G-BIND): `
    + `${bets.length}/${EXPECTED_BETS} bets (${betCountOk ? 'ok' : 'WRONG POPULATION'}), ${seeds.length}/${EXPECTED_SEEDS} seeds (${seedCountOk ? 'ok' : 'WRONG POPULATION'}), `
    + `${perEpoch.size} epochs × ${EXPECTED_EPOCH_SIZE} bets each (${epochsOk ? 'ok' : 'EPOCH SIZE/COUNT MISMATCH'}), ${nonceGaps} epoch(s) missing a nonce in 0..${EXPECTED_EPOCH_SIZE - 1}; `
    + `dataset header reconciles with those constants (meta.plannedTotal=${meta.plannedTotal}, meta.epochSize=${meta.epochSize}: ${metaAgrees ? 'ok' : 'DISAGREES'}); `
    + `seed[0].serverSeed ${seed0Ok ? 'present' : 'NULL'}; ${seeds.filter(s => s.serverSeed != null).length}/${seeds.length} seeds revealed (100% verifiable ${allRevealed ? 'yes' : 'NO'})`,
  );

  // ── Step 12: Phase & mode coverage ───────────────────────────────────────────
  const byPhase: Record<string, number> = {};
  for (const b of bets) byPhase[b.phase] = (byPhase[b.phase] || 0) + 1;
  // The plan is EXPECTED_PHASE_BETS (code), not meta.phases (inside the evidence). Both directions:
  // every declared phase present at its declared count, and no phase in the data that is not declared.
  const planOk = Object.entries(EXPECTED_PHASE_BETS).every(([k, n]) => byPhase[k] === n)
    && Object.keys(byPhase).every(k => k in EXPECTED_PHASE_BETS);
  // meta.phases is reconciled against the same constants rather than believed.
  const metaPhasesOk = Object.entries(EXPECTED_PHASE_BETS).every(([k, n]) => meta.phases?.[k]?.bets === n)
    && Object.keys(meta.phases ?? {}).every(k => k in EXPECTED_PHASE_BETS);
  const modes = new Set(bets.map(b => bandMode(b.params)));
  const modesOk = ['under', 'over', 'inside', 'outside'].every(m => modes.has(m as any));
  // stake independence coverage: a $10 phase and a $0.10 phase both present
  const stakes = new Set(bets.map(b => Number(b.betAmount)));
  const stakeOk = stakes.has(10) && stakes.has(0.1);
  const s12 = step(12, 'Phase & Mode Coverage',
    planOk && metaPhasesOk && modesOk && stakeOk ? 'PASS' : 'FAIL',
    `phases ${JSON.stringify(byPhase)} match the CODE plan ${JSON.stringify(EXPECTED_PHASE_BETS)} (${planOk}); dataset header meta.phases reconciles with it (${metaPhasesOk}); `
    + `all 4 modes present [${[...modes].join(',')}]; `
    + `stake-independence phases present ($10 and $0.10: ${stakeOk})`,
  );

  return [s11, s12];
}
