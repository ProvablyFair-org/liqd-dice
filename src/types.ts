// Types mirror the exact capture schema in data/dice-master-6700bets.json
// (liqd-dice-capture-v1). Field names match the dataset verbatim.

export interface DiceParams {
  lower: number;      // band lower bound on the [0.00, 99.99] roll scale
  upper: number;      // band upper bound
  inverted: boolean;  // false: win if roll ∈ [lower,upper)  — half-open, E13; true: win if roll ∉ [lower,upper) (complement of the half-open band)
}

export interface Seed {
  epoch: number;
  phase: string;                    // A | B | C | D
  at: string;
  clientSeed: string;
  hashedServerSeed: string;         // SHA-256(utf8(serverSeed)) commitment
  nextHashedServerSeed: string;     // pre-commitment for next epoch (chain link)
  serverSeed: string | null;        // revealed on rotation
  nonceStart: number;               // operator-sourced: the rotate response's post-rotation nonce (leading bound)
  nonceEnd: number | null;          // auditor-recorded: the capture's OWN last recorded nonce — NOT an operator counter
  operatorBetCount?: number | null; // operator-sourced trailing bound if captured ("Total bets made with pair"); absent in the v1 capture
  commitVerified: boolean | null;   // capture-side flag (re-derived independently in verify)
  chainLinkOk: boolean | null;
}

export interface Bet {
  at: string;
  epoch: number;
  phase: string;                    // A | B | C | D
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
  betAmount: number | string;       // stake in the account currency
  winningAmount: number | string;   // credited amount (0 on loss)
  stakeWallet?: number;             // wallet-denominated debit
  winningAmountWallet?: number;     // wallet-denominated credit
  // capture-side self-verification (informational; verify re-derives independently)
  localRoll?: number | null;
  localWin?: boolean | null;
  verified?: boolean | null;
  creditedOk?: boolean | null;
  modelMultiplier?: number | null;
  multOk?: boolean | null;
  walletOk?: boolean | null;
}

export interface Dataset {
  meta: {
    audit: string; platform: string; gameId: string; schema: string;
    houseEdge: number; currency: string; epochSize: number; plannedTotal: number;
    limits?: { minOdds: number; maxOdds: number; minBetUsdc: number; maxBetUsdc: number };
    diceModel?: { range: number; cursor: number; rollCeiling: number; params: string[] };
    phases: Record<string, { bets: number; amount?: number; target?: string; customSeeds?: boolean }>;
    startedAt: string | null; finishedAt: string | null;
    progress?: Record<string, unknown>;
    preCapture?: Record<string, unknown> | null;
    edgeSummary?: Record<string, unknown>;
    edgeScan?: unknown[];
  };
  seeds: Seed[];
  bets: Bet[];
}

export type Severity = 'HARD_FAIL' | 'FLAG' | 'INFO' | 'PASS';
export interface StepResult { step: number; name: string; status: 'PASS' | 'FLAG' | 'FAIL'; detail: string; }
export interface InfoItem { label: string; detail: string; }
