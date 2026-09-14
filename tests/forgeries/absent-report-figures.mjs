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
