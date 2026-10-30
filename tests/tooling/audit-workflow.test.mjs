import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { renderProgress } from '../../registry/tools/audit-progress.mjs';
import {
  readAudit,
  recommendTasks,
  recoverAuditLock,
  summarizeAudit,
  validateAudit,
} from '../../registry/tools/audit-workflow.mjs';

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cli = path.join(project, 'registry/tools/vue-native-status.mjs');
const engine = pathToFileURL(path.join(project, 'registry/tools/audit-workflow.mjs')).href;
function fixture(t, count = 3) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-audit-workflow-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'registry'));
  fs.copyFileSync(
    path.join(project, 'registry/vue-native-audit.schema.json'),
    path.join(root, 'registry/vue-native-audit.schema.json'),
  );
  const tasks = Array.from({ length: count }, (_, index) => ({
    id: `CMP:item-${index}`,
    ref: `item-${index}`,
    title: `Item${index}`,
    kind: 'component',
    architectureStatus: 'not_started',
    acceptanceStatus: 'not_started',
    workDependencies: [],
    owns: [`packages/ui/src/item-${index}`],
    assignment: null,
    evidence: [],
    existingWork: [],
    issues: [],
  }));
  const doc = {
    schemaVersion: 2,
    round: 'fixture',
    phase: 'architecture',
    revision: 0,
    dispatch: { status: 'running', maxParallel: 5, integrator: 'root' },
    tasks,
    finalAcceptance: { status: 'not_started', sourceCommit: null, gates: [] },
  };
  const file = path.join(root, 'registry/vue-native-audit.json');
  fs.writeFileSync(
    path.join(root, 'registry/components.json'),
    JSON.stringify({ components: tasks.map((task) => ({ name: task.ref })) }),
  );
  fs.writeFileSync(path.join(root, 'registry/foundation.json'), JSON.stringify({ packages: [] }));
  const save = () => fs.writeFileSync(file, JSON.stringify(doc));
  save();
  const run = (...args) =>
    spawnSync(process.execPath, [cli, '--source-root', root, ...args], { encoding: 'utf8' });
  const report = (scope, extra = {}) => {
    const file = path.join(root, 'focused.json');
    fs.writeFileSync(
      file,
      JSON.stringify({
        passed: true,
        scope: [scope],
        checks: ['core', 'types'].map((kind) => ({
          kind,
          command: `focused ${kind}`,
          exitCode: 0,
          signal: null,
        })),
        ...extra,
      }),
    );
    return file;
  };
  return { root, doc, file, save, run, report };
}

test('paused state is read-only, keeps an interrupted owner and offers no duplicate work', (t) => {
  const f = fixture(t);
  assert.equal(f.run('--claim', 'CMP:item-0', '--owner', 'worker').status, 0);
  f.doc = readAudit(f.root);
  f.doc.dispatch.status = 'paused';
  fs.writeFileSync(f.file, JSON.stringify(f.doc));
  const before = fs.readFileSync(f.file, 'utf8');
  assert.deepEqual(recommendTasks(f.doc), []);
  assert.equal(f.run('--check').status, 0);
  assert.notEqual(f.run('--claim', 'CMP:item-1', '--owner', 'other').status, 0);
  assert.equal(fs.readFileSync(f.file, 'utf8'), before);
  assert.equal(readAudit(f.root).tasks[0].assignment.owner, 'worker');
});

test('ownership conflicts and a sixth active task fail without changing another assignment', (t) => {
  const f = fixture(t, 7);
  f.doc.tasks[6].owns = ['packages/ui/src/item-0/inner'];
  f.save();
  for (let index = 0; index < 5; index++)
    assert.equal(f.run('--claim', `CMP:item-${index}`, '--owner', `worker-${index}`).status, 0);
  const before = fs.readFileSync(f.file, 'utf8');
  assert.notEqual(f.run('--claim', 'CMP:item-5', '--owner', 'sixth').status, 0);
  assert.notEqual(f.run('--claim', 'CMP:item-6', '--owner', 'overlap').status, 0);
  assert.equal(fs.readFileSync(f.file, 'utf8'), before);
  assert.equal(f.run('--release', 'CMP:item-1', '--owner', 'worker-1').status, 0);
  assert.notEqual(f.run('--claim', 'CMP:item-6', '--owner', 'overlap').status, 0);
  assert.equal(readAudit(f.root).tasks[0].assignment.owner, 'worker-0');
});

test('architecture completion needs focused success, but never waits for final acceptance', (t) => {
  const f = fixture(t);
  f.doc.tasks[1].workDependencies = ['CMP:item-0'];
  f.save();
  assert.deepEqual(
    recommendTasks(f.doc).map((task) => task.id),
    ['CMP:item-0', 'CMP:item-2'],
  );
  assert.equal(f.run('--claim', 'CMP:item-0', '--owner', 'worker').status, 0);
  assert.notEqual(f.run('--claim', 'CMP:item-0', '--owner', 'second').status, 0);
  const failedReport = f.report('packages/ui/src/item-0', {
    checks: [
      { kind: 'core', command: 'failed core', exitCode: 3, signal: null },
      { kind: 'types', command: 'types', exitCode: 0, signal: null },
    ],
  });
  assert.notEqual(
    f.run('--complete', 'CMP:item-0', '--owner', 'worker', '--report', failedReport).status,
    0,
  );
  assert.equal(readAudit(f.root).tasks[0].assignment.owner, 'worker');
  const validReport = f.report('packages/ui/src/item-0');
  assert.equal(
    f.run('--complete', 'CMP:item-0', '--owner', 'worker', '--report', validReport).status,
    0,
  );
  const doc = readAudit(f.root);
  assert.equal(doc.tasks[0].architectureStatus, 'done');
  assert.equal(doc.tasks[0].verification.passed, true);
  assert.equal(doc.tasks[0].acceptanceStatus, 'not_started');
  assert.equal(doc.finalAcceptance.status, 'not_started');
  assert.equal(f.run('--claim', 'CMP:item-1', '--owner', 'next').status, 0);
});

