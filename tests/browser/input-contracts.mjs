/** Complete Input source contracts. Immutable source copy, Vite dev server, no build or dist reads. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from '../visual/stabilize.mjs';

const toolsRepo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const repo = fs.realpathSync(process.env.INPUT_CONTRACT_REPO ?? toolsRepo);
const published = process.env.INPUT_CONTRACT_MODE === 'published';
const evidenceRoot =
  process.env.INPUT_CONTRACT_EVIDENCE_DIR ??
  fs.mkdtempSync(path.join(tmpdir(), 'apollo-input-contracts-'));
fs.mkdirSync(evidenceRoot, { recursive: true });
const root = fs.realpathSync(evidenceRoot),
  source = path.join(root, 'source'),
  fixture = path.join(root, 'fixture');
assert.ok(!fs.existsSync(source), 'Use a fresh evidence directory for an immutable source freeze');
const require = createRequire(path.join(toolsRepo, 'package.json'));
const { createServer } = await import(pathToFileURL(require.resolve('vite')));
const { default: vue } = await import(pathToFileURL(require.resolve('@vitejs/plugin-vue')));
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const packageNames = fs
  .readdirSync(path.join(repo, 'packages'))
  .filter((name) => fs.existsSync(path.join(repo, 'packages', name, 'src/index.ts')));
const before = {},
  frozen = {},
  loaded = new Map(),
  forbidden = [],
  checks = [],
  pageErrors = [],
  warnings = [],
  expectedDeprecations = [],
  vueModules = new Set();
function copy(file) {
  const relative = path.relative(repo, file),
    target = path.join(source, relative);
  before[relative] = hash(file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
  frozen[relative] = hash(target);
  assert.equal(frozen[relative], before[relative], `Source changed while copying ${relative}`);
}
function walk(folder) {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.vite', 'coverage'].includes(entry.name)) continue;
    const file = path.join(folder, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile()) copy(file);
  }
}
for (const name of packageNames) {
  walk(path.join(repo, 'packages', name, published ? 'dist' : 'src'));
  copy(path.join(repo, 'packages', name, 'package.json'));
  const dependencyDirectory = path.join(repo, 'packages', name, 'node_modules');
  if (fs.existsSync(dependencyDirectory))
    fs.symlinkSync(dependencyDirectory, path.join(source, 'packages', name, 'node_modules'), 'dir');
}
copy(path.join(repo, 'package.json'));
copy(path.join(repo, 'tsconfig.json'));
assert.deepEqual(
  Object.entries(before).filter(([relative, value]) => hash(path.join(repo, relative)) !== value),
  [],
  'Source changed during the freeze',
);
fs.symlinkSync(path.join(repo, 'node_modules'), path.join(source, 'node_modules'), 'dir');
fs.cpSync(path.join(toolsRepo, 'tests/browser/input-contracts/fixture'), fixture, {
  recursive: true,
});
if (published) {
  const entry = path.join(fixture, 'entry.mjs');
  const css =
    fs.readFileSync(path.join(source, 'packages/theme/dist/tokens.css'), 'utf8') +
    fs.readFileSync(path.join(source, 'packages/ui/dist/index.css'), 'utf8');
  const original = fs.readFileSync(entry, 'utf8');
  const cssFactory = 'getCSSVarDeclarations(getDesignToken()) +\n  genAllStyles()';
  assert.ok(original.includes(cssFactory), 'The fixture stylesheet location must remain explicit');
  fs.writeFileSync(
    entry,
    `const publishedCss = ${JSON.stringify(css)};\n` +
      original
        .replace(cssFactory, 'publishedCss')
        .replace("import { genAllStyles } from '@input-source/style/index.ts';", ''),
  );
}
const dependencies = [
  'vue',
  'axe-core',
  'dayjs',
  'dayjs/plugin/advancedFormat.js',
  'dayjs/plugin/customParseFormat.js',
  'dayjs/plugin/localeData.js',
  'dayjs/plugin/weekOfYear.js',
  'dayjs/plugin/weekYear.js',
  'dayjs/plugin/weekday.js',
  'scroll-into-view-if-needed',
];
fs.mkdirSync(path.join(fixture, 'node_modules'));
const uiRequire = createRequire(path.join(source, 'packages/ui/package.json'));
for (const name of ['vue', 'axe-core', 'dayjs', 'scroll-into-view-if-needed']) {
  let folder = path.dirname(uiRequire.resolve(name));
  while (
    !fs.existsSync(path.join(folder, 'package.json')) ||
    JSON.parse(fs.readFileSync(path.join(folder, 'package.json'), 'utf8')).name !== name
  ) {
    const parent = path.dirname(folder);
    assert.notEqual(parent, folder, `Cannot resolve ${name}`);
    folder = parent;
  }
  fs.symlinkSync(folder, path.join(fixture, 'node_modules', name), 'dir');
}
fs.writeFileSync(
  path.join(root, 'source-freeze.json'),
  JSON.stringify(
    { repo, source, packageBuildRun: false, viteBuildRun: false, sourceHashes: frozen },
    null,
    2,
  ),
);
let server,
  browser,
  page,
  active = 'bootstrap',
  activePhase,
  harnessError,
  appErrors = [];
const phases = (
  process.env.INPUT_CONTRACT_PHASES ?? 'critical,surface,events,gaps,providers,resize,associated'
).split(',');
try {
  server = await createServer({
    root: fixture,
    configFile: false,
    envFile: false,
    cacheDir: path.join(root, 'vite-cache'),
    logLevel: 'error',
    plugins: [
      ...(published
        ? [
            {
              name: 'input-published-entry',
              enforce: 'pre',
              resolveId(id) {
                if (!id.startsWith('@input-source/')) return;
                const relative = id.slice('@input-source/'.length).replace(/\.ts$/, '.mjs');
                return path.join(source, 'packages/ui/dist', relative);
              },
            },
          ]
        : []),
      {
        name: 'input-source-freeze-guard',
        enforce: 'pre',
        load(id) {
          const file = id.split('?')[0];
          if (
            new RegExp('/packages/[^/]+/' + (published ? 'src' : 'dist') + '/').test(file) ||
            file.startsWith(path.join(repo, 'packages') + path.sep)
          ) {
            forbidden.push(file);
            throw new Error(`Source snapshot escape ${file}`);
          }
          if (
            file.startsWith(path.join(source, 'packages') + path.sep) &&
            fs.existsSync(file) &&
            fs.statSync(file).isFile() &&
            !loaded.has(file)
          )
            loaded.set(file, hash(file));
          return null;
        },
      },
      vue(),
    ],
    resolve: {
      alias: [
        ...(!published
          ? [{ find: /^@input-source\//, replacement: path.join(source, 'packages/ui/src/') }]
          : []),
        ...packageNames.map((name) => ({
          find: new RegExp('^@apollo-design/' + name + '$'),
          replacement: path.join(
            source,
            'packages',
            name,
            published ? 'dist/index.mjs' : 'src/index.ts',
          ),
        })),
      ],
      dedupe: ['vue'],
    },
    optimizeDeps: { noDiscovery: true, include: dependencies },
    server: { host: '127.0.0.1', port: 0, hmr: false, fs: { allow: [toolsRepo, source, root] } },
  });
  await server.listen();
  ({ browser } = await launchBrowser());
  page = await browser.newPage({ viewport: { width: 1000, height: 1000 } });
  page.setDefaultTimeout(12000);
  page.on('request', (request) => {
    if (/\/deps\/vue\.js(?:\?|$)/.test(request.url())) vueModules.add(request.url());
  });
  page.on('pageerror', (error) => pageErrors.push({ case: active, error: error.message }));
  page.on('console', (message) => {
    const value = message.text();
    if (
      /^Warning: \[apollo: (?:Input|TextArea|Input.Group)\] `(?:bordered|addonBefore|addonAfter|clearIcon|Input.Group)` is deprecated\. Please use .+ instead\.$/.test(
        value,
      )
    )
      expectedDeprecations.push({ case: active, message: value });
    else if (message.type() === 'error') pageErrors.push({ case: active, error: value });
    else if (['warn', 'warning'].includes(message.type()))
      warnings.push({ case: active, message: value });
  });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.auditReady);
  const check = async (id, contract, covered, run) => {
    active = id;
    await page.evaluate((id) => window.audit.tag(id), id);
    try {
      checks.push({ id, phase: activePhase, contract, covered, passed: true, actual: await run() });
    } catch (error) {
      checks.push({
        id,
        phase: activePhase,
        contract,
        covered,
        passed: false,
        error: error.message,
        actual: await page.evaluate(() => window.audit.snapshot()).catch(() => null),
      });
    }
  };
  const mount = (family, options) =>
    page.evaluate(([family, options]) => window.audit.mount(family, options), [family, options]);
  const patch = (patch) => page.evaluate((patch) => window.audit.patch(patch), patch);
  const snapshot = () => page.evaluate(() => window.audit.snapshot());
  const first = () => page.locator('#app input,#app textarea').first();
  const settle = () => page.evaluate(() => window.audit.settle());
  const ssr = async (family, props) =>
    (await server.ssrLoadModule(path.join(fixture, 'ssr.mjs'))).render(family, props);
  const ssrAssociated = async (kind, props) =>
    (await server.ssrLoadModule(path.join(fixture, 'ssr.mjs'))).renderAssociated(kind, props);
  for (const phase of phases) {
    activePhase = phase;
    const suite = await import(
      pathToFileURL(path.join(toolsRepo, 'tests/browser/input-contracts/suites', phase + '.mjs'))
    );
    await suite.run({
      assert,
      page,
      check,
      mount,
      patch,
      snapshot,
      first,
      settle,
      ssr,
      ssrAssociated,
      axePath: require.resolve('axe-core/axe.min.js'),
    });
    console.log(
      JSON.stringify({
        phase,
        total: checks.length,
        failed: checks.filter((item) => !item.passed).length,
      }),
    );
  }
  appErrors = await page.evaluate(() => window.audit.recordSnapshot().errors);
  await page.evaluate(async () => {
    await window.audit.unmount();
    await window.inputAssociated?.unmount();
  });
} catch (error) {
  harnessError = { message: error.message, stack: error.stack };
  throw error;
} finally {
  await browser?.close();
  await server?.close();
  const changed = Object.entries(frozen)
    .filter(([relative, value]) => hash(path.join(source, relative)) !== value)
    .map(([file]) => file);
  const changedReads = [...loaded]
    .filter(([file, value]) => hash(file) !== value)
    .map(([file]) => file);
  const report = {
    mode: published ? 'published' : 'source',
    repo,
    source,
    phases,
    packageBuildRun: false,
    viteBuildRun: false,
    distWritten: false,
    readersExited: true,
    sourceAndReadsUnchanged: !changed.length && !changedReads.length,
    changed,
    changedReads,
    forbidden,
    loadedLibraryFiles: loaded.size,
    loadedLibraryHashes: Object.fromEntries(loaded),
    vueModules: [...vueModules],
    total: checks.length,
    passed: checks.filter((item) => item.passed).length,
    failed: checks.filter((item) => !item.passed).length,
    pageErrors,
    warnings,
    appErrors,
    expectedDeprecations,
    checks,
    harnessError,
  };
  fs.writeFileSync(path.join(root, 'evidence.json'), JSON.stringify(report, null, 2));
  console.log(
    JSON.stringify(
      {
        ...report,
        loadedLibraryHashes: undefined,
        checks: checks.filter((item) => !item.passed).map(({ id, error }) => ({ id, error })),
      },
      null,
      2,
    ),
  );
  assert.deepEqual(changed, []);
  assert.deepEqual(changedReads, []);
  assert.deepEqual(forbidden, []);
  assert.ok(loaded.size > 0);
  assert.equal(vueModules.size, 1);
  assert.deepEqual(pageErrors, []);
  assert.deepEqual(warnings, []);
  assert.deepEqual(appErrors, []);
  if (!harnessError) assert.ok(checks.length > 0);
  if (checks.some((item) => !item.passed)) process.exitCode = 1;
}
