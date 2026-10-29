/** Actual Node SSR of the real Divider source or frozen published exports. No package builds. */
import assert from 'node:assert/strict';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';

const here = path.dirname(fileURLToPath(import.meta.url)),
  repo = process.env.DIVIDER_REPO ?? path.resolve(here, '../../../../..'),
  published = process.env.DIVIDER_MODE === 'published',
  temp = realpathSync(mkdtempSync(path.join(tmpdir(), 'apollo-divider-ssr-')));
const evidence = process.env.DIVIDER_SSR_EVIDENCE ?? '/tmp/apollo-divider-ssr.json';
assert.equal(typeof window, 'undefined');
assert.equal(typeof document, 'undefined');
let server;
try {
  mkdirSync(path.join(temp, 'node_modules/@apollo-design'), { recursive: true });
  const packages = [
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
  ];
  for (const name of packages)
    symlinkSync(
      path.join(repo, 'packages', name),
      path.join(temp, 'node_modules/@apollo-design', name),
      'dir',
    );
  symlinkSync(path.join(repo, 'node_modules/vue'), path.join(temp, 'node_modules/vue'), 'dir');
  copyFileSync(path.join(here, 'ssr-fixture.mjs'), path.join(temp, 'entry.mjs'));
  writeFileSync(
    path.join(temp, 'source-entry.mjs'),
    `export {ConfigProvider} from '${path.join(repo, 'packages/ui/src/config-provider/index.ts')}';`,
  );
  const alias = [
    {
      find: /^@apollo-design\/ui\/divider$/,
      replacement: path.join(
        repo,
        `packages/ui/${published ? 'dist' : 'src'}/divider/index.${published ? 'mjs' : 'ts'}`,
      ),
    },
    ...packages.map((name) => ({
      find: new RegExp(`^@apollo-design/${name}$`),
      replacement:
        !published && name === 'ui'
          ? path.join(temp, 'source-entry.mjs')
          : path.join(repo, `packages/${name}/${published ? 'dist/index.mjs' : 'src/index.ts'}`),
    })),
  ];
  server = await createServer({
    root: temp,
    configFile: false,
    cacheDir: path.join(temp, 'cache'),
    logLevel: 'warn',
    plugins: [vue()],
    resolve: { alias },
    ssr: { external: ['vue', 'vue/server-renderer'] },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  const module = await server.ssrLoadModule(path.join(temp, 'entry.mjs')),
    report = await module.verify();
  writeFileSync(
    evidence,
    `${JSON.stringify(
      {
        ...report,
        mode: published ? 'published' : 'source',
        sourceUiBridge: !published,
        packageBuilds: false,
        distRead: published,
        distWritten: false,
        readersExited: false,
      },
      null,
      2,
    )}\n`,
  );
  assert.equal(report.results.length, 22);
  assert.deepEqual(report.warnings, []);
  assert.ok(report.results.every((r) => r.passed));
  console.log('PASS actual Node Divider SSR 22/22, zero browser globals and warnings');
} finally {
  await server?.close();
  try {
    const report = JSON.parse(readFileSync(evidence));
    report.readersExited = true;
    writeFileSync(evidence, `${JSON.stringify(report, null, 2)}\n`);
  } catch {}
  rmSync(temp, { recursive: true, force: true });
  console.log('All Divider Node SSR readers exited');
}
