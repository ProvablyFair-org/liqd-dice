# LIQD Dice Technical Audit Report

This report presents the evidence, calculations and coverage behind the LIQD Dice fairness audit. It accompanies the [public summary](README.md), the recorded dataset and the executable verification tools.

**Result: PROVABLY FAIR — Full Pass for the recorded pre-production sample.** All 6,700 recorded rolls, win/loss outcomes and settlement amounts reconcile with the independently reconstructed model. **Certification remains provisional pending anonymous production validation.** The initial assessment is complete within the scope below; production validation is a separate stage with defined evidence requirements.

## 1. Assessment and scope

| Item | Audited scope |
|---|---|
| Auditor | ProvablyFair.org |
| Operator and game | LIQD Dice, `originals-dice` |
| Environment | `qa.liqd.com`, pre-production |
| Capture window | 27 August 2026, 18:52:46–20:30:03 UTC |
| Population | 6,700 bets; 134 seed epochs; 50 recorded bets per epoch |
| Account and currency | One authenticated account; USDC |
| Coverage | Under, over, inside and outside modes; stakes of $0.10 and $10.00 |
| Follow-up evidence | Verifier boundary probes on 31 August and an odds-acceptance probe on 1 September 2026 |
| Release | Package version 1.0.0; artifact identities in §10 |

The reference implementation was reconstructed from client behavior, the game client bundle, the operator's verification endpoint and captured results. It is an independent audit implementation. The repository does not contain the operator's backend source or establish which backend code was deployed.

The audit establishes reproducibility and settlement consistency for the recorded sample, derives the model's theoretical return, and evaluates the stated statistical checks. Origin and commitment chronology are auditor-attested. The present conclusion does not cover production deployments, actual wallet balance movements, infrastructure security, custody or behavior outside the sampled sessions. The [scope register](#11-scope-and-coverage-register) records the detailed boundaries.

## 2. Evidence and repository map

| Artifact | Role |
|---|---|
| `data/dice-master-6700bets.json` | Captured bet and seed records, plus capture metadata and local annotations |
| `src/rng.ts` | Commitment hashing, HMAC input encoding, draw generation and roll conversion |
| `src/config.ts` | Game model, payout and settlement calculations, population constants and artifact pins |
| `src/loader.ts`, `src/types.ts` | Dataset loading, identity checks and schema |
| `src/stats.ts`, `src/exact-chi2.ts` | Statistical calculations and exact discrete seed-screen reference distribution |
| `src/sim-checks.ts` | Simulation structure, return reconstruction and statistical acceptance checks |
| `src/simulate.ts`, `src/chart.ts` | Fresh simulation generation and convergence-chart rendering |
| `src/report-figures.ts`, `src/diff.ts` | Derived report figures and comparison with published results |
| `tests/verify.ts`, `tests/steps/` | The 21-step full-dataset verifier |
| `tests/dice/` | Unit tests and regression vectors |
| `tests/mutate.ts`, `tests/forgeries/`, mutation registries | Executable tests of failure detection and declared coverage boundaries |
| `verify.js`, `test.js` | Bundled verification and unit-test entry points requiring Node 22 only |
| `outputs/verification-results.json` | Saved verification results, runtime and artifact identities |
| `outputs/report-figures.json` | Dataset-derived figures, reconciled by Step 19 |
| `outputs/simulation-results.json` | Saved simulation summaries and per-seed analysis |
| `outputs/rtp-convergence.html` | Self-contained convergence chart generated from the saved series |
| `evidence/` | Screenshots and structured follow-up session records, inventoried in §14 |
| `capture/` | Capture reference code, client-seed sequencing and stable request identities for retries |
| `tools/build-standalone.mjs` | Deterministic local build and source-to-bundle comparison |

Evidence is distinguished by origin:

- **Response:** values recorded from an operator response. Numeric fields may have been converted from decimal strings to JavaScript numbers before storage.
- **Request:** parameters sent by the capture client.
- **Cached state:** commitment or client-seed information carried forward from an active-seed or rotation response.
- **Capture annotation:** locally calculated values and capture bookkeeping.
- **Recomputed result:** a result calculated from the retained inputs by the verifier.
- **Session attestation:** an observation recorded by the auditor, without an independently authenticated transcript.

These distinctions make the evidence traceable without treating request fields or local annotations as operator responses. Cryptographic consistency, statistical consistency and independently authenticated origin are separate properties.

## 3. Dataset and provenance

The dataset contains `meta`, `seeds` and `bets`. Each bet joins to its revealed seed by `epoch` and `hashedServerSeed`; `src/loader.ts` builds the indexes. All 134 server seeds are present and revealed.

### Population

| Quantity | Result | Derivation |
|---|---|---|
| Bets and seed epochs | 6,700 / 134 | Lengths of `bets` and `seeds` |
| Wins and losses | 2,807 / 3,893 | Recorded `win` flags |
| Recorded nonces per epoch | 0–49, each present once | Group bets by epoch |
| Phases A / B / C / D | 5,000 / 1,000 / 200 / 500 bets | Recorded phase labels |
| Modes under / over / inside / outside | 1,362 / 2,592 / 1,360 / 1,386 bets | Classify `params` |
| Client seeds | 134 distinct; 10 custom `pfaudit-` seeds | Distinct recorded `clientSeed` values |
| Stakes | $0.10 and $10.00 | Recorded bet amounts |
| Total staked / returned | $2,650.00 / $2,744.36236730 | Decimal sums of stake and reported payout |
| Roll range | 0.00–99.99 | Minimum and maximum recorded roll |
| Winning multiplier range | 1.0105134224762682–99 | Minimum and maximum over recorded wins |
| Distinct bands / win-chance values | 5,304 / 4,176 | Distinct parameters / derived basis-point counts |

Phase A samples all four modes. Phase B contains 500 bets on `over(98)` and 500 on `over(99)`, at $0.10. Phase C contains 200 bets on `over(50)` at $10.00. Phase D contains 500 bets across ten custom client seeds. Population checks compare the dataset against the constants in `src/config.ts`, including the phase counts and 50-bet epoch size.

### Field origins

