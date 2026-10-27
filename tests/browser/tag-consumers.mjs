import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures'),
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-tag-consumers-')),
  results = [],
  errors = [];
let server, browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    resolve: {
      alias: [
        {
          find: /^\.\.\/\.\.\/index$/,
          replacement: path.resolve(root, '../../../packages/ui/dist/index.mjs'),
        },
      ],
    },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'tag-consumers.html') },
    },
  });
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1200, height: 1000 } });
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.route('https://**', (route) =>
    route.request().resourceType() === 'image'
      ? route.fulfill({
          contentType: 'image/svg+xml',
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="#dddddd"/></svg>',
        })
      : route.continue(),
  );
  await page.goto(`${server.resolvedUrls.local[0]}tag-consumers.html`);
  await page.waitForFunction(() => Boolean(window.tagConsumers));
  const names = await page.evaluate(() => window.tagConsumers.names);
  assert.equal(names.length, 48);
  for (const name of names) {
    await page.evaluate((name) => window.tagConsumers.show(name), name);
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const tags = await page.locator('main .apollo-tag').evaluateAll((nodes) =>
      nodes.map((n) => ({
        node: n.tagName,
        close: n.querySelector('.apollo-tag-close-icon')?.tagName ?? null,
        content: n.querySelector('.apollo-tag-content')?.textContent ?? null,
      })),
    );
    assert.ok(await page.locator('main').evaluate((n) => n.children.length > 1));
    for (const tag of tags) {
      assert.equal(tag.node, 'SPAN');
      if (tag.close) assert.equal(tag.close, 'BUTTON');
    }
    results.push({ name, tags: tags.length, passed: true });
  }
  for (const key of ['Enter', ' ']) {
    await page.evaluate(() => window.tagConsumers.show('select/custom-tag-render'));
    // Unmount and remount to independently verify both native activation keys.
    await page.evaluate(() => window.tagConsumers.show('anchor/bounds'));
    await page.evaluate(() => window.tagConsumers.show('select/custom-tag-render'));
    const input = page.locator('main .apollo-select input');
    await input.click();
    await page.locator('.apollo-select-item-option').filter({ hasText: 'Gold' }).click();
    await input.click();
    await page.locator('.apollo-select-item-option').filter({ hasText: 'Lime' }).click();
    const tags = page.locator('main .apollo-tag');
    assert.equal(await tags.count(), 2);
    const beforeClose = await tags.allTextContents();
    await tags.first().getByRole('button', { name: 'Close', exact: true }).focus();
    await page.keyboard.press(key);
    assert.equal(await tags.count(), 1);
    const afterClose = await tags.allTextContents();
    const passed = JSON.stringify(afterClose) === JSON.stringify([beforeClose[1]]);
    results.push({
      name: `Select real tagRender ${JSON.stringify(key)} removes its own selected value once`,
      beforeClose,
      afterClose,
      passed,
    });
    writeFileSync(
      process.env.TAG_CONSUMER_EVIDENCE ?? '/tmp/apollo-tag-consumers.json',
      `${JSON.stringify({ browser: browser.version(), results, errors }, null, 2)}\n`,
    );
    assert.deepEqual(afterClose, [beforeClose[1]]);
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    process.env.TAG_CONSUMER_EVIDENCE ?? '/tmp/apollo-tag-consumers.json',
    `${JSON.stringify({ browser: browser.version(), results, errors, imageBoundary: 'Remote demo image requests replaced with a deterministic SVG; component code unchanged.' }, null, 2)}\n`,
  );
  console.log(`${results.length} checks, 0 errors`);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
