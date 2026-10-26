import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App, { skeletonNames } from './fixtures/SkeletonThemeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-skeleton-hydration-'));
const checks = [],
  errors = [];
let server, browser;
try {
  const markup = await renderToString(createSSRApp(App));
  for (const name of skeletonNames) assert.ok(markup.includes(`id="hydrated-${name}"`));
  assert.ok(markup.includes('--apollo-skeleton-title-height:27px'));
  assert.ok(markup.includes('aria-busy="true"') && markup.includes('aria-hidden="true"'));
  checks.push(
    'all six exports SSR current source tokens, native roots and decoration semantics without browser globals',
  );
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'skeleton-theme-hydration.html') },
    },
  });
  const file = path.join(outDir, 'skeleton-theme-hydration.html'),
    html = readFileSync(file, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    file,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div><script>window.skeletonServerRoots=${JSON.stringify(skeletonNames)}.map(n=>document.getElementById('hydrated-'+n));window.skeletonServerEditors=['image','node'].map(n=>document.getElementById('hydrated-'+n+'-draft'));for(const n of window.skeletonServerEditors)n.value='typed before hydration';window.skeletonServerEditors[1].focus();window.skeletonServerEditors[1].setSelectionRange(2,5);</script>`,
    ),
  );
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}skeleton-theme-hydration.html`);
  await page.waitForFunction(() => window.skeletonHydrated);
  const identity = async () =>
    assert.equal(
      await page.evaluate(
        () =>
          window.skeletonServerRoots.every(
            (n, i) =>
              n ===
              document.getElementById(
                `hydrated-${['main', 'avatar', 'button', 'input', 'image', 'node'][i]}`,
              ),
          ) &&
          window.skeletonServerEditors.every(
            (n, i) =>
              n === document.getElementById(`hydrated-${['image', 'node'][i]}-draft`) &&
              n.value === 'typed before hydration',
          ) &&
          document.activeElement === window.skeletonServerEditors[1] &&
          window.skeletonServerEditors[1].selectionStart === 2 &&
          window.skeletonServerEditors[1].selectionEnd === 5,
      ),
      true,
    );
  await identity();
  checks.push(
    'hydration retains every server root, both uncontrolled pretyped editors, focus and selection',
  );
  for (const expected of ['', '31px', '27px']) {
    await page.evaluate(() => window.skeletonHydration.cycleTheme());
    await identity();
    for (const name of skeletonNames)
      assert.equal(
        await page
          .locator(`#hydrated-${name}`)
          .evaluate((n) => n.style.getPropertyValue('--apollo-skeleton-title-height')),
        expected,
      );
  }
  checks.push(
    'source configuration removal, replacement and restoration update all six roots without replacing editors',
  );
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.skeletonHydration.toggleExtra());
    await identity();
  }
  checks.push(
    'conditional adjacent native content preserves the original editor nodes and selection',
  );
  await page.evaluate(() => window.skeletonHydration.loading(false));
  assert.equal(await page.locator('#hydrated-main').count(), 0);
  assert.equal((await page.evaluate(() => window.skeletonHydration.snapshot())).nativeId, null);
  for (const value of [true, false, true])
    await page.evaluate((value) => window.skeletonHydration.loading(value), value);
  assert.equal(
    (await page.evaluate(() => window.skeletonHydration.snapshot())).nativeId,
    'hydrated-main',
  );
  checks.push(
    'controlled loading keeps its unwrapped-content boundary and clears/restores the native ref',
  );
  await page.evaluate(() => window.skeletonHydration.show(false));
  assert.equal(await page.locator('[id^="hydrated-"]').count(), 0);
  assert.equal((await page.evaluate(() => window.skeletonHydration.snapshot())).nativeId, null);
  await page.evaluate(() => window.skeletonHydration.show(true));
  assert.equal(
    (await page.evaluate(() => window.skeletonHydration.snapshot())).nativeId,
    'hydrated-main',
  );
  assert.deepEqual(errors, []);
  checks.push('unmount/remount clears real roots and refs with zero hydration, page or Vue errors');
  writeFileSync(
    process.env.SKELETON_HYDRATION_EVIDENCE ?? '/tmp/apollo-skeleton-hydration.json',
    `${JSON.stringify({ browser: browser.version(), checks, errors }, null, 2)}\n`,
  );
  console.log(checks);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
