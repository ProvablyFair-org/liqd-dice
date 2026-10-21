# LIQD Dice — Provably Fair Audit

**Auditor:** [ProvablyFair.org](https://www.provablyfair.org) · **Audit ID:** `PF-2026-LQ04` · **Release:** `v1.0.0` (the first public release) · **Capture:** 27 August 2026, `qa.liqd.com`

**Result: PROVABLY FAIR — Full Pass** *(provisional — pre-launch capture)*. 22/22 steps pass (21 scored + 1 informational), with 0 flags and 0 hard fails. All 6,700 captured rolls recompute bit-for-bit from their `(serverSeed, clientSeed, nonce)` inputs, all 134 seed epochs were revealed and hash to their commitments, and every credited payout matches the two-stage 8-dp settlement rule exactly. "Pre-launch" means the bets were placed on LIQD's pre-production host `qa.liqd.com`; that `liqd.com` production serves the same build is not established.

**Scope:** Dice (`gameId` `originals-dice`) in USDC: a band `{lower, upper, inverted}` on a roll from 0.00 to 99.99, in the under, over, inside and outside modes, paying `9900 / basisPoints`. Theoretical RTP is **exactly 99.00% on every bet before 8-dp settlement rounding**, a flat 1.00% edge, under the half-open win rule observed on the operator's verifier and assumed for settlement; after rounding the RTP per bet spans 98.99999491%–99.00000520%. That each commitment existed before its bets is the auditor's capture record, not independently timestamped. Theoretical RTP is not a promise about an individual session's return.

## What was verified

| Check | Captured evidence |
|---|---|
| Roll reproduction | 6,700 of 6,700 rolls byte-identical from the revealed seeds; win flags 6,700 of 6,700. The RNG code, `src/rng.ts`, was rebuilt from a written specification ([docs/ALGORITHM.md](docs/ALGORITHM.md)) by an implementer who never opened LIQD's code; LIQD's verify endpoint (E13 replies and session-recorded vectors) is run as a second check, not used as the source |
| Seed records | 134/134 commitments match their reveals; 133/133 next-seed links; nonces 0–49 in every epoch |
| Payouts | 2,807 wins at the bit-exact `9900/basisPoints` multiplier, credited by `ROUND_HALF_EVEN_8(stake × ROUND_8(multiplier))`; 3,893 losses pay 0; wallet credits agree row for row |
| Edge | exactly 1.0000% on all 6,700 bets, a model identity resting on 2 discriminating verifier probes |
| Simulation evidence | 2,000,000-draw uniformity, a 200,000-roll serial screen, 9 edge bands and a 20,000,000-draw convergence series; 134 revealed seeds × 10,000 nonces cherry-pick screen |
| Observed return | 103.56% over the capture ($2,744.36 on $2,650.00), reported separately from theoretical RTP |

Two operator items are open: LIQD described its payouts as rounded down to 8 decimals, while 1,316 of the 2,807 winning credits are one unit (0.00000001) higher than round-down (reply pending); and a 9900× bet was accepted although LIQD's settings field reads 99. Nineteen declared limitations are in the [overview's limitations](MANIFEST.md#limitations-and-trust).

## Run the audit

Open a terminal in the package directory. Use **Node 22.x**, as declared in [.nvmrc](.nvmrc) and [package.json](package.json); other majors are refused.

```sh
npm ci
npm test
```

Expected: **118 unit tests pass; 22/22 steps pass · PROVABLY FAIR — Full Pass; REPRODUCED; release manifest OK; exit 0.** `npm test` runs the unit suite, the scored verification and `node scripts/release-manifest.mjs --check`. It replays every captured bet and scores the committed simulation; it does not regenerate it.

```sh
npm run test:full                 # regenerates the simulation from its pinned master seed, then verifies
npm run test:standalone           # node test.js && node verify.js: the same checks with nothing but Node
npm run check:standalone-build    # verify.js and test.js are what src/ and tests/ compile to
```

Exit 0 is a Full Pass, 2 a Conditional Pass (any FLAG), 5 RTP FIGURE OVERSTATED (the enforced RTP-CLAIM 1.2.0 rule finds the published RTP figure overstated; not a draw fail), 1 a FAIL or a reproduction beyond tolerance. Ordinary runs write only to `outputs/run/`; `npm run report` is the only command that rewrites the committed results. See [reproduction details](MANIFEST.md#reproduce-the-audit) for the comparison rules, the mutation battery and the tolerances.

## Verify a bet

After your seed epoch rotates, check that SHA-256 of the revealed server seed's hex text equals the commitment shown before the bet, compute the roll from the HMAC of `clientSeed:nonce:0`, apply the half-open win rule and recompute the credit. On a live bet, a credit equal to the exact amount rounded down to 8 decimals is LIQD's stated rule (open item F-ROUNDING), not a failed check; at a stake of $1 or less it is the measured credit or 0.00000001 below it. The [ProvablyFair.org LIQD verifier](https://audit.provablyfair.org/casino/liqd/tools/verify-bets) checks the commitment, roll, win and multiplier in the browser; it takes no stake, so check the credit with step 6 of the [complete instructions](MANIFEST.md#verify-a-bet), which give the six steps in LIQD's field names, a worked trace and a standalone Python checker.

## Files and evidence

There are two documentation files: this README and [MANIFEST.md — consolidated audit overview](MANIFEST.md). The overview contains the algorithm, RTP derivation, verification results, evidence register, limitations and release history.

- [Captured bets](data/dice-master-6700bets.json) — SHA-256 `ca1a181a9b4c89a1823e15fe71603b7a5e2267382c134873d80cba536d3aef34`. Dice has no paytable file; the multiplier is computed from the band.
- [Verification results](outputs/verification-results.json), [report figures](outputs/report-figures.json), [simulation results](outputs/simulation-results.json), [RTP claim table](outputs/rtp-claim-table.json) and [release manifest](RELEASE-MANIFEST.json).
- [Evidence images and records](evidence/), including the verifier boundary probes (E13) and the 9900× acceptance probe (E14).
- [Audit report](https://audit.provablyfair.org/casino/liqd/games/dice/overview) · [Public repository](https://github.com/ProvablyFair-org/liqd-dice) · [MIT license](LICENSE).

The release commit and tag are signed with the ProvablyFair.org release key (SSH, `SHA256:gEujiJm2pRyq7lQsfYQfQ1r97H/J7GdaKHbOW8GtikY`), which the release manifest records. The consolidation of the documentation is recorded in the [release history](MANIFEST.md#release-history).
