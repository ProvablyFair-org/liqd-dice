# E14 — maxOdds acceptance probe (live, qa.liqd.com, 2026-09-01)

Purpose: establish that a **9900×** bet is *accepted and settled* for `originals-dice` — so the
operator's config field of `maxOdds 99` is not the settlement ceiling — after the config field and
the game UI were found to disagree. Read-only inspection plus one live bet. NOTE this probes
*acceptance at* 9900×, not server *rejection above* it (the above-9900× clamp observed is
client-side in the UI); server behaviour above 9900× was not tested.

## Config field (operator's own `GET /api/v1/fast-games/system/get-game-settings`)

`originals-dice` (id 34), pulled fresh 2026-09-01: `minOdds 1.0102`, **`maxOdds 99`**,
`houseEdge 1`, `maxBet` 9898 USDC, `maxExposureUsdc: null`. Only one dice row exists; the
`fast-games-17 maxOdds 10000` row seen at recon (2026-08-27) is no longer present.

## UI (game page)

Entering a multiplier above 9900 clamps to exactly **9900.00×** at **win chance 0.01%**
("Payout On Win" tracks `stake × 9900`). Entering `9999999` clamped straight back to 9900.00×.
So the UI offers up to 9900× — 100× the config field's 99.

## Live bet — the decisive test

A `$0.10` bet was placed at multiplier **9900×** (band `under 0.01` = `[0, 0.01)`, win chance
0.01%):

- `POST /api/v1/originals/dice/place-bet` → **HTTP 200** (server accepted and settled it)
- rolled **84.00** → loss (as a 0.01% win-chance bet does 9,999 times in 10,000); the $0.10 stake was lost
- the UI displayed a "Payout On Win" of **990.00000000** = `0.10 × 9900`. This is what the *client* showed before the bet; the backend's **winning** payout at 9900× was not observed, because the probe bet lost

**Conclusion:** the settlement backend **accepts and settles 9900×**, so the config field's 99 is
not the real ceiling. This is not a UI-only display bug — the backend priced and settled 9900×.
(Whether the server *rejects* a multiplier above 9900× was not probed; only the client-side UI clamp
above 9900× was observed.)

## Not an exploit

At 9900× the winning band is a single grid point. Under the half-open rule observed on the
operator's verifier (E13) and assumed for settlement (L2) (`roll < upper`, band-width-independent — see F6), `under 0.01` wins only on roll 0.00 =
1/10,000 = **exactly 99% RTP**. No player-favourable bet. (Inclusive-both-ends would have won on
2/10,000 = 198% RTP; that rule was retracted, which is why the boundary correction was load-bearing.)

## Recomputable arithmetic (pinned as unit vectors)

Independent of the live settlement above, the *arithmetic* of the 9900× extreme is now pinned in
`tests/dice/rngTests.ts`: `quotedMultiplier` of a width-0.01 band (`[0, 0.01)`) is exactly **9900×**,
`discreteWinCount` of that band is exactly **1** grid point, and its `effectiveEdge` is exactly
**1.00%** (99% RTP). This makes the "single grid point → 99% RTP, not 198%" argument reproducible
from the committed code without needing a settled bet at the extreme.

## NOT verified

- **The boundary at the 0.01 extreme was not witnessed in settlement.** A settled win at exactly
  roll 0.00 (or the decisive roll 0.01, which must LOSE) on a `under 0.01` band is a 1/10,000
  event; the fairness of the extreme rests on the half-open proof (E13, mid-range boundary) plus
  the band-independent comparator, not on a settled bet at the extreme. Recommended targeted probe
  for the production-parity recapture.
- **The max-payout / exposure cap is uncharacterised.** 9,898 max bet × 9900× ≈ $98M theoretical;
  `maxExposureUsdc` was `null` in the config row. Whether a cap exists at all, and whether it
  would clip the payout or reject the bet, was **not tested**. This matters for RTP, not just for
  operations: a cap that clips rather than rejects would reduce the realised RTP at capped stakes
  below the 99% this report verifies at the stakes actually captured.
- **The verify-endpoint confirmation at the extreme was rate-limited** during this session (an
  earlier scan tripped the limiter) and not completed; the boundary rule is nonetheless established
  by E13 + the comparator.
