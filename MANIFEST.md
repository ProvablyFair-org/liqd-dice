# LIQD Dice — Consolidated Audit Overview

**Audit ID:** `PF-2026-LQ04` · **Auditor:** ProvablyFair.org · **Release:** `v1.3.0` · **Framework:** 1.1

Game: Dice (`gameId` `originals-dice`) on LIQD.com, captured on the production site `liqd.com` in USDT from one authenticated account. Dataset of record: **7 to 10 November 2026**, four capture files, rounds from `2026-11-07T09:45:52.855Z` to `2026-11-10T19:00:12.697Z` (dataset header `startedAt` `2026-11-07T09:45:52.088Z`, `finishedAt` `2026-11-10T19:00:14.901Z`). Report: `https://audit.provablyfair.org/casino/liqd/games/dice/overview`. Every check of LIQD's behaviour rests on production data. The machine-readable release identity is [RELEASE-MANIFEST.json](RELEASE-MANIFEST.json).

## Conclusion and scope

**PROVABLY FAIR — Full Pass, on the liqd.com production capture of 7 to 10 November 2026.** 22/22 steps pass (21 scored + 1 informational), 0 flags, 0 hard fails; 110/110 unit tests pass. Every one of the 5,936 captured rounds recomputes bit-for-bit from its `(serverSeed, clientSeed, nonce)` inputs; all 34 seed epochs are revealed and hash to their commitments, and the commit-reveal chain is intact inside each of the four capture files; LIQD's own production verify endpoint returns the served roll, win and multiplier for 5,936 of 5,936 rounds; LIQD's bet replies settle every round, in their game and wallet fields, at 0.10 USDT and at 10.00 USDT, at `floor8(stake × 9900/basisPoints)`, the exact amount rounded down to 8 decimals. In simulation, 98 targets at 1,000,000 bets each are all within 5·SE of theory, 2,000,000 draws show outcome uniformity, and a serial-independence screen on the first 200,000 of those rolls returns non-rejection.

**What the certificate covers.** Only what was played on production, in five phases:

| Phase | Date | Rounds | Epochs | Stake (USDT) | What was played |
|---|---|---:|---:|---|---|
| A | 7 November 2026 | 5,000 | 25 of 200 | 0.10 | the win chances 2, 5, 10, 20, 35, 50, 65, 80, 90 and 98% in five band types (under, over, inside, and an outside band placed low or high) |
| D | 10 November 2026 | 500 | 5 of 100 | 0.10 | the Phase A settings, each epoch under a player-set client seed |
| A+ (Phase A top-up) | 10 November 2026 | 200 | 1 of 200 | 0.10 | a 1% win chance (99×) in the four modes, 50 rounds each |
| C | 10 November 2026 | 235 | 118 + 117 | 10.00 | `over 50` (50% win chance, 1.98×) |
| X | 10 November 2026 | 1 | 1 of 1 | 0.10 | `under 0.01` (0.01% win chance, 9900×), the narrowest band LIQD prices; the round lost |

There is no separate tail phase: the 9900× setting is the one round of Phase X, the 99× setting is the A+ top-up and the 49.5× setting is the 2% win chance of Phase A. LIQD's production verifier prices the 0.01% band at 9900× and settles it by the half-open rule (E20). Band widths between 0.01% and 1% and above 98% were not played (**L7**).

**Return to player.** Theoretical RTP is **exactly 99.00% on every bet before settlement rounding**, a flat 1.00% edge, exact under the half-open win rule that LIQD's production verify endpoint returns on rolls placed exactly on a band bound (E17, E20) and that is assumed for settlement (**L2**). That flat edge is a model identity, not a measurement (**L3**): it follows by algebra for every 2-dp band. After rounding down, the settled RTP per captured (band, stake) is at most 99%: 4,286 of the 5,936 bets settle at exactly 99% and 1,650 below it, the lowest 98.999992%. The observed return over the capture is a variance illustration only.

**Commitment chronology.** Matching hashes and an intact chain establish which seed goes with which bet and in what order the records sit, never when a commitment came into existence. That each commitment preceded its bets rests on the auditor's capture record (**L18**). Conditional on that attested chronology, and on SHA-256 preimage resistance, LIQD could not have altered a roll after the bet was placed.

**Production behaviour disclosed: payouts are rounded down.** LIQD's bet replies settle Dice at `floor8(stake × 9900 / basisPoints)`: the exact product, rounded down to 8 decimals. Measured on 2,622 of 2,622 wins: 1,520 payouts are exactly the product and 1,102 are rounded down, none up. For the player's money this means a winning payout is never above the exact amount and is below it by less than 0.00000001 USDT; over the whole capture the rounding totals 0.00000579 USDT. LIQD stated this rule on 30 September 2026.

**Scope.** In scope: the RNG (HMAC-SHA256 draw on the hex-decoded server seed, 4-byte big-endian `uint32` scan with modulo-bias rejection, mapped to a roll on `[0.00, 99.99]`), the commit-reveal protocol, roll and win-rule reproduction in all four modes (under, over, inside, outside), payout integrity (the `9900/basisPoints` quotient and the round-down credit) at two stakes, RTP and structured integrity checks. Out of scope: platform security, accounts, deposits, withdrawals, KYC, responsible gambling, other LIQD games and the server-side entropy source (bounded by the commitment). LIQD is centralized; verifiability rests on commit-reveal, not a blockchain. One account, four capture files.

