import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('tarball consumer uses every package version for files and overrides while retaining both bundlers', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-consumer-version-'));
  const log = path.join(root, 'commands.json');
  t.after(() => {
    if (fs.existsSync(log)) {
      const { packedDirectory } = JSON.parse(fs.readFileSync(log, 'utf8'));
      if (packedDirectory)
        fs.rmSync(path.dirname(packedDirectory), { recursive: true, force: true });
    }
    fs.rmSync(root, { recursive: true, force: true });
  });
  const names = [
    'utils',
    'theme',
    'icons',
    'motion',
    'portal',
    'position',
    'a11y',
    'virtual-list',
    'overlay',
    'form-core',
    'picker',
    'locale',
    'ui',
  ];
  const expected = {};
  for (const [index, name] of names.entries()) {
    const version = `1.2.${index}${name === 'ui' ? '-rc.1' : ''}`;
    const directory = path.join(root, 'packages', name);
    fs.mkdirSync(directory, { recursive: true });
    fs.writeFileSync(
      path.join(directory, 'package.json'),
      JSON.stringify({ name: `@apollo-design/${name}`, version }),
    );
    expected[`@apollo-design/${name}`] = `file:../tarballs/apollo-design-${name}-${version}.tgz`;
  }
  const runner = path.join(root, 'tests/consumer/run.mjs');
  fs.mkdirSync(path.dirname(runner), { recursive: true });
  fs.copyFileSync(new URL('../consumer/run.mjs', import.meta.url), runner);
  const mock = path.join(root, 'mock-commands.mjs');
  // Only exercise package/file wiring here. The release gate runs the same
  // unmodified runner against actual pnpm pack, install, Vite and Webpack.
  fs.writeFileSync(
    mock,
    `import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import path from 'node:path';
const log = process.env.APOLLO_CONSUMER_COMMAND_LOG;
const record = { calls: [] };
const save = () => fs.writeFileSync(log, JSON.stringify(record));
childProcess.execFileSync = (command, args, { cwd }) => {
  record.calls.push({ command, args });
  save();
  if (args[0] === '--filter' && args[2] === 'pack') {
    const manifest = JSON.parse(fs.readFileSync(path.join(cwd, 'packages', args[1].split('/')[1], 'package.json'), 'utf8'));
    const destination = args[args.indexOf('--pack-destination') + 1];
    record.packedDirectory = destination;
    save();
    fs.writeFileSync(path.join(destination, manifest.name.slice(1).replace('/', '-') + '-' + manifest.version + '.tgz'), 'tooling fixture');
  } else if (args[0] === 'install') {
    record.dependencies = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf8')).dependencies;
    record.workspace = fs.readFileSync(path.join(cwd, 'pnpm-workspace.yaml'), 'utf8');
    save();
    for (const [name, spec] of Object.entries(record.dependencies)) {
      if (!name.startsWith('@apollo-design/')) continue;
      assert.ok(spec.startsWith('file:'));
      fs.accessSync(path.resolve(cwd, spec.slice(5)));
    }
  } else if (args.join(' ') === 'exec vite build') {
    fs.mkdirSync(path.join(cwd, 'dist/assets'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'dist/index.html'), 'fixture');
    fs.writeFileSync(path.join(cwd, 'dist/assets/index.css'), '.apollo-btn{}.apollo-input-search{}.apollo-otp{}');
    fs.writeFileSync(path.join(cwd, 'dist/assets/index.js'), 'export {};');
  } else if (args.join(' ') === 'exec webpack --config webpack.config.mjs') {
    fs.mkdirSync(path.join(cwd, 'dist-webpack'), { recursive: true });
    fs.writeFileSync(path.join(cwd, 'dist-webpack/main.js'), '.apollo-btn .apollo-input-search .apollo-otp');
  } else {
    throw new Error('Unexpected consumer command: ' + command + ' ' + args.join(' '));
  }
  return Buffer.alloc(0);
};
syncBuiltinESMExports();
`,
  );
  const result = spawnSync(process.execPath, ['--import', mock, runner], {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, APOLLO_CONSUMER_COMMAND_LOG: log },
  });
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
  assert.equal(result.signal, null);
  const record = JSON.parse(fs.readFileSync(log, 'utf8'));
  assert.deepEqual(record.dependencies, { ...expected, vue: '^3.5.42' });
  const overrides = Object.fromEntries(
    [...record.workspace.matchAll(/^ {2}'([^']+)': '([^']+)'$/gm)].map((match) => [
      match[1],
      match[2],
    ]),
  );
  assert.deepEqual(overrides, expected);
  assert.deepEqual(
    record.calls.filter(({ args }) => args[2] === 'pack').map(({ args }) => args[1]),
    names.map((name) => `@apollo-design/${name}`),
  );
  assert.deepEqual(
    record.calls.filter(({ args }) => args[0] === 'exec').map(({ args }) => args),
    [
      ['exec', 'vite', 'build'],
      ['exec', 'webpack', '--config', 'webpack.config.mjs'],
    ],
  );
});
