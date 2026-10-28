/** Root/subpath declarations and all eleven real Layout demos; never builds packages. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
  source = process.env.LAYOUT_SOURCE === '1';
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-layout-types-'));
try {
  if (!source)
    assert.ok(
      existsSync(path.join(repo, 'packages/ui/dist/layout/index.d.ts')),
      'Wait for integrated dist-ready',
    );
  mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  symlinkSync(path.join(repo, 'node_modules/vue'), path.join(temp, 'node_modules/vue'), 'dir');
  if (source) {
    symlinkSync(
      path.join(repo, 'node_modules/@types'),
      path.join(temp, 'node_modules/@types'),
      'dir',
    );
    symlinkSync(path.join(repo, 'node_modules/vite'), path.join(temp, 'node_modules/vite'), 'dir');
  }
  for (const name of ['ui', 'theme', 'icons'])
    symlinkSync(
      path.join(repo, 'packages/' + name),
      path.join(temp, 'node_modules/@apollo-design/' + name),
      'dir',
    );
  copyFileSync(
    path.join(repo, 'tests/browser/fixtures/LayoutPublicContracts.vue'),
    path.join(temp, 'LayoutPublicContracts.vue'),
  );
  const demos = readdirSync(path.join(repo, 'packages/ui/src/layout/demo'))
    .filter((file) => file.endsWith('.vue'))
    .sort();
  assert.equal(demos.length, 11);
  for (const file of demos)
    copyFileSync(
      path.join(repo, 'packages/ui/src/layout/demo', file),
      path.join(temp, 'Demo-' + file),
    );
  const paths = source
    ? Object.fromEntries(
        [
          'ui',
          'theme',
          'utils',
          'icons',
          'motion',
          'portal',
          'position',
          'overlay',
          'a11y',
          'virtual-list',
          'form-core',
          'picker',
          'locale',
        ].map((name) => [
          '@apollo-design/' + name,
          [path.join(repo, 'packages/' + name + '/src/index.ts')],
        ]),
      )
    : {};
  if (source)
    paths['@apollo-design/ui/layout'] = [path.join(repo, 'packages/ui/src/layout/index.ts')];
  writeFileSync(
    path.join(temp, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ESNext',
          moduleResolution: 'Bundler',
          lib: ['ES2023', 'DOM', 'DOM.Iterable'],
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: source ? ['node', 'vite/client'] : [],
          paths,
        },
        include: ['*.vue', '*.ts'],
      },
      null,
      2,
    ),
  );
  execFileSync(
    process.execPath,
    [
      path.join(repo, 'node_modules/vue-tsc/bin/vue-tsc.js'),
      '-p',
      path.join(temp, 'tsconfig.json'),
    ],
    { stdio: 'inherit' },
  );
  const evidence = process.env.LAYOUT_TYPES_EVIDENCE ?? '/tmp/apollo-layout-types.json';
  writeFileSync(
    evidence,
    JSON.stringify(
      {
        passed: true,
        source,
        demos,
        rootAndSubpath: true,
        positive: [
          'v-model:collapsed',
          'typed emits',
          'new root/subpath slot and emit type exports',
          'complete slots',
          'refs',
          'native style array/string',
        ],
        negative: [
          'unknown breakpoint',
          'wrong update payload',
          'invalid content',
          'unknown semantic region',
        ],
      },
      null,
      2,
    ) + '\n',
  );
  console.log('PASS Layout root/subpath public types and all 11 demos');
} finally {
  rmSync(temp, { recursive: true, force: true });
}
