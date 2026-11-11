# LIQD Dice: algorithm specification

Written 10 November 2026 for the ProvablyFair.org audit of LIQD Dice (`originals-dice`, `liqd.com`), release `v1.3.0`.

This document is the only input an implementer needs to rebuild LIQD Dice's outcome derivation and settlement. Every rule in it is fixed by production sources only, and every step names where it came from:

- **PAGE**: LIQD's public pages on `liqd.com`, with location and date. Two were read: the Dice game page (read logged out on 1 October 2026; the text read is recorded in `evidence/rtp-page-labels-2026-10-01.json`) and the page `liqd.com/provably-fair/technical-implementation` (read logged out on 3 November 2026; the auditor's read note is the record, the page text was not saved, so nothing is quoted from it and it is cited as a description only).
- **PROBE**: LIQD's own verify endpoint on production, `POST https://liqd.com/api/v1/originals/dice/verify`: the stored reply for each of the 5,936 captured rounds (`data/dice-prod-5936bets.json`, field `verifier`) and the 23 answered boundary probes of 9 November 2026 (`evidence/E17-prod-verify-boundary-probes-2026-11-09.json`).
- **STANDARD**: the standard provably-fair construction (commit to SHA-256 of a server seed, HMAC-SHA256 keyed by the server seed over client seed, nonce and a draw cursor, bytes to integer).
- **DATA**: fixed by testing the standard candidates against the 5,936 rounds captured on `liqd.com` between 7 and 10 November 2026 (`data/dice-prod-5936bets.json`: 34 seed epochs in four capture files, phases A, D, A+, C and X). The data chose; LIQD's code did not.

`src/rng.ts` implements §1.2 and §2. It was written from a specification and a module-interface file by an implementer who never opened LIQD's code; this document is that specification re-grounded on production sources, and the derivation it specifies is unchanged. Every count below is printed by `node scripts/algorithm-spec-check.mjs` (§7), which reads only the dataset and the probe record and imports nothing from `src/`.

---

## 1. Inputs and commitment

### 1.1 Inputs

| Input | Form | Source |
|---|---|---|
| `serverSeed` | **32** lowercase hex characters (16 bytes); secret until the pair is rotated | DATA: all 38 revealed seeds (34 epochs and the 4 pre-capture seeds) are 32 lowercase hex characters. PAGE (technical page): a 16-byte seed |
| `clientSeed` | text string | DATA: 29 seeds of the form `audit` + 12 hex (17 characters) and 5 player-set seeds of 33 characters containing `-` (`pfaudit-prod-dice-d1-9e7a04f27b2a`); all ASCII |
| `nonce` | non-negative integer, 0 on the first bet of a pair, +1 per bet | DATA: every epoch starts at nonce 0 (the post-rotation nonce the rotation reply serves) and runs without a gap |
| `lower`, `upper` | decimals with 2 places, 0 ≤ lower < upper ≤ 100 | DATA: every bet carries `params {lower, upper, inverted}` |
| `inverted` | boolean | DATA; PROBE |
| `amount` | stake, decimal with up to 8 places (USDT) | DATA (`betAmount`; `0.10000000` and `10.00000000` captured) |

Work in **hundredths** throughout: `L = lower × 100`, `U = upper × 100` (integers, converted from the decimal string exactly, never through a float multiply).

The four modes map onto `(lower, upper, inverted)` as follows (DATA: all four shapes occur):

| Mode | params | captured rounds |
|---|---|---|
| Under X | `lower = 0, upper = X, inverted = false` | 1,151 |
| Over X | `lower = X, upper = 100, inverted = false` | 1,387 |
| Between A–B | `lower = A, upper = B, inverted = false` | 1,148 |
| Outside A–B | `lower = A, upper = B, inverted = true` | 2,250 |

PAGE (liqd.com/originals/dice meta description, read 1 October 2026): "roll 0.00 to 99.99 under, over, between or outside your line. 99% RTP in every mode."

### 1.2 Commitment

```
commitment = lowercase_hex( SHA-256( ASCII(serverSeed) ) )
```

i.e. hash the **32 ASCII characters** of the seed string, **not** the 16 bytes they encode. (This is the opposite of the HMAC key in §2, which is the decoded bytes.)

