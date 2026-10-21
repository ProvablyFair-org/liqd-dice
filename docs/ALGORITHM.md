# LIQD Dice: clean-room algorithm specification

Copy of the framework spec (SHA-256 212674d07231733d57616762cca63fc2a5636ddd4248402a5409c2a2a80593e2, the hash cited in src/rng.ts); local workspace paths and tool names replaced by neutral wording, nothing else changed.

Written 20 Oct 2026 for the ProvablyFair.org audit of LIQD Dice
(`originals-dice`, qa.liqd.com / liqd.com Originals).

This document is the only input an implementer needs to rebuild LIQD Dice's
outcome derivation and settlement. It was written without opening any LIQD
source code, any port of it, any audit-package code, any saved LIQD JS bundle,
or any screenshot of LIQD's Verify tab (see §8 for every file and URL read).
Every step names where it came from:

- **PAGE**: LIQD's public pages or a LIQD screen, quoted with location and date.
- **PROBE**: LIQD's own read-only verify endpoint, as recorded in
  `repositories/liqd/dice/evidence/E13-verify-endpoint-boundary-probes.json`
  (captured 31 Aug 2026; request/outcome pairs only).
- **STANDARD**: the standard provably-fair construction used across the
  industry (commit to SHA-256 of a server seed, HMAC-SHA256 keyed by the server
  seed over client seed, nonce and a draw cursor, bytes to integer).
- **DATA**: fixed by testing the standard candidates against the 6,700 live
  bets in `repositories/liqd/dice/data/dice-master-6700bets.json` (captured
  27 Aug 2026, 134 seed epochs × 50 bets). The data chose; LIQD's code did not.
- **CONFIG**: LIQD's settings API row for `originals-dice`, as transcribed in
  `evidence/E14-maxodds-live-record.json` (pulled 1 Sep 2026; an
  auditor-attested session note, not a raw HTTP capture).

No public LIQD page that describes the algorithm could be read: `GET
https://liqd.com/originals/dice` and `GET https://liqd.com/provably-fair`
returned **HTTP 403** on 20 Oct 2026 (the 1 Oct page record also reports 403
for plain GETs). The Provably Fair panel's text was not read beyond E11. So §2
rests on STANDARD + DATA + PROBE, not on a written LIQD rule (O1).

---

## 1. Inputs and commitment

### 1.1 Inputs

| Input | Form | Source |
|---|---|---|
| `serverSeed` | **32** lowercase hex characters (16 bytes); secret until the pair is rotated | DATA: all 135 revealed seeds (134 epochs + the pre-capture seed) are 32 hex chars. PAGE: E11 "Active Server Seed (Hashed)" |
| `clientSeed` | text string | PAGE: E11 "Active Client Seed" (`audit7b2cd7746b00`), "Next Client Seed" with a CHANGE button. DATA: 17-char seeds in phases A–C, 25-char player-set seeds containing `-` in phase D (`pfaudit-1787856766341-124`) |
| `nonce` | non-negative integer, 0 on the first bet of a pair, +1 per bet | PAGE: E11 "Total bets made with pair 0". DATA: nonces 0…49 in each of the 134 epochs, base 0 |
| `lower`, `upper` | decimals with 2 places, 0 ≤ lower < upper ≤ 100 | DATA: every bet carries `params {lower, upper, inverted}` |
| `inverted` | boolean | DATA; PROBE |
| `amount` | stake (USDC), decimal | DATA (`betAmount`; 0.1 and 10 captured) |

Work in **hundredths** throughout: `L = lower × 100`, `U = upper × 100`
(integers, converted from the decimal string exactly, never through a float
multiply).

The four UI modes map onto `(lower, upper, inverted)` as follows (DATA: all
four shapes occur):

| Mode | params | captured bets |
|---|---|---|
| Under X | `lower = 0, upper = X, inverted = false` | 1,362 |
| Over X | `lower = X, upper = 100, inverted = false` | 2,592 |
| Between A–B | `lower = A, upper = B, inverted = false` | 1,360 |
| Outside A–B | `lower = A, upper = B, inverted = true` | 1,386 (2 of them with `upper = 100`) |

