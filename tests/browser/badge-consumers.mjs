import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-badge-consumers-'));
const results = [],
  errors = [];
let server, browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'badge-consumers.html') },
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
  page.setDefaultTimeout(8000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}badge-consumers.html`);
  await page.waitForFunction(() => Boolean(window.setBadgeConsumer));
  const names = await page.evaluate(() => window.badgeConsumerNames);
  assert.equal(names.length, 4);
  for (let index = 0; index < names.length; index++)
    for (const mode of ['default', 'dark', 'compact', 'both']) {
      await page.evaluate(([index, mode]) => window.setBadgeConsumer(index, mode), [index, mode]);
      await page.waitForFunction(() => Boolean(document.querySelector('.apollo-badge')));
      const actual = await page.locator('.apollo-badge').evaluateAll((nodes) =>
        nodes.map((n) => {
          const indicator = n.querySelector(
            '.apollo-badge-count,.apollo-badge-dot,.apollo-badge-status-dot',
          );
          return {
            connected: n.isConnected,
            indicator: Boolean(indicator),
            invalid: /NaN|\[object Object\]/.test(n.textContent),
            width: indicator ? indicator.getBoundingClientRect().width : 0,
          };
        }),
      );
      assert.ok(actual.length > 0 && actual.every((n) => n.connected && !n.invalid));
      assert.ok(actual.some((n) => n.indicator && n.width > 0));
      results.push({
        file: names[index].replace('../../../', ''),
        mode,
        roots: actual.length,
        passed: true,
      });
    }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks: results.length, errors }));
} finally {
  writeFileSync(
    process.env.BADGE_CONSUMER_EVIDENCE ?? '/tmp/apollo-badge-consumers-browser.json',
    JSON.stringify({ results, errors }, null, 2),
  );
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
