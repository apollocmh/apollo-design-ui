import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App, { emptyNames } from './fixtures/EmptyThemeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-empty-hydration-'));
const checks = [],
  errors = [];
let server, browser;
try {
  const markup = await renderToString(createSSRApp(App));
  for (const name of emptyNames) assert.ok(markup.includes(`id="hydrated-${name}"`));
  assert.ok(
    markup.includes('Image tail') &&
      markup.includes('Description tail') &&
      markup.includes('Footer tail'),
  );
  assert.ok(!markup.includes('NaN'));
  checks.push('three actual published roots and complete native slots SSR without browser globals');
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'empty-theme-hydration.html') },
    },
  });
  const file = path.join(outDir, 'empty-theme-hydration.html');
  const html = readFileSync(file, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    file,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div><script>window.emptyServerRoots=['main','adjacent','illustration'].map(n=>document.getElementById('hydrated-'+n));window.emptyServerEditors=['image','footer'].map(n=>document.getElementById('hydrated-'+n+'-draft'));for(const n of window.emptyServerEditors)n.value='typed before hydration';window.emptyServerEditors[1].focus();window.emptyServerEditors[1].setSelectionRange(2,5);</script>`,
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
  page.setDefaultTimeout(8000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}empty-theme-hydration.html`);
  await page.waitForFunction(() => window.emptyHydrated);
  const identity = async () =>
    assert.equal(
      await page.evaluate(
        () =>
          window.emptyServerRoots.every(
            (n, i) =>
              n === document.getElementById(`hydrated-${['main', 'adjacent', 'illustration'][i]}`),
          ) &&
          window.emptyServerEditors.every(
            (n, i) =>
              n === document.getElementById(`hydrated-${['image', 'footer'][i]}-draft`) &&
              n.value === 'typed before hydration',
          ) &&
          document.activeElement === window.emptyServerEditors[1] &&
          window.emptyServerEditors[1].selectionStart === 2 &&
          window.emptyServerEditors[1].selectionEnd === 5,
      ),
      true,
    );
  await identity();
  checks.push('hydration preserves all roots, pretyped image/footer drafts, focus and selection');
  for (const stage of [1, 2, 0]) {
    await page.evaluate((v) => window.emptyHydration.stage(v), stage);
    await identity();
    const main = page.locator('#hydrated-main'),
      adjacent = page.locator('#hydrated-adjacent');
    assert.equal(await main.evaluate((n) => n.classList.contains('apollo-empty-normal')), false);
    assert.equal(await main.evaluate((n) => n.dir), stage === 1 ? 'rtl' : 'ltr');
    assert.equal(await main.locator('.apollo-empty-image-content').count(), 1);
    assert.equal(
      await adjacent.evaluate((n) => n.classList.contains('nearest-config') && n.dir === 'ltr'),
      true,
    );
    assert.deepEqual(await page.locator('#hydrated-illustration svg title').allTextContents(), [
      stage === 1 ? '暂无数据' : 'No data',
    ]);
    assert.equal(
      await main.evaluate(
        (n, stage) =>
          stage === 2
            ? !n.className.includes('provider-')
            : n.classList.contains(stage === 0 ? 'provider-initial' : 'provider-next'),
        stage,
      ),
      true,
    );
  }
  checks.push(
    'Provider/locale/direction/theme replacement and removal preserve complete business content and nearest scope',
  );
  for (const extra of [true, false, true]) {
    await page.evaluate((v) => window.emptyHydration.extra(v), extra);
    await identity();
    assert.equal(await page.locator('#hydrated-main b').count(), extra ? 1 : 0);
  }
  checks.push('repeated conditional image tails keep both editors and selection');
  await page.evaluate(() => window.emptyHydration.show(false));
  assert.equal((await page.evaluate(() => window.emptyHydration.snapshot())).nativeId, null);
  assert.equal(await page.locator('.apollo-empty').count(), 0);
  await page.evaluate(() => window.emptyHydration.show(true));
  assert.equal(await page.locator('.apollo-empty').count(), 3);
  assert.equal(
    (await page.evaluate(() => window.emptyHydration.snapshot())).nativeId,
    'hydrated-main',
  );
  assert.equal(await page.locator('#hydrated-image-draft').inputValue(), '');
  checks.push('unmount clears expose; remount creates fresh independent content');
  assert.deepEqual(errors, []);
  checks.push('no hydration warnings or page errors');
  writeFileSync(
    process.env.EMPTY_HYDRATION_EVIDENCE ?? '/tmp/apollo-empty-hydration.json',
    `${JSON.stringify({ browser: browser.version(), checks, errors }, null, 2)}\n`,
  );
  console.log(`PASS ${checks.length} Empty hydration groups`);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
