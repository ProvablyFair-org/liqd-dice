# LIQD Dice — Consolidated Audit Overview

**Audit ID:** `PF-2026-LQ04` · **Auditor:** ProvablyFair.org · **Release:** `v1.1.0` (supersedes `v1.0.0`, the first public release) · **Framework:** 1.1

Game: Dice (`gameId` `originals-dice`) on LIQD.com, captured against `qa.liqd.com` in USDC from one authenticated session. Audited August–September 2026. Dataset of record: **27 August 2026**, from `2026-08-27T18:52:46.346Z` to `2026-08-27T20:30:03.954Z`; boundary and limit probes followed on 31 August and 1 September 2026. Publication date: 21 October 2026 (release `v1.0.0`). Report: `https://audit.provablyfair.org/casino/liqd/games/dice/overview`. This overview consolidates the package documentation on 4 October 2026; the machine-readable release identity is [RELEASE-MANIFEST.json](RELEASE-MANIFEST.json).

## Conclusion and scope

**PROVABLY FAIR — Full Pass, provisional — pre-launch capture.** 22/22 steps pass (21 scored + 1 informational), 0 flags, 0 hard fails; 123/123 unit tests pass. Every one of the 6,700 captured bets recomputes bit-for-bit from its `(serverSeed, clientSeed, nonce)` inputs; the commit-reveal chain is intact across all 134 seed epochs; every credited payout, game-side and wallet-side, matches the two-stage 8-dp settlement rule `ROUND_HALF_EVEN_8(stake × ROUND_8(multiplier))` exactly. 2,000,000 simulated draws show outcome uniformity and per-band effective-edge convergence, and a serial-independence screen on the first 200,000 of those rolls returns non-rejection.

**Provisional scope.** All bets were captured against LIQD's pre-production environment (`qa.liqd.com`) before public launch; as read logged out on 1 October 2026, Dice's `liqd.com` page shows "Released: September 2026". The certification applies to the audited build; that `liqd.com` production serves the same game build is not established by this capture (**L12**). Production parity will be confirmed by an anonymous post-launch capture, and the certification page reflects provisional status until that verification completes.

**Return to player.** Theoretical RTP is **exactly 99.00% on every bet before 8-dp settlement rounding**, a flat 1.00% edge, exact under the half-open win rule observed on the operator's verifier (E13) and assumed for settlement (**L2**). That flat edge is a model identity, not a measurement (**L3**): it follows by algebra for every 2-dp band, and the boundary rule rests on 2 of E13's 7 probes; the settled data has zero power on it. After rounding, the settled RTP per (band, stake) spans **98.99999491%–99.00000520%**, never at or above 100%. The observed return over the capture is a variance illustration only.

**Commitment chronology.** Matching hashes and an intact chain establish which seed goes with which bet and in what order the records sit, never when a commitment came into existence. That each commitment preceded its bets rests on the auditor's capture record (**L18**). Conditional on that attested chronology, and on SHA-256 preimage resistance, LIQD could not have altered a roll after the bet was placed.

