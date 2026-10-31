import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  readAudit,
  recommendTasks,
  summarizeAudit,
  validateAudit,
} from '../../registry/tools/audit-workflow.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const state = readAudit(root);
const metadata = readJson('registry/components.json').components;
const foundations = readJson('registry/foundation.json').packages;
const byId = new Map(state.tasks.map((task) => [task.id, task]));
const oldScanPath = 'docs/history/vue-native-audit-2026-10-23.json';
// Immutable evidence from 4bac25ce, independent of whether CI fetches Git history.
const oldScanSha256 = '57e84a3aee2fe30c60adfc4e8effb726975435dce395e3ea7ec87f039f3b8d98';
const archived = readJson(oldScanPath);

function historicalDeliveries() {
  const text = fs.readFileSync(path.join(root, state.legacyEvidence.completedBaseline), 'utf8');
  const byTitle = new Map(metadata.map((component) => [component.exportName, component.name]));
  return text.split('\n').flatMap((line) => {
    const columns = line
      .replace(/^\||\|$/g, '')
      .split('|')
      .map((part) => part.trim());
    if (columns[1] !== '已完整验收并交付') return [];
    const name = byTitle.get(columns[0]);
    assert.ok(name, `Historical delivery is still a known component: ${columns[0]}`);
    return [
      {
        id: `CMP:${name}`,
        evidence: [...columns[2].matchAll(/\]\(([^)]+)\)/g)].map(
          (match) => `docs/audit/${match[1]}`,
        ),
      },
    ];
  });
}

test('the previous scan is archived byte for byte, including every issue and reviewed-file record', () => {
  const bytes = fs.readFileSync(path.join(root, oldScanPath));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), oldScanSha256);
  assert.equal(state.legacyEvidence.scan, oldScanPath);
  assert.equal(archived.issues.length, archived.summary.issues.total);
  assert.equal(
    Object.values(archived.components).reduce(
      (sum, component) => sum + component.reviewedFiles.length,
      0,
    ) +
      Object.values(archived.sharedSurfaces).reduce(
        (sum, surface) => sum + surface.reviewedFiles.length,
        0,
      ),
    archived.summary.reviewedProductionSourceFiles,
  );
  assert.ok(archived.sessionLog.length > 0);
  assert.ok(archived.batches.length > 0);
  for (const key of ['summary', 'overallStatus', 'currentBatch', 'components', 'sharedSurfaces'])
    assert.equal(Object.hasOwn(state, key), false, `Old current-state field removed: ${key}`);
});

test('dated deliveries keep their evidence and meaning without inheriting the old all-completed board', () => {
  const deliveries = historicalDeliveries();
  assert.ok(deliveries.length > 0, 'An empty historical table must not pass migration');
  const historicalIds = new Set(deliveries.map((entry) => entry.id));
  for (const entry of deliveries) {
    const task = byId.get(entry.id);
    assert.ok(task, entry.id);
    assert.equal(task.architectureStatus, 'done', entry.id);
    assert.ok(['historical_passed', 'passed'].includes(task.acceptanceStatus), entry.id);
    for (const file of entry.evidence)
      assert.ok(task.evidence.includes(file), `${entry.id}: ${file}`);
    for (const file of entry.evidence)
      assert.ok(
        task.historicalAcceptance.includes(file),
        `${entry.id}: retained historical ${file}`,
      );
  }
  for (const task of state.tasks.filter((task) => task.acceptanceStatus === 'historical_passed'))
    assert.ok(historicalIds.has(task.id), `No new historical pass may be invented: ${task.id}`);

  const oldComponents = readJson(state.legacyEvidence.implementationComponents).components;
  const oldFoundations = readJson(state.legacyEvidence.implementationFoundation).packages;
  assert.ok(oldComponents.some((component) => component.status === 'completed'));
  assert.ok(oldComponents.some((component) => component.apiStatus && component.layerNotes));
  assert.ok(oldFoundations.some((foundation) => foundation.verification && foundation.dimensions));
  if (state.revision === 0) {
    const summary = summarizeAudit(state);
    assert.equal(summary.components.historicalAccepted, deliveries.length);
    assert.equal(summary.components.architectureDone, deliveries.length);
    assert.equal(summary.components.finalAccepted, 0);
    assert.equal(summary.foundations.finalAccepted, 0);
    assert.ok(summary.components.architectureDone < summary.components.total);
  }
});

