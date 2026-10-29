/** Theme source/published SSR, hydration, focus and DOM ownership regression. No package build. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const repo = realpathSync(
  process.env.THEME_FOUNDATION_REPO ??
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'),
);
const published = process.env.THEME_FOUNDATION_MODE === 'published';
const output = process.env.THEME_FOUNDATION_EVIDENCE ?? '/tmp/apollo-theme-foundation-browser.json';
const temp = realpathSync(mkdtempSync(path.join(tmpdir(), 'apollo-theme-foundation-')));
const fixture = path.join(repo, 'tests/browser/fixtures/ThemeFoundation.mjs');
const alias = ['theme', 'utils'].map((name) => ({
  find: new RegExp(`^@apollo-design/${name}$`),
  replacement: path.join(repo, `packages/${name}/${published ? 'dist/index.mjs' : 'src/index.ts'}`),
}));
const loaded = new Map(),
  results = [],
  errors = [];
let server, ssrServer, browser;
let failure;
const digest = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
const guard = () => ({
  name: 'theme-foundation-origin-guard',
  enforce: 'pre',
  load(id) {
    const file = id.split('?')[0];
    const match = file.match(/\/packages\/([^/]+)\/(src|dist)\//);
    if (match && existsSync(file)) {
      assert.equal(match[2], published ? 'dist' : 'src', `Unexpected module origin ${file}`);
      const real = realpathSync(file);
      assert.ok(real.startsWith(`${repo}/packages/`));
      const current = digest(real);
      assert.ok(
        !loaded.has(real) || loaded.get(real) === current,
        `Source changed while loading ${real}`,
      );
      loaded.set(real, current);
    }
    return null;
  },
});
async function check(name, run) {
  try {
    await run();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({ name, passed: false, error: String(error) });
  }
}
try {
  symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
  ssrServer = await createServer({
    root: temp,
    configFile: false,
    cacheDir: path.join(temp, 'ssr-cache'),
    logLevel: 'warn',
    plugins: [guard()],
    resolve: { alias },
    ssr: { external: ['vue', 'vue/server-renderer'] },
    server: { middlewareMode: true, fs: { allow: [repo, temp] } },
    appType: 'custom',
  });
  const ssrEntry = path.join(temp, 'ssr.mjs');
  writeFileSync(
    ssrEntry,
    `import {renderToString} from 'vue/server-renderer';import {createThemeFoundationFixture} from ${JSON.stringify(fixture)};export async function render(){const fixture=createThemeFoundationFixture();return{html:await renderToString(fixture.app),stats:fixture.stats,domGlobals:typeof document!=='undefined'||typeof window!=='undefined'};}`,
  );
  const ssr = await (await ssrServer.ssrLoadModule(ssrEntry)).render();
  await check('Node SSR with injection has no DOM globals or mounted side effects', () => {
    assert.equal(ssr.domGlobals, false);
    assert.deepEqual(ssr.stats, { setups: 1, mounts: 0, unmounts: 0 });
    assert.ok(ssr.html.includes('14|#0055aa'));
  });
  writeFileSync(
    path.join(temp, 'index.html'),
    `<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"></head><body><div id="target-a" style="--first-color-primary:#663399!important;--first-font-size:11px"><div id="target-b"><div id="app">${ssr.html}</div></div></div><script type="module">import {createThemeFoundationFixture} from ${JSON.stringify(fixture)};const fixture=createThemeFoundationFixture({first:document.getElementById('target-a'),second:document.getElementById('target-b')});fixture.app.mount('#app');window.themeFoundation=fixture;</script></body></html>`,
  );
  server = await createServer({
    root: temp,
    configFile: false,
    cacheDir: path.join(temp, 'client-cache'),
    logLevel: 'warn',
    plugins: [guard()],
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    resolve: {
      alias: [
        ...alias,
        {
          find: /^vue$/,
          replacement: createRequire(import.meta.url).resolve(
            'vue/dist/vue.runtime.esm-bundler.js',
          ),
        },
      ],
      dedupe: ['vue'],
    },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [repo, temp] } },
  });
  await server.listen();
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1100, height: 700 } });
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'warning' || message.type() === 'error') errors.push(message.text());
  });
  await page.goto(`http://127.0.0.1:${address.port}/`);
  await page.waitForFunction(() => window.themeFoundation?.stats.mounts === 1);
  const input = await page.locator('#draft').elementHandle();
  assert.ok(input);
  await page.locator('#draft').fill('local browser draft');
  await input.evaluate((node) => {
    node.focus();
    node.setSelectionRange(2, 7);
  });
  const set = (patch) => page.evaluate((patch) => window.themeFoundation.set(patch), patch);
  const value = (id, name) =>
    page.evaluate(({ id, name }) => document.getElementById(id).style.getPropertyValue(name), {
      id,
      name,
    });
  async function stable() {
    assert.deepEqual(await page.evaluate(() => window.themeFoundation.stats), {
      setups: 1,
      mounts: 1,
      unmounts: 0,
    });
    assert.equal(
      await input.evaluate(
        (node) =>
          node === document.getElementById('draft') &&
          node === document.activeElement &&
          node.value === 'local browser draft' &&
          node.selectionStart === 2 &&
          node.selectionEnd === 7,
      ),
      true,
    );
  }
  await check(
    'hydration applies the current scoped variables and actual computed styles',
    async () => {
      assert.equal(await value('target-a', '--first-color-primary'), '#0055aa');
      assert.deepEqual(
        await page.locator('#theme-observer').evaluate((node) => ({
          color: getComputedStyle(node).color,
          font: getComputedStyle(node).fontSize,
        })),
        { color: 'rgb(0, 85, 170)', font: '14px' },
      );
      await stable();
    },
  );
  await check(
    'disable restores original inline value and priority while preserving focus',
    async () => {
      await set({ enabled: false });
      assert.equal(await value('target-a', '--first-color-primary'), '#663399');
      assert.equal(
        await page.evaluate(() =>
          document.getElementById('target-a').style.getPropertyPriority('--first-color-primary'),
        ),
        'important',
      );
      await stable();
    },
  );
  await check('reactivation and target replacement release only the previous target', async () => {
    await set({ enabled: true });
    await set({ target: 'second' });
    assert.equal(await value('target-a', '--first-color-primary'), '#663399');
    assert.equal(await value('target-b', '--first-color-primary'), '#0055aa');
    await stable();
  });
  await check(
    'nullable native target restores the root scope and retains the business instance',
    async () => {
      const original = await page.evaluate(() => ({
        value: document.documentElement.style.getPropertyValue('--first-color-primary'),
        priority: document.documentElement.style.getPropertyPriority('--first-color-primary'),
      }));
      await set({ target: null });
      assert.equal(
        await page.evaluate(() =>
          document.documentElement.style.getPropertyValue('--first-color-primary'),
        ),
        '#0055aa',
      );
      assert.equal(await value('target-b', '--first-color-primary'), '');
      await stable();
      await set({ target: 'second' });
      assert.equal(await value('target-b', '--first-color-primary'), '#0055aa');
      assert.deepEqual(
        await page.evaluate(() => ({
          value: document.documentElement.style.getPropertyValue('--first-color-primary'),
          priority: document.documentElement.style.getPropertyPriority('--first-color-primary'),
        })),
        original,
      );
      await stable();
    },
  );
  await check(
    'native SVG target receives actual painted variables and releases them on replacement',
    async () => {
      await page.evaluate(async () => {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'native-svg';
        const group = document.createElementNS(svg.namespaceURI, 'g');
        group.id = 'svg-target';
        const rect = document.createElementNS(svg.namespaceURI, 'rect');
        rect.id = 'svg-paint';
        rect.setAttribute('width', '1');
        rect.setAttribute('height', '1');
        rect.setAttribute('fill', 'var(--first-color-primary)');
        group.append(rect);
        svg.append(group);
        document.body.append(svg);
        await window.themeFoundation.setTargetElement(group);
      });
      assert.equal(await value('svg-target', '--first-color-primary'), '#0055aa');
      assert.equal(
        await page.locator('#svg-paint').evaluate((node) => getComputedStyle(node).fill),
        'rgb(0, 85, 170)',
      );
      assert.equal(await value('target-b', '--first-color-primary'), '');
      await stable();
      await set({ target: 'second' });
      assert.equal(await value('svg-target', '--first-color-primary'), '');
      assert.equal(await value('target-b', '--first-color-primary'), '#0055aa');
      await page.locator('#native-svg').evaluate((node) => node.remove());
      await stable();
    },
  );
  await check(
    'context deep writes update CSS and computed typography without mutating props',
    async () => {
      await page.evaluate(() => window.themeFoundation.writeConfig({ fontSize: 20 }));
      assert.equal(await value('target-b', '--first-font-size'), '20px');
      assert.equal(
        await page.locator('#theme-observer').evaluate((node) => getComputedStyle(node).fontSize),
        '20px',
      );
      assert.equal(await page.evaluate(() => window.themeFoundation.currentPropFont()), 14);
      await stable();
    },
  );
  await check(
    'effective config prefix changes remove old variables without child remounts',
    async () => {
      await page.evaluate(() => window.themeFoundation.writeConfig({ prefix: 'second' }));
      assert.equal(await value('target-b', '--first-font-size'), '');
      assert.equal(await value('target-b', '--second-font-size'), '20px');
      assert.equal(
        await page.locator('#theme-observer').evaluate((node) => getComputedStyle(node).fontSize),
        '20px',
      );
      await stable();
    },
  );
  await check('later whole/deep prop updates regain authority over runtime overrides', async () => {
    await set({
      config: { cssVarPrefix: 'third', token: { colorPrimary: '#228844', fontSize: 16 } },
    });
    assert.equal(await value('target-b', '--second-font-size'), '');
    assert.equal(await value('target-b', '--third-font-size'), '16px');
    await page.evaluate(() => window.themeFoundation.writePropFont(18));
    assert.equal(await value('target-b', '--third-font-size'), '18px');
    await stable();
  });
  await check(
    'repeated enable/target switches and conditional slots keep one live business instance',
    async () => {
      for (let i = 0; i < 4; i += 1) {
        await set({ enabled: false, extra: i % 2 === 0 });
        await set({ target: i % 2 === 0 ? 'first' : 'second', enabled: true });
        await stable();
      }
    },
  );
  for (const row of await page.evaluate(() => window.themeFoundation.checkScopes()))
    results.push(row);
  await check(
    'unmount releases variables and remount creates exactly one fresh child',
    async () => {
      await set({ shown: false });
      assert.equal(await value('target-a', '--third-font-size'), '');
      assert.equal(await value('target-b', '--third-font-size'), '');
      assert.equal(await value('target-a', '--first-color-primary'), '#663399');
      assert.deepEqual(await page.evaluate(() => window.themeFoundation.stats), {
        setups: 1,
        mounts: 1,
        unmounts: 1,
      });
      await set({ shown: true });
      assert.deepEqual(await page.evaluate(() => window.themeFoundation.stats), {
        setups: 2,
        mounts: 2,
        unmounts: 1,
      });
      assert.equal(await page.locator('#draft').inputValue(), 'server draft');
      await page.evaluate(() => window.themeFoundation.app.unmount());
      assert.equal(await value('target-a', '--third-font-size'), '');
      assert.equal(await value('target-b', '--third-font-size'), '');
      assert.deepEqual(await page.evaluate(() => window.themeFoundation.stats), {
        setups: 2,
        mounts: 2,
        unmounts: 2,
      });
    },
  );
  await check('hydration and lifecycle run without browser warnings or errors', () =>
    assert.deepEqual(errors, []),
  );
} catch (error) {
  failure = error;
} finally {
  for (const result of await Promise.allSettled([
    browser?.close(),
    server?.close(),
    ssrServer?.close(),
  ])) {
    if (result.status === 'rejected') errors.push(`Cleanup failed: ${String(result.reason)}`);
  }
  const fingerprints = Array.from(loaded, ([file, before]) => ({
    file: path.relative(repo, file),
    before,
    after: digest(file),
  }));
  const unchanged = fingerprints.every((item) => item.before === item.after);
  const passed =
    !failure &&
    unchanged &&
    errors.length === 0 &&
    results.length === 19 &&
    results.every((item) => item.passed);
  writeFileSync(
    output,
    `${JSON.stringify({ passed, mode: published ? 'published' : 'source', builds: false, results, errors, failure: failure ? String(failure) : null, unchanged, fingerprints }, null, 2)}\n`,
  );
  rmSync(temp, { recursive: true, force: true });
  console.log(
    JSON.stringify({
      passed,
      mode: published ? 'published' : 'source',
      checks: results.length,
      failed: results.filter((r) => !r.passed),
      errors,
      output,
    }),
  );
  if (!passed) process.exitCode = 1;
}
