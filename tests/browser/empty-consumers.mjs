import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-empty-consumers-'));
const results = [],
  errors = [];
let server, browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'empty-consumers.html') },
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  page.setDefaultTimeout(8000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}empty-consumers.html`);
  await page.waitForFunction(() => Boolean(window.emptyConsumers));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const kind of ['list', 'table', 'select', 'transfer', 'mentions', 'filter']) {
    await page.evaluate((kind) => window.emptyConsumers.select(kind), kind);
    if (kind === 'mentions') await page.locator('textarea').press('@');
    const selector =
      kind === 'filter' ? '.apollo-table-filter-dropdown .apollo-empty' : '.apollo-empty';
    const roots = page.locator(selector);
    await roots.first().waitFor();
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    const count = await roots.count();
    assert.equal(count, kind === 'transfer' ? 2 : 1);
    const originals = await roots.elementHandles();
    const expected = ['select', 'transfer', 'mentions'].includes(kind)
      ? 35
      : kind === 'filter'
        ? 100
        : 40;
    assert.deepEqual(
      await roots
        .locator('.apollo-empty-image')
        .evaluateAll((ns) => ns.map((n) => getComputedStyle(n).height)),
      Array(count).fill(`${expected}px`),
    );
    for (const current of [true, false]) {
      await page.evaluate((value) => window.emptyConsumers.current(value), current);
      for (let i = 0; i < count; i++) {
        assert.equal(await originals[i].evaluate((n) => n.isConnected), true);
        assert.equal(
          await roots
            .nth(i)
            .evaluate(
              (n, current) =>
                n.classList.contains(current ? 'consumer-current' : 'consumer-initial') &&
                n.dir === (current ? 'rtl' : 'ltr'),
              current,
            ),
          true,
        );
      }
      // Filter-specific copy is supplied by Table; other actual consumers use the current Empty locale.
      if (kind !== 'filter')
        assert.deepEqual(
          await roots.locator('.apollo-empty-description').allTextContents(),
          Array(count).fill(current ? '暂无数据' : 'No data'),
        );
      results.push({
        consumer: kind,
        check: `current Provider/locale/direction ${current}`,
        passed: true,
      });
    }
    await page.evaluate(() => window.emptyConsumers.compact(true));
    const compactHeight = ['select', 'transfer', 'mentions'].includes(kind)
      ? 30.625
      : kind === 'filter'
        ? 87.5
        : 35;
    assert.deepEqual(
      await roots
        .locator('.apollo-empty-image')
        .evaluateAll((ns) => ns.map((n) => getComputedStyle(n).height)),
      Array(count).fill(`${compactHeight}px`),
    );
    await page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((a) => Number.isFinite(a.effect?.getTiming().iterations ?? 1))
          .map((a) => a.finished.catch(() => {})),
      ),
    );
    for (let i = 0; i < count; i++) {
      const issues = await roots.nth(i).evaluate(async (n) =>
        (await window.axe.run(n)).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((x) => ({ html: x.html, failure: x.failureSummary })),
        })),
      );
      assert.deepEqual(issues, []);
    }
    results.push({
      consumer: kind,
      check: 'actual compact media geometry and scoped Empty axe',
      passed: true,
    });
    console.log(
      `PASS ${kind}: ${count} real empty region(s), current Provider/locale/direction, original root, compact layout and scoped axe`,
    );
  }
  assert.deepEqual(errors, []);
  writeFileSync(
    process.env.EMPTY_CONSUMER_EVIDENCE ?? '/tmp/apollo-empty-browser-consumers.json',
    `${JSON.stringify({ browser: browser.version(), results, errors }, null, 2)}\n`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
