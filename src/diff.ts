/** Compare published reports with current results without modifying the published evidence. */
export type Leaf = string | number | boolean | null;

/** Flatten a JSON value to `dotted.path` → leaf. Arrays index as `path[0]`. */
export function flattenLeaves(value: unknown, prefix = '', out: Map<string, Leaf> = new Map()): Map<string, Leaf> {
  if (value === null || typeof value !== 'object') {
    out.set(prefix, value as Leaf);
    return out;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) out.set(prefix, '<empty array>');
    value.forEach((v, i) => flattenLeaves(v, `${prefix}[${i}]`, out));
    return out;
  }
  const keys = Object.keys(value as Record<string, unknown>);
  if (keys.length === 0) out.set(prefix, '<empty object>');
  for (const k of keys) flattenLeaves((value as Record<string, unknown>)[k], prefix ? `${prefix}.${k}` : k, out);
  return out;
}

export interface FieldDiff {
  path: string;
  committed: Leaf | '<absent>';
  thisRun: Leaf | '<absent>';
}

/**
 * Every leaf on which `committed` and `thisRun` disagree, by path. `ignore` drops paths whose
 * dotted name matches exactly — used for `generatedAt`, which differs by construction on every run
 * and would otherwise be the only entry in every diff.
 */
export function fieldDiff(committed: unknown, thisRun: unknown, ignore: readonly string[] = []): FieldDiff[] {
  const a = flattenLeaves(committed);
  const b = flattenLeaves(thisRun);
  const skip = new Set(ignore);
  const paths = [...new Set([...a.keys(), ...b.keys()])].sort();
  const out: FieldDiff[] = [];
  for (const p of paths) {
    if (skip.has(p)) continue;
    const inA = a.has(p), inB = b.has(p);
    const va = inA ? a.get(p)! : '<absent>';
    const vb = inB ? b.get(p)! : '<absent>';
    if (!Object.is(va, vb)) out.push({ path: p, committed: va, thisRun: vb });
  }
  return out;
}