test('blocking issues allow repair work but prevent completion; non-blocking deferrals retain their reason', (t) => {
  const f = fixture(t);
  f.doc.tasks[0].issues = [
    {
      id: 'minor',
      status: 'deferred',
      blocking: false,
      impact: 'cosmetic only',
      reason: 'final visual review',
    },
  ];
  f.doc.tasks[1].issues = [
    {
      id: 'data',
      status: 'open',
      blocking: true,
      impact: 'lost model data',
      reason: 'must fix before completion',
    },
  ];
  f.save();
  assert.ok(recommendTasks(f.doc).some((task) => task.id === 'CMP:item-1'));
  assert.equal(f.run('--claim', 'CMP:item-0', '--owner', 'worker').status, 0);
  assert.equal(
    f.run(
      '--complete',
      'CMP:item-0',
      '--owner',
      'worker',
      '--report',
      f.report('packages/ui/src/item-0'),
    ).status,
    0,
  );
  assert.equal(f.run('--claim', 'CMP:item-1', '--owner', 'repair').status, 0);
  const claimed = fs.readFileSync(f.file, 'utf8');
  const report = f.report('packages/ui/src/item-1');
  const complete = () => f.run('--complete', 'CMP:item-1', '--owner', 'repair', '--report', report);
  const blocked = complete();
  assert.notEqual(blocked.status, 0);
  assert.match(blocked.stderr, /blocking issue/);
  assert.equal(fs.readFileSync(f.file, 'utf8'), claimed);
  const doc = readAudit(f.root);
  assert.equal(doc.tasks[1].assignment.owner, 'repair');
  doc.tasks[1].issues[0].status = 'fixed';
  fs.writeFileSync(f.file, JSON.stringify(doc));
  assert.equal(complete().status, 0);
  assert.equal(readAudit(f.root).tasks[1].architectureStatus, 'done');
});

test('SIGTERM during an update keeps valid state and can recover only a dead writer lock', (t) => {
  const f = fixture(t);
  assert.equal(f.run('--claim', 'CMP:item-0', '--owner', 'worker').status, 0);
  const before = fs.readFileSync(f.file, 'utf8');
  const child = spawnSync(process.execPath, [
    '--input-type=module',
    '-e',
    `import {updateAudit} from ${JSON.stringify(engine)}; updateAudit(${JSON.stringify(f.root)},()=>process.kill(process.pid,'SIGTERM'));`,
  ]);
  assert.equal(child.signal, 'SIGTERM');
  assert.equal(fs.readFileSync(f.file, 'utf8'), before);
  assert.notEqual(f.run('--release', 'CMP:item-0', '--owner', 'worker').status, 0);
  recoverAuditLock(f.root);
  assert.equal(f.run('--release', 'CMP:item-0', '--owner', 'worker').status, 0);
  assert.equal(readAudit(f.root).tasks[0].architectureStatus, 'partial');
  fs.writeFileSync(`${f.file}.lock`, JSON.stringify({ pid: process.pid }));
  assert.throws(() => recoverAuditLock(f.root), /still running/);
  assert.equal(fs.existsSync(`${f.file}.lock`), true);
});

test('concurrent claims never lose a successful write and can retry a visible lock failure', async (t) => {
  const f = fixture(t);
  const claim = (index) =>
    new Promise((resolve) => {
      const child = spawn(
        process.execPath,
        [
          cli,
          '--source-root',
          f.root,
          '--claim',
          `CMP:item-${index}`,
          '--owner',
          `worker-${index}`,
        ],
        { stdio: 'ignore' },
      );
      child.on('exit', (code) => resolve({ index, code }));
    });
  const results = await Promise.all([claim(0), claim(1)]);
  const succeeded = results.filter((result) => result.code === 0);
  assert.ok(succeeded.length >= 1);
  assert.equal(readAudit(f.root).revision, succeeded.length);
  for (const result of results)
    if (result.code !== 0) assert.equal((await claim(result.index)).code, 0);
  const doc = readAudit(f.root);
  assert.equal(doc.revision, 2);
  assert.deepEqual(
    doc.tasks.slice(0, 2).map((task) => task.assignment.owner),
    ['worker-0', 'worker-1'],
  );
});

test('progress is derived and historical delivery stays visible after final acceptance', (t) => {
  const f = fixture(t);
  f.doc.tasks[0].architectureStatus = 'done';
  f.doc.tasks[0].evidence = ['registry/components.json'];
  f.doc.tasks[0].historicalAcceptance = ['registry/components.json'];
  f.doc.tasks[0].acceptanceStatus = 'historical_passed';
  assert.equal(summarizeAudit(f.doc).components.architectureDone, 1);
  assert.match(renderProgress(f.doc), /1\/3/);
  f.doc.tasks[1].architectureStatus = 'done';
  f.doc.tasks[0].acceptanceStatus = 'passed';
  assert.equal(summarizeAudit(f.doc).components.architectureDone, 2);
  assert.equal(summarizeAudit(f.doc).components.historicalAccepted, 1);
  assert.match(renderProgress(f.doc), /2\/3/);
  assert.throws(() => validateAudit(f.doc, f.root), /final acceptance/);
});
