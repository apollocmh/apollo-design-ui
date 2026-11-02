import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  ACCEPTANCE_LAYERS,
  acceptanceLayerPlan,
  aggregateAcceptance,
  captureFrozenInputs,
  readLayerReports,
  verifyFrozenInputs,
} from '../../scripts/frozen-acceptance.mjs';
import { fullPlan } from '../../scripts/verification.mjs';
import { buildCases } from '../visual/matrix.mjs';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-frozen-inputs-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, content) => {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), content);
  };
  write('package.json', '{"packageManager":"pnpm@12.4.2"}');
  write('pnpm-lock.yaml', 'lockfileVersion: 9');
  write('packages/ui/dist/index.mjs', 'export const UI=1;');
  write('packages/docs/dist/index.html', '<main>Docs</main>');
  write('packages/docs/.generated/content.ts', 'export default [];');
  const manifest = captureFrozenInputs(root, 'frozen-source');
  const reports = Object.keys(ACCEPTANCE_LAYERS).map((layer) => ({
    layer,
    ciRunAttempt: 1,
    sourceCommit: manifest.sourceCommit,
    provenance: { inputDigest: manifest.inputDigest, toolchain: manifest.toolchain },
    passed: true,
    checks: acceptanceLayerPlan(layer).checks.map((check) => ({
      id: check.id,
      kind: check.kind,
      commandArgs: check.args,
      exitCode: 0,
      signal: null,
      startedAt: '2026-11-02T00:00:00Z',
      finishedAt: '2026-11-02T00:00:01Z',
    })),
  }));
  reports.find((report) => report.layer === 'visual').visual = {
    passed: true,
    pending: 0,
    results: buildCases({ apollo: true }).map((item) => ({ id: item.id, verdict: 'PASS' })),
  };
  return { root, write, manifest, reports };
}

test('distributed layers cover the exact original complete plan once, with independent Docs feedback', () => {
  const all = Object.keys(ACCEPTANCE_LAYERS).flatMap((layer) => acceptanceLayerPlan(layer).checks);
  assert.equal(all.length, 14);
  assert.deepEqual(
    all.map((check) => check.id).sort(),
    fullPlan()
      .checks.map((check) => check.id)
      .sort(),
  );
  assert.equal(new Set(all.map((check) => check.id)).size, 14);
  assert.deepEqual(
    acceptanceLayerPlan('build').checks.map((check) => check.kind),
    ['registry', 'format', 'build'],
  );
  assert.deepEqual(
    acceptanceLayerPlan('docs').checks.map((check) => check.kind),
    ['docs-browser', 'docs-types', 'docs-tests'],
  );
  assert.throws(() => acceptanceLayerPlan('unknown'), /Unknown acceptance layer/);
});

test('SDK, generated Docs, lockfile and source drift reject artifact reuse', (t) => {
  const f = fixture(t);
  assert.doesNotThrow(() => verifyFrozenInputs(f.root, f.manifest, 'frozen-source'));
  assert.throws(() => verifyFrozenInputs(f.root, f.manifest, 'other-source'), /exact source SHA/);
  for (const file of [
    'packages/ui/dist/index.mjs',
    'packages/docs/.generated/content.ts',
    'packages/docs/dist/extra.html',
    'pnpm-lock.yaml',
  ]) {
    const name = path.join(f.root, file);
    const original = fs.existsSync(name) ? fs.readFileSync(name) : null;
    f.write(file, 'unexpected change');
    assert.throws(() => verifyFrozenInputs(f.root, f.manifest, 'frozen-source'), /changed|differs/);
    if (original) fs.writeFileSync(name, original);
    else fs.rmSync(name);
  }
});

test('final aggregation requires all 14 checks, one SHA and the exact 1875 unique visual cases', (t) => {
  const f = fixture(t);
  const result = aggregateAcceptance(f.reports, f.manifest, 'frozen-source');
  assert.equal(result.passed, true);
  assert.equal(result.checks.length, 14);
  assert.equal(result.layers.length, 6);
});

