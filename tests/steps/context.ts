import type { Bet, Seed } from '../../src/types';

export interface StepResult {
  step: number;
  name: string;
  /**
   * INFO: an informational step's deviation (profile policy INFORMATIONAL — the live-sample fit,
   * 2026-09-29): reported, never counted as a flag, never affects the verdict.
   * OVERSTATED: the step carrying DICE-19 when the enforced RTP-CLAIM rule (1.2.0) finds the published figure
   * overstated — not a draw FAIL, not counted in hardFail; verdict RTP FIGURE OVERSTATED, exit 5.
   */
  status: 'PASS' | 'FLAG' | 'FAIL' | 'INFO' | 'OVERSTATED';
  detail: string;
  /**
   * The provenance of a FLAG (profile policy FLAG, decided 2026-09-17). Only meaningful when
   * `status === 'FLAG'`:
   *   • `operator` — the residual is about the GAME (an odds inversion, an edge that misses the
   *     claim). It downgrades the verdict to a Conditional Pass and verify exits 2. This is the
   *     DEFAULT: a flag with no origin is treated as operator, so a step that forgets to classify
   *     its flag errs toward disclosure, never toward hiding one.
   *   • `capture` — the residual is an AUDITOR-SIDE artefact (a capture-retry nonce gap that the
   *     revealed seed fully reconstructs). It is counted and given a limitation row but is
   *     verdict-neutral: the verdict class is unchanged and verify exits 0. Never a PASS — a
   *     reconstructable gap is disclosed, not silently absorbed.
   *   (The former `informational` origin is gone: the 2026-09-29 profile policy made the live-sample fit, DICE-22,
   *   policy INFORMATIONAL, so a trip reports status INFO — not a flag at all, never counted.)
   * Absent on a PASS/FAIL and omitted from the emitted JSON (so adding the field cannot perturb the
   * committed artifacts of a run that produces no such flag).
   */
  origin?: 'capture' | 'operator';
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
  outputsDir: string;
  /** Recomputed SHA-256 of the loaded dataset file. */
  datasetSha256: string;
  /** The dataset hash pinned in verify.ts (the integrity anchor). */
  expectedDatasetHash: string;
  /** The dataset header: reconciled against src/config.ts, never used as the plan. */
  meta: import('../../src/types').Dataset['meta'];
  /**
   * Populated by the simulation step when it reads outputs/simulation-results.json:
   * the ACTUAL sha256 of the scored artifact. Recorded (never pinned)
   * under verification-results.json → artifactHashes.simulation. Null when the sim
   * artifact was absent (steps 16–17 FLAG).
   */
  simArtifact?: { file: string; sha256: string } | null;
}

export function step(
  num: number,
  name: string,
  status: 'PASS' | 'FLAG' | 'FAIL' | 'INFO',
  detail: string,
  origin?: 'capture' | 'operator',
): StepResult {
  const tag = status === 'PASS' ? '[PASS]' : status === 'INFO' ? '[INFO]' : status === 'FLAG' ? '[FLAG]' : '[FAIL]';
  const originTag = status === 'FLAG' && origin ? ` (origin=${origin})` : '';
  console.log(`  ${tag} Step ${num} — ${name}${originTag}`);
  if (status !== 'PASS') console.log(`         ${detail}`);
  // `origin` is included ONLY on a FLAG, so a PASS/FAIL record is byte-identical to before this
  // field existed and the reproduction diff sees nothing new.
  return status === 'FLAG' && origin
    ? { step: num, name, status, detail, origin }
    : { step: num, name, status, detail };
}
