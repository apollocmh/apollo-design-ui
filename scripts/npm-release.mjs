/** Publish only the immutable SDK from a successful, exact-tag acceptance. */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { pathToFileURL } from 'node:url';
import { aggregateAcceptance, verifyFrozenInputs } from './frozen-acceptance.mjs';
import { acceptedCheck } from './reuse-tag-acceptance.mjs';

const registry = 'https://registry.npmjs.org/';
const root = path.resolve(import.meta.dirname, '..');
const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const write = (file, value) => fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
const digest = (bytes, algorithm = 'sha512') =>
  `${algorithm}-${crypto.createHash(algorithm).update(bytes).digest('base64')}`;
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  assert.equal(result.status, 0, `${command} ${args.join(' ')}: ${result.error ?? result.stderr}`);
  return result.stdout.trim();
}
const api = (endpoint) => JSON.parse(run('gh', ['api', endpoint]));

export function releasePackages(packages, version) {
  assert.match(version, /^\d+\.\d+\.\d+$/, 'Only stable version tags publish latest');
  const publicPackages = packages.filter((pkg) => !pkg.private);
  assert.ok(publicPackages.length, 'No public packages');
  const sorted = [];
  const visiting = new Set();
  const visited = new Set();
  function visit(pkg) {
    if (visited.has(pkg.name)) return;
    assert.ok(!visiting.has(pkg.name), `Dependency cycle: ${pkg.name}`);
    assert.equal(pkg.version, version, `${pkg.name}: tag/version mismatch`);
    assert.match(pkg.name, /^@apollo-design\/[a-z0-9-]+$/);
    visiting.add(pkg.name);
    for (const name of Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies })) {
      if (!name.startsWith('@apollo-design/')) continue;
      const dependency = publicPackages.find((entry) => entry.name === name);
      assert.ok(dependency, `${pkg.name}: unpublished/private dependency ${name}`);
      visit(dependency);
    }
    visiting.delete(pkg.name);
    visited.add(pkg.name);
    sorted.push(pkg);
  }
  publicPackages.forEach(visit);
  return sorted;
}

export function registryDecision(metadata, pkg) {
  const existing = metadata?.versions?.[pkg.version];
  if (!existing) {
    const latest = metadata?.['dist-tags']?.latest;
    if (latest && /^\d+\.\d+\.\d+$/.test(latest)) {
      const current = latest.split('.').map(Number);
      const next = pkg.version.split('.').map(Number);
      const different = current.findIndex((value, index) => value !== next[index]);
      assert.ok(
        different < 0 || current[different] < next[different],
        `${pkg.name}: cannot move latest backwards`,
      );
    }
    return 'publish';
  }
  assert.equal(existing.dist.integrity, pkg.integrity, `${pkg.name}: existing version differs`);
  // A recovery of an older release must not move latest backwards.
  return 'existing';
}

export function latestArtifact(artifacts, prefix) {
  const candidates = artifacts.filter((item) =>
    new RegExp(`^${prefix}-\\d+(?:-upload-retry-1)?$`).test(item.name),
  );
  candidates.sort((a, b) => {
    const attempt = (item) => Number(item.name.slice(prefix.length + 1).split('-')[0]);
    return (
      attempt(b) - attempt(a) ||
      Number(b.name.endsWith('retry-1')) - Number(a.name.endsWith('retry-1'))
    );
  });
  assert.ok(candidates.length && !candidates[0].expired, `${prefix}: missing/expired artifact`);
  return candidates[0];
}

async function metadata(name) {
  const response = await fetch(`${registry}${encodeURIComponent(name)}`, {
    signal: AbortSignal.timeout(30_000),
    headers: { 'Cache-Control': 'no-cache' },
  });
  if (response.status === 404) return null;
  assert.ok(response.ok, `${name}: registry HTTP ${response.status}`);
  return response.json();
}

