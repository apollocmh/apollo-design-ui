/** F02/F04/F07/F08/F09: production dist with real Vue templates. */
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../visual/stabilize.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const outDir = mkdtempSync(path.join(tmpdir(), 'apollo-vue-reactivity-'));
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
  const launched = await launchBrowser();
  browser = launched.browser;
  const page = await browser.newPage();
  page.setDefaultTimeout(10_000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const base = server.resolvedUrls.local[0];
  await page.goto(`${base}vue-reactivity.html?demo=select`);
  const select = page
    .locator('.apollo-select')
    .filter({ has: page.locator('#conditional-select') });
  const inputNode = await page.locator('#conditional-select').elementHandle();
  await page.locator('#conditional-select').click();
  assert.equal(await page.locator('.apollo-select-item-option').count(), 0);
  await page.getByRole('button', { name: /Toggle options/ }).click();
  await page.locator('#conditional-select').click();
  await page.waitForFunction(
    () => document.querySelectorAll('.apollo-select-item-option').length === 2,
  );
  assert.match(await select.innerText(), /Alpha/);
  await page.getByRole('button', { name: /Update options/ }).click();
  await page.locator('#conditional-select').click();
  await page.waitForFunction(
    () => document.querySelectorAll('.apollo-select-item-option').length === 3,
  );
  assert.match(await select.innerText(), /Updated Alpha/);
  assert.match(
    await page.locator('.apollo-select-item-option-disabled').innerText(),
    /Disabled Beta/,
  );
  assert.equal(
    await page.evaluate(
      (node) => node === document.querySelector('#conditional-select'),
      inputNode,
    ),
    true,
  );
  await page.locator('#conditional-select').fill('Gamma');
  await page.waitForFunction(
    () => document.querySelectorAll('.apollo-select-item-option').length === 1,
  );
  await page.locator('#conditional-select').press('ArrowDown');
  await page.locator('#conditional-select').press('Enter');
  await page.waitForFunction(() => document.querySelector('output')?.textContent === 'c');
  await page.getByRole('button', { name: /Toggle options/ }).click();
  assert.match(await select.innerText(), /Gamma/);
  await page.getByRole('button', { name: /Toggle options/ }).click();
  await page.locator('#conditional-autocomplete').click();
  await page.locator('#conditional-autocomplete').fill('a');
  await page.waitForFunction(() =>
    document
      .querySelector('.apollo-select-item-option-content')
      ?.textContent?.includes('Updated Alpha'),
  );
  console.log(
    'PASS F02: conditional options, groups/loops, current labels/disabled, cache, keyboard, AutoComplete, input identity',
  );

  await page.goto(`${base}vue-reactivity.html?demo=input-number`);
  const number = page.getByRole('spinbutton', { name: '金额 / Amount' });
  const numberNode = await number.elementHandle();
  assert.equal(await page.locator('.apollo-input-number-prefix').innerText(), '¥');
  await number.fill('12');
  await page.getByRole('button', { name: /Toggle slots/ }).click();
  assert.equal(await page.locator('.apollo-input-number-prefix').innerText(), '$');
  assert.equal(await page.locator('.apollo-input-number-suffix').first().innerText(), 'USD');
  assert.equal(await number.inputValue(), '12');
  assert.equal(
    await page.evaluate(
      (node) => node === document.querySelector('input[aria-label="金额 / Amount"]'),
      numberNode,
    ),
    true,
  );
  await number.press('ArrowUp');
  assert.equal(await number.inputValue(), '13');
  console.log(
    'PASS F04: prefix/suffix slots, prop restoration, native input identity, numeric input and stepping',
  );

  await page.goto(`${base}vue-reactivity.html?demo=descriptions`);
  const spans = (tag = 'td') =>
    page
      .locator(`.apollo-descriptions ${tag}`)
      .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('colspan')));
  assert.deepEqual(await spans(), ['3']);
  await page.getByRole('button', { name: 'Toggle rows' }).click();
  assert.deepEqual(await spans(), ['1', '1', '1', '3']);
  await page.getByRole('button', { name: 'Toggle layout' }).click();
  assert.deepEqual(await spans(), ['1', '1', '1', '3']);
  assert.deepEqual(await spans('th'), ['1', '1', '1', '3']);
  await page.getByRole('button', { name: 'Toggle rows' }).click();
  assert.deepEqual(await spans(), ['3']);
  assert.deepEqual(await spans('th'), ['3']);
  console.log('PASS F08: dynamic child rows, merged cells, layout switch');

  await page.goto(`${base}vue-reactivity.html?demo=content-slots`);
  const alert = page.locator('.apollo-alert');
  const header = page.locator('.apollo-collapse-title');
  const panelInput = page.getByRole('textbox', { name: 'Panel state' });
  const panelNode = await panelInput.elementHandle();
  await panelInput.fill('Keep this state');
  assert.match(await alert.innerText(), /Template content/);
  assert.equal(await header.innerText(), 'Template content');
  await page.getByRole('button', { name: /Toggle empty/ }).click();
  assert.equal((await alert.innerText()).trim(), '');
  assert.equal((await header.innerText()).trim(), '');
  assert.equal(
    await alert.evaluate((el) => el.classList.contains('apollo-alert-with-description')),
    false,
  );
  await page.getByRole('button', { name: /Toggle slots/ }).click();
  assert.match(await alert.innerText(), /Prop title/);
  assert.match(await alert.innerText(), /Prop description/);
  assert.equal(await header.innerText(), 'Prop header');
  await page.getByRole('button', { name: /Toggle empty/ }).click();
  await page.getByRole('button', { name: /Update content/ }).click();
  await page.getByRole('button', { name: /Toggle slots/ }).click();
  assert.match(await alert.innerText(), /Updated content/);
  assert.equal(await header.innerText(), 'Updated content');
  assert.equal(await panelInput.inputValue(), 'Keep this state');
  assert.equal(
    await page.evaluate(
      (node) => node === document.querySelector('input[aria-label="Panel state"]'),
      panelNode,
    ),
    true,
  );
  console.log(
    'PASS F07: slot precedence, empty content, prop restoration, current header, panel input identity',
  );

  await page.goto(`${base}vue-reactivity.html?demo=events`);
  const state = async () => JSON.parse(await page.locator('#event-state').innerText());
  const toggle = page.getByRole('switch', { name: 'Semantic switch' });
  const amount = page.getByRole('spinbutton', { name: 'Semantic number' });
  await toggle.click();
  assert.deepEqual(await state(), {
    checked: true,
    amount: 1,
    switchChanges: 1,
    numberChanges: 0,
    lastSwitch: 'true:click',
    lastNumber: '',
    clickPayload: 'click',
  });
  await toggle.press('ArrowLeft');
  assert.equal((await state()).switchChanges, 2);
  assert.equal((await state()).lastSwitch, 'false:keydown');
  await amount.fill('12');
  assert.equal((await state()).amount, 12);
  assert.equal((await state()).numberChanges, 1);
  assert.equal((await state()).lastNumber, 'number:12');
  await toggle.dispatchEvent('change');
  await amount.dispatchEvent('change');
  assert.equal((await state()).switchChanges, 2);
  assert.equal((await state()).numberChanges, 1);
  await amount.fill('');
  assert.equal((await state()).amount, null);
  assert.equal((await state()).numberChanges, 2);
  await page.getByRole('button', { name: 'Toggle disabled' }).click();
  assert.equal(await toggle.isDisabled(), true);
  assert.equal(await amount.isDisabled(), true);
  await toggle.dispatchEvent('keydown', { key: 'ArrowRight', which: 39 });
  assert.equal((await state()).switchChanges, 2);
  console.log(
    'PASS F09: typed semantic change, v-model, keyboard, single delivery, native change isolation, disabled',
  );
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${base}vue-reactivity.html?demo=badge`);
  const richCount = page.locator('.apollo-badge-count');
  const badgeInput = page.getByRole('textbox', { name: 'Badge anchor state' });
  const badgeNode = await badgeInput.elementHandle();
  await badgeInput.fill('Kept');
  assert.equal((await richCount.textContent()).trim(), 'New!');
  assert.equal(await richCount.locator('bdi').count(), 0);
  await page.getByRole('button', { name: /Toggle empty/ }).click();
  await page.waitForSelector('.apollo-badge-zoom-leave-active');
  assert.equal((await richCount.textContent()).trim(), 'New!');
  await richCount.waitFor({ state: 'detached' });
  assert.equal(await page.locator('.apollo-badge-status-text').count(), 0);
  await page.getByRole('button', { name: /Toggle empty/ }).click();
  await page.getByRole('button', { name: /Update content/ }).click();
  assert.equal((await richCount.textContent()).trim(), 'Updated!');
  await page.getByRole('button', { name: '数字 0 / 100' }).click();
  assert.equal((await richCount.textContent()).trim(), 'Updated!');
  await page.getByRole('button', { name: /Toggle content/ }).click();
  await richCount.waitFor({ state: 'detached' });
  assert.equal(await page.locator('.apollo-badge-status-text').innerText(), 'Prop status');
  await page.getByRole('button', { name: '数字 0 / 100' }).click();
  assert.equal(await richCount.innerText(), '99+');
  await page.getByRole('button', { name: /Toggle dot/ }).click();
  assert.equal(await page.locator('.apollo-badge-dot').innerText(), '');
  assert.equal(await badgeInput.inputValue(), 'Kept');
  assert.equal(
    await page.evaluate(
      (node) => node === document.querySelector('input[aria-label="Badge anchor state"]'),
      badgeNode,
    ),
    true,
  );
  console.log(
    'PASS F05: rich slots, multiple roots, leave cache, empty suppression, prop restoration, zero/overflow/dot, anchor identity',
  );
  await page.goto(`${base}vue-reactivity.html?demo=attrs`);
  const nativeState = async () => JSON.parse(await page.locator('#native-state').innerText());
  const colorTrigger = page.locator('.apollo-color-picker-trigger');
  await colorTrigger.dispatchEvent('mousedown');
  assert.equal((await nativeState()).mouse, 1);
  await page.getByRole('button', { name: 'Update attrs' }).click();
  assert.equal(await colorTrigger.getAttribute('id'), 'after');
  assert.equal(await colorTrigger.getAttribute('aria-label'), 'After color');
  assert.equal(
    await colorTrigger.evaluate(
      (el) => el.classList.contains('after') && !el.classList.contains('before'),
    ),
    true,
  );
  await colorTrigger.dispatchEvent('mousedown');
  assert.equal((await nativeState()).mouse, 2);
  const rating = page.locator('.apollo-rate');
  await rating.press('ArrowRight');
  assert.equal((await nativeState()).rating, 1);
  assert.equal((await nativeState()).keys, 1);
  await rating.dispatchEvent('mouseleave');
  assert.equal((await nativeState()).leaves, 1);
  await page.getByRole('button', { name: 'Disable rating' }).click();
  await rating.dispatchEvent('keydown', { key: 'ArrowRight', keyCode: 39 });
  assert.equal((await nativeState()).rating, 1);
  assert.equal((await nativeState()).keys, 1);
  console.log(
    'PASS F10: Vue native listeners, current attrs, keyboard state, single delivery, disabled suppression',
  );
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${base}vue-reactivity.html?demo=table-reorder`);
  const rowKeys = () =>
    page
      .locator('tbody tr[data-row-key]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-row-key')));
  const columnKeys = () =>
    page
      .locator('thead th[data-drag-key]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-drag-key')));
  assert.deepEqual(await rowKeys(), ['a', 'b', 'c']);
  await page.locator('tr[data-drag-key="row:a"]').dragTo(page.locator('tr[data-drag-key="row:b"]'));
  assert.deepEqual(await rowKeys(), ['b', 'a', 'c']);
  await page
    .locator('th[data-drag-key="column:name"]')
    .dragTo(page.locator('th[data-drag-key="column:age"]'));
  assert.deepEqual(await columnKeys(), ['column:age', 'column:name', 'column:city']);
  const firstRow = page.locator('tbody tr[data-row-key="b"] td');
  assert.deepEqual(await firstRow.allTextContents(), ['32', 'Bob', 'Beijing']);
  await page.getByRole('button', { name: 'Reset order' }).click();
  assert.deepEqual(await rowKeys(), ['a', 'b', 'c']);
  assert.deepEqual(await columnKeys(), ['column:name', 'column:age', 'column:city']);
  await page.getByRole('combobox', { name: 'Row to move' }).selectOption('c');
  await page.getByRole('button', { name: 'Move row up' }).focus();
  await page.keyboard.press('Enter');
  assert.deepEqual(await rowKeys(), ['a', 'c', 'b']);
  await page.getByRole('combobox', { name: 'Column to move' }).selectOption('city');
  await page.getByRole('button', { name: 'Move column left' }).focus();
  await page.keyboard.press('Enter');
  assert.deepEqual(await columnKeys(), ['column:name', 'column:city', 'column:age']);
  console.log(
    'PASS H03: Table row/header native drag, cell alignment, reset, equivalent keyboard controls',
  );
  assert.deepEqual(errors, []);
  console.log(
    `PASS Vue reactivity browser: ${process.platform}/${process.arch}, ${await browser.version()}, ${launched.channel}`,
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => (server ? server.httpServer.close(resolve) : resolve()));
  rmSync(outDir, { recursive: true, force: true });
}