| Field | Origin and interpretation |
|---|---|
| `id`, `nonce`, `serverSeedId`, `win`, `result` | Response fields; nonce is taken from the consumed-nonce or available response nonce field. |
| `params` | The requested `{lower, upper, inverted}` band. |
| `roll`, `multiplier`, `betAmount`, `winningAmount` | Response values stored after numeric conversion. Original decimal text is not retained in this dataset. |
| `clientSeed` | Response value where available, otherwise cached seed state. The per-row source was not recorded. |
| `hashedServerSeed` | Commitment cached from the active-seed or rotation response that opened the epoch. |
| `stakeWallet`, `winningAmountWallet` | Wallet-denominated amounts in the settlement response; both are present and checked on all 6,700 bets. |
| `serverSeed`, `nextHashedServerSeed` in seed records | Revealed seed and next-seed commitment recorded through the seed lifecycle. |
| `nonceStart`, `nonceEnd` | `nonceStart` is 0 in all seed records and can reflect the capture fallback; `nonceEnd` is the last recorded nonce. These do not constitute an operator-certified total bet count. |
| `localRoll`, `localWin`, `verified`, `creditedOk`, `modelMultiplier`, `multOk`, `walletOk`, `commitVerified`, `chainLinkOk` | Capture-side calculations. Verification derives its own results from the inputs. |
| `balanceOk` | Null on all 6,700 bets; no actual before/after wallet balances were captured. |
| `epoch`, `phase`, `at`, other capture metadata | Capture-client bookkeeping and timestamps. |

The capture applied zero defaults when multiplier or winning-amount fields were absent. Consequently, a stored zero alone cannot distinguish an explicit operator zero from that fallback. Every recorded row nevertheless reconciles with the model. The retained data is preserved as captured.

`meta.edgeScan` and local self-check flags are annotations, not the audit's findings; scored verification does not rely on their results. In particular, `meta.edgeScan` uses a different band calculation and is not a source for the reported RTP. `meta.limits.maxOdds: 99` is the recorded configuration value addressed by F-LIMITS. House-edge labels in metadata are not inputs to the independent RTP derivation.

The commitment checks reproduce the relationships between revealed seeds, recorded hashes and successive links. The capture record places commitment receipt before the associated bets. Independent authentication of that chronology or of the dataset's origin is outside this package's evidence (L9, L18).

## 4. Outcome algorithm

### Commitment

```text
hashedServerSeed = SHA256(UTF8(serverSeedHexString))
```

Commitment hashing uses the UTF-8 bytes of the server seed's hexadecimal string. HMAC generation below instead uses the hex-decoded seed bytes. All 134 revealed seeds match the stored commitment convention.

### Draw generation

```text
key      = hex_decode(serverSeed)
cursor   = 0
message  = UTF8(clientSeed + ":" + nonce + ":" + cursor)
digest   = HMAC_SHA256(key, message)
maxFair  = floor(2^32 / 10000) * 10000 = 4294960000

Read digest as eight successive unsigned 32-bit big-endian integers.
Accept the first integer x with x < maxFair.
draw = x % 10000
roll = draw / 100

If all eight integers are rejected, repeat with cursor increased by 1000000.
```

`src/rng.ts` implements this procedure. Each bet uses one draw, giving a roll from 0.00 to 99.99. All 6,700 recorded rolls reproduce exactly.

Under the uniform-digest model, rejection removes the unequal remainder introduced by reducing a 32-bit value modulo 10,000. The rejection probability per chunk is `7296 / 4294967296`, approximately `1.7 × 10^-6`. No captured bet exercises the first-chunk rejection path. Unit vectors exercise the reference implementation's rejection branch; operator-side rejection and the all-chunks-rejected fallback remain unobserved cases (L11).

### Win rule

```text
inBand = roll >= lower AND roll < upper
win    = inverted ? NOT inBand : inBand
```

The model includes the lower bound and excludes the upper bound. Inversion takes the exact complement. This rule reproduces every recorded win/loss flag.

Two captured bets land on a lower bound; none lands on an upper bound. The upper-exclusive model is supported by the E13 verifier-endpoint session record: two of seven probes distinguish it from an inclusive-upper-bound model. E13 includes one interior settled-bet cross-check. Its raw HTTP was not retained, and no settled upper-bound case is available. Applying the endpoint's upper-bound behavior to settlement is therefore a stated model premise (L2, L14).

## 5. Payouts and RTP

Dice uses a payout formula rather than a multiplier-table file.

For two-decimal band bounds, let `W` be the continuous winning width in percentage points:

```text
W = inverted ? 100 - (upper - lower) : upper - lower
b = round(100 * W)
m = 9900 / b
```

Here `b` is the audit's derived basis-point count, not a field returned by the operator. The binary64 quotient `9900 / b` equals the recorded multiplier on all 2,807 wins. This establishes agreement with the quotient calculation for the sample; it does not establish the operator's internal data representation.

The verifier counts winning grid points independently of the served multiplier. Under the half-open rule, `b` of the 10,000 equally likely grid points win. Therefore:

```text
P(win) = b / 10000
RTP    = P(win) * m
       = (b / 10000) * (9900 / b)
       = 9900 / 10000
       = 0.99
Edge   = 1 - RTP = 0.01
```

This is an analytical result conditional on the documented uniform-roll and win-rule model, before settlement rounding or any untested payout cap. It holds across the model's four modes and does not depend on the stake. Step 15 checks the identity in exact integer arithmetic on the captured bets. Unit tests exercise 59,998 bands, and Step 13 compares the closed-form win count with a literal 10,000-point enumeration for the 5,304 distinct captured bands.

### Settlement arithmetic

The captured credit follows a two-stage rule:

```text
roundedMultiplier = round_to_8_decimal_places(m)
credit = round_half_even_to_8_decimal_places(stake * roundedMultiplier)
loss credit = 0
```

The implementation models stage 1 using `Math.round` on the positive multiplier scaled by `1e8`; stage 2 uses exact integer arithmetic on `1e-8` units. The rule reproduces all recorded settlement amounts with zero tolerance. Stage-2 half-even rounding is supported by 274 exact ties in the winning sample. Stage-1 tie behavior is assumed: no captured band distinguishes half-up from half-even at that stage (L6).

The served multiplier uses the quotient calculation. The function `quotedMultiplier` also expresses the continuous formula `(100 / W) * (1 - HOUSE_EDGE)`; binary64 evaluation of those expressions need not be identical. Step 7 compares the served field with `9900 / b`; Step 20 derives the multiplier from the band before reconstructing the credit.

### Interpreting the return figures

| Measure | Result | Meaning |
|---|---|---|
| Theoretical RTP before rounding | Exactly 99% | Analytical expectation under the stated model |
| Expected RTP with rounded settlement | 98.999994912%–99.000005204% | Range over the captured band/stake combinations, calculated using winning credit and win probability |
| Observed sample RTP | 103.560844% | Recorded return divided by recorded stake for this finite, mixed-band sample |

Expected rounded RTP is below 99% for 2,742 captured band/stake combinations, above it for 2,687 and exactly equal for 1,271. This calculation is distinct from the realized win or loss of each bet.