- SOURCE: STANDARD (SHA-256 commitment) + DATA for the encoding; PAGE (technical page) describes the same encoding.
- Candidates tried: SHA-256 over the ASCII string → **34 / 34** seed records and **5,936 / 5,936** bets resolve; SHA-256 over the hex-decoded 16 bytes → **0 / 34**. The 4 pre-capture seeds hash to their commitments the same way.
- Pair revealed seeds to bets by this hash (`hashedServerSeed`), never by record position.
- Forward chain: inside each capture file, each epoch's `nextHashedServerSeed` (served before the rotation) equals the next epoch's `hashedServerSeed`: **30 / 30** transitions; each file's pre-capture record names its first epoch's hash: **4 / 4**. The links between the four files run through rotations that are not in the dataset.

---

## 2. Outcome derivation

### Step 1: HMAC

```
key     = hex_decode(serverSeed)                                   # 16 bytes
message = UTF-8( clientSeed + ":" + decimal(nonce) + ":" + "0" )   # e.g. "audit8f7ccfa4326c:9:0"
digest  = HMAC-SHA256(key, message)                                # 32 bytes
```

- `decimal(nonce)` is plain base 10, no padding. The trailing `0` is the draw cursor (dice uses one draw per bet; cursor 0).
- SOURCE: STANDARD + DATA for the key form and the message format; PAGE (technical page) describes the same key and message.
- Candidates tried: key = ASCII string or hex-decoded bytes; message = `c:n:0`, `c:n`, `c-n`, `cn`, `n:c`; each with each of the 11 byte-to-number mappings in Step 2 (110), plus plain `SHA-256(seed text + message)` for each message format (5): **115 combinations**.
- Result: key = **hex-decoded bytes**, message = **`c:n:0`** → **5,936 / 5,936**. Best other combination: **2 / 5,936** (chance level for a 10,000-value outcome).

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

`roll` is an integer in 0…9999; served as `roll / 100` with two decimals (DATA: served `roll` 76.84 ↔ 7684; range observed 0…9999).

- SOURCE for "first 4 bytes, big-endian, mod 10000": DATA.
- SOURCE for N = 10000: DATA (rolls 0.00…99.99, both ends served) + PAGE ("roll 0.00 to 99.99").
- SOURCE for the rejection loop: STANDARD + PAGE (the technical page describes 4-byte big-endian chunks with rejection). A first chunk ≥ LIMIT has probability 7296 / 2^32 ≈ 1.7 × 10⁻⁶; **0 of 5,936** rounds hit it, so the data cannot tell rejection from plain `v mod 10000` (both 5,936 / 5,936). Without rejection, outcomes 0…7295 would each carry 429,497 / 2^32 and 7296…9999 would carry 429,496 / 2^32: a per-outcome deviation of at most 2⁻³² (O2).
- Mappings tried (all with every key and message above):

  | Mapping | Best match |
  |---|---|
  | u32 big-endian (first 4 bytes) mod 10000 (with or without rejection) | **5,936 / 5,936** |
  | u32 big-endian mod 10001 | ≤ 2 |
  | u32 little-endian mod 10000 | ≤ 2 |
  | float from 4 bytes (Σ bᵢ/256^(i+1)) × 10000, floored | ≤ 2 |
  | float from 4 bytes × 10001, floored | ≤ 2 |
  | u32 × 10000 / 2^32, floored | ≤ 2 |
  | float from 8 bytes × 10000, floored | ≤ 2 |
  | 52-bit float × 10000, floored | ≤ 2 |
  | whole digest as big integer mod 10000 | ≤ 2 |
  | 5-hex windows < 10⁶, mod 10000 | ≤ 2 |

### Step 3: independent check against LIQD's verify endpoint

