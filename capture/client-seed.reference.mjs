// ============================================================================
//  Client-seed selection for a FUTURE capture — commitment first, randomness second.
// ============================================================================
//
//  ── THE DEFECT THIS REPLACES (client QA 2026-09-10, D5) ────────────────────────────────────────
//
//  Phase D of the 2026-08-27 capture built its client seeds as `pfaudit-${STAMP}-${epoch}`, where
//  STAMP was one `Date.now()` fixed at process start. Every one of the 500 Phase-D bets therefore
//  had a client seed that was fully determined the moment the first of them was known: given
//  `pfaudit-1787856766341-124`, the next nine are `…-125` through `…-133`, character for character.
//
//  The audit leaned on those bets for a structural claim — that the player supplies the client seed
//  AFTER the server's commitment is published, so the operator cannot try candidate server seeds
//  against the client seed and keep a favourable one. Submitting a PREDICTABLE value after a
//  commitment does not deliver that protection. A party choosing future server seeds already knows
//  what the client seed will be, so it can evaluate the pair in advance exactly as if the client
//  seed had been fixed first. The ordering was right and the entropy was absent, and the claim
//  needs the entropy.
//
//  Nothing in this file changes the historical dataset, and it must not: `data/dice-master-6700bets.json`
//  is the artifact of record and its client seeds stay as they were captured. What changes is the
//  claim the report makes about them (AUDIT_CONTEXT §11, R-CHERRY) and what a FUTURE capture does.
//
//  ── WHAT A FUTURE CAPTURE DOES INSTEAD ─────────────────────────────────────────────────────────
//
//  1. Receive and record the server's commitment for the epoch the seed is being chosen for.
//  2. ONLY THEN call the CSPRNG, once per epoch, for that epoch's unpredictable material.
//  3. Record which commitment preceded the choice, so the ordering is in the dataset rather than in
//     someone's memory of how the script ran.
//
//  The label may keep an audit/epoch prefix — it is useful for reading a dataset — but the
//  unpredictable part is freshly generated per epoch and is what the guarantee rests on.
//
//  ── WHAT THIS STILL DOES NOT ESTABLISH ─────────────────────────────────────────────────────────
//
//  The recorded sequence is the AUDITOR's own record of the order in which the auditor's own script
//  did things. It is not independently authenticated publication timing: nobody outside the capture
//  witnessed that the commitment existed before the client seed was drawn. A statistical test of a
//  handful of client seeds is not proof of unpredictability either. Closing that needs a third-party
//  timestamp or witness on the commitment — see the "Authenticated chronology" item in the report's
//  future-evidence list. This module makes the ordering TRUE and RECORDED; it does not make it
//  PROVEN to a third party.

/**
 * @param {object} deps
 * @param {(n: number) => { toString(enc: string): string }} deps.randomBytes  CSPRNG (node:crypto).
 * @param {() => string} [deps.now]  ISO timestamp source, for the record only.
 * @param {number} [deps.entropyBytes]  unpredictable material per epoch; 16 bytes = 128 bits.
 */
export function createClientSeedChooser({ randomBytes, now = () => new Date().toISOString(), entropyBytes = 16 }) {
  if (typeof randomBytes !== 'function') throw new Error('createClientSeedChooser: randomBytes is required');
  if (!(entropyBytes >= 16)) throw new Error('createClientSeedChooser: entropyBytes must be at least 16 (128 bits)');

  /** Every choice made, in order — written into the dataset alongside the seed rows. */
  const record = [];

  return {
    record,

    /**
     * Choose one epoch's client seed. REFUSES to produce one until the commitment that must precede
     * it has been handed over: the ordering is enforced by the signature, not by a comment asking
     * the caller to be careful.
     *
     * @param {object} args
     * @param {number} args.epoch
     * @param {string} args.tag              label prefix ('audit', 'pfaudit', …)
     * @param {string} args.commitment       the server-seed hash already received for this epoch
     * @param {string} [args.commitmentSource]  which response carried it
     */
    chooseAfterCommitment({ epoch, tag, commitment, commitmentSource = 'provably-fair/rotate|active' }) {
      if (!Number.isInteger(epoch) || epoch < 0) throw new Error(`client seed: epoch must be a non-negative integer, got ${epoch}`);
      if (typeof commitment !== 'string' || !/^[0-9a-f]{64}$/.test(commitment)) {
        throw new Error(
          `client seed for epoch ${epoch}: refusing to generate before the server commitment has been received `
          + `and recorded (got ${JSON.stringify(commitment)}). The pre-evaluation guarantee is exactly this ordering.`,
        );
      }
      // The CSPRNG is called HERE — after the commitment check, once per epoch, never reused.
      const entropy = randomBytes(entropyBytes).toString('hex');
      const clientSeed = `${tag}-${epoch}-${entropy}`;
      const entry = {
        epoch,
        clientSeed,
        precededByCommitment: commitment,
        commitmentSource,
        entropyHexChars: entropy.length,
        entropySource: 'csprng',
        chosenAt: now(),
      };
      record.push(entry);
      return entry;
    },
  };
}
