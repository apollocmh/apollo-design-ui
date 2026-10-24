/** H01: built Table docs contain bilingual API content and survive browser hydration. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import { preview } from 'vite';
import { materializeDemos } from '../../docs/audit/tools/materialize-demos.mjs';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../packages/docs');
const base = process.env.DOCS_BASE ?? '/apollo-design-ui/';
const server = await preview({
  root,
  configFile: false,
  base,
  build: { outDir: 'dist' },
  preview: { host: '127.0.0.1', port: 0 },
});
let browser;
try {
  const launched = await launchBrowser();
  browser = launched.browser;
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  const scriptRequests = [];
  const mainScriptRequests = [];
  page.on('request', (request) => {
    if (request.resourceType() === 'script') {
      const url = new URL(request.url()).pathname;
      scriptRequests.push(url);
      if (request.frame() === page.mainFrame()) mainScriptRequests.push(url);
    }
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const response = await page.goto(`${server.resolvedUrls.local[0]}components/table`, {
    waitUntil: 'networkidle',
  });
  assert.equal(response.status(), 200);
  const ssr = await response.text();
  assert.match(ssr, /id="api"/);
  for (const key of ['columns', 'dataSource', 'rowSelection', 'rowKey', 'expandable', 'pagination'])
    assert.ok(ssr.includes(key), `SSR API ${key}`);
  await page.waitForSelector('h1.component-title');
  assert.match(await page.locator('h1.component-title').innerText(), /Table/);
  const searchRequests = () => scriptRequests.filter((url) => /\/search-[^/]+\.js$/.test(url));
  assert.equal(searchRequests().length, 0, 'search index stays deferred before opening search');
  const initialRequests = [...new Set(scriptRequests)];
  const initialMainRequests = [...new Set(mainScriptRequests)];
  const deferredDemo = page.locator('.demo-renderer[data-demo="table-drag-reorder"]');
  assert.equal(
    await deferredDemo.locator('.demo-renderer-loading').count(),
    1,
    'offscreen demo stays deferred',
  );
  const text = () => page.locator('.doc-markdown').allTextContents();
  assert.ok((await text()).join(' ').includes('ColumnsType'));
  await page.locator('.site-lang-toggle').click();
  await page.waitForFunction(() =>
    Array.from(document.querySelectorAll('.doc-markdown')).some((node) =>
      node.textContent?.includes('When To Use'),
    ),
  );
  const english = (await text()).join(' ');
  for (const key of ['columns', 'dataSource', 'TableRowSelection', 'rowKey'])
    assert.ok(english.includes(key), `English API ${key}`);
  await deferredDemo.scrollIntoViewIfNeeded();
  await deferredDemo.locator('table').waitFor();
  const tableNode = await deferredDemo.locator('table').elementHandle();
  await deferredDemo.getByRole('button', { name: 'Move row down' }).click();
  assert.match(await deferredDemo.locator('output').innerText(), /Rows: b,a,c/);
  await page.locator('h1.component-title').scrollIntoViewIfNeeded();
  assert.match(await deferredDemo.locator('output').textContent(), /Rows: b,a,c/);
  await deferredDemo.scrollIntoViewIfNeeded();
  assert.equal(
    await page.evaluate(
      (node) =>
        node === document.querySelector('.demo-renderer[data-demo="table-drag-reorder"] table'),
      tableNode,
    ),
    true,
  );
  await page.locator('h1.component-title').scrollIntoViewIfNeeded();
  await page.locator('.site-search-trigger').click();
  await page.locator('#site-search-input').fill('Badge');
  await page.waitForSelector('.site-search-item');
  assert.equal(searchRequests().length, 1, 'concurrent search consumers share one index request');
  await page.locator('#site-search-input').press('Escape');
  await page.locator('.site-search-panel').waitFor({ state: 'detached' });
  assert.equal(
    await page.locator('.site-search-trigger').evaluate((el) => el === document.activeElement),
    true,
  );
  await page.locator('.site-search-trigger').click();
  await page.waitForSelector('.site-search-item');
  assert.equal(searchRequests().length, 1, 'reopening search reuses the loaded index');
  await page.locator('#site-search-input').press('Escape');
  await page.locator('.site-search-panel').waitFor({ state: 'detached' });
  for (
    let i = 0;
    i < 3 && (await page.locator('html').getAttribute('data-apollo-theme')) !== 'dark';
    i++
  ) {
    await page.locator('.site-theme-toggle').click();
  }
  assert.equal(await page.locator('html').getAttribute('data-apollo-theme'), 'dark');
  const delivery = {
    frameScope:
      'initialScripts includes active demo iframes; initialMainScripts records the main frame separately',
    initialMainScripts: initialMainRequests,
    initialScripts: initialRequests.map((url) => {
      const file = path.join(root, 'dist', url.slice(base.length));
      const data = fs.readFileSync(file);
      return {
        asset: url.slice(base.length),
        bytes: data.length,
        gzipBytes: gzipSync(data).length,
      };
    }),
    searchIndexRequests: searchRequests(),
    browser: await browser.version(),
  };
  if (process.env.DOCS_DELIVERY_OUTPUT)
    fs.writeFileSync(process.env.DOCS_DELIVERY_OUTPUT, `${JSON.stringify(delivery, null, 2)}\n`);
  assert.equal(
    await materializeDemos(page),
    44,
    'whole-page capture preparation activates every Table demo',
  );
  await page.goto(`${server.resolvedUrls.local[0]}components/float-button`, {
    waitUntil: 'networkidle',
  });
  assert.equal(
    await materializeDemos(page),
    14,
    'whole-page preparation covers inline and viewport iframe demos',
  );
  assert.deepEqual(errors, []);
  const failedCapture = await browser.newPage();
  try {
    await failedCapture.setContent(
      '<div class="demo-renderer" data-demo="broken"><div class="demo-renderer-error">Module failed</div></div>',
    );
    await assert.rejects(materializeDemos(failedCapture), /Demo failed to load: broken/);
  } finally {
    await failedCapture.close();
  }
  console.log(
    `PASS H01: Table route HTTP 200, SSR API, hydrated page, English API, zero page errors; Chrome ${await browser.version()}`,
  );
  console.log(
    'PASS H04: viewport demo loading and state retention; deferred search index, single request, cached reopen, focus restoration; delivery sizes recorded',
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