PROBE: for every captured round, LIQD's verify endpoint was asked with the revealed seed, the round's client seed, nonce and band, and the stored reply carries the served roll, win and multiplier on **5,936 / 5,936**. On the 23 boundary probes of 9 November 2026, 6 of them on nonces that were never settled, this specification's roll equals the verifier's roll on **23 / 23**.

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
  - DATA cannot choose: half-open reproduces **5,936 / 5,936** win flags, and so do inclusive-both-ends (5,936) and open-lower `L < roll ≤ U` (5,936), because **0** settled rounds have their roll on a lower bound and **0** on an upper bound.
  - PROBE (E17) chooses: LIQD's verifier, asked for rolls that sit exactly on a bound, agrees with half-open on **23 / 23** probes, with inclusive-both-ends on 15 / 23 and with open-lower on 8 / 23. Roll 25.00 with `[25, 100)` → win, `[25, 75)` → win, inverted `[25, 75)` → loss; roll 75.00 with `[0, 75)` → loss, `[25, 75)` → loss, inverted `[25, 75)` → win; roll 0.00 with `[0, 75)` → win; roll 99.99 with `[25, 99.99)` → loss. The 8 probes with the roll on an upper bound are the ones that separate half-open from inclusive; the 7 with the roll on a lower bound separate it from open-lower.
  - These are verifier replies. That settlement treats a roll on a bound the same way is not witnessed by a settled round (O5).
  - PAGE (1 October 2026, liqd.com/originals/dice body text): "Set a 2x bet on Under and the line sits at 49.50. Switch to Over at 2x and it sits at 50.50, not 50. The thin strip between those two lines is where neither bet wins, and it's exactly 1% of the slider." Under the half-open rule, Under 49.50 wins on 4,950 outcomes and Over 50.50 on 4,950 (5050…9999), each paying 2x: consistent.
- `width` is also the count of winning outcomes, so `win_chance = width / 10000` exactly.

### 3.2 Multiplier

```
multiplier = 9900 / width          (exact rational; RTP = width/10000 × 9900/width = 0.99)
```

- Served `multiplier` (a JSON number) equals the IEEE-754 double of `9900 / width` on **2,622 / 2,622** wins. `99 / (width/100)` also matches all 2,622 on the captured widths; `0.99 / (width/10000)` matches 1,521. Losses carry `multiplier = 0` (3,314 / 3,314).
- PROBE agrees: the verifier's multipliers on the boundary probes (for example 1.3916221535001405 at width 7114 and 3.9584166333466615 at width 2501) equal `9900/width` as a double on every winning probe.
- SOURCE: PAGE for the edge ("Edge: 1.00%", stats panel "RTP 99%", "House Edge 1%", 1 October 2026) + STANDARD (multiplier = (1 − edge) / probability) + DATA.
- Captured widths: 1, 100, 200, 500, 1000, 2000, 3500, 5000, 6500, 8000, 9000, 9800 (multipliers 9900, 99 … 1.0102…). No limits configuration was read from production (O4).

### 3.3 Settlement (round down, 1e-8 grid)

```
amount_won  = floor( amount × 9900 / width , 8 decimals )     # win: the exact product, rounded DOWN
amount_won  = 0                                               # loss
```

Use exact decimal / rational arithmetic, not doubles.

- DATA, wins (2,622): rounding the exact product **down** reproduces **2,622 / 2,622**; half-up 2,086; half-even 2,086; up 1,520. The product is already on the 1e-8 grid on 1,520 wins and off it on 1,102, and every one of the 1,102 is settled at the rounded-down amount.
- Both captured stakes follow it: `0.10000000` (2,496 wins) and `10.00000000` (126 wins, all exact products of 19.8).
- Losses pay 0: **3,314 / 3,314**.
- `stakeWallet` = `betAmount` and `winningAmountWallet` = `winningAmount` on 5,936 / 5,936.
- Amounts are served as 8-decimal strings (`"0.10102040"`, `"19.80000000"`); a loss is served as `"0"`.
- SOURCE: STANDARD (stake × multiplier) + DATA (precision and rounding direction). LIQD stated on 30 September 2026 that payouts "use exact decimal maths and are then rounded down to 8 decimals".

### 3.4 Fields an implementation must not read

`roll`, `win`, `result`, `multiplier`, `winningAmount`, the wallet fields, the stored `verifier` reply and the converter's own `localRoll`, `localWin`, `verified` are claims or prior computations, to be checked. The derivation reads only `serverSeed`, `clientSeed`, `nonce`, `lower`, `upper`, `inverted` and `amount`.

---

## 4. Source per step (summary)

