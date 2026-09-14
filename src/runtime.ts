/** Exact statistical reconciliation uses the validated Node runtime; see AUDIT_CONTEXT.md §10. */
/** The Node major version this package is validated for and will run on. */
export const SUPPORTED_NODE_MAJOR = 22;

/** Runtime used to validate the published calculations. */
export const VALIDATED_RUNTIME = 'Node.js v22.23.1';

export function nodeMajor(version: string = process.versions.node): number {
  return Number(version.split('.')[0]);
}

export function isSupportedRuntime(version: string = process.versions.node): boolean {
  return nodeMajor(version) === SUPPORTED_NODE_MAJOR;
}

export function unsupportedRuntimeMessage(version: string = process.versions.node): string {
  return [
    '',
    '══════════════════════════════════════════════════════════',
    '  UNSUPPORTED RUNTIME — verification refused',
    '══════════════════════════════════════════════════════════',
    `  Running on   : Node v${version}`,
    `  Supported    : Node ${SUPPORTED_NODE_MAJOR}.x`,
    `  Validated on : ${VALIDATED_RUNTIME}`,
    '',
    '  This suite compares stored statistics against recomputation with exact equality.',
    '  Statistical functions can differ in their final bits across runtime versions.',
    '  Use the supported runtime to reproduce these exact comparisons.',
    '',
    `  Install Node ${SUPPORTED_NODE_MAJOR}.x and re-run. Nothing was written; no evidence was touched.`,
    '══════════════════════════════════════════════════════════',
    '',
  ].join('\n');
}

/** Refuse to run on an unvalidated runtime. Called before any scored step, and before any write. */
export function assertSupportedRuntime(): void {
  if (isSupportedRuntime()) return;
  console.error(unsupportedRuntimeMessage());
  process.exit(1);
}