**Open operator items.** **F-ROUNDING:** asked on 30 September 2026 how payouts are rounded, LIQD described them as rounded down to 8 decimals; the capture does not follow that rule (1,316 of 2,807 winning credits are one unit, 0.00000001, higher than round-down, none lower). LIQD's reply is pending. **F-LIMITS:** a 9900× bet was accepted and settled live although LIQD's own settings field reads `maxOdds` 99. Neither changes the verdict; see [Findings](#findings).

**Scope.** In scope: the RNG (HMAC-SHA256 draw on the hex-decoded server seed, 4-byte big-endian `uint32` scan with modulo-bias rejection, mapped to a roll on `[0.00, 99.99]`), the commit-reveal protocol, roll and win-rule reproduction in all four modes (under, over, inside, outside), payout integrity (the `9900/basisPoints` quotient and the two-stage credit), RTP and structured exploit testing. Out of scope: platform security, accounts, deposits, withdrawals, KYC, responsible gambling, other LIQD games, the server-side entropy source (bounded by the commitment) and production parity. LIQD is centralized; verifiability rests on commit-reveal, not a blockchain. One account, one capture window.

A Full Pass is not a claim that nothing is left open. Nineteen limitations are enumerated with their magnitudes in the [declared limitations register](#declared-limitations-register) (**L1**–**L19**); **L10** is resolved and its slot kept, and two (**L6**, **L11**) are executed survivors that `npm run mutate` requires to survive.

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

## Dataset and capture

The dataset is [data/dice-master-6700bets.json](data/dice-master-6700bets.json), structure `{ meta, seeds, bets }`. Each bet joins to its revealed seed by `epoch` and `hashedServerSeed`; `src/loader.ts` builds the indexes. All 134 server seeds are present and revealed.

| Quantity | Result |
|---|---|
| Bets / seed epochs | 6,700 / 134, 50 recorded bets per epoch, nonces 0–49 each present once |
| Wins / losses | 2,807 / 3,893 |
| Phases A / B / C / D | 5,000 / 1,000 / 200 / 500 |
| Modes under / over / inside / outside | 1,362 / 2,592 / 1,360 / 1,386 |
| Client seeds | 134 distinct, of which 10 custom `pfaudit-` seeds |
| Stakes | $0.10 and $10.00 |
| Total staked / returned | $2,650.00 / $2,744.36236730 |
| Roll range | 0.00–99.99, mean 49.796 |
| Winning multiplier range | 1.0105134224762682–99 |
| Distinct bands / win-chance values | 5,304 / 4,176 |

| Phase | Bets | Stake | Target | Purpose |
|---|---:|---:|---|---|
| A | 5,000 | $0.10 | random target across all four modes (win chance ~1–98%) | full-range uniformity and payout sweep |
| B | 1,000 | $0.10 | 500 × `over(98)` (49.5×) + 500 × `over(99)` (99×, top of the captured range) | high-multiplier tail |
| C | 200 | $10.00 | `over(50)` (1.98×) | stake independence, 100× the base stake |
| D | 500 | $0.10 | random target under 10 custom `pfaudit-` client seeds | client-seed control |

This is the ProvablyFair.org standard four-phase dice capture. Population checks compare the dataset against code constants in `src/config.ts` (`EXPECTED_BETS = 6700`, `EXPECTED_SEEDS = 134`, `EXPECTED_EPOCH_SIZE = 50`, `EXPECTED_PHASE_BETS`); `meta.plannedTotal`, `meta.epochSize` and `meta.phases` are reconciled against them (G-BIND).

| Input | Identity |
|---|---|
| [data/dice-master-6700bets.json](data/dice-master-6700bets.json) | SHA-256 `ca1a181a9b4c89a1823e15fe71603b7a5e2267382c134873d80cba536d3aef34` |

Dice has no multiplier-table file: the payout is the quotient `9900/basisPoints`, computed from the band. `loadDataset()` recomputes the dataset hash and aborts before any step runs on a mismatch.

**Field origins.** Evidence is distinguished as response values, request parameters, cached state, capture annotations, recomputed results and session attestations.

| Field | Origin and interpretation |
|---|---|
| `id`, `nonce`, `serverSeedId`, `win`, `result` | response fields; nonce from the consumed-nonce or available response nonce field |
| `params` | the requested `{lower, upper, inverted}` band |
| `roll`, `multiplier`, `betAmount`, `winningAmount` | response values stored after numeric conversion; the original decimal text is not retained |
| `clientSeed` | response value where available, otherwise cached seed state; the per-row source was not recorded |
| `hashedServerSeed` | commitment cached from the active-seed or rotation response that opened the epoch; the capture writes it onto every bet row (so Step 3 is a consistency check on the file) |
| `stakeWallet`, `winningAmountWallet` | wallet-denominated settlement-response amounts, present and checked on all 6,700 bets |
| `serverSeed`, `nextHashedServerSeed` (seed records) | revealed seed and next-seed commitment |
| `nonceStart`, `nonceEnd` | `nonceStart` is the capture default `cur.nonce ?? 0` (0 on all 134 epochs); `nonceEnd` is the last recorded nonce; neither is an operator-certified count |
| `localRoll`, `localWin`, `verified`, `creditedOk`, `modelMultiplier`, `multOk`, `walletOk`, `commitVerified`, `chainLinkOk`, `creditVerified`, `multVerified` | capture-side calculations; verification derives its own results |
| `balanceOk` | null on all 6,700 bets; no before/after wallet balance was captured (**L5**) |
| `epoch`, `phase`, `at` | capture bookkeeping; `at` is the capture client's clock |

The capture applied zero defaults when multiplier or winning-amount fields were absent, so a stored zero alone cannot distinguish an explicit operator zero from that fallback; every row still reconciles. `meta.edgeScan`, `meta.limits` (the operator config snapshot, whose `maxOdds 99` is the config field addressed by F-LIMITS) and the self-check flags were computed at capture time under the retracted inclusive-both-ends band model and ceil/floor bound scaling, so several `edgeScan` entries carry retracted `winPct`/`edgePct` values. They are read by no scored step (`edgeScan` is referenced only in `capture/`) and must not be cited; every scored figure is re-derived from `serverSeed, clientSeed, nonce, params, roll, win, multiplier, betAmount, winningAmount`. The dataset is the hash of record, so these are disclosed, not removed.

**Method.** The RNG code, `src/rng.ts`, was rebuilt from a written specification ([docs/ALGORITHM.md](docs/ALGORITHM.md)) by an implementer who never opened LIQD's code. The specification was written from LIQD's public pages and screens, the standard provably-fair construction, the E13 verify-endpoint replies and the 6,700 captured bets, without opening LIQD's code or any port of it. LIQD's own verifier is run as a second check, not used as the source: the E13 replies and session-recorded vectors from its verify endpoint (`/api/v1/originals/dice/verify`, read-only; raw responses not retained) reproduce. The audit relies on that endpoint for one thing only: the boundary semantics of the band (E13), which no settled bet can witness. Every other check derives from the revealed seeds and first-principles arithmetic. Endpoints: place-bet (`{ idempotencyKey, stake, params }`, places and settles one bet), provably-fair active (current commitment, next commitment, client seed), rotate (reveals the retiring seed), verify. The capture rig minted a new idempotency key on each retry, so a lost response could have double-settled a bet; none did (no epoch shows a nonce gap or a duplicated nonce), but the idempotency property was not exercised.

The capture reference record [capture/capture-dice.reference.mjs](capture/capture-dice.reference.mjs) documents phases, endpoint shapes, rotation discipline and inline checks, with authentication removed. It differs from the collector used for this dataset in client-seed generation and numeric-field handling, both changed after the capture. `capture/rng.reference.mjs` is the RNG module that record imports (draw, roll, win rule and commitment hash, as the capture computed them); no scored step reads it, the scored reference is `src/rng.ts`. `capture/client-seed.reference.mjs` (future-capture client-seed chooser) and `capture/bet-operation.reference.mjs` (a retry-identity reference module the capture of record did not use) are capture helpers, not evidence of an executed capture. That the 6,700 rounds were settled by LIQD's system in the stated window is auditor-attested (**L9**).

## Game and algorithm

### Commitment and seed lifecycle

```text
hashedServerSeed = SHA-256(UTF-8(serverSeed hex string))     // Stake convention
```

The commitment hashes the 32-character hex string; the HMAC key below is the hex-decoded 16 bytes. All 134 revealed seeds match. Each epoch also publishes `nextHashedServerSeed`, which equals the following epoch's commitment on 133/133 transitions; the pre-capture record's revealed seed hashes to its own commitment and its successor hash is epoch 0's commitment. These are orderings of records, not dates (**L18**). An epoch is 50 bets under one `(serverSeed, clientSeed)` pair; after the 50th bet the seed rotates and the retiring seed is revealed (retrievable by `serverSeedId`). Settlement is instant: one call places and settles a bet, so there is no open round and no mid-round reveal. No drand, block hash or VRF is involved; the core is the same as LIQD Plinko and Mines.

### Draw and roll

```text
key      = hex_decode(serverSeed)                       // 16 raw bytes
message  = UTF-8(clientSeed + ":" + nonce + ":" + cursor)  // cursor = 0
digest   = HMAC-SHA256(key, message)
maxFair  = floor(2^32 / 10000) * 10000 = 4294960000
read the digest as eight big-endian uint32; accept the first x < maxFair
draw     = x % 10000
roll     = draw / 100                                    // 0.00 … 99.99
if all eight are rejected: not specified (docs/ALGORITHM.md O2); src/rng.ts stops with an error
```

`src/rng.ts` implements this (`commitHash`, `generateProvablyFairNumber`, `diceRoll`, which returns the draw in hundredths) with Node.js `crypto` only, rebuilt from [docs/ALGORITHM.md](docs/ALGORITHM.md) by an implementer who never opened LIQD's code; its 84 spec checks run as `tests/dice/rngSpecTests.ts`. Each bet uses one draw, so the roll takes one of 10,000 equally likely values and never reaches 100.00. `2^32` leaves 7,296 values above the last whole multiple of 10,000; rejecting them leaves `4,294,960,000 = 429,496 × 10,000` admissible values, so each residue receives exactly 429,496 and the bias is 0. The per-chunk rejection probability is `7296 / 4294967296` ≈ 1.7 × 10⁻⁶; no captured draw reaches the all-chunks case, which the specification leaves open (O2): `src/rng.ts` stops with an error there, where the module it replaced, ported from LIQD's code, moved to cursor + 1,000,000. The audit module's rejection branch is force-exercised by unit vectors; whether the operator's server applies the same rejection guard is ASSUMED, unexercised by this dataset (**L11**). A guardless server would have produced byte-identical data, with bias impact ≤ 1.7e-6.

The rebuilt module is checked two ways: against all 6,700 settled rolls (the named anchor), and, as the second check, against LIQD's verify endpoint (the E13 replies and these session-recorded vectors). Reference vectors, `serverSeed 00112233445566778899aabbccddeeff`, `clientSeed audittest`:

| nonce | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
|---|---|---|---|---|---|---|---|---|
| roll | 93.22 | 0.79 | 81.91 | 97.36 | 90.34 | 64.99 | 9.48 | 93.41 |

`commitHash("015307d5a3f62db476210c3797bac8b7") = "918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8"`. Two client seeds coincide at a given nonce with probability 1/10,000: `audittest` and `audittest-83` both give 93.22 on the reference seed.

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

The lower bound is inclusive and the upper exclusive; inversion takes the exact complement. Two settled bets land on a lower bound and win: roll 0.00 on `under [0, 94.69)` (`gaPf8AzHumK4L9VtrhjJc`) and roll 99.00 on `over [99, 100)` (`RbGgV6toJS-1CgkkJI0vC`). None lands on an upper bound. Upper-exclusivity rests on the E13 verifier record, where two of seven probes discriminate it (**L2**, **L14**). A loss pays 0; there is no push and no partial payout.

### Multiplier and limits

For two-decimal bounds, `W = inverted ? 100 − (upper − lower) : upper − lower`, `b = round(100 × W)` and `m = 9900 / b`. `b` (`basisPoints`) is auditor-derived and appears nowhere in the capture (**L8**). The binary64 quotient `9900 / b` equals the served multiplier on all 2,807 wins with strict `===`, deviation 0. The float closed form is the same rational but a different binary64: written `99/continuousWinChance%` it agrees on 1,823 and differs on 984 (by up to 24 ULP); as coded, `(100/winChance%)·(1−edge)`, it agrees on 1,719 and differs on 1,088. That is the evidence that the quotient is the operator's form. The served value is the full binary64 (e.g. `1.071776550828191` at `b` 9237), not a display-rounded figure. Nominal house edge is 1.00% on the continuous win chance (`houseEdge = 0.01`).

| Limit | Value | Evidence class |
|---|---|---|
| Roll scale | `[0.00, 99.99]` | 10,000-point grid |
| `minOdds` | 1.0102 | unviolated: lowest served multiplier 1.0105× (`XaydgMmL1-p7eMe6oiSS2`, `outside {47.55, 49.58}`, 97.97% win chance); not enforcement-tested |
| `maxOdds` | **9900** | acceptance witnessed live (E14, F-LIMITS); the config field reads 99; rejection above 9900× not probed; not in the dataset, which stops at 99× (**L7**) |
| `minBet` / `maxBet` | 0.1 / 9898 USDC | config-attested; the capture reached $10 |
| `houseEdge` | 1.00% | derived per bet (Step 15), not taken from the config field |

## Payouts and RTP

### Settlement

```text
roundedMultiplier = round_to_8_dp(m)                              // stage 1
credit            = round_half_even_to_8_dp(stake × roundedMultiplier)   // stage 2
loss credit       = 0, multiplier 0
```

The rule reproduces all 6,700 settlement amounts with zero tolerance. Stage 2 half-even is witnessed by **274** exact 8-dp ties among the wins; naive half-up rounding of `stake × multiplier` misses 128 of the 2,807 credits. Stage 1 is modelled as half-up (`Math.round`); its tie mode is ASSUMED: exact 8-dp ties in `9900/b` exist at `b` **2048** (4.833984375) and **6144** (1.611328125), both reachable, and at 6144 the two modes give different credits, but no captured bet lands on either (**L6**). Wallet credits settle by the same rule and equal the game credits row for row (`winningAmountWallet == winningAmount`, `stakeWallet == betAmount`).

Against the exact unrounded product, computed in the operator's decimal number system (decimal stake × the exact rational `9900/b`), the settlement rounds the player down on **1,341** wins, up on **1,316**, and lands exactly on the product on **150**; max |residual| 5.49818342e-9 USDC, net +4.91e-8 USDC, no directional bias. Of the 150, 105 are the Phase C `$10.00 × 1.98 = $19.80` bets. The worked first bet: `0.1 × 1.071776550828191 = 0.1071776550828191`, credited `0.10717766`.

**Operator statement vs the capture (F-ROUNDING).** On 30 September 2026 LIQD answered: *"Payouts use exact decimal maths and are then rounded down to 8 decimals, in every game … Dice, Limbo, Plinko, Keno and Blackjack aren't affected."* For the audited capture of 27 August 2026 the two-stage rule matches 2,807 of 2,807 wins, while `floor8(betAmount × 9900/b)` matches 1,491 (the 1,341 rounded-down plus the 150 exact wins, `outputs/report-figures.json → settlementResidual`); the other 1,316 were credited one 1e-8 unit above it, none below (player-favourable). Example: bet `kzLjSr11zq5GvEOHlj9n6`, $0.10 under 92.37, credited `0.10717766` where the exact amount rounded down is `0.10717765`. LIQD's reply is pending; the audit's rule stays the measured rule.

### Theoretical RTP

The verifier counts winning grid points independently of the served multiplier. Under the half-open rule, `b` of the 10,000 points win:

```text
P(win) = b / 10000
RTP    = P(win) × m = (b / 10000) × (9900 / b) = 0.99
Edge   = 1 − RTP = 0.01
```

| Mode | Winning region | Points | Effective edge | Captured bets |
|---|---|---|---|---:|
| under `[0, U)` | `draw ∈ [0, 100U − 1]` | `100W` | exactly 1.000% | 1,362 |
| inside `[L, U)` | `draw ∈ [100L, 100U − 1]` | `100W` | exactly 1.000% | 1,360 |
| over `[X, 100)` | `draw ∈ [100X, 9999]` | `100W` | exactly 1.000% | 2,592 |
| outside `![L, U)` | the complement | `100W` | exactly 1.000% | 1,386 |

Step 15 asserts the identity per bet in exact integers (`100·winCount·9900 === 99·10000·basisPoints`), on 6,700/6,700 bets; unit tests cover 59,998 bands, and Step 13 compares the closed-form count with a literal 10,000-point enumeration on all 5,304 distinct captured bands. The float form of the same quantity departs from 0.01 by up to 6.32e-15 across the capture and 5.063813951489138e-13 at the un-sampled `over 99.99` extreme (`100 − 99.99 = 0.010000000000005116`), which is why the assertion is integral: the former 1e-12 float band was only 1.97× that noise. `under 50` and `over 50` each win on exactly 5,000 points and partition the grid; `over(99)` covers 100 points, a discrete 1.000% win chance at 99×, edge exactly 1.0000% on all 500 Phase B bets. Narrow bands also land on `100·W`: `[29.32, 30.43)` (`j8KHzKcpJsqRnCNg2MO0T`) 111 points, `[0, 1.12)` (`CtqxNcrMIC3CetqYohjqU`) 112, `[1, 99.96)` inverted (`jtQR2b6RtishGRORgyUX9`) 104. The roll ceiling 99.99 was hit by `x_mywFD5i9mlTgriRaXtk` (epoch 76, nonce 19), a loss.

The result is conditional on the uniform-roll and win-rule model, before settlement rounding or any untested payout cap. A cap of the form `min(stake·m, C)`, if present, would reduce RTP below 99% at the capped stakes.

| Measure | Result | Meaning |
|---|---|---|
| Theoretical RTP before rounding | exactly 99% | analytical expectation under the model |
| Expected RTP with rounded settlement | 98.999994912%–99.000005204% | range over captured band/stake pairs: 2,742 below 99%, 2,687 above, 1,271 exactly on it |
| Observed sample RTP | 103.560844% | $2,744.36236730 on $2,650.00, a finite mixed-band sample; informational only |

## Verification results

The 22 numbered steps in `tests/verify.ts` (21 scored + 1 informational) evaluate the 6,700 bets of 27 August 2026: 22 PASS, 0 flags, 0 hard fails, `PROVABLY FAIR — Full Pass`, exit 0. The release script counts every numbered step, so `RELEASE-MANIFEST.json` and the last line of `npm test` read `scored 22/22`.

| Step | Check | Result |
|---:|---|---|
| 1 | Seed hash integrity | PASS: 134/134 revealed seeds hash to their commitment; 0 mismatches |
| 2 | Next-seed pre-commitment chain | PASS: 133/133 transitions, plus the pre-capture link naming epoch 0's commitment; an ordering of records, not a date (**L18**) |
| 3 | Hash consistency within epoch | PASS: 134 epochs, 0 violations; a consistency check on the file, since the capture writes the period's hash on each row; the seed-to-roll binding is proven by Step 5 |
| 4 | Nonce audit | PASS: 50 distinct contiguous nonces 0..49 per epoch, no gaps, no reuse; first nonce 0 is the capture default, not operator-witnessed; trailing bound auditor-recorded (**L13**) |
| 5 | Roll recomputation and draw bias bound | PASS: 6,700/6,700 rolls byte-identical; `MAX_FAIR = 10000 × 429496 = 4,294,960,000`, worst-case modulo bias 0 (≤ 2⁻³²), rejection census 7,296 of 2³² chunk values |
| 6 | Win-rule reproduction | PASS: 6,700/6,700 win flags (`inverted` honoured) |
| 7 | Multiplier derivation | PASS: 2,807 wins, served `== 9900/basisPoints`, numerator derived as `(1 − HOUSE_EDGE)·10000`, bit-exact, deviation 0 |
| 8 | Credit arithmetic | PASS: 6,700/6,700 `winningAmount == ROUND_HALF_EVEN_8(stake × ROUND_8(multiplier))` exactly (loss ⇒ 0) |
| 9 | Loss settlement | PASS: 3,893 losses with `winningAmount == 0` and `multiplier == 0` as recorded (zero defaults noted above) |
| 10 | Wallet credit and odds bounds | PASS: 6,700/6,700 wallet credits by the same rule, ledgers agree row for row; all quoted multipliers within [1.0102, 9900]; no balance ledger (**L5**) |
| 11 | Dataset integrity | PASS: SHA-256 pin match; population bound to `src/config.ts`; `seed[0].serverSeed` present; 134/134 revealed |
| 12 | Phase and mode coverage | PASS: A 5,000 · B 1,000 · C 200 · D 500 match the code plan; all 4 modes; both stakes |
| 13 | Anti-circularity | PASS: win probability and multiplier from grid arithmetic only; a corrupted roll is rejected; closed form equals the literal tally on all 5,304 distinct bands |
| 14 | Custom client-seed control | PASS: 500/500 `pfaudit-` bets recompute; a different client seed changes the roll on 8/8 probed bets |
| 15 | Odds boundary and effective edge | PASS: roll ceiling ≤ 99.99; `over(99)` pays 99× at 1.0000% (500 bets); effective edge exactly 1.0000% on 6,700/6,700 as an exact integer identity; a model identity conditional on E13 (**L2**, **L3**); the 99×–9900× tail is unsampled (**L7**); 0 player-favourable bets |
| 16 | Simulation Pass 1 | PASS: 98/98 targets (`over 2.00` to `over 99.00`, 1,000,000 bets each) within 5·SE + 1e-4; mean simulated RTP 99.0203% against 99.0000% over 98,000,000 bets, SE 0.0207 pp, Δ 0.9803·SE; 2M draws, uniformity χ² 108.885 df 99, p 0.2335; serial screen on the first 200,000 (lag-1 z 0.159, runs p 0.6910); 9/9 edge bands within 5·SE + 1e-4; `under 50` series final 99.048%, Δ 2.1493·SE |
| 17 | Simulation Pass 2 | PASS: served-band return over 134 seeds × 10,000 nonces, aggregate early z 0.752, one-sided p 0.7738 vs α 0.01 (73 below / 2 equal / 59 above); detects a per-bet deficit of 14.377 pp or more at 80% power. Supplementary draw-uniformity screen 10 flags vs 5.87 expected, P(X ≥ 10) = 0.0708 |
| 18 | Bet-size invariance | PASS: 200 Phase C bets at $10.00 recompute identically to the $0.10 phases |
| 19 | Artifact hash and value-domain integrity | PASS: dataset, `simulation-results.json` and `rtp-convergence.html` match their pins; `report-figures.json` reconciles field for field (9/9 required fields); 5,609 numeric leaves inside domains derived from `src/config.ts` |
| 20 | Settlement determinism | PASS: 6,700/6,700 outcome and credit determined by (roll, band, stake), credit rebuilt from the band's own quotient with zero tolerance |
| 21 | Multiplier monotonicity and range | PASS: 4,176 win-chance points, `99/winChance` strictly decreasing, 0 inversions; quoted span 1.0105×–99.0000× within [1.0102, 9900] |
| 22 | Live-sample serial independence (informational) | PASS: lag-1 0.012919, z 1.057; runs about 50.00: 3,305 vs 3,350.9 expected, z −1.122, p 0.2618. Reports PASS or INFO and cannot fail (profile policy, 29 September 2026) |

**Step notes.** Step 8 characterises the operator's rounding exactly; Step 20 builds the credit from `PAYOUT_NUMERATOR / payoutBasisPoints(params)` and never reads the served multiplier. Until 10 September 2026 Step 20 used the float closed form; on 12,046 of the 2-dp bands (at basis points 1, 2048 and 6144) the two binary64s change the stage-1 rounding, so a correct $9,900.00 payout at `over 99.99` would have been rejected as $9,899.99999999 (D16); none of those bands occurs in the capture. Step 10 compared the wallet credit with a raw product at a 1e-6 tolerance until 9 September 2026, which let a +1e-7 wallet edit pass; it is now exact. The pre-capture link in Step 2 fails when the record or a field of it is absent or altered.

**Edge convergence on 98 targets (the main RTP evidence, since `v1.1.0`).** The simulation follows the design of the Duel dice audit: 98 targets × 1,000,000 bets each. Duel's targets are "roll over 2.00" to "roll over 99.00"; on LIQD they are the over-mode bands `over 2.00` to `over 99.00` (`[X, 100)` for X = 2 … 99; win chance 98% to 1%, 1.0102× to 99×; `over 2.00` is LIQD's minimum odds). All 98 are within 5·SE + 1e-4 of their theoretical RTP (68 within 1·SE, 95 within 2·SE, 97 within 3·SE; the largest departure is `over 56.00`, 3.0802·SE); 51 sit above theory, 46 below and 1 (`over 34.00`) exactly on it. The lowest simulated RTP is `over 99.00` at 98.3664% (0.64·SE) and the highest `over 98.00` at 99.7920% (1.14·SE). Step 16 recomputes every target's standard error, reconstructs each RTP from its integer win count and validates each target's running series at the five marks.

The convergence chart (`outputs/rtp-convergence.html`) is the mean simulated RTP over the 98 targets at each per-target sample size, as in the Duel audit, with SE = √(Σ SEₜ²)/98 (each target's SEₜ = σ/√n). Step 16 recomputes every plotted mean and SE from the targets' own counts:

| Bets per target | Mean simulated RTP (98 targets) | SE | Δ (SE) |
|---|---|---|---|
| 10,000 | 99.2376% | 0.2071% | 1.15 |
| 50,000 | 99.1758% | 0.0931% | 1.89 |
| 100,000 | 99.0878% | 0.0656% | 1.34 |
| 500,000 | 99.0261% | 0.0293% | 0.89 |
| 1,000,000 | **99.0203%** | 0.0207% | 0.98 |

The final mean is 0.9902026676413088 over 98,000,000 bets against 0.9899999999999987 (the mean of the 98 theoretical RTPs in binary64; 0.99 exactly in rationals) at SE 0.0002067384028794929, Δ 0.9803·SE.

**Seeds: the `v1.0.0` source, unchanged.** No seed was chosen, searched or re-drawn, and the simulation was regenerated once. Every Pass-1 seed is `HMAC-SHA256(SIM_MASTER_SEED, counter)` truncated to 16 bytes, with the same `SIM_MASTER_SEED` (`a11d17e5…10addba5`) and the same counter derivation as in `v1.0.0`. The `v1.0.0` blocks run first and in their original order, so they consume the same seeds and every one of their figures below is byte-identical to `v1.0.0`: uniformity and serial use counters 0–40,001, the `under 50` series 40,002–440,003 and the nine edge bands 440,004–800,021. The 98 targets continue the same stream from counter 800,022 (`SIM_TARGET_SEED_COUNTER_BASE`). Each target consumes it exactly as an edge band does: a client seed, then a new server seed every 50 bets (nonce = bet index mod 50), so 20,002 counters each. Target t (`over (t+2).00`) starts at 800,022 + 20,002·t, and the last target ends at counter 2,760,217. The producer refuses to run if the stream is not at 800,022 when the targets start. Step 16 re-derives each target's start counter, client seed and first server seed from the master seed and fails any target that is not at its position.

**`v1.0.0` simulation blocks, kept.** The nine edge bands (all four modes, 2,000,000 bets each) and the 20,000,000-bet `under 50` series are unchanged from `v1.0.0` and still scored. Before `v1.1.0`, the `under 50` series was the convergence chart.

**Pass 1 detail.** Three screens (uniformity, lag-1, runs) are Bonferroni-corrected to α/3 = 3.333e-3, the uniformity screen two-sided (α/6 per tail); the lag-1 threshold is the stored and applied `zCritical` 2.9351994688667054; runs z is re-derived from cell counts (99,912 runs, n1 = 100,103, n = 200,000). Every published RTP must be the producer's return for a valid integer win count, reconstructed forward and compared bit for bit; convergence win counts 493 / 5,046 / 50,371 / 499,779 / 2,501,269 / 5,002,354 / 10,004,806 are cumulatively consistent, and all seven standard errors are recomputed from `(n, rtp, wins, m)`. Exact hits on theory are counted and reported, never rejected (G-VALID).

| Draws (n) | Simulated `under 50` RTP (kept from `v1.0.0`) | SE |
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
| over 99 | 99× | 1.00% | 98.951% | 0.07 |
| under 1 | 99× | 1.00% | 99.480% | 0.69 |

The final `under 50` point is 0.990475794174457 against 0.99 at SE 0.00022137070420677504. Pass 1 characterises the reference implementation; it transfers to the served rolls because Step 5 reproduces all 6,700 of them.

**Pass 2 detail.** The load-bearing statistic is the served-band return: each revealed seed is replayed for 10,000 nonces with its recorded client seed; the early window is the captured nonces 0–49 (50–9,999 are modelled continuations, not captured bets); the payout-weighted return of the bands actually served is standardised by its exact per-bet mean and variance (each pᵢ the served band's exact lattice probability) and read against a one-sided normal lower tail (**L4**). It was specified after the capture, so it is not pre-registered. The supplementary screen scores each seed's 50-draw, 20-bin χ² (early nonces 0–49, late 50–99) against the exact discrete null enumerated in `src/exact-chi2.ts` from 181,274 partitions (832 attainable values). Achieved per-window rejection at the nominal 0.05 is 0.0459237601, so the compound flag rate is 0.0438147684 (expectation 5.87, not the naive 6.37). Flags at epochs 6, 9, 34, 35, 45, 54, 79, 104, 113 and 123, the same on every run; 13 flags would reject (P(X ≥ 13) = 0.0062, P(X ≥ 12) = 0.0151). The aggregate flag-count test is at α = 0.01 and exceedance is a hard FAIL; it is not Bonferroni-corrected because its null is enumerated, not sampled. Pooled real-roll uniformity over the 6,700 rolls is informational since 29 September 2026: χ² 92.209, df 99, p 0.6724.

**Error budget.** Seven scored statistical screens can move the verdict: S1–S3 the Pass-1 screens (α/3 each), S4 the nine edge bands and the 98 targets (≈5.73e-7 each, ≈6.13e-5 over 107 rows), S5 the final `under 50` point and the final 98-target mean (≈5.73e-7 each), S6 the flag-count binomial (≤ α), S7 the served-band return (α = 0.01). The α = 0.01 claim covers S1–S3 only; Step 16's own nominal bound is ≈0.0100625 (`STEP_16_BOUND` in `src/sim-checks.ts`) and the bound over all seven is ≈0.0301. These are nominal upper bounds under asymptotic reference distributions, not measured failure frequencies. A failed regenerated run must be retained and investigated, never re-run for a better one.

### Findings

Each step has a matching finding F1–F22 in the step results above. Two disclosures sit outside the steps:

**F-LIMITS — maxOdds 9900× accepted; the config field reads 99; the capture stopped at 99×.** LIQD's `GET /api/v1/fast-games/system/get-game-settings` still reads `maxOdds` 99 for `originals-dice` on 1 September 2026, but a live $0.10 bet at 9900× (band `under 0.01` = `[0, 0.01)`) was accepted and settled (`POST /api/v1/originals/dice/place-bet` → 200; reported roll 84.00, a loss). That witnesses acceptance at 9900×, not rejection above it: the UI clamps higher entries client-side and server behaviour above 9900× was not probed. It is not an exploit: under the half-open rule `under 0.01` wins only on roll 0.00, exactly 99% RTP; inclusive-both-ends would have paid 198%. No captured bet exceeds 99×, so the 99×–9900× tail is fair by construction but not sampled with settled money. A 9900× win on the 9,898-USDC max bet would be about $98M; the config row's `maxExposureUsdc` was null and no cap was characterised. E14 does not contain the original HTTP exchange, bet id or a revealed seed for the probe.

**F-ROUNDING — LIQD's stated payout rounding disagrees with the capture (open).** Worked through in [Payouts and RTP](#payouts-and-rtp). Nothing in the verdict changes: every step scores the capture against the measured rule, which reproduces every credit; the difference favours the player by one 8-dp unit per affected win. Which rule production runs is not established by this capture.

**Baseline-deviation review.**

| Standard-Dice baseline | LIQD observed | Disposition |
|---|---|---|
| Roll on `[0, 100)`, band `{lower, upper, inverted}` | roll on a 10,000-point grid `[0.00, 99.99]`, four modes | conforms |
| Multiplier = `(1 − edge)/winChance`, flat 1% | `9900/basisPoints` bit-exact; nominal 1.00% | conforms |
| Effective edge = nominal for every bet | exactly 1.0000% on all 6,700 under the half-open rule (E13) | conforms exactly; the earlier inclusive-both-ends model produced a spurious variation |
| Payout at the exact multiplier | two-stage 8-dp settlement exact; losses 0 | conforms |
| Operator's stated rounding (round down) | round-down reproduces 1,491 of 2,807; 1,316 credited one unit higher | open, reply pending (F-ROUNDING) |
| maxOdds boundary priced correctly | `over(99)` 99× at 1.0000%; all captured multipliers in range | conforms; 9900× accepted live (F-LIMITS) |
| Commit-reveal, client seed after commitment, nonce per bet | as recorded; timing attested (**L18**); Phase D seeds predictable (**L19**) | conforms |
| Instant settlement | one call places and settles | conforms; a mid-round reveal is structurally not applicable |

### Exploit matrix

<!-- S5-MATRIX:START -->

| Test ID | Category | Result | Finding summary |
|---|---|---|---|
| S5-1 | Seed substitution | Pass | 134/134 revealed seeds hash to their commitment; the next-seed chain holds on 133 transitions; a substitute needs a SHA-256 second preimage [Steps 1, 2] |
| S5-2 | Client-seed manipulation | Pass | a different client seed yields a different roll (collisions at 1/10,000); Phase D recomputes 500/500, e.g. `mln4FKy5qJV-NUIBuUzLQ` (epoch 124, `pfaudit-1787856766341-124`, nonce 0, `under 58.86`) → roll 62.76, a loss [Step 14] |
| S5-3 | Stake-conditional outcome | Pass | Phase C at $10.00 recomputes identically; `2OREb_OtYFaBKk_duOBkQ` → 64.35, a win crediting $19.80; nonce 1 → 9.91, a loss; `diceRoll` takes no wager argument [Step 18] |
| S5-4 | Server-seed cherry-picking | Pass, structural + limited-power statistical | primary defence: client seed set after the commitment, for 124 of 134 epochs as attested by the auditor (the collector that ran is not in this package); the ten Phase D epochs 124–133 were derivable in advance (**L19**) and rest on recomputation and clean statistics. Pass 2 finds no return deficit at its power (z 0.752, p 0.7738) and 10 flags vs 5.87 (P = 0.0708). Nothing here rules out cherry-picking across the capture as a whole (**L4**) [Step 17] |
| S5-5 | Seed-rotation race (TOCTOU) | Not tested: disclosed | not applicable to this instant-settle archetype: no roll is pending against an unrevealed seed. This concerns that named class only, not server-side settlement atomicity in general, which a sequential client capture cannot test (R-RACE) |
| S5-6 | Multiplier tampering | Pass | no multiplier table exists; Step 7 pins the served multiplier to `9900/basisPoints` on 2,807 wins and Step 20 rebuilds every credit from the band alone with zero tolerance [Steps 7, 20] |
| S5-7 | Nonce manipulation | Pass | 134/134 epochs sequential 0–49 under one client seed, 0 gaps, 0 duplicates; epoch size from `EXPECTED_EPOCH_SIZE`, not `meta.epochSize` (G-BIND); an operator-side gap would be a hard FAIL, a capture-retry gap a capture-origin FLAG [Step 4] |
| S5-8 | Modulo bias | Pass | `src/rng.ts` rejects the 7,296-value tail (≈1.7×10⁻⁶) rather than folding it; without rejection the per-value bias would be ≤ 1/maxFair ≈ 2.3×10⁻¹⁰; uniformity p 0.2335 (2M draws) and pooled real-roll p 0.6724 [Steps 16, 17] |

<!-- S5-MATRIX:END -->

S5: fairness-integrity matrix; game-integrity testing not commissioned.

| Supplementary | Category | Result | Finding |
|---|---|---|---|
| S5-D1 | Player-favourable band hunt | Pass | effective edge exactly 1.0000% on every captured bet; 0 player-favourable; a consequence of the half-open rule rather than an independent measurement. Under the earlier inclusive-both-ends model the thinnest bands appeared to run as low as 0.108% [Step 15] |

No exploit succeeded in the seven tested categories. That is "no exploit found in the paths tested", not "no exploit exists".

## Reproduce the audit

Use **Node.js 22.x** (validated on v22.23.1 / npm 10.9.8); `src/runtime.ts` refuses another major before anything is read or written (**L17**). From the package directory:

```sh
npm ci
npm test
```

`npm test` is `mocha && npm run verify && node scripts/release-manifest.mjs --check`. Expected: **123 passing unit tests; 22/22 steps pass (21 scored + 1 informational) · PROVABLY FAIR — Full Pass; REPRODUCED; release manifest OK; exit 0.** It scores the committed, SHA-256-pinned simulation artifact and does not regenerate it.

The unit suite has **123 tests** across eleven files: `rngTests.ts` 18, `rngSpecTests.ts` 1 (the 84 checks of the specification's vectors and properties), `settlementTests.ts` 21, `simChecksTests.ts` 38, `statsTests.ts` 12, `exactNullTests.ts` 9, `clientSeedTests.ts` 8, `artifactTests.ts` 5, `runtimeTests.ts` 4, `captureRetryTests.ts` 4, `commitmentTests.ts` 3. They cover the E13 boundary vectors and the count of discriminating probes (2 of 7), fractional-bound vectors that fail under the pre-QA ceil/floor scaling, force-exercised rejection vectors, settlement ties in exact integer arithmetic (including all seven large-magnitude ties the previous float implementation got wrong, a 9,800-case stage-1 sweep against exact half-up, and the guard that refuses a lossy credit above 2^53 units), the exact Pass-2 null against an independent derivation to 1e-12, the 98 targets' seed-stream positions and their recomputed mean series, the effective-edge identity over 59,998 bands, the artifact pins and the byte identity of the chart with its series, the population constants, and Step 2's pre-capture link. Twelve tests sit beside the audit: 11 exercise capture helpers (7 on `capture/client-seed.reference.mjs`, 4 on `capture/bet-operation.reference.mjs`) and 1 checks that the historical Phase D seeds are unchanged.

`node verify.js` and `node test.js` run the same verification and unit suite with nothing but Node 22. They are build products of the TypeScript in `src/` and `tests/`. The generator ships as `scripts/build-standalone-verifier.mjs` (`npm run build:standalone` rebuilds both; the bundles' headers name it by its `audit-framework/tools/` path), and `npm run check:standalone-build` rebuilds both in a temporary copy and fails unless each matches the committed file byte for byte (it needs `npm ci`; it never writes into the package). `npm run test:standalone` is the zero-install equivalent of `npm test`.

| Command | Purpose |
|---|---|
| `npm run verify` | the 22-step verification; writes only `outputs/run/` (results plus `diff.json`) |
| `npm run report` | `PF_EMIT=1`: the only command that rewrites `outputs/verification-results.json` and `outputs/report-figures.json` |
| `npm run simulate` | regenerate Pass 1 and Pass 2 from the pinned `SIM_MASTER_SEED`; byte-identical to the committed files |
| `npm run test:full` | mocha, simulate, then verify with `SIM_FRESH=1` (pin recorded, not enforced); 66 s and 81 s in two runs on 2 October 2026, before the 98 targets; `npm run simulate` alone took 3 min 55 s on 22 October 2026 (138,000,000 Pass-1 draws) |
| `npm run mutate` | the falsifiability battery in a sandbox copy |
| `npm run rtp-claim:write` | regenerate `outputs/rtp-claim-table.json`; then update its pin in `src/rtp-settings.ts` |
| `npm run release-manifest` | regenerate `RELEASE-MANIFEST.json`; `--check` verifies it |
| `npm run build:standalone` | rebuild `verify.js` and `test.js` from `src/` and `tests/` |
| `npm run check:standalone-build` | check that the committed `verify.js` and `test.js` are what the source compiles to |

**Reproduction gate and exit codes.** `npm run verify` compares fresh results with the committed artifacts field by field. Since 28 September 2026 the committed artifacts carry no run metadata; time, runtime and pin mode go only to `outputs/run/diff.json`. Integers and pure-arithmetic statistics compare exactly, p-values and quantiles within 1e-14 absolute + 1e-12 relative (`src/diff.ts`), served-band aggregate sums at 1e-9. Exit **0** = Full Pass, **2** = any FLAG, **5** = RTP FIGURE OVERSTATED (the enforced RTP-CLAIM 1.2.0 rule finds the published figure overstated; not a draw fail), **1** = any FAIL or a reproduction beyond tolerance. Verification does not rewrite the evidence it scores (changed 10 September 2026, client QA D1): until then a failing run overwrote `report-figures.json` and the next run passed.

**Run-invariance.** 20 consecutive `npm test` runs on 2 October 2026 (Node 22.23.1): 117 passing, 22/22, REPRODUCED and the release-manifest check OK in 20/20, with `outputs/run/verification-results.json` byte-identical to the committed file each time. On 9 September 2026 the then suite gave 46/46 unit tests and 21/21 in 20/20 (Step 22 did not yet exist). Before 9 September `npm test` re-rolled Pass 1 from fresh seeds, so Step 16 tripped at 1 − 0.99³ = 2.97% per run on honest data (measured 1 trip in 20), and Step 17's bootstrap null was redrawn per run (flag count 9 to 11; at 11 it failed, about 6% of runs).

**Simulation.** Since 19 September 2026 the Pass-1 producer is deterministic (DICE-20): every seed is `HMAC(SIM_MASTER_SEED, counter)`, the artifact carries no run metadata, and two independent regenerations produced identical files. If a regeneration does not reproduce the committed artifact the cause is a changed seed, producer or runtime, not sampling noise; `outputs/run/diff.json` names every moved field. Changing `SIM_MASTER_SEED` re-rolls every Pass-1 figure at once and is a visible source edit. Pins: `simulation-results.json` `SIMULATION_SHA256` and `rtp-convergence.html` `SIMULATION_HTML_SHA256`, scored in Step 19 rather than aborting so a forged artifact reaches Steps 16–17; `artifactTests.ts` re-renders the chart from the committed series and asserts byte identity.

**Falsifiability.** `npm run mutate` applies **49** find/replace mutations (`tests/mutations.json`; 46 killed at their named step, 1 aimed at the informational Step 22 recorded as an INFO signal, and 2 added 14 October 2026 that must end RTP FIGURE OVERSTATED, exit 5, below), **8** committed forgery scripts (`tests/structural-forgeries.json`, `tests/forgeries/*.mjs`) and **2** declared survivors (`tests/mutation-survivors.json`): 59 entries. Ten of the find/replace mutations (M39–M48) were added on 22 October 2026 with the 98 targets. Last full run 22 October 2026, all 59 entries, on this package's scored code as it stands (Node 22.23.1): **56 killed, 1 informational signal, 2 survivors as declared, 0 not as declared**. Earlier: the full run of 20 October 2026, before the targets (49 entries: 46 killed, 1 informational signal, 2 survivors as declared), the full run of 19 October 2026, before the rebuild (the same counts), the full run of 2 October 2026, before the two C3 entries existed (44 killed, 1 informational signal, 2 survivors as declared), and the two C3 entries on their own on 14 October 2026 (`npx ts-node tests/mutate.ts M-C3i M-C3ii`, a partial run, exit 3: 2 killed, 0 not as declared). **The RTP FIGURE OVERSTATED route (FIXPASS2 C3).** `M-C3i` prices one setting no captured bet used (win chance 50.03 %) 2 pp lower where the RTP table prices it; `M-C3ii` raises the published figure to 99.25 % in `src/rtp-settings.ts`. Each is first run as edited, without regenerating, and must exit 1 with `[FAIL] Step 15` (a committed RTP table that no longer matches is a reproduction failure even under a miss); then with `regen` — the table re-written and re-pinned and the record re-emitted in the sandbox, as an auditor would after such a change — and must end exit 5, `VERDICT: RTP FIGURE OVERSTATED`, `[RTP FIGURE OVERSTATED] Step 15`. Both did, in both layers. Outside `src/rtp-settings.ts` only `tests/verify.ts` reads `RTP_CLAIM` (through the gate); no step tests against the published figure, so no earlier label test, simulation check or FLAG branch can pre-empt the rule. The runner checks that the named step is the one that fires and re-pins every hash-pinned artifact it mutates, as a forger would.

| Class | Mutations | Killed by |
|---|---|---|
| RNG / commitment | draw range off by one, HMAC cursor moved, commitment hashes raw bytes | Steps 5, 1 |
| Win rule / boundary | lower bound exclusive; upper inclusive (rule only); upper inclusive consistently (the pre-E13 model) | Steps 6, 13; mocha E13 vectors |
| Payout | house edge doubled; half-even → half-up; stage-1 rounding removed; maxOdds shrunk below the captured span | Steps 7, 8, 10 |
| Sample-depth pins | edge, serial, convergence, 98-target and cherry-pick depths loosened | Steps 16, 17 |
| Pass-2 null | achieved rate reverted to nominal; χ² constant corrupted | Step 17 |
| Artifact forgery | model field with `pass:true`; `pass1.draws` = 1; null downgraded; a flag cleared; a per-seed statistic forged; a row detached; bands collapsed; convergence identity removed; pooled statistic forged | Steps 16, 17 |
| Fabricated Pass 1 (external review round 3) | every raw statistic perfect, derived fields recomputed, `SIMULATION_SHA256` re-pinned | Step 16 (lower-tail χ² and seven standard errors); Step 19 passes |
| Fractional win count | `over 98` RTP 0.99000495 (40,000.2 wins), re-pinned | Step 16 |
| 98 targets (added 22 October 2026) | seed-stream base moved by one seed; a target moved off its stream position; a target's client seed replaced; a target's win count forged; a target RTP off any integer count; a mean point forged; a mean SE set to 123456; the target set collapsed; the mean's identity field removed | Step 16 |
| Coherent population shrink | nonces 30–49 deleted (4,020 bets), header doctored, re-pinned | Steps 4, 11, 12, 17 |
| Absent / malformed report figures | file deleted; `{not JSON` and four sibling cases | Step 19 |
| Forged served-band early return | re-pinned | Step 17 |
| Relabelled commitment hash; credited loss (added 2 October 2026) | each with the dataset re-pinned | Steps 3 and 9 |
| Closed form only | upper inclusive in `discreteWinCount` alone | Step 15 |
| Informational signal | rolls sorted into value order (M-LIVESERIAL) | Step 22 reports INFO; the reproduction gate and Step 19 go red |

Dataset-integrity mutations, applied by hand on 9 September 2026 in sandbox copies (dataset edited, pin updated): a one-byte flip without re-pinning aborts at load; roll 24.01 → 12.34 fails Step 5; roll nudged to 24.0100000009 fails Step 5 (the old `> 1e-9` comparison accepted it); `winningAmount` +1e-8 fails Steps 8, 10, 20; `winningAmountWallet` +1e-7 or zeroed fails Step 10; a trailing bet withheld fails Steps 4, 11, 12; `nonceEnd` tampered fails Step 4; `meta.preCapture.nextHashedServerSeed` zeroed or `revealedServerSeed` replaced fails Step 2. Raising `MAX_ODDS` above the captured tail is not a survivor: the ceiling is echoed into the committed `verification-results.json`, so the reproduction gate catches it (**L7**).

**Tolerances of record.** Roll, multiplier, credit, wallet, loss, odds-bound, ceiling and `over(99)` comparisons are exact; the per-bet edge identity is exact in integers; strict monotonicity uses 1e-12; artifact statistics as above; simulated RTP vs theory 5·SE + 1e-4; Pass-1 screens α/3; Pass-2 screens α = 0.01. Three round-2 findings were unjustified tolerances: a 1e-6 wallet comparison, a 1e-6 settlement comparison and a roll comparison seven orders of magnitude wider than the grid.

The executable workflow needs no casino credentials and only the Node.js `crypto` module is trusted. The release generator requires README.md and MANIFEST.md and checks that both carry the audit ID.

## Verify a bet

Any player can reproduce a past Dice bet with a standard crypto library and no LIQD software. Use the field names LIQD returns in the bet record and its provably-fair panel, in order:

1. **Get the inputs.** `hashedServerSeed` (shown before the round), `clientSeed`, `nonce`, the band `params` `{ lower, upper, inverted }` and `betAmount`. The `serverSeed` is revealed on the panel after the epoch rotates; an unrevealed seed cannot yet be checked ([E11 seeds panel](evidence/E11-provably-fair-seeds-panel.png), [E12 verify tab](evidence/E12-provably-fair-verify-tab.png)).
2. **Check the commitment.** `SHA-256(utf8_bytes(serverSeed))`, the hash of the hex string as text, not of its decoded bytes, must equal `hashedServerSeed`.
3. **Compute the roll.** `key = hex_decode(serverSeed)`; `digest = HMAC_SHA256(key, "clientSeed:nonce:0")`; scan big-endian uint32 chunks for the first `< 4,294,960,000`; `roll = (chunk % 10000) / 100`. It must equal the recorded `roll`.
4. **Apply the win rule.** Not inverted: win iff `lower ≤ roll < upper`; inverted: win iff `roll ∉ [lower, upper)`. It must agree with the recorded `result`.
5. **Derive the multiplier.** `continuousWinChance% = inverted ? 100 − (upper − lower) : (upper − lower)`, `basisPoints = round(continuousWinChance% × 100)`, `multiplier = 9900 / basisPoints`. Written as `99 / continuousWinChance%` the last digit can differ; compare to 8 decimals if you use that form.
6. **Check the credit.** On a win, `winningAmount = ROUND_HALF_EVEN_8(betAmount × ROUND_8(multiplier))`; on a loss, `winningAmount = 0` and `multiplier = 0`. This is the rule measured on the 27 August 2026 capture. LIQD states that live payouts are rounded down to 8 decimals (F-ROUNDING, open). On a live bet, a credit equal to `floor8(betAmount × 9900 / basisPoints)`, computed in exact decimal, is LIQD's stated rule, not a failed verification. At a stake of $1 or less that credit equals the one above or is exactly 0.00000001 below it; at larger stakes the two rules can differ by more (at $10, across all 9,800 basis-point values, from 0.00000005 below to 0.00000004 above with stage 1 half-up as modelled; if stage 1 is half-even (L6), the same except at `b` 6144, where it is 0.00000005 above). Any other difference is a mismatch.

Worked trace, the first bet of the dataset:

```text
Bet ID:       kzLjSr11zq5GvEOHlj9n6        Epoch/nonce: 0 / 0
Server seed:  015307d5a3f62db476210c3797bac8b7
Client seed:  auditf2456fc140ac
SHA256 UTF8:  918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8 (= stored hash)
HMAC message: auditf2456fc140ac:0:0
HMAC digest:  475461d14638cca3e385e940e763bf808fa6ef6c05f1a83c333dc25e586c5b6e
First chunk:  0x475461d1 = 1196712401 < 4294960000 → 1196712401 % 10000 = 2401 → roll 24.01
Band:         [0, 92.37), not inverted → 0 <= 24.01 < 92.37, win
Multiplier:   9900 / 9237 = 1.071776550828191; stage 1 1.07177655
Credit:       0.10 × 1.07177655 = 0.107177655 → 0.10717766 (half-even at the exact tie)
Recorded:     roll 24.01, win true, winningAmount 0.10717766
```

Second example, `2OREb_OtYFaBKk_duOBkQ` (Phase C, epoch 120): seed `bfde02800431d623efda4473c8966a25` hashes to `a315d0f959b19e8a2762fa90abde4b94c1915528e296d92a85b5db2921cf8ffa`; message `audit085813da8559:0:0` gives digest `7abf491376aafaeb9efd6de1ed3651eef9c2a91eed254d1f780152c41a31fa3d`, first chunk `0x7abf4913 = 2,059,356,435`, draw 6435, roll 64.35; `over {50, 100}` wins at `99/50 = 1.98×`; credit `10 × 1.98 = 19.80`, one of the 150 wins with no rounding at all. Nonce 1 (`X-tEkgADwFCy-aYRfvEEd`) rolls 9.91 and loses.

This standalone Python 3 checker reads only the dataset and recomputes nine bets spanning all modes, phases and both stakes, with exact rational settlement; it imports nothing from the package:

```python
import hashlib, hmac, json, struct
from fractions import Fraction
from pathlib import Path

data = json.loads(Path("data/dice-master-6700bets.json").read_text())
seeds = {s["epoch"]: s for s in data["seeds"]}
indices = [0, 1, 351, 1859, 2851, 5063, 5697, 6050, 6506]

def draw(seed, client, nonce):
    # docs/ALGORITHM.md section 2: one draw at cursor 0; the roll in hundredths, 0 ... 9999
    message = f"{client}:{nonce}:0".encode("utf-8")
    digest = hmac.new(bytes.fromhex(seed), message, hashlib.sha256).digest()
    for chunk in struct.unpack(">8I", digest):
        if chunk < 4294960000:
            return chunk % 10000
    raise ValueError("all eight chunks rejected: not specified (O2)")

def round_half_up(value):
    return (2 * value.numerator + value.denominator) // (2 * value.denominator)

def round_half_even(value):
    q, r = divmod(value.numerator, value.denominator)
    return q + int(2*r > value.denominator or
                   (2*r == value.denominator and q % 2 == 1))

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
    multiplier_units = round_half_up(multiplier * 10**8)
    credit_units = round_half_even(Fraction(str(bet["betAmount"])) * multiplier_units)
    credit = Fraction(credit_units, 10**8) if won else Fraction(0)
    assert Fraction(roll, 100) == Fraction(str(bet["roll"])) and won == bet["win"]
    assert (float(multiplier) if won else 0) == bet["multiplier"]
    assert credit == Fraction(str(bet["winningAmount"]))
    print(bet["id"], "commitment PASS", "roll", f"{roll / 100:.2f}", "win", won,
          "credit", f"{float(credit):.8f}")
```

| Index | Bet ID | Epoch / nonce | Phase / mode | Roll | Win | Credit |
|---|---|---|---|---|---|---|
| 0 | `kzLjSr11zq5GvEOHlj9n6` | 0 / 0 | A / under | 24.01 | yes | 0.10717766 |
| 1 | `u92Iz5CNgcF1YVGfGqSWk` | 0 / 1 | A / under | 89.38 | no | 0.00000000 |
| 351 | `zyObJhhfD14z_jEHFqMGz` | 7 / 1 | A / under | 61.02 | yes | 0.14932127 |
| 1859 | `Cph95sH2FTbhETy5TzqZa` | 37 / 9 | A / inside | 90.22 | yes | 0.18750000 |
| 2851 | `-iO4PEew_M_4DWvcYa3IE` | 57 / 1 | A / outside | 79.87 | yes | 0.15355980 |
| 5063 | `F8Q46TKe6PuPFcBL9Fs8F` | 101 / 13 | B / over | 98.76 | yes | 4.95000000 |
| 5697 | `RbGgV6toJS-1CgkkJI0vC` | 113 / 47 | B / over | 99.00 | yes | 9.90000000 |
| 6050 | `_z-KmLfzKpOoKmPufqIoj` | 121 / 0 | C / over | 66.58 | yes | 19.80000000 |
| 6506 | `6pZa2zXOWvuOQoA6Md_zu` | 130 / 6 | D / over | 85.19 | yes | 0.30764450 |

Every recorded commitment, roll, win flag, multiplier and payout agrees with recomputation. Further captured examples: `PcvfZgvww-PDBvLSHCW5P` (inside `{3.54, 74.62}`, roll 36.88, 1.3927968486212718, credit 0.13927968); `9uY-gCHzhER3Svjab7-YL` (outside `{16.81, 85.72}`, roll 11.94, 3.1843036346091993, 0.31843036); `nvm2ZMqoss97uCC0ke8Eg` (Phase D, `pfaudit-1787856766341-124`, seed `c2a08578bb5daa28f17990a4d41449fa`, nonce 1, inside `{12.87, 81.7}`, roll 30.05, 1.438326311201511, 0.14383263); `_gdLqWRaLHp9GK6FqxL6g` (over `{45.18, 100}`, roll 19.38, a loss). Epoch 0's `nextHashedServerSeed` `2e788a2ef11d3214cb57a6dbfa0fff43df1c972617325e9b8bf157158e5d08b5` equals epoch 1's commitment; its client seed is `auditf2456fc140ac`. A matching recomputation verifies a recorded value; it does not establish when the commitment was received (**L18**).

## Evidence

The evidence is the data and the code: every cryptographic, payout and edge claim reproduces offline from a clean clone; the screenshots corroborate the deployed UI and nothing in the verdict depends on them. They contain no browser address bars; environment attribution comes from the capture record and endpoint metadata.

| ID | File | Evidence and role |
|---|---|---|
| E01 | [data/dice-master-6700bets.json](data/dice-master-6700bets.json) | 6,700 bets (A 5,000 · B 1,000 · C 200 · D 500), 134 epochs, all revealed; 2,807 wins, 3,893 losses; SHA-256 `ca1a181a…`; hash-guarded |
| E02 | [outputs/verification-results.json](outputs/verification-results.json) | the 22 step results, the dataset hash (expected / actual / match) and an informational block (realized RTP, per-mode edges); written by `npm run report` |
| E03 | [outputs/simulation-results.json](outputs/simulation-results.json) | Pass 1 and Pass 2 at full precision, schema 3 (schema 2 plus the 98 targets and their mean series); SHA-256 `55873640715d1f9e38d86e10227791337c5664dca094068b2d8d148fdf9ccd97` |
| E04 | [outputs/rtp-convergence.html](outputs/rtp-convergence.html) | self-contained convergence chart: the mean simulated RTP of the 98 targets, 10K → 1M bets per target, ±5·SE band; SHA-256 `6b7b6bb7c474a49b48effbd31dd69ca952e4af5ee451902dbaff4a745743e02c` |
| E05 | [src/rng.ts](src/rng.ts), [docs/ALGORITHM.md](docs/ALGORITHM.md) | the RNG, rebuilt from the written specification `docs/ALGORITHM.md` (SHA-256 `212674d07231733d57616762cca63fc2a5636ddd4248402a5409c2a2a80593e2`) by an implementer who never opened LIQD's code; reproduces all 6,700 rolls, the E13 replies and the session vectors |
| E06 | [src/config.ts](src/config.ts) | win chance, multiplier, discrete win count, half-open `diceWin`, effective edge, limits (`MIN_ODDS 1.0102`, `MAX_ODDS 9900`, `HOUSE_EDGE 0.01`), settlement and pins |
| E07 | [tests/verify.ts](tests/verify.ts) | the 22-step runner over `tests/steps/*`; writes E02 under `outputs/run/` |
| E08 | [src/simulate.ts](src/simulate.ts) | the two-pass simulation, deterministic from `SIM_MASTER_SEED`; writes E03 and E04 |
| E09 | `tests/dice/*Tests.ts` | the 123 unit tests |
| E10 | [Dice game UI](evidence/E10-dice-game-ui.png) | Manual/Auto tabs, bet amount, Multiplier `1.98×` and Win Chance `50.00%`, the four mode selectors, the 0–100 slider at 50, Payout On Win 1.98x; illustrative, no bet placed |
| E11 | [Seeds panel](evidence/E11-provably-fair-seeds-panel.png) | Active Client Seed, Active Server Seed (Hashed) `d399984589d979fa9ecdd79183d54abf5418cac062b1e3e90f31ef8858cb8614`, Total bets made with pair `0`, Rotate Seed Pair with editable Next Client Seed and the pre-committed Next Server Seed hash |
| E12 | [Verify tab](evidence/E12-provably-fair-verify-tab.png) | the operator's verifier form at its defaults (seeds empty, nonce 0, band 0.00–50.00 Under); evidences the verifier's existence and inputs, not a captured bet (D13) |
| E13 | [evidence/E13-verify-endpoint-boundary-probes.json](evidence/E13-verify-endpoint-boundary-probes.json) | seven `POST /api/v1/originals/dice/verify` probes with roll 3.61 from the revealed epoch-0 seed at an unused nonce; all consistent with half-open, but only probes 1 and 5 discriminate (roll == upper loses a non-inverted band and wins its inverted complement); a `corrections` block records the earlier over-statement (D9); includes an interior settled-bet cross-check (roll 24.01 in `[0, 92.37)`); session-recorded, raw HTTP not retained; no bet placed |
| E14 | [evidence/E14-maxodds-live-probe.md](evidence/E14-maxodds-live-probe.md), [evidence/E14-maxodds-live-record.json](evidence/E14-maxodds-live-record.json) | the 1 September 2026 probe: a $0.10 bet at 9900× (`under 0.01`) accepted and settled, lost; acceptance only; raw `place-bet` response and a rotated-seed reveal are a named recapture item; auditor-attested |
| E15 | [outputs/report-figures.json](outputs/report-figures.json) | the derived figures: settled RTP per (band, stake), settlement-residual direction, Phase D exposure (epochs 124–133, $50.00 staked, $48.93 paid against $49.50 expected, z = −0.14), boundary-hit power (4,106 bets with a reachable upper bound, expectation 0.41, 0 observed; 2 on a lower bound) and cherry-pick power; written by `npm run report`, reconciled by Step 19 |
| — | [evidence/rtp-page-labels-2026-10-01.json](evidence/rtp-page-labels-2026-10-01.json) | the live `liqd.com` Dice page read logged out on 1 October 2026 (`Edge: 1.00%`, RTP 99%); the source of the RTP-CLAIM figure |

Only `evidence/E14-maxodds-live-probe.md` is kept as a Markdown exhibit: it is the retained probe record, not documentation.

| Artifact | SHA-256 | Guard |
|---|---|---|
| `data/dice-master-6700bets.json` | `ca1a181a9b4c89a1823e15fe71603b7a5e2267382c134873d80cba536d3aef34` | `DATASET_SHA256`; the loader aborts on any single-byte change |
| `outputs/simulation-results.json` | `55873640715d1f9e38d86e10227791337c5664dca094068b2d8d148fdf9ccd97` | `SIMULATION_SHA256`, scored in Step 19, asserted in `artifactTests.ts`; pinned since 9 September 2026 |
| `outputs/rtp-convergence.html` | `6b7b6bb7c474a49b48effbd31dd69ca952e4af5ee451902dbaff4a745743e02c` | `SIMULATION_HTML_SHA256`, Step 19; re-rendered from the series and compared byte for byte |
| `outputs/report-figures.json` | regenerated by `npm run report` | artifact of record, must be committed; Step 19 reconciles it field for field and its absence fails (M52); five outcomes (absent, unreadable, not an object, missing a field, from a different capture) are each a hard fail; settled-RTP and residual signs are computed in exact arithmetic (**L16**) |
| `outputs/verification-results.json` | — | written by `npm run report`; compared field by field |

A pin proves a file is the committed one, not that its statistics are real: a fabricating auditor re-pins in the same commit. That is why Step 16's two-sided screen and structural checks, and the deterministic regeneration, carry the weight. Since 22 September 2026 Step 19 also requires every numeric leaf of `simulation-results.json` and `report-figures.json` to sit inside a domain derived from `src/config.ts`, ported from the sibling liqd-plinko `src/domains.ts` after a plinko artifact shipped an impossible `-1` behind a clean Full Pass.

## Limitations and trust

LIQD Dice uses the client seed + server seed commit-reveal model with one draw per bet and no external entropy. Commit-reveal, as confirmed on the full dataset, removes post-bet tampering conditional on the attested chronology (**L18**), removes seed foreknowledge through the next-seed chain, makes the client seed load-bearing, and shows faithful execution and payout conformance.

| ID | Residual | Tier | Register |
|---|---|---|---|
| R-CHERRY | server-seed cherry-picking; the defence is a client seed set unpredictably after the commitment, for 124 of 134 epochs (`audit` + 6 `crypto.randomBytes`, 48 bits per epoch; the corrected harness draws 128) | structural, MEDIUM; an external beacon would make it LOW by construction | **L4**, **L19** |
| R-EDGE | effective edge vs the discrete grid | resolved, conditional on E13 | **L2**, **L3** |
| R-ORPHAN | server-side selective orphaning (a settled bet omitted from the reveal); a beacon does not close it, a signed server-side audit log would | disclosed | **L13** |
| R-CREDIT | credited amount confirmed against settle-response fields, not a balance delta | disclosed | **L5** |
| R-MULTI | cross-account seed correlation | out of scope | **L15** |
| R-PARITY | production-build parity | disclosed, provisional | **L12** |
| R-RACE | mid-bet seed-rotation race | not applicable (instant settlement) | — |

Phase D's seeds were `pfaudit-<stamp>-<epoch>`, and the same `<stamp>` was sent in the idempotency key of every bet from epoch 0 (`capture/capture-dice.reference.mjs`, `idemKey = dice-${STAMP}-…`), so `pfaudit-<stamp>-124` was derivable before Phase D began. Since 10 September 2026 (client QA D5) `capture/client-seed.reference.mjs` refuses to generate a seed until the epoch's commitment has been recorded, then draws 128 bits of CSPRNG material and records the order; `tests/dice/clientSeedTests.ts` asserts it. The historical dataset is unchanged, and a recorded ordering is the auditor's own account of the auditor's script.

### Declared limitations register

Each entry is a limitation this audit found in its own work, measured and published. A reviewer's finding that maps onto nothing here is new.

| ID | Limitation and magnitude | Why this capture cannot close it |
|---|---|---|
| **L1** | **A subtly forged Pass-1 statistic is not recomputed in the fast `verify` (narrowed).** Five raw quantities (`uniformity.chi2`, `serial.lag1`, `serial.runsZ`, each band's and target's `simulatedRTP`, the convergence RTP paths; the fifth was added to the list on 10 September 2026, D11) come from 138M draws (40M before the 98 targets were added) the fast verify does not repeat. They are bounded by the two-sided screen and structural checks. Since 19 September 2026 the producer is deterministic, so `npm run test:full` reproduces them byte for byte and a value moved within its sampling distribution (e.g. χ² 108.885 retyped to 116) no longer survives it. `tests/forgeries/fabricated-pass1.mjs` re-pins and Step 19 passes on it | a reader who runs only the fast path relies on the structural checks. Mutations M26 and M49 cover the perfect end only |
| **L2** | **The half-open win rule rests entirely on E13, and only 2 of its 7 probes discriminate.** Raw HTTP not retained. The inclusive-both-ends model reproduces all 6,700 win flags with **0** mismatches (`boundary.betsWhereBoundaryModelsDisagree`); **0** rolls landed on an upper bound against an expectation of **0.4106** (4,106 bets have a reachable upper bound; 2,594 carry `upper = 100`: 2,592 `over` bets plus 2 `outside` bands). M05 dies only against the E13 unit vectors | needs a new live bet whose roll lands exactly on an upper bound, with the raw response retained |
| **L3** | **The flat 1.0000% edge is a model identity, not a measurement.** 0.01 by algebra for every 2-dp band; verified over 59,998 bands; float form departs by at most 6.32e-15 across the capture and 5.06e-13 at 9900× | not closable by construction; its power is against changes to the model (M04, M25, M05) |
| **L4** | **Pass-2 served-band return uses exact moments with an asymptotic (CLT) tail, not an exact-lattice CDF** (ASSUMED to satisfy DICE-21 `full`). z 0.752, p 0.7738; 80% power against a 14.377 pp per-bet deficit, so a smaller selection effect passes; specified after the capture. The exact CDF would convolve heterogeneous scaled binomials up to 2^39 atoms (110 of 134 epochs multi-band, up to 36 distinct multipliers per epoch); a pruned sparse DP aborts at >8.3M atoms and 5–8 s per worst epoch. Supplementary screen needs 13 flags (P(X ≥ 13) = 0.0062), roughly double the null rate | a single-target-per-epoch re-capture would make the exact CDF tractable; the load-bearing defence remains structural |
| **L5** | **No wallet balance ledger.** `stakeWallet` and `winningAmountWallet` are present and checked with zero tolerance; `balanceOk` is null on 6,700/6,700, so the audit shows the settle-response fields are consistent with the formula, not what the wallet was credited (R-CREDIT) | needs a recapture recording `Δbalance == winningAmount − betAmount` per bet |
| **L6** | **Stage-1 rounding tie mode is uncharacterised (survivor M57).** Ties at `b` 2048 (4.833984375) and 6144 (1.611328125); at 6144 the modes differ; no captured bet lands on either; the 9,800-case sweep compares with exact half-up and passes under either mode | needs a settled win on `b` 2048 or 6144, e.g. a 61.44% band at a $1 stake |
| **L7** | **The 9900× ceiling and the input contract rest on E14, one live probe whose response was not retained.** Acceptance at 9900× (a loss), not rejection above; no captured bet exceeds 99×. Not an executed survivor: the ceiling is echoed into the committed `verification-results.json`, and shrinking it is caught by Step 10 (M09) | the 99×–9900× tail, the rejection boundary and any exposure cap need live probes with raw responses |
| **L8** | **`basisPoints` is an auditor derivation, not an operator field.** The quotient matches 2,807/2,807; the float closed form agrees on 1,823 / 1,719 depending on spelling | needs an operator field, specification or source, none of which exist for this pre-launch game |
| **L9** | **Dataset provenance is auditor-attested.** The chain shows internal consistency and order; it does not bind the rounds to LIQD | not closable offline by anyone; needs operator-signed settlement records or an independent third-party capture |
| **L10** | **Resolved (19 September 2026).** The stale schema-1 field `pass1.serial.zCritical` read 2.576236081309571 (two-sided z at the uncorrected α = 0.01) while Step 16 applied 2.9351994688667054; the deterministic regeneration produced schema 2, which stores the applied threshold and the runs cell counts, and Step 16 asserts they agree. Until 10 September the verifier applied 2.935529862881156 from an Abramowitz & Stegun fit (error bound 4.5e-4), the chapters printed 2.936; the true critical z is 2.9351994688667059210814763461956…, nearest binary64 2.935199468866706; computing `-normalQuantile(ALPHA_SCREEN/2)` puts the applied value about 1.3 ULP (5.7e-16) away instead of 17.3 ULP (about 1e-14); the tail then departs from α by 6.1e-18 | slot kept so L11–L19 keep their identifiers |
| **L11** | **The operator-side modulo-bias rejection guard is ASSUMED (survivor M58).** Rejection p ≈ 1.7e-6 per draw; no captured bet or session vector hits it. Removing it survives `npm run verify`; the unit suite rejects it through a constructed vector, so `npm test` as a whole fails (D8) | no client capture of this size can force a rejection; bias impact if absent ≤ 1.7e-6 |
| **L12** | **Production parity is ASSUMED** (R-PARITY). The whole capture is pre-launch on `qa.liqd.com` | closed only by the anonymous post-launch recapture (A1) |
| **L13** | **Trailing withholding is not observable client-side** (R-ORPHAN). Nonces are contiguous, but the trailing bound is the auditor's last recorded nonce and `nonceStart` is the capture default on all 134 epochs | needs the operator's "Total bets made with pair" counter read before each rotation (`operatorBetCount`) or a signed server-side log |
| **L14** | **Verifier ≡ settlement engine is witnessed only away from a boundary.** E13's settled cross-check is an interior roll (24.01 in `[0, 92.37)`) | needs the same settled boundary evidence as L2 |
| **L15** | **Single account, single window** (R-MULTI). Cross-account treatment and seed reuse, and later behaviour, are not ruled out | needs coordinated multi-account capture |
| **L16** | **`report-figures.json` is reconciled within a single run**, so its production is not independently witnessed. Absence fails (M52); until 9 September 2026 Step 19 read "absent — this run writes it" and stayed green (F11) | the recomputation is our code against our code; the witness is the dataset, whose provenance is L9 |
| **L17** | **One validated runtime, Node 22.x.** A reviewer ran the package on Node 24 and it failed over a single-ULP difference in `cherryPickPower.pAtMinRejectable`, a binomial tail built from `**`, which ECMAScript leaves implementation-approximated; the earlier entry named the wrong field (corrected 11 September 2026). The README had advertised "Node.js 20+". Node 24 has not been re-tested | widening tolerances would admit forgeries; closing it means validating each runtime or replacing the transcendental-dependent statistics |
| **L18** | **Commitment chronology is auditor-attested, not authenticated.** Steps 1–3 establish which value goes with which; a SHA-256 digest carries no time, so the rows are consistent with commitments published first and with commitments composed afterwards. Every non-alteration statement is conditional on the capture record (client QA, 11 September 2026) | not closable offline; needs commitments in an append-only log with independent timestamping (a transparency log, a beacon round, a third-party-signed receipt) |
| **L19** | **Predictable Phase D client seeds.** All ten Phase D epochs (124–133, 500 bets) used `pfaudit-<stamp>-<epoch>` with one stamp: given `pfaudit-1787856766341-124`, `…-125` to `…-133` follow. Exposure $50.00 staked, $48.93 paid, z = −0.14 (`report-figures.json → phaseD`); the rolls recompute 500/500. The other 124 epochs use the phase A–C `audit` + randomBytes values | a production capture drawing each client seed from a CSPRNG after recording the commitment, as `capture/client-seed.reference.mjs` implements |

### Premises

| Premise | Witness | Could the captured data contradict it? |
|---|---|---|
| Win rule half-open `[lower, upper)` | E13; only probes `[0, 3.61)` non-inverted and `[0.5, 3.61]` inverted discriminate; asserted in `rngTests.ts` | no power: both rules reproduce all 6,700 flags (**L2**) |
| Lower bound inclusive | dataset | yes: two settled lower-bound wins (rolls 0.00 and 99.00) |
| Commitment = SHA-256(utf8(hex string)) | dataset | yes: 134/134 |
| RNG = HMAC-SHA256, hex-decoded key, `cs:nonce:cursor` | dataset | yes: 6,700/6,700 bit for bit |
| Multiplier = `9900 / basisPoints` | dataset | yes: 2,807 strict matches while the float form is not |
| Verifier and settlement implement the same rule | E13 | partial: one interior settled bet; no settled upper-bound case (**L14**) |
| maxOdds 9900× accepted, not the configured 99 | E14 | not from the capture: acceptance on one losing bet (**L7**) |
| Stage 1 rounds half-up | ASSUMED: no captured bet on `b` 2048 or 6144; stage 2 half-even is witnessed by 274 ties | no (**L6**) |
| Operator applies the rejection guard | ASSUMED: unexercised at p ≈ 1.7e-6 per draw | no (**L11**) |
| qa build == production build | ASSUMED: pre-launch capture, open item A1 | no (**L12**) |
| Each commitment existed before its bets | ASSUMED: the capture record; the pre-capture link orders records without dating them | no: no offline computation on this dataset can separate the two (**L18**) |
| DICE-21 realized as exact moments + one-sided normal tail | ASSUMED to satisfy DICE-21 `full`; witness Step 17, `SIM_PASS2_*`, `pass2.servedBand` | partial: moments and observed z are re-derived exactly and a forged early return is caught; the CLT-tail adequacy is the premise (**L4**) |

### Model anchors

| Modelled figure | Anchor | Tolerance | Enforcing test |
|---|---|---|---|
| Roll recomputation | bit-for-bit re-derivation of all 6,700 money-settled rolls under the intact chain; corroborated by the verify-endpoint vectors (raw responses not retained) | exact | `tests/steps/determinism.ts` (Step 5) |
| Effective edge per band | discrete tally of winning outcomes over the 10,000-point grid; no operator odds field read | exact integers | `tests/steps/anti-circularity.ts` (Step 13), `tests/steps/boundary.ts` (Step 15) |
| Served multiplier = `9900/basisPoints` | direct measurement of served minus quotient on every win | 0, strict `===` | `tests/steps/payouts.ts` (Step 7) |

**Residual, declared.** The tally and the engine share one reading of the rules (grid, half-open bands, continuous pricing), so a shared misreading moves both; the original release proved it, encoding inclusive-both-ends in both until E13 pinned the rule. The tally never scales a band bound, so it cannot share an arithmetic error with the closed form: it exposed the original IEEE-754 bound-scaling off-by-one on 403 of 5,304 distinct bands (QA 2026-08-31). No published third-party RTP exists for this pre-launch operator, so the anchor class is enumeration plus settled-roll reproduction. Both implementations were written by the same team; the defence is architectural.

### Recommendations

| ID | Recommendation |
|---|---|
| P1 | Publish the boundary rule: a roll equal to the lower bound wins, equal to the upper bound loses (inverted the complement). A verifier author assuming inclusive bands will mispredict a 1-in-10,000 boundary bet |
| P2 | Publish the byte-level algorithm, the commitment convention, the win rule and multiplier, and a validation vector from a revealed epoch |
| A1 | Production-parity recapture, the item that gates provisional status: retain raw responses for the E13 probes, the extreme bands (`under 0.01`, `over 99.99`) and the verify vectors; record `operatorBetCount` before each rotate; persist the raw post-rotation nonce and each response's `provablyFair.serverSeedHash`; randomise Phase D seeds after the commitment; make a 9900× bet recomputable (raw `place-bet` response plus a reveal, as `evidence/E14-maxodds-live-probe.json`); witness a settled win at roll 0.00 on `under 0.01` and the loss at 0.01; re-test the rounding rule on production with raw response text |
| A2 | Larger targeted samples at the extreme tail, large enough to land rolls on band bounds |
| A2b | Probe server rejection above 9900× and characterise any payout or exposure cap |
| A3 | Multi-account seed-correlation study |
| A3b | A stronger return-based cherry-pick test: one target band held per period, so the exact distribution is tractable, with unpredictable Phase D seeds (raised by an external reviewer, 9 September 2026; Step 17's served-band return implements the current version) |
| A4 | A browser-ready single-file wrapper of `src/rng.ts` for players without Node |

Future evidence collection, not defects (client QA, 10 September 2026): replayable simulations are done (DICE-20), though replay cannot prove the master seed was not chosen (**L1**); authenticated chronology and origin (**L9**, **L18**); a retained settled upper-bound case (**L2**, **L14**); wallet and production parity (**L5**, **L12**); a winning extreme-band settlement, rejection above the ceiling and exposure-cap evidence (**L7**). No new paid bets are authorized by that checklist and none were placed for it.

### Production validation plan

Anonymous production validation is the next stage. It will use the public game path, keep a separately identified evidence set and publish the calculations; operator-assisted collection will be identified separately. Planned upgrades: public production coverage under a predefined plan; complete transaction records (bodies before parsing, stable request identifiers, every rejected or uncertain attempt, retries reconciled before advancing); the seed lifecycle (commitment first, then a fresh client seed of at least 128 bits, activation confirmed, every reveal retained); wallet reconciliation (`closing balance = opening balance − stake + payout`, tied to bet ids); boundary and rounding coverage (upper-bound settlements, inverted cases, the L6 case); odds and exposure behaviour; statistical coverage defined before evaluation; replayable analysis (done for Pass 1). The production collector must record responses durably, preserve numeric text, reuse the request identity for one intended bet (`capture/bet-operation.reference.mjs` does this across transient retries and is tested by `captureRetryTests.ts`; the capture of record drew a new key per attempt and retried every error except authentication and API errors), and reconcile uncertain responses and rotations. A successful production capture resolves **L12** for the sampled activity; it does not close unrelated wallet, rare-case, authenticity or statistical boundaries, and the pre-production result remains a completed assessment.

## Terms

**Provably fair / commit-reveal:** outcomes fixed by a seed whose hash is published first and revealed later; depends on the commitment being published before the round (**L18**). **Server seed:** 32-hex (16-byte) operator secret; the HMAC key in hex-decoded form. **Commitment:** `SHA-256(utf8(serverSeed hex string))`. **Client seed:** player-controlled HMAC input; a defence against cherry-picking only when unpredictable and chosen after the commitment. **Nonce:** bet index 0–49 within an epoch. **Cursor:** third HMAC field, 0 for Dice; it changes the message, not an offset into a digest; a retry at `cursor + 1,000,000` has probability ≈ 7e-47 per bet. **Roll:** draw / 100 on `[0.00, 99.99]`. **Band / mode / inverted:** the bet `{lower, upper, inverted}` and its four shapes. **Half-open rule:** win on `roll ≥ lower` and `roll < upper` (or the complement). **Continuous vs discrete win chance:** the priced width vs the fraction of the 10,000 points that win; equal under the half-open rule. **Effective edge:** `1 − discreteWinChance × quotedMultiplier`. **Modulo-bias rejection:** discarding values at or above `floor(2³²/range)·range`. **Instant settlement:** one call places and settles. **Epoch:** 50 bets under one seed pair. **Chain link:** `nextHashedServerSeed`; orders records, does not date them. **Anti-circularity:** theoretical figures from grid arithmetic, never operator odds fields. **Exact discrete null:** the enumerated distribution of the Pass-2 χ². **Selective orphaning:** settling a bet and omitting it from the reveal. **Hard fail:** any FAIL, exit 1; a FLAG is a Conditional Pass, exit 2. **G-BIND:** every population assertion binds to source records and `src/config.ts` constants, never to a count the artifact supplies about itself; a reviewer once obtained a clean Full Pass on a sibling package by shrinking a dataset 40% and doctoring its header. **G-VALID:** a statistic landing exactly on its expectation is legal; exactness is never treated as evidence of fabrication.

## Release history

**`v1.0.0`**, released 21 October 2026, is the first public release, published as one commit (release manifest `supersedes: null`, `signature` the fingerprint of the key that signs the release). The dated entries below record the audit work that led to it; the last of them rebuilt `src/rng.ts` from a written specification, with LIQD's verify endpoint kept as a second check (20 October 2026, below). Recorded result: **22/22, 0 flags, 0 hard fails**, `PROVABLY FAIR — Full Pass`, provisional.

**`v1.1.0`** supersedes `v1.0.0`. It standardizes the simulation on 98 targets × 1,000,000 bets to match the Duel dice audit (Mike's request, 22 October 2026), and adds `.gitattributes` (`* -text`) so a Windows git clone keeps every file byte-identical. An errata-only `v1.0.1` with the `.gitattributes` file was prepared on 21 October 2026 and never published; its content is part of `v1.1.0`. The verdict is unchanged: **22/22, 0 flags, 0 hard fails**, `PROVABLY FAIR — Full Pass`, provisional. Details are in the 22 October 2026 entry below.

- **31 August 2026.** QA fix: the literal tally exposed an IEEE-754 bound-scaling off-by-one on 403 of 5,304 bands; the E13 verifier probes replaced the inclusive-both-ends model with the half-open rule, removing the earlier bet-dependent edge (0.108%–1.952%).
- **9 September 2026.** The settlement-residual split "1,386 down / 1,421 up / none exact" was retracted for 1,341 / 1,316 / 150: the residual had been computed in binary64 rather than decimal (witness `vChEZ7Lu-yY1PMmq5fOz5`, `0.1 × 3.125 = 0.3125`, nothing rounded); max residual and net were unchanged. The "1.71e-13 multiplier deviation" was withdrawn as auditor float noise. The "2,592 vs 2,594" count was recorded as definitional. `npm test` began scoring the committed, pinned simulation; Pass-1 screens Bonferroni-corrected; Step 17's null made exact; population bound to code constants after a coherent 4,020-bet shrink passed; `report-figures.json` absence made a FAIL; the wallet and settlement tolerances made exact; the edge identity made integral; Step 2's pre-capture link read.
- **10 September 2026.** Client QA round 4: verify writes only `outputs/run/` (D1); malformed report figures fail (D2); standard errors recomputed (D3); the "plausibility floor" removed (D4); the client-seed harness corrected (D5); the zCritical applied value corrected (D7/D17); the L11 split stated (D8); E13 discrimination corrected to 2 of 7 (D9); L1 list extended (D11); Step 20 rebuilt from the quotient (D16); Node 22 pinned (**L17**).
- **11 September 2026.** Client QA round 5: the fractional-win-count check strengthened to forward reconstruction; the chronology premise declared as **L18**; Step 16's level corrected to ≈0.0100057 (≈0.0300 over seven screens); the zCritical error term corrected; **L17**'s field name corrected.
- **19 September 2026.** Pass 1 deterministic from `SIM_MASTER_SEED` (DICE-20), schema 2; **L10** resolved and **L1** narrowed; Pass-1 figures swept.
- **22 September 2026.** Value domains added to Step 19.
- **28 September 2026.** Run metadata removed from the committed artifacts; float comparisons at 1e-14 + 1e-12.
- **29 September 2026.** Step 22 and pooled real-roll uniformity made informational under the profile policy.
- **30 September 2026.** LIQD's rounding statement received; F-ROUNDING opened.
- **1 October 2026.** Live page labels read.
- **2 October 2026.** Relabelled-commitment and credited-loss forgeries added (Steps 3 and 9); 20-run invariance measured; mutation battery run; `test:full` timed.
- **4 October 2026 (client pre-publish QA).** Verify a bet: step 6 notes LIQD's stated round-down for live bets (F-ROUNDING) and how far it can sit from the measured rule by stake. README verifier link corrected to the LIQD verifier, and the README states that it does not check the credit. No step, figure or verdict changed.
- **5 October 2026 (pre-publish).** Audit ID `PF-2026-LQ04` confirmed by ProvablyFair.org (release manifest `auditIdStatus`). The release is stated as a fresh release of `ProvablyFair-org/liqd-dice`. The verification results were re-emitted for the DICE-28 coverage note only and the release manifest was regenerated. No step, figure or verdict changed.
- **14 October 2026 (Methodology v1.1).** RTP-CLAIM 1.1.0 → 1.2.0 (Methodology v1.1, Mike, 14 October 2026; `src/rtp-claim.ts` re-vendored byte for byte, SHA-256 `c9a9c1c4…`; switch still on): an enforced miss would now mark the RTP-claim step RTP FIGURE OVERSTATED and make the verdict RTP FIGURE OVERSTATED, exit 5, instead of NOT PROVABLY FAIR; the claim's source restated to name the game page, one of the rule's six places (no figure changed). Framework 1.0 → 1.1 (D1), the profile version's suffix dropped as approved (D6), the S5 line added (D5). `outputs/rtp-claim-table.json` re-written (`ruleVersion`, the restated source, the `minimalFix` wording and the new `unstated: 0` field) and re-pinned (`075811c7…`); `outputs/verification-results.json` re-emitted with `npm run report` (only `profileVersion` changed) and emitted a second time with the same bytes (`36e31283…`); `RELEASE-MANIFEST.json` regenerated; `verify.js` rebuilt with `audit-framework/tools/build-standalone-verifier.mjs` (`test.js` rebuilt byte-identical). Verdict unchanged: `npm test` on Node 22.23.1 exits 0 — 117 passing, 22/22, PROVABLY FAIR — Full Pass, REPRODUCED, release manifest OK. `npm run mutate`: 44 killed, 1 informational signal, 2 survivors as declared, 0 not as declared.
- **19 October 2026.** Documents only; no step, figure, pinned file or verdict changed. The falsifiability paragraph gives the full battery of 19 October 2026 (49 entries: 46 killed, 1 informational signal, 2 survivors as declared, 0 not as declared), the first full run to include the two C3 entries; the capture section describes `capture/rng.reference.mjs`.
- **19 October 2026, later.** The standalone generator ships: `scripts/build-standalone-verifier.mjs` (the generator that built the committed `verify.js` and `test.js`, which it reproduces byte for byte) and `scripts/check-standalone-build.mjs`, with `npm run build:standalone` and `npm run check:standalone-build`. An earlier builder, `tools/build-standalone.mjs`, is a different builder whose output is not these bundles; it is not part of this package. No step, figure, pinned file or bundle changed.
- **20 October 2026.** `src/rng.ts` rebuilt from a written specification instead of derived from LIQD's code: the specification, [docs/ALGORITHM.md](docs/ALGORITHM.md) (SHA-256 `212674d0…a80593e2`), was written without opening LIQD's code or any port of it, and the module was written from that specification and a module-interface file alone; LIQD's verify endpoint (the E13 replies and the session-recorded vectors) is kept as a second check. Measured on integration over all 6,700 bets: rolls 6,700/6,700, seed records 134/134, E13 replies 7/7 plus the settled-bet cross-check 1/1, session vectors 8/8, and the ProvablyFair.org site verifier's dice module (its source, run locally) 6,700/6,700. `diceRoll` now returns the roll in hundredths and its callers divide by 100; server seeds must be lowercase hex (all 135 captured seeds are); when all eight chunks are rejected the module stops with an error instead of moving to cursor + 1,000,000 (specification O2; no captured draw reaches it). The draw-bias bound moved unchanged to `src/bias.ts`, on the rebuilt `maxFairFor`; the specification's 84 checks added as `tests/dice/rngSpecTests.ts` (118 unit tests). Mutations retargeted to the rebuilt module: draw range off by one and HMAC cursor moved (formerly on the `src/config.ts` constants, which `diceRoll` no longer reads), commitment over raw bytes, rejection window widened, and the declared guard-removal survivor. `npm run simulate` reproduced both pinned simulation files byte for byte (no re-pin); `outputs/verification-results.json` re-emitted with `npm run report` (only the Step 5 detail and the DICE-07/DICE-08 notes changed); `verify.js` and `test.js` rebuilt with `audit-framework/tools/build-standalone-verifier.mjs`; `RELEASE-MANIFEST.json` regenerated. Verdict unchanged: `npm test` on Node 22.23.1 exits 0, 118 passing, 22/22, PROVABLY FAIR — Full Pass, REPRODUCED, release manifest OK. `npm run mutate`: 46 killed, 1 informational signal, 2 survivors as declared, 0 not as declared.
- **21 October 2026 — release `v1.0.0`.** Release wording only; no step, figure, scored artifact or verdict changed. The release lines name `v1.0.0`, the first public release; `RELEASE-MANIFEST.json` regenerated (`release` `v1.0.0`, `supersedes` null, `signature` the release key's fingerprint).
- **22 October 2026 — release `v1.1.0`.** Simulation standardized on the Duel dice design, at Mike's request, on the same seeds as `v1.0.0`. Pass 1 gains 98 targets, `over 2.00` to `over 99.00`, at 1,000,000 bets each, and their mean simulated RTP replaces the `under 50` series as the convergence chart. Result: all 98 targets are within 5·SE + 1e-4, and the mean simulated RTP is 99.0203% against 99.0000% (SE 0.0207 pp, Δ 0.9803·SE). **Seeds:** the `v1.0.0` source is unchanged, with the same `SIM_MASTER_SEED` and the same `HMAC(SIM_MASTER_SEED, counter)` derivation. The `v1.0.0` blocks run first in their original order, so the uniformity, serial, nine-band, `under 50` and Pass 2 sections of `simulation-results.json` are byte-identical to `v1.0.0`. The targets continue the same stream from counter 800,022, each consuming 20,002 counters exactly as an edge band does; Step 16 re-derives each target's position and seeds. The simulation was regenerated once with `npm run simulate`, and no seed was chosen or re-drawn. Artifact schema 3. `SIMULATION_SHA256` `55873640…` and `SIMULATION_HTML_SHA256` `6b7b6bb7…` were re-pinned. Step 16 checks the target rows, their seed positions, every mark and the mean series. The value domains cover the new fields (5,609 numeric leaves). Error budget: `STEP_16_BOUND` ≈0.0100625, ≈0.0301 over all seven screens. Ten mutations were added (M39–M48), and the fabricated-Pass-1 forgery now also forges the targets; the stale survivor and forgery labels in this document were corrected to the runner's (M49, M52, M57, M58). `outputs/verification-results.json` was re-emitted with `npm run report`, twice, with the same bytes (`819510fe…`); `report-figures.json` is unchanged. `verify.js` and `test.js` were rebuilt with `npm run build:standalone` (`check:standalone-build` reproduces both), `.gitattributes` was added, and `RELEASE-MANIFEST.json` was regenerated (`release` `v1.1.0`, `supersedes` `v1.0.0`). On Node 22.23.1, `npm test` exits 0: 123 passing, 22/22, PROVABLY FAIR — Full Pass, REPRODUCED, release manifest OK. `npm run mutate`: 56 killed, 1 informational signal, 2 survivors as declared, 0 not as declared.

### 4 October 2026 — consolidated documentation

The package's 23 Markdown files were reduced to **README.md and this MANIFEST.md**, plus `evidence/E14-maxodds-live-probe.md`, kept because it is the retained probe record (E14), not documentation. Repeated explanations were removed; the dataset, outputs, evidence files and code were retained, and no claim, verdict, limitation or open item changed. The profile-coverage map's documentation references, one informational detail string in Step 17 and comments that named removed files now point to the sections here. The verification results and release manifest were regenerated with the package's own commands; every numerical result is unchanged. No new capture, simulation regeneration or mutation campaign is asserted for this update.

### Where the former chapters went

| Former documentation | Consolidated location |
|---|---|
| `executive-summary.md`, `conclusion.md`, `SUMMARY.md` | Conclusion and scope; Contents; Release history (corrections); README |
| `scope-and-methodology.md` | Conclusion and scope; Dataset and capture |
| `system-architecture.md`, `game-rules.md`, `rng-algorithm-analysis.md` | Game and algorithm |
| `game-logic-verifiability.md` | Game and algorithm; Verify a bet |
| `payout-verification.md`, `rtp-analysis.md`, `edge-case-analysis.md` | Payouts and RTP; Verification results |
| `live-parity-testing.md`, `exploit-testing.md`, `findings.md` | Verification results |
| `reproducibility.md` | Reproduce the audit; Limitations and trust (L10, anchor residuals) |
| `evidence.md` | Evidence; Verify a bet (representative bets) |
| `operator-trust-analysis.md`, `recommendations.md` | Limitations and trust |
| `AUDIT_CONTEXT.md` (technical report: field origins, worked recomputations, claim map, scope register, production plan) | Dataset and capture; Verify a bet; Verification results; Limitations and trust |
| `glossary.md` | Terms |
| Former `MANIFEST.md` sections (algorithm, inventory, artifacts, premises, limitations, anchors) | Game and algorithm; Reproduce the audit; Evidence; Limitations and trust |
