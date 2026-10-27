import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures'),
  outDir = mkdtempSync(path.join(tmpdir(), 'apollo-tag-demos-'));
let server, browser;
const results = [],
  errors = [];
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'tag-demo-themes.html') },
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
  page.setDefaultTimeout(10000);
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || m.text().includes('[Vue warn]')) errors.push(m.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}tag-demo-themes.html`);
  await page.waitForFunction(() => Boolean(window.setTagDemo));
  await page.addScriptTag({ path: createRequire(import.meta.url).resolve('axe-core/axe.min.js') });
  for (const demo of [
    'animation',
    'basic',
    'checkable',
    'colorful',
    'component-token',
    'control',
    'customize',
    'disabled',
    'draggable',
    'icon',
    'status',
    'style-class',
  ])
    for (const theme of ['default', 'dark', 'compact', 'both']) {
      await page.evaluate(([demo, theme]) => window.setTagDemo(demo, theme), [demo, theme]);
      await page.evaluate(
        () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
      );
      await page.evaluate(async () => {
        await Promise.all(
          document
            .getAnimations()
            .filter((animation) => Number.isFinite(animation.effect?.getTiming().iterations ?? 1))
            .map((animation) => animation.finished.catch(() => {})),
        );
      });
      const violations = await page.locator('main').evaluate(async (n) =>
        (await window.axe.run(n)).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((x) => ({ html: x.html, failure: x.failureSummary })),
        })),
      );
      results.push({ demo, theme, passed: violations.length === 0, violations });
      console.log(`${violations.length ? 'FAIL' : 'PASS'} ${demo}/${theme}`);
    }
  const check = async (name, run) => {
    try {
      await run();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, error: error.message });
    }
  };
  const show = async (demo) => {
    await page.evaluate((demo) => window.setTagDemo(demo, 'default'), demo);
  };
  await show('basic');
  await check('basic cancellation preserves the label, built-in action closes once', async () => {
    const labels = page.locator('.apollo-tag');
    await labels
      .filter({ hasText: 'Prevent Default' })
      .getByRole('button', { name: 'Close', exact: true })
      .click();
    assert.ok(
      !(await labels.filter({ hasText: 'Prevent Default' }).getAttribute('class')).includes(
        'apollo-tag-hidden',
      ),
    );
    await labels
      .filter({ hasText: 'Tag 2' })
      .getByRole('button', { name: 'Close', exact: true })
      .click();
    assert.ok(
      (await labels.filter({ hasText: 'Tag 2' }).getAttribute('class')).includes(
        'apollo-tag-hidden',
      ),
    );
    assert.equal(
      await page.getByRole('link', { name: 'Link', exact: true }).getAttribute('rel'),
      'noopener noreferrer',
    );
  });
  await show('checkable');
  await check('native checked and strong single/multiple v-model source examples', async () => {
    const yes = page.getByRole('checkbox', { name: 'Yes', exact: true });
    await yes.focus();
    await page.keyboard.press(' ');
    assert.equal(await yes.getAttribute('aria-checked'), 'false');
    const single = page.getByRole('group', { name: 'Single interest', exact: true });
    await single.getByRole('checkbox', { name: 'Movies', exact: true }).click();
    assert.equal(
      await single
        .getByRole('checkbox', { name: 'Books', exact: true })
        .getAttribute('aria-checked'),
      'false',
    );
    assert.equal(
      await single
        .getByRole('checkbox', { name: 'Movies', exact: true })
        .getAttribute('aria-checked'),
      'true',
    );
    await single.getByRole('checkbox', { name: 'Movies', exact: true }).click();
    assert.equal(await single.locator('[aria-checked="true"]').count(), 0);
    const multi = page.getByRole('group', { name: 'Multiple interests', exact: true });
    await multi.getByRole('checkbox', { name: 'Books', exact: true }).click();
    assert.equal(await multi.locator('[aria-checked="true"]').count(), 3);
  });
  await show('control');
  await check(
    'real add input, focus, Enter/blur, duplicate prevention, close and remount',
    async () => {
      const add = page.getByRole('button', { name: 'New Tag', exact: true });
      await add.click();
      const input = page.getByRole('textbox', { name: 'New tag name', exact: true });
      assert.equal(await input.evaluate((n) => n === document.activeElement), true);
      await input.fill('Added label');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('.apollo-tag').count(), 4);
      assert.equal(await add.evaluate((n) => n === document.activeElement), true);
      await add.click();
      await input.fill('Added label');
      await page.keyboard.press('Enter');
      assert.equal(await page.locator('.apollo-tag').count(), 4);
      await page
        .locator('.apollo-tag')
        .filter({ hasText: 'Added label' })
        .getByRole('button', { name: 'Close', exact: true })
        .click();
      assert.equal(await page.locator('.apollo-tag').count(), 3);
      await add.click();
      await input.fill('Blur label');
      await input.blur();
      assert.equal(await page.locator('.apollo-tag').count(), 4);
      await show('control');
      assert.equal(await page.locator('.apollo-tag').count(), 3);
    },
  );
  for (const demo of ['customize', 'icon']) {
    await show(demo);
    await check(`${demo} toggles using real keyboard activation`, async () => {
      const action = page.getByRole(demo === 'customize' ? 'button' : 'checkbox').first();
      const attribute = demo === 'customize' ? 'aria-pressed' : 'aria-checked';
      assert.equal(await action.getAttribute(attribute), 'true');
      await action.focus();
      await page.keyboard.press(' ');
      assert.equal(await action.getAttribute(attribute), 'false');
    });
  }
  await show('component-token');
  await check('actual three component Token configuration changes in the demo', async () => {
    const regular = page.locator('.apollo-tag').first();
    assert.equal(
      await regular.evaluate((n) => getComputedStyle(n).backgroundColor),
      'rgb(255, 247, 230)',
    );
    await page.getByRole('button', { name: 'Switch component tokens', exact: true }).click();
    await regular.evaluate((n) => {
      void n.offsetWidth;
    });
    await page.evaluate(() =>
      Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {}))),
    );
    assert.equal(
      await regular.evaluate((n) => getComputedStyle(n).backgroundColor),
      'rgb(229, 233, 255)',
    );
  });
  await show('style-class');
  await check('all four semantic styles and native root style priority', async () => {
    for (const part of ['root', 'icon', 'content', 'close'])
      assert.equal(await page.locator(`.demo-tag-${part}`).count(), 1);
    assert.equal(
      await page.locator('.demo-tag-root').evaluate((n) => getComputedStyle(n).paddingInlineStart),
      '10px',
    );
  });
  await show('animation');
  await check('parent close and repeated reset remounts', async () => {
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Close', exact: true }).click();
      assert.equal(await page.locator('.apollo-tag').count(), 0);
      await page.getByRole('button', { name: 'Reset', exact: true }).click();
      assert.equal(await page.locator('.apollo-tag').count(), 1);
    }
  });
  await show('draggable');
  await check('HTML drag events reorder without stale capture', async () => {
    const nodes = page.locator('.apollo-tag');
    const transfer = await page.evaluateHandle(() => new DataTransfer());
    await nodes.nth(0).dispatchEvent('dragstart', { dataTransfer: transfer });
    await nodes.nth(2).dispatchEvent('dragover', { dataTransfer: transfer });
    await nodes.nth(2).dispatchEvent('drop', { dataTransfer: transfer });
    assert.deepEqual(await nodes.allTextContents(), ['Tag 2', 'Tag 3', 'Tag 1']);
    await nodes.nth(0).dispatchEvent('drop', { dataTransfer: transfer });
    assert.deepEqual(await nodes.allTextContents(), ['Tag 2', 'Tag 3', 'Tag 1']);
  });
  const report = { browser: browser.version(), results, errors };
  writeFileSync(
    process.env.TAG_DEMO_THEME_EVIDENCE ?? '/tmp/apollo-tag-demo-themes.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
  assert.deepEqual(errors, []);
  assert.ok(results.every((r) => r.passed));
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
