// The framework forged-artifact battery's F11, executed in-repo: DELETE the shipped
// `outputs/report-figures.json` and run the suite.
//
// WHY THIS IS A FORGERY AND NOT A NO-OP. Until 2026-09-09 Step 19 read `absent — this run writes
// it` and stayed green, so deleting the artifact that carries every derived figure the report
// quotes returned a clean 21/21 PROVABLY FAIR — Full Pass. That is an existsSync fall-through: the
// step could not tell "the artifact of record is missing" from "nothing to compare against yet".
//
// The tempting defence — the file regenerates byte-identically, so deletion loses nothing — was
// tested and rejected. It is TRUE (verified: the regenerated file equals the shipped one field for
// field, ignoring `generatedAt`), but it proves only that the figures are a deterministic function
// of the pinned dataset. A repo with a genuine absent-artifact defect regenerates identically too,
// so byte-identity cannot distinguish the two cases and the repo has to declare which it is. This
// one declares: report-figures.json is an ARTIFACT OF RECORD — `.gitignore` un-ignores it, it is
// evidence item E15, and the chapters cite it by name as the trace for published figures. Its
// absence FAILS. See declared limitation L16 in MANIFEST.md.
//
// This cannot be expressed as a find/replace, which is why it lives in
// `tests/structural-forgeries.json` rather than `tests/mutations.json`.
//
// usage: node absent-report-figures.mjs <sandboxRepo>
import fs from 'node:fs';
import path from 'node:path';

const repo = process.argv[2];
if (!repo) {
  console.error('usage: node absent-report-figures.mjs <sandboxRepo>');
  process.exit(2);
}

const target = path.join(repo, 'outputs/report-figures.json');
if (!fs.existsSync(target)) {
  // Fail loudly rather than silently "succeeding" on a repo that never shipped the artifact — a
  // forgery that cannot be applied must not be reported as a forgery that was survived.
  console.error('outputs/report-figures.json is already absent — nothing to delete, the forgery is vacuous');
  process.exit(1);
}

const bytes = fs.statSync(target).size;
fs.rmSync(target);
console.log(`deleted outputs/report-figures.json (${bytes} bytes) — the artifact of record for the report's derived figures (E15)`);
