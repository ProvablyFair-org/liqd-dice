/**
 * REFERENCE RECORD — NOT USED BY THE CAPTURE OF RECORD.
 *
 * The collector that produced data/dice-master-6700bets.json did not import this module, and
 * capture/capture-dice.reference.mjs as shipped does not either: it draws a new idempotency key on
 * every attempt. This module records the retry behaviour a future capture is to use: one
 * idempotency key per intended bet, kept across transient retries, and a retry only for errors
 * classified as transient. tests/dice/captureRetryTests.ts tests it with local mocks. No scored step
 * reads it, and it says nothing about how the audited dataset was collected.
 */

/** One logical bet keeps its request identity across transient retries. */
export function createBetOperation({ params, amount, newKey, place }) {
  const idempotencyKey = newKey();
  const capturedParams = Object.freeze({ ...params });
  return () => place(capturedParams, amount, idempotencyKey);
}

/** Schema and API errors require inspection; retry only classified transport failures. */
export function isRetryable(error) {
  return error?.kind === 'TRANSIENT';
}