test('portable SDK readers may use another OS while Node, lockfile and every built byte remain fixed', (t) => {
  const f = fixture(t);
  const manifest = structuredClone(f.manifest);
  manifest.producerHost = {
    platform: process.platform === 'darwin' ? 'linux' : 'darwin',
    arch: 'x64',
  };
  assert.doesNotThrow(() => verifyFrozenInputs(f.root, manifest, 'frozen-source'));
  manifest.toolchain.node = 'different-node-version';
  assert.throws(() => verifyFrozenInputs(f.root, manifest, 'frozen-source'), /toolchain/);
});

test('missing, repeated, nonzero, interrupted and incomplete checks cannot aggregate to PASS', (t) => {
  const f = fixture(t);
  for (const mutate of [
    (reports) => reports.pop(),
    (reports) => {
      reports[1] = reports[0];
    },
    (reports) => {
      reports[1].sourceCommit = 'different';
    },
    (reports) => {
      reports[1].provenance.inputDigest = 'different';
    },
    (reports) => {
      reports[1].passed = false;
    },
    (reports) => {
      reports[1].checks = [];
    },
    (reports) => {
      reports[1].checks[0].exitCode = 1;
    },
    (reports) => {
      reports[1].checks[0].signal = 'SIGTERM';
    },
    (reports) => {
      delete reports[1].checks[0].finishedAt;
    },
    (reports) => {
      reports[1].checks[0].commandArgs = ['wrong-test'];
    },
    (reports) => {
      const v = reports.find((r) => r.layer === 'visual').visual;
      v.results[1] = v.results[0];
    },
    (reports) => {
      reports.find((r) => r.layer === 'visual').visual.pending = 1;
    },
  ]) {
    const reports = structuredClone(f.reports);
    mutate(reports);
    assert.throws(() => aggregateAcceptance(reports, f.manifest, 'frozen-source'));
  }
});

test('a failed, skipped or cancelled Actions job cannot pass on otherwise green reports', (t) => {
  const f = fixture(t);
  for (const result of ['failure', 'cancelled', 'skipped'])
    assert.throws(
      () =>
        aggregateAcceptance(f.reports, f.manifest, 'frozen-source', {
          build: { result: 'success' },
          checks: { result },
        }),
      /required CI layer/,
    );
});

test('layer reruns preserve history and select the latest attempt even when it fails', (t) => {
  const f = fixture(t);
  const directory = path.join(f.root, 'reports');
  for (const report of f.reports)
    f.write(
      `reports/acceptance-layer-${report.layer}-1/acceptance-${report.layer}.json`,
      JSON.stringify(report),
    );
  const docs = structuredClone(f.reports.find((report) => report.layer === 'docs'));
  docs.ciRunAttempt = 2;
  const latest = 'reports/acceptance-layer-docs-2/acceptance-docs.json';
  f.write(latest, JSON.stringify(docs));
  // A cancelled write from the superseded attempt must not break a valid resumption.
  f.write('reports/acceptance-layer-docs-1/acceptance-docs.json', '{');
  let reports = readLayerReports(directory);
  assert.equal(reports.find((report) => report.layer === 'docs').ciRunAttempt, 2);
  assert.equal(aggregateAcceptance(reports, f.manifest, 'frozen-source').passed, true);
  docs.passed = false;
  f.write(latest, JSON.stringify(docs));
  reports = readLayerReports(directory);
  assert.equal(reports.find((report) => report.layer === 'docs').passed, false);
  assert.throws(() => aggregateAcceptance(reports, f.manifest, 'frozen-source'), /docs: failed/);
  fs.rmSync(path.join(f.root, latest));
  assert.throws(() => readLayerReports(directory), /ENOENT/);
  docs.passed = true;
  f.write(latest, JSON.stringify(docs));
  const recovery = 'reports/acceptance-layer-docs-2-upload-retry-1/acceptance-docs.json';
  f.write(recovery, JSON.stringify(docs));
  assert.equal(
    readLayerReports(directory).find((report) => report.layer === 'docs').evidenceArtifacts.length,
    2,
  );
  docs.passed = false;
  f.write(recovery, JSON.stringify(docs));
  assert.throws(() => readLayerReports(directory), /conflicting reports/);
});