| Step | Source | Evidence |
|---|---|---|
| Inputs: server seed, client seed, nonce | DATA + PAGE | 34 epochs, nonces from 0 without a gap |
| Commitment = SHA-256 over the ASCII seed | STANDARD + DATA + PAGE | 5,936/5,936, 34/34 (decoded bytes 0/34) |
| Forward chain | DATA | 30/30 in-file links + 4/4 pre-capture links |
| HMAC-SHA256, key = hex-decoded seed | STANDARD + DATA + PAGE | 5,936/5,936 (ASCII key ≤ 2) |
| Message = `clientSeed:nonce:0` | STANDARD + DATA + PAGE | 5,936/5,936 (4 other formats ≤ 2) |
| First 4 bytes BE u32 mod 10000 | DATA | 5,936/5,936; 9 other mappings ≤ 2 |
| Rejection ≥ 4294960000 | STANDARD + PAGE | not exercised (0/5,936); O2 |
| Roll display roll/100, range 0.00–99.99 | PAGE + DATA | meta description; served rolls |
| Half-open band, inverted = complement | PROBE + DATA | E17 23/23 (inclusive 15/23); 5,936/5,936 |
| Multiplier 9900/width | PAGE (1 % edge) + STANDARD + DATA + PROBE | 2,622/2,622 double-exact |
| Payout = exact product rounded down to 8 decimals | DATA | 2,622/2,622 (half-up 2,086) |
| Loss pays 0 | DATA | 3,314/3,314 |

---

## 5. Test vectors (from the production dataset)

Each is copied from `data/dice-prod-5936bets.json` (bet `id`), with the server seed found by hashing (§1.2). `u32` = first four HMAC bytes, big-endian.

**V1: bet `JOaaqudLC5XcE2aFNic0w`** (Phase A, Under 98, win, payout rounded down)
```
serverSeed  3085a86bd812800c76ae7d81191955b2
commitment  99d78251a09a8c5ee083928d3ff835b1bca114e1ebf86cbf338f43959a583d8d
message     audit8f7ccfa4326c:9:0        params lower 0, upper 98, inverted false   amount 0.10000000
HMAC        0227b8f4a2868a7df388b2431204df236ef73adf635599eedbe030ce63562c4a
u32 36157684 → roll 7684 (76.84) → win, width 9800
multiplier 1.010204081632653   0.1 × 9900/9800 = 0.10102040816… → amount_won 0.10102040
```

**V2: bet `Cp6pO0kMLIR_-nkDWIs_0`** (Phase A, Between, win, payout rounded down)
```
serverSeed  463775f070cb7cb2e09940f94ee97ac3
commitment  0efdf3b9cc16b585df2d26b78c1428fa7a5768f78f2b2b040e6bd646cd34c757
message     audit6fa3a34e4fd5:54:0       params lower 42.79, upper 77.79, inverted false   amount 0.10000000
HMAC        e27ebcd6adfe3b281518e9cb39b367df53a9291e05f186deb12e430225726b68
u32 3799956694 → roll 6694 (66.94) → win, width 3500
multiplier 2.8285714285714287   0.1 × 9900/3500 = 0.28285714285… → amount_won 0.28285714
```

**V3: bet `I8Q8SDGxcfjU1popneurG`** (Phase A, Outside, win, payout rounded down)
```
serverSeed  85cb5f41035e18a2db66e0fa95a742a3
commitment  42f0b975b33c41e6f8e581ad39c6cda1fc2c2ccbff6b36788e99d58b713d7528
message     audit516264facc8f:6:0        params lower 14.31, upper 49.31, inverted true    amount 0.10000000
HMAC        9136a6fa9feda6c54d57f714d47bd17dc743ba95579f032e570e21ba14c8b12d
u32 2436278010 → roll 8010 (80.10) → outside [1431, 4931) → win, width 10000 − 3500 = 6500
multiplier 1.523076923076923   0.1 × 9900/6500 = 0.15230769230… → amount_won 0.15230769
```

**V4: bet `iMgu6U7RKoct0VAxgLffJ`** (Phase A top-up, Outside at a 1 % win chance, 99×, win)
```
serverSeed  f12e4515cea57104b9e04178548d8c20
commitment  0d877282928bdff7b8c93510034b1c0055a905a2c46307475b17d374ba928cab
message     auditfc6a04215b7e:83:0       params lower 0.5, upper 99.5, inverted true       amount 0.10000000
HMAC        a33772ad8328da21abaa481519d23ba94b205f586fcb76aa345246b813b6e43e
u32 2738320045 → roll 45 (0.45) → outside [50, 9950) → win, width 10000 − 9900 = 100
multiplier 99   amount_won 9.9
```

