import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { createServer } from 'vite';
import { launchBrowser } from '../../../../../tests/visual/stabilize.mjs';

const repo = path.resolve(fileURLToPath(new URL('../../../../../', import.meta.url))),
  out = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-tree-browser-')),
  root = fs.realpathSync(out);
fs.symlinkSync(path.join(repo, 'node_modules'), path.join(root, 'node_modules'), 'dir');
fs.writeFileSync(
  path.join(root, 'browser-fixture.mjs'),
  fs
    .readFileSync(new URL('./fixtures/native-browser-fixture.mjs', import.meta.url), 'utf8')
    .replaceAll('__APOLLO_TREE_REPO__', repo.replace(/\/$/, '')),
);
const fixture = path.join(root, 'browser-fixture.mjs'),
  require = createRequire(path.join(repo, 'package.json'));
const aliases = [
  'theme',
  'utils',
  'icons',
  'motion',
  'virtual-list',
  'a11y',
  'locale',
  'portal',
  'overlay',
  'position',
  'form-core',
  'picker',
  'ui',
].map((n) => ({
  find: new RegExp(`^@apollo-design/${n}$`),
  replacement: path.join(repo, 'packages', n, 'src/index.ts'),
}));
const loaded = new Map(),
  results = [],
  consoleErrors = [];
let server, ssr, browser, failure;
let phase = 'mount';
const hash = (file) => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const files = fs
  .readdirSync(path.join(repo, 'packages/ui/src/tree'), { recursive: true })
  .filter((file) => /\.(ts|vue|mjs)$/.test(file))
  .map((file) => path.join('packages/ui/src/tree', file));
const inventory = { files: files.map((file) => ({ file })) },
  before = Object.fromEntries(inventory.files.map((x) => [x.file, hash(path.join(repo, x.file))]));
const guard = () => ({
  name: 'tree-read-only-source',
  enforce: 'pre',
  load(id) {
    const file = id.split('?')[0];
    if (file.startsWith(`${repo}/packages/`) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      assert.ok(!file.includes('/dist/'));
      loaded.set(file, hash(file));
    }
    return null;
  },
});
const note = (name, actual, expected) =>
  results.push({
    name,
    actual,
    expected,
    passed: JSON.stringify(actual) === JSON.stringify(expected),
  });
