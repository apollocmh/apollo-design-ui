/** F03: real Input, feedback and measured margins against production UI dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-form-prefix-'));
let server;
let browser;
try {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [vue()],
    build: {
      outDir,
      emptyOutDir: true,
      rollupOptions: { input: path.join(root, 'vue-reactivity.html') },
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
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=form-prefix`);
  const input = await page.getByRole('textbox', { name: 'Name' }).elementHandle();
  await page.getByRole('textbox', { name: 'Name' }).fill('edited value');
  let currentPrefix = 'f1';
  for (const layout of ['horizontal', 'vertical', 'inline']) {
    await page.getByRole('combobox', { name: 'Form layout' }).selectOption(layout);
    for (let cycle = 0; cycle < 3; cycle++) {
      if (cycle) {
        await page.getByRole('button', { name: 'Toggle form prefix' }).click();
        currentPrefix = currentPrefix === 'f1' ? 'f2' : 'f1';
      }
      const item = `${currentPrefix}-form-item`;
      await page.waitForFunction(
        (prefix) => !!document.querySelector(`.${prefix}-explain-error`),
        item,
      );
      assert.equal(await page.locator(`.${item}-feedback-icon-error`).count(), 1);
      assert.equal(await page.locator(`.${item}-explain-error`).textContent(), 'Required');
      assert.equal(await page.locator(`.${item}-${layout}`).count(), 1);
      assert.equal(
        await page
          .locator(
            `[class*="${currentPrefix === 'f1' ? 'f2' : 'f1'}-form-item"], [class*="apollo-form-item"]`,
          )
          .count(),
        0,
      );
      const sizes = await page.locator(`.${item}`).evaluate((element) => ({
        margin: Number.parseFloat(getComputedStyle(element).marginBottom),
        offset: Number.parseFloat(
          element.querySelector('[class$="-margin-offset"]').style.marginBottom,
        ),
        additional: Number.parseFloat(
          element.querySelector('[class$="-additional"]').style.minHeight,
        ),
      }));
      const expectedMargin =
        currentPrefix === 'f1'
          ? { horizontal: 24, vertical: 32, inline: 12 }[layout]
          : { horizontal: 40, vertical: 48, inline: 20 }[layout];
      assert.equal(sizes.margin, expectedMargin);
      assert.equal(sizes.offset, -sizes.margin);
      assert.equal(sizes.additional, sizes.margin);
      assert.equal(
        await page.evaluate((node) => node === document.querySelector('#prefix-name'), input),
        true,
      );
      assert.equal(await page.getByRole('textbox', { name: 'Name' }).inputValue(), 'edited value');
    }
  }
  for (const prefix of ['custom-a-form', 'custom-b-form', 'custom-a-form']) {
    await page.getByRole('combobox', { name: 'Item prefix' }).selectOption(prefix);
    for (const status of ['error', 'warning', 'success', 'validating']) {
      await page.getByRole('combobox', { name: 'Form status' }).selectOption(status);
      assert.equal(await page.locator(`.${prefix}-item-feedback-icon-${status}`).count(), 1);
      assert.equal(
        await page.locator(`.${prefix}-item-explain-${status}`).textContent(),
        'Required',
      );
      assert.equal(
        await page.evaluate((node) => node === document.querySelector('#prefix-name'), input),
        true,
      );
    }
  }
  await page.getByRole('button', { name: 'Toggle help' }).click();
  await page.waitForFunction(() => !document.querySelector('[class$="-margin-offset"]'));
  await page.getByRole('button', { name: 'Toggle help' }).click();
  await page.waitForFunction(
    () =>
      document.querySelector('.custom-a-form-item-margin-offset')?.style.marginBottom === '-30px',
  );
  assert.deepEqual(errors, []);
  console.log(
    `PASS F03: 3 layouts × f1/f2/f1, custom prefixes × 4 feedback statuses, error classes, measured offset/min-height, help removal/re-entry, typed value and input identity; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
