import type { Bet, Seed } from '../../src/types';

export interface StepResult {
  step: number;
  name: string;
  status: 'PASS' | 'FLAG' | 'FAIL';
  detail: string;
}

export interface InfoItem {
  label: string;
  detail: string;
}

export interface VerifyContext {
  bets: Bet[];
  seeds: Seed[];
  /** hashedServerSeed → revealed serverSeed (only for revealed epochs). */
  seedMap: Map<string, string>;
  /** hashedServerSeed → bets in that epoch. */
  byHash: Map<string, Bet[]>;
  phaseA: Bet[];   // 5,000 — random target across all four modes
  phaseB: Bet[];   // 1,000 — high-multiplier tail (over 98 / over 99 — 99×, top of capture)
  phaseC: Bet[];   //   200 — $10 stake, over(50) — stake independence
  phaseD: Bet[];   //   500 — custom pfaudit- client seeds, random target
  phaseE: Bet[];   //   (unused for dice; kept for framework compatibility)
  outputsDir: string;
  /** Recomputed SHA-256 of the loaded dataset file. */
  datasetSha256: string;
  /** The dataset hash pinned in src/config.ts (the integrity anchor). */
  expectedDatasetHash: string;
  /** Declared phase config (bets/amount/reveals) — for stake/label parity steps. */
  meta: import('../../src/types').Dataset['meta'];
  /**
   * Populated by the simulation step when it reads outputs/simulation-results.json:
   * the ACTUAL sha256 of the scored artifact + its generatedAt. Recorded and checked against the published pin
   * under verification-results.json → artifactHashes.simulation. Null when the sim
   * artifact was absent (steps 16–17 FLAG).
   */
  simArtifact?: { file: string; sha256: string; generatedAt: string | null } | null;
}

export function step(
  num: number,
  name: string,
  status: 'PASS' | 'FLAG' | 'FAIL',
  detail: string,
): StepResult {
  const tag = status === 'PASS' ? '[PASS]' : status === 'FLAG' ? '[FLAG]' : '[FAIL]';
  console.log(`  ${tag} Step ${num} — ${name}`);
  if (status !== 'PASS') console.log(`         ${detail}`);
  return { step: num, name, status, detail };
}
