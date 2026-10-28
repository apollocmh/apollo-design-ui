import assert from 'node:assert/strict';
import { mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';
import { descriptionsAssets, descriptionsRepo as repo } from './descriptions-assets.mjs';

const assets = descriptionsAssets();
const temp = mkdtempSync(path.join(tmpdir(), 'apollo-descriptions-demos-'));
symlinkSync(path.join(repo, 'node_modules'), path.join(temp, 'node_modules'), 'dir');
const demos = readdirSync(path.join(repo, 'packages/ui/src/descriptions/demo'))
  .filter((name) => name.endsWith('.vue'))
  .map((name) => name.replace('.vue', ''))
  .sort();
assert.equal(demos.length, 13, 'All original Descriptions Demos remain in this acceptance unit');
writeFileSync(
  path.join(temp, 'index.html'),
  `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Descriptions real demo themes</title></head><body><div id="app"></div><script type="module">${assets.entry}import {createApp} from 'vue';import App from '${path.join(repo, 'tests/browser/fixtures/DescriptionsDemoThemes.mjs')}';createApp(App).mount('#app');</script></body></html>`,
);
const results = [],
  errors = [];
const check = async (name, run) => {
  try {
    const state = await run();
    results.push({ name, passed: true, ...(state === undefined ? {} : { state }) });
    console.log(`PASS ${name}`);
  } catch (error) {
    results.push({ name, passed: false, error: error.message });
    console.log(`FAIL ${name}: ${error.message}`);
  }
};
let browser, server;
try {
  await build({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue(), assets.plugin],
    resolve: { alias: [...assets.alias, { find: 'vue', replacement: assets.vue }] },
    build: { outDir: path.join(temp, 'out') },
  });
  server = await preview({
    root: temp,
    configFile: false,
    logLevel: 'warn',
    build: { outDir: path.join(temp, 'out') },
    preview: { host: '127.0.0.1', port: 0 },
  });
  ({ browser } = await launchBrowser());
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  page.setDefaultTimeout(5000);
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('[Vue warn]'))
      errors.push(message.text());
  });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.descriptionsDemo));
  assert.deepEqual(await page.evaluate(() => window.descriptionsDemo.names), demos);
  assert.equal(
    await page.locator('style[data-descriptions-source-styles]').count(),
    assets.source ? 1 : 0,
  );
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  const settle = () =>
    page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  const demo = async (name, mode) => {
    await page.evaluate(([name, mode]) => window.descriptionsDemo.set(name, mode), [name, mode]);
    await settle();
  };
  const css = (selector, property) =>
    page
      .locator(selector)
      .first()
      .evaluate((n, property) => getComputedStyle(n)[property], property);
  const columns = () =>
    page
      .locator('.apollo-descriptions-list')
      .first()
      .evaluate((n) => n.style.getPropertyValue('--apollo-descriptions-columns'));
  const select = async (label, target) => {
    const input = page.getByRole('combobox', { name: label, exact: true });
    await input.focus();
    await page.keyboard.press('Space');
    const active = page.locator(
      '.apollo-select-item-option-active .apollo-select-item-option-content',
    );
    await active.waitFor({ state: 'visible' });
    for (let i = 0; i < 5 && (await active.textContent()) !== target; i++) {
      await page.keyboard.press('ArrowDown');
    }
    assert.equal(await active.textContent(), target);
    await page.keyboard.press('Enter');
    await settle();
  };
  for (const mode of ['default', 'dark', 'compact', 'both']) {
    for (const name of demos) {
      await check(
        `${name}/${mode}: real Demo, native description pairs, geometry and axe`,
        async () => {
          await demo(name, mode);
          const state = await page.locator('main').evaluate((n) => ({
            roots: n.querySelectorAll('.apollo-descriptions').length,
            items: n.querySelectorAll('dl > div').length,
            labels: n.querySelectorAll('dl > div > dt').length,
            values: n.querySelectorAll('dl > div > dd').length,
            overflow: n.scrollWidth > n.clientWidth + 1,
            invalidText: /NaN|\[object Object\]/.test(n.textContent),
            background: getComputedStyle(n).backgroundColor,
          }));
          assert.ok(state.roots > 0 && state.items > 0);
          assert.equal(state.items, state.labels);
          assert.equal(state.items, state.values);
          assert.equal(state.overflow, false);
          assert.equal(state.invalidText, false);
          assert.equal(
            state.background,
            mode === 'dark' || mode === 'both' ? 'rgb(20, 20, 20)' : 'rgb(255, 255, 255)',
          );
          const issues = await page.locator('main').evaluate(async (n) =>
            (await window.axe.run(n)).violations.map((v) => ({
              id: v.id,
              nodes: v.nodes.map((node) => ({ html: node.html, failure: node.failureSummary })),
            })),
          );
          assert.deepEqual(issues, []);
          return state;
        },
      );
    }
    await check(`${mode}: column Demo uses its actual Select keyboard controls`, async () => {
      await demo('column', mode);
      assert.equal(await columns(), '3');
      await select('列数', '1 列');
      assert.equal(await columns(), '1');
      await select('列数', '4 列');
      assert.equal(await columns(), '4');
    });
    await check(`${mode}: padding Demo applies and removes current semantic padding`, async () => {
      await demo('padding', mode);
      const initial = await css('.apollo-descriptions-item-label', 'padding');
      await select('单元格内边距', '宽松');
      assert.equal(await css('.apollo-descriptions-item-label', 'padding'), '20px 28px');
      assert.equal(await css('.apollo-descriptions-item-content', 'padding'), '20px 28px');
      await select('单元格内边距', '默认');
      assert.equal(await css('.apollo-descriptions-item-label', 'padding'), initial);
    });
    await check(
      `${mode}: custom Item keeps the actual draft through four layout toggles`,
      async () => {
        await demo('custom-item', mode);
        const editor = page.getByRole('textbox', { name: '保留的草稿', exact: true });
        const original = await editor.elementHandle();
        await editor.fill('Actual Demo persistent draft');
        for (let i = 0; i < 4; i++) {
          await page.getByRole('button', { name: '切换布局', exact: true }).click();
          assert.equal(await editor.evaluate((n, old) => n === old, original), true);
          assert.equal(await editor.inputValue(), 'Actual Demo persistent draft');
          assert.equal(
            await page
              .locator('.apollo-descriptions')
              .evaluate((n) => n.classList.contains('apollo-descriptions-vertical')),
            i % 2 === 0,
          );
        }
        assert.equal(await page.locator('dt').first().textContent(), '原生标签');
        assert.deepEqual(
          await page.locator('dl > div').evaluateAll((nodes) => nodes.map((n) => n.dataset.span)),
          ['1', '2', '3'],
        );
      },
    );
    await check(`${mode}: extra-button Demo fires each native action once`, async () => {
      await demo('extra-button', mode);
      const action = page.getByRole('button', { name: '编辑（0）', exact: true });
      await action.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.getByRole('button', { name: '编辑（1）', exact: true }).count(), 1);
      await page.getByRole('button', { name: '编辑（1）', exact: true }).click();
      assert.equal(await page.getByRole('button', { name: '编辑（2）', exact: true }).count(), 1);
      assert.ok((await page.locator('main > p').textContent()).includes('2'));
    });
    await check(
      `${mode}: vertical-border Demo preserves native pairs while toggling borders`,
      async () => {
        await demo('vertical-border', mode);
        const first = await page.locator('dt').first().elementHandle();
        for (let i = 0; i < 4; i++) {
          await page
            .getByRole('button', { name: i % 2 ? '显示边框' : '隐藏边框', exact: true })
            .click();
          assert.equal(
            await page
              .locator('dt')
              .first()
              .evaluate((n, old) => n === old, first),
            true,
          );
          assert.equal(
            await page
              .locator('.apollo-descriptions')
              .evaluate((n) => n.classList.contains('apollo-descriptions-bordered')),
            i % 2 === 1,
          );
        }
      },
    );
    await check(
      `${mode}: custom-label help is keyboard reachable and opens the actual Tooltip`,
      async () => {
        await demo('custom-label', mode);
        const help = page.getByRole('button', { name: '产品说明', exact: true });
        await help.focus();
        await page.getByRole('tooltip').waitFor({ state: 'visible' });
        assert.ok((await page.getByRole('tooltip').textContent()).includes('产品的展示名称'));
        await page.keyboard.press('Tab');
        assert.equal(await help.evaluate((n) => n !== document.activeElement), true);
      },
    );
    await check(`${mode}: all ten component-token Demo variables produce actual CSS`, async () => {
      await demo('component-token', mode);
      const values = await page.locator('.apollo-descriptions').evaluateAll((roots) =>
        roots.map((root) => {
          const label = root.querySelector('dt'),
            content = root.querySelector('dd');
          return {
            label: getComputedStyle(label).color,
            title: getComputedStyle(root.querySelector('.apollo-descriptions-title')).color,
            content: getComputedStyle(content).color,
            extra: getComputedStyle(root.querySelector('.apollo-descriptions-extra')).color,
            margin: getComputedStyle(root.querySelector('.apollo-descriptions-header'))
              .marginBottom,
            left: getComputedStyle(label, '::after').marginInlineStart,
            right: getComputedStyle(label, '::after').marginInlineEnd,
            padding: root.classList.contains('apollo-descriptions-bordered')
              ? getComputedStyle(label).padding
              : getComputedStyle(label.parentElement).padding,
            background: getComputedStyle(label).backgroundColor,
          };
        }),
      );
      for (const [index, value] of values.entries()) {
        assert.equal(value.label, 'rgb(29, 57, 196)');
        assert.equal(value.title, 'rgb(16, 35, 158)');
        assert.equal(value.content, 'rgb(16, 35, 158)');
        assert.equal(value.extra, 'rgb(29, 57, 196)');
        assert.equal(value.margin, '24px');
        assert.equal(value.left, '6px');
        assert.equal(value.right, '10px');
        assert.equal(value.padding, index === 0 ? '0px 24px 12px 0px' : '12px 24px');
      }
      assert.equal(values[1].background, 'rgb(240, 245, 255)');
      return values;
    });
    await check(`${mode}: responsive Demo follows real 420/700/1100px viewports`, async () => {
      await demo('responsive', mode);
      for (const [width, expected] of [
        [420, '1'],
        [700, '2'],
        [1100, '3'],
      ]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.waitForFunction(
          (expected) =>
            document
              .querySelector('.apollo-descriptions-list')
              .style.getPropertyValue('--apollo-descriptions-columns') === expected,
          expected,
        );
        assert.equal(await columns(), expected);
        assert.equal(
          await page.locator('main').evaluate((n) => n.scrollWidth <= n.clientWidth + 1),
          true,
        );
      }
    });
  }
  writeFileSync(
    process.env.DESCRIPTIONS_DEMOS_EVIDENCE ??
      `/tmp/apollo-descriptions-${assets.source ? 'source' : 'published'}-demo-themes.json`,
    `${JSON.stringify({ browser: browser.version(), assets: assets.evidence(), demos, results, errors }, null, 2)}\n`,
  );
  console.log(
    `Descriptions real Demos: ${results.filter((r) => r.passed).length}/${results.length}; errors ${errors.length}`,
  );
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(temp, { recursive: true, force: true });
}
