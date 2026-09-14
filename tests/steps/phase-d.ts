/**
 * Step 14: Custom Client-Seed Control (Phase D)
 * Phase D uses auditor-chosen client seeds (`pfaudit-…`). Their rolls must recompute exactly,
 * proving the client seed is a genuine, honoured input to the outcome (not ignored/overridden),
 * and that distinct client seeds produce distinct roll streams on the same server seed.
 */

import type { StepResult } from './context';
import { step } from './context';
import type { VerifyContext } from './context';
import { diceRoll } from '../../src/rng';
import { servedRollMatches } from '../../src/config';

export function run(ctx: VerifyContext): StepResult[] {
  const { phaseD, seedMap } = ctx;

  const custom = phaseD.filter(b => /^pfaudit-/.test(b.clientSeed));
  let checked = 0, fails = 0;
  for (const b of custom) {
    const ss = seedMap.get(b.hashedServerSeed);
    if (!ss) continue;
    const served = Number(b.roll);
    const local = diceRoll(ss, b.clientSeed, b.nonce);
    if (!servedRollMatches(served, local)) fails++;
    checked++;
  }

  let sensitivityProbes = 0, sensitivityChanges = 0;
  for (const b of custom) {
    if (!seedMap.has(b.hashedServerSeed)) continue;
    const ss = seedMap.get(b.hashedServerSeed)!;
    const r1 = diceRoll(ss, b.clientSeed, b.nonce);
    const r2 = diceRoll(ss, b.clientSeed + 'x', b.nonce);
    sensitivityProbes++;
    if (r1 !== r2) sensitivityChanges++;
    if (sensitivityProbes >= 8) break;
  }
  const sensitivityOk = sensitivityProbes > 0 && sensitivityChanges > 0;

  const s14 = step(14, 'Custom Client-Seed Control',
    fails === 0 && checked > 0 && sensitivityOk ? 'PASS' : 'FAIL',
    `${checked}/${custom.length} custom-seed (pfaudit-) bets recompute exactly (${fails} fail); `
    + `client-seed sensitivity: a different client seed yields a different roll on ${sensitivityChanges}/${sensitivityProbes} probed bets (${sensitivityOk})`,
  );

  return [s14];
}
