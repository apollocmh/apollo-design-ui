#!/usr/bin/env node
/** Recompute audit issue counters and verify source evidence for resolved documentation issues. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const { values } = parseArgs({
  options: {
    check: { type: 'boolean' },
    file: { type: 'string', default: path.join(repo, 'registry/vue-native-audit.json') },
    'source-root': { type: 'string', default: repo },
  },
});
try {
  const doc = JSON.parse(fs.readFileSync(values.file, 'utf8'));
  if (!Array.isArray(doc.issues)) throw new Error('issues must be an array');
  for (const issue of doc.issues) {
    if (issue.status !== 'fixed' || !issue.documentationEvidence) continue;
    for (const source of issue.documentationEvidence.sourceFiles) {
      const file = path.resolve(values['source-root'], source);
      if (!fs.existsSync(file)) throw new Error(`${issue.id}: missing documentation ${source}`);
      const content = fs.readFileSync(file, 'utf8');
      if (!/^## API\s*$/m.test(content))
        throw new Error(`${issue.id}: missing API section in ${source}`);
    }
  }
  const previous = doc.summary.issues;
  const counts = (field, existing) => {
    const result = Object.fromEntries(Object.keys(existing).map((key) => [key, 0]));
    for (const issue of doc.issues) result[issue[field]] = (result[issue[field]] ?? 0) + 1;
    return Object.fromEntries(Object.entries(result).sort(([a], [b]) => a.localeCompare(b)));
  };
  const expected = {
    ...previous,
    total: doc.issues.length,
    bySeverity: counts('severity', previous.bySeverity),
    byStatus: counts('status', previous.byStatus),
  };
  if (JSON.stringify(previous) !== JSON.stringify(expected)) {
    if (values.check)
      throw new Error('summary.issues is stale; run node registry/tools/vue-native-status.mjs');
    doc.summary.issues = expected;
    fs.writeFileSync(values.file, `${JSON.stringify(doc, null, 2)}\n`);
  }
  console.log(
    `[vue-native] ${expected.total} issues; status=${JSON.stringify(expected.byStatus)}; documentation evidence verified`,
  );
} catch (error) {
  console.error(`[vue-native] ${error.message}`);
  process.exitCode = 1;
}