async function prepare(output) {
  fs.mkdirSync(output, { recursive: true });
  const repo = process.env.GITHUB_REPOSITORY ?? 'apollocmh/apollo-design-ui';
  const tag =
    process.env.RELEASE_TAG ||
    run('git', ['tag', '--points-at', process.env.RELEASE_SHA ?? 'HEAD'])
      .split('\n')
      .find((name) => /^v\d+\.\d+\.\d+$/.test(name));
  assert.match(tag ?? '', /^v\d+\.\d+\.\d+$/, 'An existing stable version tag is required');
  const sha = run('git', ['rev-parse', `refs/tags/${tag}^{commit}`]);
  if (process.env.RELEASE_SHA) assert.equal(sha, process.env.RELEASE_SHA);
  run('git', ['merge-base', '--is-ancestor', sha, 'origin/master']);
  const checks = api(`repos/${repo}/commits/${sha}/check-runs?per_page=100&filter=all`);
  const check = acceptedCheck(checks.check_runs, sha);
  assert.ok(check, 'The exact tag commit has no successful complete acceptance');
  let runId = process.env.RELEASE_RUN || /\/actions\/runs\/(\d+)/.exec(check.html_url)?.[1];
  const seen = new Set();
  let report;
  let artifacts;
  while (!report) {
    assert.match(String(runId), /^\d+$/);
    assert.ok(!seen.has(String(runId)), 'Cyclic acceptance references');
    seen.add(String(runId));
    const workflow = api(`repos/${repo}/actions/runs/${runId}`);
    assert.equal(workflow.head_sha, sha);
    assert.equal(workflow.path, '.github/workflows/ci.yml');
    assert.equal(workflow.status, 'completed');
    assert.equal(workflow.conclusion, 'success');
    artifacts = JSON.parse(
      run('gh', [
        'api',
        '--paginate',
        '--slurp',
        `repos/${repo}/actions/runs/${runId}/artifacts?per_page=100`,
      ]),
    ).flatMap((page) => page.artifacts);
    const artifact = latestArtifact(artifacts, 'final-acceptance');
    const directory = path.join(output, `acceptance-${runId}`);
    run('gh', [
      'run',
      'download',
      String(runId),
      '--repo',
      repo,
      '--name',
      artifact.name,
      '--dir',
      directory,
    ]);
    if (fs.existsSync(path.join(directory, 'final-acceptance.json'))) {
      report = read(path.join(directory, 'final-acceptance.json'));
    } else {
      const reference = read(path.join(directory, 'acceptance-reference.json'));
      assert.equal(reference.sourceCommit, sha);
      assert.equal(reference.conclusion, 'success');
      const url = new URL(reference.url);
      assert.equal(url.origin, 'https://github.com');
      assert.ok(url.pathname.startsWith(`/${repo}/actions/runs/`));
      runId = /\/actions\/runs\/(\d+)/.exec(url.pathname)?.[1];
    }
  }
  assert.equal(report.passed, true);
  assert.equal(report.sourceCommit, sha);
  const attempt = report.layers.find((layer) => layer.layer === 'build').ciRunAttempt;
  const frozen =
    artifacts.find((item) => item.name === `frozen-${sha}-${attempt}` && !item.expired) ??
    artifacts.find(
      (item) => item.name === `frozen-${sha}-${attempt}-upload-retry-1` && !item.expired,
    );
  assert.ok(frozen, 'Original frozen build expired/missing; do not rebuild for publication');
  const frozenDirectory = path.join(output, 'frozen');
  run('gh', [
    'run',
    'download',
    String(runId),
    '--repo',
    repo,
    '--name',
    frozen.name,
    '--dir',
    frozenDirectory,
  ]);
  const inputs = read(path.join(frozenDirectory, 'frozen-input.json'));
  aggregateAcceptance(report.layers, inputs, sha);
  const archive = fs.readFileSync(path.join(frozenDirectory, 'frozen.tar.gz'));
  assert.equal(
    crypto.createHash('sha256').update(archive).digest('hex'),
    fs.readFileSync(path.join(frozenDirectory, 'frozen.tar.gz.sha256'), 'utf8').split(/\s+/)[0],
  );
  const source = path.join(output, 'source');
  run('git', ['worktree', 'add', '--detach', source, sha]);
  run('tar', ['xzf', path.join(frozenDirectory, 'frozen.tar.gz'), '-C', source]);
  verifyFrozenInputs(source, inputs, sha);
  const packages = fs
    .readdirSync(path.join(source, 'packages'))
    .map((dir) => ({ dir, ...read(path.join(source, 'packages', dir, 'package.json')) }));
  assert.equal(read(path.join(source, 'package.json')).version, tag.slice(1));
  // pack resolves workspace dev dependencies as well; these links only expose manifests.
  for (const pkg of packages) {
    for (const name of Object.keys({
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    })) {
      const target = packages.find((entry) => entry.name === name);
      if (!target) continue;
      const link = path.join(source, 'packages', pkg.dir, 'node_modules', name);
      fs.mkdirSync(path.dirname(link), { recursive: true });
      fs.symlinkSync(path.join(source, 'packages', target.dir), link, 'dir');
    }
  }
  fs.mkdirSync(path.join(output, 'tarballs'));
  fs.mkdirSync(path.join(output, 'logs'));
  const packed = [];
  for (const pkg of releasePackages(packages, tag.slice(1))) {
    assert.ok(
      !['prepack', 'prepare', 'postpack'].some((name) => pkg.scripts?.[name]),
      `${pkg.name}: pack must not rebuild`,
    );
    const stdout = run(
      'pnpm',
      ['--filter', pkg.name, 'pack', '--pack-destination', path.join(output, 'tarballs')],
      source,
    );
    fs.writeFileSync(path.join(output, 'logs', `pack-${pkg.dir}.log`), stdout);
    const tarball = path.join(output, 'tarballs', `apollo-design-${pkg.dir}-${pkg.version}.tgz`);
    const manifest = JSON.parse(run('tar', ['xOf', tarball, 'package/package.json']));
    assert.equal(manifest.name, pkg.name);
    assert.equal(manifest.version, pkg.version);
    for (const section of [
      'dependencies',
      'peerDependencies',
      'devDependencies',
      'optionalDependencies',
    ]) {
      for (const spec of Object.values(manifest[section] ?? {}))
        assert.ok(
          !/^(workspace:|catalog:|file:|link:)/.test(spec),
          `${pkg.name}: unresolved dependency ${spec}`,
        );
    }
    const unpacked = path.join(output, `unpacked-${pkg.dir}`);
    fs.mkdirSync(unpacked);
    run('tar', ['xzf', tarball, '-C', unpacked]);
    const expected = Object.entries(inputs.files).filter(([file]) =>
      file.startsWith(`packages/${pkg.dir}/dist/`),
    );
    assert.ok(expected.length, `${pkg.name}: missing frozen dist`);
    const entries = run('tar', ['tzf', tarball])
      .split('\n')
      .filter((file) => !file.endsWith('/'));
    const expectedDist = expected
      .map(([file]) => `package/${file.slice(`packages/${pkg.dir}/`.length)}`)
      .sort();
    assert.deepEqual(
      entries.filter((file) => file.startsWith('package/dist/')).sort(),
      expectedDist,
      `${pkg.name}: packed dist differs`,
    );
    assert.ok(
      entries.every(
        (file) =>
          file.startsWith('package/dist/') ||
          /^package\/(package\.json|README(?:\.md)?|LICENSE(?:\.md)?|NOTICE(?:\.md)?)$/i.test(file),
      ),
      `${pkg.name}: unexpected packed files`,
    );
    for (const [file, hash] of expected) {
      const bytes = fs.readFileSync(
        path.join(unpacked, 'package', file.slice(`packages/${pkg.dir}/`.length)),
      );
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), hash, file);
    }
    packed.push({
      name: pkg.name,
      version: pkg.version,
      tarball,
      integrity: digest(fs.readFileSync(tarball)),
    });
  }
  verifyFrozenInputs(source, inputs, sha);
  write(path.join(output, 'release.json'), {
    tag,
    sourceCommit: sha,
    acceptanceRun: String(runId),
    inputDigest: inputs.inputDigest,
    packages: packed,
  });
  console.log(`Prepared ${packed.length} packages from ${tag} (${sha}), acceptance ${runId}`);
}