Across the 2,807 winning payments, comparison with the exact unrounded rational product gives 1,341 downward rounding adjustments, 1,316 upward adjustments and 150 exact products. The maximum absolute adjustment is approximately `5.49818342e-9` USDC. The derived figures are in `outputs/report-figures.json` and are checked by Step 19.

The observed sample return is $2,744.36236730 on $2,650.00 staked. It illustrates sampling variation and is not the basis for the 99% theoretical conclusion. Wallet-denominated response fields are reconciled, but actual wallet balances were not recorded (L5).

## 6. Worked recomputations

The following examples were **EXECUTED** using a separate Python standard-library implementation of the commitment hash, HMAC draw, win rule and exact rational settlement calculation. It imports no repository implementation. The sample spans all four modes, all four phases and both stakes. Each recorded commitment, roll, win flag, multiplier and payout agrees with recomputation.

| Dataset index | Bet ID | Epoch / nonce | Phase / mode | Roll: computed = recorded | Win | Credit: computed = recorded | Commitment |
|---|---|---|---|---|---|---|---|
| 0 | `kzLjSr11zq5GvEOHlj9n6` | 0 / 0 | A / under | 24.01 | Yes | 0.10717766 | Match |
| 1 | `u92Iz5CNgcF1YVGfGqSWk` | 0 / 1 | A / under | 89.38 | No | 0.00000000 | Match |
| 351 | `zyObJhhfD14z_jEHFqMGz` | 7 / 1 | A / under | 61.02 | Yes | 0.14932127 | Match |
| 1859 | `Cph95sH2FTbhETy5TzqZa` | 37 / 9 | A / inside | 90.22 | Yes | 0.18750000 | Match |
| 2851 | `-iO4PEew_M_4DWvcYa3IE` | 57 / 1 | A / outside | 79.87 | Yes | 0.15355980 | Match |
| 5063 | `F8Q46TKe6PuPFcBL9Fs8F` | 101 / 13 | B / over | 98.76 | Yes | 4.95000000 | Match |
| 5697 | `RbGgV6toJS-1CgkkJI0vC` | 113 / 47 | B / over | 99.00 | Yes | 9.90000000 | Match |
| 6050 | `_z-KmLfzKpOoKmPufqIoj` | 121 / 0 | C / over | 66.58 | Yes | 19.80000000 | Match |
| 6506 | `6pZa2zXOWvuOQoA6Md_zu` | 130 / 6 | D / over | 85.19 | Yes | 0.30764450 | Match |

### Complete trace for the first bet

```text
Bet ID:       kzLjSr11zq5GvEOHlj9n6
Epoch/nonce:  0 / 0
Server seed:  015307d5a3f62db476210c3797bac8b7
Client seed:  auditf2456fc140ac
SHA256 UTF8:  918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8
Stored hash:  918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8
HMAC message: auditf2456fc140ac:0:0
HMAC digest:  475461d14638cca3e385e940e763bf808fa6ef6c05f1a83c333dc25e586c5b6e
First chunk:  0x475461d1 = 1196712401 < 4294960000
Draw:         1196712401 % 10000 = 2401
Roll:         2401 / 100 = 24.01
Band:         [0, 92.37), not inverted
Outcome:      0 <= 24.01 < 92.37, so win
Multiplier:   9900 / 9237 = 1.071776550828191 as binary64
Stage 1:      1.07177655
Stake:        0.10 USDC
Product:      0.107177655
Stage 2:      0.10717766, using half-even at the exact tie
Recorded:     roll 24.01, win true, winningAmount 0.10717766
```

### Independent sample checker

Run this Python 3 code from the repository root. It reads only the dataset and checks the nine listed examples. Its rational settlement calculation provides an independent comparison for the captured values.

```python
import hashlib, hmac, json, struct
from fractions import Fraction
from pathlib import Path

data = json.loads(Path("data/dice-master-6700bets.json").read_text())
seeds = {s["epoch"]: s for s in data["seeds"]}
indices = [0, 1, 351, 1859, 2851, 5063, 5697, 6050, 6506]

def draw(seed, client, nonce):
    cursor = 0
    while True:
        message = f"{client}:{nonce}:{cursor}".encode()
        digest = hmac.new(bytes.fromhex(seed), message, hashlib.sha256).digest()
        for chunk in struct.unpack(">8I", digest):
            if chunk < 4294960000:
                return (chunk % 10000) / 100
        cursor += 1000000

def round_half_up(value):
    return (2 * value.numerator + value.denominator) // (2 * value.denominator)

def round_half_even(value):
    q, r = divmod(value.numerator, value.denominator)
    return q + int(2*r > value.denominator or
                   (2*r == value.denominator and q % 2 == 1))

for index in indices:
    bet = data["bets"][index]
    seed = seeds[bet["epoch"]]
    commitment = hashlib.sha256(seed["serverSeed"].encode()).hexdigest()
    assert commitment == seed["hashedServerSeed"] == bet["hashedServerSeed"]
    roll = draw(seed["serverSeed"], bet["clientSeed"], bet["nonce"])
    p = bet["params"]
    inside = p["lower"] <= roll < p["upper"]
    won = not inside if p["inverted"] else inside
    width = Fraction(str(p["upper"])) - Fraction(str(p["lower"]))
    b = (100 - width if p["inverted"] else width) * 100
    assert b.denominator == 1
    multiplier = Fraction(9900, int(b))
    multiplier_units = round_half_up(multiplier * 10**8)
    credit_units = round_half_even(Fraction(str(bet["betAmount"])) * multiplier_units)
    credit = Fraction(credit_units, 10**8) if won else Fraction(0)
    assert roll == bet["roll"] and won == bet["win"]
    assert (float(multiplier) if won else 0) == bet["multiplier"]
    assert credit == Fraction(str(bet["winningAmount"]))
    print(bet["id"], "commitment PASS", "roll", roll, "win", won,
          "credit", f"{float(credit):.8f}")
```

These are checks of the recorded values. Their hash matches do not independently authenticate when the commitments were received. Any other bet can be checked by selecting its dataset index and joining to the revealed seed in the same way.

## 7. Claim and verification map

The table maps the scored claims to their supporting artifacts. **EXECUTED** means the check was run while validating this release. The verdict is agreement with the stated claim and scope. Session provenance, model assumptions and future actions are addressed separately rather than being counted as failed computations.

