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