test('every current component and foundation has one task, with real owned paths and preserved evidence', () => {
  const expected = new Set([
    ...metadata.map((component) => `CMP:${component.name}`),
    ...foundations.map((foundation) => `FND:${foundation.dir}`),
  ]);
  const tasks = state.tasks.filter((task) => task.kind !== 'shared');
  assert.equal(new Set(tasks.map((task) => task.id)).size, tasks.length);
  assert.deepEqual(new Set(tasks.map((task) => task.id)), expected);
  for (const task of tasks) {
    assert.ok(task.existingWork.includes(oldScanPath), task.id);
    for (const file of [...task.evidence, ...task.existingWork])
      assert.ok(fs.existsSync(path.join(root, file)), `${task.id}: ${file}`);
    for (const ownedPath of task.owns) {
      assert.equal(path.isAbsolute(ownedPath), false, ownedPath);
      assert.doesNotMatch(ownedPath, /[*?[\]\\]/);
      const owned = fs.statSync(path.join(root, ownedPath));
      assert.ok(owned.isDirectory() || owned.isFile(), ownedPath);
    }
  }
  assert.doesNotThrow(() => validateAudit(state, root));
});

test('partial remediation and read-only inventory survive migration without pretending final acceptance', () => {
  const cases = [
    ['CMP:menu', 'docs/audit/2026-10-28-menu-native-actions-audit.md'],
    ['CMP:select', 'docs/audit/2026-10-28-space-contract-audit.md'],
    ['CMP:upload', 'docs/audit/2026-10-29-upload-progress-audit.md'],
    ['CMP:progress', 'docs/audit/2026-10-29-upload-progress-audit.md'],
    ['CMP:steps', 'docs/audit/2026-10-25-steps-native-slots-remediation.md'],
    ['CMP:masonry', 'docs/audit/2026-10-24-masonry-ssr-remediation.md'],
    ['CMP:mentions', 'docs/audit/2026-10-25-mentions-empty-content-remediation.md'],
    ['FND:locale', 'docs/audit/2026-10-29-config-provider-contract-audit.md'],
    ['FND:form-core', 'docs/audit/2026-10-29-config-provider-contract-audit.md'],
  ];
  for (const [id, evidence] of cases) {
    assert.ok(byId.get(id).existingWork.includes(evidence), id);
    if (state.revision === 0) assert.equal(byId.get(id).architectureStatus, 'partial', id);
  }
  const theme = byId.get('FND:theme');
  assert.equal(theme.architectureStatus, 'done');
  assert.ok(theme.evidence.includes('docs/audit/evidence/theme-foundation-source-acceptance.json'));
  const tree = byId.get('CMP:tree');
  assert.ok(tree.existingWork.includes('docs/audit/2026-10-29-tree-readonly-inventory.md'));
  if (state.revision === 0) {
    assert.equal(tree.architectureStatus, 'not_started');
    assert.equal(theme.acceptanceStatus, 'not_started');
    assert.ok(tree.issues.some((issue) => issue.blocking && issue.status === 'open'));
    assert.equal(state.dispatch.status, 'paused');
    assert.ok(state.tasks.every((task) => task.assignment === null));
    assert.deepEqual(state.finalAcceptance, {
      status: 'not_started',
      sourceCommit: null,
      gates: [],
    });
  }
  const paused = structuredClone(state);
  paused.dispatch.status = 'paused';
  assert.deepEqual(recommendTasks(paused), []);
});

test('progress is derived from task data rather than a fixed historical delivery count', () => {
  const before = summarizeAudit(state);
  const changed = structuredClone(state);
  const sample = changed.tasks.find((task) => task.kind === 'component');
  changed.tasks.push({
    ...structuredClone(sample),
    id: 'CMP:future-fixture',
    ref: 'future-fixture',
    architectureStatus: 'done',
    acceptanceStatus: 'historical_passed',
    historicalAcceptance: [state.legacyEvidence.completedBaseline],
    assignment: null,
  });
  const after = summarizeAudit(changed);
  assert.equal(after.components.total, before.components.total + 1);
  assert.equal(after.components.architectureDone, before.components.architectureDone + 1);
  assert.equal(after.components.historicalAccepted, before.components.historicalAccepted + 1);
  assert.equal(after.components.finalAccepted, before.components.finalAccepted);
  assert.deepEqual(after.foundations, before.foundations);

  const frozen = structuredClone(state);
  const originallyAccepted = frozen.tasks.find((task) => task.historicalAcceptance?.length);
  const retainedEvidence = [...originallyAccepted.historicalAcceptance];
  originallyAccepted.acceptanceStatus = 'passed';
  assert.equal(
    summarizeAudit(frozen).components.historicalAccepted,
    before.components.historicalAccepted,
  );
  assert.deepEqual(originallyAccepted.historicalAcceptance, retainedEvidence);
});