| Claim | Supporting artifact | Method | Verdict | Notes |
|---|---|---|---|---|
| 134 revealed seeds match recorded commitments. | `seeds[]`; `src/rng.ts`; Step 1 | EXECUTED | HOLDS | SHA-256 of UTF-8 seed strings; 0 mismatches. |
| 133 successive links and the pre-capture link reconcile. | `seeds[]`, `meta.preCapture`; Step 2 | EXECUTED | HOLDS | Value relationships; pre-bet timing is attested. |
| Commitments are consistent across each recorded epoch. | Bet/seed join; Step 3 | EXECUTED | HOLDS | 134 epochs. |
| Recorded nonces are contiguous and unique within each epoch. | `bets[]`, `seeds[]`; Step 4 | EXECUTED | HOLDS | 50 nonces, 0–49; completeness relative to the captured population. |
| All recorded rolls reproduce. | `src/rng.ts`; Step 5; independent calculation in §6 | EXECUTED | HOLDS | 6,700 exact matches. |
| The modeled win rule reproduces all outcomes. | `src/config.ts`; Step 6 | EXECUTED | HOLDS | 6,700 matches; boundary premise in §4. |
| Winning multipliers match the quotient formula. | `payoutBasisPoints`; Step 7 | EXECUTED | HOLDS | 2,807 exact binary64 matches to `9900 / b`. |
| Recorded payouts follow the two-stage settlement rule. | `settledCreditUnits`; Step 8 | EXECUTED | HOLDS | All 6,700 payouts; rounding figures in §5. |
| Losses have zero multiplier and zero payout. | Step 9; recorded amounts | EXECUTED | HOLDS | 3,893 losses. |
| Wallet response fields reconcile and observed multipliers fall within the configured audit bounds. | Step 10 | EXECUTED | HOLDS | Response fields only; actual balances and the true maximum remain outside scope. |
| Dataset identity and population match the published specification. | SHA-256 pin; population constants; Step 11 | EXECUTED | HOLDS | 6,700 bets, 134 revealed seeds and 50 bets per epoch. |
| All planned phases, modes and sampled stakes are represented. | Step 12 | EXECUTED | HOLDS | Counts in §3. |
| Literal grid enumeration agrees with the win-count formula; a corrupted roll fails the matching predicate. | Step 13; `tests/steps/anti-circularity.ts` | EXECUTED | HOLDS | 5,304 distinct bands, 0 enumeration disagreements. |
| Custom client-seed inputs reproduce and affect the roll. | Step 14 | EXECUTED | HOLDS | 500 matches; 8/8 sensitivity cases change. |
| The model's theoretical edge is exactly 1%. | Integer identity in Step 15; §5 derivation | EXECUTED | HOLDS | Conditional analytical result; separate from empirical RTP. |
| Saved Pass-1 statistics meet their structural and statistical checks. | `outputs/simulation-results.json`; Step 16 | EXECUTED | HOLDS | Re-scoring saved summaries; original random inputs unavailable. |
| Pass-2 statistics reproduce from the seed records and meet the specified screens. | `src/exact-chi2.ts`; Step 17 | EXECUTED | HOLDS | 134 seed rows; 10 flags; p approximately 0.070837 at α = 0.01. |
| The $10 phase uses the same outcome calculation as the $0.10 phases. | Step 18; RNG function signature | EXECUTED | HOLDS | 200 Phase-C matches; finite sampled-stake coverage. |
| Published artifact pins match and report figures reconcile. | Step 19; §10 identities | EXECUTED | HOLDS | Dataset, simulation, chart and required report figures. |
| Settlement can be reconstructed without using the served multiplier as its input. | Step 20 | EXECUTED | HOLDS | 6,700 matches from the band, stake and recomputed outcome. |
| The modeled multiplier decreases with increasing win chance. | Step 21 | EXECUTED | HOLDS | 4,176 distinct win-chance values; 0 inversions. |
| Unit tests and the scored verifier pass. | `tests/dice/`; `tests/verify.ts`; standalone entry points | EXECUTED | HOLDS | 116 unit tests and 21/21 scored steps on Node 22.23.1. |
| The declared mutation battery behaves as specified. | Three registries; `tests/mutate.ts` | EXECUTED | HOLDS | 36 rejected changes, 3 declared survivors, 0 unexpected outcomes. |

Additional figures in §§3, 5 and 9 come from the named dataset fields, `outputs/report-figures.json` or `outputs/simulation-results.json`. The report-figure artifact is reconciled by Step 19; Pass-1 raw statistics have the replay boundary described in §9. Follow-up session records are identified as attestations in §14. The production plan describes future work and does not assert completed observations.

**Items outside independent repository verification:** the real-world origin of the capture and the pre-bet timing of commitments are auditor-attested (**STATICALLY TRACED; CANNOT VERIFY FROM REPO**). Production deployment, actual wallet balance movement and unobserved operator branches are excluded from the present findings. Their absence is a scope boundary rather than a failed calculation; §11 states what further evidence is needed.

## 8. Tests and falsifiability

The unit suite contains **116 tests**: RNG 18, settlement 21, simulation checks 32, statistics 12, exact-null calculations 9, client-seed sequencing 8, artifact handling 5, runtime checks 4, capture retries 4 and pre-capture commitments 3. The retry tests simulate a response lost after settlement and confirm reuse of the same request identity; they also check distinct identities for separate bets, stable parameters and rejection of non-transient errors. Commitment tests reject missing or altered pre-capture records. These are local tests and do not assert production execution. The full-dataset verifier adds 21 scored steps. Both the TypeScript and standalone unit paths pass all 116 tests on Node 22.23.1.

The mutation battery is separate from `npm test`. It runs **31 direct changes and 5 structural forgeries** that must be rejected, plus **3 declared survivors**. `tests/mutate.ts` works in temporary copies, checks the expected failure location and re-pins modified artifacts where needed to exercise semantic checks beyond byte integrity. The observed result is 36 rejected changes, 3 expected survivors and no unexpected outcomes.

### Examples of failures the suite detects

| Change in a disposable copy | Expected result | Guard |
|---|---|---|
| Change `HOUSE_EDGE` from `0.01` to `0.02`. | Verification exits nonzero; Step 7 fails. | Captured multipliers disagree with the new payout numerator. |
| Change the first recorded roll from `24.01` to `24.02`. | Dataset hash check rejects the changed file. If the copy's dataset pin is also updated, Step 5 fails. | Independent roll recomputation. |
| Delete, corrupt or alter required report figures. | Step 19 fails. | Required artifact structure and field-by-field reconciliation. |
| Set the first convergence standard error to `123456`, then re-pin the simulation. | Step 16 fails. | Recomputed standard error. |
| Set `over(98)` simulated RTP to `0.99000495`, recompute its derived fields and re-pin it. | Step 16 fails. | This implies 40,000.2 wins at 49.5× over 2,000,000 bets; it fails return reconstruction. |
| Use the valid nearby result of 40,000 wins at 49.5× over 2,000,000 bets. | The exact 99% RTP result is accepted when the other fields agree. | Valid outcomes at theoretical expectation are permitted. |

The full registry also exercises coherent population changes and multiple forms of malformed report data. It tests whether the intended guard responds, rather than treating a changed overall verdict alone as sufficient.

