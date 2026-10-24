/** Steps native scoped slots against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-steps-native-slots-'));
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
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=steps-native-slots`);
  const inline = page.locator('[data-native-inline-steps]');
  const dots = page.locator('[data-native-dot-steps]');
  const input = page.getByRole('textbox', { name: 'Step note a', exact: true });
  await input.fill('kept native step');
  const node = await input.elementHandle();
  assert.equal(await inline.locator('[data-native-wrapper]').count(), 2);
  assert.equal(await inline.locator('[data-native-step="a"]').getAttribute('data-active'), 'true');
  assert.equal(await dots.locator('[data-native-dot="0"]').innerText(), '0:process');
  await inline.locator('.apollo-steps-item').first().hover();
  await page.getByRole('tooltip').filter({ hasText: 'Alpha details' }).waitFor();
  await page.getByRole('button', { name: 'Advance native step', exact: true }).click();
  assert.equal(await inline.locator('[data-native-step="b"]').getAttribute('data-active'), 'true');
  assert.equal(await inline.locator('[data-native-icon="1"]').getAttribute('data-active'), 'true');
  assert.equal(await dots.locator('[data-native-dot="1"]').innerText(), '1:process');
  await page.getByRole('button', { name: 'Update native step data', exact: true }).click();
  assert.match(await inline.innerText(), /Alpha!/);
  assert.equal(await input.inputValue(), 'kept native step');
  assert.equal(await input.evaluate((current, old) => current === old, node), true);
  await page.getByRole('button', { name: 'Toggle empty step slots', exact: true }).click();
  assert.equal(await inline.locator('.apollo-steps-item, input').count(), 0);
  await page.getByRole('button', { name: 'Toggle native step slots', exact: true }).click();
  assert.equal(await inline.locator('.apollo-steps-item').count(), 2);
  assert.equal(await inline.locator('[data-native-step]').count(), 0);
  // No itemRender slot: inline content must still have its default Tooltip.
  await inline.locator('.apollo-steps-item').first().hover();
  await page.getByRole('tooltip').filter({ hasText: 'Alpha details' }).waitFor();
  await page.getByRole('button', { name: 'Toggle empty step slots', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle native step slots', exact: true }).click();
  assert.equal(await inline.locator('input').count(), 2);
  assert.deepEqual(errors, []);
  console.log(
    `PASS Steps native scoped slots: all four actual Vue template scopes, current active/status/data, conditional/empty/restoration, input identity and inline Tooltip both with and without itemRender; ${await browser.version()}; zero browser/Vue errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