try {
  ssr = await createServer({
    root,
    configFile: false,
    cacheDir: path.join(root, 'browser-ssr-cache'),
    plugins: [vue(), guard()],
    resolve: { alias: aliases },
    ssr: { external: ['vue', 'vue/server-renderer'] },
    server: { middlewareMode: true, fs: { allow: [root, repo] } },
    logLevel: 'warn',
  });
  fs.writeFileSync(
    path.join(root, 'ssr-browser.mjs'),
    `import{renderToString}from'vue/server-renderer';import{createFixture,css}from${JSON.stringify(fixture)};export async function render(){const f=createFixture();return{html:await renderToString(f.app),css:css('default'),warnings:f.warnings,errors:f.errors}}`,
  );
  const rendered = await (await ssr.ssrLoadModule(path.join(root, 'ssr-browser.mjs'))).render();
  note(
    'SSR ordinary full fixture has no warnings or errors',
    [rendered.warnings, rendered.errors],
    [[], []],
  );
  fs.writeFileSync(
    path.join(root, 'browser.html'),
    `<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><style id="tree-style">${rendered.css}</style></head><body><div id="app">${rendered.html}</div><script type="module">import{createFixture,css}from${JSON.stringify(fixture)};const f=createFixture();f.app.mount('#app');window.fixture=f;window.setTree=async patch=>{if(patch.mode)document.getElementById('tree-style').textContent=css(patch.mode);await f.set(patch)};</script></body></html>`,
  );
  server = await createServer({
    root,
    configFile: false,
    cacheDir: path.join(root, 'browser-client-cache'),
    plugins: [vue(), guard()],
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
    },
    resolve: {
      alias: [
        ...aliases,
        { find: /^vue$/, replacement: require.resolve('vue/dist/vue.runtime.esm-bundler.js') },
      ],
      dedupe: ['vue'],
    },
    server: { host: '127.0.0.1', port: 0, fs: { allow: [root, repo] } },
    logLevel: 'warn',
  });
  await server.listen();
  const address = server.httpServer.address();
  assert.ok(address && typeof address === 'object');
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(`${phase}: ${m.text()}`);
  });
  await page.goto(`http://127.0.0.1:${address.port}/browser.html`);
  await page.waitForFunction(() => window.fixture);
  note(
    'hydration emits no warnings/errors',
    await page.evaluate(() => [window.fixture.warnings, window.fixture.errors]),
    [[], []],
  );
  const components = {
    titleHeight: 40,
    switcherSize: 36,
    indentSize: 32,
    nodeHoverBg: '#112233',
    nodeHoverColor: '#223344',
    nodeSelectedBg: '#334455',
    nodeSelectedColor: '#445566',
    directoryNodeSelectedColor: '#556677',
    directoryNodeSelectedBg: '#667788',
  };
  phase = 'theme';
  for (const mode of ['default', 'dark', 'compact', 'dark-compact']) {
    await page.evaluate((mode) => window.setTree({ mode, source: false }), mode);
    const values = await page.evaluate(() => {
      const f = window.fixture,
        el = document.querySelector('#regular .apollo-tree'),
        style = getComputedStyle(el);
      return Object.fromEntries(
        f.names.map((name) => [name, style.getPropertyValue(f.variable(name)).trim()]),
      );
    });
    const expected = await page.evaluate((mode) => {
      const t = window.fixture.defaults(mode);
      return Object.fromEntries(
        Object.entries(t).map(([k, v]) => [k, typeof v === 'number' ? `${v}px` : String(v)]),
      );
    }, mode);
    for (const name of Object.keys(values))
      note(`CSS-only ${mode}: ${name}`, values[name], expected[name]);
  }
  await page.evaluate(
    (components) => window.setTree({ mode: 'default', source: true, components }),
    components,
  );
  const projected = await page.evaluate(() => {
    const f = window.fixture,
      style = document.querySelector('#regular .apollo-tree').style;
    return Object.fromEntries(f.names.map((n) => [n, style.getPropertyValue(f.variable(n))]));
  });
  for (const [name, value] of Object.entries(components))
    note(
      `Provider component token projection: ${name}`,
      projected[name],
      typeof value === 'number' ? `${value}px` : value,
    );
  note(
    'Provider titleHeight drives actual virtual row estimate',
    await page.evaluate(() => window.fixture.rowEstimate()),
    44,
  );
  // Give the same variables directly through native CSS to distinguish missing projection from a missing consumer.
  await page.evaluate((components) => {
    for (const root of document.querySelectorAll('#regular .apollo-tree,#directory .apollo-tree'))
      for (const [name, value] of Object.entries(components))
        root.style.setProperty(
          window.fixture.variable(name),
          typeof value === 'number' ? `${value}px` : value,
        );
  }, components);
  const regular = page.locator('#regular .apollo-tree-node-content-wrapper').first(),
    selected = page.locator('#regular .apollo-tree-node-selected');
  const color = (value) =>
    page.evaluate((value) => {
      const el = document.createElement('span');
      el.style.color = value;
      document.body.append(el);
      const valueOut = getComputedStyle(el).color;
      el.remove();
      return valueOut;
    }, value);
  note(
    'direct CSS titleHeight consumer',
    await regular.evaluate((el) => getComputedStyle(el).minHeight),
    '40px',
  );
  note(
    'direct CSS switcherSize consumer',
    await page
      .locator('#regular .apollo-tree-switcher')
      .first()
      .evaluate((el) => getComputedStyle(el).width),
    '36px',
  );
  note(
    'direct CSS indentSize consumer',
    await page
      .locator('#regular .apollo-tree-indent-unit')
      .first()
      .evaluate((el) => getComputedStyle(el).width),
    '32px',
  );
  await regular.hover();
  note(
    'direct CSS nodeHoverBg consumer',
    await regular.evaluate((el) => getComputedStyle(el).backgroundColor),
    await color(components.nodeHoverBg),
  );
  note(
    'direct CSS nodeHoverColor consumer',
    await regular.evaluate((el) => getComputedStyle(el).color),
    await color(components.nodeHoverColor),
  );
  await page.mouse.move(950, 790);
  note(
    'nodeHoverColor only changes the hovered state',
    await regular.evaluate((el) => getComputedStyle(el).color),
    await color(await page.evaluate(() => window.fixture.defaults('default').nodeHoverColor)),
  );
  note(
    'direct CSS nodeSelectedBg consumer',
    await selected.evaluate((el) => getComputedStyle(el).backgroundColor),
    await color(components.nodeSelectedBg),
  );
  note(
    'direct CSS nodeSelectedColor consumer',
    await selected.evaluate((el) => getComputedStyle(el).color),
    await color(components.nodeSelectedColor),
  );
  note(
    'direct CSS directoryNodeSelectedBg consumer',
    await page
      .locator('#directory .apollo-tree-treenode-selected')
      .evaluate((el) => getComputedStyle(el).backgroundColor),
    await color(components.directoryNodeSelectedBg),
  );
  note(
    'direct CSS directoryNodeSelectedColor consumer',
    await page
      .locator('#directory .apollo-tree-treenode-selected .apollo-tree-node-content-wrapper')
      .evaluate((el) => getComputedStyle(el).color),
    await color(components.directoryNodeSelectedColor),
  );
  const directoryHover = page.locator('#directory .apollo-tree-node-content-wrapper').first();
  await directoryHover.hover();
  note(
    'shared nodeHoverBg reaches DirectoryTree hover',
    await directoryHover.evaluate((el) => getComputedStyle(el, '::before').backgroundColor),
    await color(components.nodeHoverBg),
  );
  await page.evaluate(() => window.fixture.scroll(false));
  const rootScroll = await page
    .locator('#virtual .apollo-tree-list-holder')
    .evaluate((el) => el.scrollTop);
  await page.evaluate(() => window.fixture.scroll(true));
  const directScroll = await page
    .locator('#virtual .apollo-tree-list-holder')
    .evaluate((el) => el.scrollTop);
  note('real browser direct NodeList scroll works', directScroll, 560);
  note('real browser TreeRef scroll reaches the same owner', rootScroll, 560);
  const drop = await page
    .locator('#drop-indicator .apollo-tree-node-content-wrapper > div')
    .evaluate((el) => ({
      class: el.className,
      height: getComputedStyle(el).height,
      background: getComputedStyle(el).backgroundColor,
      left: el.style.left,
      right: el.style.right,
    }));
  note('actual drop indicator is styled', drop.class, 'apollo-tree-drop-indicator');
  note('actual drop indicator has visible height', drop.height, '2px');

  // Use browser DragEvents with actual element geometry for first/last and cross-level drops.
  async function drag(tree, sourceTitle, targetTitle, edge, horizontal = 0) {
    return page.evaluate(
      ({ tree, sourceTitle, targetTitle, edge, horizontal }) => {
        const rows = [...document.querySelectorAll(`#${tree} [role="treeitem"]`)];
        const source = rows.find(
          (el) => el.querySelector('.apollo-tree-title').textContent === sourceTitle,
        );
        const target = rows.find(
          (el) => el.querySelector('.apollo-tree-title').textContent === targetTitle,
        );
        if (!source || !target) throw new Error('Missing drag source or target');
        const rect = target.getBoundingClientRect(),
          start = source.getBoundingClientRect();
        const startX = start.left + 40;
        source.dispatchEvent(
          new DragEvent('dragstart', {
            bubbles: true,
            clientX: startX,
            clientY: start.top + 10,
            dataTransfer: new DataTransfer(),
          }),
        );
        const options = {
          bubbles: true,
          cancelable: true,
          clientX: startX + horizontal,
          clientY: edge === 'top' ? rect.top + 1 : rect.bottom - 1,
          dataTransfer: new DataTransfer(),
        };
        target.dispatchEvent(new DragEvent('dragenter', options));
        target.dispatchEvent(new DragEvent('dragover', options));
        target.dispatchEvent(new DragEvent('drop', options));
        source.dispatchEvent(new DragEvent('dragend', { bubbles: true }));
        return window.fixture.drops.at(-1);
      },
      { tree, sourceTitle, targetTitle, edge, horizontal },
    );
  }
  phase = 'drag';
  const firstDrop = await drag('drag', 'Other', 'P', 'top');
  note('first root gap drop keeps native event and before position', firstDrop, {
    tree: 'ltr',
    native: true,
    key: 'p',
    gap: true,
    position: -1,
  });
  const lastDrop = await drag('drag', 'A', 'Other', 'bottom');
  note('last root gap drop computes an after position', lastDrop, {
    tree: 'ltr',
    native: true,
    key: 'other',
    gap: true,
    position: 2,
  });
  const crossDrop = await drag('drag', 'Other', 'Child', 'bottom', -30);
  note('cross-level drag resolves the ancestor gap', crossDrop, {
    tree: 'ltr',
    native: true,
    key: 'folder',
    gap: true,
    position: 2,
  });
  const rtlDrop = await drag('drag-rtl', 'Other', 'Child', 'bottom', 30);
  note('native RTL dir mirrors cross-level drag geometry', rtlDrop, {
    tree: 'rtl',
    native: true,
    key: 'folder',
    gap: true,
    position: 2,
  });
  const dragIsolation = await page.locator('#drag .apollo-tree-drop-indicator').count();
  note('other tree has no leaked drag indicator', dragIsolation, 0);
  note(
    'disabled nodes cannot initiate dragging',
    await page.locator('#drag [role="treeitem"]').last().getAttribute('draggable'),
    'false',
  );
  phase = 'motion';
  for (let turn = 0; turn < 2; turn++) {
    await page.locator('#motion .apollo-tree-switcher').first().click();
    await page.waitForFunction(
      () =>
        document.querySelectorAll('#motion [role="treeitem"]').length === 3 &&
        !document.querySelector('#motion .apollo-tree-treenode-motion'),
    );
    await page.locator('#motion .apollo-tree-switcher').first().click();
    await page.waitForFunction(
      () =>
        document.querySelectorAll('#motion [role="treeitem"]').length === 2 &&
        !document.querySelector('#motion .apollo-tree-treenode-motion'),
    );
  }
  note(
    'repeated source browser expand/collapse returns to collapsed state',
    await page.locator('#motion [role="treeitem"]').count(),
    2,
  );
  phase = 'measured rows';
  const measuredHeight = await page
    .locator('#measured [role="treeitem"]')
    .first()
    .evaluate((el) => el.offsetHeight + parseFloat(getComputedStyle(el).marginBottom));
  await page.evaluate(() => window.fixture.refs.measured.scrollTo({ key: 'm1', align: 'top' }));
  await page.waitForFunction(
    (expected) =>
      document.querySelector('#measured .apollo-tree-list-holder').scrollTop === expected,
    measuredHeight,
  );
  note(
    'key scrolling uses measured row height instead of itemHeight 28',
    await page.locator('#measured .apollo-tree-list-holder').evaluate((el) => el.scrollTop),
    measuredHeight,
  );
  await page.evaluate(() => window.fixture.refs.measured.scrollTo(0));
  await page.waitForSelector('#measured input');
  await page.locator('#measured input').fill('edited');
  await page.evaluate(() => {
    const input = document.querySelector('#measured input');
    window.measuredEditor = input;
    input.focus();
    input.setSelectionRange(2, 5);
  });
  await page.evaluate(() => window.fixture.updateMeasured());
  note(
    'model changes preserve a slotted editor and its selection',
    await page.evaluate(() => {
      const input = document.querySelector('#measured input');
      return [
        input === window.measuredEditor,
        document.activeElement === input,
        input.value,
        input.selectionStart,
        input.selectionEnd,
      ];
    }),
    [true, true, 'edited', 2, 5],
  );
  await page.evaluate(() => window.fixture.updateMeasured(true));
  note(
    'reordering preserves the keyed row editor',
    await page.evaluate(() => {
      const input = document.querySelector('#measured input');
      return [input === window.measuredEditor, input.value];
    }),
    [true, 'edited'],
  );
  phase = 'scroll Demo';
  await page.locator('#scroll-demo button').first().click();
  await page.waitForFunction(() => {
    const title = [...document.querySelectorAll('#scroll-demo .apollo-tree-title')].find(
      (el) => el.textContent === '目标节点',
    );
    const holder = document.querySelector('#scroll-demo .apollo-tree-list-holder');
    if (!title || !holder) return false;
    const target = title.getBoundingClientRect(),
      viewport = holder.getBoundingClientRect();
    return target.top >= viewport.top && target.bottom <= viewport.bottom + 1;
  });
  note(
    'scroll Demo makes the existing target visible',
    await page.locator('#scroll-demo .apollo-tree-title').filter({ hasText: '目标节点' }).count(),
    1,
  );
  await page.locator('#scroll-demo button').nth(1).click();
  await page.waitForFunction(
    () => document.querySelector('#scroll-demo .apollo-tree-list-holder').scrollTop === 0,
  );
  note(
    'scroll Demo reset returns to the top',
    await page.locator('#scroll-demo .apollo-tree-list-holder').evaluate((el) => el.scrollTop),
    0,
  );
  phase = 'drag Demo';
  await drag('drag-demo', '文件夹 A', '文件夹 B', 'bottom');
  await page.waitForFunction(() =>
    document.querySelector('#drag-demo [role="status"]').textContent.includes('已移动'),
  );
  note(
    'drag Demo commits the requested nested reorder',
    await page.locator('#drag-demo .apollo-tree-title').allTextContents(),
    ['文件夹 B', '文件夹 A', '文件 A1', '文件 A2', '文件 B1'],
  );
  phase = 'token Demo';
  note(
    'token Demo starts with numeric dimensions',
    await page
      .locator('#token-demo .apollo-tree')
      .first()
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--apollo-tree-title-height')),
    '32px',
  );
  await page.locator('#token-demo button').click();
  note(
    'token Demo restores the enclosing provider',
    await page
      .locator('#token-demo .apollo-tree')
      .first()
      .evaluate((el) => getComputedStyle(el).getPropertyValue('--apollo-tree-title-height')),
    '40px',
  );
  assert.ok(
    loaded.has(path.join(repo, 'packages/ui/src/tree/Tree.ts')),
    'Source guard must observe Tree.ts',
  );
  note(
    'real browser interactions have no runtime error',
    await page.evaluate(() => window.fixture.errors),
    [],
  );
} catch (error) {
  failure = String(error);
} finally {
  for (const r of await Promise.allSettled([browser?.close(), server?.close(), ssr?.close()]))
    if (r.status === 'rejected') consoleErrors.push(String(r.reason));
  const after = Object.fromEntries(
    inventory.files.map((x) => [x.file, hash(path.join(repo, x.file))]),
  );
  const changedLoaded = [...loaded]
    .filter(([file, before]) => hash(file) !== before)
    .map(([file]) => file);
  fs.writeFileSync(
    path.join(root, 'browser-observations.json'),
    `${JSON.stringify(
      {
        at: new Date().toISOString(),
        rows: results,
        passed: results.filter((x) => x.passed).length,
        failed: results.filter((x) => !x.passed).length,
        failure,
        consoleErrors,
        before,
        after,
        sourceUnchanged: JSON.stringify(before) === JSON.stringify(after),
        loaded: Object.fromEntries(loaded),
        changedLoaded,
        sourceWrites: false,
        builds: false,
        distWrites: false,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    JSON.stringify({
      artifact: root,
      checks: results.length,
      passed: results.filter((x) => x.passed).length,
      failed: results.filter((x) => !x.passed).length,
      failure,
      consoleErrors,
      changedLoaded,
    }),
  );
  if (
    failure ||
    consoleErrors.length ||
    changedLoaded.length ||
    JSON.stringify(before) !== JSON.stringify(after) ||
    results.some((x) => !x.passed)
  )
    process.exitCode = 1;
}
