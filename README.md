# LIQD Dice — Provably Fair Audit

**Auditor:** [ProvablyFair.org](https://www.provablyfair.org) · **Audit ID:** `PF-2026-LQ04` · **Release:** `v1.3.0` · **Capture:** 7 to 10 November 2026, `liqd.com` production

**Result: PROVABLY FAIR — Full Pass, on the liqd.com production capture of 7 to 10 November 2026.** 22/22 steps pass (21 scored + 1 informational), with 0 flags and 0 hard fails. All 5,936 captured rolls recompute bit-for-bit from their `(serverSeed, clientSeed, nonce)` inputs, all 34 seed epochs were revealed and hash to their commitments, LIQD's own verify endpoint returns the served result for every round, and LIQD's bet replies settle every round at the exact amount rounded down to 8 decimals, the rule LIQD stated on 30 September 2026. Every check of LIQD's behaviour rests on production data.

**Scope:** Dice (`gameId` `originals-dice`) on `liqd.com`, played logged in from one account, in five phases: 5,000 rounds at 0.10 USDT over 10 win chances from 2% to 98% in five band types (Phase A, 7 November); 500 rounds at 0.10 USDT under 5 player-set client seeds (Phase D); 200 rounds at 0.10 USDT at a 1% win chance, 99× (the Phase A top-up); 235 rounds at 10.00 USDT on `over 50` (Phase C); and one round at 0.10 USDT at a 0.01% win chance, 9900× (Phase X); the last four on 10 November. A bet is a band `{lower, upper, inverted}` on a roll from 0.00 to 99.99, priced at `9900 / basisPoints`. Theoretical RTP is **exactly 99.00% on every bet before settlement rounding**, a flat 1.00% edge, under the half-open win rule witnessed on LIQD's production verifier and assumed for settlement; after rounding down, the RTP per captured bet is at most 99% and at least 98.999992%. That each commitment existed before its bets is the auditor's capture record, not independently timestamped. Theoretical RTP is not a promise about an individual session's return.

## What was verified

| Check | Captured evidence |
|---|---|
| Roll reproduction | 5,936 of 5,936 rolls byte-identical from the revealed seeds; win flags 5,936 of 5,936. The RNG code, `src/rng.ts`, implements a written specification ([docs/ALGORITHM.md](docs/ALGORITHM.md)) grounded on production sources and was written without opening LIQD's code; LIQD's production verify endpoint returned the served roll, win and multiplier for 5,936 of 5,936 rounds (stored per round in the dataset) |
| Seed records | 34/34 commitments match their reveals; 30/30 next-seed links inside the four capture files, plus the pre-capture link of each file; every epoch's nonces run from 0 without a gap; each epoch under its own client seed, 5 of them player-set |
| Boundary rule | 33 calls to LIQD's production verifier with the roll on or next to a band bound ([E17](evidence/E17-prod-verify-boundary-probes-2026-11-09.json), and [E20](evidence/E20-prod-verify-9900x-probes-2026-11-10.json) on 0.01% bands): 33 of 33 follow the half-open rule, and the 11 that separate it from an inclusive band all do; the 4 winning 0.01% probes are priced 9900×. No settled round landed on a bound |
| Payouts | 2,622 wins at the bit-exact `9900/basisPoints` multiplier, settled at `floor8(stake × multiplier)`: 1,520 land exactly on the product, 1,102 are rounded down by less than one 0.00000001 unit, none rounded up; 3,314 losses pay 0; the reply's wallet fields agree row for row (no balances captured, L5) |
| Higher stake | 235 rounds at 10.00 USDT (126 wins) recompute and are settled by the same rule as the same band at 0.10 USDT |
| Edge | exactly 1.0000% on all 5,936 bets, a model identity under the half-open rule |
| Simulation evidence | 98 targets (`over 2.00` to `over 99.00`) × 1,000,000 bets each: all 98 within 5·SE of theory, mean simulated RTP 99.0203% against 99.0000% (SE 0.0207 pp); 2,000,000-draw uniformity, a 200,000-roll serial screen, 9 edge bands across all four modes and a 20,000,000-draw `under 50` series; 34 revealed seeds × 10,000 nonces cherry-pick screen |
| Observed return | 104.86% over the capture (3,062.01 USDT on 2,920.10), reported separately from theoretical RTP; a variance illustration only |

**Production behaviour disclosed: payouts are rounded down.** LIQD's bet replies settle 2,622 of 2,622 wins at the exact amount rounded down to 8 decimals, as LIQD stated. A winning payout is never above the exact amount and is below it by less than 0.00000001 USDT.

**Anchor residual, declared.** The effective-edge tally and the settlement engine share one reading of the rules (the 10,000-point grid, half-open bands, pricing on the continuous win chance), so a shared misreading would move both; the external witness of that reading is LIQD's production verifier records E17 and E20. See [model anchors](MANIFEST.md#model-anchors).

**Not measured on production:** band widths between the win chances 0.01% and 1% and above 98%, a settled win at 9900× (the one round at 0.01% lost; LIQD's verifier prices that band at 9900×, E20), LIQD's odds and bet limits, stakes other than 0.10 and 10.00 USDT, and settlement of a roll that lands exactly on a band bound. No account balance was read: payouts are the amounts in LIQD's bet replies, not observed balance changes (DL-5). Fifteen open limitations (18 register slots, 3 of them closed) are in the [overview's limitations](MANIFEST.md#limitations-and-trust).

## Run the audit

Open a terminal in the package directory. Use **Node 22.23.1 or later in 22.x**, as declared in [package.json](package.json) `engines` (`>=22.23.1 <23`); [.nvmrc](.nvmrc) pins 22.23.1, the version the committed run was produced on. Other majors are refused.

```sh
npm ci
npm test
```

Expected: **110 unit tests pass; 22/22 steps pass · PROVABLY FAIR — Full Pass; REPRODUCED; release manifest OK; exit 0.** `npm test` runs the unit suite, the scored verification and `node scripts/release-manifest.mjs --check`. It replays every captured bet and scores the committed simulation; it does not regenerate it.

```sh
npm run test:full                 # regenerates the simulation from its pinned master seed, then verifies
npm run test:standalone           # node test.js && node verify.js: the same checks with nothing but Node
npm run check:standalone-build    # verify.js and test.js are what src/ and tests/ compile to
```

Exit 0 is a Full Pass, 2 a Conditional Pass (any FLAG), 5 RTP FIGURE OVERSTATED (the enforced RTP-CLAIM 1.2.0 rule finds the published RTP figure overstated; not a draw fail), 1 a FAIL or a reproduction beyond tolerance. Ordinary runs write only to `outputs/run/`; `npm run report` is the only command that rewrites the committed results. See [reproduction details](MANIFEST.md#reproduce-the-audit) for the comparison rules, the mutation battery and the tolerances.

## Verify a bet

The quickest way is the [ProvablyFair.org LIQD verifier](https://www.provablyfair.org/verify-bets/liqd): after your seed pair rotates, it checks the commitment, roll, win, multiplier and the payout by the round-down rule in the browser. To check by hand, test that SHA-256 of the revealed server seed's hex text equals the commitment shown before the bet, compute the roll from the HMAC of `clientSeed:nonce:0`, apply the half-open win rule and recompute the payout: the stake times `9900 / basisPoints`, computed exactly and rounded down to 8 decimals. The [complete instructions](MANIFEST.md#verify-a-bet) give the six steps in LIQD's field names, a worked trace and a standalone Python checker.

## Files and evidence

The documentation is this README and [MANIFEST.md — consolidated audit overview](MANIFEST.md), which contains the algorithm, RTP derivation, verification results, evidence register, limitations and release history. Three companion files are generated from the overview and checked against it by a unit test: [evidence.md](evidence.md) (every evidence item with its origin and SHA-256), [exploit-testing.md](exploit-testing.md) (the integrity-check matrix and the mutation registry) and [SUMMARY.md](SUMMARY.md) (table of contents).

- [Captured bets](data/dice-prod-5936bets.json) — SHA-256 `41ea55fcadd903768be3a92725f2100fe2e794ab300d6842ce946124ea7d5042`. Dice has no paytable file; the multiplier is computed from the band.
- [Verification results](outputs/verification-results.json), [report figures](outputs/report-figures.json), [simulation results](outputs/simulation-results.json), [RTP claim table](outputs/rtp-claim-table.json) and [release manifest](RELEASE-MANIFEST.json).
- [Evidence records](evidence/): the capture checker's printouts of the four production capture files (E16, E18, E19, E21), LIQD's production verifier on band bounds (E17) and at the 9900× setting (E20) and the live page figures the RTP claim is read from.
- [Audit report](https://audit.provablyfair.org/casino/liqd/games/dice/overview) · [Public repository](https://github.com/ProvablyFair-org/liqd-dice) · [MIT license](LICENSE).

The release commit and tag are signed with the ProvablyFair.org release key (SSH, `SHA256:gEujiJm2pRyq7lQsfYQfQ1r97H/J7GdaKHbOW8GtikY`), which the release manifest records. The documentation history is recorded in the [release history](MANIFEST.md#release-history).
