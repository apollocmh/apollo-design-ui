import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  acceptCandidates,
  checkEntry,
  digest,
  duplicateProblems,
  imagePath,
  readManifest,
} from '../visual/baseline-store.mjs';
import { buildCases } from '../visual/matrix.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('Static Registry supports Apollo-only components, preserves metadata and rejects drift without writing', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-registry-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'registry/tools'), { recursive: true });
  for (const name of ['components.json', 'dependencies.json', 'tokens.json'])
    fs.copyFileSync(path.join(ROOT, 'registry', name), path.join(root, 'registry', name));
  fs.copyFileSync(
    path.join(ROOT, 'registry/tools/gen-registry.mjs'),
    path.join(root, 'registry/tools/gen-registry.mjs'),
  );
  const file = path.join(root, 'registry/components.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.components.push({
    name: 'apollo-only',
    priority: 'P0',
    derived: {},
    dependencies: { components: ['button'], typeOnly: [] },
    notes: 'preserve this evidence',
  });
  fs.writeFileSync(file, JSON.stringify(data));
  const before = fs.readFileSync(file, 'utf8');
  const script = path.join(root, 'registry/tools/gen-registry.mjs');
  assert.equal(spawnSync(process.execPath, [script, '--check']).status, 1);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  execFileSync(process.execPath, [script]);
  assert.equal(spawnSync(process.execPath, [script, '--check']).status, 0);
  const generated = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(generated.components.at(-1).notes, 'preserve this evidence');
  assert.equal(Object.hasOwn(generated.components.at(-1), 'status'), false);
  const tokenFile = path.join(root, 'registry/tokens.json');
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  tokens.layers.seed.referenceNote = 'Apollo-owned token inventory';
  tokens.layers.seed.tokens.push('apolloExclusiveToken');
  fs.writeFileSync(tokenFile, JSON.stringify(tokens));
  execFileSync(process.execPath, [script]);
  const refreshed = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  assert.equal(refreshed.layers.seed.referenceNote, 'Apollo-owned token inventory');
  assert.equal(refreshed.summary.seed, tokens.layers.seed.tokens.length);
  assert.deepEqual(generated.components[0].referenceEvidence, data.components[0].referenceEvidence);
  generated.components.at(-1).dependencies.components = ['apollo-only'];
  fs.writeFileSync(file, JSON.stringify(generated));
  assert.notEqual(spawnSync(process.execPath, [script]).status, 0);
});

test('Retired implementation states stay archived and cannot become a second current state', (context) => {
  const archived = path.join(ROOT, 'docs/history/registry-implementation-2026-10-29');
  const components = JSON.parse(fs.readFileSync(path.join(archived, 'components.json'), 'utf8'));
  const foundation = JSON.parse(fs.readFileSync(path.join(archived, 'foundation.json'), 'utf8'));
  const tokens = JSON.parse(fs.readFileSync(path.join(archived, 'tokens.json'), 'utf8'));
  assert.equal(
    components.components.filter((entry) => entry.status === 'completed').length,
    components.components.length,
  );
  assert.ok(components.components.some((entry) => entry.layerNotes && entry.unitStatus));
  assert.ok(foundation.packages.every((entry) => entry.verification && entry.dimensions));
  assert.equal(
    tokens.layers.seed.status,
    'todo',
    'the historical token record is preserved even when its old state was stale',
  );
  // Immutable migration input from 4bac25ce; no deep Git fetch is needed to check it in CI.
  const baselineDigests = {
    'components.json': '67626840dc0c704259a1ee54b8ac2a9e743f06a35d51b25902c57b02b91fe878',
    'foundation.json': '135cf087f9a0bf22305ec947a664b7feabfade7d7e61a5204a6e1770d64af356',
    'tokens.json': '162e107d0028a3c6894fc0badc1d2dfa63d963016a781e6593a02e35ca4a015d',
  };
  for (const [file, digest] of Object.entries(baselineDigests)) {
    assert.equal(
      createHash('sha256')
        .update(fs.readFileSync(path.join(archived, file)))
        .digest('hex'),
      digest,
    );
  }

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-static-progress-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'registry/tools'), { recursive: true });
  for (const name of ['components.json', 'dependencies.json', 'tokens.json'])
    fs.copyFileSync(path.join(ROOT, 'registry', name), path.join(root, 'registry', name));
  const script = path.join(root, 'registry/tools/gen-registry.mjs');
  fs.copyFileSync(path.join(ROOT, 'registry/tools/gen-registry.mjs'), script);
  const file = path.join(root, 'registry/components.json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  data.components[0].status = 'completed';
  fs.writeFileSync(file, JSON.stringify(data));
  const before = fs.readFileSync(file, 'utf8');
  const result = spawnSync(process.execPath, [script, '--check'], { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /progress belongs to registry\/vue-native-audit.json/);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
});

