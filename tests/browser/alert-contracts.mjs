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
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-alert-contracts-'));
const evidencePath = process.env.ALERT_EVIDENCE ?? '/tmp/apollo-alert-browser.json';
const source = process.env.ALERT_SOURCE !== '0';
const stylesheets = [];
const publishedSources = [];
const alias = source
  ? [
      {
        find: /^@apollo-design\/ui$/,
        replacement: path.join(repository, 'packages/ui/src/index.ts'),
      },
      {
        find: /^@apollo-design\/theme$/,
        replacement: path.join(repository, 'packages/theme/src/index.ts'),
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
  const component = await ssr.ssrLoadModule('/tests/browser/fixtures/AlertContracts.vue');
  const ssrHTML = await renderToString(createSSRApp(component.default));
  await ssr.close();
  ssr = undefined;
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    define: { __ALERT_SOURCE__: JSON.stringify(source) },
    plugins: [
      vue(),
      {
        name: 'alert-published-boundary',
        transform(_code, id) {
          if (id.endsWith('.css')) stylesheets.push(path.relative(repository, id));
        },
        generateBundle(_options, bundle) {
          if (source) return;
          for (const output of Object.values(bundle)) {
            if (output.type !== 'chunk') continue;
            for (const id of Object.keys(output.modules)) {
              if (/\/packages\/[^/]+\/src\//.test(id))
                publishedSources.push(path.relative(repository, id));
            }
          }
          assert.deepEqual(publishedSources, [], 'published mode must contain no package source');
          assert.ok(stylesheets.includes('packages/ui/dist/index.css'));
          assert.ok(stylesheets.includes('packages/theme/dist/tokens.css'));
        },
      },
      {
        name: 'alert-ssr-fixture',
        transformIndexHtml(html) {
          return html.replace('<!--ALERT_SSR-->', ssrHTML);
        },
      },
    ],
    resolve: { alias },
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'AlertContracts.html') },
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
    if (message.text().includes('[apollo: Alert]') && message.text().includes('is deprecated'))
      legacyWarnings.push(message.text());
    else if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}AlertContracts.html`);
  await page.waitForFunction(() => Boolean(window.alertAudit));
  const set = (patch) => page.evaluate((patch) => window.alertAudit.set(patch), patch);
  const snapshot = () => page.evaluate(() => window.alertAudit.snapshot());
  const host = page.locator('#alert-main');
  const css = (selector, field) =>
    page
      .locator(selector)
      .first()
      .evaluate((node, field) => getComputedStyle(node).getPropertyValue(field).trim(), field);
  const rootNode = await host.elementHandle();
  const draft = page.locator('#alert-draft'),
    draftNode = await draft.elementHandle();
  assert.equal(await page.locator('style[data-alert-source-css]').count(), source ? 1 : 0);
  await check('server hydration retains the root/editor and typed static boundary', async () => {
    const current = await snapshot();
    assert.equal(current.serverRootSame, true);
    assert.equal(current.serverDraftSame, true);
    assert.equal(current.nativeTag, 'DIV');
    assert.equal(current.staticBoundary, true);
  });
  await check('native Tab reaches root, editor and both actions with visible focus', async () => {
    await page.locator('#before-alert').focus();
    await page.keyboard.press('Tab');
    assert.equal(await host.evaluate((n) => n === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(await draft.evaluate((n) => n === document.activeElement), true);
    await page.keyboard.press('Tab');
    assert.equal(
      await page
        .getByRole('button', { name: 'Save', exact: true })
        .evaluate((n) => n === document.activeElement),
      true,
    );
    await page.keyboard.press('Tab');
    assert.equal(
      await page
        .getByRole('button', { name: 'More', exact: true })
        .evaluate((n) => n === document.activeElement),
      true,
    );
  });
  await check(
    'current Provider fields and native attrs preserve editor value/focus/selection',
    async () => {
      await draft.fill('Saved business draft');
      await draft.focus();
      await draft.evaluate((n) => n.setSelectionRange(2, 7));
      await set({ provider: 'second', listener: 'second' });
      assert.match(await host.getAttribute('class'), /provider-second.*updated/);
      assert.equal(await css('#alert-main .apollo-alert-title', 'font-weight'), '700');
      assert.equal(await host.locator('.apollo-alert-icon').innerText(), 'Current');
      assert.equal(
        await host.locator('.apollo-alert-close-icon').getAttribute('data-close-owner'),
        'second',
      );
      assert.equal(await draft.evaluate((n, old) => n === old, draftNode), true);
      assert.equal(await draft.inputValue(), 'Saved business draft');
      assert.deepEqual(
        await draft.evaluate((n) => ({
          focused: n === document.activeElement,
          start: n.selectionStart,
          end: n.selectionEnd,
        })),
        { focused: true, start: 2, end: 7 },
      );
    },
  );
  await check(
    'native change/once uses actual DOM events and listener replacement/removal',
    async () => {
      await draft.dispatchEvent('change');
      await draft.dispatchEvent('change');
      const first = await snapshot();
      assert.equal(first.nativeOnce, 1);
      assert.equal(first.events.filter((e) => e.name === 'native-second').length, 2);
      assert.ok(
        first.events
          .filter((e) => e.name === 'native-second')
          .every((e) => e.native && e.type === 'change' && e.target === 'alert-draft'),
      );
      await set({ listener: 'none' });
      await draft.dispatchEvent('change');
      assert.equal((await snapshot()).events.length, first.events.length);
    },
  );
  await check(
    'conditional close slots are complete and empty slots have named native controls',
    async () => {
      await set({ closeSlot: 'rich' });
      assert.equal(await host.locator('.apollo-alert-close-icon').innerText(), 'Dismiss now');
      await set({ closeSlot: 'empty' });
      assert.equal(await host.locator('.apollo-alert-close-icon').innerText(), '');
      assert.equal(
        await host.locator('.apollo-alert-close-icon').getAttribute('aria-label'),
        'Close',
      );
      assert.ok((await host.locator('.apollo-alert-close-icon').boundingBox()).width >= 12);
      await set({ closeSlot: 'absent' });
      assert.equal(await host.locator('.apollo-icon-close').count(), 1);
    },
  );
  await check(
    'empty content removes all hosts; removing slots restores declared fallback',
    async () => {
      await set({ slot: 'empty' });
      assert.equal(
        await host
          .locator('.apollo-alert-title,.apollo-alert-description,.apollo-alert-actions')
          .count(),
        0,
      );
      assert.doesNotMatch(await host.getAttribute('class'), /with-description/);
      await set({ slot: 'absent' });
      assert.match(await host.innerText(), /Fallback title/);
      assert.match(await host.innerText(), /Fallback description/);
      await set({ slot: 'rich' });
      assert.equal(await host.locator('.apollo-alert-actions button').count(), 2);
    },
  );
  await check(
    'all four component tokens affect real geometry and native override wins',
    async () => {
      await set({ tokens: true, nativeToken: true });
      assert.equal(await css('#alert-main', 'border-radius'), '23px');
      assert.equal(await css('#alert-main', 'padding'), '11px 17px');
      assert.equal(await css('#alert-main .apollo-alert-icon', 'font-size'), '37px');
      assert.equal(
        await host.evaluate((n) => n.style.getPropertyValue('--apollo-alert-default-padding')),
        '7px 13px',
      );
      await set({ slot: 'empty', nativeToken: false });
      assert.equal(await css('#alert-main', 'padding'), '7px 13px');
      assert.equal(await css('#alert-main', 'border-radius'), '19px');
      await set({ tokens: false, slot: 'rich' });
    },
  );
  await check('current alias values reach the alert background and border', async () => {
    await set({ alias: true, provider: 'first' });
    assert.equal(await css('#alert-main', 'background-color'), 'rgb(18, 52, 86)');
    assert.equal(await css('#alert-main', 'border-top-color'), 'rgb(101, 67, 33)');
    await set({ alias: false, provider: 'second' });
  });
  await check('null Provider icon keeps its default fallback decorative and current', async () => {
    const icon = host.locator('.apollo-alert-icon');
    await set({ iconFallback: true });
    assert.equal(await icon.getAttribute('aria-hidden'), 'true');
    assert.equal(await icon.locator('svg').count(), 1);
    await set({ iconFallback: false });
    assert.equal(await icon.innerText(), 'Current');
    assert.equal(await icon.getAttribute('aria-hidden'), null);
  });
  const themeActual = [];
  for (const theme of ['default', 'dark', 'compact', 'both'])
    await check(`current ${theme} source scope and actual accessible content`, async () => {
      await set({ theme });
      const size = await css('#alert-main', 'font-size');
      assert.equal(size, theme === 'compact' || theme === 'both' ? '12px' : '14px');
      themeActual.push({
        theme,
        padding: await css('#alert-main', 'padding'),
        background: await css('#alert-main', 'background-color'),
        size,
      });
      assert.ok((await host.boundingBox()).height > 0);
      assert.equal(await page.locator('#alert-sibling .apollo-alert-close-icon').count(), 0);
    });
  await check('prefix/direction update on the same root with preloaded custom CSS', async () => {
    await set({ prefix: 'audit', rtl: true });
    assert.match(await host.getAttribute('class'), /audit-alert-rtl/);
    assert.equal(await css('#alert-main', 'direction'), 'rtl');
    assert.equal(await host.evaluate((n, old) => n === old, rootNode), true);
    assert.ok((await host.boundingBox()).height > 0);
    await set({ prefix: 'apollo', rtl: false, theme: 'default' });
  });
  await check(
    'CSS-only dark/compact survives an unconfigured Provider and theme removal',
    async () => {
      const target = '#alert-css-source';
      const original = await page.locator(target).elementHandle();
      assert.equal(await css(target, 'font-size'), '12px');
      const background = await css(target, 'background-color');
      assert.equal(
        await page.locator(target).evaluate((n) => n.style.getPropertyValue('--apollo-font-size')),
        '',
      );
      await set({ cssTheme: true });
      assert.equal(await css(target, 'font-size'), '20px');
      assert.equal(await css(target, 'background-color'), 'rgb(217, 237, 255)');
      await set({ cssTheme: false });
      assert.equal(await css(target, 'font-size'), '12px');
      assert.equal(await css(target, 'background-color'), background);
      assert.equal(await page.locator(target).evaluate((n, old) => n === old, original), true);
      assert.equal(
        await page.locator(target).evaluate((n) => n.style.getPropertyValue('--apollo-font-size')),
        '',
      );
    },
  );
  await check(
    'nearest explicit empty ThemeProvider restores defaults and preserves the native editor',
    async () => {
      const target = '#alert-reset-source';
      assert.equal(await css(target, 'font-size'), '18px');
      assert.equal(await css(target, 'border-radius'), '19px');
      const editor = page.locator('#alert-source-draft'),
        original = await editor.elementHandle();
      await editor.fill('Kept source draft');
      await editor.focus();
      await editor.evaluate((n) => n.setSelectionRange(2, 5));
      await set({ resetTheme: false });
      assert.equal(await css(target, 'font-size'), '14px');
      assert.equal(await css(target, 'border-radius'), '8px');
      assert.equal(await editor.evaluate((n, old) => n === old, original), true);
      assert.equal(await editor.inputValue(), 'Kept source draft');
      assert.deepEqual(
        await editor.evaluate((n) => ({
          focused: n === document.activeElement,
          start: n.selectionStart,
          end: n.selectionEnd,
        })),
        { focused: true, start: 2, end: 5 },
      );
    },
  );
  const remount = async (patch = {}) => {
    await set({ mounted: false });
    await set({ prefix: 'apollo', rtl: false, ...patch, mounted: true });
  };
  for (const key of ['Enter', 'Space'])
    await check(
      `native ${key} emits request and completion once under real reduced motion`,
      async () => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await remount({ motion: true });
        const before = (await snapshot()).events.length;
        const button = host.locator('.apollo-alert-close-icon');
        await button.focus();
        assert.notEqual(await button.evaluate((n) => getComputedStyle(n).outlineStyle), 'none');
        await page.keyboard.press(key);
        await host.waitFor({ state: 'detached' });
        const actual = (await snapshot()).events.slice(before);
        assert.equal(
          actual.filter((e) => e.name === 'close' && e.native && e.type === 'click').length,
          1,
        );
        assert.equal(actual.filter((e) => e.name === 'config-second').length, 1);
        assert.equal(actual.filter((e) => e.name === 'after-close' && e.removed).length, 1);
        assert.equal(actual.filter((e) => e.name === 'config-after-second').length, 1);
        assert.equal((await snapshot()).nativeTag, null);
      },
    );
  await check(
    'normal CSS close starts with a pixel height and finishes by real transition',
    async () => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await remount({ motion: true });
      const before = (await snapshot()).events.length;
      await host.evaluate((node) => {
        const trace = { heights: [], ends: [] };
        window.alertCloseMotion = trace;
        const observer = new MutationObserver(() => {
          trace.heights.push(node.style.maxHeight);
          if (!node.isConnected) observer.disconnect();
        });
        observer.observe(node, { attributes: true, attributeFilter: ['style', 'class'] });
        node.addEventListener('transitionend', (event) => {
          if (event.target === node)
            trace.ends.push({
              property: event.propertyName,
              elapsed: event.elapsedTime,
              native: event instanceof TransitionEvent,
            });
        });
        node.addEventListener('transitionend', () => observer.disconnect(), { once: true });
      });
      await host.locator('.apollo-alert-close-icon').click();
      await host.waitFor({ state: 'detached' });
      const motion = await page.evaluate(() => window.alertCloseMotion);
      assert.ok(
        motion.heights.some(
          (value) => /^\d+(?:\.\d+)?px$/.test(value) && Number.parseFloat(value) > 0,
        ),
        JSON.stringify(motion),
      );
      assert.ok(
        motion.ends.some((event) => event.native && event.elapsed > 0),
        JSON.stringify(motion),
      );
      assert.equal(
        (await snapshot()).events.slice(before).filter((e) => e.name === 'after-close' && e.removed)
          .length,
        1,
      );
      return motion;
    },
  );
  await check(
    'motion=false completes with no transition event and unmount cancels pending completion',
    async () => {
      await remount({ motion: false });
      let before = (await snapshot()).events.length;
      await host.locator('.apollo-alert-close-icon').click();
      await host.waitFor({ state: 'detached' });
      assert.equal(
        (await snapshot()).events.slice(before).filter((e) => e.name === 'after-close').length,
        1,
      );
      await remount({ motion: true });
      before = (await snapshot()).events.length;
      await host.locator('.apollo-alert-close-icon').click();
      await set({ mounted: false });
      await page.waitForTimeout(500);
      assert.equal(
        (await snapshot()).events.slice(before).filter((e) => e.name === 'after-close').length,
        0,
      );
    },
  );
  await check('descendant event errors use native Vue capture and fallback attrs', async () => {
    await page.locator('#boundary-event').click();
    await page.locator('#alert-boundary').waitFor();
    assert.match(await page.locator('#alert-boundary').innerText(), /Descendant event failed/);
    assert.equal(
      await page.locator('#alert-boundary').getAttribute('aria-label'),
      'Failure details',
    );
    assert.equal(await page.locator('#alert-boundary').getAttribute('tabindex'), '0');
  });
  for (const errorKind of ['zero', 'false', 'null', 'undefined', 'error'])
    await check(`captures render throw ${errorKind}`, async () => {
      await set({ failed: false, boundaryKey: Date.now() });
      await set({ errorKind, failed: true });
      assert.equal(
        await page.locator('#alert-boundary .apollo-alert-title').innerText(),
        errorKind === 'zero'
          ? '0'
          : errorKind === 'error'
            ? 'Error: Descendant render failed'
            : errorKind,
      );
    });
  await check(
    'narrow error details are keyboard reachable and natively horizontally scrollable',
    async () => {
      await page.setViewportSize({ width: 375, height: 1000 });
      const pre = page.locator('#alert-boundary pre');
      assert.equal(await pre.getAttribute('tabindex'), '0');
      assert.equal(await pre.getAttribute('aria-label'), 'Error details');
      await page.locator('#before-alert').focus();
      for (let i = 0; i < 6 && !(await pre.evaluate((n) => n === document.activeElement)); i++)
        await page.keyboard.press('Tab');
      assert.equal(await pre.evaluate((n) => n === document.activeElement), true);
      assert.notEqual(await pre.evaluate((n) => getComputedStyle(n).outlineStyle), 'none');
      if (await pre.evaluate((n) => n.scrollWidth > n.clientWidth)) {
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(
          () => document.querySelector('#alert-boundary pre').scrollLeft > 0,
        );
      }
      await page.setViewportSize({ width: 1200, height: 1000 });
    },
  );
  await remount({ motion: false });
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  await check('real final content passes axe without changing rules', async () => {
    const violations = await page.evaluate(async () =>
      (await window.axe.run(document.querySelector('#alert-fixture'))).violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ html: n.html, summary: n.failureSummary })),
      })),
    );
    assert.deepEqual(violations, []);
  });
  await page.screenshot({ path: '/tmp/apollo-alert-browser.png', fullPage: true });
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
    themeActual,
    finalState: await snapshot(),
    passed: results.every((result) => result.passed),
  };
  writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
  assert.equal(evidence.passed, true, `Alert contract failures; see ${evidencePath}`);
} finally {
  await browser?.close();
  await ssr?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
