import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures'),
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-typography-consumers-'));
let server, browser;
const results = [],
  errors = [];
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'typography-consumers.html') },
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
  await page.goto(`${server.resolvedUrls.local[0]}typography-consumers.html`);
  await page.waitForFunction(() => Boolean(window.setTypographyConsumer));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const names = await page.evaluate(() => window.typographyConsumerNames);
  assert.equal(names.length, 23);
  for (let index = 0; index < names.length; index++)
    for (const dark of [false, true]) {
      await page.evaluate(
        ([index, dark]) => window.setTypographyConsumer(index, dark),
        [index, dark],
      );
      await page.waitForFunction(() => document.querySelector('main .apollo-typography'));
      const roots = page.locator('main .apollo-typography');
      const text = await roots.allTextContents();
      assert.ok(text.some((value) => value.trim()));
      results.push({
        file: names[index].replace('../../../', ''),
        theme: dark ? 'dark' : 'light',
        roots: await roots.count(),
        passed: true,
      });
      console.log(`PASS ${names[index]} ${dark ? 'dark' : 'light'}`);
    }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks: results.length, errors }));
} finally {
  writeFileSync(
    process.env.TYPOGRAPHY_CONSUMER_EVIDENCE ?? '/tmp/apollo-typography-consumers-browser.json',
    JSON.stringify({ results, errors }, null, 2),
  );
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
