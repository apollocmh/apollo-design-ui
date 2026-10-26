import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App, { resultNames } from './fixtures/ResultThemeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-result-hydration-'));
const checks = [],
  errors = [];
let server, browser;
try {
  const markup = await renderToString(createSSRApp(App));
  for (const name of resultNames) assert.ok(markup.includes(`id="hydrated-${name}"`));
  assert.ok(markup.includes('--apollo-result-title-font-size:27px'));
  assert.ok(markup.includes('aria-hidden="true"') && markup.includes('focusable="false"'));
  checks.push('three current source roots and complete native slots SSR without browser globals');
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'result-theme-hydration.html') },
    },
  });
  const file = path.join(outDir, 'result-theme-hydration.html'),
    html = readFileSync(file, 'utf8');
  assert.ok(html.includes('<div id="app"></div>'));
  writeFileSync(
    file,
    html.replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div><script>window.resultServerRoots=['main','adjacent','illustration'].map(n=>document.getElementById('hydrated-'+n));window.resultServerEditors=['icon','body'].map(n=>document.getElementById('hydrated-'+n+'-draft'));for(const n of window.resultServerEditors)n.value='typed before hydration';window.resultServerEditors[1].focus();window.resultServerEditors[1].setSelectionRange(2,5);</script>`,
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
  await page.goto(`${server.resolvedUrls.local[0]}result-theme-hydration.html`);
  await page.waitForFunction(() => window.resultHydrated);
  const identity = async () =>
    assert.equal(
      await page.evaluate(
        () =>
          window.resultServerRoots.every(
            (n, i) =>
              n === document.getElementById(`hydrated-${['main', 'adjacent', 'illustration'][i]}`),
          ) &&
          window.resultServerEditors.every(
            (n, i) =>
              n === document.getElementById(`hydrated-${['icon', 'body'][i]}-draft`) &&
              n.value === 'typed before hydration',
          ) &&
          document.activeElement === window.resultServerEditors[1] &&
          window.resultServerEditors[1].selectionStart === 2 &&
          window.resultServerEditors[1].selectionEnd === 5,
      ),
      true,
    );
  await identity();
  checks.push(
    'hydration preserves all roots, both uncontrolled pretyped editors, focus and selection',
  );
  for (const expected of ['', '31px', '27px']) {
    await page.evaluate(() => window.resultHydration.cycleTheme());
    await identity();
    for (const name of resultNames)
      assert.equal(
        await page
          .locator(`#hydrated-${name}`)
          .evaluate((n) => n.style.getPropertyValue('--apollo-result-title-font-size')),
        expected,
      );
  }
  await page.evaluate(() => window.resultHydration.native(true));
  assert.equal(
    await page
      .locator('#hydrated-main')
      .evaluate((n) => n.style.getPropertyValue('--apollo-result-title-font-size')),
    '43px',
  );
  await page.evaluate(() => window.resultHydration.native(false));
  await identity();
  checks.push(
    'theme removal/replacement/restoration and native variable overrides retain original editors',
  );
  for (const status of ['success', 'warning', '403', 500, 404]) {
    await page.evaluate((value) => window.resultHydration.status(value), status);
    await page.evaluate(() => window.resultHydration.toggleExtra());
    await identity();
  }
  checks.push(
    'normal/exception state and adjacent conditional content changes preserve native identity',
  );
  await page.evaluate(() => window.resultHydration.show(false));
  assert.equal(await page.locator('[id^="hydrated-"]').count(), 0);
  assert.equal((await page.evaluate(() => window.resultHydration.snapshot())).nativeId, null);
  await page.evaluate(() => window.resultHydration.show(true));
  assert.equal(
    (await page.evaluate(() => window.resultHydration.snapshot())).nativeId,
    'hydrated-main',
  );
  assert.deepEqual(errors, []);
  checks.push(
    'unmount/remount clears and restores the native root with zero hydration/page/Vue errors',
  );
  writeFileSync(
    process.env.RESULT_HYDRATION_EVIDENCE ?? '/tmp/apollo-result-hydration.json',
    `${JSON.stringify({ browser: browser.version(), checks, errors }, null, 2)}\n`,
  );
  console.log(checks);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