### Declared survivors

| Change | Verification coverage |
|---|---|
| Change stage-1 rounding from half-up to half-even. | Survives scored verification because the captured bands do not distinguish those modes (L6). |
| Remove the RNG rejection guard. | Survives scored dataset verification because no captured draw needs the guard. The unit suite rejects it through a constructed rejection vector (L11). |
| Raise the audit maximum-odds constant above the captured range. | Survives because captured winning multipliers do not exceed 99×. This cannot establish the true server ceiling (L7). |

These results describe the suite's measured coverage. The reference model and its tests share assumptions about game behavior; the endpoint evidence and captured settlements provide the external observations supporting those assumptions. Literal grid enumeration and settlement reconstruction supply additional independent calculation paths.

## 9. Statistical analysis

Statistical checks supplement deterministic verification. A pass means the recorded statistics do not reject the specified null under the stated tests. It does not establish universal absence of bias, dependence or seed selection.

### Pass 1: reference-model simulation

| Check | Saved sample and result |
|---|---|
| Draw uniformity | 2,000,000 draws; 100 bins; χ² = 91.8279, df = 99, p approximately 0.682558 |
| Serial analysis | 200,000-draw prefix; lag-1 z approximately 1.208148; runs p approximately 0.128428 |
| Effective-edge bands | Nine named bands at 2,000,000 bets each; all within their `5 × SE + 0.0001` bands |
| RTP convergence | Seven checkpoints ending at 20,000,000 bets; final RTP approximately 98.976983%, about 1.0398 standard errors from 99% |

Step 16 checks sample depths, band identities, derived probabilities, standard errors, cumulative win counts and the convergence endpoint. The nine bands and checkpoint sizes are declared in `src/config.ts`.

The published artifact is read as **schema 1**, which does not store the simulation's integer win counts or the runs-test cell counts. Candidate win counts are recovered and checked against the producer's repeated-addition return. All nine band returns and all seven convergence values match that reconstruction exactly. For alternative arithmetic accumulation, the implementation also permits a bounded floating-point residual under the numerical policy in `src/sim-checks.ts`; downstream derived-field comparisons are exact on the supported runtime.

The convergence standard error is recomputed using empirical `p = wins / n`:

```text
variance = p * (multiplier - RTP)^2 + (1 - p) * (0 - RTP)^2
SE       = sqrt(variance / n)
```

Effective-edge rows use their model win probabilities. The runs p-value is recomputed from the stored runs z-score; schema 1 lacks the cell counts needed to reconstruct that z-score itself. The stored `pass1.serial.zCritical` value is not the applied threshold. The verifier derives the current threshold from `ALPHA_SCREEN`, approximately **2.9351994688667054**, using the implementation in `src/stats.ts`.

The original random seed stream was not retained. Consequently, the raw Pass-1 statistics cannot be regenerated from the published inputs; their structural and statistical consistency can be verified. A coherent alternative summary could also pass these checks. `npm run simulate` produces a new experiment. The producer emits schema 2 with additional counts; it does not reconstruct the original sample (L1, L10).

### Pass 2: revealed-seed analysis

All 134 per-seed early and late window statistics are recomputed from the revealed server seeds and recorded client seeds. Each window contains 50 draws in 20 bins. The early window covers nonces 0–49; the comparison window covers nonces 50–99 generated from the revealed inputs. The latter are modeled continuations, not additional captured bets.

The exact discrete null is enumerated from 181,274 occupancy partitions, giving 832 attainable statistic values. The achieved per-window rejection probability is approximately **0.0459237601** at the nominal 0.05 threshold. The resulting null flag probability is approximately **0.0438147684**.

There are **10 flagged epochs**: 6, 9, 34, 35, 45, 54, 79, 104, 113 and 123. The null expectation is approximately **5.87118**. The exact binomial tail for at least ten flags is approximately **0.0708371**, above the rejection threshold of **0.01**. At this sample size, **13 flags** are needed to reject. These per-seed flags are inputs to the statistical test; the overall verifier reports zero step-level flags.

The pooled 6,700 recorded rolls also pass their uniformity screen: χ² approximately **92.208955**, df = 99, p approximately **0.672361**. These values can be recomputed from the captured rolls. The seed-selection screen is sensitive to its defined early/late uniformity pattern; selection based on player return can escape that pattern (L4).

### Thresholds and interpretation

| Scored statistical group | Nominal threshold or allowance |
|---|---|
| Pass-1 uniformity, lag-1 and runs screens | Each uses α/3 with α = 0.01; Bonferroni covers these three screens. Uniformity uses both tails. |
| Nine effective-edge bands | Each uses `5 × SE + 0.0001`. |
| Final convergence point | Uses `5 × SE + 0.0001`. |
| Seed-selection flag count | Exact binomial upper tail at α = 0.01. |
| Pooled recorded-roll uniformity | Upper-tail χ² screen at α = 0.01. |

Step 16's combined nominal bound is approximately **0.0100057**. Across Steps 16–17 it is approximately **0.0300**. These combine the stated reference-distribution allowances; the χ² and normal components are asymptotic approximations. They are **not measured finite-sample failure frequencies**, and the three-screen 1% bound does not describe the whole of Step 16. Deterministic identity and reconciliation checks are separate from these statistical allowances.

Fresh experiments should use a predefined reporting plan that retains all outcomes. A failed regenerated run should be preserved and investigated; a subsequent fresh pass does not explain the earlier failure.

### Client-seed control

Phases A–C use 124 distinct client seeds with 48 bits of fresh cryptographic random material per epoch, as described by the capture procedure. Phase D uses ten timestamp-based custom seeds. Those ten demonstrate player input and reproducibility, but do not demonstrate protection against pre-evaluation using an unpredictable client seed.

The future-capture chooser in `capture/client-seed.reference.mjs` requires a commitment before drawing at least 128 bits of fresh random material. Its ordering is tested with injected dependencies. Production capture will need to record its actual use and verify activation against the prior commitment; the presence of the helper alone is not evidence of an executed production sequence.

## 10. Reproduction and artifact identity

Run commands from the repository root using **Node.js 22.x**. Validation for this document pair used **Node.js 22.23.1**. Other major versions are refused. The runtime restriction keeps the exact statistical comparisons within the supported environment (L17).

```sh
# No dependency installation needed
node test.js
node verify.js

# TypeScript workflow; installation needs network access
npm ci
npm test
npm run mutate
```

Expected results are 116 passing unit tests, 21/21 passing verification steps and 36 detected mutations with three declared survivors. `npm test` runs `npm run check:standalone && mocha && npm run verify`; it does not run the mutation battery or generate a new simulation.

