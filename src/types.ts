// Types mirror the scored dataset data/dice-prod-5936bets.json: the liqd.com production capture of
// 7 to 10 November 2026 (four capture files, phases A, D, A+, C and X), converted to the package shape
// { meta, seeds[], bets[] }. Field names match the dataset verbatim.

export interface DiceParams {
  lower: number;      // band lower bound on the [0.00, 99.99] roll scale
  upper: number;      // band upper bound
  inverted: boolean;  // false: win if roll ∈ [lower,upper), half-open; true: win if roll ∉ [lower,upper)
}

export interface Seed {
  epoch: number;                    // 0 … 32, numbered across the capture files in order
  capture: number;                  // index of the capture file (meta.captures[])
  captureEpoch: number;             // the epoch number the runner recorded inside that file
  phase: string;                    // the phase letter the runner recorded: A | C | D
  phaseId: string;                  // the runner's phase id: A | A+ | C | D
  at: string;                       // time of the rotation that opened the epoch
  clientSeed: string;
  hashedServerSeed: string;         // SHA-256(utf8(serverSeed)) commitment
  nextHashedServerSeed: string;     // pre-commitment for the next epoch (chain link)
  serverSeed: string | null;        // revealed by the rotation that closed the epoch
  nonceStart: number;               // operator-sourced: the rotation reply's post-rotation nonce (leading bound)
  nonceEnd: number | null;          // auditor-recorded: the capture's OWN last recorded nonce, NOT an operator counter
  operatorBetCount?: number | null; // operator-sourced trailing bound, if one is ever captured; absent in this capture
  plannedBets: number;              // the runner's plan for the epoch
  submittedClientSeed: string | null; // the client seed the runner submitted with the opening rotation
  playerSet: boolean;               // the runner's mark for a player-set (Phase D) seed
  drawnAfter: string | null;        // the commitment the runner had read before it drew / submitted that seed
  revealedAt: string | null;        // time of the rotation that revealed serverSeed
  commitVerified: boolean | null;   // converter-side flag (re-derived independently in verify)
  chainLinkOk: boolean | null;
}

/** LIQD's own verify endpoint reply for one round, as stored by the capture. */
export interface VerifierReply {
  at: string;
  status: number;
  request: { serverSeed: string; clientSeed: string; nonce: number; params: DiceParams };
  outcome: { roll: number; win: boolean; multiplier: number };
}

export interface Bet {
  at: string;
  epoch: number;
  capture: number;
  captureEpoch: number;
  phase: string;                    // A | C | D
  phaseId: string;                  // A | A+ | C | D
  id: string;
  params: DiceParams;
  nonce: number;
  clientSeed: string;
  serverSeedId: string;
  hashedServerSeed: string;
  roll: number;                     // served roll, 2dp in [0.00, 99.99]
  win: boolean;                     // served win flag
  multiplier: number;               // paid multiplier on a win; 0 on a loss
  result: string;                   // won | lost
  betAmount: number | string;       // stake as served (an 8-dp string, USDT)
  winningAmount: number | string;   // credited amount as served ("0" on a loss)
  stakeWallet?: number | string;    // wallet-denominated debit, as served
  winningAmountWallet?: number | string; // wallet-denominated credit, as served
  verifier?: VerifierReply | null;  // LIQD's verify reply for this round
  // converter-side self-check (informational; verify re-derives independently)
  localRoll?: number | null;
  localWin?: boolean | null;
  verified?: boolean | null;
}

/** One capture file: its source, window, phases and the seed pair that was active before its first bet. */
export interface CaptureRecord {
  index: number;
  source: { file: string; sha256: string; bytes: number; lines: number; schema: string; runner: string; planVersion: string | null; origin: string };
  startedAt: string; finishedAt: string | null; exportedAt: string | null;
  status: string;
  epochs: { first: number; last: number; count: number };
  bets: number; verifierReplies: number;
  phases: Record<string, { phase: string; epochs: number; bets: number; stake: string }>;
  stakeCurrency: string; currencyId: number;
  /** The runner's own description of how it captured (from the file's meta event). */
  runner: {
    clientSeedGenerator: Record<string, string>; endpoints: Record<string, string>; winChances: number[]; bands: string[];
    bandGenerator: string; pacing: Record<string, number>;
    plan: { phase: string; rounds: number; epochs: number; stake: string; config: string | null; seedRule: string | null; floor: string | null }[];
  };
  preCapture: {
    at: string; hashedServerSeed: string; clientSeed: string; nonce: number;
    nextHashedServerSeed: string; revealedServerSeed: string | null; commitVerified: boolean | null;
  };
}

export interface Dataset {
  meta: {
    audit: string; platform: string; gameId: string; schema: string;
    houseEdge: number; currency: string; plannedTotal: number; epochs: number;
    phases: Record<string, { phase: string; capture: number; epochs: number; bets: number; stake: string }>;
    startedAt: string | null; finishedAt: string | null;
    captures: CaptureRecord[];
    conversion?: Record<string, unknown>;
  };
  seeds: Seed[];
  bets: Bet[];
}

export type Severity = 'HARD_FAIL' | 'FLAG' | 'INFO' | 'PASS';
export interface StepResult { step: number; name: string; status: 'PASS' | 'FLAG' | 'FAIL'; detail: string; }
export interface InfoItem { label: string; detail: string; }
