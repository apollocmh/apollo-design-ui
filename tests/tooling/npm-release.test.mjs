import assert from 'node:assert/strict';
import test from 'node:test';
import { latestArtifact, registryDecision, releasePackages } from '../../scripts/npm-release.mjs';

const pkg = (name, dependencies = {}) => ({
  name: `@apollo-design/${name}`,
  version: '0.1.9',
  dependencies,
});

test('release orders public dependencies before consumers and excludes private packages', () => {
  const packages = [
    pkg('ui', { '@apollo-design/utils': 'workspace:*' }),
    { ...pkg('docs'), private: true },
    pkg('utils'),
  ];
  assert.deepEqual(
    releasePackages(packages, '0.1.9').map((p) => p.name),
    ['@apollo-design/utils', '@apollo-design/ui'],
  );
});

test('release rejects version drift, private runtime dependencies and dependency cycles', () => {
  assert.throws(() => releasePackages([pkg('ui')], '0.2.0'), /mismatch/);
  assert.throws(() => releasePackages([pkg('ui')], '0.1.9-beta.1'), /stable/);
  assert.throws(
    () =>
      releasePackages(
        [pkg('ui', { '@apollo-design/docs': 'workspace:*' }), { ...pkg('docs'), private: true }],
        '0.1.9',
      ),
    /private dependency/,
  );
  assert.throws(
    () =>
      releasePackages(
        [pkg('a', { '@apollo-design/b': '*' }), pkg('b', { '@apollo-design/a': '*' })],
        '0.1.9',
      ),
    /cycle/,
  );
});

test('recovery skips identical published bytes, rejects conflicts and permits absent versions', () => {
  const packageInfo = { ...pkg('ui'), integrity: 'sha512-expected' };
  assert.equal(registryDecision(null, packageInfo), 'publish');
  assert.equal(registryDecision({ versions: { '0.0.0-stage': {} } }, packageInfo), 'publish');
  const registry = { versions: { '0.1.9': { dist: { integrity: 'sha512-expected' } } } };
  assert.equal(registryDecision(registry, packageInfo), 'existing');
  registry.versions['0.1.9'].dist.integrity = 'sha512-different';
  assert.throws(() => registryDecision(registry, packageInfo), /existing version differs/);
  assert.throws(
    () => registryDecision({ 'dist-tags': { latest: '0.2.0' } }, packageInfo),
    /backwards/,
  );
});

test('artifact resolution never falls back from an expired latest attempt to an old green result', () => {
  const artifact = (name, expired = false) => ({ name, expired });
  assert.equal(
    latestArtifact(
      [artifact('final-acceptance-1'), artifact('final-acceptance-2-upload-retry-1')],
      'final-acceptance',
    ).name,
    'final-acceptance-2-upload-retry-1',
  );
  assert.throws(
    () =>
      latestArtifact(
        [artifact('final-acceptance-1'), artifact('final-acceptance-2', true)],
        'final-acceptance',
      ),
    /expired/,
  );
  assert.throws(
    () => latestArtifact([artifact('acceptance-layer-build-1')], 'final-acceptance'),
    /missing/,
  );
});