async function publish(output) {
  const release = read(path.join(output, 'release.json'));
  const results = [];
  for (const pkg of release.packages) {
    assert.equal(
      digest(fs.readFileSync(pkg.tarball)),
      pkg.integrity,
      `${pkg.name}: tarball changed`,
    );
    const decision = registryDecision(await metadata(pkg.name), pkg);
    if (decision === 'publish') {
      const log = run('npm', [
        'publish',
        pkg.tarball,
        '--access',
        'public',
        '--tag',
        'latest',
        `--registry=${registry}`,
        '--ignore-scripts',
      ]);
      fs.writeFileSync(path.join(output, 'logs', `publish-${pkg.name.split('/')[1]}.log`), log);
    }
    results.push({ name: pkg.name, version: pkg.version, decision, at: new Date().toISOString() });
    write(path.join(output, 'publication.json'), results);
    console.log(`${pkg.name}@${pkg.version}: ${decision}`);
  }
}

async function verify(output) {
  const release = read(path.join(output, 'release.json'));
  const pending = new Map(release.packages.map((pkg) => [pkg.name, pkg]));
  const results = [];
  // New packages are asynchronously processed by npm after a successful PUT.
  const deadline = Date.now() + 10 * 60_000;
  while (pending.size) {
    for (const [name, pkg] of pending) {
      const found = await metadata(name);
      if (!found?.versions?.[pkg.version]) continue;
      registryDecision(found, pkg);
      const response = await fetch(found.versions[pkg.version].dist.tarball, {
        signal: AbortSignal.timeout(30_000),
      });
      assert.ok(response.ok, `${name}: tarball HTTP ${response.status}`);
      assert.equal(
        digest(Buffer.from(await response.arrayBuffer())),
        pkg.integrity,
        `${name}: downloaded tarball differs`,
      );
      results.push({
        name,
        version: pkg.version,
        integrity: pkg.integrity,
        latest: found['dist-tags'].latest,
      });
      pending.delete(name);
      write(path.join(output, 'registry.json'), {
        verified: results,
        pending: [...pending.keys()],
      });
    }
    write(path.join(output, 'registry.json'), { verified: results, pending: [...pending.keys()] });
    if (pending.size) {
      assert.ok(
        Date.now() < deadline,
        `npm processing did not finish: ${[...pending.keys()].join(', ')}`,
      );
      console.log(`Waiting for npm processing: ${[...pending.keys()].join(', ')}`);
      await delay(15_000);
    }
  }
  const consumer = path.join(output, 'consumer');
  fs.mkdirSync(consumer, { recursive: true });
  write(path.join(consumer, 'package.json'), {
    name: 'apollo-release-consumer',
    private: true,
    type: 'module',
    dependencies: {
      '@apollo-design/ui': release.tag.slice(1),
      '@apollo-design/theme': release.tag.slice(1),
      '@apollo-design/icons': release.tag.slice(1),
      '@apollo-design/ui-resolver': release.tag.slice(1),
      vue: '^3.5.42',
      'unplugin-vue-components': '^32.1.0',
    },
  });
  fs.writeFileSync(
    path.join(output, 'logs', 'install.log'),
    run(
      'npm',
      ['install', `--registry=${registry}`, '--ignore-scripts', '--no-audit', '--no-fund'],
      consumer,
    ),
  );
  fs.copyFileSync(
    path.join(root, 'scripts/npm-release-consumer.mjs'),
    path.join(consumer, 'verify.mjs'),
  );
  console.log(run(process.execPath, ['verify.mjs', release.tag.slice(1)], consumer));
  write(path.join(output, 'verification.json'), {
    passed: true,
    sourceCommit: release.sourceCommit,
    tag: release.tag,
    packages: results,
    checkedAt: new Date().toISOString(),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, directory] = process.argv.slice(2);
  assert.ok(directory, 'Usage: npm-release.mjs prepare|publish|verify OUTPUT_DIRECTORY');
  const commands = { prepare, publish, verify };
  assert.ok(Object.hasOwn(commands, command), 'Unknown release command');
  await commands[command](path.resolve(directory));
}