A Full Pass is not a claim that nothing is left open. The limitations are enumerated with their magnitudes in the [declared limitations register](#declared-limitations-register) (**L1**–**L18**; **L6**, **L10** and **L12** are closed and keep their slots).

## Contents

- [Dataset and capture](#dataset-and-capture)
- [Game and algorithm](#game-and-algorithm)
- [Payouts and RTP](#payouts-and-rtp)
- [Verification results](#verification-results)
- [Reproduce the audit](#reproduce-the-audit)
- [Verify a bet](#verify-a-bet)
- [Evidence](#evidence)
- [Limitations and trust](#limitations-and-trust)
- [Terms](#terms)
- [Release history](#release-history)

Companion documents, generated from this overview and the files it cites by `node scripts/build-docs.mjs` (a unit test fails if they disagree): [evidence.md](evidence.md), [exploit-testing.md](exploit-testing.md), [SUMMARY.md](SUMMARY.md).

## Dataset and capture

The dataset is [data/dice-prod-5936bets.json](data/dice-prod-5936bets.json), structure `{ meta, seeds, bets }`. Each bet joins to its revealed seed by `epoch` and `hashedServerSeed`; `src/loader.ts` builds the indexes. All 34 server seeds are present and revealed. The file was produced from the capture runner's four raw exports (not shipped) by a converter that keeps every served value as served, tags every round with its phase and capture file, and records, field by field, where each value came from (`meta.conversion`). The capture checker's printout of each raw export is shipped (E16, E18, E19, E21).

| Capture file | Raw export (not shipped) | Lines | SHA-256 | Phases | Rounds | Epochs |
|---|---|---:|---|---|---:|---|
| 0 | `liqd-dice-prod-capture-2026-11-07T13-02-22-111Z.ndjson` | 15,056 | `1592dc67432df034fc5387465ba43e102dfd7460885750b44287e5de6e2928e9` | A | 5,000 | 0–24 |
| 1 | `liqd-dice-prod-capture-2026-11-10T04-39-32-017Z.ndjson` | 2,118 | `8246abcc09029928ced1e8fddfc68766ca242639084628222c9ba8fd489671e0` | D, A+ | 700 | 25–30 |
| 2 | `liqd-dice-prod-capture-2026-11-10T10-37-36-842Z.ndjson` | 715 | `5f4fbf8d2eb5be618998d032564aa29863a5cd8ed2adaca1f507b1e3d9eccad8` | C | 235 | 31–32 |
| 3 | `liqd-dice-prod-capture-2026-11-10T19-00-14-904Z.ndjson` | 11 | `14875832127573aa56f418104822b49a147332d1089c75cadef75467a485cfd0` | X | 1 | 33 |

| Quantity | Result |
|---|---|
| Rounds / seed epochs | 5,936 / 34; each epoch's nonces 0 … size−1 present once (sizes 200, 100, 118, 117 and 1 by phase) |
| Wins / losses | 2,622 / 3,314 |
| Phases (rounds, wins) | A 5,000 (2,268) · D 500 (226) · A+ 200 (2) · C 235 (126) · X 1 (0) |
| Modes under / over / inside / outside | 1,151 / 1,387 / 1,148 / 2,250 |
| Win chances | 0.01, 1, 2, 5, 10, 20, 35, 50, 65, 80, 90, 98%; in Phase A (with the top-up) every one from 1% to 98% in all four modes, at least 50 rounds per (mode, win chance) class |
| Client seeds | 34 distinct, one per epoch, submitted by the auditor: 29 of the form `audit` + 12 hex characters, 5 player-set (`pfaudit-prod-dice-d<k>-` + 12 hex characters) in Phase D |
| Stakes | 0.10 USDT on 5,701 rounds (served `0.10000000`), 10.00 USDT on the 235 rounds of Phase C (served `10.00000000`); currency id 3 |
| Total staked / returned | 2,920.10 / 3,062.00572969 USDT |
| Roll range | 0.00–99.99, mean 50.172 |
| Winning multiplier range | 1.010204081632653–99 |
| Distinct bands | 3,189 (inside and outside positions drawn by the runner from a browser CSPRNG on the 0.01 grid) |
| LIQD verify replies | one per round, HTTP 200, 5,936 of 5,936 equal to the served roll, win and multiplier |

Population checks compare the dataset against code constants in `src/config.ts` (`EXPECTED_PHASES`, from which `EXPECTED_EPOCHS`, `EXPECTED_BETS`, `EXPECTED_SEEDS`, `EXPECTED_PHASE_BETS` and `EXPECTED_WIN_CHANCES` follow, and `BASE_STAKE`, `ELEVATED_STAKE`): the values of the plans the runner executed. `meta.plannedTotal`, `meta.epochs`, `meta.phases` and the four `meta.captures` records are reconciled against them, never used as the plan (G-BIND).

| Input | Identity |
|---|---|
| [data/dice-prod-5936bets.json](data/dice-prod-5936bets.json) | SHA-256 `41ea55fcadd903768be3a92725f2100fe2e794ab300d6842ce946124ea7d5042` |

Dice has no multiplier-table file: the payout is the quotient `9900/basisPoints`, computed from the band. `loadDataset()` recomputes the dataset hash and aborts before any step runs on a mismatch.

**Field origins.** From `meta.conversion` in the dataset; evidence is distinguished as response values, request parameters, capture bookkeeping and recomputed results.

| Field | Origin and interpretation |
|---|---|
| `id`, `nonce`, `clientSeed`, `serverSeedId`, `hashedServerSeed` | served in the place-bet reply (`betId`, `nonce`, `clientSeed`, `serverSeedId`, `serverSeedHash`) |
| `params` | the band as served back (`servedParams`); the capture checker found request = served on every round (E16, E18, E19, E21) |
| `roll`, `win`, `multiplier`, `result` | the served outcome and wager result |
| `betAmount`, `winningAmount`, `stakeWallet`, `winningAmountWallet` | the served 8-dp strings, kept as text (a loss is served as `"0"`); every settlement check reads the decimal text |
| `verifier` | LIQD's verify endpoint reply stored for the round: the request body sent (the revealed seed, client seed, nonce, band) and the outcome returned |
| `serverSeed`, `nextHashedServerSeed`, `nonceStart` (seed records) | served by the rotation replies that opened and closed each epoch; `nonceStart` is the post-rotation nonce the opening rotation served (0 on all 34) |
| `submittedClientSeed`, `drawnAfter`, `playerSet` (seed records) | the runner's record: the client seed it submitted with the opening rotation, the commitment it held at that moment, and its mark for a player-set seed |
| `nonceEnd` | auditor-recorded: the last nonce the capture recorded in the epoch, not an operator counter |
| `localRoll`, `localWin`, `verified`, `commitVerified`, `chainLinkOk` | converter-side calculations; verification derives its own results and ignores these |
| `epoch`, `capture`, `captureEpoch`, `phase`, `phaseId`, `at` | capture bookkeeping; epochs are numbered 0–33 across the four files, `phaseId` is the runner's phase id (`A+` is the Phase A top-up), `at` is the capture client's clock |
| `meta.captures[]` | per capture file: its raw export's name and SHA-256, its window, its phases, the runner's own description (client-seed generator, endpoints, plan) and the seed pair that was active before its first bet (`preCapture`) |

No wallet balance is in any production dice reply (**L5**), and no odds or bet-limit configuration is served (**L7**).

**Method.** The RNG code, `src/rng.ts`, was written from a specification by an implementer who never opened LIQD's code. The specification shipped here, [docs/ALGORITHM.md](docs/ALGORITHM.md), is grounded on production sources only: LIQD's public pages, the 5,936 captured rounds and LIQD's production verify endpoint; `node scripts/algorithm-spec-check.mjs` reprints every count it cites. The module reproduces all 5,936 rolls. As a second check, LIQD's production verify endpoint (`POST https://liqd.com/api/v1/originals/dice/verify`) was called with each round's revealed inputs; the stored replies are in the dataset and Step 6 scores them. Endpoints used by the capture: place-bet (`{ idempotencyKey, stake, currencyId, stakeCurrency, params }`, places and settles one bet), provably-fair active, rotate (`{ clientSeed }`, reveals the retiring seed and sets the next client seed), verify. The capture checker found 0 rounds recorded twice, 0 lost replies and 0 refusals in each of the four files (E16, E18, E19, E21).

**The capture runner.** The rounds were placed by an in-page script run by the auditor in a logged-in `liqd.com` tab: build `77433e4dff81` for Phase A and build `3d2038fe26a7` for the other phases (each raw export names its build). The script is kept in the auditor's workshop and is not part of this package; what it did is recorded in the dataset (`meta.captures[].runner`) and in the checker printouts. That the 5,936 rounds were settled by LIQD's system in the stated windows is auditor-attested (**L9**).

**Capture gaps, ours.** The plan played 12 win chances; no other band width was placed. No settled round has its roll on a band bound. Only two stakes were placed, both in USDT. These are limits of the capture, listed in the register, and are not findings about LIQD.

## Game and algorithm

### Commitment and seed lifecycle

```text
hashedServerSeed = SHA-256(UTF-8(serverSeed hex string))
```

The commitment hashes the 32-character hex string; the HMAC key below is the hex-decoded 16 bytes. All 34 revealed seeds match. Each epoch also publishes `nextHashedServerSeed`, which equals the following epoch's commitment on 30/30 transitions inside the capture files; each file's pre-capture record reveals a seed that hashes to its own commitment, and its successor hash is the commitment of the file's first epoch (4/4). The account's seed pair is not specific to Dice (the pair left active by the last rotation of the 7 November Dice file is the pair the auditor's Limbo capture started from the same day) and it kept rotating between the four files, so the links from one file to the next run through rotations that are not in this dataset (0 of 3 are present); each file stands on its own anchor. These are orderings of records, not dates (**L18**). An epoch is the rounds under one `(serverSeed, clientSeed)` pair; at each rotation the auditor submitted the next client seed and the retiring server seed was revealed. Settlement is instant: one call places and settles a bet, so there is no open round and no mid-round reveal. No drand, block hash or VRF is involved.

### Draw and roll

```text
key      = hex_decode(serverSeed)                       // 16 raw bytes
message  = UTF-8(clientSeed + ":" + nonce + ":" + cursor)  // cursor = 0
digest   = HMAC-SHA256(key, message)
maxFair  = floor(2^32 / 10000) * 10000 = 4294960000
read the digest as eight big-endian uint32; accept the first x < maxFair
draw     = x % 10000
roll     = draw / 100                                    // 0.00 … 99.99
if all eight are rejected: not specified here (docs/ALGORITHM.md O2); src/rng.ts stops with an error
```

`src/rng.ts` implements this (`commitHash`, `generateProvablyFairNumber`, `diceRoll`, which returns the draw in hundredths) with Node.js `crypto` only; the specification's 128 vector and property checks run as `tests/dice/rngSpecTests.ts`. Each bet uses one draw, so the roll takes one of 10,000 equally likely values and never reaches 100.00. `2^32` leaves 7,296 values above the last whole multiple of 10,000; rejecting them leaves `4,294,960,000 = 429,496 × 10,000` admissible values, so each residue receives exactly 429,496 and the bias is 0. The per-chunk rejection probability is `7296 / 4294967296` ≈ 1.7 × 10⁻⁶; no captured round hits it. Whether the operator's server applies the same rejection guard is ASSUMED, unexercised by this dataset (**L11**). A guardless server would have produced byte-identical data, with bias impact ≤ 1.7e-6. The audit module's own guard is exercised: by unit vectors, and by Step 17's 10,000-nonce replay, in which one cell (epoch 8, nonce 6366, a modelled continuation beyond the captured nonces) has a first chunk in the rejected tail.

`commitHash("3085a86bd812800c76ae7d81191955b2") = "99d78251a09a8c5ee083928d3ff835b1bca114e1ebf86cbf338f43959a583d8d"` (epoch 0 of the capture). The specification's ten vectors (`docs/ALGORITHM.md` §5) are production rounds of every phase and two verifier probes.

### Win rule and modes

```text
inBand = roll >= lower AND roll < upper
win    = inverted ? NOT inBand : inBand
```

| Mode | Band shape | Wins when |
|---|---|---|
| under | `lower = 0`, not inverted | `roll < upper` |
| over | `upper = 100`, not inverted | `roll ≥ lower` (ceiling 99.99) |
| inside | `0 < lower`, `upper < 100`, not inverted | `lower ≤ roll < upper` |
| outside | `inverted = true` | `roll < lower` or `roll ≥ upper` |

The lower bound is inclusive and the upper exclusive; inversion takes the exact complement. A loss pays 0; there is no push and no partial payout.

**Where the boundary rule comes from.** No captured roll landed on a band bound: 4,547 rounds had a reachable upper bound, an expectation of 0.4547 hits, 0 observed, and 0 lower-bound hits (`outputs/report-figures.json → boundary`). The settled rounds therefore cannot tell a half-open band from one that is inclusive on both ends; both rules reproduce all 5,936 win flags. The rule is witnessed on LIQD's production verify endpoint instead (E17, 9 November 2026, logged out, no bet): 23 answered calls on seeds LIQD had revealed in this capture, 6 of them on nonces that were never settled. LIQD's reply equals the package's roll, win and multiplier on 23 of 23. On-bound results:

| Mode | Roll on the lower bound | Roll on the upper bound |
|---|---|---|
| under | roll 0.00 in `[0, 75)`: win | `[0, 71.22)`: loss; `[0, 75)`: loss |
| over | `[28.86, 100)`: win; `[25, 100)`: win | not reachable (the roll ceiling is 99.99) |
| inside | `[28.86, 71.22)`: win; `[25, 75)`: win | `[28.86, 71.22)`: loss; `[25, 75)`: loss; `[25, 99.99)`: loss |
| outside | `[28.86, 71.22)` inverted: loss; `[25, 75)` inverted: loss | `[28.86, 71.22)` inverted: win; `[25, 75)` inverted: win; `[25, 99.99)` inverted: win |

Seven probes have the roll on a lower bound and eight on a reachable upper bound; the eight are the ones on which half-open and inclusive-both-ends disagree, and all eight follow half-open. Six probes are controls with the bound moved by 0.01. The same rule holds at the narrowest band (E20, 10 November 2026, logged out, no bet): 10 answered calls with a 0.01% band on seeds revealed in this capture, 3 of them on a nonce that was never settled. The roll on the band's lower bound wins at 9900× on 4 of 4 (rolls 0.00, 25.00, 28.86 and 99.99), the roll on its upper bound loses on 3 of 3, and a band one hundredth above the roll loses on 3 of 3; the three upper-bound calls are the ones that separate half-open from inclusive-both-ends. Step 15 re-derives every probe of E17 and E20 from its seed and fails if a reply differs. These are verifier replies: that settlement treats a roll on a bound the same way is not witnessed by a settled round (**L2**, **L14**).

### Multiplier and limits

For two-decimal bounds, `W = inverted ? 100 − (upper − lower) : upper − lower`, `b = round(100 × W)` and `m = 9900 / b`. `b` (`basisPoints`) is auditor-derived and appears nowhere in the capture (**L8**). The binary64 quotient `9900 / b` equals the served multiplier on all 2,622 wins with strict `===`, deviation 0; the float closed form `(100/winChance%)·(1−edge)`, the same rational, agrees on 1,651 of them (Step 7). That is the evidence that the quotient is the operator's form. The served value is the full binary64 (e.g. `1.010204081632653` at `b` 9800), not a display-rounded figure. Nominal house edge is 1.00% on the continuous win chance (`houseEdge = 0.01`).

| Limit | Value | Evidence class |
|---|---|---|
| Roll scale | `[0.00, 99.99]` | 10,000-point grid; both ends served (roll 0.00 `YZRCscx8nuK_hv6jjY7w0`, roll 99.99 `vVnhllPfT2QMomDU-d2z2`) |
| Lowest multiplier captured | 1.010204081632653 | 98% win chance (e.g. `JOaaqudLC5XcE2aFNic0w`); whether a wider band is accepted was not tested |
| Highest multiplier captured | 9900 | 0.01% win chance, 1 round (`KlZKQS3tgfyTQ-wPnuZfz`, roll 63.94, lost); LIQD accepted and settled it. A win at this setting was not captured; LIQD's verifier prices the band at 9900× on 4 winning probes (E20). The highest setting with a captured win is 1% (99×, 200 rounds, 2 wins, e.g. `iMgu6U7RKoct0VAxgLffJ`) |
| `houseEdge` | 1.00% | derived per bet (Step 15), not taken from a config field |

LIQD's odds and bet limits were not read from production. The model's price grid is every band width with a win chance and a multiplier above 1× (9,899 basis points); the RTP-claim table and Step 21 sweep all of it, and the capture covers 11 of those points.

## Payouts and RTP

### Settlement

```text
credit       = floor8(stake × 9900 / basisPoints)     // exact decimal arithmetic, rounded down to 8 dp
loss credit  = 0, multiplier 0
```

The rule reproduces all 5,936 settlement amounts with zero tolerance, both from the served multiplier (Step 8) and from the band alone (Step 20), and the wallet fields by the same rule (Step 10). Against the exact unrounded product, computed in the operator's decimal number system (decimal stake × the exact rational `9900/b`), the settlement lands exactly on the product on **1,520** wins and rounds the player down on **1,102**, never up; each rounding is less than one 0.00000001 unit, and over the capture the rounding totals 5.79e-6 USDT, house side (`outputs/report-figures.json → settlementResidual.netUsdt`). A floor has no tie case, so no rounding-mode premise is involved.

| Stake (USDT) | Wins | Credits exactly the product | Credits rounded down | Credits above the product |
|---|---:|---:|---:|---:|
| 0.10 | 2,496 | 1,394 | 1,102 | 0 |
| 10.00 | 126 | 126 | 0 | 0 |

The 1,102 rounded-down credits are the wins at the 35%, 65% and 98% win chances at 0.10 USDT, where the exact product is not on the 8-decimal grid. Example: `JOaaqudLC5XcE2aFNic0w` (0.10 USDT, under 98, `b` 9800): the exact amount is 0.1010204081632653…, production credits `0.10102040`. At 10.00 USDT on `over 50` the product is exactly 19.80, so Phase C shows the rule at the higher stake without a rounding.

**Operator statement.** On 30 September 2026 LIQD answered: *"Payouts use exact decimal maths and are then rounded down to 8 decimals, in every game … Dice, Limbo, Plinko, Keno and Blackjack aren't affected."* Production follows that statement on 2,622 of 2,622 wins. Rounding the exact product to the nearest unit instead would reproduce only 2,086 of them (`docs/ALGORITHM.md` §3.3).

**Why the band, not the float.** Step 20 rebuilds the credit from the integer quotient `9900 / basisPoints`. The float closed form `(100/winChance%)·0.99`, floored, would be one unit low on 29 of the captured wins (`settlementResidual.floatClosedFormMisses`); the quotient is wrong on none.

### Theoretical RTP

The verifier counts winning grid points independently of the served multiplier. Under the half-open rule, `b` of the 10,000 points win:

```text
P(win) = b / 10000
RTP    = P(win) × m = (b / 10000) × (9900 / b) = 0.99
Edge   = 1 − RTP = 0.01
```

| Mode | Winning region | Points | Effective edge | Captured rounds |
|---|---|---|---|---:|
| under `[0, U)` | `draw ∈ [0, 100U − 1]` | `100W` | exactly 1.000% | 1,151 |
| inside `[L, U)` | `draw ∈ [100L, 100U − 1]` | `100W` | exactly 1.000% | 1,148 |
| over `[X, 100)` | `draw ∈ [100X, 9999]` | `100W` | exactly 1.000% | 1,387 |
| outside `![L, U)` | the complement | `100W` | exactly 1.000% | 2,250 |

Step 15 asserts the identity per bet in exact integers (`100·winCount·9900 === 99·10000·basisPoints`), on 5,936/5,936 bets; unit tests cover 59,998 bands, and Step 13 compares the closed-form count with a literal 10,000-point enumeration on all 3,189 distinct captured bands. The float form of the same quantity departs from 0.01 by up to 6.99e-15 across the capture and 5.06e-13 at an `over 99.99` band, which is why the assertion is integral. The highest-multiplier captured setting, 0.01% at 9900× (one round), and the 1% setting at 99× (200 rounds) carry the 1.0000% edge like every other.

The result is conditional on the uniform-roll and win-rule model, before settlement rounding or any untested payout cap. A cap of the form `min(stake·m, C)`, if present, would reduce RTP below 99% at the capped stakes.

| Measure | Result | Meaning |
|---|---|---|
| Theoretical RTP before rounding | exactly 99% | analytical expectation under the model |
| Expected RTP with round-down settlement | 98.999992%–99% | over the captured (band, stake) pairs: 4,286 rounds exactly at 99%, 1,650 below, none above |
| Observed sample RTP | 104.85961884% | 3,062.00572969 USDT on 2,920.10, a finite mixed-band sample dominated by the 235 rounds at 10.00 USDT (126 wins where 117.5 are expected); informational only |

Observed return per phase, also informational: A 99.57% (497.82905831 on 500.00), D 99.15% (49.57667138 on 50.00), A+ 99.00% (19.80 on 20.00), C 106.16% (2,494.80 on 2,350.00), X 0% (0 on 0.10).

## Verification results

The 22 numbered steps in `tests/verify.ts` (21 scored + 1 informational) evaluate the 5,936 rounds of 7 to 10 November 2026: 22 PASS, 0 flags, 0 hard fails, `PROVABLY FAIR — Full Pass`, exit 0. The release script counts every numbered step, so `RELEASE-MANIFEST.json` and the last line of `npm test` read `scored 22/22`. The runner compares the number of executed steps with `EXPECTED_STEPS` before it prints a verdict.

| Step | Check | Result |
|---:|---|---|
| 1 | Seed hash integrity | PASS: 34/34 revealed seeds hash to their commitment; 0 mismatches |
| 2 | Next-seed pre-commitment chain | PASS: 30/30 in-file transitions; 4/4 pre-capture links, each naming the first commitment of its capture file; 0 of 3 file-to-file links are in the dataset; an ordering of records, not a date (**L18**) |
| 3 | Hash consistency within epoch | PASS: 34 epochs, 0 violations |
| 4 | Nonce audit | PASS: every epoch holds the distinct contiguous nonces 0 … size−1 with its planned size (200, 100, 118, 117 or 1), no gaps, no reuse; first nonce equals the post-rotation nonce served by the rotation reply in 34/34; trailing bound auditor-recorded (**L13**) |
| 5 | Roll recomputation and draw bias bound | PASS: 5,936/5,936 rolls byte-identical; `MAX_FAIR = 10000 × 429496 = 4,294,960,000`, worst-case modulo bias 0 (≤ 2⁻³²), rejection census 7,296 of 2³² chunk values |
| 6 | Win-rule reproduction | PASS: 5,936/5,936 win flags (`inverted` honoured); LIQD's verify endpoint, one stored reply per round: 5,936/5,936 asked with the round's revealed inputs and returning the served roll, win and multiplier |
| 7 | Multiplier derivation | PASS: 2,622 wins, served `== 9900/basisPoints`, numerator derived as `(1 − HOUSE_EDGE)·10000`, bit-exact, deviation 0 |
| 8 | Credit arithmetic | PASS: 5,936/5,936 `winningAmount == floor8(stake × multiplier)` exactly on the 1e-8 grid, from the served decimal text (loss ⇒ 0), at both stakes; 1,102 rounded down, 1,520 exact, 0 up |
| 9 | Loss settlement | PASS: 3,314 losses with `winningAmount == 0` and `multiplier == 0` |
| 10 | Wallet credit and odds bounds | PASS: 5,936/5,936 wallet fields by the same rule, ledgers agree row for row; every captured band priced inside the plan's span, 0.01%–98%; no balance ledger (**L5**); LIQD's odds limits not read (**L7**) |
| 11 | Dataset integrity | PASS: SHA-256 pin match; population bound to `src/config.ts`; 34/34 epochs match the plan row for row (size, phase, capture file); 5,936 distinct bet ids; 34/34 revealed |
| 12 | Phase and mode coverage | PASS: phases A 5,000, D 500, A+ 200, C 235, X 1 match the code plan; each phase at its one stake and its planned win chances; both stake tiers present; Phase A with its top-up: 44/44 (mode × win chance) classes hold at least 50 rounds; both ends of the planned range played (0.01% and 98%) |
| 13 | Anti-circularity | PASS: win probability and multiplier from grid arithmetic only; a corrupted roll is rejected; closed form equals the literal tally on all 3,189 distinct bands |
| 14 | Client-seed control | PASS: 34 epochs under 34 distinct client seeds submitted by the auditor; Phase D: 5 distinct player-set seeds, 500/500 rolls recompute under them; the served seed is the submitted one in 34/34; 5,936/5,936 bets carry their epoch's seed and recompute under it; a changed client seed changes the roll on 5,936/5,936 bets |
| 15 | Boundary rule, roll range and effective edge | PASS: the 33 production verifier probes of E17 and E20 re-derived, 33/33 equal the package rule, 11 separate half-open from inclusive and all 11 follow half-open; the 4 winning 0.01% probes are priced 9900×; 0 settled rolls on a bound (**L2**); rolls 0.00–99.99; the 0.01% setting is priced 9900× at 1.0000% (1 round, lost) and the 1% setting pays exactly 99× (200 rounds, 2 wins); effective edge exactly 1.0000% on 5,936/5,936 as an exact integer identity (**L3**); 0 player-favourable bets |
| 16 | Simulation Pass 1 | PASS: 98/98 targets (`over 2.00` to `over 99.00`, 1,000,000 bets each) within 5·SE + 1e-4; mean simulated RTP 99.0203% against 99.0000% over 98,000,000 bets, SE 0.0207 pp, Δ 0.9803·SE; 2M draws, uniformity χ² 108.885 df 99, p 0.2335; serial screen on the first 200,000 (lag-1 z 0.159, runs p 0.6910); 9/9 edge bands within 5·SE + 1e-4; `under 50` series final 99.048%, Δ 2.1493·SE |
| 17 | Simulation Pass 2 | PASS: served-band return over 34 seeds × 10,000 nonces, aggregate early z 0.164, one-sided p 0.5651 vs α 0.01 (17 below / 1 equal / 16 above); detects a per-bet deficit of 14.629 pp or more at 80% power. Supplementary draw-uniformity screen 2 flags vs 1.49 expected, P(X ≥ 2) = 0.4424 |
| 18 | Bet-size invariance (Phase C) | PASS: 235/235 rounds at `10.00000000`, 100× the base stake, on `over 50`; every roll recomputes from `(serverSeed, clientSeed, nonce)` alone (`diceRoll` takes no wager); 126 wins, each settled at `19.80000000` by the rule; the same band at 0.10 USDT in the other phases (110 rounds, 51 wins) carries the same multiplier and credit rule, `0.19800000` |
| 19 | Artifact hash and value-domain integrity | PASS: dataset, `simulation-results.json` and `rtp-convergence.html` match their pins; `report-figures.json` reconciles field for field (12/12 required fields); 4,135 numeric leaves inside domains derived from `src/config.ts` |
| 20 | Settlement determinism | PASS: 5,936/5,936 outcome and credit determined by (roll, band, stake), credit rebuilt as `floor8(stake × 9900/basisPoints)` from the band with zero tolerance |
| 21 | Multiplier monotonicity and range | PASS: the 12 plan win chances, `99/winChance` strictly decreasing, 0 inversions; `9900/basisPoints` strictly decreasing and above 1× over all 9,899 basis points of the price grid; quoted span 1.0102×–9900.0000× |
| 22 | Live-sample serial independence (informational) | PASS: lag-1 0.015397, z 1.186; runs about 50.00: 2,905 vs 2,969.0 expected, z −1.661, p 0.0966. Reports PASS or INFO and cannot fail (profile policy, 29 September 2026) |

**Step notes.** Step 8 scores the served credit against the served multiplier; Step 20 builds the credit from `PAYOUT_NUMERATOR / payoutBasisPoints(params)` and never reads the served multiplier. Both read every amount from its decimal text, so no binary64 conversion sits between the served string and the comparison. The pre-capture link in Step 2 fails when the record of any capture file, or a field of it, is absent or altered.

**Edge convergence on 98 targets.** The simulation runs 98 targets × 1,000,000 bets each, the over-mode bands `over 2.00` to `over 99.00` (`[X, 100)` for X = 2 … 99; win chance 98% to 1%, 1.0102× to 99×, the span of win chances the production capture played except the one Phase X round at 0.01%, 9900×, which no target covers). All 98 are within 5·SE + 1e-4 of their theoretical RTP (68 within 1·SE, 95 within 2·SE, 97 within 3·SE; the largest departure is `over 56.00`, 3.0802·SE); 51 sit above theory, 46 below and 1 (`over 34.00`) exactly on it. The lowest simulated RTP is `over 99.00` at 98.3664% (0.64·SE) and the highest `over 98.00` at 99.7920% (1.14·SE). Step 16 recomputes every target's standard error, reconstructs each RTP from its integer win count and validates each target's running series at the five marks.

The convergence chart (`outputs/rtp-convergence.html`) is the mean simulated RTP over the 98 targets at each per-target sample size, with the standard error SE = √(Σ SEₜ²)/98 (each target's SEₜ = σ/√n). Step 16 recomputes every plotted mean and SE from the targets' own counts:

| Bets per target | Mean simulated RTP (98 targets) | SE | Δ (SE) |
|---|---|---|---|
| 10,000 | 99.2376% | 0.2071% | 1.15 |
| 50,000 | 99.1758% | 0.0931% | 1.89 |
| 100,000 | 99.0878% | 0.0656% | 1.34 |
| 500,000 | 99.0261% | 0.0293% | 0.89 |
| 1,000,000 | **99.0203%** | 0.0207% | 0.98 |

The final mean is 0.9902026676413088 over 98,000,000 bets against 0.9899999999999987 (the mean of the 98 theoretical RTPs in binary64; 0.99 exactly in rationals) at SE 0.0002067384028794929, Δ 0.9803·SE.

**Seeds.** No seed was chosen, searched or re-drawn. Every Pass-1 seed is `HMAC-SHA256(SIM_MASTER_SEED, counter)` truncated to 16 bytes. Uniformity and serial use counters 0–40,001, the `under 50` series 40,002–440,003, the nine edge bands 440,004–800,021, and the 98 targets continue the same stream from counter 800,022 (`SIM_TARGET_SEED_COUNTER_BASE`), 20,002 counters each, ending at 2,760,217. Step 16 re-derives each target's start counter, client seed and first server seed from the master seed and fails any target that is not at its position. Pass 1 reads no casino data, so it is the same experiment, byte for byte (`outputs/rtp-convergence.html` keeps its pin).

**Pass 1 detail.** Three screens (uniformity, lag-1, runs) are Bonferroni-corrected to α/3 = 3.333e-3, the uniformity screen two-sided (α/6 per tail); the lag-1 threshold is the stored and applied `zCritical` 2.9351994688667054; runs z is re-derived from cell counts (99,912 runs, n1 = 100,103, n = 200,000). Every published RTP must be the producer's return for a valid integer win count, reconstructed forward and compared bit for bit; convergence win counts 493 / 5,046 / 50,371 / 499,779 / 2,501,269 / 5,002,354 / 10,004,806 are cumulatively consistent, and all seven standard errors are recomputed from `(n, rtp, wins, m)`. Exact hits on theory are counted and reported, never rejected (G-VALID).

| Draws (n) | Simulated `under 50` RTP | SE |
|---|---|---|
| 1,000 | 97.614% | 3.130% |
| 10,000 | 99.911% | 0.990% |
| 100,000 | 99.735% | 0.313% |
| 1,000,000 | 98.956% | 0.099% |
| 5,000,000 | 99.050% | 0.044% |
| 10,000,000 | 99.047% | 0.031% |
| 20,000,000 | **99.048%** | 0.022% |

| Band | Multiplier | Discrete win % | Simulated RTP | Δ (SE) |
|---|---|---|---|---|
| under 50 | 1.98× | 50.00% | 98.998% | 0.03 |
| over 50 | 1.98× | 50.00% | 98.930% | 1.00 |
| under 10 | 9.9× | 10.00% | 98.896% | 0.50 |
| over 90 | 9.9× | 10.00% | 99.446% | 2.12 |
| inside 25–75 | 1.98× | 50.00% | 99.068% | 0.97 |
| outside 25–75 | 1.98× | 50.00% | 99.113% | 1.61 |
| over 98 | 49.5× | 2.00% | 98.597% | 0.82 |
| over 99 | 99× | 1.00% | 98.950% | 0.07 |
| under 1 | 99× | 1.00% | 99.480% | 0.69 |

The final `under 50` point is 0.990475794174457 against 0.99 at SE 0.00022137070420677504. Pass 1 characterises the reference implementation; it transfers to the served rolls because Step 5 reproduces all 5,936 of them.

**Pass 2 detail.** The load-bearing statistic is the served-band return: each revealed seed is replayed for 10,000 nonces with its recorded client seed; the early window is the epoch's captured nonces (200, 100, 118, 117 or 1 of them; the rest of the 10,000 are modelled continuations, not captured bets); the payout-weighted return of the bands actually served is standardised by its exact per-bet mean and variance (each pᵢ the served band's exact lattice probability) and read against a one-sided normal lower tail (**L4**). The rule was fixed in code before the production capture. The supplementary screen scores each seed's 50-draw, 20-bin χ² (nonces 0–49 against 50–99 of the replay; both windows are captured nonces in 33 of the 34 epochs, and in epoch 33, the one round of Phase X, only nonce 0 was captured) against the exact discrete null enumerated in `src/exact-chi2.ts` from 181,274 partitions (832 attainable values). Achieved per-window rejection at the nominal 0.05 is 0.0459237601, so the compound flag rate is 0.0438147684 (expectation 1.49 over 34 seeds). Flags at epochs 22 and 24; 6 flags would reject (P(X ≥ 6) = 0.0033). The aggregate flag-count test is at α = 0.01 and exceedance is a hard FAIL; it is not Bonferroni-corrected because its null is enumerated, not sampled. Pooled real-roll uniformity over the 5,936 rolls is informational: χ² 104.499, df 99, p 0.3333.

**Error budget.** Seven scored statistical screens can move the verdict: S1–S3 the Pass-1 screens (α/3 each), S4 the nine edge bands and the 98 targets (≈5.73e-7 each, ≈6.13e-5 over 107 rows), S5 the final `under 50` point and the final 98-target mean (≈5.73e-7 each), S6 the flag-count binomial (≤ α), S7 the served-band return (α = 0.01). The α = 0.01 claim covers S1–S3 only; Step 16's own nominal bound is ≈0.0100625 (`STEP_16_BOUND` in `src/sim-checks.ts`) and the bound over all seven is ≈0.0301. These are nominal upper bounds under asymptotic reference distributions, not measured failure frequencies. A failed regenerated run must be retained and investigated, never re-run for a better one.

### Findings

Each step has a matching finding F1–F22 in the step results above. No step flags or fails. One measured production behaviour is disclosed outside the steps:

**F-ROUNDING — payouts are rounded down to 8 decimals, as LIQD states.** LIQD's bet replies settle 2,622 of 2,622 wins at `floor8(stake × 9900/b)`; 1,102 of them are below the exact product, each by less than one 0.00000001 unit, and none is above it. The total over the capture is 0.00000579 USDT, house side. Nothing here is a failed check: every step scores the capture against the rule production applies.

**Baseline-deviation review.**

| Standard-Dice baseline | LIQD observed on production | Disposition |
|---|---|---|
| Roll on `[0, 100)`, band `{lower, upper, inverted}` | roll on a 10,000-point grid `[0.00, 99.99]`, four modes | conforms |
| Multiplier = `(1 − edge)/winChance`, flat 1% | `9900/basisPoints` bit-exact; nominal 1.00% | conforms |
| Effective edge = nominal for every bet | exactly 1.0000% on all 5,936 under the half-open rule (E17) | conforms exactly |
| Payout at the exact multiplier | exact amount rounded down to 8 dp; losses 0 | conforms; the rounding is under one 0.00000001 unit per win, house side (F-ROUNDING) |
| Same rule at a higher stake | 126 wins at 10.00 USDT settled by the same rule as the same band at 0.10 | conforms |
| Top of the range priced correctly | the 0.01% setting at 9900× and 1.0000% (one round, lost; the verifier's 9900× on winning probes, E20); the 1% setting at 99×; all captured multipliers on the formula | conforms; a settled 9900× win not captured (**L7**) |
| Commit-reveal, client seed after commitment, nonce per bet | as recorded; a fresh client seed per epoch, 5 of them player-set; timing attested (**L18**) | conforms |
| Instant settlement | one call places and settles | conforms; a mid-round reveal is structurally not applicable |

### Integrity matrix

<!-- S5-MATRIX:START -->

| Test ID | Category | Result | Finding summary |
|---|---|---|---|
| S5-1 | Seed substitution | Pass | 34/34 revealed seeds hash to their commitment; the next-seed chain holds on 30 in-file transitions and 4 pre-capture links; a substitute needs a SHA-256 second preimage [Steps 1, 2] |
| S5-2 | Client-seed manipulation | Pass | each of the 34 epochs ran under a distinct client seed submitted by the auditor, 5 of them player-set (Phase D), and all 5,936 rolls recompute under it; a changed client seed yields a different roll on 5,936 of 5,936 bets (collisions at 1/10,000) [Step 14] |
| S5-3 | Stake-conditional outcome | Pass | 235 rounds at 10.00 USDT on `over 50` (Phase C): every roll recomputes without a wager input (`diceRoll` takes none), 126 wins are settled by the same rule as the same band at 0.10 USDT, and the two payouts stand in the ratio of the stakes [Step 18] |
| S5-4 | Server-seed cherry-picking | Pass | primary defence: a client seed carrying 48 bits from a browser CSPRNG, submitted after the commitment it was used under had been served, for 34 of 34 epochs, per the capture's own record (**L18**). Pass 2 finds no return deficit at its power (z 0.164, p 0.5651) and 2 flags vs 1.49 (P = 0.4424). Nothing here rules out cherry-picking across the capture as a whole (**L4**) [Step 17] |
| S5-5 | Seed-rotation race (TOCTOU) | Not tested in this package | not applicable to this instant-settle archetype: no roll is pending against an unrevealed seed. This concerns that named class only, not server-side settlement atomicity in general, which a sequential client capture cannot test (R-RACE) |
| S5-6 | Multiplier tampering | Pass | no multiplier table exists; Step 7 pins the served multiplier to `9900/basisPoints` on 2,622 wins and Step 20 rebuilds every credit from the band alone with zero tolerance [Steps 7, 20] |
| S5-7 | Nonce manipulation | Pass | 34/34 epochs sequential from 0 under one client seed, 0 gaps, 0 duplicates; epoch sizes from `EXPECTED_EPOCHS`, not from the dataset (G-BIND); an operator-side gap would be a hard FAIL, a capture-retry gap a capture-origin FLAG [Step 4] |
| S5-8 | Modulo bias | Pass | `src/rng.ts` rejects the 7,296-value tail (≈1.7×10⁻⁶) rather than folding it; without rejection the per-value bias would be ≤ 1/maxFair ≈ 2.3×10⁻¹⁰; uniformity p 0.2335 (2M draws) and pooled real-roll p 0.3333 [Steps 16, 17] |

<!-- S5-MATRIX:END -->

S5: fairness-integrity matrix. This page covers the package's offline checks; live-API integrity testing is in Section 5 of the report.

| Supplementary | Category | Result | Finding |
|---|---|---|---|
| S5-D1 | Player-favourable band hunt | Pass | effective edge exactly 1.0000% on every captured bet; 0 player-favourable; a consequence of the half-open rule rather than an independent measurement [Step 15] |

The matrix, the mutation registry entry by entry and the result of the last full run are also published as [exploit-testing.md](exploit-testing.md). All integrity checks held in the seven tested categories.

## Reproduce the audit

Use **Node.js 22.23.1 or later in 22.x** (`package.json` `engines` `>=22.23.1 <23`, `.nvmrc` 22.23.1; validated on v22.23.1); `src/runtime.ts` refuses another major before anything is read or written (**L17**). From the package directory:

```sh
npm ci
npm test
```

`npm test` is `mocha && npm run verify && node scripts/release-manifest.mjs --check`. Expected: **110 passing unit tests; 22/22 steps pass (21 scored + 1 informational) · PROVABLY FAIR — Full Pass; REPRODUCED; release manifest OK; exit 0.** It scores the committed, SHA-256-pinned simulation artifact and does not regenerate it.

The unit suite has **110 tests** across ten files: `simChecksTests.ts` 38, `rngTests.ts` 18, `settlementTests.ts` 14, `statsTests.ts` 12, `exactNullTests.ts` 9, `artifactTests.ts` 7, `commitmentTests.ts` 5, `runtimeTests.ts` 4, `docsTests.ts` 2 (the companion documents equal what `scripts/build-docs.mjs` generates), `rngSpecTests.ts` 1 (the 128 checks of the specification's vectors and properties). Every data-dependent test reads the production dataset or the E17 probe record: the round-down rule on every win, at both stakes, from the band and from the served multiplier; no credit above the product; the E17 replies probe by probe and the count of discriminating probes; captured wins of every phase that has one, from roll to payout; force-exercised rejection vectors; the exact Pass-2 null against an independent derivation to 1e-12; the effective-edge identity over 59,998 bands; the artifact pins and the byte identity of the chart with its series; the population constants; and the pre-capture link of each of the four capture files.

`node verify.js` and `node test.js` run the same verification and unit suite with nothing but Node 22. They are build products of the TypeScript in `src/` and `tests/`. The generator ships as `scripts/build-standalone-verifier.mjs` (`npm run build:standalone` rebuilds both), and `npm run check:standalone-build` rebuilds both in a temporary copy and fails unless each matches the committed file byte for byte (it needs `npm ci`; it never writes into the package). `npm run test:standalone` is the zero-install equivalent of `npm test`. `node scripts/build-standalone.mjs [--check]` is the same build and the same check under the entry-point name the other LIQD packages use.

| Command | Purpose |
|---|---|
| `npm run verify` | the 22-step verification; writes only `outputs/run/` (results plus `diff.json`) |
| `npm run report` | `PF_EMIT=1`: the only command that rewrites `outputs/verification-results.json` and `outputs/report-figures.json` |
| `npm run simulate` | regenerate Pass 1 and Pass 2 from the pinned `SIM_MASTER_SEED` and the dataset's revealed seeds; byte-identical to the committed files |
| `npm run test:full` | mocha, simulate, then verify with `SIM_FRESH=1` (pin recorded, not enforced) |
| `npm run mutate` | the falsifiability battery in a sandbox copy |
| `npm run rtp-claim:write` | regenerate `outputs/rtp-claim-table.json`; then update its pin in `src/rtp-settings.ts` |
| `npm run release-manifest` | regenerate `RELEASE-MANIFEST.json`; `--check` verifies it |
| `npm run build:standalone` | rebuild `verify.js` and `test.js` from `src/` and `tests/` |
| `npm run check:standalone-build` | check that the committed `verify.js` and `test.js` are what the source compiles to |
| `node scripts/build-docs.mjs` | regenerate `evidence.md`, `exploit-testing.md` and `SUMMARY.md` from this overview, the registries and the files on disk; `--check` compares |
| `node scripts/algorithm-spec-check.mjs` | reprint every count the specification cites, from the dataset and the E17 record |

**Reproduction gate and exit codes.** `npm run verify` compares fresh results with the committed artifacts field by field. The committed artifacts carry no run metadata; time, runtime and pin mode go only to `outputs/run/diff.json`. Integers and pure-arithmetic statistics compare exactly, p-values and quantiles within 1e-14 absolute + 1e-12 relative (`src/diff.ts`), served-band aggregate sums at 1e-9. Exit **0** = Full Pass, **2** = any FLAG, **5** = RTP FIGURE OVERSTATED (the enforced RTP-CLAIM 1.2.0 rule finds the published figure overstated; not a draw fail), **1** = any FAIL or a reproduction beyond tolerance. Verification does not rewrite the evidence it scores.

**Simulation.** The Pass-1 producer is deterministic (DICE-20): every seed is `HMAC(SIM_MASTER_SEED, counter)`, the artifact carries no run metadata, and a regeneration reproduces the committed file. Pass 2 is a pure function of the dataset's revealed seeds and served bands. If a regeneration does not reproduce the committed artifact the cause is a changed seed, producer, dataset or runtime, not sampling noise; `outputs/run/diff.json` names every moved field. Pins: `simulation-results.json` `SIMULATION_SHA256` and `rtp-convergence.html` `SIMULATION_HTML_SHA256`, scored in Step 19 rather than aborting so a forged artifact reaches Steps 16–17; `artifactTests.ts` re-renders the chart from the committed series and asserts byte identity.

**Falsifiability.** `npm run mutate` applies **50** find/replace mutations (`tests/mutations.json`), **8** committed forgery scripts (`tests/structural-forgeries.json`, `tests/forgeries/*.mjs`) and **0** declared survivors (`tests/mutation-survivors.json`): 58 entries. Two of the mutations must end RTP FIGURE OVERSTATED, exit 5 (`M-C3i`, `M-C3ii`, below), and one, aimed at the informational Step 22, is recorded as an INFO signal. The result of the run of record is in the [release history](#release-history) and in [exploit-testing.md](exploit-testing.md). The settlement mutations target the round-down rule: rounding to nearest instead of down fails Step 8, rounding up fails Step 20. Removing the audit RNG's rejection guard is killed by Step 17, whose replay holds a rejected-tail cell that changes its band's outcome (the operator's own guard stays ASSUMED, **L11**). **The RTP FIGURE OVERSTATED route.** `M-C3i` prices one setting no captured bet used (win chance 50.03 %) 2 pp lower where the RTP table prices it; `M-C3ii` raises the published figure in `src/rtp-settings.ts`. Each is first run as edited, without regenerating, and must exit 1 with `[FAIL] Step 15`; then with `regen` (the table re-written and re-pinned and the record re-emitted in the sandbox) it must end exit 5, `VERDICT: RTP FIGURE OVERSTATED`, `[RTP FIGURE OVERSTATED] Step 15`. The runner checks that the named step is the one that fires and re-pins every hash-pinned artifact it mutates, as a forger would.

| Class | Mutations | Killed by |
|---|---|---|
| RNG / commitment | draw range off by one, HMAC cursor moved, commitment hashes raw bytes, rejection window widened, the audit module's rejection guard removed (the operator's is ASSUMED, **L11**) | Steps 5, 1, 17 |
| Win rule / boundary | lower bound exclusive; upper inclusive (rule only); upper inclusive consistently (rule and closed form) | Steps 13, 15; mocha E17 vectors |
| Payout | house edge doubled; round-down → round-to-nearest (served path); round-down → round-up (band path); the 0.01% win chance dropped from the plan | Steps 7, 8, 20, 10 |
| Sample-depth pins | edge, serial, convergence, 98-target and cherry-pick depths loosened | Steps 16, 17 |
| Pass-2 null | achieved rate reverted to nominal; χ² constant corrupted | Step 17 |
| Artifact forgery | model field with `pass:true`; `pass1.draws` = 1; null downgraded; a flag cleared; a per-seed statistic forged; a row detached; bands collapsed; convergence identity removed; pooled statistic forged | Steps 16, 17 |
| 98 targets | seed-stream base moved by one seed; a target moved off its stream position; a target's client seed replaced; a target's win count forged; a target RTP off any integer count; a mean point forged; a mean SE set to 123456; the target set collapsed; the mean's identity field removed | Step 16 |
| Fabricated Pass 1 | every raw statistic perfect, derived fields recomputed, `SIMULATION_SHA256` re-pinned | Step 16 (lower-tail χ² and seven standard errors); Step 19 passes |
| Fractional win count | `over 98` RTP implying a fractional win count, re-pinned | Step 16 |
| Coherent population shrink | every nonce from 30 up deleted, header and seed records doctored, re-pinned | Step 11 (Steps 4 and 12 fire as well) |
| Absent / malformed report figures | file deleted; `{not JSON` and four sibling cases | Step 19 |
| Forged served-band early return | re-pinned | Step 17 |
| Relabelled commitment hash; a losing round given a payout | each with the dataset re-pinned | Steps 3 and 9 |
| Closed form only | upper inclusive in `discreteWinCount` alone | Step 15 |
| Informational signal | rolls sorted into value order (M-LIVESERIAL) | Step 22 reports INFO; the reproduction gate goes red |

**Tolerances of record.** Roll, multiplier, credit, wallet, loss, plan-span and ceiling comparisons are exact; credits compare on the 1e-8 integer grid from decimal text; the per-bet edge identity is exact in integers; strict monotonicity uses 1e-12; artifact statistics as above; simulated RTP vs theory 5·SE + 1e-4; Pass-1 screens α/3; Pass-2 screens α = 0.01.

The executable workflow needs no casino credentials and only the Node.js `crypto` module is trusted. The release generator requires README.md and MANIFEST.md and checks that both carry the audit ID.

## Verify a bet

The quickest way is the [ProvablyFair.org LIQD verifier](https://www.provablyfair.org/verify-bets/liqd): after the seed pair rotates, it checks the commitment, roll, win, multiplier and the payout by the round-down rule in the browser.

Any player can also reproduce a past Dice bet by hand, with a standard crypto library and no LIQD software. Use the field names LIQD returns in the bet record and its seed-rotation reply, in order:

1. **Get the inputs.** `hashedServerSeed` (served with the round), `clientSeed`, `nonce`, the band `params` `{ lower, upper, inverted }` and `betAmount`. The `serverSeed` is revealed when the seed pair is rotated; an unrevealed seed cannot yet be checked.
2. **Check the commitment.** `SHA-256(utf8_bytes(serverSeed))`, the hash of the hex string as text, not of its decoded bytes, must equal `hashedServerSeed`.
3. **Compute the roll.** `key = hex_decode(serverSeed)`; `digest = HMAC_SHA256(key, "clientSeed:nonce:0")`; scan big-endian uint32 chunks for the first `< 4,294,960,000`; `roll = (chunk % 10000) / 100`. It must equal the recorded `roll`.
4. **Apply the win rule.** Not inverted: win iff `lower ≤ roll < upper`; inverted: win iff `roll ∉ [lower, upper)`. It must agree with the recorded `result`.
5. **Derive the multiplier.** `continuousWinChance% = inverted ? 100 − (upper − lower) : (upper − lower)`, `basisPoints = round(continuousWinChance% × 100)`, `multiplier = 9900 / basisPoints`. Written as `99 / continuousWinChance%` the last digit can differ; compare to 8 decimals if you use that form.
6. **Check the payout.** On a win, `winningAmount = floor8(betAmount × 9900 / basisPoints)`: the exact product, computed in decimal (not in floating point), rounded down to 8 decimals. On a loss, `winningAmount = 0` and `multiplier = 0`. This is the rule measured on every win of the production capture and the rule LIQD states. Any other value is a mismatch.

Worked trace, epoch 0 nonce 9 of the dataset, a credit that is rounded down:

```text
Bet ID:       JOaaqudLC5XcE2aFNic0w        Epoch/nonce: 0 / 9
Server seed:  3085a86bd812800c76ae7d81191955b2
Client seed:  audit8f7ccfa4326c
SHA256 UTF8:  99d78251a09a8c5ee083928d3ff835b1bca114e1ebf86cbf338f43959a583d8d (= stored hash)
HMAC message: audit8f7ccfa4326c:9:0
HMAC digest:  0227b8f4a2868a7df388b2431204df236ef73adf635599eedbe030ce63562c4a
First chunk:  0x0227b8f4 = 36157684 < 4294960000 → 36157684 % 10000 = 7684 → roll 76.84
Band:         [0, 98), not inverted → 0 <= 76.84 < 98, win
Multiplier:   9900 / 9800 = 1.010204081632653
Credit:       0.10 × 9900/9800 = 0.10102040816326530… → rounded down 0.10102040
Recorded:     roll 76.84, win true, winningAmount 0.10102040
```

Second example, at the higher stake: `EdvA4OjCUyOffdOqerqJ5` (epoch 31, nonce 1, Phase C): message `audit6d93604e032c:1:0` gives a first chunk `0x5235f88b = 1,379,268,747`, draw 8747, roll 87.47; `over 50` wins at `9900/5000 = 1.98×`; credit `10.00 × 1.98 = 19.80000000`, an exact product with no rounding. Epoch 0's `nextHashedServerSeed` `c8fce9a61f3ef154c364271d0f5a931ed0a9d27a9fdcb9fb2d74db62c0dc345a` equals epoch 1's commitment.

This standalone Python 3 checker reads only the dataset and recomputes nine rounds spanning four of the five phases, all modes, both stakes, a loss at each stake, exact and rounded-down credits and the 99× setting, with exact rational settlement; it imports nothing from the package:

```python
import hashlib, hmac, json, struct
from fractions import Fraction
from pathlib import Path

data = json.loads(Path("data/dice-prod-5936bets.json").read_text())
seeds = {s["epoch"]: s for s in data["seeds"]}
indices = [0, 7, 9, 2054, 3006, 5016, 5583, 5700, 5701]

def draw(seed, client, nonce):
    # docs/ALGORITHM.md section 2: one draw at cursor 0; the roll in hundredths, 0 ... 9999
    message = f"{client}:{nonce}:0".encode("utf-8")
    digest = hmac.new(bytes.fromhex(seed), message, hashlib.sha256).digest()
    for chunk in struct.unpack(">8I", digest):
        if chunk < 4294960000:
            return chunk % 10000
    raise ValueError("all eight chunks rejected: not specified (O2)")

for index in indices:
    bet = data["bets"][index]
    seed = seeds[bet["epoch"]]
    commitment = hashlib.sha256(seed["serverSeed"].encode("ascii")).hexdigest()
    assert commitment == seed["hashedServerSeed"] == bet["hashedServerSeed"]
    roll = draw(seed["serverSeed"], bet["clientSeed"], bet["nonce"])
    p = bet["params"]
    low = Fraction(str(p["lower"])) * 100
    high = Fraction(str(p["upper"])) * 100
    inside = low <= roll < high
    won = not inside if p["inverted"] else inside
    b = 10000 - (high - low) if p["inverted"] else high - low
    assert b.denominator == 1
    multiplier = Fraction(9900, int(b))
    exact = Fraction(bet["betAmount"]) * multiplier          # exact decimal stake x 9900/b
    payout = Fraction(int(exact * 10**8), 10**8) if won else Fraction(0)   # rounded down to 8 dp
    assert Fraction(roll, 100) == Fraction(str(bet["roll"])) and won == bet["win"]
    assert (float(multiplier) if won else 0) == bet["multiplier"]
    assert payout == Fraction(bet["winningAmount"])
    print(bet["id"], "commitment PASS", "roll", f"{roll / 100:.2f}", "win", won,
          "payout", f"{float(payout):.8f}")
```

| Index | Bet ID | Phase | Epoch / nonce | Stake | Mode / win chance | Roll | Win | Credit |
|---|---|---|---|---|---|---|---|---|
| 0 | `FhTtWka-tKUhjtUXxcA0R` | A | 0 / 0 | 0.10 | under / 2% | 97.67 | no | 0.00000000 |
| 7 | `aFaESPwqH0xjzFH_MGVwF` | A | 0 / 7 | 0.10 | under / 80% | 28.86 | yes | 0.12375000 |
| 9 | `JOaaqudLC5XcE2aFNic0w` | A | 0 / 9 | 0.10 | under / 98% | 76.84 | yes | 0.10102040 |
| 2054 | `Cp6pO0kMLIR_-nkDWIs_0` | A | 10 / 54 | 0.10 | inside / 35% | 66.94 | yes | 0.28285714 |
| 3006 | `I8Q8SDGxcfjU1popneurG` | A | 15 / 6 | 0.10 | outside / 65% | 80.10 | yes | 0.15230769 |
| 5016 | `ljxzosACO18qUy31tkwlA` | D | 25 / 16 | 0.10 | over / 65% | 75.05 | yes | 0.15230769 |
| 5583 | `iMgu6U7RKoct0VAxgLffJ` | A+ | 30 / 83 | 0.10 | outside / 1% | 0.45 | yes | 9.90000000 |
| 5700 | `9DfhEtFeDzitdNEV2qzHI` | C | 31 / 0 | 10.00 | over / 50% | 3.99 | no | 0.00000000 |
| 5701 | `EdvA4OjCUyOffdOqerqJ5` | C | 31 / 1 | 10.00 | over / 50% | 87.47 | yes | 19.80000000 |

Every recorded commitment, roll, win flag, multiplier and payout agrees with recomputation; the table is the checker's own output (run 10 November 2026). A matching recomputation verifies a recorded value; it does not establish when the commitment was received (**L18**).

## Evidence

The evidence is the data and the code: every cryptographic, payout and edge claim reproduces offline from a clean clone. No screenshot is part of this release.

| ID | File | Evidence and role |
|---|---|---|
| E01 | [data/dice-prod-5936bets.json](data/dice-prod-5936bets.json) | 5,936 production rounds (phases A, D, A+, C and X), 34 epochs, all revealed; 2,622 wins, 3,314 losses; LIQD's verify reply stored per round; SHA-256 `41ea55fc…`; hash-guarded |
| E02 | [outputs/verification-results.json](outputs/verification-results.json) | the 22 step results, the dataset hash (expected / actual / match) and an informational block (realized RTP in total and per phase, per-mode edges); written by `npm run report` |
| E03 | [outputs/simulation-results.json](outputs/simulation-results.json) | Pass 1 and Pass 2 at full precision, schema 3; SHA-256 `c6698388eb242683180135e687ec1f2074596eb87a19390dfe35176371913308` |
| E04 | [outputs/rtp-convergence.html](outputs/rtp-convergence.html) | self-contained convergence chart: the mean simulated RTP of the 98 targets, 10K → 1M bets per target, ±5·SE band; SHA-256 `6b7b6bb7c474a49b48effbd31dd69ca952e4af5ee451902dbaff4a745743e02c` |
| E05 | [src/rng.ts](src/rng.ts), [docs/ALGORITHM.md](docs/ALGORITHM.md) | the RNG and the specification it implements, grounded on production sources; reproduces all 5,936 rolls; `scripts/algorithm-spec-check.mjs` reprints the specification's counts |
| E06 | [src/config.ts](src/config.ts) | win chance, multiplier, discrete win count, half-open `diceWin`, effective edge, the price grid, the round-down settlement, the production plan constants (`EXPECTED_PHASES`) and pins |
| E07 | [tests/verify.ts](tests/verify.ts) | the 22-step runner over `tests/steps/*`; writes E02 under `outputs/run/` |
| E08 | [src/simulate.ts](src/simulate.ts) | the two-pass simulation, deterministic from `SIM_MASTER_SEED` and the dataset; writes E03 and E04 |
| E09 | `tests/dice/*Tests.ts` | the 110 unit tests |
| E15 | [outputs/report-figures.json](outputs/report-figures.json) | the derived figures: settled RTP per (band, stake) under round-down, the settlement residual's direction, boundary-hit power (4,547 rounds with a reachable upper bound, expectation 0.4547, 0 observed), cherry-pick power, per-phase and per-mode aggregates, verifier parity and the player-set seeds; written by `npm run report`, reconciled by Step 19 |
| E16 | [evidence/E16-prod-capture-check-2026-11-07.txt](evidence/E16-prod-capture-check-2026-11-07.txt) | the capture checker's printout of the Phase A raw export (SHA-256 `1592dc67…e2928e9`): secret scan, plan, pre-capture anchor, 25/25 epoch commitments and chain links, 25/25 client seeds submitted and accepted, request = served, production verify endpoint reply = served result on 5,000/5,000. Its one FAIL row ("payout", 4,512/5,000) is not a failed payout: the checker of that date compared the credits with a two-stage rounding rule, and the 488 rounds it lists are 98% wins that production rounds down to `0.10102040`, as the round-down rule gives. For the two later files the checker scores round-down (E18, E19), and Step 8 scores round-down on all 5,936 rounds |
| E17 | [evidence/E17-prod-verify-boundary-probes-2026-11-09.json](evidence/E17-prod-verify-boundary-probes-2026-11-09.json) | LIQD's production verify endpoint, 9 November 2026, logged out, no bet: 23 answered calls on seeds revealed in this capture, with the roll on a band bound (15), 0.01 off a bound (6), on the range edge 99.99 inside its band (1), and one re-sent verify call of the capture; request and reply bodies as received with the reply's SHA-256; the raw log's SHA-256 is recorded in the file; three unanswered transport attempts are listed, not copied. Pinned (`E17_SHA256`), re-derived by Step 15 |
| E18 | [evidence/E18-prod-capture-check-2026-11-10-phases-D-A.txt](evidence/E18-prod-capture-check-2026-11-10-phases-D-A.txt) | the capture checker's printout of the Phase D and A+ raw export (SHA-256 `8246abcc…9671e0`): all checks pass; 5 player-set seeds submitted at the rotation opening their epoch and taken by the site 5/5; payout by round-down on 700/700; verifier reply = served result on 700/700. Its 'drawn after' line holds for the A+ seed. The 5 Phase D seeds were drawn when the plan was built and submitted after their commitment was served (**L18**) |
| E19 | [evidence/E19-prod-capture-check-2026-11-10-phase-C.txt](evidence/E19-prod-capture-check-2026-11-10-phase-C.txt) | the capture checker's printout of the Phase C raw export (SHA-256 `5f4fbf8d…eccad8`): all checks pass; 235/235 rounds at 10.00 USDT; payout by round-down on 235/235; verifier reply = served result on 235/235 |
| E20 | [evidence/E20-prod-verify-9900x-probes-2026-11-10.json](evidence/E20-prod-verify-9900x-probes-2026-11-10.json) | LIQD's production verify endpoint, 10 November 2026, logged out, no bet: 10 answered calls on seeds revealed in this capture, each with a 0.01% band (one basis point) placed with a known roll on its lower bound (4, all winning, priced 9900×), on its upper bound (3, losing) or one hundredth above the roll (3, losing); request and reply bodies as received with the reply's SHA-256; the raw log's SHA-256 is recorded in the file. Pinned (`E20_SHA256`), re-derived by Step 15 |
| E21 | [evidence/E21-prod-capture-check-2026-11-10-phase-X.txt](evidence/E21-prod-capture-check-2026-11-10-phase-X.txt) | the capture checker's printout of the Phase X raw export (SHA-256 `14875832…85cfd0`): all checks pass; 1 round at 0.10 USDT on `under 0.01`, lost; seed rotated before and after, commitment and chain OK; verifier reply = served result |
| — | [evidence/rtp-page-labels-2026-10-01.json](evidence/rtp-page-labels-2026-10-01.json) | the live `liqd.com` Dice page read logged out on 1 October 2026 (`Edge: 1.00%`, RTP 99%); the source of the RTP-CLAIM figure |

Evidence numbers E10 to E14 are not used. The same register, with the origin and SHA-256 of every item, is [evidence.md](evidence.md).

| Artifact | SHA-256 | Guard |
|---|---|---|
| `data/dice-prod-5936bets.json` | `41ea55fcadd903768be3a92725f2100fe2e794ab300d6842ce946124ea7d5042` | `DATASET_SHA256`; the loader aborts on any single-byte change |
| `outputs/simulation-results.json` | `c6698388eb242683180135e687ec1f2074596eb87a19390dfe35176371913308` | `SIMULATION_SHA256`, scored in Step 19, asserted in `artifactTests.ts` |
| `outputs/rtp-convergence.html` | `6b7b6bb7c474a49b48effbd31dd69ca952e4af5ee451902dbaff4a745743e02c` | `SIMULATION_HTML_SHA256`, Step 19; re-rendered from the series and compared byte for byte |
| `evidence/E17-prod-verify-boundary-probes-2026-11-09.json` | `3cf8d772f60f62793579db7f0041ef81e77aff490b95e03717fd96c23f82de98` | `E17_SHA256`, Step 15, asserted in `artifactTests.ts` |
| `evidence/E20-prod-verify-9900x-probes-2026-11-10.json` | `78e57a33211b1d0ad4ce97fa1426c2c6e3db9bed8c04c60503b1d731d799c9b2` | `E20_SHA256`, Step 15, asserted in `artifactTests.ts` |
| `outputs/report-figures.json` | regenerated by `npm run report` | artifact of record, must be committed; Step 19 reconciles it field for field and its absence fails; settled-RTP and residual signs are computed in exact arithmetic (**L16**) |
| `outputs/verification-results.json` | — | written by `npm run report`; compared field by field |

A pin proves a file is the committed one, not that its statistics are real: a fabricating auditor re-pins in the same commit. That is why Step 16's two-sided screen and structural checks, and the deterministic regeneration, carry the weight. Step 19 also requires every numeric leaf of `simulation-results.json` and `report-figures.json` to sit inside a domain derived from `src/config.ts`.

## Limitations and trust

LIQD Dice uses the client seed + server seed commit-reveal model with one draw per bet and no external entropy. Commit-reveal, as confirmed on the full production dataset, removes post-bet tampering conditional on the attested chronology (**L18**), removes seed foreknowledge through the next-seed chain, makes the client seed load-bearing, and shows faithful execution and payout conformance.

| ID | Residual | Tier | Register |
|---|---|---|---|
| R-CHERRY | server-seed cherry-picking; the defence is a client seed set unpredictably and submitted after the commitment, for 34 of 34 epochs (48 bits from a browser CSPRNG per seed) | structural, MEDIUM; an external beacon would make it LOW by construction | **L4**, **L18** |
| R-EDGE | effective edge vs the discrete grid | resolved, conditional on the verifier-witnessed boundary rule | **L2**, **L3** |
| R-ORPHAN | server-side selective orphaning (a settled bet omitted from the reveal); a beacon does not close it, a signed server-side audit log would | disclosed | **L13** |
| R-CREDIT | the payout in LIQD's bet reply is checked against the rule; no balance change was read | disclosed | **L5** |
| R-MULTI | cross-account seed correlation | out of scope | **L15** |
| R-RACE | mid-bet seed-rotation race | not applicable (instant settlement) | — |

### Declared limitations register

Each entry is a limitation this audit found in its own work, measured and published; `DL-n` is the same entry's framework id. A gap in what our capture exercised is ours and is not a finding about LIQD. A finding that maps onto nothing here is new.

| ID | Limitation and magnitude | Why this capture cannot close it |
|---|---|---|
| **L1** (DL-1) | **A subtly forged Pass-1 statistic is not recomputed in the fast `verify` (narrowed).** Five raw quantities (`uniformity.chi2`, `serial.lag1`, `serial.runsZ`, each band's and target's `simulatedRTP`, the convergence RTP paths) come from 138,000,000 draws the fast verify does not repeat. They are bounded by the two-sided screen and structural checks. The producer is deterministic, so `npm run test:full` reproduces them byte for byte. `tests/forgeries/fabricated-pass1.mjs` re-pins and Step 19 passes on it | a reader who runs only the fast path relies on the structural checks |
| **L2** (DL-2) | **The half-open win rule is witnessed on LIQD's production verifier, not on a settled round.** E17 and E20: 33 of 33 replies follow it and 11 of them separate it from inclusive-both-ends. In the settled data the inclusive model reproduces all 5,936 win flags with **0** mismatches (`boundary.betsWhereBoundaryModelsDisagree`); **0** rolls landed on an upper bound against an expectation of **0.4547** (4,547 rounds have a reachable upper bound; 1,389 carry `upper = 100`) and 0 on a lower bound. That settlement applies the verifier's rule to a roll on a bound is ASSUMED | needs a settled production round whose roll lands exactly on a bound: about 1 in 10,000 rounds per bound, so a capture far larger than this one |
| **L3** (DL-3) | **The flat 1.0000% edge is a model identity, not a measurement.** 0.01 by algebra for every 2-dp band; verified over 59,998 bands; float form departs by at most 6.99e-15 across the capture and 5.06e-13 at an `over 99.99` band | not closable by construction; its power is against changes to the model |
| **L4** (DL-4) | **Pass-2 served-band return uses exact moments with an asymptotic (CLT) tail, not an exact-lattice CDF** (ASSUMED to satisfy DICE-21 `full`). z 0.164, p 0.5651; 80% power against a 14.629 pp per-bet deficit, so a smaller selection effect passes. Most epochs mix several win chances, so the exact CDF is a convolution of heterogeneous scaled binomials. Supplementary screen needs 6 flags (P(X ≥ 6) = 0.0033) | a capture holding one band per epoch would make the exact CDF tractable; the load-bearing defence remains structural |
| **L5** (DL-5) | **No wallet balance ledger.** `stakeWallet` and `winningAmountWallet` are present and checked with zero tolerance; no balance is in any production dice reply, so the audit shows the settle-response fields are consistent with the formula, not an observed balance change (R-CREDIT) | needs a capture recording `Δbalance == winningAmount − betAmount` per bet |
| **L6** (DL-6) | **Closed.** A rounding-tie premise of an earlier settlement model; production settles by a floor of the exact product, which has no tie | slot kept so later entries keep their identifiers |
| **L7** (DL-7) | **LIQD's odds and bet limits were not read, and only the win chances 0.01% and 1% to 98% were played.** The capture holds 12 win chances: 0.01% (9900×, one round, lost) and 11 from 1% (99×) to 98% (1.0102×), at two stakes, 0.10 and 10.00 USDT. LIQD's production verifier prices the 0.01% band at 9900× and settles it by the half-open rule on 10 probes (E20); a settled win at 9900× was not captured. What production accepts or rejects between 0.01% and 1% and above 98%, and any payout or exposure cap, is not measured; the model prices every width on the grid at exactly 99% RTP | needs production bets or refusals at the other widths and stakes, and a settled 9900× win, with the raw replies |
| **L8** (DL-8) | **`basisPoints` is an auditor derivation, not an operator field.** The quotient matches 2,622/2,622; the float closed form agrees on 1,651 | needs an operator field, specification or source |
| **L9** (DL-9) | **Dataset provenance is auditor-attested.** The chain shows internal consistency and order; it does not bind the rounds to LIQD. The raw exports and the capture script are kept by the auditor and are not in the package | not closable offline by anyone; needs operator-signed settlement records or an independent third-party capture |
| **L10** (DL-10) | **Resolved.** The `pass1.serial.zCritical` field: the artifact stores the applied threshold and Step 16 asserts they agree | slot kept so later entries keep their identifiers |
| **L11** (DL-11) | **The operator-side modulo-bias rejection guard is ASSUMED.** Rejection p ≈ 1.7e-6 per draw; no captured round hits it. The audit module's own guard is exercised by unit vectors and by Step 17's replay (epoch 8, nonce 6366), so removing it fails `npm run verify` | no client capture of this size can force a rejection on a settled round; bias impact if absent ≤ 1.7e-6 |
| **L12** (DL-12) | **Closed.** Every item of the plan is measured on production (the boundary rule by E17, the higher stake by Phase C, the 99× setting by the A+ top-up, the 9900× setting by Phase X and E20, player-set seeds by Phase D) or stated as not measured (**L7**) | slot kept so later entries keep their identifiers |
| **L13** (DL-13) | **Trailing withholding is not observable client-side** (R-ORPHAN). Nonces are contiguous and `nonceStart` is the served post-rotation nonce, but the trailing bound is the auditor's last recorded nonce | needs the operator's bet counter for the pair read before each rotation (`operatorBetCount`) or a signed server-side log |
| **L14** (DL-14) | **Verifier ≡ settlement engine is witnessed only away from a boundary.** Production verify replies equal the served round on 5,936/5,936, none with a roll on a bound; on a bound only the verifier was asked (E17) | needs the same settled boundary evidence as L2 |
| **L15** (DL-15) | **Single account, four capture files over four days** (R-MULTI). Cross-account treatment and seed reuse, and later behaviour, are not ruled out. The four capture files are not linked to one another by the chain: the account's seed pair rotated in between, outside the dataset | needs coordinated multi-account capture |
| **L16** (DL-16) | **`report-figures.json` is reconciled within a single run**, so its production is not independently witnessed. Absence fails | the recomputation is our code against our code; the witness is the dataset, whose provenance is L9 |
| **L17** (DL-17) | **One validated runtime, Node 22.x.** A run on Node 24 once failed over a single-ULP difference in `cherryPickPower.pAtMinRejectable`, a binomial tail built from `**`, which ECMAScript leaves implementation-approximated. Node 24 has not been re-tested | widening tolerances would admit forgeries; closing it means validating each runtime or replacing the transcendental-dependent statistics |
| **L18** (DL-18) | **Commitment chronology is auditor-attested, not authenticated.** Steps 1–3 establish which value goes with which; a SHA-256 digest carries no time. That each client seed was submitted after the commitment it was used under had been served is the capture's own record (the runner's `drawnAfter` field and event times; the checker printouts E16, E18, E19, E21). The 29 `audit` seeds were drawn at that moment; the 5 Phase D seeds were drawn when their plan was built and submitted at their rotation. Every non-alteration statement is conditional on the capture record | not closable offline; needs commitments in an append-only log with independent timestamping |

### Load-bearing premises

| Premise | Witness | Could the captured data contradict it? |
|---|---|---|
| Win rule half-open `[lower, upper)` | `evidence/E17-prod-verify-boundary-probes-2026-11-09.json` and `evidence/E20-prod-verify-9900x-probes-2026-11-10.json` (LIQD's production verifier; 11 probes with the roll on a reachable upper bound discriminate); asserted in Step 15 (E17 and E20) and `rngTests.ts` (E17) | the settled rounds no: both rules reproduce all 5,936 flags; the verifier records yes, and they agree on 33 of 33 (**L2**) |
| Settlement treats a roll on a bound as the verifier does | ASSUMED: E17 and E20 are verifier records and no settled roll landed on a bound | no (**L2**, **L14**) |
| Commitment = SHA-256(utf8(hex string)) | `data/dice-prod-5936bets.json` | yes: 34/34 |
| RNG = HMAC-SHA256, hex-decoded key, `cs:nonce:cursor` | `data/dice-prod-5936bets.json` | yes: 5,936/5,936 bit for bit |
| Multiplier = `9900 / basisPoints` | `data/dice-prod-5936bets.json` and `evidence/E20-prod-verify-9900x-probes-2026-11-10.json` (one basis point) | yes: 2,622 of 2,622 strict matches; the float closed form matches fewer; 4 of 4 winning one-basis-point probes priced 9900× |
| Credit = `floor8(stake × 9900/basisPoints)` | `data/dice-prod-5936bets.json` | yes: 2,622/2,622 at two stakes, 1,102 of them rounded down |
| LIQD's verifier returns the settled result for a roll that is not on a bound | `data/dice-prod-5936bets.json` (`verifier` per round) | yes: the stored verify replies equal the served round on 5,936/5,936 (a roll on a bound is the premise above, **L14**) |
| Operator applies the rejection guard | ASSUMED: unexercised at p ≈ 1.7e-6 per draw | no (**L11**) |
| Each commitment existed before its bets | ASSUMED: the capture record; the pre-capture links order records without dating them | no: no offline computation on this dataset can separate the two (**L18**) |
| DICE-21 realized as exact moments + one-sided normal tail | ASSUMED to satisfy DICE-21 `full`; witness Step 17, `SIM_PASS2_*`, `pass2.servedBand` | partial: moments and observed z are re-derived exactly and a forged early return is caught; the CLT-tail adequacy is the premise (**L4**) |

### Model anchors

| Modelled figure | Anchor | Tolerance | Enforcing test |
|---|---|---|---|
| Roll recomputation | bit-for-bit re-derivation of all 5,936 money-settled production rolls under the intact in-file chains; corroborated by LIQD's stored verify reply for every round | exact | `tests/steps/determinism.ts` (Steps 5, 6) |
| Effective edge per band | discrete tally of winning outcomes over the 10,000-point grid; no operator odds field read | exact integers | `tests/steps/anti-circularity.ts` (Step 13), `tests/steps/boundary.ts` (Step 15) |
| Served multiplier = `9900/basisPoints` | direct measurement of served minus quotient on every win | 0, strict `===` | `tests/steps/payouts.ts` (Step 7) |
| Credit = `floor8(stake × 9900/basisPoints)` | direct comparison with every served credit, from the served multiplier and from the band, at two stakes | 0, on the 1e-8 integer grid | `tests/steps/payouts.ts` (Step 8), `tests/steps/standardization.ts` (Steps 18, 20) |

**Residual, declared.** The tally and the engine share one reading of the rules (grid, half-open bands, continuous pricing), so a shared misreading moves both. The tally never scales a band bound, so it cannot share an arithmetic error with the closed form. Both implementations were written by the same team; the defence is architectural, and the external witness of the reading is the verifier records E17 and E20.

### Recommendations

| ID | Recommendation |
|---|---|
| P1 | Publish the boundary rule: a roll equal to the lower bound wins, equal to the upper bound loses (inverted the complement). A verifier author assuming inclusive bands will mispredict a 1-in-10,000 boundary bet |
| P2 | Publish the win rule, the multiplier and the round-down credit rule next to the byte-level algorithm, with a validation vector from a revealed epoch |
| A1 | Record the operator's bet counter for the seed pair before each rotation, so the trailing bound of an epoch is operator-sourced |
| A2 | Probe the widths between 0.01% and 1% and above 98%, a settled 9900× win and the accepted stake range on production, keeping the raw replies, and characterise any payout or exposure cap |
| A3 | Multi-account seed-correlation study |
| A3b | A stronger return-based cherry-pick test: one target band held per epoch, so the exact distribution is tractable |
| A4 | A browser-ready single-file wrapper of `src/rng.ts` for players without Node |

## Terms

**Provably fair / commit-reveal:** outcomes fixed by a seed whose hash is published first and revealed later; depends on the commitment being published before the round (**L18**). **Server seed:** 32-hex (16-byte) operator secret; the HMAC key in hex-decoded form. **Commitment:** `SHA-256(utf8(serverSeed hex string))`. **Client seed:** player-controlled HMAC input; a defence against cherry-picking only when unpredictable and submitted after the commitment. **Player-set seed:** a client seed whose text the player chose; Phase D uses five. **Nonce:** bet index within an epoch, from 0. **Cursor:** third HMAC field, 0 for Dice; it changes the message, not an offset into a digest. **Roll:** draw / 100 on `[0.00, 99.99]`. **Band / mode / inverted:** the bet `{lower, upper, inverted}` and its four shapes. **Half-open rule:** win on `roll ≥ lower` and `roll < upper` (or the complement). **Continuous vs discrete win chance:** the priced width vs the fraction of the 10,000 points that win; equal under the half-open rule. **Basis points:** the win chance in hundredths of a percent. **Effective edge:** `1 − discreteWinChance × quotedMultiplier`. **floor8:** rounding down to 8 decimal places, applied to the exact product. **Modulo-bias rejection:** discarding values at or above `floor(2³²/range)·range`. **Instant settlement:** one call places and settles. **Epoch:** the rounds under one seed pair. **Phase:** a block of the capture plan (A, D, A+, C, X). **Capture file:** one raw export of the runner; the dataset holds four. **Chain link:** `nextHashedServerSeed`; orders records, does not date them. **Pre-capture link:** the seed pair active before a capture file's first bet, whose next hash is that file's first commitment. **Anti-circularity:** theoretical figures from grid arithmetic, never operator odds fields. **Exact discrete null:** the enumerated distribution of the Pass-2 χ². **Selective orphaning:** settling a bet and omitting it from the reveal. **Standard error (SE):** σ/√n, the quantity the convergence chart's band is drawn from. **Hard fail:** any FAIL, exit 1; a FLAG is a Conditional Pass, exit 2. **G-BIND:** every population assertion binds to source records and `src/config.ts` constants, never to a count the artifact supplies about itself. **G-VALID:** a statistic landing exactly on its expectation is legal; exactness is never treated as evidence of fabrication. **G-EXEC:** a verdict is given only for a run that executed every step.

## Release history

**`v1.3.0`** (11 November 2026, tag `v1.3.0`). The scored dataset is `data/dice-prod-5936bets.json`, the `liqd.com` production capture of 7 to 10 November 2026: 5,936 rounds, 34 epochs, Phases A, D, A+, C and X, where Phase X is one round at 0.10 USDT on `under 0.01` (the 9900× setting, 1 basis point) in its own epoch as a fourth capture file (lost); E20 holds LIQD's production verifier replies on 0.01% bands, and Step 15 re-derives E20 with E17. Verdict: 22/22, 0 flags, 0 hard fails, `PROVABLY FAIR — Full Pass`. The ProvablyFair.org LIQD verifier is the first way to verify a bet. Mutation run of record: `npm run mutate`, 10 November 2026, on the validated runtime, all 58 entries, on tree `d4e1364c4fb8e581fafc5e51611e7d08cea6b136`: **57 killed, 1 informational signal, 0 survivors as declared, 0 not as declared**, `FALSIFIABILITY BATTERY PASSED`. Supersedes `v1.2.0`.
