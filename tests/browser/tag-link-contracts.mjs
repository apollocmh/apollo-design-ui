import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures'),
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-tag-link-'));
const results = [],
  errors = [];
let server, browser;
const check = async (name, run) => {
  try {
    await run();
    results.push({ name, passed: true });
  } catch (e) {
    results.push({ name, passed: false, error: e.message });
  }
};
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'tag-link-contracts.html') },
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
  const page = await browser.newPage();
  page.setDefaultTimeout(5000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}tag-link-contracts.html`);
  await page.waitForFunction(() => Boolean(window.tagLink));
  const reset = (kind = 'svg', blocked = false, cancel = false) =>
    page.evaluate(
      ([kind, blocked, cancel]) => window.tagLink.reset(kind, blocked, cancel),
      [kind, blocked, cancel],
    );
  const action = () => page.getByRole('button', { name: 'Close', exact: true });
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  await check('owned close control preserves complete caller SVG semantics', async () => {
    assert.equal(await page.locator('[data-caller-icon]').getAttribute('role'), 'img');
    assert.equal(
      await page.locator('[data-caller-icon]').getAttribute('aria-label'),
      'Business glyph',
    );
    assert.equal(await action().evaluate((n) => n.tagName), 'BUTTON');
  });
  await check('linked close action has no nested interactive content', async () => {
    const issues = await page.locator('main').evaluate(async (n) =>
      (await window.axe.run(n)).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((x) => x.failureSummary),
      })),
    );
    assert.deepEqual(issues, []);
  });
  for (const kind of ['svg', 'default'])
    for (const key of ['Enter', ' ']) {
      await reset(kind);
      await check(
        `${kind} native ${JSON.stringify(key)} closes once without navigating`,
        async () => {
          await action().focus();
          await page.keyboard.press(key);
          assert.equal((await page.evaluate(() => window.tagLink.snapshot())).closed, 1);
          assert.equal(
            await page
              .locator('#linked-tag')
              .evaluate((n) => n.classList.contains('apollo-tag-hidden')),
            true,
          );
          assert.ok(!page.url().endsWith('#target'));
        },
      );
    }
  await reset('svg', true);
  await check('closable.disabled disables only the real close action', async () => {
    assert.equal(await action().isDisabled(), true);
    assert.equal(
      await page.getByRole('link', { name: 'Tagged link', exact: true }).getAttribute('href'),
      '#target',
    );
    assert.equal((await page.evaluate(() => window.tagLink.snapshot())).closed, 0);
  });
  await reset('svg', false, true);
  await check('cancelable native close keeps the link and glyph mounted', async () => {
    const original = await page.locator('[data-caller-icon]').elementHandle();
    await action().click();
    assert.equal((await page.evaluate(() => window.tagLink.snapshot())).closed, 1);
    assert.equal(await original.evaluate((n) => n.isConnected), true);
    assert.equal(
      await page.locator('#linked-tag').evaluate((n) => n.classList.contains('apollo-tag-hidden')),
      false,
    );
  });
  await check('no page or Vue errors', async () => assert.deepEqual(errors, []));
  writeFileSync(
    process.env.TAG_LINK_EVIDENCE ?? '/tmp/apollo-tag-link.json',
    `${JSON.stringify({ browser: browser.version(), results, errors }, null, 2)}\n`,
  );
  console.log(`${results.filter((r) => r.passed).length}/${results.length}`);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
