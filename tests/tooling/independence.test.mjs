import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

test('Registry supports Apollo-only components, preserves evidence and rejects drift without writing', (context) => {
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
    status: 'testing',
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
  assert.equal(generated.components.at(-1).status, 'testing');
  const tokenFile = path.join(root, 'registry/tokens.json');
  const tokens = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  tokens.layers.seed.status = 'in-progress';
  tokens.layers.seed.tokens.push('apolloExclusiveToken');
  fs.writeFileSync(tokenFile, JSON.stringify(tokens));
  execFileSync(process.execPath, [script]);
  const refreshed = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));
  assert.equal(refreshed.layers.seed.status, 'in-progress');
  assert.equal(refreshed.summary.seed, tokens.layers.seed.tokens.length);
  assert.deepEqual(generated.components[0].referenceEvidence, data.components[0].referenceEvidence);
  generated.components.at(-1).dependencies.components = ['apollo-only'];
  fs.writeFileSync(file, JSON.stringify(generated));
  assert.notEqual(spawnSync(process.execPath, [script]).status, 0);
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

test('visual CLI accepts package-manager separators and rejects unknown options', () => {
  const script = path.join(ROOT, 'tests/visual/apollo.mjs');
  assert.equal(spawnSync(process.execPath, [script, '--', '--help']).status, 0);
  assert.notEqual(spawnSync(process.execPath, [script, '--unknown-option']).status, 0);
});
