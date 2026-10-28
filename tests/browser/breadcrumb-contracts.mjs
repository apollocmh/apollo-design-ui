/** Current source or published Breadcrumb contracts; all bundles and evidence stay outside dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, createServer, preview } from 'vite';
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { launchBrowser } from '../visual/stabilize.mjs';
import {
  assertBreadcrumbStyleMode,
  breadcrumbAliases,
  breadcrumbStyleMode,
} from './breadcrumb-style-mode.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = path.join(repo, 'tests/browser/fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-breadcrumb-contracts-'));
const source = process.env.BREADCRUMB_SOURCE === '1';
const alias = breadcrumbAliases(repo, source);
const styleMode = breadcrumbStyleMode(source);
const errors = [],
  results = [];
let server, browser, ssr;
const check = async (name, run) => {
  try {
    results.push({ name, passed: true, actual: await run() });
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
  }
};
try {
  const config = {
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), styleMode.plugin],
    resolve: { alias },
    optimizeDeps: { entries: ['BreadcrumbContracts.html'] },
  };
  await build({
    ...config,
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'BreadcrumbContracts.html') },
    },
  });
  server = await preview({ ...config, build: { outDir }, preview: { host: '127.0.0.1', port: 0 } });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  const origin = server.resolvedUrls.local[0];
  await page.goto(`${origin}BreadcrumbContracts.html`);
  await page.waitForFunction(() => Boolean(window.breadcrumbAudit));
  const set = async (patch) => {
    await page.evaluate((value) => {
      window.breadcrumbAudit.set(value);
    }, patch);
    await page.evaluate(() => new Promise(requestAnimationFrame));
    await page.evaluate(async () => {
      await Promise.all(
        document
          .getAnimations()
          .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
          .map((animation) => animation.finished.catch(() => undefined)),
      );
    });
  };
  const nav = page.getByRole('navigation', { name: 'Contract routes', exact: true });
  const trigger = nav.getByRole('button', { name: 'Open breadcrumb menu' });
  await check(
    'current params, complete content, semantic props and explicit empty data',
    async () => {
      assert.equal(await nav.locator('strong').textContent(), 'Products ');
      assert.equal(await nav.locator('a').nth(1).getAttribute('href'), '#/0/0');
      await set({ id: 42 });
      assert.equal(await nav.locator('a').nth(1).getAttribute('href'), '#/42/42');
      assert.ok((await nav.getAttribute('class')).includes('route-42'));
      assert.equal(
        await page
          .getByRole('navigation', { name: 'Empty data', exact: true })
          .locator('li')
          .count(),
        0,
      );
    },
  );
  await check(
    'native attrs, keyed input identity, focus and provider appearance/removal',
    async () => {
      const input = page.getByRole('textbox', { name: 'Crumb a', exact: true });
      const handle = await input.elementHandle();
      await input.fill('business draft');
      await input.focus();
      for (const mode of ['dark', 'compact', 'both', 'default']) {
        await set({ mode, reverse: mode !== 'default' });
        assert.equal(await input.evaluate((node, previous) => node === previous, handle), true);
        assert.equal(await input.inputValue(), 'business draft');
        assert.equal(await input.evaluate((node) => node === document.activeElement), true);
      }
      assert.equal(await page.locator('li#native-a').getAttribute('aria-label'), 'Native a');
      assert.equal(await page.locator('li#native-a').getAttribute('data-owner'), 'a');
    },
  );
  await check(
    'conditional/empty/restored separator and dropdown icon slots preserve controls',
    async () => {
      const handle = await trigger.elementHandle();
      await set({ icon: true, separator: true });
      assert.equal(await nav.locator('[data-custom-icon]').count(), 1);
      assert.equal(await nav.locator('[data-custom-separator]').count(), 2);
      await set({ emptyIcon: true, emptySeparator: true });
      assert.equal(await nav.locator('[data-custom-icon]').count(), 0);
      assert.equal(await nav.locator('.apollo-breadcrumb-separator').count(), 0);
      assert.equal(await trigger.evaluate((node, previous) => node === previous, handle), true);
      await set({ icon: false, separator: false });
      assert.equal(await nav.locator('.apollo-breadcrumb-separator').count(), 2);
    },
  );
  await check(
    'independent navigation link and native keyboard menu, Escape focus return',
    async () => {
      assert.equal(await trigger.locator('a,input').count(), 0);
      await trigger.focus();
      await trigger.press('ArrowDown');
      const menu = page.getByRole('menu').filter({ hasText: 'Relative destination' });
      await menu.waitFor({ state: 'visible' });
      assert.equal(await trigger.getAttribute('aria-expanded'), 'true');
      await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'menuitem');
      assert.equal(
        await menu.getByRole('link', { name: 'Relative destination' }).getAttribute('href'),
        '#/42/42/child',
      );
      assert.equal(
        await menu.getByRole('link', { name: 'Explicit destination' }).getAttribute('href'),
        '#explicit',
      );
      assert.equal(
        await menu
          .getByRole('menuitem', { name: 'Disabled destination' })
          .getAttribute('aria-disabled'),
        'true',
      );
      await page.keyboard.press('Escape');
      await menu.waitFor({ state: 'hidden' });
      assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
    },
  );
  await check('controlled refusal/acceptance and ownership of focus', async () => {
    await set({ controlled: true, open: true, accept: false });
    const item = page.getByRole('menuitem', { name: 'Relative destination' });
    await item.waitFor({ state: 'visible' });
    await item.focus();
    await page.keyboard.press('Escape');
    assert.equal(await item.isVisible(), true);
    assert.equal(await item.evaluate((node) => node === document.activeElement), true);
    await set({ accept: true });
    await page.keyboard.press('Escape');
    await item.waitFor({ state: 'hidden' });
    assert.equal(await trigger.evaluate((node) => node === document.activeElement), true);
    await set({ open: true });
    await page.locator('#outside').focus();
    await set({ open: false, controlled: false });
    assert.equal(
      await page.locator('#outside').evaluate((node) => node === document.activeElement),
      true,
    );
  });
  await check(
    'menu selection emits one close request and multiple instances remain independent',
    async () => {
      await trigger.click();
      const item = page.getByRole('menuitem', { name: 'Explicit destination' });
      await item.waitFor({ state: 'visible' });
      await item.click();
      await item.waitFor({ state: 'hidden' });
      const closed = await page.evaluate(() =>
        window.breadcrumbAudit.events.filter((event) => event.source === 'menu'),
      );
      assert.equal(closed.length, 1);
      const other = page.getByRole('navigation', { name: 'Second menu' }).getByRole('button');
      await other.click();
      await page.getByRole('menuitem', { name: 'Other destination' }).waitFor({ state: 'visible' });
      assert.equal(await trigger.getAttribute('aria-expanded'), 'false');
      await page.keyboard.press('Escape');
    },
  );
  await check('keyboard menu destination activation follows its href once', async () => {
    await trigger.focus();
    await trigger.press('ArrowDown');
    const destination = page.getByRole('menuitem', { name: 'Relative destination' });
    await destination.waitFor({ state: 'visible' });
    await destination.focus();
    await destination.press('Enter');
    await page.waitForURL(`${origin}BreadcrumbContracts.html#/42/42/child`);
    assert.equal(page.url(), `${origin}BreadcrumbContracts.html#/42/42/child`);
    await destination.waitFor({ state: 'hidden' });
    return { url: page.url() };
  });
  await check(
    'all seven custom tokens and nested theme have actual computed consumers',
    async () => {
      await set({ customTokens: true });
      const actual = await nav.evaluate((node) => {
        const style = (selector) => getComputedStyle(node.querySelector(selector));
        return {
          color: getComputedStyle(node).color,
          lastColor: style('li:last-child').color,
          linkColor: style('a').color,
          separatorColor: style('.apollo-breadcrumb-separator').color,
          separatorMargin: style('.apollo-breadcrumb-separator').marginInlineStart,
          iconFontSize: style('[data-title-icon]').fontSize,
        };
      });
      assert.deepEqual(actual, {
        color: 'rgb(22, 76, 126)',
        lastColor: 'rgb(135, 56, 0)',
        linkColor: 'rgb(7, 86, 33)',
        separatorColor: 'rgb(117, 69, 0)',
        separatorMargin: '17px',
        iconFontSize: '23px',
      });
      await nav.locator('a').first().hover();
      await page.waitForFunction(
        () =>
          getComputedStyle(document.querySelector('[data-routes] a')).color === 'rgb(97, 16, 140)',
      );
      assert.equal(
        await page
          .locator('[data-nested] .apollo-breadcrumb-separator')
          .evaluate((node) => getComputedStyle(node).marginInlineStart),
        '3px',
      );
      await set({ customTokens: false });
      return actual;
    },
  );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await check(`${mode}: real browser axe and text contrast`, async () => {
      await set({ mode });
      const violations = await page.evaluate(async () =>
        (
          await window.axe.run(document.querySelector('main'), {
            runOnly: {
              type: 'tag',
              values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
            },
          })
        ).violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })),
      );
      assert.deepEqual(violations, []);
    });
  }
  await check('dynamic owner prefix and unmount/remount cleanup', async () => {
    await set({ prefix: 'custom' });
    assert.equal(await nav.locator('.custom-item').count(), 3);
    assert.equal(await nav.locator('.custom-separator').count(), 2);
    assert.equal(await page.locator('[data-native] .custom-item').count(), 3);
    await set({ mounted: false });
    assert.equal(await page.getByRole('menu').count(), 0);
    await set({ mounted: true, prefix: undefined, mode: 'default' });
    assert.equal(await trigger.count(), 1);
  });
  await check('SSR hydration preserves DOM and current theme updates', async () => {
    ssr = await createServer({ ...config, server: { middlewareMode: true }, appType: 'custom' });
    const { Audit } = await ssr.ssrLoadModule(path.join(root, 'BreadcrumbContracts.ts'));
    const html = await renderToString(createSSRApp(Audit));
    assert.ok(html.includes('<strong>Products </strong>'));
    const entry = readFileSync(path.join(outDir, 'BreadcrumbContracts.html'), 'utf8');
    await page.route('**/BreadcrumbContracts.html?hydrate', (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: entry.replace('<div id="app"></div>', `<div id="app">${html}</div>`),
      }),
    );
    await page.goto(`${origin}BreadcrumbContracts.html?hydrate`);
    await page.waitForFunction(() => Boolean(window.breadcrumbAudit));
    const input = page.getByRole('textbox', { name: 'Crumb a' });
    const handle = await input.elementHandle();
    await input.fill('hydrated draft');
    await set({ mode: 'dark', id: 9 });
    assert.equal(await input.evaluate((node, previous) => node === previous, handle), true);
    assert.equal(await input.inputValue(), 'hydrated draft');
    assert.equal(await nav.locator('a').nth(1).getAttribute('href'), '#/9/9');
  });
  await assertBreadcrumbStyleMode(page, source);
  const evidence = {
    source,
    styles: styleMode.evidence,
    browser: await browser.version(),
    results,
    errors,
  };
  writeFileSync(
    process.env.BREADCRUMB_EVIDENCE ?? '/tmp/apollo-breadcrumb-browser.json',
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  for (const result of results)
    console.log(
      `${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`,
    );
  assert.deepEqual(errors, [], JSON.stringify(errors));
  assert.ok(
    results.every((result) => result.passed),
    'Breadcrumb browser contract failures',
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  await ssr?.close();
  rmSync(outDir, { recursive: true, force: true });
}
