import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, createServer, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const repository = path.resolve(root, '../../..');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-timeline-contracts-'));
const evidencePath = process.env.TIMELINE_EVIDENCE ?? '/tmp/apollo-timeline-browser.json';
const source = process.env.TIMELINE_SOURCE !== '0';
const stylesheets = [];
const publishedSources = [];
const alias = source
  ? [
      {
        find: /^@apollo-design\/ui$/,
        replacement: path.join(repository, 'packages/ui/src/index.ts'),
      },
    ]
  : [];
const results = [],
  errors = [],
  legacyWarnings = [];
let server, browser, ssr;
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
};
try {
  ssr = await createServer({
    root: repository,
    configFile: false,
    logLevel: 'silent',
    plugins: [vue()],
    resolve: { alias },
    server: { middlewareMode: true },
    appType: 'custom',
  });
  const component = await ssr.ssrLoadModule('/tests/browser/fixtures/TimelineContracts.vue');
  const ssrHTML = await renderToString(createSSRApp(component.default));
  await ssr.close();
  ssr = undefined;
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    define: { __TIMELINE_SOURCE__: JSON.stringify(source) },
    plugins: [
      vue(),
      {
        name: 'timeline-published-boundary',
        transform(_code, id) {
          if (id.endsWith('.css')) stylesheets.push(path.relative(repository, id));
        },
        generateBundle(_options, bundle) {
          if (source) return;
          for (const output of Object.values(bundle)) {
            if (output.type !== 'chunk') continue;
            for (const id of Object.keys(output.modules)) {
              if (id.includes('/packages/ui/src/'))
                publishedSources.push(path.relative(repository, id));
            }
          }
          assert.deepEqual(publishedSources, [], 'published mode must contain no UI source');
          assert.ok(stylesheets.includes('packages/ui/dist/index.css'));
          assert.ok(stylesheets.includes('packages/theme/dist/tokens.css'));
        },
      },
      {
        name: 'timeline-ssr-fixture',
        transformIndexHtml(html) {
          return html.replace('<!--TIMELINE_SSR-->', ssrHTML);
        },
      },
    ],
    resolve: { alias },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'TimelineContracts.html') },
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
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.text().includes('[apollo: Timeline]') && message.text().includes('is deprecated'))
      legacyWarnings.push(message.text());
    else if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}TimelineContracts.html`);
  await page.waitForFunction(() => Boolean(window.timelineAudit));
  await page.addStyleTag({
    content: '*,*::before,*::after{transition:none !important;animation:none !important;}',
  });
  const set = (patch) => page.evaluate((patch) => window.timelineAudit.set(patch), patch);
  const snapshot = () => page.evaluate(() => window.timelineAudit.snapshot());
  const host = page.locator('#timeline-audit');
  assert.equal(await page.locator('style[data-timeline-source-css]').count(), source ? 1 : 0);
  const css = (selector, field) =>
    page
      .locator(selector)
      .first()
      .evaluate((node, field) => getComputedStyle(node).getPropertyValue(field).trim(), field);
  const rootNode = await host.elementHandle();
  const input = page.locator('[data-owner="0"]');
  const inputNode = await input.elementHandle();
  await check('SSR hydration preserves the server root and exposes the native ol', async () => {
    assert.equal(
      await page.evaluate(
        () => window.timelineSSRRoot === document.querySelector('#timeline-audit'),
      ),
      true,
    );
    assert.equal((await snapshot()).nativeTag, 'OL');
    assert.equal((await snapshot()).installation, 'ATimeline');
    assert.equal((await snapshot()).hasLegacyItem, false);
  });
  await check('legacy item sides normalize to current CSS placements', async () => {
    assert.match(await host.locator('li').nth(0).getAttribute('class'), /placement-start/);
    assert.match(await host.locator('li').nth(1).getAttribute('class'), /placement-end/);
    assert.equal(
      await host.locator('[class*="placement-left"],[class*="placement-right"]').count(),
      0,
    );
  });
  await check(
    'native keyboard order reaches the input without adding list-item tab stops',
    async () => {
      await page.keyboard.press('Tab');
      assert.equal(await input.evaluate((node) => document.activeElement === node), true);
      await page.keyboard.press('Tab');
      assert.equal(
        await page
          .locator('[data-owner="apollo-timeline-pending"]')
          .evaluate((node) => document.activeElement === node),
        true,
      );
      await page.keyboard.press('Shift+Tab');
      assert.equal(await input.evaluate((node) => document.activeElement === node), true);
    },
  );
  await check('native change listener replacement/removal/once and passive li', async () => {
    await input.dispatchEvent('change');
    await input.dispatchEvent('change');
    await set({ listener: 'second' });
    await input.dispatchEvent('change');
    await set({ listener: 'none' });
    await input.dispatchEvent('change');
    const data = await snapshot();
    assert.deepEqual(
      data.events.map((event) => event.listener),
      ['first', 'first', 'second'],
    );
    assert.equal(
      data.events.every(
        (event) => event.domEvent && event.type === 'change' && event.target === '0',
      ),
      true,
    );
    assert.equal(data.once, 1);
    assert.equal(await host.locator('li[role="button"],li[tabindex]').count(), 0);
  });
  await check(
    'same-key data, layout, Provider, pending and reverse preserve value, focus and root',
    async () => {
      await input.fill('kept focused note');
      await input.focus();
      for (const patch of [
        { updated: true },
        { reverse: true },
        { orientation: 'horizontal' },
        { rtl: true },
        { pending: 'zero' },
        { pending: 'text' },
        { pending: 'off' },
        { theme: 'dark' },
        { theme: 'compact' },
      ]) {
        await set(patch);
        assert.equal(
          await input.evaluate((current, previous) => current === previous, inputNode),
          true,
        );
        assert.equal(await input.inputValue(), 'kept focused note');
        assert.equal(await input.evaluate((node) => document.activeElement === node), true);
        assert.equal(
          await host.evaluate((current, previous) => current === previous, rootNode),
          true,
        );
      }
      assert.deepEqual(await host.locator('strong').allTextContents(), [
        'Complete record! · 0',
        'Review record! · 1',
        'Create record! · 2',
      ]);
    },
  );
  await check(
    'explicit horizontal orientation stays horizontal below the Steps breakpoint',
    async () => {
      await page.setViewportSize({ width: 375, height: 900 });
      await set({ orientation: 'horizontal' });
      await page.waitForTimeout(80);
      assert.match(await host.getAttribute('class'), /apollo-steps-horizontal/);
      assert.doesNotMatch(await host.getAttribute('class'), /apollo-steps-vertical/);
      assert.equal(await css('#timeline-audit', 'flex-direction'), 'row');
      await set({ orientation: 'vertical' });
      assert.match(await host.getAttribute('class'), /apollo-steps-vertical/);
      await page.setViewportSize({ width: 1200, height: 1000 });
    },
  );
  for (const theme of ['default', 'dark', 'compact', 'both']) {
    await check(
      `${theme}: six actual CSS tokens update, accept zero, reject invalid sizes, and restore`,
      async () => {
        await set({
          theme,
          tokens: 'default',
          slotMode: 'absent',
          mode: 'start',
          reverse: false,
          orientation: 'vertical',
          rtl: false,
        });
        const basePadding = await css('#timeline-audit li', 'padding-bottom');
        await set({ tokens: 'custom' });
        assert.equal(await css('#timeline-audit li', 'padding-bottom'), '31px');
        assert.equal(await css('#timeline-audit .apollo-timeline-item-icon', 'width'), '18px');
        assert.equal(
          await css('#timeline-audit .apollo-timeline-item-icon', 'background-color'),
          'rgb(171, 205, 239)',
        );
        assert.equal(
          await css('#timeline-audit .apollo-timeline-item-icon', 'border-top-width'),
          '3px',
        );
        assert.equal(
          await css('#timeline-audit .apollo-timeline-item-rail', 'border-left-width'),
          '7px',
        );
        assert.equal(
          await css('#timeline-audit .apollo-timeline-item-rail', 'border-left-color'),
          'rgb(18, 52, 86)',
        );
        await set({ noTitles: true });
        assert.equal(await css('#timeline-audit li', 'padding-bottom'), '31px');
        await set({ noTitles: false });
        assert.equal(await css('#timeline-nested .apollo-timeline-item-icon', 'width'), '22px');
        assert.equal(await css('#timeline-sibling .apollo-timeline-item-icon', 'width'), '10px');
        await set({ tokens: 'zero' });
        assert.equal(await css('#timeline-audit li', 'padding-bottom'), '0px');
        assert.equal(await css('#timeline-audit .apollo-timeline-item-icon', 'width'), '0px');
        assert.equal(
          await css('#timeline-audit .apollo-timeline-item-icon', 'border-top-width'),
          '0px',
        );
        assert.equal(
          await css('#timeline-audit .apollo-timeline-item-rail', 'border-left-width'),
          '0px',
        );
        await set({ tokens: 'invalid' });
        assert.equal(await css('#timeline-audit li', 'padding-bottom'), basePadding);
        assert.notEqual(await css('#timeline-audit .apollo-timeline-item-icon', 'width'), '0px');
        await set({ tokens: 'default' });
        assert.equal(await css('#timeline-audit li', 'padding-bottom'), basePadding);
      },
    );
  }
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const theme of ['default', 'dark', 'compact', 'both']) {
    await check(`${theme}: real-browser axe and native list semantics`, async () => {
      await set({ theme, tokens: 'default' });
      const violations = await page.evaluate(async () =>
        (
          await window.axe.run('#timeline-audit', {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
            },
          })
        ).violations.map((violation) => ({
          id: violation.id,
          nodes: violation.nodes.map((node) => node.target),
        })),
      );
      assert.deepEqual(violations, []);
      assert.equal(await host.getAttribute('role'), null);
      assert.equal(await host.locator(':scope > li').count(), 3);
    });
  }
  await check(
    'conditional empty slots override loading/data and removing them restores scalar icons',
    async () => {
      await set({ scalarIcons: true, slotMode: 'empty' });
      assert.equal(await host.innerText(), '');
      assert.equal(await host.locator('.apollo-icon-spin').count(), 0);
      assert.doesNotMatch(await host.getAttribute('class'), /timeline-layout-alternate/);
      await set({ slotMode: 'absent' });
      assert.deepEqual(await host.locator('.apollo-timeline-item-icon').allTextContents(), [
        '0',
        '',
        '',
      ]);
      assert.equal(await host.locator('.apollo-icon-spin').count(), 0);
      assert.match(await host.innerText(), /Create record!/);
      await set({ slotMode: 'rich', scalarIcons: false });
      assert.equal(await host.locator('input').count(), 3);
    },
  );
  await check(
    'unmount clears the native ref and remount produces a fresh independent root',
    async () => {
      await set({ mounted: false });
      assert.equal((await snapshot()).nativeTag, null);
      assert.equal(await page.locator('#timeline-audit').count(), 0);
      await set({ mounted: true });
      assert.equal((await snapshot()).nativeTag, 'OL');
      assert.equal(
        await host.evaluate((current, previous) => current === previous, rootNode),
        false,
      );
      assert.equal(await page.locator('#timeline-nested, #timeline-sibling').count(), 2);
    },
  );
  await page.screenshot({ path: '/tmp/apollo-timeline-browser.png', fullPage: true });
  await check('zero browser, Vue and hydration errors', async () => assert.deepEqual(errors, []));
  const evidence = {
    source,
    implementation: source ? 'source JS + source CSS' : 'published JS + published CSS',
    stylesheets,
    publishedSources,
    browser: await browser.version(),
    viewport: page.viewportSize(),
    results,
    errors,
    legacyWarnings,
    passed: results.every((result) => result.passed),
  };
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  assert.equal(evidence.passed, true, `Timeline contract failures; see ${evidencePath}`);
} finally {
  await browser?.close();
  await ssr?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
