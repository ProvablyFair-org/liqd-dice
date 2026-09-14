# LIQD Dice Fairness Audit

**Auditor:** ProvablyFair.org  
**Game:** LIQD Dice (`originals-dice`) · **Currency:** USDC · **Package:** 1.0.0

**Audit result: PROVABLY FAIR — Full Pass for the recorded pre-production sample.**  
**Certification status: provisional, pending anonymous production validation.**

All **6,700 recorded rolls, win/loss outcomes and settlement amounts** match the independently reconstructed game model. All **134 revealed server seeds** match their recorded commitments. The model's theoretical RTP is **99% before settlement rounding**, under the documented uniform-roll and half-open win rules.

This is the completed initial audit of the session captured on **27 August 2026, 18:52:46–20:30:03 UTC**, against **`qa.liqd.com`**, using one authenticated account. The repository provides the dataset, reference implementation, worked examples and verification tools. Certification remains provisional because the public production environment has not yet been assessed; the production plan below defines that next stage.

## What the audit verifies

| Verified result | Evidence |
|---|---|
| **6,700 / 6,700 rolls and win/loss outcomes reproduce** from the revealed server seed, client seed, nonce and bet parameters. | Dataset; verification Steps 5–6 |
| **134 / 134 server-seed hashes match**, with **133 / 133 successive commitment links** and the pre-capture link reconciled. | Seed records; Steps 1–3 |
| **2,807 / 2,807 winning multipliers** match the derived payout formula; **6,700 / 6,700 settlement amounts** reconcile exactly. | Steps 7–10 and 20 |
| **Theoretical RTP is 99%**, before settlement rounding, for the documented model. Expected RTP after rounding spans **98.999994912%–99.000005204%** across the captured bands and stakes. | Mathematical derivation; Step 15; `outputs/report-figures.json` |
| **500 / 500 custom-client-seed bets reproduce**; changing the client seed changes the roll in **8 / 8 sensitivity checks**. | Step 14 |
| The recorded distribution and seed-selection statistics **pass the specified statistical tests**. | Steps 16–17; methodology §9 |
| **21 / 21 verification steps** and **116 unit tests** pass on the supported runtime. | Verification runner; unit suite |
| The dataset, simulation results and convergence chart match their **published SHA-256 pins**. Required report figures reconcile against recomputation. | Step 19 |

The [technical report](AUDIT_CONTEXT.md) maps these results to their artifacts, explains the calculations and documents the evidence supporting the model. Settlement amounts refer to the recorded response fields. Commitment-hash checks establish consistency; pre-bet timing and capture origin are auditor-attested. Statistical results describe the stated tests and their detection limits.

## What the audit excludes

- **Production and broader operating behavior:** other accounts, periods and deployments are outside this initial sample.
- **Infrastructure, security and custody:** server security, payments, withdrawals and account systems are outside scope. Actual wallet balance movements were not captured.
- **Independent authentication of origin and timing:** the package retains the auditor's capture record, without independent authentication that the responses came from LIQD or that commitments preceded their bets.
- **Unobserved settlement and RNG cases:** upper-bound settlement behavior, certain multiplier-rounding ties and rare RNG rejection paths are subject to the evidence and assumptions in the methodology.
- **Comprehensive limit enforcement:** maximum-odds rejection, maximum-profit limits and exposure caps were not established.
- **Universal statistical assurances:** the tests do not establish the absence of every bias or seed-selection strategy. The original simulation's random inputs were not retained, so verification rechecks its saved statistics rather than replaying that experiment exactly.