PAGE (liqd.com/originals/dice meta description, read 1 Oct 2026,
`rtp-page-labels-2026-10-01.json`): "roll 0.00 to 99.99 under, over, between
or outside your line. 99% RTP in every mode." E10 shows four "Game mode"
icons. Which icon is which mode is not read from the screen; the params are
what the derivation uses.

### 1.2 Commitment

```
commitment = lowercase_hex( SHA-256( ASCII(serverSeed) ) )
```

i.e. hash the **32 ASCII characters** of the seed string, **not** the 16 bytes
they encode. (This is the opposite of the HMAC key in §2, which is the decoded
bytes.)

- SOURCE: STANDARD (SHA-256 commitment) + DATA for the encoding.
- Candidates tried: SHA-256 over the ASCII string → **6,700 / 6,700** bets
  resolve, **134 / 134** seed records; SHA-256 over the hex-decoded 16 bytes →
  **0 / 6,700**, **0 / 134**.
- Pair revealed seeds to bets by this hash (`hashedServerSeed`), never by
  record position.
- Forward chain: each epoch's `nextHashedServerSeed` (shown before rotation)
  equals the next epoch's `hashedServerSeed`: **133 / 133** transitions, and the
  pre-capture record's `nextHashedServerSeed` equals epoch 0's hash. E11 shows
  the active hash `d399984589d9…cb8614`, which is the last epoch's
  `nextHashedServerSeed` in the dataset. E11 labels the next value "Next Server
  Seed" while displaying a 64-hex string (`af19eecb…aded0`), i.e. a hash-length
  value, not a 32-char seed.

---

## 2. Outcome derivation

### Step 1: HMAC

```
key     = hex_decode(serverSeed)                                   # 16 bytes
message = UTF-8( clientSeed + ":" + decimal(nonce) + ":" + "0" )   # e.g. "auditf2456fc140ac:0:0"
digest  = HMAC-SHA256(key, message)                                # 32 bytes
```

- `decimal(nonce)` is plain base 10, no padding. The trailing `0` is the draw
  cursor (dice uses one draw per bet; cursor 0).
- SOURCE: STANDARD (HMAC-SHA256, server seed as key, `clientSeed:nonce:cursor`
  as message) + DATA for the key form and the message format.
- Candidates tried (each with each of the 10 byte→number mappings in Step 2,
  plus plain `SHA-256(serverSeed + message)` for each message, **150
  combinations**): key = ASCII string or hex-decoded bytes; message = `c:n`,
  `c:n:0`, `c-n`, `cn`, `n:c`.
- Result: key = **hex-decoded bytes**, message = **`c:n:0`** →
  **6,700 / 6,700**. Best other combination: **3 / 6,700** (chance level for a
  10,000-value outcome).

### Step 2: bytes to roll

```
N     = 10000                           # outcomes 0, 1, …, 9999  (0.00 … 99.99)
LIMIT = floor(2^32 / N) * N             # = 4294960000
for i in 0, 4, 8, …, 28:
    v = digest[i..i+3] read as an unsigned 32-bit BIG-ENDIAN integer
    if v < LIMIT:
        return roll = v mod N
# all 8 chunks rejected: see O2
```

`roll` is an integer in 0…9999; displayed as `roll / 100` with two decimals
(DATA: served `roll` 24.01 ↔ 2401; range observed 0…9999).

- SOURCE for "first 4 bytes, big-endian, mod 10000": DATA.
- SOURCE for N = 10000: DATA (rolls 0.00…99.99, served max 99.99) + PAGE
  ("roll 0.00 to 99.99").
- SOURCE for the rejection loop: STANDARD only. A first chunk ≥ LIMIT has
  probability 7296 / 2^32 ≈ 1.7 × 10⁻⁶; **0 of 6,700** bets hit it, so the data
  cannot tell rejection from plain `v mod 10000` (both 6,700 / 6,700). Without
  rejection, outcomes 0…7295 each carry 429,497 / 2^32 and 7296…9999 carry
  429,496 / 2^32: a per-outcome deviation of at most 2⁻³² (O2).
