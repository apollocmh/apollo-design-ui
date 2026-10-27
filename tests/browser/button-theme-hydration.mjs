import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App, { buttonNames } from './fixtures/ButtonThemeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures'),
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-button-hydration-'));
const checks = [],
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
      rollupOptions: { input: path.join(root, 'button-theme-hydration.html') },
    },
  });
  const template = readFileSync(path.join(outDir, 'button-theme-hydration.html'), 'utf8');
  assert.ok(template.includes('<div id="app"></div>'));
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    const original = globalThis.setTimeout;
    let timers = 0,
      markup;
    globalThis.setTimeout = (...args) => {
      timers++;
      return original(...args);
    };
    try {
      markup = await renderToString(createSSRApp(App, { mode }));
    } finally {
      globalThis.setTimeout = original;
    }
    assert.equal(timers, 0);
    for (const name of buttonNames) assert.ok(markup.includes(`id="hydrated-${name}"`));
    assert.ok(markup.includes('--apollo-btn-content-font-size:18px'));
    assert.ok(markup.includes('role="link"'));
    checks.push({
      mode,
      name: 'three production roots, full slots and current source tokens SSR without client timers',
    });
    writeFileSync(
      path.join(outDir, `button-theme-hydration-${mode}.html`),
      template.replace(
        '<div id="app"></div>',
        `<div id="app">${markup}</div><script>window.buttonHydrationMode=${JSON.stringify(mode)};window.buttonServerRoots=['main','adjacent','link'].map(n=>document.getElementById('hydrated-'+n));window.buttonServerEditors=['first','second'].map(n=>document.getElementById('hydrated-'+n+'-draft'));for(const n of window.buttonServerEditors)n.value='typed before hydration';window.buttonServerEditors[1].focus();window.buttonServerEditors[1].setSelectionRange(2,5);</script>`,
      ),
    );
  }
  server = await preview({
    root,
    configFile: false,
    logLevel: 'warn',
    build: { outDir },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    page.setDefaultTimeout(10000);
    page.on('pageerror', (e) => errors.push(`${mode}: ${e.message}`));
    page.on('console', (m) => {
      if (m.type() === 'error' || m.text().includes('[Vue warn]'))
        errors.push(`${mode}: ${m.text()}`);
    });
    await page.goto(`${server.resolvedUrls.local[0]}button-theme-hydration-${mode}.html`);
    await page.waitForFunction(() => window.buttonHydrated);
    const identity = async () =>
      assert.equal(
        await page.evaluate(
          () =>
            window.buttonServerRoots.every(
              (n, i) =>
                n === document.getElementById(`hydrated-${['main', 'adjacent', 'link'][i]}`),
            ) &&
            window.buttonServerEditors.every(
              (n, i) =>
                n === document.getElementById(`hydrated-${['first', 'second'][i]}-draft`) &&
                n.value === 'typed before hydration',
            ) &&
            document.activeElement === window.buttonServerEditors[1] &&
            window.buttonServerEditors[1].selectionStart === 2 &&
            window.buttonServerEditors[1].selectionEnd === 5,
        ),
        true,
      );
    await identity();
    assert.equal((await page.evaluate(() => window.buttonHydration.snapshot())).mounts, 1);
    checks.push({
      mode,
      name: 'hydration retains every root, caller child, pretyped sibling editor, focus and selection',
    });
    await page.evaluate(() => window.buttonHydration.loading(false));
    for (const expected of ['', '21px', '18px']) {
      await page.evaluate(() => window.buttonHydration.cycleTheme());
      await identity();
      for (const name of buttonNames)
        assert.equal(
          await page
            .locator(`#hydrated-${name}`)
            .evaluate((n) => n.style.getPropertyValue('--apollo-btn-content-font-size')),
          expected,
        );
    }
    await page.evaluate(() => window.buttonHydration.native(true));
    assert.equal(
      await page.locator('#hydrated-main').evaluate((n) => getComputedStyle(n).fontSize),
      '28px',
    );
    await page.evaluate(() => window.buttonHydration.native(false));
    await identity();
    assert.equal((await page.evaluate(() => window.buttonHydration.snapshot())).mounts, 1);
    checks.push({
      mode,
      name: 'current source removal/replacement/restoration and native variable priority preserve identity',
    });
    await page.evaluate(() => window.buttonHydration.extra(true));
    await identity();
    assert.ok((await page.locator('#hydrated-main').textContent()).includes('Extra'));
    await page.clock.install();
    await page.evaluate(() => window.buttonHydration.loading(true));
    assert.equal(await page.locator('#hydrated-link').getAttribute('href'), null);
    assert.equal(await page.locator('#hydrated-link').getAttribute('role'), 'link');
    await page.clock.fastForward(1100);
    assert.equal(
      await page
        .locator('#hydrated-main')
        .evaluate((n) => n.classList.contains('apollo-btn-loading')),
      true,
    );
    await page.evaluate(() => window.buttonHydration.loading(false));
    assert.equal(await page.locator('#hydrated-link').getAttribute('href'), '#target');
    await identity();
    checks.push({
      mode,
      name: 'conditional complete content and delayed busy/link navigation update without remounting siblings',
    });
    await page.evaluate(() => window.buttonHydration.loading(true));
    await page.evaluate(() => window.buttonHydration.show(false));
    await page.clock.fastForward(1500);
    assert.equal((await page.evaluate(() => window.buttonHydration.snapshot())).nativeId, null);
    assert.equal(
      await page.evaluate(() => window.buttonServerRoots.every((n) => !n.isConnected)),
      true,
    );
    await page.evaluate(() => window.buttonHydration.loading(false));
    await page.evaluate(() => window.buttonHydration.show(true));
    assert.equal(
      (await page.evaluate(() => window.buttonHydration.snapshot())).nativeId,
      'hydrated-main',
    );
    assert.equal((await page.evaluate(() => window.buttonHydration.snapshot())).mounts, 2);
    assert.equal(
      await page
        .locator('#hydrated-main')
        .evaluate((n) => n.classList.contains('apollo-btn-loading')),
      false,
    );
    checks.push({
      mode,
      name: 'pending unmount cleans old timers and nullable expose; independent remount starts clean',
    });
    await page.close();
  }
  writeFileSync(
    process.env.BUTTON_HYDRATION_EVIDENCE ?? '/tmp/apollo-button-hydration.json',
    `${JSON.stringify({ checks, errors, browser: browser.version() }, null, 2)}\n`,
  );
  assert.deepEqual(errors, []);
  assert.equal(checks.length, 20);
  console.log(`PASS ${checks.length} four-algorithm production SSR/hydration groups`);
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
