/** The existing final plan, split across independent readers of one build. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { buildCases } from '../tests/visual/matrix.mjs';
import { artifactDigest, fullPlan } from './verification.mjs';

export const ACCEPTANCE_LAYERS = {
  build: ['registry', 'format', 'build'],
  runtime: ['coverage'],
  types: ['types', 'core'],
  consumers: ['consumer-browser', 'consumer'],
  visual: ['visual'],
  docs: ['docs-browser', 'docs-types', 'docs-tests'],
};
export function acceptanceLayerPlan(layer) {
  assert.ok(Object.hasOwn(ACCEPTANCE_LAYERS, layer), `Unknown acceptance layer: ${layer}`);
  const plan = fullPlan();
  return {
    ...plan,
    layer,
    checks: plan.checks.filter((check) => ACCEPTANCE_LAYERS[layer].includes(check.kind)),
  };
}
const hash = (value) => createHash('sha256').update(value).digest('hex');
function collectFiles(root, directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    return entry.isDirectory()
      ? collectFiles(root, file)
      : [[file, hash(fs.readFileSync(path.join(root, file)))]];
  });
}
export function captureFrozenInputs(root, sourceCommit) {
  const directories = fs
    .readdirSync(path.join(root, 'packages'))
    .filter((name) => fs.existsSync(path.join(root, 'packages', name, 'dist')))
    .map((name) => `packages/${name}/dist`);
  directories.push('packages/docs/.generated');
  const files = Object.fromEntries(
    directories
      .flatMap((directory) => collectFiles(root, directory))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
  );
  const toolchain = {
    node: process.version,
    packageManager: JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
      .packageManager,
    lockfileSha256: hash(fs.readFileSync(path.join(root, 'pnpm-lock.yaml'))),
  };
  const artifact = artifactDigest(root);
  return {
    sourceCommit,
    toolchain,
    producerHost: { platform: process.platform, arch: process.arch },
    artifactDigest: artifact,
    files,
    inputDigest: hash(JSON.stringify({ sourceCommit, toolchain, artifact, files })),
  };
}
export function verifyFrozenInputs(root, manifest, sourceCommit) {
  assert.equal(
    manifest.sourceCommit,
    sourceCommit,
    'Frozen build must belong to this exact source SHA',
  );
  const current = captureFrozenInputs(root, sourceCommit);
  assert.deepEqual(current.toolchain, manifest.toolchain, 'Frozen toolchain or lockfile differs');
  assert.equal(
    current.inputDigest,
    manifest.inputDigest,
    'Frozen SDK, Docs or generated inputs changed',
  );
  return current;
}
export function aggregateAcceptance(reports, manifest, sourceCommit, ciJobResults) {
  if (ciJobResults)
    assert.ok(
      Object.values(ciJobResults).every((job) => job.result === 'success'),
      'A required CI layer failed, was cancelled or was skipped',
    );
  assert.equal(manifest.sourceCommit, sourceCommit);
  const layers = Object.keys(ACCEPTANCE_LAYERS);
  assert.equal(reports.length, layers.length, 'Every acceptance layer must provide a report');
  assert.deepEqual(
    reports.map((report) => report.layer).sort(),
    [...layers].sort(),
    'Missing or repeated acceptance layer',
  );
  const checks = [];
  for (const layer of layers) {
    const report = reports.find((entry) => entry.layer === layer);
    assert.equal(report.sourceCommit, sourceCommit, `${layer}: source SHA differs`);
    assert.equal(
      report.provenance?.inputDigest,
      manifest.inputDigest,
      `${layer}: frozen inputs differ`,
    );
    assert.equal(report.passed, true, `${layer}: failed, cancelled or incomplete`);
    const expected = acceptanceLayerPlan(layer).checks;
    assert.deepEqual(
      report.checks.map((check) => check.id),
      expected.map((check) => check.id),
      `${layer}: missing/repeated checks`,
    );
    for (let index = 0; index < expected.length; index++) {
      const check = report.checks[index];
      assert.equal(check.kind, expected[index].kind);
      assert.deepEqual(check.commandArgs, expected[index].args);
      assert.equal(check.exitCode, 0, `${layer}/${check.id}: nonzero or missing exit`);
      assert.equal(check.signal, null);
      assert.ok(!check.error, check.error);
      assert.ok(
        Date.parse(check.finishedAt) >= Date.parse(check.startedAt),
        `${layer}/${check.id}: incomplete timing`,
      );
      checks.push(check);
    }
  }
  const visual = reports.find((report) => report.layer === 'visual').visual;
  const expectedIds = buildCases({ apollo: true })
    .map((item) => item.id)
    .sort();
  assert.equal(expectedIds.length, 1875);
  assert.equal(visual?.pending, 0, 'Visual baselines must be complete');
  assert.equal(visual?.passed, true);
  assert.deepEqual(
    visual.results.map((item) => item.id).sort(),
    expectedIds,
    'Visual IDs must be the exact unique 1875-case matrix',
  );
  assert.ok(visual.results.every((item) => item.verdict === 'PASS'));
  return {
    stage: 'acceptance',
    sourceCommit,
    artifactDigest: manifest.artifactDigest,
    provenance: {
      inputDigest: manifest.inputDigest,
      toolchain: manifest.toolchain,
      producerHost: manifest.producerHost,
    },
    passed: true,
    checks: checks.sort((a, b) => Number.parseInt(a.id, 10) - Number.parseInt(b.id, 10)),
    layers: reports,
    ...(ciJobResults ? { ciJobResults } : {}),
  };
}
