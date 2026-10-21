/**
 * Steps 1–4: Commit-Reveal Integrity
 */

import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { commitHash, diceRoll } from '../../src/rng';
import { servedRollMatches, EXPECTED_EPOCH_SIZE, SCALE } from '../../src/config';

export function run(ctx: VerifyContext): StepResult[] {
  const { seeds, byHash, bets, seedMap } = ctx;

  // ── Step 1: Seed hash integrity ─────────────────────────────────────────────
  // liqd commitment = SHA-256( utf8_bytes( serverSeed_hex_string ) ), via commitHash.
  let checked = 0, fails = 0;
  for (const s of seeds) {
    if (!s.serverSeed) continue;
    if (commitHash(s.serverSeed) !== s.hashedServerSeed) fails++;
    checked++;
  }
  const s1 = step(1, 'Seed Hash Integrity',
    fails === 0 && checked === seeds.length ? 'PASS' : 'FAIL',
    `${checked}/${seeds.length} revealed seeds checked; SHA-256(utf8(serverSeed)) == hashedServerSeed; ${fails} mismatches`,
  );

  // ── Step 2: Next-seed pre-commitment chain ──────────────────────────────────
  const byEpoch = [...seeds].sort((a, b) => a.epoch - b.epoch);
  let promoChecked = 0, promoFails = 0;
  for (let i = 0; i + 1 < byEpoch.length; i++) {
    promoChecked++;
    if (byEpoch[i].nextHashedServerSeed !== byEpoch[i + 1].hashedServerSeed) promoFails++;
  }
  const expectedTransitions = seeds.length - 1;

  // PRE-CAPTURE LINK. The 133 in-capture transitions show the chain was never
  // broken DURING the capture, but on their own they say nothing about epoch 0: its commitment is
  // simply the first thing the capture saw. The dataset also carries `meta.preCapture` — the seed
  // pair that was active BEFORE the first bet, with its own revealed server seed and its
  // `nextHashedServerSeed`. Two checks turn that into evidence: the pre-capture seed must hash to
  // its own commitment, and its `nextHashedServerSeed` must BE epoch 0's commitment. Together they
  // place epoch 0's commitment EARLIER IN THE CHAIN than the first bet's epoch. Without them the
  // field sits in the dataset and is read by nothing.
  //
  // WHAT IT IS NOT. A hash chain orders records; it does not date
  // them. This establishes that epoch 0's commitment was already fixed by a record the capture holds
  // from before the first bet — as recorded BY THE CAPTURE. The anchor for "before" is the auditor's
  // own capture record, not an independently authenticated timestamp, so the detail string below
  // says "conditional on the attested chronology" and names limitation L18. Wording such as
  // "the operator could not have chosen it after seeing a bet" would claim more than a matching
  // hash can carry.
  const pre = ctx.meta.preCapture as
    { hashedServerSeed?: string; revealedServerSeed?: string; nextHashedServerSeed?: string } | null | undefined;
  const epoch0 = byEpoch[0];
  let preState: string;
  let preOk = false;
  if (!pre || !pre.hashedServerSeed || !pre.revealedServerSeed || !pre.nextHashedServerSeed) {
    preState = 'no meta.preCapture record — epoch 0\'s commitment has no pre-capture witness';
  } else {
    const preCommitOk = commitHash(pre.revealedServerSeed) === pre.hashedServerSeed;
    const preLinkOk = pre.nextHashedServerSeed === epoch0.hashedServerSeed;
    preOk = preCommitOk && preLinkOk;
    preState = preOk
      ? 'pre-capture link verified: the pair the capture recorded before the first bet reveals a seed that hashes to its own commitment, and its nextHashedServerSeed IS epoch 0\'s commitment — so epoch 0\'s commitment was already fixed by an EARLIER LINK IN THE CHAIN. A hash chain orders records, it does not date them: that this link predates the first bet is the auditor\'s capture record — an ASSUMED premise, not independently authenticated timing (declared limitation L18), so the no-post-hoc-choice reading of it is CONDITIONAL on that attested chronology'
      : `pre-capture link BROKEN (commitment ${preCommitOk ? 'ok' : 'MISMATCH'}, link to epoch 0 ${preLinkOk ? 'ok' : 'MISMATCH'})`;
  }

  const s2 = step(2, 'Next-Seed Pre-Commitment Chain',
    promoFails === 0 && promoChecked === expectedTransitions && preOk ? 'PASS' : 'FAIL',
    (promoFails === 0
      ? `${promoChecked}/${expectedTransitions} transitions: nextHashedServerSeed == next epoch's hashedServerSeed (chain INTACT)`
      : `${promoChecked - promoFails}/${expectedTransitions} match; ${promoFails} mismatch`)
    + `; ${preState}`,
  );

  // ── Step 3: Hash consistency within epoch ────────────────────────────────────
  const betsByEpoch = new Map<number, typeof bets>();
  for (const b of bets) {
    const arr = betsByEpoch.get(b.epoch) ?? [];
    arr.push(b);
    betsByEpoch.set(b.epoch, arr);
  }
  let epochsMultipleHashes = 0;
  for (const [, epochBets] of betsByEpoch) {
    const hashes = new Set(epochBets.map(b => b.hashedServerSeed));
    if (hashes.size !== 1) epochsMultipleHashes++;
  }
  const s3CoverageOk = betsByEpoch.size === seeds.length;
  const s3 = step(3, 'Hash Consistency Within Epoch',
    epochsMultipleHashes === 0 && s3CoverageOk ? 'PASS' : 'FAIL',
    `${betsByEpoch.size}/${seeds.length} epochs: all bets within each epoch share the same hashedServerSeed; ${epochsMultipleHashes} violations`,
  );

  // ── Step 4: Nonce audit ──────────────────────────────────────────────────────
  // Per epoch: single client seed, nonces contiguous from nonceStart. A gap is a disclosed
  // artifact only if the seed is revealed AND every recorded bet's roll recomputes; else hard-fail.
  const hardFailures: string[] = [];
  const disclosedGaps: string[] = [];
  let epochsChecked = 0;
  let trailingAuditorRecorded = false;

  for (const [hash, epochBets] of byHash) {
    const sorted = [...epochBets].sort((a, b) => a.nonce - b.nonce);
    const nonces = sorted.map(b => b.nonce);
    const epochNum = sorted[0].epoch;
    const phase = sorted[0].phase;

    const clientSeeds = new Set(sorted.map(b => b.clientSeed));
    if (clientSeeds.size !== 1) hardFailures.push(`Epoch ${epochNum}: ${clientSeeds.size} distinct client seeds`);

    const nonceSet = new Set(nonces);
    const minNonce = Math.min(...nonces);
    const maxNonce = Math.max(...nonces);
    // Nonce-REUSE guard: interior contiguity alone treats a duplicated
    // nonce as a benign "gap", so a replayed draw could pass. Require distinct nonces = bet count.
    if (nonceSet.size !== nonces.length) {
      hardFailures.push(`Epoch ${epochNum}: nonce reuse — ${nonces.length} bets but only ${nonceSet.size} distinct nonces`);
    }
    const missing: number[] = [];
    for (let n = minNonce; n <= maxNonce; n++) if (!nonceSet.has(n)) missing.push(n);

    // Withholding guard.
    // Interior contiguity alone cannot see bets withheld BEFORE the first or AFTER the last
    // recorded nonce. The three bounds below have DIFFERENT evidentiary weight:
    //   • leading  — operator-sourced (the rotate response's post-rotation nonce), a real guard;
    //   • epoch size — the capture placed exactly meta.epochSize bets per pair, so a short epoch
    //                  exposes a dropped bet ANYWHERE (interior or last), a real invariant;
    //   • trailing — operator-witnessed ONLY if operatorBetCount was captured; otherwise nonceEnd
    //                is the auditor's OWN last recorded nonce and can be checked for internal
    //                consistency only. Trailing withholding is not observable client-side (R-ORPHAN).
    const seedEntry = seeds.find(s => s.hashedServerSeed === hash);
    if (!seedEntry) {
      hardFailures.push(`Epoch ${epochNum}: no seed entry for hash ${hash.slice(0, 12)}…`);
    } else {
      if (seedEntry.nonceStart != null && minNonce !== seedEntry.nonceStart) {
        hardFailures.push(`Epoch ${epochNum}: first observed nonce ${minNonce} != operator post-rotation nonce ${seedEntry.nonceStart} (leading bets withheld?)`);
      }
      // G-BIND: the epoch size comes from src/config.ts, NOT from
      // `ctx.meta.epochSize`. Read from the header, this guard catches only an INCOHERENT forgery —
      // a reviewer dropped nonces 30–49 from every epoch, set `meta.epochSize = 30`, and the line
      // agreed with the shrunken data. Against a coherent shrink a header-sourced bound is not an
      // invariant at all.
      if (epochBets.length !== EXPECTED_EPOCH_SIZE) {
        hardFailures.push(`Epoch ${epochNum}: ${epochBets.length} bets != audited epoch size ${EXPECTED_EPOCH_SIZE} (src/config.ts)`);
      }
      if (ctx.meta.epochSize !== EXPECTED_EPOCH_SIZE) {
        hardFailures.push(`Epoch ${epochNum}: dataset header epochSize ${ctx.meta.epochSize} != audited epoch size ${EXPECTED_EPOCH_SIZE}`);
      }
      if (seedEntry.operatorBetCount != null) {
        if (maxNonce !== seedEntry.operatorBetCount - 1) {
          hardFailures.push(`Epoch ${epochNum}: last observed nonce ${maxNonce} != operator bet count ${seedEntry.operatorBetCount} - 1 (trailing bets withheld?)`);
        }
      } else {
        if (seedEntry.nonceEnd != null && maxNonce !== seedEntry.nonceEnd) {
          hardFailures.push(`Epoch ${epochNum}: record inconsistent, max nonce ${maxNonce} != recorded nonceEnd ${seedEntry.nonceEnd}`);
        }
        trailingAuditorRecorded = true;
      }
    }

    if (missing.length > 0) {
      const ss = seedMap.get(hash);
      let allVerify = ss !== undefined;
      if (ss) {
        for (const b of sorted) {
          const served = Number(b.roll);
          const local = diceRoll(ss, b.clientSeed, b.nonce) / SCALE;
          if (!servedRollMatches(served, local)) { allVerify = false; break; }
        }
      }
      if (allVerify) disclosedGaps.push(`epoch ${epochNum} (Phase ${phase}), nonce ${missing.join(',')} orphaned; all recorded bets verify`);
      else hardFailures.push(`Epoch ${epochNum}: unverifiable nonce gap at ${missing.join(',')}`);
    }
    epochsChecked++;
  }

  if (epochsChecked !== seeds.length) hardFailures.push(`coverage: audited ${epochsChecked}/${seeds.length} epochs`);
  let s4status: 'PASS' | 'FLAG' | 'FAIL';
  let s4detail: string;
  // A reconstructable capture-retry gap is a FLAG with origin = capture — NEVER a PASS. Profile
  // DICE-04 (decided 2026-09-17): an operator-side gap or repeat is a HARD FAIL; a gap the capture
  // log attributes to an auditor-side retry, where the revealed seed reconstructs every recorded
  // bet, is disclosed with a limitation row and counted, but is verdict-neutral (origin = capture
  // is not scored against the game). Returning PASS here would erase the disclosure. On THIS capture
  // every epoch is fully contiguous 0..49 so the branch does not fire, but the mechanism is present
  // so a future capture that DID retry is disclosed rather than absorbed.
  let s4origin: 'capture' | 'operator' | undefined;
  if (hardFailures.length > 0) {
    s4status = 'FAIL';
    s4detail = `${hardFailures.length} violations: ${hardFailures.slice(0, 3).join('; ')}`;
  } else if (disclosedGaps.length > 0) {
    s4status = 'FLAG';
    s4origin = 'capture';
    s4detail = `LIMITATION ROW (origin = capture, verdict class unchanged): ${epochsChecked} epochs, single client seed each, nonces otherwise contiguous; ${disclosedGaps.length} nonce gap${disclosedGaps.length === 1 ? '' : 's'} attributable to an auditor-side capture retry — the revealed seed reconstructs every recorded bet in the affected epoch, so no operator draw is withheld or unverifiable, but the gap is DISCLOSED not passed over (${disclosedGaps.join('; ')}). An operator-side gap or repeat would be a HARD FAIL; this is not one.`;
  } else {
    s4status = 'PASS';
    s4detail = `${epochsChecked} epochs: single client seed each, ${EXPECTED_EPOCH_SIZE} distinct contiguous nonces 0..${EXPECTED_EPOCH_SIZE - 1} (no interior gaps, no reuse); first nonce == nonceStart (capture default 0 — not operator-witnessed in this capture) in ${epochsChecked}/${seeds.length}; ${EXPECTED_EPOCH_SIZE}/${EXPECTED_EPOCH_SIZE} bets per epoch, epoch size bound to src/config.ts not to the dataset header (G-BIND); `
      + (trailingAuditorRecorded
        ? 'trailing bound is auditor-recorded (no operator end counter in this capture); trailing withholding is not observable client-side, see R-ORPHAN and declared limitation L13 in MANIFEST.md'
        : 'trailing bound operator-witnessed via operatorBetCount');
  }
  const s4 = step(4, 'Nonce Audit', s4status, s4detail, s4origin);

  return [s1, s2, s3, s4];
}
