/** Native overlay templates and real Teleports against production dist. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-overlay-content-'));
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
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('[Vue warn]'))
    )
      errors.push(message.text());
  });
  await page.goto(`${server.resolvedUrls.local[0]}vue-reactivity.html?demo=overlay-content`);
  const tooltip = page.locator('#native-tooltip-main');
  const popover = page.locator('#native-popover-main');
  const confirm = page.locator('#native-confirm-main');
  await tooltip.waitFor();
  await popover.waitFor();
  await confirm.waitFor();
  assert.equal(await tooltip.innerText(), 'Tooltip fallback');
  assert.match(await popover.innerText(), /Popover fallback/);
  assert.match(await confirm.innerText(), /Confirm fallback/);
  const input = page.getByRole('textbox', { name: 'Popover popup note', exact: true });
  await input.fill('kept in popup');
  const inputNode = await input.elementHandle();
  await page.getByRole('button', { name: 'Toggle popup slots', exact: true }).click();
  assert.equal(await tooltip.innerText(), 'Tooltip 0');
  assert.match(await popover.innerText(), /Popover 0/);
  assert.match(await confirm.innerText(), /Confirm 0/);
  assert.equal(await confirm.getByRole('button', { name: 'Proceed 0', exact: true }).count(), 1);
  await page.getByRole('button', { name: 'Update popup slots', exact: true }).click();
  assert.equal(await tooltip.innerText(), 'Tooltip 1');
  assert.match(await popover.innerText(), /Popover 1/);
  assert.match(await confirm.innerText(), /Description 1/);
  assert.equal(await input.inputValue(), 'kept in popup');
  assert.equal(await input.evaluate((current, old) => current === old, inputNode), true);
  await page.getByRole('button', { name: 'Empty popup slots', exact: true }).click();
  assert.equal(await tooltip.innerText(), '');
  assert.equal(await popover.locator('.apollo-popover-title').innerText(), '');
  assert.equal((await confirm.innerText()).trim(), '');
  await page.getByRole('button', { name: 'Toggle popup slots', exact: true }).click();
  assert.equal(await tooltip.innerText(), 'Tooltip fallback');
  assert.match(await confirm.innerText(), /Confirm prop/);
  await page.getByRole('button', { name: 'Empty popup slots', exact: true }).click();
  await page.getByRole('button', { name: 'Toggle popup slots', exact: true }).click();

  for (const name of ['tooltip', 'popover', 'popconfirm']) {
    const panel = page.locator(`[data-native-${name}-panel]`);
    const button = name === 'popconfirm' ? 'slots' : 'title';
    const fallback = await panel.innerText();
    await page.getByRole('button', { name: `Toggle ${name} ${button}`, exact: true }).click();
    assert.match(
      await panel.innerText(),
      name === 'popconfirm' ? /Native confirmation 0/ : new RegExp(`Native ${name} 0`),
    );
    await page.getByRole('button', { name: `Update ${name} ${button}`, exact: true }).click();
    assert.match(
      await panel.innerText(),
      name === 'popconfirm' ? /Proceed 1/ : new RegExp(`Native ${name} 1`),
    );
    await page.getByRole('button', { name: `Empty ${name} ${button}`, exact: true }).click();
    assert.doesNotMatch(
      await panel.innerText(),
      /Native (tooltip|popover|confirmation)|Delete the task|Hello, Pure Panel!/,
    );
    await page.getByRole('button', { name: `Toggle ${name} ${button}`, exact: true }).click();
    assert.equal(await panel.innerText(), fallback);
  }
  const ok = confirm.locator('.apollo-popconfirm-buttons button').last();
  assert.equal(await ok.innerText(), 'Proceed 1');
  await ok.click();
  assert.equal(await page.locator('[data-confirm-count]').innerText(), '1');
  assert.equal(await confirm.isVisible(), true);
  await ok.dispatchEvent('click');
  assert.equal(await page.locator('[data-confirm-count]').innerText(), '1');
  await confirm.getByRole('button', { name: 'Finish pending confirmation', exact: true }).click();
  await confirm.waitFor({ state: 'hidden' });
  assert.deepEqual(errors, []);
  console.log(
    `PASS Chrome ${browser.version()}: six native overlay components, current/empty/removed slots, stable input, and Promise confirmation without duplicate submission; zero Vue/page errors`,
  );
} finally {
  await browser?.close();
  await server?.httpServer.close();
  rmSync(outDir, { recursive: true, force: true });
}