- Candidates tried for the mapping (all with every key/message above):

  | Mapping | Best match |
  |---|---|
  | u32 big-endian (first 4 bytes) mod 10000 (with or without rejection) | **6,700 / 6,700** |
  | u32 big-endian mod 10001 | ≤ 3 |
  | u32 little-endian mod 10000 | ≤ 3 |
  | float from 4 bytes (Σ bᵢ/256^(i+1)) × 10000, floored | ≤ 3 |
  | float from 4 bytes × 10001, floored | ≤ 3 |
  | u32 × 10000 / 2^32, floored | ≤ 3 |
  | float from 8 bytes × 10000, floored | ≤ 3 |
  | 52-bit float × 10000, floored | ≤ 3 |
  | whole digest as big integer mod 10000 | ≤ 3 |
  | 5-hex windows < 10⁶, mod 10000 | ≤ 3 |

### Step 3: independent check against LIQD's verify endpoint

E13 records LIQD's own `POST /api/v1/originals/dice/verify` called with the
revealed epoch-0 seed `015307d5a3f62db476210c3797bac8b7`, client seed
`auditf2456fc140ac`, nonce **1000** (never a settled bet): roll **3.61**. This
spec gives roll **361**. E13 also records the settled bet at nonce 0 (roll
24.01); this spec gives **2401**.

---

## 3. Win condition and payout

### 3.1 Win condition (half-open band)

```
inBand = (L ≤ roll) and (roll < U)
win    = inBand            if inverted = false
win    = not inBand        if inverted = true
width  = U − L             if inverted = false      # winning outcomes on the 0…9999 lattice
width  = 10000 − (U − L)   if inverted = true
```

- SOURCE: PROBE + DATA.
  - PROBE (E13): roll 3.61 with `[0, 3.61)` → loss; `[3.61, 10)` → win;
    inverted `[0.5, 3.61]` → win; inverted `[3.61, 10]` → loss;
    `[3.61, 100]` → win. Only the two probes with roll = upper (1 and 5)
    separate half-open from inclusive-both-ends; both agree with half-open.
  - DATA: half-open → **6,700 / 6,700** win flags; inclusive-both-ends also
    6,700 / 6,700 (no settled bet landed on an upper bound); open-lower
    `L < roll ≤ U` → 6,698 / 6,700. Lower-bound ties witnessed and won:
    `gaPf8AzHumK4L9VtrhjJc` (roll 0.00, under 94.69) and
    `RbGgV6toJS-1CgkkJI0vC` (roll 99.00, over 99).
  - PAGE (1 Oct 2026, liqd.com/originals/dice body text): "Set a 2x bet on
    Under and the line sits at 49.50. Switch to Over at 2x and it sits at
    50.50, not 50. The thin strip between those two lines is where neither bet
    wins, and it's exactly 1% of the slider." Under the half-open rule, Under
    49.50 wins on 4,950 outcomes and Over 50.50 on 4,950 (5050…9999), each
    paying 2x: consistent.
- `width` is also the count of winning outcomes, so `win_chance = width / 10000`
  exactly.

### 3.2 Multiplier

```
multiplier = 9900 / width          (exact rational; RTP = width/10000 × 9900/width = 0.99)
```

- Served `multiplier` (a JSON number) equals the IEEE-754 double of
  `9900 / width` on **2,807 / 2,807** wins. Other double forms matched less:
  `99 / (width/100)` 2,113; `99 / (upper − lower)` on doubles 1,823;
  `0.99 / (width/10000)` 2,172. Losses carry `multiplier = 0` (3,893 / 3,893).
- PROBE agrees: E13 multipliers 27.34806629834254 (width 362),
  15.492957746478874 (639), 1.0217772731964083 (inverted, 9689),
  1.0270774976657329 (9639) all equal `9900/width` as a double.