**V5: bet `ljxzosACO18qUy31tkwlA`** (Phase D, player-set client seed, Over 35, win)
```
serverSeed  425eeb1811ca501f62c67c22c3e3e464
commitment  5bef5d420546c2a23b5d1701ead71778cf2a486c7a54b30e09b8bf681ec0d286
message     pfaudit-prod-dice-d1-9e7a04f27b2a:16:0   params lower 35, upper 100, inverted false   amount 0.10000000
HMAC        8e5c0dc1f77081208d71018244faf1110b0a5fb62114fe79091b08f2801b237e
u32 2388397505 → roll 7505 (75.05) → win, width 6500
multiplier 1.523076923076923   amount_won 0.15230769
```

**V6: bet `EdvA4OjCUyOffdOqerqJ5`** (Phase C, Over 50, stake 10, win)
```
serverSeed  426be2756dc6f4b943deeed76b081ee7
commitment  c63616b206513a87c6f6a41464be633cb3685c79d9b283bf3d7f030543468d59
message     audit6d93604e032c:1:0        params lower 50, upper 100, inverted false    amount 10.00000000
HMAC        5235f88ba46f9c6b9152ab7c56b45f0f9ace2ac12740785e561f3126830fce9d
u32 1379268747 → roll 8747 (87.47) → win, width 5000
multiplier 1.98   amount_won 19.8
```

**V7: bet `9DfhEtFeDzitdNEV2qzHI`** (Phase C, Over 50, stake 10, loss)
```
serverSeed  426be2756dc6f4b943deeed76b081ee7     message audit6d93604e032c:0:0
HMAC        37bcf51f127a5f2853c555440ac0eb6d51be863c5e884bb3fd79b607e8cffc8f
u32 935130399 → roll 399 (3.99) → 399 < 5000 → loss, multiplier 0, amount_won 0
```

**V8: bet `YZRCscx8nuK_hv6jjY7w0`** (Phase A, the round that rolled 0.00)
```
serverSeed  f8a011e47813188caa965e5e0f4c925d
commitment  c0c9028c7ba78146d573b84704013ef26739fd0e19fc962712019fec26b44285
message     audit28f0a5faf51b:117:0      params lower 33.62, upper 53.62, inverted true   amount 0.10000000
HMAC        4051e9709c126422f71f3b4c21951fa78508a3dfcb943c5496cc3fa42a6ae168
u32 1079110000 → roll 0 (0.00) → outside [3362, 5362) → win, width 8000
multiplier 1.2375   amount_won 0.12375 (exact product)
```

**V9: bet `vVnhllPfT2QMomDU-d2z2`** (Phase A, the round that rolled 99.99)
```
serverSeed  76f6cbe2ac74cda67b021b9f70d0084a
commitment  772b331e6b32c2d2d8231c3aa895a7393c1894ae88f8675b28e41b0c0d9ed124
message     audit216e8ae924ba:177:0      params lower 36.73, upper 56.73, inverted true   amount 0.10000000
HMAC        2f98249f00ab587c3ee46376f4422ac029a4189156de4e85711760f0f9546019
u32 798499999 → roll 9999 (99.99) → outside [3673, 5673) → win, width 8000
multiplier 1.2375   amount_won 0.12375 (exact product)
```

**V10: LIQD verify endpoint on a band bound** (E17; nonces never settled, roll and win only)
```
serverSeed edd81eacc3dd5564aa0c26709b918299   message auditf6f5365ea141:410:0 → roll 2500 → "25" (as LIQD's verifier returned)
serverSeed e42be262c0afeb4e3700d1a90580b266   message audit82cc2056621a:804:0 → roll 7500 → "75"
roll 2500: [25, 100) win · [25, 75) win · inverted [25, 75) loss
roll 7500: [0, 75) loss · [25, 75) loss · inverted [25, 75) win
```

---

## 6. Open points the production sources do not settle

