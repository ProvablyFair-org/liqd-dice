/** Generated from committed sources. Rebuild: npm run build:standalone. Check: npm run check:standalone. */
'use strict';

const path = require('node:path');
const nodeRequire = require;
const modules = {
"src/config.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PAYOUT_NUMERATOR = exports.SIM_RTP_STRATEGY = exports.SIM_EDGE_BANDS = exports.SIMULATION_HTML_SHA256 = exports.SIMULATION_SHA256 = exports.EXPECTED_PHASE_BETS = exports.EXPECTED_EPOCH_SIZE = exports.EXPECTED_SEEDS = exports.EXPECTED_BETS = exports.DATASET_SHA256 = exports.ALPHA_SCREEN = exports.ALPHA_SCREENS = exports.ALPHA = exports.SIM_CHERRY_SEED_ALPHA = exports.SIM_CHERRY_WINDOW = exports.SIM_CHERRY_BINS = exports.SIM_RTP_MARKS = exports.SIM_RTP_BETS = exports.SIM_EDGE_BETS = exports.SIM_SERIAL_DRAWS = exports.SIM_UNIFORMITY_DRAWS = exports.MAX_ODDS = exports.MIN_ODDS = exports.HOUSE_EDGE = exports.SCALE = exports.CURSOR = exports.RANGE = void 0;
exports.bandKey = bandKey;
exports.continuousWinChancePct = continuousWinChancePct;
exports.payoutBasisPoints = payoutBasisPoints;
exports.quotedMultiplier = quotedMultiplier;
exports.discreteWinCount = discreteWinCount;
exports.discreteWinProbability = discreteWinProbability;
exports.diceWin = diceWin;
exports.effectiveEdge = effectiveEdge;
exports.effectiveEdgeIsExact = effectiveEdgeIsExact;
exports.theoreticalRTP = theoreticalRTP;
exports.servedRollMatches = servedRollMatches;
exports.round8 = round8;
exports.creditResidualSign = creditResidualSign;
exports.creditResidual = creditResidual;
exports.settledCreditUnits = settledCreditUnits;
exports.settledCredit = settledCredit;
exports.isSettlementTie = isSettlementTie;
exports.bandMode = bandMode;
exports.RANGE = 10000;
exports.CURSOR = 0;
exports.SCALE = 100;
exports.HOUSE_EDGE = 0.01;
exports.MIN_ODDS = 1.0102;
exports.MAX_ODDS = 9900;
exports.SIM_UNIFORMITY_DRAWS = 2000000;
exports.SIM_SERIAL_DRAWS = 200000;
exports.SIM_EDGE_BETS = 2000000;
exports.SIM_RTP_BETS = 20000000;
exports.SIM_RTP_MARKS = [1000, 10000, 100000, 1000000, 5000000, 10000000, exports.SIM_RTP_BETS];
exports.SIM_CHERRY_BINS = 20;
exports.SIM_CHERRY_WINDOW = 50;
exports.SIM_CHERRY_SEED_ALPHA = 0.05;
exports.ALPHA = 0.01;
exports.ALPHA_SCREENS = 3;
exports.ALPHA_SCREEN = exports.ALPHA / exports.ALPHA_SCREENS;
exports.DATASET_SHA256 = 'ca1a181a9b4c89a1823e15fe71603b7a5e2267382c134873d80cba536d3aef34';
exports.EXPECTED_BETS = 6700;
exports.EXPECTED_SEEDS = 134;
exports.EXPECTED_EPOCH_SIZE = 50;
exports.EXPECTED_PHASE_BETS = { A: 5000, B: 1000, C: 200, D: 500 };
exports.SIMULATION_SHA256 = '3da35d94342153d4f5345f5e8bdbc3cdfef5139bd752d3680898b35ffcbceebd';
exports.SIMULATION_HTML_SHA256 = 'dadbd1859cff586eb42b96212d8d4271d578f9235d2a0bdbfe27d1dcf978f9be';
exports.SIM_EDGE_BANDS = [
    { label: 'under 50 (1.98×)', params: { lower: 0, upper: 50, inverted: false } },
    { label: 'over 50 (1.98×)', params: { lower: 50, upper: 100, inverted: false } },
    { label: 'under 10 (9.9×)', params: { lower: 0, upper: 10, inverted: false } },
    { label: 'over 90 (9.9×)', params: { lower: 90, upper: 100, inverted: false } },
    { label: 'inside 25-75 (1.98×)', params: { lower: 25, upper: 75, inverted: false } },
    { label: 'outside 25-75 (1.98×)', params: { lower: 25, upper: 75, inverted: true } },
    { label: 'over 98 (49.5×)', params: { lower: 98, upper: 100, inverted: false } },
    { label: 'over 99 (99×)', params: { lower: 99, upper: 100, inverted: false } },
    { label: 'under 1 (99×)', params: { lower: 0, upper: 1, inverted: false } },
];
exports.SIM_RTP_STRATEGY = { lower: 0, upper: 50, inverted: false };
function bandKey(p) {
    return `${p.lower}|${p.upper}|${p.inverted ? 1 : 0}`;
}
function continuousWinChancePct(p) {
    const width = p.upper - p.lower;
    return p.inverted ? 100 - width : width;
}
exports.PAYOUT_NUMERATOR = (1 - exports.HOUSE_EDGE) * 10000;
function payoutBasisPoints(p) {
    return Math.round(continuousWinChancePct(p) * 100);
}
function quotedMultiplier(p) {
    const wc = continuousWinChancePct(p);
    return wc > 0 ? (100 / wc) * (1 - exports.HOUSE_EDGE) : 0;
}
function discreteWinCount(p) {
    const lo = Math.round(p.lower * exports.SCALE);
    const hi = Math.round(p.upper * exports.SCALE);
    if (Math.abs(p.lower * exports.SCALE - lo) > 1e-6 || Math.abs(p.upper * exports.SCALE - hi) > 1e-6) {
        throw new Error(`non-2dp band bound: ${JSON.stringify(p)}`);
    }
    const inBand = Math.max(0, Math.min(exports.RANGE, hi) - Math.max(0, lo));
    return p.inverted ? exports.RANGE - inBand : inBand;
}
function discreteWinProbability(p) {
    return discreteWinCount(p) / exports.RANGE;
}
function diceWin(roll, p) {
    const inBand = roll >= p.lower && roll < p.upper;
    return p.inverted ? !inBand : inBand;
}
function effectiveEdge(p) {
    return 1 - discreteWinProbability(p) * quotedMultiplier(p);
}
function effectiveEdgeIsExact(p) {
    const bps = payoutBasisPoints(p);
    if (bps <= 0)
        return false;
    if (!Number.isInteger(exports.PAYOUT_NUMERATOR))
        return false;
    return 100 * discreteWinCount(p) * exports.PAYOUT_NUMERATOR === (exports.PAYOUT_NUMERATOR / 100) * exports.RANGE * bps;
}
function theoreticalRTP(p) {
    return discreteWinProbability(p) * quotedMultiplier(p);
}
function servedRollMatches(served, recomputed) {
    if (!Number.isFinite(served) || !Number.isFinite(recomputed))
        return false;
    const units = Math.round(served * exports.SCALE);
    if (units / exports.SCALE !== served)
        return false;
    if (units < 0 || units >= exports.RANGE)
        return false;
    return served === recomputed;
}
function round8(x) {
    return Math.round(x * 1e8) / 1e8;
}
const UNITS_PER_WHOLE = 100000000n;
const HALF_UNIT = 50000000n;
function creditResidualSign(credit, stake, p) {
    const bps = payoutBasisPoints(p);
    if (bps <= 0)
        return 0;
    const [cn, cd] = decimalFraction(credit);
    const [sn, sd] = decimalFraction(stake);
    const num = BigInt(exports.PAYOUT_NUMERATOR);
    const lhs = cn * sd * BigInt(bps);
    const rhs = sn * cd * num;
    return lhs < rhs ? -1 : lhs > rhs ? 1 : 0;
}
function creditResidual(credit, stake, p) {
    const bps = payoutBasisPoints(p);
    if (bps <= 0)
        return 0;
    const [cn, cd] = decimalFraction(credit);
    const [sn, sd] = decimalFraction(stake);
    const num = BigInt(exports.PAYOUT_NUMERATOR);
    const rn = cn * sd * BigInt(bps) - sn * num * cd;
    const rd = cd * sd * BigInt(bps);
    return Number(rn) / Number(rd);
}
function decimalFraction(x) {
    const s = typeof x === 'string' ? x.trim() : String(x);
    const m = /^(-?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(s);
    if (!m)
        throw new Error(`decimalFraction: not a decimal literal: ${s}`);
    const sign = m[1] === '-' ? -1n : 1n;
    const intPart = m[2] || '0';
    const fracPart = m[3] || '';
    const exp = m[4] ? Number(m[4]) : 0;
    let n = sign * BigInt(intPart + fracPart);
    let d = 10n ** BigInt(fracPart.length);
    if (exp > 0)
        n *= 10n ** BigInt(exp);
    else if (exp < 0)
        d *= 10n ** BigInt(-exp);
    return [n, d];
}
function settledCreditUnits(stake, multiplier) {
    const stakeUnits = BigInt(Math.round(stake * 1e8));
    const multUnits = BigInt(Math.round(multiplier * 1e8));
    const product = stakeUnits * multUnits;
    let q = product / UNITS_PER_WHOLE;
    const r = product % UNITS_PER_WHOLE;
    if (r > HALF_UNIT)
        q += 1n;
    else if (r === HALF_UNIT && (q % 2n) === 1n)
        q += 1n;
    return q;
}
function settledCredit(stake, multiplier) {
    const units = settledCreditUnits(stake, multiplier);
    if (units > BigInt(Number.MAX_SAFE_INTEGER)) {
        throw new Error(`settledCredit: ${units} units exceeds exact double range — use settledCreditUnits`);
    }
    return Number(units) / 1e8;
}
function isSettlementTie(stake, multiplier) {
    const product = BigInt(Math.round(stake * 1e8)) * BigInt(Math.round(multiplier * 1e8));
    return product % UNITS_PER_WHOLE === HALF_UNIT;
}
function bandMode(p) {
    if (p.inverted)
        return 'outside';
    if (p.lower === 0)
        return 'under';
    if (p.upper === 100)
        return 'over';
    return 'inside';
}

},
"src/diff.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flattenLeaves = flattenLeaves;
exports.fieldDiff = fieldDiff;
function flattenLeaves(value, prefix = '', out = new Map()) {
    if (value === null || typeof value !== 'object') {
        out.set(prefix, value);
        return out;
    }
    if (Array.isArray(value)) {
        if (value.length === 0)
            out.set(prefix, '<empty array>');
        value.forEach((v, i) => flattenLeaves(v, `${prefix}[${i}]`, out));
        return out;
    }
    const keys = Object.keys(value);
    if (keys.length === 0)
        out.set(prefix, '<empty object>');
    for (const k of keys)
        flattenLeaves(value[k], prefix ? `${prefix}.${k}` : k, out);
    return out;
}
function fieldDiff(committed, thisRun, ignore = []) {
    const a = flattenLeaves(committed);
    const b = flattenLeaves(thisRun);
    const skip = new Set(ignore);
    const paths = [...new Set([...a.keys(), ...b.keys()])].sort();
    const out = [];
    for (const p of paths) {
        if (skip.has(p))
            continue;
        const inA = a.has(p), inB = b.has(p);
        const va = inA ? a.get(p) : '<absent>';
        const vb = inB ? b.get(p) : '<absent>';
        if (!Object.is(va, vb))
            out.push({ path: p, committed: va, thisRun: vb });
    }
    return out;
}

},
"src/exact-chi2.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exactNull = exactNull;
exports.squareSum = squareSum;
exports.chi2FromSquareSum = chi2FromSquareSum;
exports.upperTailBySquareSum = upperTailBySquareSum;
exports.achievedSeedAlpha = achievedSeedAlpha;
exports.cherryFlagRate = cherryFlagRate;
const config_1 = require("./config");
const BINS = config_1.SIM_CHERRY_BINS;
const WINDOW = config_1.SIM_CHERRY_WINDOW;
function factorials(upTo) {
    const f = [1n];
    for (let i = 1; i <= upTo; i++)
        f.push(f[i - 1] * BigInt(i));
    return f;
}
function build() {
    const fact = factorials(Math.max(WINDOW, BINS));
    const counts = new Map();
    const parts = [];
    let partitions = 0;
    const rec = (remaining, maxPart, depth) => {
        if (remaining === 0) {
            partitions++;
            let s = 0;
            let denom = 1n;
            const multiplicity = new Map();
            for (let i = 0; i < depth; i++) {
                const v = parts[i];
                s += v * v;
                denom *= fact[v];
                multiplicity.set(v, (multiplicity.get(v) ?? 0) + 1);
            }
            multiplicity.set(0, BINS - depth);
            let arrangeDenom = 1n;
            for (const m of multiplicity.values())
                arrangeDenom *= fact[m];
            const ways = (fact[WINDOW] / denom) * (fact[BINS] / arrangeDenom);
            counts.set(s, (counts.get(s) ?? 0n) + ways);
            return;
        }
        if (depth === BINS)
            return;
        const hi = Math.min(remaining, maxPart);
        for (let v = hi; v >= 1; v--) {
            if (v * (BINS - depth) < remaining)
                break;
            parts[depth] = v;
            rec(remaining - v, v, depth + 1);
        }
    };
    rec(WINDOW, WINDOW, 0);
    const total = BigInt(BINS) ** BigInt(WINDOW);
    const support = [...counts.keys()].sort((a, b) => a - b);
    const totalNum = Number(total);
    const probability = support.map((s) => Number(counts.get(s)) / totalNum);
    const upperTail = new Array(support.length);
    let acc = 0;
    for (let i = support.length - 1; i >= 0; i--) {
        acc += probability[i];
        upperTail[i] = acc;
    }
    return { support, probability, upperTail, partitions };
}
let cached = null;
function exactNull() {
    if (!cached)
        cached = build();
    return cached;
}
function squareSum(draws) {
    const per = config_1.RANGE / BINS;
    const h = new Array(BINS).fill(0);
    for (const d of draws)
        h[Math.min(BINS - 1, Math.floor(d / per))]++;
    let s = 0;
    for (const v of h)
        s += v * v;
    return s;
}
function chi2FromSquareSum(s) {
    const e = WINDOW / BINS;
    return (s - (WINDOW * WINDOW) / BINS) / e;
}
function upperTailBySquareSum(s) {
    const { support, upperTail } = exactNull();
    let lo = 0, hi = support.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (support[mid] < s)
            lo = mid + 1;
        else
            hi = mid;
    }
    return lo < support.length ? upperTail[lo] : 0;
}
function achievedSeedAlpha() {
    const { support, upperTail } = exactNull();
    for (let i = 0; i < support.length; i++)
        if (upperTail[i] < config_1.SIM_CHERRY_SEED_ALPHA)
            return upperTail[i];
    return 0;
}
function cherryFlagRate() {
    const a = achievedSeedAlpha();
    return a * (1 - a);
}

},
"src/loader.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDataset = loadDataset;
exports.revealedSeedMap = revealedSeedMap;
exports.seedByEpoch = seedByEpoch;
exports.betsByEpoch = betsByEpoch;
exports.phaseBets = phaseBets;
const node_crypto_1 = require("node:crypto");
const node_fs_1 = require("node:fs");
function loadDataset(path, expectedSha256) {
    if (!(0, node_fs_1.existsSync)(path)) {
        console.error(`ERROR: dataset not found at ${path}`);
        process.exit(1);
    }
    const raw = (0, node_fs_1.readFileSync)(path);
    const sha256 = (0, node_crypto_1.createHash)('sha256').update(raw).digest('hex');
    if (expectedSha256 && sha256 !== expectedSha256) {
        console.error(`ERROR: dataset SHA-256 mismatch`);
        console.error(`  expected: ${expectedSha256}`);
        console.error(`  actual:   ${sha256}`);
        process.exit(1);
    }
    const parsed = JSON.parse(raw.toString('utf8'));
    return { ...parsed, sha256, path };
}
function revealedSeedMap(seeds) {
    const m = new Map();
    for (const s of seeds)
        m.set(s.hashedServerSeed, s);
    return m;
}
function seedByEpoch(seeds) {
    const m = new Map();
    for (const s of seeds)
        m.set(s.epoch, s);
    return m;
}
function betsByEpoch(bets) {
    const m = new Map();
    for (const b of bets) {
        const a = m.get(b.epoch);
        if (a)
            a.push(b);
        else
            m.set(b.epoch, [b]);
    }
    return m;
}
function phaseBets(bets, phase) {
    return bets.filter((b) => b.phase === phase);
}

},
"src/report-figures.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeReportFigures = computeReportFigures;
const config_1 = require("./config");
const exact_chi2_1 = require("./exact-chi2");
const stats_1 = require("./stats");
function computeReportFigures(bets, seeds) {
    const wins = bets.filter((b) => b.win);
    const edgeNum = BigInt(Math.round((1 - config_1.HOUSE_EDGE) * 1e8));
    let below = 0, above = 0, exact = 0, minRtp = Infinity, maxRtp = -Infinity;
    for (const b of bets) {
        const stakeUnits = BigInt(Math.round(Number(b.betAmount) * 1e8));
        const w = BigInt((0, config_1.discreteWinCount)(b.params));
        const creditUnits = (0, config_1.settledCreditUnits)(Number(b.betAmount), (0, config_1.quotedMultiplier)(b.params));
        const lhs = 100000000n * w * creditUnits;
        const rhs = edgeNum * BigInt(config_1.RANGE) * stakeUnits;
        if (lhs < rhs)
            below++;
        else if (lhs > rhs)
            above++;
        else
            exact++;
        const r = (Number(w) / config_1.RANGE) * (Number(creditUnits) / Number(stakeUnits));
        if (r < minRtp)
            minRtp = r;
        if (r > maxRtp)
            maxRtp = r;
    }
    let down = 0, up = 0, onProduct = 0, maxAbs = 0, net = 0, ties = 0;
    for (const b of wins) {
        const stake = Number(b.betAmount), mult = Number(b.multiplier);
        const sign = (0, config_1.creditResidualSign)(b.winningAmount, b.betAmount, b.params);
        if (sign < 0)
            down++;
        else if (sign > 0)
            up++;
        else
            onProduct++;
        const d = (0, config_1.creditResidual)(b.winningAmount, b.betAmount, b.params);
        net += d;
        if (Math.abs(d) > maxAbs)
            maxAbs = Math.abs(d);
        if ((0, config_1.isSettlementTie)(stake, mult))
            ties++;
    }
    const reachable = bets.filter((b) => Math.round(b.params.upper * config_1.SCALE) <= config_1.RANGE - 1).length;
    const upperHits = bets.filter((b) => Math.round(Number(b.roll) * config_1.SCALE) === Math.round(b.params.upper * config_1.SCALE)).length;
    const lowerHits = bets.filter((b) => Math.round(Number(b.roll) * config_1.SCALE) === Math.round(b.params.lower * config_1.SCALE)).length;
    let modelsDisagree = 0, okHalfOpen = 0, okInclusive = 0;
    for (const b of bets) {
        const roll = Number(b.roll), p = b.params;
        const inHalfOpen = roll >= p.lower && roll < p.upper;
        const inInclusive = roll >= p.lower && roll <= p.upper;
        const winHalfOpen = p.inverted ? !inHalfOpen : inHalfOpen;
        const winInclusive = p.inverted ? !inInclusive : inInclusive;
        if (winHalfOpen !== winInclusive)
            modelsDisagree++;
        if (winHalfOpen === !!b.win)
            okHalfOpen++;
        if (winInclusive === !!b.win)
            okInclusive++;
    }
    const p0 = (0, exact_chi2_1.cherryFlagRate)();
    let minRejectable = seeds.length + 1, pAtMin = 0;
    for (let k = 0; k <= seeds.length; k++) {
        const pk = (0, stats_1.binomialTailP)(seeds.length, k, p0);
        if (pk < config_1.ALPHA) {
            minRejectable = k;
            pAtMin = pk;
            break;
        }
    }
    const d = bets.filter((b) => b.phase === 'D');
    const dEpochs = [...new Set(d.map((b) => b.epoch))].sort((x, y) => x - y);
    let staked = 0, paid = 0, expected = 0, variance = 0;
    for (const b of d) {
        const s = Number(b.betAmount), m = (0, config_1.quotedMultiplier)(b.params), p = (0, config_1.discreteWinProbability)(b.params);
        staked += s;
        paid += Number(b.winningAmount);
        expected += s * p * m;
        variance += s * s * p * (1 - p) * m * m;
    }
    const wagered = bets.reduce((a, b) => a + Number(b.betAmount), 0);
    const returned = bets.reduce((a, b) => a + Number(b.winningAmount), 0);
    const meanRoll = bets.reduce((a, b) => a + Number(b.roll), 0) / bets.length;
    return {
        bets: bets.length,
        wins: wins.length,
        settledRtp: {
            belowNominal: below, aboveNominal: above, exactlyNominal: exact,
            minPct: minRtp * 100, maxPct: maxRtp * 100, nominalPct: (1 - config_1.HOUSE_EDGE) * 100,
            anyAtOrAbove100: maxRtp >= 1,
        },
        settlementResidual: {
            roundedDown: down, roundedUp: up, exactlyOnProduct: onProduct,
            maxAbsUsdc: maxAbs, netUsdc: net, exactTies: ties,
        },
        boundary: {
            betsWithReachableUpperBound: reachable,
            betsWithUnreachableUpperBound: bets.length - reachable,
            expectedUpperBoundHits: reachable / config_1.RANGE,
            observedUpperBoundHits: upperHits,
            observedLowerBoundHits: lowerHits,
            betsWhereBoundaryModelsDisagree: modelsDisagree,
            winFlagsReproducedHalfOpen: okHalfOpen,
            winFlagsReproducedInclusiveBothEnds: okInclusive,
        },
        cherryPickPower: {
            seeds: seeds.length, nullFlagRate: p0, expectedFlags: seeds.length * p0,
            minRejectableFlags: minRejectable, pAtMinRejectable: pAtMin,
            alpha: config_1.ALPHA, seedAlphaNominal: config_1.SIM_CHERRY_SEED_ALPHA,
        },
        phaseD: {
            firstEpoch: dEpochs[0], lastEpoch: dEpochs[dEpochs.length - 1], epochs: dEpochs.length,
            bets: d.length, stakedUsdc: staked, paidUsdc: paid, expectedUsdc: expected,
            z: (paid - expected) / Math.sqrt(variance),
        },
        live: { wageredUsdc: wagered, returnedUsdc: returned, realizedRtpPct: (returned / wagered) * 100, meanRoll },
    };
}

},
"src/rng.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitHash = commitHash;
exports.sha256Buffer = sha256Buffer;
exports.getProvablyFairHmacSalt = getProvablyFairHmacSalt;
exports.generateProvablyFairNumber = generateProvablyFairNumber;
exports.diceRoll = diceRoll;
const node_crypto_1 = require("node:crypto");
const config_1 = require("./config");
function commitHash(serverSeedHexString) {
    return (0, node_crypto_1.createHash)('sha256').update(serverSeedHexString, 'utf8').digest('hex');
}
function sha256Buffer(buf) {
    return (0, node_crypto_1.createHash)('sha256').update(buf).digest('hex');
}
function getProvablyFairHmacSalt(clientSeed, nonce, cursor) {
    return `${clientSeed}:${nonce}:${cursor}`;
}
function generateProvablyFairNumber(serverSeed, clientSeed, nonce, cursor, range) {
    const key = Buffer.from(serverSeed, 'hex');
    const digest = (0, node_crypto_1.createHmac)('sha256', key).update(getProvablyFairHmacSalt(clientSeed, nonce, cursor)).digest();
    const maxFair = Math.floor(4294967296 / range) * range;
    for (let offset = 0; offset + 4 <= digest.length; offset += 4) {
        const chunk = digest.readUInt32BE(offset);
        if (chunk < maxFair)
            return chunk % range;
    }
    return generateProvablyFairNumber(serverSeed, clientSeed, nonce, cursor + 1000000, range);
}
function diceRoll(serverSeed, clientSeed, nonce) {
    return generateProvablyFairNumber(serverSeed, clientSeed, nonce, config_1.CURSOR, config_1.RANGE) / config_1.SCALE;
}

},
"src/runtime.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALIDATED_RUNTIME = exports.SUPPORTED_NODE_MAJOR = void 0;
exports.nodeMajor = nodeMajor;
exports.isSupportedRuntime = isSupportedRuntime;
exports.unsupportedRuntimeMessage = unsupportedRuntimeMessage;
exports.assertSupportedRuntime = assertSupportedRuntime;
exports.SUPPORTED_NODE_MAJOR = 22;
exports.VALIDATED_RUNTIME = 'Node.js v22.23.1';
function nodeMajor(version = process.versions.node) {
    return Number(version.split('.')[0]);
}
function isSupportedRuntime(version = process.versions.node) {
    return nodeMajor(version) === exports.SUPPORTED_NODE_MAJOR;
}
function unsupportedRuntimeMessage(version = process.versions.node) {
    return [
        '',
        '══════════════════════════════════════════════════════════',
        '  UNSUPPORTED RUNTIME — verification refused',
        '══════════════════════════════════════════════════════════',
        `  Running on   : Node v${version}`,
        `  Supported    : Node ${exports.SUPPORTED_NODE_MAJOR}.x`,
        `  Validated on : ${exports.VALIDATED_RUNTIME}`,
        '',
        '  This suite compares stored statistics against recomputation with exact equality.',
        '  Statistical functions can differ in their final bits across runtime versions.',
        '  Use the supported runtime to reproduce these exact comparisons.',
        '',
        `  Install Node ${exports.SUPPORTED_NODE_MAJOR}.x and re-run. Nothing was written; no evidence was touched.`,
        '══════════════════════════════════════════════════════════',
        '',
    ].join('\n');
}
function assertSupportedRuntime() {
    if (isSupportedRuntime())
        return;
    console.error(unsupportedRuntimeMessage());
    process.exit(1);
}

},
"src/sim-checks.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FAMILY_WISE_BOUND = exports.STEP_16_BOUND = exports.SCORED_STATISTICAL_PREDICATES = exports.RECONSTRUCTION_MAX_WINS = exports.RECONSTRUCTION_MAX_RESIDUAL = exports.SIM_SCHEMA_VERSION = void 0;
exports.reconstructReturn = reconstructReturn;
exports.reconstructionTolerance = reconstructionTolerance;
exports.recoverWinCount = recoverWinCount;
exports.convergenceSE = convergenceSE;
exports.validateConvergenceSeries = validateConvergenceSeries;
exports.runsStatistic = runsStatistic;
exports.SIM_SCHEMA_VERSION = 2;
exports.RECONSTRUCTION_MAX_RESIDUAL = 0.25;
exports.RECONSTRUCTION_MAX_WINS = 50000000;
function reconstructReturn(wins, multiplier) {
    let won = 0;
    for (let k = 0; k < wins; k++)
        won += multiplier;
    return won;
}
function reconstructionTolerance(wins) {
    const derived = wins * (wins + 2) * Number.EPSILON;
    const floor = 4 * Number.EPSILON * Math.max(1, wins);
    return Math.min(exports.RECONSTRUCTION_MAX_RESIDUAL, Math.max(derived, floor));
}
function recoverWinCount(rtp, n, multiplier, stored) {
    const fail = (reason, wins = NaN, residual = NaN, source = 'reconstructed', reconstructedRTP = NaN) => ({ ok: false, wins, residual, source, match: 'none', reconstructedRTP, reason });
    if (!Number.isFinite(rtp) || !Number.isFinite(n) || !Number.isFinite(multiplier))
        return fail('non-finite input');
    if (!Number.isInteger(n) || n <= 0)
        return fail(`sample size ${n} is not a positive integer`);
    if (!(multiplier > 0))
        return fail(`multiplier ${multiplier} is not positive`);
    if (rtp < 0)
        return fail(`rtp ${rtp} is negative`);
    const raw = (rtp * n) / multiplier;
    if (!Number.isFinite(raw))
        return fail('rtp·n/m is not finite');
    const wins = Math.round(raw);
    const residual = Math.abs(raw - wins);
    if (residual > exports.RECONSTRUCTION_MAX_RESIDUAL) {
        return fail(`rtp ${rtp} at n=${n} implies ${raw} wins, ${residual} from the nearest integer (cap ${exports.RECONSTRUCTION_MAX_RESIDUAL}) — no integer win count produces this RTP`, wins, residual);
    }
    if (wins < 0 || wins > n)
        return fail(`recovered win count ${wins} is outside [0, ${n}]`, wins, residual);
    if (wins > exports.RECONSTRUCTION_MAX_WINS) {
        return fail(`recovered win count ${wins} is past the depth (${exports.RECONSTRUCTION_MAX_WINS}) at which this reconstruction is defined — a deeper artifact must store its counts (schema ${exports.SIM_SCHEMA_VERSION})`, wins, residual);
    }
    const reconstructedReturn = reconstructReturn(wins, multiplier);
    const reconstructedRTP = reconstructedReturn / n;
    const tol = reconstructionTolerance(wins);
    const match = reconstructedRTP === rtp
        ? 'exact'
        : (residual <= tol ? 'bounded' : 'none');
    if (match === 'none') {
        return fail(`rtp ${rtp} at n=${n} implies ${raw} wins; the candidate integer count ${wins} reconstructs to `
            + `${reconstructedRTP} (return ${reconstructedReturn} over ${n} bets), ${residual} wins away and outside `
            + `the derived arithmetic tolerance ${tol} — no integer win count produces this RTP`, wins, residual, 'reconstructed', reconstructedRTP);
    }
    const how = match === 'exact'
        ? `count ${wins} reconstructs EXACTLY to the published RTP (return ${reconstructedReturn} over ${n} bets)`
        : `count ${wins} reconstructs to ${reconstructedRTP}, ${residual} wins from the published RTP — inside the derived tolerance ${tol}`;
    if (stored !== undefined) {
        if (typeof stored !== 'number' || !Number.isInteger(stored)) {
            return fail(`stored win count ${JSON.stringify(stored)} is not an integer`, wins, residual, 'stored', reconstructedRTP);
        }
        if (stored < 0 || stored > n)
            return fail(`stored win count ${stored} is outside [0, ${n}]`, stored, residual, 'stored', reconstructedRTP);
        if (stored !== wins) {
            return fail(`stored win count ${stored} disagrees with the ${wins} the published RTP implies`, stored, residual, 'stored', reconstructedRTP);
        }
        return { ok: true, wins: stored, residual, source: 'stored', match, reconstructedRTP, reason: `stored count agrees with the RTP it is supposed to have produced — ${how}` };
    }
    return { ok: true, wins, residual, source: 'reconstructed', match, reconstructedRTP, reason: `reconstructed from rtp·n/m and verified — ${how}` };
}
function convergenceSE(n, rtp, wins, multiplier) {
    const p = wins / n;
    const varr = p * (multiplier - rtp) ** 2 + (1 - p) * (0 - rtp) ** 2;
    return Math.sqrt(varr / n);
}
function validateConvergenceSeries(points, multiplier, theoreticalRTP) {
    const out = [];
    const failures = [];
    let exactlyOnTheory = 0;
    let exactReconstructions = 0;
    let prevN = 0, prevWins = 0;
    for (const pt of points) {
        const typesOk = typeof pt?.n === 'number' && typeof pt?.rtp === 'number' && typeof pt?.se === 'number';
        const n = Number(pt?.n), rtp = Number(pt?.rtp), storedSE = Number(pt?.se);
        const rec = typesOk
            ? recoverWinCount(rtp, n, multiplier, pt?.wins)
            : { ok: false, wins: NaN, residual: NaN, source: 'reconstructed', match: 'none', reconstructedRTP: NaN, reason: `n/rtp/se must be JSON numbers (got ${typeof pt?.n}/${typeof pt?.rtp}/${typeof pt?.se})` };
        const onTheory = typesOk && rtp === theoreticalRTP;
        if (onTheory)
            exactlyOnTheory++;
        if (rec.ok && rec.match === 'exact')
            exactReconstructions++;
        let ok = rec.ok;
        let reason = rec.reason;
        if (ok) {
            if (!(n > prevN)) {
                ok = false;
                reason = `sample size ${n} does not exceed the previous checkpoint's ${prevN}`;
            }
            else if (rec.wins < prevWins) {
                ok = false;
                reason = `win count fell from ${prevWins} to ${rec.wins} between nested checkpoints`;
            }
            else if (rec.wins - prevWins > n - prevN) {
                ok = false;
                reason = `win count rose by ${rec.wins - prevWins} over only ${n - prevN} additional bets`;
            }
        }
        const expectedSE = ok ? convergenceSE(n, rtp, rec.wins, multiplier) : NaN;
        if (ok && !(Number.isFinite(storedSE) && storedSE === expectedSE)) {
            ok = false;
            reason = `stored SE ${storedSE} != ${expectedSE} recomputed from (n=${n}, rtp=${rtp}, wins=${rec.wins}, m=${multiplier})`;
        }
        if (!ok)
            failures.push(`n=${Number.isFinite(n) ? n : String(pt?.n)}: ${reason}`);
        out.push({ n, ok, wins: rec.wins, winSource: rec.source, winMatch: rec.match, expectedSE, storedSE, exactlyOnTheory: onTheory, reason });
        if (rec.ok) {
            prevN = n;
            prevWins = rec.wins;
        }
    }
    return { ok: failures.length === 0 && out.length > 0, points: out, exactlyOnTheory, exactReconstructions, failures };
}
function runsStatistic(runs, n1, n) {
    const n2 = n - n1;
    const expected = (2 * n1 * n2) / n + 1;
    const variance = (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1));
    const degenerate = !(variance > 0);
    const z = degenerate ? 0 : (runs - expected) / Math.sqrt(variance);
    return { expected, variance, z, degenerate };
}
exports.SCORED_STATISTICAL_PREDICATES = [
    { id: 'S1', step: 16, screen: 'Pass-1 draw uniformity χ², two-sided (upper: non-uniform; lower: too uniform)', size: 'α/3 = 3.333e-3' },
    { id: 'S2', step: 16, screen: 'Pass-1 lag-1 autocorrelation |z| vs the two-sided critical z', size: 'α/3 = 3.333e-3' },
    { id: 'S3', step: 16, screen: 'Pass-1 Wald–Wolfowitz runs test, two-sided', size: 'α/3 = 3.333e-3' },
    { id: 'S4', step: 16, screen: 'nine effective-edge bands, each |simRTP − theory| ≤ 5·SE + 1e-4', size: '≈5.73e-7 per band, ≈5.16e-6 over nine' },
    { id: 'S5', step: 16, screen: 'RTP-convergence final point within 5·SE + 1e-4 of theory', size: '≈5.73e-7' },
    { id: 'S6', step: 17, screen: 'cherry-pick flag count, exact one-sided binomial', size: '≤ α = 0.01 (discrete, achieved size below α)' },
    { id: 'S7', step: 17, screen: 'pooled real-roll uniformity χ², one-sided upper tail', size: 'α = 0.01' },
];
exports.STEP_16_BOUND = 0.01 + 9 * 5.733e-7 + 5.733e-7;
exports.FAMILY_WISE_BOUND = exports.STEP_16_BOUND + 0.01 + 0.01;

},
"src/stats.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.combination = combination;
exports.binomialTailP = binomialTailP;
exports.regularizedGamma = regularizedGamma;
exports.logGamma = logGamma;
exports.chiSquaredPValue = chiSquaredPValue;
exports.chiSquaredTest = chiSquaredTest;
exports.lag1Autocorrelation = lag1Autocorrelation;
exports.runsTest = runsTest;
exports.normalQuantile = normalQuantile;
exports.inverseCriticalZ = inverseCriticalZ;
exports.twoSidedNormalP = twoSidedNormalP;
function combination(n, k) {
    if (k < 0 || k > n)
        return 0;
    if (k === 0 || k === n)
        return 1;
    k = Math.min(k, n - k);
    let c = 1;
    for (let i = 0; i < k; i++) {
        c = (c * (n - i)) / (i + 1);
    }
    return c;
}
function binomialTailP(n, k, p) {
    if (k <= 0)
        return 1;
    if (k > n)
        return 0;
    let s = 0;
    for (let i = k; i <= n; i++)
        s += combination(n, i) * p ** i * (1 - p) ** (n - i);
    return Math.min(1, s);
}
function regularizedGamma(a, x) {
    if (x < 0 || a <= 0)
        return NaN;
    if (x === 0)
        return 0;
    const gln = logGamma(a);
    if (x < a + 1) {
        let ap = a;
        let sum = 1 / a;
        let del = sum;
        for (let n = 0; n < 200; n++) {
            ap += 1;
            del *= x / ap;
            sum += del;
            if (Math.abs(del) < Math.abs(sum) * 1e-14)
                break;
        }
        return sum * Math.exp(-x + a * Math.log(x) - gln);
    }
    else {
        let b = x + 1 - a;
        let c = 1 / 1e-300;
        let d = 1 / b;
        let h = d;
        for (let i = 1; i <= 200; i++) {
            const an = -i * (i - a);
            b += 2;
            d = an * d + b;
            if (Math.abs(d) < 1e-300)
                d = 1e-300;
            c = b + an / c;
            if (Math.abs(c) < 1e-300)
                c = 1e-300;
            d = 1 / d;
            const delta = d * c;
            h *= delta;
            if (Math.abs(delta - 1) < 1e-14)
                break;
        }
        return 1 - Math.exp(-x + a * Math.log(x) - gln) * h;
    }
}
function logGamma(x) {
    const c = [
        76.18009172947146, -86.50532032941677, 24.01409824083091,
        -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5,
    ];
    let y = x;
    let tmp = x + 5.5;
    tmp -= (x + 0.5) * Math.log(tmp);
    let ser = 1.000000000190015;
    for (let j = 0; j < 6; j++)
        ser += c[j] / ++y;
    return -tmp + Math.log((2.5066282746310005 * ser) / x);
}
function chiSquaredPValue(chiSq, df) {
    return 1 - regularizedGamma(df / 2, chiSq / 2);
}
function chiSquaredTest(observed, expected) {
    if (observed.length !== expected.length)
        throw new Error('length mismatch');
    const obs = [...observed];
    const exp = [...expected];
    while (obs.length > 2 && exp[0] < 5) {
        obs[1] += obs[0];
        exp[1] += exp[0];
        obs.shift();
        exp.shift();
    }
    while (obs.length > 2 && exp[exp.length - 1] < 5) {
        const n = obs.length;
        obs[n - 2] += obs[n - 1];
        exp[n - 2] += exp[n - 1];
        obs.pop();
        exp.pop();
    }
    let chi2 = 0;
    for (let i = 0; i < obs.length; i++) {
        if (exp[i] > 0)
            chi2 += (obs[i] - exp[i]) ** 2 / exp[i];
    }
    const df = obs.length - 1;
    return { chi2, df, pValue: chiSquaredPValue(chi2, df) };
}
function lag1Autocorrelation(series) {
    const n = series.length;
    let mean = 0;
    for (let i = 0; i < n; i++)
        mean += series[i];
    mean /= n;
    let num = 0, den = 0;
    for (let i = 0; i < n - 1; i++)
        num += (series[i] - mean) * (series[i + 1] - mean);
    for (let i = 0; i < n; i++)
        den += (series[i] - mean) ** 2;
    return den === 0 ? 0 : num / den;
}
function runsTest(series) {
    const n = series.length;
    let n1 = 0, runs = 1;
    let prev = series[0];
    if (prev === 1)
        n1++;
    for (let i = 1; i < n; i++) {
        if (series[i] === 1)
            n1++;
        if (series[i] !== prev) {
            runs++;
            prev = series[i];
        }
    }
    const n2 = n - n1;
    const expected = (2 * n1 * n2) / n + 1;
    const varRuns = (2 * n1 * n2 * (2 * n1 * n2 - n)) / (n * n * (n - 1));
    const z = varRuns > 0 ? (runs - expected) / Math.sqrt(varRuns) : 0;
    const pValue = 2 * (1 - normalCDF(Math.abs(z)));
    return { runs, expected, z, pValue, n, n1, variance: varRuns };
}
function normalQuantile(p) {
    if (!(p > 0 && p < 1))
        return NaN;
    const q = p - 0.5;
    let r;
    if (Math.abs(q) <= 0.425) {
        r = 0.180625 - q * q;
        return q * (((((((2509.0809287301226727 * r + 33430.575583588128105) * r + 67265.770927008700853) * r + 45921.953931549871457) * r + 13731.693765509461125) * r + 1971.5909503065514427) * r + 133.14166789178437745) * r + 3.387132872796366608)
            / (((((((5226.495278852545925 * r + 28729.085735721942674) * r + 39307.89580009271061) * r + 21213.794301586595867) * r + 5394.1960214247511077) * r + 687.1870074920579083) * r + 42.313330701600911252) * r + 1);
    }
    r = q < 0 ? p : 1 - p;
    r = Math.sqrt(-Math.log(r));
    let val;
    if (r <= 5) {
        r -= 1.6;
        val = (((((((7.7454501427834140764e-4 * r + 0.0227238449892691845833) * r + 0.24178072517745061177) * r + 1.27045825245236838258) * r + 3.64784832476320460504) * r + 5.7694972214606914055) * r + 4.6303378461565452959) * r + 1.42343711074968357734)
            / (((((((1.05075007164441684324e-9 * r + 5.475938084995344946e-4) * r + 0.0151986665636164571966) * r + 0.14810397642748007459) * r + 0.68976733498510000455) * r + 1.6763848301838038494) * r + 2.05319162663775882187) * r + 1);
    }
    else {
        r -= 5;
        val = (((((((2.01033439929228813265e-7 * r + 2.71155556874348757815e-5) * r + 0.0012426609473880784386) * r + 0.026532189526576123093) * r + 0.29656057182850489123) * r + 1.7848265399172913358) * r + 5.4637849111641143699) * r + 6.6579046435011037772)
            / (((((((2.04426310338993978564e-15 * r + 1.4215117583164458887e-7) * r + 1.8463183175100546818e-5) * r + 7.868691311456132591e-4) * r + 0.0148753612908506148525) * r + 0.13692988092273580531) * r + 0.59983220655588793769) * r + 1);
    }
    return q < 0 ? -val : val;
}
function inverseCriticalZ(alpha) {
    return -normalQuantile(alpha / 2);
}
function normalCDF(z) {
    return 0.5 * (1 + erf(z / Math.SQRT2));
}
function twoSidedNormalP(z) {
    return 2 * (1 - normalCDF(Math.abs(z)));
}
function erf(x) {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t
        - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return Math.sign(x) * y;
}

},
"tests/steps/anti-circularity.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
function enumCount(p) {
    let c = 0;
    for (let d = 0; d < config_1.RANGE; d++)
        if ((0, config_1.diceWin)(d / config_1.SCALE, p))
            c++;
    return c;
}
function run(ctx) {
    const { bets, seedMap } = ctx;
    const b = bets.find(x => seedMap.has(x.hashedServerSeed));
    const ss = seedMap.get(b.hashedServerSeed);
    const trueRoll = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce);
    const corrupted = (trueRoll + 1) % 100;
    const accepts = (roll) => (0, config_1.servedRollMatches)(roll, trueRoll);
    const negControlRejects = accepts(trueRoll) && !accepts(corrupted) && !accepts(NaN);
    const p = (0, config_1.discreteWinProbability)(b.params);
    const m = (0, config_1.quotedMultiplier)(b.params);
    const arithmeticOnly = Number.isFinite(p) && Number.isFinite(m);
    const distinct = new Map();
    for (const bet of bets) {
        distinct.set(`${bet.params.lower}|${bet.params.upper}|${bet.params.inverted}`, bet.params);
    }
    let tallyMismatches = 0;
    let firstMismatch = '';
    for (const params of distinct.values()) {
        if ((0, config_1.discreteWinCount)(params) !== enumCount(params)) {
            tallyMismatches++;
            if (!firstMismatch) {
                firstMismatch = `${JSON.stringify(params)}: closed-form ${(0, config_1.discreteWinCount)(params)} vs tally ${enumCount(params)}`;
            }
        }
    }
    const s13 = (0, context_1.step)(13, 'Anti-Circularity (Negative Control + Enumeration Anchor)', negControlRejects && arithmeticOnly && tallyMismatches === 0 ? 'PASS' : 'FAIL', `theoretical win-prob/multiplier derived from grid arithmetic only (no operator odds field read); `
        + `negative control: a corrupted roll is REJECTED by the same predicate Step 5 uses (${negControlRejects ? 'falsifiable' : 'VACUOUS'}); `
        + `closed-form win count vs literal 10,000-point tally: ${distinct.size} distinct bands, `
        + `${tallyMismatches} mismatches${firstMismatch ? ` — first: ${firstMismatch}` : ''}`);
    return [s13];
}

},
"tests/steps/boundary.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const config_1 = require("../../src/config");
function run(ctx) {
    const { bets } = ctx;
    const maxRoll = Math.max(...bets.map(b => Number(b.roll)));
    const ceilingOk = Math.round(maxRoll * config_1.SCALE) <= config_1.RANGE - 1;
    const over99 = bets.filter(b => b.params.lower === 99 && b.params.upper === 100 && !b.params.inverted);
    const over99Expected = (1 - config_1.HOUSE_EDGE) * 10000 / 100;
    const over99MultOk = over99.every(b => (0, config_1.quotedMultiplier)(b.params) === over99Expected);
    const over99Edge = over99.length ? (0, config_1.effectiveEdge)(over99[0].params) : NaN;
    const maxMultSeen = Math.max(...bets.map(b => (0, config_1.quotedMultiplier)(b.params)));
    const allWithinCeiling = bets.every(b => (0, config_1.quotedMultiplier)(b.params) <= config_1.MAX_ODDS);
    let minEdge = Infinity, maxEdge = -Infinity, favorable = 0, edgeRuleViolations = 0;
    let maxFloatDeparture = 0;
    const modeAgg = {};
    for (const b of bets) {
        const e = (0, config_1.effectiveEdge)(b.params);
        if (e < minEdge)
            minEdge = e;
        if (e > maxEdge)
            maxEdge = e;
        if (e < -1e-9)
            favorable++;
        if (!(0, config_1.effectiveEdgeIsExact)(b.params))
            edgeRuleViolations++;
        const dep = Math.abs(e - config_1.HOUSE_EDGE);
        if (dep > maxFloatDeparture)
            maxFloatDeparture = dep;
        const m = (0, config_1.bandMode)(b.params);
        (modeAgg[m] || (modeAgg[m] = { n: 0, sum: 0, min: Infinity, max: -Infinity }));
        const g = modeAgg[m];
        g.n++;
        g.sum += e;
        if (e < g.min)
            g.min = e;
        if (e > g.max)
            g.max = e;
    }
    const extreme = { lower: 99.99, upper: 100, inverted: false };
    const extremeOk = (0, config_1.effectiveEdgeIsExact)(extreme);
    const extremeFloatDeparture = Math.abs((0, config_1.effectiveEdge)(extreme) - config_1.HOUSE_EDGE);
    const modeStr = Object.entries(modeAgg)
        .map(([m, g]) => `${m} ${(g.sum / g.n * 100).toFixed(3)}% [${(g.min * 100).toFixed(3)}–${(g.max * 100).toFixed(3)}]`)
        .join('; ');
    const coverOk = bets.length > 0 && over99.length > 0 && Number.isFinite(over99Edge) && extremeOk;
    const pass = coverOk && ceilingOk && over99MultOk && allWithinCeiling && favorable === 0 && edgeRuleViolations === 0;
    const s15 = (0, context_1.step)(15, 'Odds Boundary & Effective Edge', pass ? 'PASS' : ((favorable > 0 || edgeRuleViolations > 0) ? 'FAIL' : 'FLAG'), `${bets.length} bets scanned (coverage ${coverOk ? 'ok' : 'FAIL — empty set or the extreme band failed the identity'}); roll ceiling ≤ 99.99 (max ${maxRoll}, ${ceilingOk ? 'ok' : 'EXCEEDED'}); over(99) pays exactly 99× at edge ${(over99Edge * 100).toFixed(4)}% (${over99.length} bets); `
        + `audit odds bound ${config_1.MAX_ODDS}× (E14 records acceptance of a losing bet); max multiplier in capture ${maxMultSeen}×; captured odds within audit bound: ${allWithinCeiling}; winning settlement at ${config_1.MAX_ODDS}× and rejection above it remain unverified; `
        + `per-bet effective edge == 1.0000% asserted in EXACT INTEGERS (100·winCount·${config_1.PAYOUT_NUMERATOR} === ${config_1.PAYOUT_NUMERATOR / 100}·${config_1.RANGE}·basisPoints, no tolerance) on ${bets.length - edgeRuleViolations}/${bets.length} bets (${edgeRuleViolations} rule violations); `
        + `the float form of the same quantity departs from 0.01 by up to ${maxFloatDeparture.toExponential(2)} across the capture and ${extremeFloatDeparture.toExponential(2)} at the un-sampled 9900× extreme (upper 100 − lower 99.99 in binary64), which is why the assertion is integral; `
        + `Conditional analytical identity under the uniform-roll and half-open win model. E13 records two discriminating endpoint probes; no captured settlement discriminates the upper-bound rules. See AUDIT_CONTEXT.md §11, L2, L3 and L7; `
        + `modeled effective edge spans ${(minEdge * 100).toFixed(3)}%–${(maxEdge * 100).toFixed(3)}%, modeled player-favourable bands ${favorable}; `
        + `by mode: ${modeStr}`);
    return [s15];
}

},
"tests/steps/commitment.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
function run(ctx) {
    const { seeds, byHash, bets, seedMap } = ctx;
    let checked = 0, fails = 0;
    for (const s of seeds) {
        if (!s.serverSeed)
            continue;
        if ((0, rng_1.commitHash)(s.serverSeed) !== s.hashedServerSeed)
            fails++;
        checked++;
    }
    const s1 = (0, context_1.step)(1, 'Seed Hash Integrity', fails === 0 && checked === seeds.length ? 'PASS' : 'FAIL', `${checked}/${seeds.length} revealed seeds checked; SHA-256(utf8(serverSeed)) == hashedServerSeed; ${fails} mismatches`);
    const byEpoch = [...seeds].sort((a, b) => a.epoch - b.epoch);
    let promoChecked = 0, promoFails = 0;
    for (let i = 0; i + 1 < byEpoch.length; i++) {
        promoChecked++;
        if (byEpoch[i].nextHashedServerSeed !== byEpoch[i + 1].hashedServerSeed)
            promoFails++;
    }
    const expectedTransitions = seeds.length - 1;
    const pre = ctx.meta.preCapture;
    const epoch0 = byEpoch[0];
    let preState;
    let preOk = false;
    if (!pre || !pre.hashedServerSeed || !pre.revealedServerSeed || !pre.nextHashedServerSeed) {
        preState = 'no meta.preCapture record — epoch 0\'s commitment has no pre-capture witness';
    }
    else {
        const preCommitOk = (0, rng_1.commitHash)(pre.revealedServerSeed) === pre.hashedServerSeed;
        const preLinkOk = pre.nextHashedServerSeed === epoch0?.hashedServerSeed;
        preOk = preCommitOk && preLinkOk;
        preState = preOk
            ? 'pre-capture seed hash and link to epoch zero verified; pre-bet timing is conditional on auditor-attested chronology (AUDIT_CONTEXT.md §11, L18)'
            : `pre-capture link BROKEN (commitment ${preCommitOk ? 'ok' : 'MISMATCH'}, link to epoch 0 ${preLinkOk ? 'ok' : 'MISMATCH'})`;
    }
    const s2 = (0, context_1.step)(2, 'Next-Seed Pre-Commitment Chain', promoFails === 0 && promoChecked === expectedTransitions && preOk ? 'PASS' : 'FAIL', (promoFails === 0
        ? `${promoChecked}/${expectedTransitions} transitions: nextHashedServerSeed == next epoch's hashedServerSeed (chain INTACT)`
        : `${promoChecked - promoFails}/${expectedTransitions} match; ${promoFails} mismatch`)
        + `; ${preState}`);
    const betsByEpoch = new Map();
    for (const b of bets) {
        const arr = betsByEpoch.get(b.epoch) ?? [];
        arr.push(b);
        betsByEpoch.set(b.epoch, arr);
    }
    let epochsMultipleHashes = 0;
    for (const [, epochBets] of betsByEpoch) {
        const hashes = new Set(epochBets.map(b => b.hashedServerSeed));
        if (hashes.size !== 1)
            epochsMultipleHashes++;
    }
    const s3CoverageOk = betsByEpoch.size === seeds.length;
    const s3 = (0, context_1.step)(3, 'Hash Consistency Within Epoch', epochsMultipleHashes === 0 && s3CoverageOk ? 'PASS' : 'FAIL', `${betsByEpoch.size}/${seeds.length} epochs: all bets within each epoch share the same hashedServerSeed; ${epochsMultipleHashes} violations`);
    const hardFailures = [];
    const disclosedGaps = [];
    let epochsChecked = 0;
    let trailingAuditorRecorded = false;
    for (const [hash, epochBets] of byHash) {
        const sorted = [...epochBets].sort((a, b) => a.nonce - b.nonce);
        const nonces = sorted.map(b => b.nonce);
        const epochNum = sorted[0].epoch;
        const phase = sorted[0].phase;
        const clientSeeds = new Set(sorted.map(b => b.clientSeed));
        if (clientSeeds.size !== 1)
            hardFailures.push(`Epoch ${epochNum}: ${clientSeeds.size} distinct client seeds`);
        const nonceSet = new Set(nonces);
        const minNonce = Math.min(...nonces);
        const maxNonce = Math.max(...nonces);
        if (nonceSet.size !== nonces.length) {
            hardFailures.push(`Epoch ${epochNum}: nonce reuse — ${nonces.length} bets but only ${nonceSet.size} distinct nonces`);
        }
        const missing = [];
        for (let n = minNonce; n <= maxNonce; n++)
            if (!nonceSet.has(n))
                missing.push(n);
        const seedEntry = seeds.find(s => s.hashedServerSeed === hash);
        if (!seedEntry) {
            hardFailures.push(`Epoch ${epochNum}: no seed entry for hash ${hash.slice(0, 12)}…`);
        }
        else {
            if (seedEntry.nonceStart != null && minNonce !== seedEntry.nonceStart) {
                hardFailures.push(`Epoch ${epochNum}: first observed nonce ${minNonce} != operator post-rotation nonce ${seedEntry.nonceStart} (leading bets withheld?)`);
            }
            if (epochBets.length !== config_1.EXPECTED_EPOCH_SIZE) {
                hardFailures.push(`Epoch ${epochNum}: ${epochBets.length} bets != audited epoch size ${config_1.EXPECTED_EPOCH_SIZE} (src/config.ts)`);
            }
            if (ctx.meta.epochSize !== config_1.EXPECTED_EPOCH_SIZE) {
                hardFailures.push(`Epoch ${epochNum}: dataset header epochSize ${ctx.meta.epochSize} != audited epoch size ${config_1.EXPECTED_EPOCH_SIZE}`);
            }
            if (seedEntry.operatorBetCount != null) {
                if (maxNonce !== seedEntry.operatorBetCount - 1) {
                    hardFailures.push(`Epoch ${epochNum}: last observed nonce ${maxNonce} != operator bet count ${seedEntry.operatorBetCount} - 1 (trailing bets withheld?)`);
                }
            }
            else {
                if (seedEntry.nonceEnd != null && maxNonce !== seedEntry.nonceEnd) {
                    hardFailures.push(`Epoch ${epochNum}: record inconsistent, max nonce ${maxNonce} != recorded nonceEnd ${seedEntry.nonceEnd}`);
                }
                trailingAuditorRecorded = true;
            }
        }
        if (missing.length > 0) {
            const ss = seedMap.get(hash);
            let allVerify = ss !== undefined;
            if (ss) {
                for (const b of sorted) {
                    const served = Number(b.roll);
                    const local = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce);
                    if (!(0, config_1.servedRollMatches)(served, local)) {
                        allVerify = false;
                        break;
                    }
                }
            }
            if (allVerify)
                disclosedGaps.push(`epoch ${epochNum} (Phase ${phase}), nonce ${missing.join(',')} orphaned; all recorded bets verify`);
            else
                hardFailures.push(`Epoch ${epochNum}: unverifiable nonce gap at ${missing.join(',')}`);
        }
        epochsChecked++;
    }
    if (epochsChecked !== seeds.length)
        hardFailures.push(`coverage: audited ${epochsChecked}/${seeds.length} epochs`);
    let s4status;
    let s4detail;
    if (hardFailures.length > 0) {
        s4status = 'FAIL';
        s4detail = `${hardFailures.length} violations: ${hardFailures.slice(0, 3).join('; ')}`;
    }
    else if (disclosedGaps.length > 0) {
        s4status = 'PASS';
        s4detail = `${epochsChecked} epochs: single client seed each, nonces contiguous; ${disclosedGaps.length} disclosed capture-retry gap (${disclosedGaps.join('; ')}).`;
    }
    else {
        s4status = 'PASS';
        s4detail = `${epochsChecked} epochs: single client seed each, ${config_1.EXPECTED_EPOCH_SIZE} distinct contiguous nonces 0..${config_1.EXPECTED_EPOCH_SIZE - 1} (no interior gaps, no reuse); first nonce == nonceStart (capture default 0 — not operator-witnessed in this capture) in ${epochsChecked}/${seeds.length}; ${config_1.EXPECTED_EPOCH_SIZE}/${config_1.EXPECTED_EPOCH_SIZE} bets per epoch, epoch size bound to src/config.ts not to the dataset header (G-BIND); `
            + (trailingAuditorRecorded
                ? 'trailing bound is auditor-recorded; no operator end counter was retained (AUDIT_CONTEXT.md §11, L13)'
                : 'trailing bound operator-witnessed via operatorBetCount');
    }
    const s4 = (0, context_1.step)(4, 'Nonce Audit', s4status, s4detail);
    return [s1, s2, s3, s4];
}

},
"tests/steps/context.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.step = step;
function step(num, name, status, detail) {
    const tag = status === 'PASS' ? '[PASS]' : status === 'FLAG' ? '[FLAG]' : '[FAIL]';
    console.log(`  ${tag} Step ${num} — ${name}`);
    if (status !== 'PASS')
        console.log(`         ${detail}`);
    return { step: num, name, status, detail };
}

},
"tests/steps/dataset.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const config_1 = require("../../src/config");
function run(ctx) {
    const { bets, seeds, meta, datasetSha256, expectedDatasetHash } = ctx;
    const hashOk = datasetSha256 === expectedDatasetHash;
    const seed0Ok = seeds.length > 0 && seeds[0].serverSeed != null;
    const allRevealed = seeds.every(s => s.serverSeed != null);
    const betCountOk = bets.length === config_1.EXPECTED_BETS;
    const seedCountOk = seeds.length === config_1.EXPECTED_SEEDS;
    const perEpoch = new Map();
    for (const b of bets)
        perEpoch.set(b.epoch, (perEpoch.get(b.epoch) ?? 0) + 1);
    const epochsOk = perEpoch.size === config_1.EXPECTED_SEEDS
        && [...perEpoch.values()].every(n => n === config_1.EXPECTED_EPOCH_SIZE)
        && config_1.EXPECTED_SEEDS * config_1.EXPECTED_EPOCH_SIZE === config_1.EXPECTED_BETS;
    let nonceGaps = 0;
    const byEpochNonces = new Map();
    for (const b of bets) {
        let s = byEpochNonces.get(b.epoch);
        if (!s) {
            s = new Set();
            byEpochNonces.set(b.epoch, s);
        }
        s.add(b.nonce);
    }
    for (const [, ns] of byEpochNonces) {
        for (let i = 0; i < config_1.EXPECTED_EPOCH_SIZE; i++)
            if (!ns.has(i)) {
                nonceGaps++;
                break;
            }
    }
    const metaAgrees = meta.plannedTotal === config_1.EXPECTED_BETS && meta.epochSize === config_1.EXPECTED_EPOCH_SIZE;
    const countsOk = betCountOk && seedCountOk && epochsOk && nonceGaps === 0 && metaAgrees;
    const s11 = (0, context_1.step)(11, 'Dataset Integrity', hashOk && seed0Ok && allRevealed && countsOk ? 'PASS' : 'FAIL', `SHA-256 pin ${hashOk ? 'match' : 'MISMATCH'}; population bound to src/config.ts, NOT to the dataset header (G-BIND): `
        + `${bets.length}/${config_1.EXPECTED_BETS} bets (${betCountOk ? 'ok' : 'WRONG POPULATION'}), ${seeds.length}/${config_1.EXPECTED_SEEDS} seeds (${seedCountOk ? 'ok' : 'WRONG POPULATION'}), `
        + `${perEpoch.size} epochs × ${config_1.EXPECTED_EPOCH_SIZE} bets each (${epochsOk ? 'ok' : 'EPOCH SIZE/COUNT MISMATCH'}), ${nonceGaps} epoch(s) missing a nonce in 0..${config_1.EXPECTED_EPOCH_SIZE - 1}; `
        + `dataset header reconciles with those constants (meta.plannedTotal=${meta.plannedTotal}, meta.epochSize=${meta.epochSize}: ${metaAgrees ? 'ok' : 'DISAGREES'}); `
        + `seed[0].serverSeed ${seed0Ok ? 'present' : 'NULL'}; ${seeds.filter(s => s.serverSeed != null).length}/${seeds.length} seeds revealed (100% verifiable ${allRevealed ? 'yes' : 'NO'})`);
    const byPhase = {};
    for (const b of bets)
        byPhase[b.phase] = (byPhase[b.phase] || 0) + 1;
    const planOk = Object.entries(config_1.EXPECTED_PHASE_BETS).every(([k, n]) => byPhase[k] === n)
        && Object.keys(byPhase).every(k => k in config_1.EXPECTED_PHASE_BETS);
    const metaPhasesOk = Object.entries(config_1.EXPECTED_PHASE_BETS).every(([k, n]) => meta.phases?.[k]?.bets === n)
        && Object.keys(meta.phases ?? {}).every(k => k in config_1.EXPECTED_PHASE_BETS);
    const modes = new Set(bets.map(b => (0, config_1.bandMode)(b.params)));
    const modesOk = ['under', 'over', 'inside', 'outside'].every(m => modes.has(m));
    const stakes = new Set(bets.map(b => Number(b.betAmount)));
    const stakeOk = stakes.has(10) && stakes.has(0.1);
    const s12 = (0, context_1.step)(12, 'Phase & Mode Coverage', planOk && metaPhasesOk && modesOk && stakeOk ? 'PASS' : 'FAIL', `phases ${JSON.stringify(byPhase)} match the CODE plan ${JSON.stringify(config_1.EXPECTED_PHASE_BETS)} (${planOk}); dataset header meta.phases reconciles with it (${metaPhasesOk}); `
        + `all 4 modes present [${[...modes].join(',')}]; `
        + `stake-independence phases present ($10 and $0.10: ${stakeOk})`);
    return [s11, s12];
}

},
"tests/steps/determinism.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
function run(ctx) {
    const { bets, seedMap } = ctx;
    let checked = 0, mismatches = 0;
    let sample = '';
    for (const b of bets) {
        const ss = seedMap.get(b.hashedServerSeed);
        if (!ss)
            continue;
        const local = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce);
        const served = Number(b.roll);
        if (!(0, config_1.servedRollMatches)(served, local)) {
            mismatches++;
            if (!sample)
                sample = `epoch ${b.epoch} nonce ${b.nonce}: local ${local} vs served ${b.roll}`;
        }
        checked++;
    }
    const s5 = (0, context_1.step)(5, 'Roll Recomputation', mismatches === 0 && checked === bets.length ? 'PASS' : 'FAIL', mismatches === 0
        ? `${checked}/${bets.length} bets: diceRoll(serverSeed, clientSeed, nonce) == served roll (byte-identical)`
        : `${mismatches} mismatches (e.g. ${sample})`);
    let winChecked = 0, winFails = 0;
    for (const b of bets) {
        const ss = seedMap.get(b.hashedServerSeed);
        if (!ss)
            continue;
        const local = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce);
        if ((0, config_1.diceWin)(local, b.params) !== !!b.win)
            winFails++;
        winChecked++;
    }
    const s6 = (0, context_1.step)(6, 'Win-Rule Reproduction', winFails === 0 && winChecked === bets.length ? 'PASS' : 'FAIL', winFails === 0
        ? `${winChecked}/${bets.length} bets: recomputed roll ∈/∉ band reproduces the served win flag (inverted honoured)`
        : `${winFails} win-flag mismatches`);
    return [s5, s6];
}

},
"tests/steps/payouts.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const config_1 = require("../../src/config");
function run(ctx) {
    const { bets } = ctx;
    const numeratorIntegral = Number.isInteger(config_1.PAYOUT_NUMERATOR);
    let mChecked = 0, mFails = 0, maxDev = 0, closedFormAgrees = 0;
    for (const b of bets) {
        if (!b.win)
            continue;
        const bp = (0, config_1.payoutBasisPoints)(b.params);
        const served = config_1.PAYOUT_NUMERATOR / bp;
        const dev = Math.abs(Number(b.multiplier) - served);
        if (dev > maxDev)
            maxDev = dev;
        if (Number(b.multiplier) !== served)
            mFails++;
        if (Number(b.multiplier) === (0, config_1.quotedMultiplier)(b.params))
            closedFormAgrees++;
        mChecked++;
    }
    const s7 = (0, context_1.step)(7, 'Multiplier Derivation', mFails === 0 && mChecked > 0 && numeratorIntegral ? 'PASS' : 'FAIL', `${mChecked} winning bets: served multiplier == ${config_1.PAYOUT_NUMERATOR}/basisPoints, numerator derived as (1 − HOUSE_EDGE ${config_1.HOUSE_EDGE})·10000${numeratorIntegral ? '' : ' — NON-INTEGRAL, the derivation is unsound at this edge'} (bit-exact ===); max deviation ${maxDev.toExponential(2)}; ${mFails} mismatches. `
        + `basisPoints = round(winChance%·100) is AUDITOR-DERIVED — the field does not appear in the capture; `
        + `the float closed form (100/winChance%)·(1−edge) is the same rational but a different binary64, agreeing bit-for-bit on only ${closedFormAgrees}/${mChecked} of these wins`);
    let cChecked = 0, cFails = 0, cMaxDev = 0, cRawResidual = 0;
    let resBelow = 0, resAbove = 0, resExact = 0, resNet = 0, ties = 0;
    for (const b of bets) {
        const stake = Number(b.betAmount), win = Number(b.winningAmount);
        const expected = b.win ? (0, config_1.settledCredit)(stake, Number(b.multiplier)) : 0;
        const dev = Math.abs(win - expected);
        if (dev > cMaxDev)
            cMaxDev = dev;
        if (b.win) {
            const mult = Number(b.multiplier);
            const raw = Math.abs((0, config_1.creditResidual)(b.winningAmount, b.betAmount, b.params));
            if (raw > cRawResidual)
                cRawResidual = raw;
            resNet += (0, config_1.creditResidual)(b.winningAmount, b.betAmount, b.params);
            const sign = (0, config_1.creditResidualSign)(b.winningAmount, b.betAmount, b.params);
            if (sign < 0)
                resBelow++;
            else if (sign > 0)
                resAbove++;
            else
                resExact++;
            if ((0, config_1.isSettlementTie)(stake, mult))
                ties++;
        }
        if (dev !== 0)
            cFails++;
        cChecked++;
    }
    const wins = resBelow + resAbove + resExact;
    const s8 = (0, context_1.step)(8, 'Credit Arithmetic', cFails === 0 && cChecked === bets.length ? 'PASS' : 'FAIL', `${cChecked}/${bets.length} bets: winningAmount == ROUND_HALF_EVEN_8(stake × ROUND_8(multiplier)) exactly (loss ⇒ 0); ${cFails} mismatches; two-stage residual ${cMaxDev.toExponential(2)} (exact); `
        + `against the raw un-rounded product (decimal stake × exact 9900/basisPoints — the operator's own number system, not binary64) the settlement rounds the player DOWN on ${resBelow} and UP on ${resAbove} of ${wins} wins, and lands EXACTLY on the product on ${resExact} (no rounding at all), max |credit − stake×mult| ${cRawResidual.toExponential(2)}, net ${resNet >= 0 ? '+' : ''}${resNet.toExponential(2)} USDC — no directional bias; `
        + `${ties} of the ${wins} wins settle on an exact 8-dp tie, where the half-even rule decides the last unit`);
    let lChecked = 0, lFails = 0;
    for (const b of bets) {
        if (b.win)
            continue;
        lChecked++;
        if (Number(b.winningAmount) !== 0 || Number(b.multiplier) !== 0)
            lFails++;
    }
    const s9 = (0, context_1.step)(9, 'Loss Settlement', lFails === 0 && lChecked > 0 ? 'PASS' : 'FAIL', `${lChecked} losing bets: winningAmount == 0 and multiplier == 0; ${lFails} violations`);
    let wChecked = 0, wFails = 0, wLedgerFails = 0, boundFails = 0, wMissing = 0;
    let firstWalletFail = '';
    for (const b of bets) {
        const q = (0, config_1.quotedMultiplier)(b.params);
        if (q < config_1.MIN_ODDS || q > config_1.MAX_ODDS)
            boundFails++;
        if (b.stakeWallet == null || b.winningAmountWallet == null) {
            wMissing++;
            continue;
        }
        const expW = b.win ? (0, config_1.settledCredit)(Number(b.stakeWallet), Number(b.multiplier)) : 0;
        if (Number(b.winningAmountWallet) !== expW) {
            wFails++;
            if (!firstWalletFail)
                firstWalletFail = `epoch ${b.epoch} nonce ${b.nonce}: wallet credit ${b.winningAmountWallet} != settled ${expW}`;
        }
        if (Number(b.winningAmountWallet) !== Number(b.winningAmount) || Number(b.stakeWallet) !== Number(b.betAmount))
            wLedgerFails++;
        wChecked++;
    }
    const balanceLedgerRows = bets.filter((b) => b.balanceOk !== null
        && b.balanceOk !== undefined).length;
    const s10 = (0, context_1.step)(10, 'Wallet Credit & Odds Bounds', wFails === 0 && wLedgerFails === 0 && boundFails === 0 && wMissing === 0 && wChecked === bets.length ? 'PASS' : 'FAIL', `${wChecked}/${bets.length} bets (${wMissing} missing wallet fields): winningAmountWallet == ROUND_HALF_EVEN_8(stakeWallet × ROUND_8(multiplier)) exactly (${wFails} bad${firstWalletFail ? ` — first: ${firstWalletFail}` : ''}); `
        + `wallet ledger == game ledger (winningAmountWallet == winningAmount, stakeWallet == betAmount) on ${wChecked - wLedgerFails}/${wChecked} (${wLedgerFails} divergent); `
        + `all quoted multipliers within [${config_1.MIN_ODDS}, ${config_1.MAX_ODDS}] (${boundFails} out of range — the ${config_1.MAX_ODDS}× ceiling rests on the E14 live probe, not on this dataset: declared limitation L7); `
        + `wallet BALANCE ledger present on ${balanceLedgerRows}/${bets.length} bets (balanceOk null on ${bets.length - balanceLedgerRows}) — stakeWallet/winningAmountWallet are settle-RESPONSE fields, so this step establishes internal consistency with the formula, NOT what the wallet was credited: declared limitation L5 / R-CREDIT`);
    return [s7, s8, s9, s10];
}

},
"tests/steps/phase-d.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const context_1 = require("./context");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
function run(ctx) {
    const { phaseD, seedMap } = ctx;
    const custom = phaseD.filter(b => /^pfaudit-/.test(b.clientSeed));
    let checked = 0, fails = 0;
    for (const b of custom) {
        const ss = seedMap.get(b.hashedServerSeed);
        if (!ss)
            continue;
        const served = Number(b.roll);
        const local = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce);
        if (!(0, config_1.servedRollMatches)(served, local))
            fails++;
        checked++;
    }
    let sensitivityProbes = 0, sensitivityChanges = 0;
    for (const b of custom) {
        if (!seedMap.has(b.hashedServerSeed))
            continue;
        const ss = seedMap.get(b.hashedServerSeed);
        const r1 = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce);
        const r2 = (0, rng_1.diceRoll)(ss, b.clientSeed + 'x', b.nonce);
        sensitivityProbes++;
        if (r1 !== r2)
            sensitivityChanges++;
        if (sensitivityProbes >= 8)
            break;
    }
    const sensitivityOk = sensitivityProbes > 0 && sensitivityChanges > 0;
    const s14 = (0, context_1.step)(14, 'Custom Client-Seed Control', fails === 0 && checked > 0 && sensitivityOk ? 'PASS' : 'FAIL', `${checked}/${custom.length} custom-seed (pfaudit-) bets recompute exactly (${fails} fail); `
        + `client-seed sensitivity: a different client seed yields a different roll on ${sensitivityChanges}/${sensitivityProbes} probed bets (${sensitivityOk})`);
    return [s14];
}

},
"tests/steps/simulation.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_crypto_1 = require("node:crypto");
const context_1 = require("./context");
const stats_1 = require("../../src/stats");
const config_1 = require("../../src/config");
const exact_chi2_1 = require("../../src/exact-chi2");
const rng_1 = require("../../src/rng");
const sim_checks_1 = require("../../src/sim-checks");
const CHERRY_P0 = (0, exact_chi2_1.cherryFlagRate)();
function run(ctx) {
    const file = path.join(ctx.outputsDir, 'simulation-results.json');
    if (!fs.existsSync(file)) {
        ctx.simArtifact = null;
        return [
            (0, context_1.step)(16, 'Simulation — Pass 1 (RNG)', 'FLAG', 'outputs/simulation-results.json absent — run `npm run simulate`'),
            (0, context_1.step)(17, 'Simulation — Pass 2 (Cherry-Pick)', 'FLAG', 'simulation artifact absent'),
        ];
    }
    const raw = fs.readFileSync(file);
    const sim = JSON.parse(raw.toString('utf8'));
    ctx.simArtifact = { file: 'outputs/simulation-results.json', sha256: (0, node_crypto_1.createHash)('sha256').update(raw).digest('hex'), generatedAt: sim.generatedAt ?? null };
    const p1 = sim.pass1 ?? {};
    const modelOk = sim.model?.range === config_1.RANGE && sim.model?.houseEdge === config_1.HOUSE_EDGE
        && sim.model?.cursor === config_1.CURSOR && sim.model?.scale === config_1.SCALE;
    const uni = p1?.uniformity ?? {};
    const uniDepthOk = p1?.draws === config_1.SIM_UNIFORMITY_DRAWS && Number(uni.n) === config_1.SIM_UNIFORMITY_DRAWS
        && Number(uni.bins) === 100 && Number(uni.df) === 99;
    const uniP = (0, stats_1.chiSquaredPValue)(Number(uni.chi2), Number(uni.df));
    const uniTooUniform = uniP > 1 - config_1.ALPHA_SCREEN / 2;
    const uniNonUniform = uniP < config_1.ALPHA_SCREEN / 2;
    const uniPass = modelOk && uniDepthOk && Number.isFinite(Number(uni.chi2))
        && !uniNonUniform && !uniTooUniform
        && uni.pValue === uniP;
    const ser = p1?.serial ?? {};
    const zCrit = (0, stats_1.inverseCriticalZ)(config_1.ALPHA_SCREEN);
    const lag1 = Number(ser.lag1), lag1Z = Number(ser.lag1Z), runsZ = Number(ser.runsZ);
    const lag1ZDerived = lag1 * Math.sqrt(config_1.SIM_SERIAL_DRAWS);
    const runsPDerived = (0, stats_1.twoSidedNormalP)(runsZ);
    const schemaVersion = Number(sim.schemaVersion ?? 1);
    const schemaKnown = schemaVersion === 1 || schemaVersion === sim_checks_1.SIM_SCHEMA_VERSION;
    let runsNote;
    let runsStructureOk = true;
    if (schemaVersion >= 2) {
        const runsCount = Number(ser.runs), n1 = Number(ser.n1), nSer = Number(ser.n);
        const okCounts = Number.isInteger(runsCount) && Number.isInteger(n1) && Number.isInteger(nSer)
            && n1 >= 0 && n1 <= nSer && runsCount >= 1 && runsCount <= nSer;
        const rs = okCounts ? (0, sim_checks_1.runsStatistic)(runsCount, n1, nSer) : null;
        runsStructureOk = okCounts && !!rs && !rs.degenerate && rs.z === runsZ;
        runsNote = !okCounts
            ? 'runs cell counts (runs, n1, n) absent or out of range — schema 2 requires them'
            : rs.degenerate
                ? `runs variance is 0 (n1=${n1} of n=${nSer}) — every observation on one side of the split, so there is no runs distribution`
                : rs.z === runsZ
                    ? `runsZ RE-DERIVED from cell counts (runs=${runsCount}, n1=${n1}, n=${nSer}; variance ${rs.variance.toExponential(4)} > 0)`
                    : `runsZ ${runsZ} != ${rs.z} re-derived from cell counts (runs=${runsCount}, n1=${n1}, n=${nSer})`;
    }
    else {
        runsNote = 'schema 1: runs cell counts absent, so runsZ is NOT re-derivable here — it is a raw '
            + 'statistic bounded only by its own two-sided screen (L1). A z of exactly 0 is an ordinary '
            + 'outcome and is not treated as evidence of anything';
    }
    const zCriticalStored = Number(ser.zCritical);
    const zCriticalOk = schemaVersion >= 2 ? zCriticalStored === zCrit : true;
    const zCriticalNote = schemaVersion >= 2
        ? (zCriticalOk ? `stored zCritical ${zCriticalStored} IS the applied threshold` : `stored zCritical ${zCriticalStored} != applied ${zCrit}`)
        : `stored zCritical ${Number.isFinite(zCriticalStored) ? zCriticalStored : 'absent'} is a schema-1 field at the uncorrected α and is not read; the threshold APPLIED is ${zCrit}`;
    const serialPass = schemaKnown && Number(ser.n) === config_1.SIM_SERIAL_DRAWS
        && Number.isFinite(lag1) && Number.isFinite(lag1Z) && lag1Z === lag1ZDerived
        && Math.abs(lag1Z) < zCrit
        && Number.isFinite(runsZ) && runsPDerived >= config_1.ALPHA_SCREEN && ser.runsP === runsPDerived
        && runsStructureOk && zCriticalOk;
    const edgeRows = Array.isArray(p1?.effectiveEdge) ? p1.effectiveEdge : [];
    const wantBands = new Set(config_1.SIM_EDGE_BANDS.map((b) => (0, config_1.bandKey)(b.params)));
    const gotBands = new Set(edgeRows.map((r) => (r?.params ? (0, config_1.bandKey)(r.params) : 'INVALID')));
    const bandsIdentical = gotBands.size === wantBands.size
        && [...wantBands].every((k) => gotBands.has(k))
        && edgeRows.length === config_1.SIM_EDGE_BANDS.length;
    let edgeFieldMismatches = 0, edgeOnTheory = 0, edgeCountBad = 0, edgeCountExact = 0;
    const edgeCountNotes = [];
    const edgeWithin = edgeRows.filter((r) => {
        if (!r?.params || Number(r.n) !== config_1.SIM_EDGE_BETS)
            return false;
        const theo = (0, config_1.theoreticalRTP)(r.params), m = (0, config_1.quotedMultiplier)(r.params), pr = (0, config_1.discreteWinProbability)(r.params);
        const simRtp = Number(r.simulatedRTP);
        if (!Number.isFinite(simRtp) || !Number.isFinite(theo) || !Number.isFinite(m) || !Number.isFinite(pr)) {
            edgeFieldMismatches++;
            return false;
        }
        const se = Math.sqrt(pr * (m - simRtp) ** 2 + (1 - pr) * simRtp ** 2) / Math.sqrt(Number(r.n));
        const fieldsOk = r.quotedMultiplier === m
            && r.theoreticalRTP === theo
            && r.discreteWinPct === pr * 100
            && r.theoreticalEdgePct === (1 - theo) * 100
            && r.se === se
            && r.deltaSE === Math.abs(simRtp - theo) / se
            && r.tolSE === 5;
        if (!fieldsOk)
            edgeFieldMismatches++;
        const rec = (0, sim_checks_1.recoverWinCount)(simRtp, Number(r.n), m, r.wins);
        if (!rec.ok) {
            edgeCountBad++;
            if (edgeCountNotes.length < 3)
                edgeCountNotes.push(`${r.label ?? 'band'}: ${rec.reason}`);
        }
        else if (rec.match === 'exact')
            edgeCountExact++;
        if (simRtp === theo)
            edgeOnTheory++;
        return fieldsOk && rec.ok && Math.abs(simRtp - theo) <= 5 * se + 1e-4;
    }).length;
    const edgePass = bandsIdentical && edgeFieldMismatches === 0 && edgeCountBad === 0
        && edgeWithin === edgeRows.length;
    const rc = p1?.rtpConvergence ?? {};
    const convTheo = (0, config_1.theoreticalRTP)(config_1.SIM_RTP_STRATEGY);
    const convPts = Array.isArray(rc.points) ? rc.points : [];
    const marksOk = convPts.length === config_1.SIM_RTP_MARKS.length
        && config_1.SIM_RTP_MARKS.every((n, i) => Number(convPts[i]?.n) === n);
    const lastPt = convPts.length ? convPts[convPts.length - 1] : null;
    const convN = lastPt ? Number(lastPt.n) : 0;
    const convRtp = Number(rc.finalRTP);
    const convPr = (0, config_1.discreteWinProbability)(config_1.SIM_RTP_STRATEGY), convM = (0, config_1.quotedMultiplier)(config_1.SIM_RTP_STRATEGY);
    const convSe = convN > 0 ? Math.sqrt(convPr * (convM - convRtp) ** 2 + (1 - convPr) * convRtp ** 2) / Math.sqrt(convN) : Infinity;
    const convIdentity = marksOk && convN === config_1.SIM_RTP_BETS && Number(rc.n) === config_1.SIM_RTP_BETS
        && rc.params !== undefined && (0, config_1.bandKey)(rc.params) === (0, config_1.bandKey)(config_1.SIM_RTP_STRATEGY)
        && rc.multiplier === convM && rc.theoreticalRTP === convTheo
        && lastPt !== null && rc.finalRTP === lastPt.rtp && rc.finalRTPRunning === lastPt.rtp
        && convPts.every((pt) => Number.isFinite(Number(pt?.rtp)) && Number.isFinite(Number(pt?.se)));
    const series = (0, sim_checks_1.validateConvergenceSeries)(convPts, convM, convTheo);
    const convPass = convIdentity && series.ok && Number.isFinite(convRtp)
        && Math.abs(convRtp - convTheo) <= 5 * convSe + 1e-4;
    const convDeltaSE = Number.isFinite(convRtp) && convSe > 0 ? Math.abs(convRtp - convTheo) / convSe : NaN;
    const recomputed16 = uniPass && serialPass && edgePass && convPass;
    const selfReport16 = p1?.uniformity?.pass === true && p1?.serial?.pass === true
        && edgeRows.length > 0 && edgeRows.every((r) => r.withinTol === true);
    const agree16 = recomputed16 === selfReport16;
    const fmt = (x, d) => (Number.isFinite(Number(x)) ? Number(x).toFixed(d) : String(x));
    const s16 = (0, context_1.step)(16, 'Simulation — Pass 1 (RNG + Edge)', recomputed16 && agree16 ? 'PASS' : 'FAIL', `scored against the COMMITTED artifact (pinned by SIMULATION_SHA256, reconciled in Step 19) — this step is deterministic, not a fresh experiment; artifact schema v${schemaVersion}${schemaKnown ? '' : ' (UNKNOWN SCHEMA)'}, verifier schema v${sim_checks_1.SIM_SCHEMA_VERSION}; ${config_1.ALPHA_SCREENS} screens Bonferroni-corrected to α_screen=${config_1.ALPHA_SCREEN.toExponential(3)} so THOSE THREE have a family-wise level of α=${config_1.ALPHA}. `
        + `draw uniformity chi²=${fmt(uni.chi2, 3)} df=${uni.df} at n=${uni.n} (pinned ${config_1.SIM_UNIFORMITY_DRAWS}) → recomputed p=${uniP.toFixed(4)}, two-sided: rejected if p<${(config_1.ALPHA_SCREEN / 2).toExponential(2)} (non-uniform) or p>${(1 - config_1.ALPHA_SCREEN / 2).toFixed(6)} (TOO uniform for a ${config_1.SIM_UNIFORMITY_DRAWS}-draw sample)${uniTooUniform ? ' — LOWER-TAIL REJECT' : ''}${uniNonUniform ? ' — UPPER-TAIL REJECT' : ''} (${uniPass ? 'ok' : 'FAIL'}); `
        + `serial at n=${ser.n} (pinned ${config_1.SIM_SERIAL_DRAWS}): lag1Z=${fmt(lag1Z, 3)} == lag1·√n (${lag1Z === lag1ZDerived ? 'reconciled' : 'MISMATCH'}) < zCrit ${zCrit.toFixed(4)} (the two-sided normal quantile at α_screen, AS 241), runsP=${runsPDerived.toFixed(4)} (derived from runsZ=${fmt(runsZ, 3)}) ≥ α_screen; ${runsNote}; ${zCriticalNote} (${serialPass ? 'ok' : 'FAIL'}); `
        + `effective-edge ${edgeWithin}/${edgeRows.length} bands within 5·SE+1e-4 of theory at n=${config_1.SIM_EDGE_BETS} (recomputed), band set ${bandsIdentical ? `identical to the ${config_1.SIM_EDGE_BANDS.length} canonical bands` : 'NOT the canonical band set'}, ${edgeFieldMismatches} row(s) whose derived fields disagree with re-derivation, ${edgeCountExact}/${edgeRows.length} row(s) whose simulatedRTP IS bit-for-bit the return their integer win count reconstructs to (the producer's own per-win accumulation, replayed) and ${edgeCountBad} row(s) whose simulatedRTP is the return of NO integer win count${edgeCountNotes.length ? ` (e.g. ${edgeCountNotes.join('; ')})` : ''}; `
        + `RTP convergence ${convPts.length} points at the pinned marks (${marksOk ? 'ok' : 'MARKS MISMATCH'}), ends at n=${convN} (pinned ${config_1.SIM_RTP_BETS}), finalRTP=${Number.isFinite(convRtp) ? (convRtp * 100).toFixed(3) : 'NaN'}% == last plotted point (${convIdentity ? 'reconciled' : 'MISMATCH'}) vs ${(convTheo * 100).toFixed(2)}%, Δ=${Number.isFinite(convDeltaSE) ? convDeltaSE.toFixed(4) : 'NaN'}·SE within the 5·SE band; ALL ${convPts.length} plotted standard errors RECOMPUTED from (n, rtp, wins, m) and compared exactly, win counts ${series.points.map((p) => p.wins).join('/')} (${series.points[0]?.winSource ?? 'n/a'}) cumulatively consistent and ${series.exactReconstructions}/${convPts.length} of them reconstructing bit-for-bit to the published RTP — ${series.ok ? 'reconciled' : `MISMATCH: ${series.failures.slice(0, 3).join('; ')}`} (${convPass ? 'ok' : 'FAIL'}); `
        + `model range/cursor/scale/edge ${modelOk ? 'ok' : 'FAIL'}; artifact self-report ${selfReport16 ? 'pass' : 'fail'}`
        + (agree16 ? '' : ' — DISAGREES with recomputation (artifact self-report tampered?)')
        + `; OBSERVED (not scored): ${edgeOnTheory} effective-edge row(s) and ${series.exactlyOnTheory} convergence point(s) sit exactly on theory, and runsZ is ${runsZ === 0 ? 'exactly 0' : 'nonzero'} — all legitimate outcomes under the null, reported rather than rejected`
        + `; SCOPE — saved Pass-1 summaries satisfy structural consistency, integer-return reconstruction and the declared statistical screens. The original random inputs were not retained; their raw statistics cannot be replayed. npm run test:full generates a new experiment. See AUDIT_CONTEXT.md §9 and §11, L1`
        + `; STATISTICAL ALLOWANCES — ${sim_checks_1.SCORED_STATISTICAL_PREDICATES.length} screens across Steps 16-17: ${sim_checks_1.SCORED_STATISTICAL_PREDICATES.map((s) => `${s.id} ${s.screen} [${s.size}]`).join('; ')}. S1-S3 use Bonferroni at α=${config_1.ALPHA}; the combined nominal allowance is ≈${sim_checks_1.STEP_16_BOUND.toFixed(7)} for Step 16 and ≈${sim_checks_1.FAMILY_WISE_BOUND.toFixed(4)} across both steps. Chi-squared and normal components use asymptotic reference distributions; these are not measured finite-sample failure frequencies. Deterministic reconciliation checks are separate. See AUDIT_CONTEXT.md §9`);
    const p2 = sim.pass2;
    const p2Available = p2?.available === true;
    let s17;
    if (!p2Available) {
        s17 = (0, context_1.step)(17, 'Simulation — Pass 2 (Cherry-Pick)', 'FLAG', 'Pass 2 unavailable (dataset absent at simulate time)');
    }
    else {
        const perSeed = Array.isArray(p2.perSeed) ? p2.perSeed : [];
        const geometryOk = p2.nullMethod === 'exact-discrete-tail'
            && Number(p2.cherryWindow) === config_1.SIM_CHERRY_WINDOW
            && Number(p2.cherryBins) === config_1.SIM_CHERRY_BINS
            && p2.cherrySeedAlphaNominal === config_1.SIM_CHERRY_SEED_ALPHA
            && p2.cherryPickAlpha === config_1.ALPHA
            && p2.cherrySeedAlphaAchieved === (0, exact_chi2_1.achievedSeedAlpha)()
            && p2.cherryPickP0 === CHERRY_P0;
        const wantEpochs = ctx.seeds.map((s) => s.epoch).sort((a, b) => a - b);
        const gotEpochs = perSeed.map((r) => Number(r?.epoch)).sort((a, b) => a - b);
        const epochsOk = perSeed.length === ctx.seeds.length
            && new Set(gotEpochs).size === perSeed.length
            && wantEpochs.every((e, i) => gotEpochs[i] === e);
        const seedByEpoch = new Map(ctx.seeds.map((s) => [s.epoch, s]));
        let rowMismatches = 0, firstMismatch = '';
        let flags = 0, recomputedRows = 0;
        for (const row of perSeed) {
            const s = seedByEpoch.get(Number(row?.epoch));
            if (!s || !s.serverSeed) {
                rowMismatches++;
                if (!firstMismatch)
                    firstMismatch = `epoch ${row?.epoch}: no revealed seed in the dataset`;
                continue;
            }
            const W = config_1.SIM_CHERRY_WINDOW;
            const early = [], late = [];
            for (let i = 0; i < W; i++) {
                early.push((0, rng_1.generateProvablyFairNumber)(s.serverSeed, s.clientSeed, i, config_1.CURSOR, config_1.RANGE));
                late.push((0, rng_1.generateProvablyFairNumber)(s.serverSeed, s.clientSeed, W + i, config_1.CURSOR, config_1.RANGE));
            }
            const eSq = (0, exact_chi2_1.squareSum)(early), lSq = (0, exact_chi2_1.squareSum)(late);
            const eP = (0, exact_chi2_1.upperTailBySquareSum)(eSq), lP = (0, exact_chi2_1.upperTailBySquareSum)(lSq);
            const flag = eP < config_1.SIM_CHERRY_SEED_ALPHA && lP >= config_1.SIM_CHERRY_SEED_ALPHA;
            recomputedRows++;
            if (flag)
                flags++;
            const ok = row.earlySq === eSq && row.lateSq === lSq
                && row.earlyChi2 === (0, exact_chi2_1.chi2FromSquareSum)(eSq) && row.lateChi2 === (0, exact_chi2_1.chi2FromSquareSum)(lSq)
                && row.earlyP === eP && row.lateP === lP && row.flag === flag;
            if (!ok) {
                rowMismatches++;
                if (!firstMismatch)
                    firstMismatch = `epoch ${row.epoch}: stored (earlySq ${row.earlySq}, earlyP ${row.earlyP}, flag ${row.flag}) vs recomputed (${eSq}, ${eP}, ${flag})`;
            }
        }
        const perSeedOk = epochsOk && rowMismatches === 0 && recomputedRows === ctx.seeds.length;
        const n = perSeed.length;
        const binomP = (0, stats_1.binomialTailP)(n, flags, CHERRY_P0);
        const cherryOk = perSeedOk && geometryOk && binomP >= config_1.ALPHA;
        let minRejectableFlags = n;
        for (let k = 0; k <= n; k++) {
            if ((0, stats_1.binomialTailP)(n, k, CHERRY_P0) < config_1.ALPHA) {
                minRejectableFlags = k;
                break;
            }
        }
        const pooledDraws = ctx.bets.map((b) => Math.round(Number(b.roll) * config_1.SCALE));
        const pooledHist = new Array(100).fill(0);
        for (const d of pooledDraws)
            pooledHist[Math.min(99, Math.floor(d / (config_1.RANGE / 100)))]++;
        const pooledRe = (0, stats_1.chiSquaredTest)(pooledHist, new Array(100).fill(pooledDraws.length / 100));
        const pooledArt = p2.pooledRealRollUniformity ?? {};
        const pooledBound = Number(pooledArt.n) === ctx.bets.length
            && pooledArt.chi2 === pooledRe.chi2 && Number(pooledArt.df) === pooledRe.df
            && pooledArt.pValue === pooledRe.pValue;
        const pooledOk = pooledBound && pooledRe.pValue >= config_1.ALPHA;
        const recomputed17 = cherryOk && pooledOk;
        const selfReport17 = p2.cherryPickConsistent === true && pooledArt.pass === true;
        const agree17 = recomputed17 === selfReport17;
        s17 = (0, context_1.step)(17, 'Simulation — Pass 2 (Cherry-Pick)', recomputed17 && agree17 ? 'PASS' : 'FAIL', `${n} casino seeds vs dataset ${ctx.seeds.length} (epoch identity ${epochsOk ? 'ok' : 'MISMATCH'}); `
            + `all ${recomputedRows} per-seed χ² windows RE-DERIVED from the revealed seeds (${config_1.SIM_CHERRY_WINDOW}+${config_1.SIM_CHERRY_WINDOW} draws each), ${rowMismatches} row mismatches${firstMismatch ? ` — first: ${firstMismatch}` : ''}; `
            + `null = exact discrete tail of the n=${config_1.SIM_CHERRY_WINDOW}/${config_1.SIM_CHERRY_BINS}-bin χ² (${p2.nullSupportValues} attainable values, ${p2.nullPartitions} partitions; geometry ${geometryOk ? 'ok' : 'MISMATCH'}); `
            + `achieved per-window rejection ${(0, exact_chi2_1.achievedSeedAlpha)().toFixed(10)} at nominal α_seed ${config_1.SIM_CHERRY_SEED_ALPHA} → flag rate p0=${CHERRY_P0.toFixed(10)} (derived, not read); `
            + `cherry-pick flags ${flags} (recomputed) vs ${(n * CHERRY_P0).toFixed(2)} expected; exact binomial P(X≥${flags})=${binomP.toFixed(4)} vs α=${config_1.ALPHA} → ${cherryOk ? 'consistent with chance' : 'ELEVATED'}; `
            + `pooled real-roll uniformity over ${pooledDraws.length} captured rolls: chi²=${pooledRe.chi2.toFixed(3)} df=${pooledRe.df} → p=${pooledRe.pValue.toFixed(4)} (recomputed from the dataset; artifact ${pooledBound ? 'reconciled' : 'MISMATCH'}) (${pooledOk ? 'ok' : 'FAIL'}); `
            + `artifact self-report ${selfReport17 ? 'pass' : 'fail'}`
            + (agree17 ? '' : ' — DISAGREES with recomputation (artifact self-report tampered?)')
            + `; SCOPE — rejection requires ${minRejectableFlags} flags at α=${config_1.ALPHA} (P(X≥${minRejectableFlags})=${(0, stats_1.binomialTailP)(n, minRejectableFlags, CHERRY_P0).toFixed(4)}). This tests the defined early-window uniformity pattern; it does not rule out every seed-selection strategy. Client-seed control and predictability are assessed separately in AUDIT_CONTEXT.md §9 and §11, L4 and L12`);
    }
    return [s16, s17];
}

},
"tests/steps/standardization.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const node_crypto_1 = require("node:crypto");
const context_1 = require("./context");
const report_figures_1 = require("../../src/report-figures");
const rng_1 = require("../../src/rng");
const config_1 = require("../../src/config");
function run(ctx) {
    const { bets, seedMap } = ctx;
    const out = [];
    {
        const c = ctx.phaseC;
        let chk = 0, bad = 0;
        for (const b of c) {
            const ss = seedMap.get(b.hashedServerSeed);
            if (!ss)
                continue;
            chk++;
            const served = Number(b.roll);
            const local = (0, rng_1.diceRoll)(ss, b.clientSeed, b.nonce);
            if (!(0, config_1.servedRollMatches)(served, local))
                bad++;
        }
        const stakes = [...new Set(bets.map((b) => Number(b.betAmount)))].sort((a, z) => a - z);
        const edgeSame = c.length > 0 ? (0, config_1.effectiveEdge)(c[0].params) : NaN;
        const ok = chk === c.length && chk > 0 && bad === 0;
        out.push((0, context_1.step)(18, 'Bet-Size Invariance', ok ? 'PASS' : 'FAIL', `${chk}/${c.length} Phase C bets at $10.00 recompute their roll identically to the $0.10 phases — ${bad} mismatch. ` +
            `diceRoll takes no wager argument; effective edge for the band is ${(edgeSame * 100).toFixed(4)}% at every stake (stakes present: ${stakes.map((s) => `$${s}`).join(', ')})` +
            (chk === 0 ? '; COVERAGE FAIL: 0 Phase C bets recomputed' : '')));
    }
    {
        const hashOk = ctx.datasetSha256 === ctx.expectedDatasetHash;
        const simFresh = process.env.SIM_FRESH === '1';
        const simPins = [
            { label: 'simulation-results.json', file: 'simulation-results.json', expected: config_1.SIMULATION_SHA256 },
            { label: 'rtp-convergence.html', file: 'rtp-convergence.html', expected: config_1.SIMULATION_HTML_SHA256 },
        ];
        const simNotes = [];
        let simForged = false;
        for (const pin of simPins) {
            const fp = path.join(ctx.outputsDir, pin.file);
            if (!fs.existsSync(fp)) {
                simForged = true;
                simNotes.push(`${pin.label} ABSENT — the artifact Steps 16–17 score is missing`);
                continue;
            }
            const actual = (0, node_crypto_1.createHash)('sha256').update(fs.readFileSync(fp)).digest('hex');
            if (simFresh) {
                simNotes.push(`${pin.label} FRESH run (SIM_FRESH=1): sha256 ${actual.slice(0, 16)}… — pin NOT enforced; re-pin in src/config.ts to publish this run`);
            }
            else if (actual !== pin.expected) {
                simForged = true;
                simNotes.push(`${pin.label} sha256 ${actual.slice(0, 16)}… ≠ pin ${pin.expected.slice(0, 16)}… — the scored simulation is not the committed one`);
            }
            else {
                simNotes.push(`${pin.label} sha256 ${actual.slice(0, 16)}… matches its pin`);
            }
        }
        const rfPath = path.join(ctx.outputsDir, 'report-figures.json');
        const freshObj = (0, report_figures_1.computeReportFigures)(ctx.bets, ctx.seeds);
        const fresh = JSON.stringify(freshObj, null, 2);
        const RF_ENVELOPE_FIELDS = ['generatedAt', 'datasetSha256'];
        const RF_REQUIRED_FIELDS = [...RF_ENVELOPE_FIELDS, ...Object.keys(freshObj)];
        let rfForged = false;
        let rfNote;
        if (!fs.existsSync(rfPath)) {
            rfForged = true;
            rfNote = 'outputs/report-figures.json ABSENT — the artifact of record for the report\'s derived '
                + 'figures (evidence E15) is missing, so the published numbers cannot be checked against the '
                + 'file that produced them. Regenerating it here would prove only that they are a deterministic '
                + 'function of the pinned dataset, not that the shipped file was ever produced';
        }
        else {
            let stored;
            let parseError = null;
            try {
                stored = JSON.parse(fs.readFileSync(rfPath, 'utf8'));
            }
            catch (e) {
                parseError = e instanceof Error ? e.message : String(e);
            }
            if (parseError !== null) {
                rfForged = true;
                rfNote = `outputs/report-figures.json PARSE ERROR — the artifact of record could not be read as JSON (${parseError.slice(0, 120)}). `
                    + 'A verifier must not approve an artifact it could not read, and a parse failure is not permission to regenerate';
            }
            else if (stored === null || typeof stored !== 'object' || Array.isArray(stored)) {
                rfForged = true;
                rfNote = `outputs/report-figures.json SCHEMA ERROR — expected a JSON object, got ${stored === null ? 'null' : Array.isArray(stored) ? 'an array' : typeof stored}`;
            }
            else {
                const obj = stored;
                const missing = RF_REQUIRED_FIELDS.filter((k) => !Object.prototype.hasOwnProperty.call(obj, k));
                const storedHash = typeof obj.datasetSha256 === 'string' ? obj.datasetSha256 : '';
                if (missing.length > 0) {
                    rfForged = true;
                    rfNote = `outputs/report-figures.json SCHEMA ERROR — required field(s) absent: ${missing.join(', ')}. `
                        + `The artifact must carry ${RF_REQUIRED_FIELDS.length} top-level fields (${RF_ENVELOPE_FIELDS.join(', ')} plus every figure group the report cites)`;
                }
                else if (!/^[0-9a-f]{64}$/.test(storedHash)) {
                    rfForged = true;
                    rfNote = `outputs/report-figures.json SCHEMA ERROR — datasetSha256 is not a SHA-256 hex digest (${JSON.stringify(obj.datasetSha256)?.slice(0, 40)})`;
                }
                else if (storedHash !== ctx.datasetSha256) {
                    rfForged = true;
                    rfNote = `outputs/report-figures.json DATASET MISMATCH — it declares dataset ${storedHash.slice(0, 16)}… but the capture being scored is ${ctx.datasetSha256.slice(0, 16)}…, `
                        + 'so the shipped derived figures were not computed from this capture. Regenerate deliberately with `npm run report` and review the diff; verification will not do it for you';
                }
                else {
                    const body = { ...obj };
                    delete body.generatedAt;
                    delete body.datasetSha256;
                    const storedBody = JSON.stringify(body, null, 2);
                    if (storedBody !== fresh) {
                        rfForged = true;
                        const firstBad = Object.keys(freshObj).find((k) => JSON.stringify(body[k]) !== JSON.stringify(freshObj[k])) ?? '(field order)';
                        rfNote = `outputs/report-figures.json FIELD MISMATCH — it claims THIS dataset but DISAGREES with recomputation from it (first disagreeing group: ${firstBad}) — the report's derived figures do not follow from the capture`;
                    }
                    else {
                        rfNote = 'outputs/report-figures.json reconciles with a fresh recomputation from the pinned dataset, field for field '
                            + `(${RF_REQUIRED_FIELDS.length}/${RF_REQUIRED_FIELDS.length} required fields present, dataset hash matches)`;
                    }
                }
            }
        }
        out.push((0, context_1.step)(19, 'Artifact Hash Integrity', hashOk && !rfForged && !simForged ? 'PASS' : 'FAIL', `SHA-256 of data/dice-master-6700bets.json = ${ctx.datasetSha256.slice(0, 16)}… ${hashOk ? 'matches' : '≠'} the pin ${ctx.expectedDatasetHash.slice(0, 16)}… (loader aborts on mismatch before any step runs); `
            + `${simNotes.join('; ')} — the pin proves the scored simulation is the committed one, NOT that its statistics are real (that is Step 16's two-sided uniformity screen plus its structural validation of the win counts and standard errors); `
            + `${rfNote}`));
    }
    {
        let chk = 0, bad = 0;
        const modesSeen = new Set();
        let wins = 0, losses = 0;
        const fails = [];
        const expectedMultiplier = (p) => {
            const bps = (0, config_1.payoutBasisPoints)(p);
            return bps > 0 ? config_1.PAYOUT_NUMERATOR / bps : 0;
        };
        for (const b of bets) {
            chk++;
            modesSeen.add((0, config_1.bandMode)(b.params));
            const win = (0, config_1.diceWin)(Number(b.roll), b.params);
            if (win)
                wins++;
            else
                losses++;
            const expected = win ? (0, config_1.settledCredit)(Number(b.betAmount), expectedMultiplier(b.params)) : 0;
            const credited = Number(b.winningAmount);
            if (win !== !!b.win || credited !== expected) {
                bad++;
                if (fails.length < 3)
                    fails.push(`epoch ${b.epoch} nonce ${b.nonce}: credited ${credited} vs determined ${expected}`);
            }
        }
        const coverOk = modesSeen.size === 4 && wins > 0 && losses > 0;
        out.push((0, context_1.step)(20, 'Settlement Determinism', bad === 0 && coverOk ? 'PASS' : 'FAIL', `${chk}/${bets.length} bets: outcome (win/loss) and credited amount are fully determined by (roll, band, stake) — credit == ROUND_HALF_EVEN_8(stake × ROUND_8(PAYOUT_NUMERATOR/basisPoints)), the integer-basis-point quotient, with zero tolerance — and match the served settlement — ${bad} mismatch` +
            (fails.length ? ` (e.g. ${fails.join('; ')})` : '') +
            `; coverage: modes [${[...modesSeen].join(',')}], ${wins} wins / ${losses} losses` +
            (coverOk ? '' : '; COVERAGE FAIL')));
    }
    {
        const pts = new Map();
        let rangeMin = Infinity, rangeMax = -Infinity;
        for (const b of bets) {
            const wc = +(0, config_1.continuousWinChancePct)(b.params).toFixed(4);
            const m = (0, config_1.quotedMultiplier)(b.params);
            pts.set(wc, m);
            if (m < rangeMin)
                rangeMin = m;
            if (m > rangeMax)
                rangeMax = m;
        }
        const sorted = [...pts.entries()].sort((a, z) => a[0] - z[0]);
        let inversions = 0;
        for (let i = 1; i < sorted.length; i++)
            if (sorted[i][1] >= sorted[i - 1][1] - 1e-12)
                inversions++;
        const rangeOk = rangeMin >= config_1.MIN_ODDS && rangeMax <= config_1.MAX_ODDS;
        const spanOk = sorted.length >= 100;
        out.push((0, context_1.step)(21, 'Multiplier Monotonicity & Range', inversions === 0 && rangeOk && spanOk ? 'PASS' : 'FAIL', `${sorted.length} distinct win-chance points; multiplier = 99/winChance strictly decreasing in win chance (${inversions} inversions); ` +
            `observed multipliers span ${rangeMin.toFixed(4)}×–${rangeMax.toFixed(4)}× within [${config_1.MIN_ODDS}, ${config_1.MAX_ODDS}] (${rangeOk ? 'in range' : 'OUT OF RANGE'})`));
    }
    return out;
}

},
"tests/steps/statistical.js": function(module, exports, require, __filename, __dirname) {
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const config_1 = require("../../src/config");
function run(ctx) {
    const { bets } = ctx;
    const items = [];
    if (bets.length === 0) {
        items.push({ label: 'Live bets', detail: 'No bets in dataset' });
        return items;
    }
    const totalPayout = bets.reduce((s, b) => s + Number(b.winningAmount), 0);
    const totalWagered = bets.reduce((s, b) => s + Number(b.betAmount), 0);
    items.push({
        label: 'Realized RTP (variance)',
        detail: `${(totalPayout / totalWagered * 100).toFixed(2)}% ($${totalWagered.toFixed(2)} wagered, $${totalPayout.toFixed(2)} returned over ${bets.length} bets — informational; authoritative edge is the deterministic effective edge, Step 15).`,
    });
    const modeAgg = {};
    let sumAll = 0;
    for (const b of bets) {
        const e = (0, config_1.effectiveEdge)(b.params);
        sumAll += e;
        const m = (0, config_1.bandMode)(b.params);
        (modeAgg[m] || (modeAgg[m] = { n: 0, sum: 0, min: Infinity, max: -Infinity }));
        const g = modeAgg[m];
        g.n++;
        g.sum += e;
        if (e < g.min)
            g.min = e;
        if (e > g.max)
            g.max = e;
    }
    items.push({ label: 'Mean effective edge', detail: `${(sumAll / bets.length * 100).toFixed(4)}% (target 1.00%; exact under the half-open grid rule)` });
    for (const [m, g] of Object.entries(modeAgg)) {
        items.push({ label: `Effective edge — ${m}`, detail: `mean ${(g.sum / g.n * 100).toFixed(3)}%, range ${(g.min * 100).toFixed(3)}–${(g.max * 100).toFixed(3)}% (n=${g.n})` });
    }
    const rolls = bets.map(b => Number(b.roll));
    items.push({ label: 'Roll range', detail: `min ${Math.min(...rolls).toFixed(2)}, max ${Math.max(...rolls).toFixed(2)} (ceiling 99.99), mean ${(rolls.reduce((a, b) => a + b, 0) / rolls.length).toFixed(3)}` });
    const wins = bets.filter(b => b.win).length;
    items.push({ label: 'Live win rate', detail: `${wins}/${bets.length} = ${(wins / bets.length * 100).toFixed(2)}% (mixed win chances — informational)` });
    const mults = bets.map(b => (0, config_1.quotedMultiplier)(b.params));
    const lim = ctx.meta.limits;
    items.push({
        label: 'Odds settings and recorded acceptance',
        detail: `recorded settings (meta.limits): minOdds ${lim?.minOdds}, maxOdds ${lim?.maxOdds}; E14 records acceptance at ${config_1.MAX_ODDS}× (auditor attestation, F-LIMITS); captured multiplier span ${Math.min(...mults).toFixed(4)}×–${Math.max(...mults).toFixed(4)}×; maximum enforcement is outside scope`,
    });
    items.push({
        label: 'Capture-side self-check fields',
        detail: `meta.edgeScan and local self-check fields are capture annotations. Scored verification independently derives results from recorded inputs; see AUDIT_CONTEXT.md §3.`,
    });
    return items;
}

},
"tests/verify.js": function(module, exports, require, __filename, __dirname) {
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const loader_1 = require("../src/loader");
const config_1 = require("../src/config");
const report_figures_1 = require("../src/report-figures");
const runtime_1 = require("../src/runtime");
const diff_1 = require("../src/diff");
const commitment = __importStar(require("./steps/commitment"));
const determinism = __importStar(require("./steps/determinism"));
const payouts = __importStar(require("./steps/payouts"));
const dataset = __importStar(require("./steps/dataset"));
const antiCirc = __importStar(require("./steps/anti-circularity"));
const phaseD = __importStar(require("./steps/phase-d"));
const boundary = __importStar(require("./steps/boundary"));
const simulation = __importStar(require("./steps/simulation"));
const statistical = __importStar(require("./steps/statistical"));
const standardization = __importStar(require("./steps/standardization"));
const DATASET_PATH = path.join(__dirname, '../data/dice-master-6700bets.json');
const EXPECTED_DATASET_HASH = config_1.DATASET_SHA256;
const OUTPUTS_DIR = path.join(__dirname, '../outputs');
const RUN_DIR = path.join(OUTPUTS_DIR, 'run');
const EMIT = process.env.PF_EMIT === '1';
(0, runtime_1.assertSupportedRuntime)();
console.log('\n══════════════════════════════════════════════════════════');
console.log('  LIQD DICE — VERIFICATION SUITE');
console.log('══════════════════════════════════════════════════════════');
console.log(`  Runtime: Node v${process.versions.node} (validated: ${runtime_1.VALIDATED_RUNTIME})`);
console.log(EMIT
    ? '  MODE: REPORT GENERATION (PF_EMIT=1) — the committed artifacts WILL be rewritten'
    : '  MODE: verification — committed artifacts are read-only; results go to outputs/run/');
if (!fs.existsSync(DATASET_PATH)) {
    console.log('\n  [ERROR] Dataset not found at data/dice-master-6700bets.json');
    console.log('  Cannot run verification without the captured master dataset.');
    console.log('\n══════════════════════════════════════════════════════════\n');
    process.exit(1);
}
const ds = (0, loader_1.loadDataset)(DATASET_PATH, EXPECTED_DATASET_HASH);
const bets = ds.bets;
const seeds = ds.seeds;
const seedMap = new Map();
for (const s of seeds) {
    if (s.serverSeed)
        seedMap.set(s.hashedServerSeed, s.serverSeed);
}
const byHash = new Map();
for (const b of bets) {
    const arr = byHash.get(b.hashedServerSeed) ?? [];
    arr.push(b);
    byHash.set(b.hashedServerSeed, arr);
}
const phaseABets = bets.filter(b => b.phase === 'A');
const phaseBBets = bets.filter(b => b.phase === 'B');
const phaseCBets = bets.filter(b => b.phase === 'C');
const phaseDBets = bets.filter(b => b.phase === 'D');
const phaseEBets = bets.filter(b => b.phase === 'E');
if (!fs.existsSync(OUTPUTS_DIR))
    fs.mkdirSync(OUTPUTS_DIR, { recursive: true });
console.log(`  Dataset: ${bets.length} bets | Seeds: ${seeds.length} | SHA-256 verified`);
console.log(`  Phase A:${phaseABets.length} B:${phaseBBets.length} C:${phaseCBets.length} D:${phaseDBets.length} E:${phaseEBets.length}\n`);
const ctx = {
    bets, seeds, seedMap, byHash,
    phaseA: phaseABets, phaseB: phaseBBets, phaseC: phaseCBets, phaseD: phaseDBets, phaseE: phaseEBets,
    outputsDir: OUTPUTS_DIR,
    datasetSha256: ds.sha256,
    expectedDatasetHash: EXPECTED_DATASET_HASH,
    meta: ds.meta,
    simArtifact: null,
};
const results = [
    ...commitment.run(ctx),
    ...determinism.run(ctx),
    ...payouts.run(ctx),
    ...dataset.run(ctx),
    ...antiCirc.run(ctx),
    ...phaseD.run(ctx),
    ...boundary.run(ctx),
    ...simulation.run(ctx),
    ...standardization.run(ctx),
];
const infoItems = statistical.run(ctx);
const passed = results.filter(r => r.status === 'PASS').length;
const flags = results.filter(r => r.status === 'FLAG').length;
const hardFail = results.filter(r => r.status === 'FAIL').length;
const verdict = hardFail > 0
    ? 'NOT PROVABLY FAIR'
    : flags > 0
        ? 'PROVABLY FAIR — Conditional Pass'
        : 'PROVABLY FAIR — Full Pass';
if (infoItems.length > 0) {
    console.log('');
    console.log('  ┌── Informational Context (not scored) ──');
    for (const item of infoItems)
        console.log(`  │ ${item.label}: ${item.detail}`);
    console.log('  └──');
}
console.log('\n══════════════════════════════════════════════════════════');
console.log('  RESULTS SUMMARY');
console.log('══════════════════════════════════════════════════════════');
console.log(`  Passed:     ${passed}/${results.length}`);
console.log(`  Hard fails: ${hardFail}`);
console.log(`  Flags:      ${flags}`);
console.log(`\n  VERDICT: ${verdict}`);
console.log('  Scope: recorded pre-production sample (qa.liqd.com, 27 August 2026)');
console.log(hardFail > 0 || flags > 0
    ? '  Certification: no passing certification from this run; production remains unassessed'
    : '  Certification: provisional, pending anonymous production validation');
console.log('══════════════════════════════════════════════════════════\n');
const verificationBody = {
    generatedAt: new Date().toISOString(),
    runtime: process.versions.node,
    totalBets: bets.length,
    totalSeeds: seeds.length,
    datasetSha256: ds.sha256,
    assessment: {
        environment: 'pre-production',
        host: 'qa.liqd.com',
        captureDate: '2026-08-27',
        scope: 'Recorded sample and documented game model; see AUDIT_CONTEXT.md',
        certificationStatus: hardFail > 0 || flags > 0 ? 'review-required' : 'provisional',
        productionValidation: 'pending',
        finalCertificationCondition: 'Anonymous production capture completed, reviewed and published with passing verification for its stated scope',
    },
    artifactHashes: {
        dataset: {
            file: 'data/dice-master-6700bets.json',
            expected: EXPECTED_DATASET_HASH,
            actual: ds.sha256,
            match: ds.sha256 === EXPECTED_DATASET_HASH,
            sha256: ds.sha256,
        },
        simulation: ctx.simArtifact
            ? { ...ctx.simArtifact, expected: config_1.SIMULATION_SHA256, match: ctx.simArtifact.sha256 === config_1.SIMULATION_SHA256, pinEnforced: process.env.SIM_FRESH !== '1' }
            : null,
        simulationChart: { file: 'outputs/rtp-convergence.html', expected: config_1.SIMULATION_HTML_SHA256 },
    },
    steps: results,
    info: infoItems,
    summary: { passed, flags, hardFail, verdict },
};
const figuresBody = {
    generatedAt: new Date().toISOString(),
    datasetSha256: ds.sha256,
    ...(0, report_figures_1.computeReportFigures)(bets, seeds),
};
const VERIFICATION_FILE = 'verification-results.json';
const FIGURES_FILE = 'report-figures.json';
const write = (dir, name, body) => fs.writeFileSync(path.join(dir, name), JSON.stringify(body, null, 2));
const readJsonOrNull = (p) => {
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
    catch {
        return null;
    }
};
if (EMIT) {
    write(OUTPUTS_DIR, VERIFICATION_FILE, verificationBody);
    write(OUTPUTS_DIR, FIGURES_FILE, figuresBody);
    console.log(`  REPORT GENERATION: rewrote outputs/${VERIFICATION_FILE} and outputs/${FIGURES_FILE}`);
    console.log('  Review the diff before publishing — these are artifacts of record.');
}
else {
    fs.mkdirSync(RUN_DIR, { recursive: true });
    write(RUN_DIR, VERIFICATION_FILE, verificationBody);
    write(RUN_DIR, FIGURES_FILE, figuresBody);
    const committedVerification = readJsonOrNull(path.join(OUTPUTS_DIR, VERIFICATION_FILE));
    const committedFigures = readJsonOrNull(path.join(OUTPUTS_DIR, FIGURES_FILE));
    const verificationDiff = (0, diff_1.fieldDiff)(committedVerification, verificationBody, ['generatedAt', 'runtime']);
    const figuresDiff = (0, diff_1.fieldDiff)(committedFigures, figuresBody, ['generatedAt']);
    write(RUN_DIR, 'diff.json', {
        generatedAt: verificationBody.generatedAt,
        runtime: process.versions.node,
        verdict,
        note: 'Field-level diff between the COMMITTED artifacts and THIS RUN. `generatedAt` (and the '
            + 'run\'s `runtime`) are excluded because they differ by construction. A non-empty diff means '
            + 'this run disagrees with the committed evidence — investigate it; do not re-run until it '
            + 'goes away, and do not regenerate the committed artifact to make it go away.',
        committedReadable: {
            [`outputs/${VERIFICATION_FILE}`]: committedVerification !== null,
            [`outputs/${FIGURES_FILE}`]: committedFigures !== null,
        },
        verificationResultsDiff: verificationDiff,
        reportFiguresDiff: figuresDiff,
    });
    console.log(`  Output (this run only): outputs/run/${VERIFICATION_FILE}, outputs/run/${FIGURES_FILE}, outputs/run/diff.json`);
    console.log('  Committed artifacts NOT modified. Use `npm run report` to propose replacements.');
    if (verificationDiff.length || figuresDiff.length) {
        console.log(`  ⚠ THIS RUN DISAGREES WITH THE COMMITTED EVIDENCE — ${verificationDiff.length} field(s) in ${VERIFICATION_FILE}, ${figuresDiff.length} in ${FIGURES_FILE}. See outputs/run/diff.json.`);
    }
}
if (hardFail > 0)
    process.exit(1);
if (flags > 0)
    process.exit(2);

}
};
const cache = Object.create(null);
function load(from, spec) {
  if (!spec.startsWith('.')) return nodeRequire(spec);
  const base = path.posix.normalize(path.posix.join(path.posix.dirname(from), spec));
  const id = [base, base + '.js', base + '/index.js'].find(p => Object.hasOwn(modules, p));
  if (!id) return nodeRequire(path.join(__dirname, base));
  if (cache[id]) return cache[id].exports;
  const module = { exports: {} };
  cache[id] = module;
  modules[id](module, module.exports, s => load(id, s), path.join(__dirname, id), path.dirname(path.join(__dirname, id)));
  return module.exports;
}
load('', './tests/verify.js');
