import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(
  new URL('../../registry/tools/vue-native-status.mjs', import.meta.url),
);
function fixture(t, issue, summary) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-vue-native-status-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const file = path.join(root, 'audit.json');
  fs.writeFileSync(file, JSON.stringify({ issues: [issue], summary: { issues: summary } }));
  const run = (...args) =>
    spawnSync(process.execPath, [script, '--file', file, '--source-root', root, ...args], {
      encoding: 'utf8',
    });
  return { root, file, run };
}

test('H01: stale issue counters fail --check and can be regenerated without changing issue records', (t) => {
  const issue = { id: 'example', status: 'open', severity: 'P2' };
  const { file, run } = fixture(t, issue, {
    total: 0,
    byStatus: { open: 0 },
    bySeverity: { P2: 0 },
  });
  const before = fs.readFileSync(file, 'utf8');
  const stale = run('--check');
  assert.equal(stale.status, 1);
  assert.match(stale.stderr, /summary.issues is stale/);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  assert.equal(run().status, 0);
  const generated = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(generated.issues, [issue]);
  assert.deepEqual(generated.summary.issues, {
    total: 1,
    byStatus: { open: 1 },
    bySeverity: { P2: 1 },
  });
  assert.equal(run('--check').status, 0);
});

test('H01: a fixed documentation issue fails when its files or API content disappear', (t) => {
  const { root, run } = fixture(
    t,
    {
      id: 'table-docs',
      status: 'fixed',
      severity: 'P2',
      documentationEvidence: { sourceFiles: ['index.zh-CN.md', 'index.en-US.md'] },
    },
    { total: 1, byStatus: { fixed: 1 }, bySeverity: { P2: 1 } },
  );
  const missing = run('--check');
  assert.equal(missing.status, 1);
  assert.match(missing.stderr, /missing documentation/);
  for (const file of ['index.zh-CN.md', 'index.en-US.md'])
    fs.writeFileSync(
      path.join(root, file),
      '# Table\n\n## API\n\n| columns | dataSource | rowKey |\n',
    );
  assert.equal(run('--check').status, 0);
  fs.writeFileSync(path.join(root, 'index.en-US.md'), '# Table\n');
  const empty = run('--check');
  assert.equal(empty.status, 1);
  assert.match(empty.stderr, /missing API section/);
});