`node verify.js` and `npm run verify` write only this run's verification report, report figures and comparison under `outputs/run/`. Published evidence remains unchanged. Required report figures must be present, parseable, structurally complete and equal to recomputation. A missing or malformed artifact produces a failure on repeated runs as well as the first run.

`npm run report` explicitly writes replacement verification and report-figure artifacts. `npm run simulate` replaces the simulation results and chart with a fresh sample. `npm run test:full` runs unit tests, simulation generation and verification with `SIM_FRESH=1`, so it records the fresh simulation identity rather than enforcing the published simulation pin. The dataset identity remains pinned. The [README command table](README.md#reproduce-the-verification) describes the outputs of each workflow.

| Artifact | SHA-256 |
|---|---|
| `data/dice-master-6700bets.json` | `ca1a181a9b4c89a1823e15fe71603b7a5e2267382c134873d80cba536d3aef34` |
| `outputs/simulation-results.json` | `3da35d94342153d4f5345f5e8bdbc3cdfef5139bd752d3680898b35ffcbceebd` |
| `outputs/rtp-convergence.html` | `dadbd1859cff586eb42b96212d8d4271d578f9235d2a0bdbfe27d1dcf978f9be` |

The pins cover original file bytes. The saved verification and report-figure files record their own generation times; those files are the source for run metadata. `outputs/report-figures.json` is checked against a fresh derivation from the pinned inputs rather than against a fixed document hash. Its values include settled RTP, rounding effects, boundary coverage, seed-screen power and observed returns.

The executable workflow needs no casino credentials. Capture reference scripts are separate from verification and are not required to reproduce this audit. The standalone tools are generated from the included TypeScript sources. After `npm ci`, `npm run build:standalone` rebuilds both tools locally, and `npm run check:standalone` fails if a committed bundle differs from that build. `npm run typecheck` checks the sources without writing files. The builder typechecks before producing either bundle. No external audit framework is required.

## 11. Scope and coverage register

The following identifiers provide stable references for the verifier's scope notes. They distinguish observed behavior, model premises, excluded systems and reproduction requirements. Production validation can extend coverage where the required evidence is collected; it does not change the results already established for the recorded sample.

| ID | Current evidence and boundary | How the next stage can address it |
|---|---|---|
| **L1 — Simulation replay** | Saved Pass-1 statistics pass structural and statistical checks. The original random seed stream and some raw counts were not retained, so the original experiment cannot be replayed exactly. | A separately identified simulation retaining the input stream or a deterministic generation recipe. This is an analysis upgrade, not a live-bet requirement. |
| **L2 — Upper-bound settlement** | The half-open model matches all 6,700 outcomes and the E13 endpoint record. No captured settlement lands on an upper bound. | Target actual upper-bound settlements, with full requests, responses and seed reveals. A verifier-only probe does not close settlement coverage. |
| **L3 — Theoretical RTP** | The 99% RTP is an analytical result under the model, before rounding and untested caps. | Retain the analytical conclusion; production evidence can validate more of its behavioral premises. |
| **L4 — Seed-selection detection** | The defined screen passes: 10 flags, p approximately 0.070837 at α = 0.01. It has finite power and does not cover every return-based selection strategy. | Use unpredictable client seeds after commitment and a sampling plan with stated power for specified selection strategies. Universal absence remains outside a finite audit. |
| **L5 — Actual wallet balances** | All wallet-denominated response amounts reconcile. Before/after balances were not recorded. | Capture attributable balance changes or linked wallet-ledger entries, including any other balance adjustments. |
| **L6 — Stage-1 rounding ties** | The settlement rule matches all recorded payouts. No captured band distinguishes stage-1 half-up from half-even. | Seek a winning 61.44% band at a $1 stake: `9900/6144 = 1.611328125`, giving different eight-decimal credits under the two modes. |
| **L7 — Odds and exposure limits** | Captured winning multipliers reach 99×. E14 records acceptance at 9900×, without a win. Server rejection above that value and exposure-cap behavior are untested. | Record acceptance, relevant wins, invalid-input responses and exposure rules. Each observation closes only the behavior it exercises. |
| **L8 — Internal payout representation** | The audit-derived quotient matches all 2,807 winning multipliers. `basisPoints` is not an operator field in the dataset. | An operator specification or implementation review can corroborate internal representation. Sample payout agreement is already independently checkable. |
| **L9 — Capture origin** | Origin is supported by the auditor's capture record and metadata, without independent authentication. | Preserve complete exchanges; independent witnessing or authenticated operator signatures can strengthen public verification of origin. Locally stored transcripts alone remain auditor evidence. |
| **L10 — Simulation schema** | The published schema-1 artifact is checked under schema-1 rules. The verifier derives its applied threshold rather than using the stored `serial.zCritical` field. | Publish a separately identified replayable experiment with complete counts and current schema. |
| **L11 — Rare RNG paths** | All captured rolls match. The reference rejection branch is unit-tested; no captured draw exercises it, and the all-chunks-rejected fallback is unobserved. | Retain any naturally occurring rejection cases or obtain implementation evidence tied to the deployed code. A separate verifier or laboratory implementation does not establish live execution. |
| **L12 — Production environment** | The entire captured population is pre-production. | Anonymous capture on the public production environment, followed by published verification. This is the condition behind provisional certification. |
| **L13 — Completeness beyond the record** | Recorded nonces are complete within the declared 50-bet epochs. Start values may reflect capture defaults; no operator total-use counter was retained. | Reconcile every request, timeout and retry against operator bet history, seed-use counts and wallet records where available. |
| **L14 — Endpoint and settlement boundary parity** | E13 cross-checks an interior settled bet. No settled upper-bound case links the endpoint's boundary behavior to settlement. | Collect the same settlement boundary evidence as L2 and cross-check it against the verifier for the same deployed period. |
| **L15 — Accounts and periods** | One account and one capture window. | Sample additional sessions and, where included in the engagement, additional accounts. Conclusions remain bounded by that sample. |
| **L16 — Report derivation** | Report figures are recomputed from the pinned inputs and checked in the verifier process. The required file must be present and match. | Maintain separate input artifacts and run outputs. Independent calculation provides additional corroboration; no live capture is needed for this software property. |
| **L17 — Runtime** | Node 22.x is required; validation used 22.23.1. Exact statistical calculations can depend on runtime behavior. | Retain the supported environment or validate additional runtimes separately. This is a reproduction requirement. |
| **L18 — Commitment timing** | Matching hashes and links establish consistency. Receipt before betting is attested by the capture procedure, without an independent timestamp witness. | Preserve receipt, client-seed choice, activation, bet and reveal records. Independent observation or suitably linked signed/timestamped evidence is needed to authenticate chronology beyond the auditor's record. |

Infrastructure security, payment processing, withdrawals, custody and promotional systems outside the audited game calculation are excluded. The capture does not support conclusions about those systems. Any untested cap or promotional adjustment that changes a payout would require separate assessment before extending the modeled RTP claim to that behavior.


### Load-bearing premises

Every premise the verdict rests on, the artifact that witnesses it, and the question that decides how much scrutiny it needs: whether the captured data could have contradicted it. A premise the data cannot contradict carries a witness from outside this repository's own pipeline, or is marked ASSUMED. Agreement between the audit's own checks is not evidence for a premise the data cannot see.

| Premise | Witness artifact | Could the captured data contradict it? |
|---|---|---|
| The win rule is half-open `[lower, upper)`, with the upper bound excluded | `evidence/E13-verify-endpoint-boundary-probes.json` — two of its seven probes discriminate the half-open rule from an inclusive-both-ends rule; the remaining five return the same verdict under either reading and are controls. Asserted in `tests/dice/rngTests.ts` | **No power.** Both candidate rules reproduce all 6,700 served win flags with 0 disagreements (`outputs/report-figures.json`, `boundary.betsWhereBoundaryModelsDisagree`). Only 4,106 bets have a reachable upper bound, an expectation of 0.4106 landings, and 0 occurred. The two observed lower-bound landings witness nothing here, the lower bound being inclusive under both readings |
| The lower bound is inclusive | `data/dice-master-6700bets.json` | Yes. Two settled bets landed exactly on a lower bound and were paid |
| The commitment convention is SHA-256 over the UTF-8 server-seed hex string | `data/dice-master-6700bets.json` | Yes. 134 of 134 revealed seeds hash to their recorded commitments; a different convention fails all 134 |
| The RNG is HMAC-SHA256 with a hex-decoded key over `clientSeed:nonce:cursor`. The modulo-bias rejection guard is ASSUMED and listed as a separate premise below | `data/dice-master-6700bets.json` | Yes. All 6,700 recorded rolls reproduce bit for bit; a single wrong constant breaks every row at once |
| The served multiplier is the quotient `9900 / basisPoints` | `data/dice-master-6700bets.json` | Yes. All 2,807 winning multipliers match the quotient under strict equality, while the float closed form matches only a subset — which is the evidence identifying the quotient as the operator's form |
| The verifier endpoint and the settlement engine implement the same rule | `evidence/E13-verify-endpoint-boundary-probes.json` | Partial. E13 reproduces one settled bet exactly — roll, win flag and credited multiplier — and all 6,700 settlements are mutually consistent, but no settled bet exercises an upper bound (**L14**) |
| The enforced odds ceiling is 9900×, not the 99 carried in the settings field | `evidence/E14-maxodds-live-record.json` | Not from the capture. No captured bet exceeds 99×, so the dataset could not have contradicted the configured 99. Only the E14 record has power over this, and it witnesses acceptance at 9900× on a losing bet, not rejection above it (**L7**) |
| Stage-1 settlement rounds the multiplier half-up | ASSUMED — exact eight-decimal ties in `9900 / basisPoints` exist at `basisPoints` 2048 and 6144, both inside the reachable range, and at 6144 the two modes credit different amounts. No captured bet lands on either band, asserted in `tests/dice/settlementTests.ts`. Stage 2 is half-even and is witnessed | **No** (**L6**) |
| The operator applies a modulo-bias rejection guard equivalent to the reference implementation | ASSUMED — unexercised by this dataset; the rejection branch is reached with probability of order 1.7e-6 per draw, so no captured roll distinguishes a guarded server from an unguarded one | **No** (**L11**) |
| The `qa` build is the production build | ASSUMED — nothing in this package establishes it, and nothing is claimed about production | **No** (**L12**) |
| Each server-seed commitment existed before the bets it covers | ASSUMED — the auditor's capture record: each epoch's commitment was received and logged before that epoch's bets were placed, and every `at` field is the capture client's own clock. The pre-capture chain link shows epoch 0's commitment was already fixed by an earlier link, which orders the records without dating them | **No.** A SHA-256 digest carries no time, so the 6,700 rows are equally consistent with commitments published beforehand and with commitments composed afterwards. No offline computation on this dataset can separate the two (**L18**) |

### Model anchors

Every modelled headline number and the independent anchor that guards it. The reference value comes from outside the engine's own method, which is what makes it an anchor rather than the suite agreeing with itself.

| Modelled figure | Anchor method | Tolerance | Enforcing step |
|---|---|---|---|
| Roll recomputation — the basis of everything downstream | Bit-for-bit re-derivation of all 6,700 money-settled rolls under an intact commitment chain. Corroborated during the recon session against the operator's own verify endpoint, with the vectors fixed as unit-test constants in `tests/dice/rngTests.ts`; the raw responses were not retained | Exact equality, finiteness-guarded | `tests/steps/determinism.ts` (Step 5 — Roll Recomputation) |
| Effective edge per band | A discrete tally of winning integer outcomes over the whole 10,000-point grid, compared against the closed form. No operator odds or win-chance field is read | Exact integers, grid arithmetic only | `tests/steps/anti-circularity.ts` (Step 13), `tests/steps/boundary.ts` (Step 15) |
| The served multiplier against `9900 / basisPoints` | Direct measurement of the difference between the served value and the quotient across every winning bet | 0, bit-exact under strict `===` | `tests/steps/payouts.ts` (Step 7 — Multiplier Derivation) |

**Residual, declared.** The oracle and the engine share one reading of the rules — a band on `[0.00, 99.99]`, the half-open interval, continuous-win-chance pricing — so a misreading of the rules themselves would move both together, and the anchors above cannot see it. Two things narrow it. The boundary semantics are anchored outside the model by the E13 operator-verifier probes rather than by the engine. And the Step 13 tally is a literal enumeration that shares no arithmetic with the closed form, so an arithmetic error in the closed form is inexpressible in it. A second residual, smaller but named: there is no published third-party RTP for this operator, so the anchor class here is grid enumeration plus settled-roll reproduction rather than comparison against an external reference table. Certification remains provisional pending the production capture (**L12**).

## 12. Findings

**F-LIMITS — odds configuration discrepancy.** The retained settings value is `maxOdds: 99`. The follow-up session record E14 documents a $0.10 bet on `[0, 0.01)`, corresponding to 9900× under the model, accepted and settled on 1 September 2026. Its reported roll is 84.00, producing a loss.

The configuration and recorded acceptance behavior therefore need clarification. The recommendation is to align the setting with its intended use or document what the field represents. E14 also records a client-side UI clamp; that is not evidence of server rejection above the clamp.

The finding rests on auditor-attested session observations. E14 does not contain the original HTTP exchange, bet identifier or subsequent revealed-seed record for that probe. It establishes the scope of the recorded observation, not an independently replayable extreme-odds settlement. It supplies neither a winning credit at 9900× nor an exposure-cap test.

Under the documented uniform half-open model, a 9900× band has one winning grid point and theoretical RTP `9900 / 10000 = 99%` before any untested cap. No roll, win-flag or payout mismatch was identified in the 6,700-bet population. F-LIMITS remains a disclosure item for clarification and production follow-up, rather than an assertion of an incorrect captured payout.

## 13. Production validation plan

Anonymous production validation is the next stage of certification. It will use the public customer game path, preserve a separately identified evidence set and publish the resulting calculations. Any operator-assisted evidence collection will be identified separately from anonymous play.

### Planned capture upgrades

| Upgrade | Planned work | Evidence needed to close the current boundary |
|---|---|---|
| **Public production coverage** | Record production endpoints, capture dates, account/session scope and available release identifiers; sample modes and stakes under a predefined plan. | A production dataset with revealed seeds and passing outcome, commitment and settlement verification. Deployment-wide claims require evidence linking observations to backend releases. |
| **Complete transaction records** | Preserve request and response bodies before parsing, relevant status/timing information, stable request identifiers and all rejected or uncertain attempts. Reconcile retries before advancing. | Requests, responses and account history that account for every intended and settled bet in the audited population. |
| **Seed lifecycle** | Receive the relevant commitment before generating a fresh client seed with at least 128 bits of cryptographic randomness. Confirm activation matches the prior commitment. Retain every reveal, including the final epoch and interrupted runs. | A complete recorded sequence for each epoch. Independent timing/origin authentication additionally requires a witness or suitably linked authenticated evidence. |
| **Wallet reconciliation** | Seek attributable before/after balances or linked ledger entries; account for unrelated adjustments and settlement timing. | `closing balance = opening balance - stake + payout`, adjusted for any separately recorded activity, with entries tied to bet IDs. Without those records, actual wallet movement remains excluded. |
| **Boundary and rounding coverage** | Target upper-bound settlements, inverted behavior and the stage-1 rounding case identified in L6. Preserve their complete seed and settlement records. | Actual discriminating settled outcomes. Endpoint probes add evidence but cannot substitute for an unobserved settlement case. |
| **Odds and exposure behavior** | Recheck F-LIMITS and seek evidence of extreme-odds acceptance, winning payouts, rejection behavior and exposure-cap treatment. | Retained outcomes or attributable operator records for each claimed behavior. A losing extreme-odds bet establishes acceptance only. |
| **Statistical coverage** | Define sample size, independent seed epochs, detection targets and reporting rules before evaluating the capture. Keep general sampling and targeted cases identifiable. | Published test definitions, achieved coverage and all observed results. No finite sample establishes the absence of every possible selection strategy. |
| **Replayable analysis** | Generate a separately identified simulation with retained random inputs or a deterministic recipe, code version, runtime and parameters. | A second run that reproduces the saved statistics. This extends analysis reproducibility without reconstructing the original missing inputs. |

### Capture readiness and reporting

The production collector will be validated before use. Its requirements include durable response recording, preserved numeric text, request identifiers reused for the same intended bet, reconciliation after uncertain responses or rotations, and explicit handling of missing fields. The reference collector reuses the same idempotency key for transient retries of one bet and stops on schema, API, authentication and unclassified errors. These behaviors are unit-tested with local mocks. Durable restart recovery, uncertain rotation reconciliation and confirmation of server-side idempotency remain production-readiness requirements. The `capture/` files are not evidence of an executed production capture.

The sample plan will specify the intended modes, stakes, sessions, coverage targets and stopping limits. Rare events are targets rather than promised observations. Wallet access, independent witnesses and backend release evidence depend on the records and access actually available. Those dependencies will be reported with the resulting capture.

Final certification requires the anonymous production capture to be completed, its published inputs to support passing verification of the claimed outcomes, commitments and settlements, and the report to state its achieved scope and any remaining exclusions. A successful production capture resolves L12 for the sampled production activity. It does not automatically close unrelated wallet, rare-case, authenticity or statistical boundaries.

The initial pre-production result remains a completed assessment. Production evidence will support a new, specifically identified conclusion; it will not be presented as though it had been observed in the initial session.

## 14. Evidence inventory and reference material

| Evidence | Retained artifact | Evidentiary role |
|---|---|---|
| Capture | `data/dice-master-6700bets.json` | Bet/seed records and metadata; deterministic calculations are reproducible, while origin and chronology are auditor-attested. |
| Verification | `outputs/verification-results.json` | Saved step results and artifact identity; re-scored by the included verifier. |
| Derived figures | `outputs/report-figures.json` | Settlement, RTP, boundary, seed-screen and sample-return figures; reconciled by Step 19. |
| Simulation | `outputs/simulation-results.json` | Saved Pass-1 summaries and re-derivable Pass-2 seed statistics, subject to §9. |
| Convergence chart | `outputs/rtp-convergence.html` | Self-contained SVG/HTML representation of the saved convergence series; rendered by `src/chart.ts`. |
| E10 | `evidence/E10-dice-game-ui.png` | Illustrative game interface screenshot. |
| E11 | `evidence/E11-provably-fair-seeds-panel.png` | Illustrative seed-management interface screenshot. |
| E12 | `evidence/E12-provably-fair-verify-tab.png` | Illustrative verification interface; default form fields are not a captured bet. |
| E13 | `evidence/E13-verify-endpoint-boundary-probes.json` | Seven auditor-recorded endpoint probes and an interior settled-bet cross-check. Two probes discriminate upper-bound semantics. Original HTTP not retained. |
| E14 | `evidence/E14-maxodds-live-record.json` | Auditor-attested configuration, UI and one losing 9900× acceptance observation. Original HTTP not retained. |

The screenshots do not contain browser address bars; environment attribution comes from the capture record and endpoint metadata. The E13 and E14 files preserve session observations rather than original network transcripts. E13 outcomes are represented in unit vectors; the scored verifier does not directly authenticate either follow-up record.

The files under `capture/` document capture mechanics and future-capture helpers. They include behavior that differs from the collector used for this dataset, notably client-seed generation, numeric-field handling and retry request identity. The origins and properties of the actual dataset are specified in §§3 and 9. The reference scripts require separate transport setup and credentials and are outside the offline verification workflow.

Scope identifiers L1–L18 appearing in code and generated reports refer to §11. The technical subjects used in evidence references are covered here: data and provenance (§3), RNG and win rules (§4), payouts and RTP (§5), verification claims (§7), statistical interpretation (§9), reproduction (§10), findings (§12) and production validation (§13).
