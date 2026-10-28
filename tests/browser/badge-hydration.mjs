import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Badge, Ribbon } from '@apollo-design/ui';
import { build, preview } from 'vite';
import { createSSRApp, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import App from './fixtures/BadgeHydration.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-badge-hydration-'));
const checks = [],
  errors = [];
let server, browser;
try {
  for (const [name, component, props, content] of [
    ['negative', Badge, { count: -12 }, '-12'],
    ['zero', Badge, { count: 0, showZero: true }, '0'],
    ['overflow', Badge, { count: 120 }, '99+'],
    ['rich-count', Badge, { count: [h('b', 'First'), h('i', 'Last'), 0] }, 'First'],
    ['status', Badge, { status: 'success', text: [h('b', 'First'), h('i', 'Last'), 0] }, 'Last'],
    ['ribbon-array', Ribbon, { text: [h('b', 'First'), h('i', 'Last'), 0] }, 'Last'],
  ]) {
    const html = await renderToString(
      createSSRApp({ render: () => h(component, { id: `ssr-${name}`, ...props }) }),
    );
    assert.ok(html.includes(content) && html.includes(`id="ssr-${name}"`) && !html.includes('NaN'));
    checks.push(`SSR complete ${name}`);
  }
  const markup = await renderToString(createSSRApp(App));
  assert.ok(markup.includes('Complete') && !markup.includes('Fallback'));
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'badge-hydration.html') },
    },
  });
  const file = path.join(outDir, 'badge-hydration.html');
  writeFileSync(
    file,
    readFileSync(file, 'utf8').replace(
      '<div id="app"></div>',
      `<div id="app">${markup}</div><script>window.badgeServerRoots=['badge','ribbon'].map(n=>document.getElementById('hydrated-'+n));window.badgeServerDraft=document.getElementById('badge-hydrated-badge');window.badgeServerDraft.value='typed before hydration';window.badgeServerDraft.focus();window.badgeServerDraft.setSelectionRange(2,5);</script>`,
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
  const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (
      m.type() === 'error' ||
      m.text().includes('[Vue warn]') ||
      /hydration.*mismatch/i.test(m.text())
    )
      errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}badge-hydration.html`);
  await page.waitForFunction(() => Boolean(window.badgeHydration));
  assert.equal(
    await page.evaluate(() =>
      ['badge', 'ribbon'].every(
        (name, i) => document.getElementById(`hydrated-${name}`) === window.badgeServerRoots[i],
      ),
    ),
    true,
  );
  checks.push('both server roots retained by hydration');
  const input = page.locator('#badge-hydrated-badge');
  assert.equal(await input.inputValue(), 'typed before hydration');
  assert.equal(
    await input.evaluate(
      (n) =>
        n === window.badgeServerDraft &&
        document.activeElement === n &&
        n.selectionStart === 2 &&
        n.selectionEnd === 5,
    ),
    true,
  );
  checks.push('pre-hydration business draft, focus and selection retained');
  for (const stage of [1, 0, 1]) {
    await page.evaluate((stage) => window.badgeHydration.set({ stage }), stage);
    // Theme changes can coincide with the initial count enter animation. Measure
    // after finite animations settle, rather than sampling a rounded intermediate size.
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => Number.isFinite(animation.effect?.getComputedTiming().endTime))
          .map((animation) => animation.finished.catch(() => {})),
      );
    });
    await page.waitForFunction(
      (height) =>
        getComputedStyle(document.querySelector('#hydrated-badge .apollo-badge-count')).height ===
        height,
      stage ? '29px' : '26px',
    );
    assert.equal(
      await page
        .locator('#hydrated-badge .apollo-badge-count')
        .evaluate((n) => getComputedStyle(n).height),
      stage ? '29px' : '26px',
    );
    assert.deepEqual(await page.evaluate(() => window.badgeHydration.snapshot()), {
      mounts: 2,
      unmounts: 0,
      roots: [true, true],
    });
    assert.equal(
      await input.evaluate((n) => n === window.badgeServerDraft && document.activeElement === n),
      true,
    );
    for (const name of ['badge', 'ribbon'])
      assert.equal(
        await page
          .locator(`#hydrated-${name}`)
          .evaluate((n, stage) => n.classList.contains(`stage-${stage}`), stage),
        true,
      );
    checks.push(`current theme/provider ${stage} with stable business instances and references`);
  }
  await page.evaluate(() => window.badgeHydration.set({ show: false }));
  assert.equal(await input.count(), 0);
  await page.evaluate(() => window.badgeHydration.set({ show: true }));
  assert.equal(await input.count(), 1);
  assert.deepEqual(await page.evaluate(() => window.badgeHydration.snapshot()), {
    mounts: 4,
    unmounts: 2,
    roots: [true, true],
  });
  checks.push('unmount/remount owns one fresh instance per root');
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ checks: checks.length, errors }));
} finally {
  writeFileSync(
    process.env.BADGE_HYDRATION_EVIDENCE ?? '/tmp/apollo-badge-hydration.json',
    JSON.stringify({ checks, errors }, null, 2),
  );
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