These boundaries define the assessment. The [scope and coverage register](AUDIT_CONTEXT.md#11-scope-and-coverage-register) gives the supporting detail, including which items can be addressed in production.

## Finding

**F-LIMITS — odds configuration discrepancy.** The recorded settings API reports `maxOdds: 99`, while the follow-up session record documents acceptance of a **9900×** bet on 1 September 2026. LIQD should align the setting with its intended meaning or document the distinction.

The probe bet lost: it establishes recorded acceptance, not a winning payment at 9900× or server rejection above it. The evidence is an auditor-attested session record; raw HTTP was not retained. This disclosure does not identify a payout mismatch in the 6,700-bet sample. See [the finding and evidence](AUDIT_CONTEXT.md#12-findings).

## Reproduce the verification

**Required runtime: Node.js 22.x. Validated on Node.js 22.23.1.** Run commands from the repository root. The standalone tools require no dependency installation, network access or casino credentials.

```sh
node test.js
node verify.js
```

Expected results: **116 tests pass**, followed by **21/21 verification steps passing** and `PROVABLY FAIR — Full Pass`. The verifier writes this run's reports to `outputs/run/` and preserves the published artifacts.

The TypeScript workflow is also available:

```sh
npm ci
npm test
npm run mutate
```

Dependency installation requires network access. `npm test` checks source-to-bundle parity, then runs the unit suite and verification. The separate mutation battery expects **36 detected changes and 3 declared survivors**, with **zero unexpected outcomes**. The survivors demonstrate documented coverage boundaries; their exact scope is described in [methodology §8](AUDIT_CONTEXT.md#8-tests-and-falsifiability).

| Command | Purpose | Files written |
|---|---|---|
| `node test.js` / `npx mocha` | Run the unit suite using the standalone or TypeScript path. | None |
| `node verify.js` / `npm run verify` | Verify the published dataset and artifacts. | Reports and comparison under `outputs/run/` |
| `npm test` | Check bundle parity, run `mocha`, then verify. | As above |
| `npm run typecheck` | Check TypeScript types without generating files. | None |
| `npm run build:standalone` | Rebuild both standalone tools from the included sources. | `test.js`, `verify.js` |
| `npm run check:standalone` | Fail if either standalone tool differs from a fresh local build. | None |
| `npm run mutate` | Exercise the declared changes in temporary copies. | Temporary test files; source tree preserved |
| `npm run report` | Generate replacement verification reports for review. | `outputs/verification-results.json` and `outputs/report-figures.json` |
| `npm run simulate` | Generate a new simulation sample. | Replaces `outputs/simulation-results.json` and `outputs/rtp-convergence.html` |
| `npm run test:full` | Run unit tests, generate a new simulation, then verify that fresh artifact. | Simulation files and run outputs |

Keep a separate copy when generating a new simulation. A fresh experiment produces different statistics; retain and investigate any failed run. The standalone files are generated from the included TypeScript sources. After `npm ci`, use `npm run check:standalone` to verify source-to-bundle parity, or `npm run build:standalone` to rebuild them. Both commands use the locked TypeScript dependency; no external audit framework is required.

## Artifact integrity

| Artifact | SHA-256 |
|---|---|
| `data/dice-master-6700bets.json` | `ca1a181a9b4c89a1823e15fe71603b7a5e2267382c134873d80cba536d3aef34` |
| `outputs/simulation-results.json` | `3da35d94342153d4f5345f5e8bdbc3cdfef5139bd752d3680898b35ffcbceebd` |
| `outputs/rtp-convergence.html` | `dadbd1859cff586eb42b96212d8d4271d578f9235d2a0bdbfe27d1dcf978f9be` |

For example, `shasum -a 256 data/dice-master-6700bets.json` checks the dataset's original bytes. These pins identify the evidence used by this release. The verifier checks them and separately checks the meaning and consistency of the data.

## Anonymous production validation

The next stage will assess the publicly available game through anonymous production play and publish a separately identified capture and its verification results. The plan includes:

- **Production sampling:** record the public environment, session context and available release identifiers; repeat outcome, commitment and settlement verification across the game modes and sampled stakes.
- **More complete capture records:** preserve request and response bodies before numeric conversion, keep failed and retried requests, and reconcile seed usage and bet history where operator records are available.
- **Client-seed sequencing:** use fresh unpredictable client seeds after receiving the relevant commitment, and retain the commitment, activation and reveal sequence for each epoch.
- **Targeted evidence:** seek actual wallet balance or ledger reconciliation, settled boundary and rounding cases, and evidence of odds and exposure-limit behavior.

Production sampling can resolve the current pre-production scope. Other exclusions close only when the required evidence is obtained: rare boundary outcomes may not occur, wallet and deployment records may require operator access, and independent origin or timing authentication requires a separate witness or signed evidence. Exact simulation replay is a separate analysis upgrade using retained simulation inputs.

**Final certification requires the anonymous production capture to be completed, reviewed and published with passing verification for its stated scope.** Remaining exclusions will be recorded explicitly. The [production validation plan](AUDIT_CONTEXT.md#13-production-validation-plan) maps each upgrade to the evidence needed for closure.

Licensed under [MIT](LICENSE).
