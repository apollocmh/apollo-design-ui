/** The eleven original Vue demos, real theme CSS, axe and keyboard/content interactions. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';
import {
  assertBreadcrumbStyleMode,
  breadcrumbAliases,
  breadcrumbStyleMode,
} from './breadcrumb-style-mode.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const root = path.join(repo, 'tests/browser/fixtures');
const source = process.env.BREADCRUMB_SOURCE === '1';
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-breadcrumb-demos-'));
const styles = breadcrumbStyleMode(source);
const results = [],
  errors = [];
let server, browser;
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
    plugins: [vue(), styles.plugin],
    resolve: { alias: breadcrumbAliases(repo, source) },
  };
  await build({
    ...config,
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'BreadcrumbDemos.html') },
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
  await page.goto(`${origin}BreadcrumbDemos.html`);
  await page.waitForFunction(() => Boolean(window.setBreadcrumbDemo));
  await assertBreadcrumbStyleMode(page, source);
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const settle = () =>
    page.evaluate(() =>
      Promise.all(
        document
          .getAnimations()
          .filter((animation) => Number.isFinite(animation.effect?.getTiming().iterations ?? 1))
          .map((animation) => animation.finished.catch(() => {})),
      ),
    );
  const demo = async (name, mode) => {
    await page.evaluate(
      ([name, mode]) => {
        history.replaceState(null, '', location.pathname);
        return window.setBreadcrumbDemo(name, mode);
      },
      [name, mode],
    );
    await settle();
  };
  for (const name of [
    'basic',
    'component-token',
    'debug-routes',
    'native',
    'overlay',
    'scoped-item',
    'separator-component',
    'separator',
    'style-class',
    'with-icon',
    'with-params',
  ]) {
    for (const mode of ['default', 'dark', 'compact', 'both']) {
      await check(`${name}/${mode}: original demo, real CSS and axe`, async () => {
        await demo(name, mode);
        assert.ok(await page.locator('main nav ol li').count());
        assert.equal(
          await page
            .locator('main nav ol')
            .first()
            .evaluate((node) => getComputedStyle(node).display),
          'flex',
        );
        const violations = await page.locator('main').evaluate(async (node) =>
          (await window.axe.run(node)).violations.map(({ id, nodes }) => ({
            id,
            nodes: nodes.map(({ html, failureSummary }) => ({ html, failureSummary })),
          })),
        );
        assert.deepEqual(violations, []);
        assert.equal(
          await page
            .locator('main')
            .evaluate((node) => /NaN|\[object Object\]/.test(node.textContent)),
          false,
        );
      });
    }
  }
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    await check(`${mode}: scoped item empty/restore/current params and keyed drafts`, async () => {
      await demo('scoped-item', mode);
      const nav = page.getByRole('navigation', { name: 'Scoped breadcrumb' });
      const links = () =>
        nav.locator('a').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
      assert.deepEqual(await links(), ['#/apps', '#/apps/42']);
      await page.getByRole('button', { name: 'Toggle item slot', exact: true }).click();
      await page.getByRole('button', { name: 'Update route params', exact: true }).click();
      assert.deepEqual(await links(), ['#/apps', '#/apps/43']);
      assert.deepEqual(
        await nav
          .locator('[data-route-path]')
          .evaluateAll((nodes) => nodes.map((node) => node.dataset.routePath)),
        ['apps', 'apps/43'],
      );
      for (let cycle = 0; cycle < 3; cycle++) {
        await page.getByRole('button', { name: 'Toggle empty item', exact: true }).click();
        assert.equal(await nav.locator('a').count(), 0);
        await page.getByRole('button', { name: 'Toggle item slot', exact: true }).click();
        assert.deepEqual(await links(), ['#/apps', '#/apps/43']);
        await page.getByRole('button', { name: 'Toggle empty item', exact: true }).click();
        await page.getByRole('button', { name: 'Toggle item slot', exact: true }).click();
      }
      const input = page.getByRole('textbox', { name: 'Crumb a', exact: true });
      const previous = await input.elementHandle();
      await input.fill('Saved demo draft');
      await page.getByRole('button', { name: 'Reorder native crumbs', exact: true }).click();
      assert.equal(await input.inputValue(), 'Saved demo draft');
      assert.equal(await input.evaluate((node, old) => node === old, previous), true);
      assert.deepEqual(
        await page
          .getByRole('navigation', { name: 'Native breadcrumb' })
          .locator('input')
          .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label'))),
        ['Crumb b', 'Crumb a'],
      );
    });
    await check(`${mode}: controlled native menu keyboard href and content slots`, async () => {
      await demo('native', mode);
      const nav = page.getByRole('navigation', { name: 'Documentation path' });
      const trigger = nav.getByRole('button', { name: 'Open breadcrumb menu' });
      const previous = await trigger.elementHandle();
      assert.equal(await nav.locator('.apollo-breadcrumb-separator').first().textContent(), '›');
      await page
        .getByRole('button', { name: 'Toggle separator and icon slots', exact: true })
        .click();
      assert.equal(await nav.locator('.apollo-breadcrumb-separator').first().textContent(), '/');
      assert.equal(await trigger.evaluate((node, old) => node === old, previous), true);
      await trigger.focus();
      assert.equal(
        new URL(page.url()).hash,
        '',
        'Every theme proves a fresh destination activation',
      );
      await trigger.press('ArrowDown');
      const guide = page.getByRole('menuitem', { name: 'Guide', exact: true });
      await guide.waitFor({ state: 'visible' });
      await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'menuitem');
      assert.equal(await guide.getByRole('link').getAttribute('href'), '#guide');
      await guide.press('Enter');
      await page.waitForURL(`${origin}BreadcrumbDemos.html#guide`);
      assert.equal(page.url(), `${origin}BreadcrumbDemos.html#guide`);
      await guide.waitFor({ state: 'hidden' });
      await trigger.press('ArrowDown');
      await guide.waitFor({ state: 'visible' });
      await page.keyboard.press('Escape');
      await guide.waitFor({ state: 'hidden' });
      assert.equal(await trigger.evaluate((node) => document.activeElement === node), true);
      return { url: page.url() };
    });
    await check(
      `${mode}: original overlay opens and keyboard closes without following external links`,
      async () => {
        await demo('overlay', mode);
        const trigger = page.getByRole('button', { name: 'Open breadcrumb menu' });
        await trigger.focus();
        await trigger.press('ArrowDown');
        const menu = page.getByRole('menu');
        await menu.waitFor({ state: 'visible' });
        assert.equal(await menu.getByRole('link').count(), 3);
        await page.keyboard.press('Escape');
        await menu.waitFor({ state: 'hidden' });
        assert.equal(await trigger.evaluate((node) => document.activeElement === node), true);
      },
    );
    await check(
      `${mode}: original variables, explicit separators and legacy routes have real consumers`,
      async () => {
        await demo('component-token', mode);
        assert.equal(
          await page
            .locator('.apollo-breadcrumb-separator')
            .first()
            .evaluate((node) => getComputedStyle(node).marginInlineStart),
          '12px',
        );
        assert.equal(
          await page
            .locator('.apollo-breadcrumb-item')
            .last()
            .evaluate((node) => getComputedStyle(node).color),
          await page.locator('main').evaluate((node) => getComputedStyle(node).color),
        );
        await demo('separator-component', mode);
        assert.deepEqual(await page.locator('.apollo-breadcrumb-separator').allTextContents(), [
          ':',
          '/',
          '/',
        ]);
        await demo('debug-routes', mode);
        assert.deepEqual(
          await page
            .locator('nav a')
            .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href'))),
          ['#/home', '#/home/user'],
        );
        await page.getByRole('button', { name: 'Open breadcrumb menu' }).press('ArrowDown');
        const first = page.getByRole('menuitem', { name: 'User1' });
        await first.waitFor({ state: 'visible' });
        assert.equal(await first.getByRole('link').getAttribute('href'), '#/home/user/user1');
        await page.keyboard.press('Escape');
        await first.waitFor({ state: 'hidden' });
      },
    );
  }
  writeFileSync(
    process.env.BREADCRUMB_DEMOS_EVIDENCE ?? '/tmp/apollo-breadcrumb-demo-themes.json',
    `${JSON.stringify({ source, browser: browser.version(), styles: styles.evidence, results, errors }, null, 2)}\n`,
  );
  for (const result of results)
    console.log(
      `${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`,
    );
  assert.deepEqual(errors, []);
  assert.ok(
    results.every((result) => result.passed),
    'Breadcrumb original demo failures',
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
