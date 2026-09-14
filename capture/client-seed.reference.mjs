/** Choose fresh client-seed material only after receiving the server commitment.
 * This enforces local ordering; independent chronology needs external evidence.
 */
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