test('Foundation facts regenerate without verification or task-state writes, and --check is read-only', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-foundation-facts-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'registry/tools'), { recursive: true });
  for (const name of ['components.json', 'foundation.json'])
    fs.copyFileSync(path.join(ROOT, 'registry', name), path.join(root, 'registry', name));
  const script = path.join(root, 'registry/tools/foundation-status.mjs');
  fs.copyFileSync(path.join(ROOT, 'registry/tools/foundation-status.mjs'), script);
  const file = path.join(root, 'registry/foundation.json');
  const original = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const pkg of [...original.packages, { dir: 'ui' }]) {
    const directory = path.join(root, 'packages', pkg.dir);
    fs.mkdirSync(path.join(directory, 'src'), { recursive: true });
    fs.copyFileSync(
      path.join(ROOT, 'packages', pkg.dir, 'package.json'),
      path.join(directory, 'package.json'),
    );
    fs.writeFileSync(path.join(directory, 'src/index.ts'), 'export const fixture = true;\n');
  }
  const before = fs.readFileSync(file, 'utf8');
  const run = (...args) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  assert.equal(run('--check').status, 1);
  assert.equal(fs.readFileSync(file, 'utf8'), before);
  assert.equal(run().status, 0);
  const refreshed = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.deepEqual(refreshed.referenceDecisions, original.referenceDecisions);
  assert.ok(refreshed.packages.every((pkg) => pkg.derived.srcFiles === 1));
  assert.ok(
    refreshed.packages.every(
      (pkg) => !Object.hasOwn(pkg, 'status') && !Object.hasOwn(pkg, 'verification'),
    ),
  );
  const updated = fs.readFileSync(file, 'utf8');
  assert.equal(run('--check').status, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), updated);
  assert.notEqual(run('--verify').status, 0, 'retired verification mode must not silently survive');
});

test('Visual acceptance requires complete, reviewed, untampered candidates and keeps missing baselines red', (context) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-baseline-'));
  context.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const candidate = path.join(root, 'candidate');
  const approved = path.join(root, 'approved');
  const id = 'button/type__light__desktop';
  assert.equal(checkEntry(approved, id), 'missing-approved-baseline');
  assert.throws(() => imagePath(root, '../../escape'));
  fs.mkdirSync(path.dirname(imagePath(candidate, id)), { recursive: true });
  fs.writeFileSync(imagePath(candidate, id), 'fixture image bytes');
  const manifest = {
    complete: true,
    entries: {
      [id]: {
        sha256: digest(imagePath(candidate, id)),
        environment: 'test',
        sourceCommit: 'test-commit',
      },
    },
  };
  const save = () =>
    fs.writeFileSync(path.join(candidate, 'manifest.json'), JSON.stringify(manifest));
  save();
  assert.throws(() => acceptCandidates(candidate, approved, [id], ''));
  manifest.complete = false;
  save();
  assert.throws(() => acceptCandidates(candidate, approved, [id], 'reviewed'));
  manifest.complete = true;
  save();
  acceptCandidates(candidate, approved, [id], 'Reviewed label, focus boundary and spacing');
  assert.equal(checkEntry(approved, id, readManifest(approved).entries[id]), null);
  fs.writeFileSync(imagePath(approved, id), 'changed');
  assert.equal(checkEntry(approved, id, readManifest(approved).entries[id]), 'image-hash-mismatch');
  fs.writeFileSync(imagePath(candidate, id), 'tampered candidate');
  assert.throws(() => acceptCandidates(candidate, approved, [id], 'reviewed'));
});

test('visual duplicates require a scenario explanation, without crossing theme or viewport groups', () => {
  const entries = {
    'button/basic__light__desktop': { environment: 'test', sha256: 'same' },
    'button/disabled__light__desktop': { environment: 'test', sha256: 'same' },
  };
  assert.equal(duplicateProblems(entries, {}).length, 1);
  assert.equal(
    duplicateProblems(entries, {
      button: {
        duplicateAllow: [
          { variants: ['basic', 'disabled'], reason: 'test-only fixture explanation' },
        ],
      },
    }).length,
    0,
  );
  assert.equal(
    duplicateProblems(
      { ...entries, 'button/basic__light__mobile': { environment: 'test', sha256: 'same' } },
      {},
    ).length,
    1,
  );
});

test('Apollo duplicate rules can reject an obsolete reference allowance', () => {
  const entries = {
    'layout/side__light__desktop': { environment: 'test', sha256: 'same' },
    'layout/collapsible__light__desktop': { environment: 'test', sha256: 'same' },
  };
  const reference = [{ variants: ['side', 'collapsible'], reason: 'Historical clipped toggle' }];
  assert.equal(duplicateProblems(entries, { layout: { duplicateAllow: reference } }).length, 0);
  assert.equal(
    duplicateProblems(entries, {
      layout: { duplicateAllow: reference, apolloDuplicateAllow: [] },
    }).length,
    1,
  );
});

test('audited Flex Alert and Layout states preserve the historical reference matrix', () => {
  for (const [component, nativeCount, referenceCount] of [
    ['flex', 42, 15],
    ['alert', 60, 18],
    ['layout', 51, 18],
  ]) {
    const native = buildCases({ component, apollo: true });
    assert.equal(native.length, nativeCount);
    assert.equal(new Set(native.map((item) => item.id)).size, nativeCount);
    assert.equal(buildCases({ component }).length, referenceCount);
    assert.equal(native.filter((item) => item.variant === 'native-focus').length, 3);
    assert.throws(() => buildCases({ component, variants: ['native-focus'] }));
  }
});

test('visual CLI accepts package-manager separators and rejects unknown options', () => {
  const script = path.join(ROOT, 'tests/visual/apollo.mjs');
  assert.equal(spawnSync(process.execPath, [script, '--', '--help']).status, 0);
  assert.notEqual(spawnSync(process.execPath, [script, '--unknown-option']).status, 0);
});