- SOURCE: PAGE for the edge ("Edge: 1.00%", stats panel "RTP 99%", "House Edge
  1%", 1 Oct 2026) + STANDARD (multiplier = (1 − edge) / probability) + DATA.
- UI: E10 shows Win Chance "50.00" %, Multiplier "1.98" x, "Payout On Win:
  1.98x" (9900 / 5000 = 1.98).
- Limits: CONFIG `minOdds 1.0102, maxOdds 99, houseEdge 1, maxBet 9898`.
  Captured widths run 100…9797 (multipliers 99 … 1.0105). E14 (testimony)
  records the UI clamping at 9900x and one 9900x bet accepted and settled
  (lost), so `maxOdds 99` is not the enforced ceiling (O4).

### 3.3 Settlement (two stages, 1e-8 grid)

```
m8          = round_nearest( 9900 / width , 8 decimals )      # stage 1
amount_won  = round_half_even( amount × m8 , 8 decimals )     # stage 2, win
amount_won  = 0                                               # loss
```

Use exact decimal / rational arithmetic, not doubles.

- DATA, wins (2,807):
  - two-stage as above → **2,807 / 2,807**.
  - stage-2 rounding mode: half-even 2,807; half-up 2,686; down 1,622; ceil
    1,604. **274** wins land exactly on a stage-2 tie (`amount × m8` ends in
    5 at the 9th decimal); every one goes to the even neighbour (153 rounded
    up from an odd last digit, 121 rounded down from an even one). Half-even is
    witnessed, not assumed.
  - stage-1 mode: nearest (half-up or half-even) 2,807; ceil 2,689; down
    2,669. No stage-1 value fell on a tie, so its tie mode is open (O3).
  - single-stage `round8(amount × exact 9900/width)` → 2,679 (any nearest
    mode); best stage-1 precision other than 8 decimals → 2,696 (9 decimals).
- Losses pay 0: **3,893 / 3,893**.
- `stakeWallet` = `betAmount` and `winningAmountWallet` = `winningAmount` on
  6,700 / 6,700.
- Compare numerically: amounts are served with trailing zeros dropped
  (`9.9`, `19.8`, `0.1045517`).
- SOURCE: STANDARD (stake × multiplier) + DATA (precision, two stages,
  rounding).

### 3.4 Fields an implementation must not read

`roll`, `win`, `result`, `multiplier`, `winningAmount`, the wallet fields and
the capture's own `localRoll`, `localWin`, `modelMultiplier`, `verified`,
`multOk`, `creditedOk` are claims or prior-audit computations, to be checked.
The derivation reads only `serverSeed`, `clientSeed`, `nonce`, `lower`,
`upper`, `inverted` and `amount`.

---

## 4. Source per step (summary)

| Step | Source | Evidence |
|---|---|---|
| Inputs: server seed, client seed, nonce | PAGE (E11) + DATA | E11 seeds panel; 134 epochs, nonces 0…49 |
| Commitment = SHA-256 over the ASCII seed | STANDARD + DATA | 6,700/6,700, 134/134 (decoded bytes 0/134) |
| Forward chain | DATA | 133/133 + pre-capture link |
| HMAC-SHA256, key = hex-decoded seed | STANDARD + DATA | 6,700/6,700 (ASCII key ≤ 3) |
| Message = `clientSeed:nonce:0` | STANDARD + DATA | 6,700/6,700 (4 other formats ≤ 3) |
| First 4 bytes BE u32 mod 10000 | DATA | 6,700/6,700; 9 other mappings ≤ 3 |
| Rejection ≥ 4294960000 | STANDARD | not exercised (0/6,700); O2 |
| Roll display roll/100, range 0.00–99.99 | PAGE + DATA | meta description; served rolls |
| Half-open band, inverted = complement | PROBE + DATA | E13 probes 1 and 5; 6,700/6,700 |
| Multiplier 9900/width | PAGE (1 % edge) + STANDARD + DATA + PROBE | 2,807/2,807 double-exact |
| Payout two-stage, stage 2 half-even | DATA | 2,807/2,807; 274/274 ties to even |
| Loss pays 0 | DATA | 3,893/3,893 |

---

## 5. Test vectors (from the dataset)

Each is copied from `dice-master-6700bets.json` (bet `id`), with the server
seed found by hashing (§1.2). `u32` = first four HMAC bytes, big-endian.

**V1: bet `kzLjSr11zq5GvEOHlj9n6`** (Under, win, stage-2 tie rounded up to even)
```
serverSeed  015307d5a3f62db476210c3797bac8b7
commitment  918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8
message     auditf2456fc140ac:0:0        params lower 0, upper 92.37, inverted false   amount 0.1
HMAC        475461d14638cca3e385e940e763bf808fa6ef6c05f1a83c333dc25e586c5b6e
u32 1196712401 → roll 2401 (24.01) → win, width 9237
multiplier 1.071776550828191   m8 1.07177655   0.1 × m8 = 0.107177655 → amount_won 0.10717766
```

**V2: bet `RbGgV6toJS-1CgkkJI0vC`** (Over 99, Phase B, roll on the lower bound wins)
```
serverSeed  36a8d90f5e7cd710ae29bfc89eb709c7
commitment  11ff13d04fe380139447a5c1643da301ee883ee6e3e10e11b0b5f56189c651f9
message     audit4195522a3970:47:0       params lower 99, upper 100, inverted false    amount 0.1
HMAC        bd93f34cf8d0aef107a4d487d17b8fd5373d9599badd953830bddccece381674
u32 3180589900 → roll 9900 (99.00) → win (99.00 ≥ 99), width 100
multiplier 99   amount_won 9.9
```

**V3: bet `OsauXga93-aZ8ARsdzDFd`** (Between, win, no tie)
```
serverSeed  015307d5a3f62db476210c3797bac8b7
commitment  918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8
message     auditf2456fc140ac:18:0       params lower 10.22, upper 66.49, inverted false   amount 0.1
HMAC        4d760f8d17c14858f9b7fe6568156de067a40dbffb23c68d5743767c5eb1ce1d
u32 1299582861 → roll 2861 (28.61) → win, width 5627
multiplier 1.759374444641905   m8 1.75937444   0.1 × m8 = 0.175937444 → amount_won 0.17593744
```

**V4: bet `Jx3DPeH3HOJUsFfmyfSbh`** (Outside, win, stage-2 tie rounded down to even)
```
serverSeed  015307d5a3f62db476210c3797bac8b7
commitment  918c2a302c7219c91cf31ce3619acb0ac820b9b7760e8ea3889787bfcb5d14d8
message     auditf2456fc140ac:41:0       params lower 46.27, upper 56.35, inverted true    amount 0.1
HMAC        cab70be16f56a77447dd92143b4a3f1e81609922136bc8781b491589383a53f9
u32 3400993761 → roll 3761 (37.61) → outside [4627, 5635) → win, width 10000 − 1008 = 8992
multiplier 1.1009786476868328   m8 1.10097865   0.1 × m8 = 0.110097865 → amount_won 0.11009786
```

**V5: bet `2OREb_OtYFaBKk_duOBkQ`** (Over 50, Phase C, 10 USDC stake, win)
```
serverSeed  bfde02800431d623efda4473c8966a25
commitment  a315d0f959b19e8a2762fa90abde4b94c1915528e296d92a85b5db2921cf8ffa
message     audit085813da8559:0:0        params lower 50, upper 100, inverted false    amount 10
HMAC        7abf491376aafaeb9efd6de1ed3651eef9c2a91eed254d1f780152c41a31fa3d
u32 2059356435 → roll 6435 (64.35) → win, width 5000
multiplier 1.98   amount_won 19.8
```

**V6: LIQD verify endpoint** (E13; no bet id, roll only)
```
serverSeed 015307d5a3f62db476210c3797bac8b7   message auditf2456fc140ac:1000:0 → roll 361 → "3.61" (as LIQD's verifier returned)
```

---

## 6. Open points the public sources do not settle

- **O1: no written algorithm.** No LIQD page describing the derivation was
  readable (403 to plain GET on 20 Oct 2026; Provably Fair panel text beyond
  E11 not read). Key form, message format (including the `:0` cursor),
  mapping and N rest on STANDARD + DATA + the E13 verifier roll.
- **O2: rejection.** Whether LIQD rejects chunks ≥ 4294960000 or takes plain
  `v mod 10000` is not decided by the data (0 / 6,700 exercised; ≈ 1.7 bets
  per million). If it rejects, the continuation (next chunk, then cursor 1)
  is a placeholder. Either way the bias bound is ≤ 2⁻³² per outcome. To
  settle: find a nonce whose first chunk ≥ LIMIT on a revealed seed and ask
  LIQD's verify endpoint.
- **O3: stage-1 tie mode.** Rounding the multiplier to 8 decimals is
  "nearest"; no captured width put `9900/width` exactly on a half, so half-up
  vs half-even at stage 1 is open. Stage-2 half-even is witnessed (274 ties).
- **O4: limits.** CONFIG says `maxOdds 99` (width ≥ 100); E14 (session note,
  raw HTTP not retained) says the UI and backend accept 9900x (width 1). The
  captured data spans widths 100…9797 only. Behaviour for widths 1…99, the
  minimum (`minOdds 1.0102` ⇒ width ≤ 9800) and any exposure cap are not
  witnessed in settlement.
- **O5: upper-bound tie in settlement.** The half-open upper bound rests on
  two verifier probes (E13), not on a settled bet (0 of 6,700 landed on an
  upper bound).
- **O6: stake grid and currency.** Only stakes 0.1 and 10 USDC were captured.
  Stakes with more than 8 decimals, and other currencies, are unwitnessed.
- **O7: client-seed encoding beyond ASCII.** UTF-8 is assumed; all captured
  client seeds are ASCII. Whether `:` inside a client seed is allowed is
  unknown (none captured).
- **O8: cursor meaning.** The trailing `:0` is read as a per-draw cursor by
  analogy with the standard multi-draw construction; dice uses only cursor 0
  in every captured bet.

---

## 7. Reproduction of this spec

Implemented in a throwaway script outside the repo
(`scratchpad/liqd-dice-spec/spec_check.py`, with `rng.py` for the 150-way
candidate search and `payout2.py` for the rounding search), run on every bet:

```
commit SHA256(ascii serverSeed)==hashedServerSeed: bets 6700/6700, seed records 134/134
forward chain next->active: 133/133, preCapture link True
roll = HMAC(key=hexdecode(seed), msg="c:n:0") u32BE mod 10000 with rejection: 6700/6700; plain mod: 6700/6700; bets that took rejection path: 0
roll range 0 9999
win flag rule half-open: 6700/6700
win flag rule inclusive: 6700/6700
win flag rule open-low : 6698/6700
multiplier 9900/width_hundredths (double)     exact double equality on wins: 2807/2807; all bets: 2807/6700
losses paying 0: 3893/3893
wins=2807 winningAmount = round8(amount x round8_nearest(9900/width)), stage-2 mode: {'down': 1622, 'half_up': 2686, 'half_even': 2807, 'ceil': 1604}
stage-2 ties: 274 {('up', 'lo_odd'): 153, ('down', 'lo_even'): 121}
stage-1 mode at k=8 (stage-2 half_even): {'down': 2669, 'half_up': 2807, 'half_even': 2807, 'ceil': 2689}
E13 probe nonce 1000 roll: 361 settled nonce 0: 2401
combos tried 150 max of rest 3
```

---

## 8. Files and URLs read while writing this spec

Read: `repositories/liqd/dice/evidence/E10-dice-game-ui.png`,
`E11-provably-fair-seeds-panel.png`, `E13-verify-endpoint-boundary-probes.json`,
`E14-maxodds-live-record.json`, `rtp-page-labels-2026-10-01.json`;
`repositories/liqd/dice/data/dice-master-6700bets.json`;
the framework spec folder's `games/dice/ALGORITHM.md` (Duel spec, shape
model) and `games/dice/profile.json`. URLs (GET, no login, both HTTP 403):
`https://liqd.com/originals/dice`, `https://liqd.com/provably-fair`.

Not opened: `E12-provably-fair-verify-tab.png`, `evidence/E14-maxodds-live-probe.md`
(not image or JSON), any `src/`, `tests/`, `scripts/`, `capture/`, `outputs/`,
`verifier-parity/`, `verify.js`, `test.js`, `MANIFEST.md`, `README.md`,
`AUDIT_CONTEXT.md` or `workshop-notes/` of any LIQD package, the auditor's other LIQD working folders,
any LIQD JS bundle, the browser tool's snapshot folder.

Disclosure: `profile.json` reference fields mention earlier LIQD package
details in passing (e.g. "bit-exact 9900 / basisPoints", "1e-8 integer
units"); E13/E14 carry the previous audit's prose conclusions. Those texts were
seen; every rule above was fixed by the counts in §7, not by them.
