import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../..');
test('the current status is derived without rewriting evidence or maintaining issue counters', () => {
  const file = path.join(root, 'registry/vue-native-audit.json');
  const before = fs.readFileSync(file, 'utf8');
  const result = spawnSync(
    process.execPath,
    ['registry/tools/vue-native-status.mjs', '--check', '--json'],
    { cwd: root, encoding: 'utf8' },
  );
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  const doc = JSON.parse(before);
  assert.equal(
    output.components.architectureDone,
    doc.tasks.filter((task) => task.kind === 'component' && task.architectureStatus === 'done')
      .length,
  );
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});
test('the original fixed-documentation evidence is retained and still points at actual API docs', () => {
  const archive = JSON.parse(
    fs.readFileSync(path.join(root, 'docs/history/vue-native-audit-2026-10-23.json'), 'utf8'),
  );
  const issues = archive.issues.filter(
    (issue) => issue.status === 'fixed' && issue.documentationEvidence,
  );
  assert.ok(issues.length > 0);
  for (const issue of issues)
    for (const file of issue.documentationEvidence.sourceFiles)
      assert.match(
        fs.readFileSync(path.join(root, file), 'utf8'),
        /^## API\s*$/m,
        `${issue.id}: ${file}`,
      );
});
