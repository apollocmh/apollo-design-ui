/** Built environment flags and warning behavior through the published utils entrypoint. */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const directory = mkdtempSync(path.join(root, 'packages/ui/.treeshake-probe-environment-'));
try {
  const entry = path.join(directory, 'entry.mjs');
  writeFileSync(
    entry,
    `import { isDev, isProd, isTest, warning } from '@apollo-design/utils';
const messages = [];
const previous = console.error;
try {
  console.error = (...args) => messages.push(args.join(' '));
  warning(false, 'built-environment-marker');
} finally { console.error = previous; }
export default { isDev, isProd, isTest, messages };
`,
  );
  const cases = [
    { name: 'production', development: false },
    {
      name: 'development',
      development: true,
      signals: { DEV: 'true', PROD: 'false', MODE: JSON.stringify('development') },
    },
    {
      name: 'prod-fallback',
      development: false,
      signals: { DEV: 'undefined', PROD: 'true', MODE: JSON.stringify('development') },
    },
    {
      name: 'mode-fallback',
      development: false,
      signals: { DEV: 'undefined', PROD: 'undefined', MODE: JSON.stringify('production') },
    },
  ];
  for (const { name, development, signals } of cases) {
    const result = await build({
      configFile: false,
      logLevel: 'silent',
      define: signals
        ? Object.fromEntries(
            Object.entries(signals).map(([key, value]) => [`import.meta.env.${key}`, value]),
          )
        : undefined,
      build: {
        write: false,
        minify: 'esbuild',
        rollupOptions: {
          input: entry,
          external: ['vue'],
          preserveEntrySignatures: 'strict',
          output: { format: 'es' },
        },
      },
    });
    const output = (Array.isArray(result) ? result[0] : result).output;
    const chunk = output.find((item) => item.type === 'chunk' && item.isEntry);
    assert.ok(chunk, 'the consumer must produce a real entry chunk');
    const file = path.join(directory, `${name}.mjs`);
    writeFileSync(file, chunk.code);
    const state = (await import(pathToFileURL(file).href)).default;
    assert.equal(state.isDev, development, `${name}: built DEV follows the actual bundler signal`);
    assert.equal(state.isProd, !development);
    assert.equal(state.isTest, false);
    assert.deepEqual(
      state.messages,
      development ? ['Warning: built-environment-marker'] : [],
      'production is silent while development retains warnings',
    );
  }
  const published = pathToFileURL(path.join(root, 'packages/utils/dist/index.mjs')).href;
  for (const environment of ['production', 'development', 'test']) {
    const result = JSON.parse(
      execFileSync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `import { isDev, isProd, isTest } from ${JSON.stringify(published)};
console.log(JSON.stringify({ isDev, isProd, isTest }));`,
        ],
        { encoding: 'utf8', env: { ...process.env, NODE_ENV: environment, VITEST: '' } },
      ),
    );
    assert.deepEqual(result, {
      isDev: environment !== 'production',
      isProd: environment === 'production',
      isTest: environment === 'test',
    });
  }
  console.log(
    'PASS published utils: Vite DEV/PROD/MODE, native warnings and three Node environments',
  );
} finally {
  rmSync(directory, { recursive: true, force: true });
}