- **O1: the written algorithm.** LIQD's technical page describes the derivation; its text was read, not saved, so this specification rests on STANDARD + DATA + PROBE for every rule and uses the page as a consistent description only.
- **O2: rejection.** Whether LIQD's server rejects chunks ≥ 4294960000 or takes plain `v mod 10000` is not decided by the data (0 / 5,936 exercised; ≈ 1.7 rounds per million). The technical page describes rejection, and a redraw at cursor + 1,000,000 when all eight chunks of a digest are rejected; that continuation is not specified here because no input reaches it (probability about (1.7 × 10⁻⁶)⁸ per draw), and `src/rng.ts` stops with an error instead. Either way the bias bound is ≤ 2⁻³² per outcome. To settle the first question: find a nonce whose first chunk is ≥ LIMIT on a revealed seed and ask LIQD's verify endpoint.
- **O3: rounding.** Round-down is witnessed on 1,102 wins whose product is off the 1e-8 grid, at widths 3500, 6500 and 9800 and the stake 0.10. Other widths and stakes at which the product is off the grid were not captured.
- **O4: limits.** No odds or bet-limit configuration is in the production replies and none was read. The captured data spans width 1 (one round, lost) and widths 100…9800. Behaviour for widths 2…99 and 9801…9899, a settled win at width 1, and any exposure cap, are not witnessed.
- **O5: bound ties in settlement.** The half-open rule rests on verifier replies (E17), not on a settled round (0 of 5,936 landed on a bound).
- **O6: stake grid and currency.** Only stakes 0.10 and 10.00 USDT were captured. Other stakes and other currencies are unwitnessed.
- **O7: client-seed encoding beyond ASCII.** UTF-8 is assumed; all captured client seeds are ASCII. Whether `:` inside a client seed is allowed is unknown (none captured; `-` is, in the player-set seeds).
- **O8: cursor meaning.** The trailing `:0` is read as a per-draw cursor by analogy with the standard multi-draw construction and the technical page; dice uses only cursor 0 in every captured round.

---

## 7. Reproduction of this specification

`node scripts/algorithm-spec-check.mjs` (Node 22, built-in modules only; it reads `data/dice-prod-5936bets.json` and `evidence/E17-prod-verify-boundary-probes-2026-11-09.json` and imports nothing from `src/` or `tests/`), output of 10 November 2026:

```
commitment SHA-256(ASCII seed) == hashedServerSeed: seed records 34/34, bets 5936/5936; SHA-256(decoded bytes): seed records 0/34
pre-capture seeds: 4/4 hash to their commitment; all 38 revealed seeds are 32 lowercase hex: true
forward chain next -> active inside each capture file: 30/30; pre-capture link to the file's first epoch: 4/4
roll candidates tried: 115
  5936/5936  HMAC key hex-decoded bytes, message c:n:0, u32 big-endian mod 10000, rejection >= LIMIT
  5936/5936  HMAC key hex-decoded bytes, message c:n:0, u32 big-endian mod 10000, no rejection
  best of the other 113: 2/5936
captured rounds whose first chunk is >= LIMIT (rejection path taken): 0
served roll range in hundredths: 0 .. 9999
win rule half-open [L, U): settled rounds 5936/5936; verifier boundary probes (E17) 23/23
win rule inclusive [L, U]: settled rounds 5936/5936; verifier boundary probes (E17) 15/23
win rule open-lower (L, U]: settled rounds 5936/5936; verifier boundary probes (E17) 8/23
settled rounds with the roll on the lower bound: 0; on the upper bound: 0
multiplier == double(9900 / width) on wins: 2622/2622; == 99 / (width/100): 2622; == 0.99 / (width/10000): 1521; losses with multiplier 0: 3314/3314
captured widths: 1, 100, 200, 500, 1000, 2000, 3500, 5000, 6500, 8000, 9000, 9800
winningAmount == round(amount x 9900 / width, 8 dp) on 2622 wins, by mode: down 2622, half-up 2086, half-even 2086, up 1520
wins whose exact product is not on the 1e-8 grid: 1102 (all settled at the rounded-down amount: 1102); on the grid: 1520
losses paying 0: 3314/3314
stakeWallet == betAmount and winningAmountWallet == winningAmount: 5936/5936
stakes captured: 0.10000000, 10.00000000 USDT
LIQD verify reply == served roll, win, multiplier: 5936/5936
E17 probes: roll of this specification == LIQD's verifier roll on 23/23
client seeds: 29 of form audit + 12 hex (17 characters), 5 player-set of 33 characters; all ASCII: true; nonces per epoch start at 0
```

---

## 8. Sources read for this specification

`data/dice-prod-5936bets.json`; `evidence/E17-prod-verify-boundary-probes-2026-11-09.json`; `evidence/rtp-page-labels-2026-10-01.json`; the auditor's read note of `liqd.com/provably-fair/technical-implementation` (3 November 2026). No LIQD source code, client bundle or port of either was read.
