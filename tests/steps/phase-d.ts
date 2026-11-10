/**
 * Step 14: Client-Seed Control (DICE-06)
 *
 * In every epoch of the production capture the client seed was submitted by the auditor with the
 * rotation that opened the epoch. Two kinds:
 *   • 28 epochs (phases A, A+ and C): `audit` + 12 hex characters, drawn from the browser CSPRNG at
 *     the moment of the rotation, after the commitment for that epoch had been served;
 *   • 5 epochs (Phase D): a player-set seed with a chosen, recognisable text,
 *     `pfaudit-prod-dice-d<k>-` + 12 hex characters of the browser CSPRNG, one per epoch. These five
 *     were drawn when the plan was built and SUBMITTED at the rotation that opened their epoch, after
 *     the commitment for that epoch had been served. They are not predictable from one another: the
 *     12 hex characters are fresh CSPRNG output in each.
 *
 * The step asserts, from the dataset alone:
 *   (a) every epoch's seed record names one client seed and every bet of that epoch carries it;
 *   (b) the 33 client seeds are distinct; the Phase D epochs, and only they, carry the runner's
 *       player-set mark and the player-set format; Phase D holds at least
 *       PHASE_D_MIN_DISTINCT_SEEDS distinct seeds;
 *   (c) the site took what was submitted: the served client seed IS the submitted one in every
 *       epoch, and the commitment the runner held when it submitted the seed IS the epoch's
 *       commitment;
 *   (d) every roll recomputes under that seed, so the seed the player chose is the one LIQD drew
 *       with (not ignored or overridden), counted separately for Phase D;
 *   (e) the seed is load-bearing: altering the client seed changes the roll at the rate the outcome
 *       lattice predicts (1 − 1/10,000 per bet), measured over every bet.
 * That each seed was submitted AFTER its commitment was served is the capture's own record of its
 * own ordering (the runner's `drawnAfter` field and the event times), not an independently
 * authenticated chronology (L18).
 */

import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { diceRoll } from '../../src/rng';
import { servedRollMatches, SCALE, RANGE, EXPECTED_EPOCHS, EXPECTED_SEEDS, PHASE_D_MIN_DISTINCT_SEEDS } from '../../src/config';

/** The auditor's client-seed formats on the production capture. */
const AUDITOR_SEED = /^audit[0-9a-f]{12}$/;
const PLAYER_SEED = /^pfaudit-prod-dice-d[1-9]-[0-9a-f]{12}$/;

export function run(ctx: VerifyContext): StepResult[] {
  const { bets, seeds, seedMap } = ctx;

  // (a) one client seed per epoch, carried by every bet of the epoch
  const seedOfEpoch = new Map(seeds.map((s) => [s.epoch, s.clientSeed]));
  let carried = 0, notCarried = 0;
  for (const b of bets) {
    if (seedOfEpoch.get(b.epoch) === b.clientSeed) carried++; else notCarried++;
  }
  // (b) distinct seeds; the player-set epochs are exactly the plan's Phase D epochs
  const distinct = new Set(seeds.map((s) => s.clientSeed)).size;
  const planPlayer = new Set(EXPECTED_EPOCHS.filter((e) => e.playerSeeds).map((e) => e.epoch));
  let kindOk = 0;
  for (const s of seeds) {
    const wantPlayer = planPlayer.has(s.epoch);
    if (s.playerSet === wantPlayer && (wantPlayer ? PLAYER_SEED : AUDITOR_SEED).test(s.clientSeed)) kindOk++;
  }
  const dSeeds = seeds.filter((s) => planPlayer.has(s.epoch));
  const dDistinct = new Set(dSeeds.map((s) => s.clientSeed)).size;
  // (c) the site took the submitted seed, submitted after the epoch's commitment was served
  const taken = seeds.filter((s) => s.submittedClientSeed === s.clientSeed).length;
  const after = seeds.filter((s) => s.drawnAfter === s.hashedServerSeed).length;

  // (d) every roll recomputes under the epoch's client seed; (e) sensitivity over every bet
  let checked = 0, fails = 0, dChecked = 0, dFails = 0, changed = 0;
  for (const b of bets) {
    const ss = seedMap.get(b.hashedServerSeed);
    if (!ss) continue;
    const local = diceRoll(ss, b.clientSeed, b.nonce);
    const ok = servedRollMatches(Number(b.roll), local / SCALE);
    if (!ok) fails++;
    checked++;
    if (planPlayer.has(b.epoch)) { dChecked++; if (!ok) dFails++; }
    if (diceRoll(ss, b.clientSeed + 'x', b.nonce) !== local) changed++;
  }
  const dBets = bets.filter((b) => planPlayer.has(b.epoch)).length;
  const expectedChanged = checked * (1 - 1 / RANGE);
  // An unused client seed changes 0 rolls; a used one leaves a roll unchanged only on a 1-in-10,000
  // collision. The bound is half the population: far from both.
  const sensitivityOk = checked > 0 && changed > checked / 2;

  const ok = notCarried === 0 && carried === bets.length
    && seeds.length === EXPECTED_SEEDS && distinct === seeds.length && kindOk === seeds.length
    && dSeeds.length === planPlayer.size && dDistinct >= PHASE_D_MIN_DISTINCT_SEEDS && dDistinct === dSeeds.length
    && taken === seeds.length && after === seeds.length
    && fails === 0 && checked === bets.length && checked > 0
    && dFails === 0 && dChecked === dBets && dChecked > 0 && sensitivityOk;
  const s14 = step(14, 'Client-Seed Control', ok ? 'PASS' : 'FAIL',
    `${seeds.length} epochs, each under its own client seed submitted by the auditor: ${distinct}/${seeds.length} distinct; ${kindOk}/${seeds.length} of the kind the plan gives the epoch (${seeds.length - dSeeds.length} audit+12-hex seeds drawn from the browser CSPRNG at the rotation, ${dSeeds.length} player-set Phase D seeds pfaudit-prod-dice-d<k>-+12-hex); `
    + `Phase D: ${dDistinct} distinct player-set seeds (floor ${PHASE_D_MIN_DISTINCT_SEEDS}), ${dChecked - dFails}/${dBets} Phase D rolls recompute under them (${dFails} fail); `
    + `${taken}/${seeds.length} epochs served the submitted seed back, and in ${after}/${seeds.length} the commitment the runner held when it submitted the seed is the epoch's commitment; `
    + `${carried}/${bets.length} bets carry their epoch's client seed (${notCarried} do not); ${checked - fails}/${bets.length} rolls recompute under it (${fails} fail); `
    + `client-seed sensitivity: appending one character to the client seed changes the roll on ${changed}/${checked} bets (the 10,000-point lattice predicts ${expectedChanged.toFixed(1)}; 0 would mean the seed is not used) (${sensitivityOk}). `
    + `That each seed was submitted after its commitment was served is the capture's own record of its ordering, not independently authenticated (L18)`,
  );

  return [s14];
}
