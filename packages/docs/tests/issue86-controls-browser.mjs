/** Issue #86: real Demo controls, popup actions, focus preservation and narrow canvases. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchBrowser } from '../../../tests/visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4174/apollo-design-ui').replace(/\/$/, '');
const report = process.env.CONTROLS_REPORT ?? '/tmp/apollo-issue86-controls-regression.json';
const checks = [];
const themes = process.env.CONTROLS_THEMES?.split(',') ?? ['light', 'dark'];
const { browser } = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 390, height: 900 } });
const errors = [];
page.setDefaultTimeout(15000);
page.on('pageerror', (error) => errors.push(error.message));
async function go(component, demo, theme) {
  await page.goto(`${base}/components/${component}/demo/${demo}?embed=1&theme=${theme}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('.demo-renderer > :not(.demo-renderer-loading)');
  assert.equal(await page.locator('.demo-renderer-error').count(), 0);
}
function check(name, actual, expected = true) {
  assert.deepEqual(actual, expected, name);
  checks.push({ name, actual });
  console.log(`PASS ${name}`);
}
try {
  for (const theme of themes) {
    await go('input', 'component-token', theme);
    const controls = page.locator('.demo-input-token__controls .apollo-btn');
    check(`${theme}: all three Input helpers are Apollo buttons`, await controls.count(), 3);
    for (let index = 0; index < 3; index++) {
      await controls.nth(index).click();
      check(
        `${theme}: Input helper ${index} toggles`,
        await controls.nth(index).getAttribute('aria-pressed'),
        'true',
      );
    }

    await go('mentions', 'popupRender', theme);
    const mention = page.getByRole('textbox', { name: 'Custom mention editor' });
    await mention.pressSequentially('@');
    await page.waitForSelector('[data-native-mentions-popup]');
    await page.getByRole('button', { name: 'Update mention header', exact: true }).click();
    check(
      `${theme}: popup helper preserves editor focus`,
      await mention.evaluate((node) => node === document.activeElement),
    );
    check(
      `${theme}: popup header updates`,
      await page.locator('.native-mentions-header').innerText(),
      'Custom Header 1',
    );
    await mention.press('ArrowDown');
    await mention.press('Enter');
    check(
      `${theme}: mention selection still works`,
      (await mention.inputValue()).includes('zombieJ'),
    );

    await go('mentions', 'async', theme);
    const search = page.getByRole('textbox', { name: 'Search mention users' });
    await search.pressSequentially('@missing');
    await page.waitForSelector('[data-native-empty-message]');
    await page.getByRole('button', { name: 'Update empty message', exact: true }).click();
    check(
      `${theme}: asynchronous helper preserves focus`,
      await search.evaluate((node) => node === document.activeElement),
    );
    check(
      `${theme}: asynchronous empty content updates`,
      (await page.locator('[data-native-empty-message]').innerText()).includes('· 1'),
    );

    await go('mentions', 'component-token', theme);
    const tokenButton = page.getByRole('button', { name: 'Toggle component tokens' });
    check(
      `${theme}: Mentions token helper uses Apollo Button`,
      await tokenButton.evaluate((node) => node.classList.contains('apollo-btn')),
    );
    await tokenButton.click();
    check(
      `${theme}: Mentions component tokens toggle`,
      await tokenButton.getAttribute('aria-pressed'),
      'true',
    );

    await go('select', 'component-token', theme);
    const tall = page.getByRole('checkbox', { name: 'Taller options' });
    await tall.check();
    await page.waitForFunction(() => {
      const select = document.querySelector('.apollo-select');
      return (
        select &&
        getComputedStyle(select).getPropertyValue('--apollo-select-option-height').trim() === '52px'
      );
    });
    await page.locator('.apollo-select').click();
    await page.locator('.apollo-select-item-option').first().waitFor({ state: 'visible' });
    check(
      `${theme}: option token changes with Apollo Checkbox`,
      await page
        .locator('.apollo-select-item-option')
        .first()
        .evaluate((node) => node.offsetHeight),
      52,
    );

    await go('radio', 'radiogroup-more', theme);
    await page.getByRole('radio', { name: 'More...' }).check();
    const extra = page.getByRole('textbox', { name: '更多选项内容' });
    await extra.fill('Details');
    check(
      `${theme}: extra option uses the filled Apollo Input`,
      await extra.evaluate((node) => node.classList.contains('apollo-input-filled')),
    );
    check(`${theme}: extra input remains editable`, await extra.inputValue(), 'Details');

    await go('auto-complete', 'render-panel', theme);
    await page.getByRole('combobox', { name: '自定义候选面板的自动补全' }).fill('a');
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await page.waitForFunction(
      () =>
        !Array.from(document.querySelectorAll('.apollo-select-dropdown')).some(
          (node) =>
            getComputedStyle(node).display !== 'none' && node.getBoundingClientRect().height > 0,
        ),
    );
    check(`${theme}: Close action closes the custom autocomplete popup`, true);

    await go('select', 'custom-dropdown-menu', theme);
    await page.locator('.apollo-select').click();
    await page.getByRole('button', { name: 'Add item', exact: true }).click();
    check(
      `${theme}: custom dropdown action adds a real option`,
      await page.locator('.apollo-select-item-option[title="Item 3"]').count(),
      1,
    );
    await page.locator('.apollo-select-item-option[title="Item 3"]').click();
    check(
      `${theme}: new custom dropdown option can be selected`,
      (await page.locator('.apollo-select').innerText()).includes('Item 3'),
    );

    for (const [component, demo] of [
      ['input', 'compact-style'],
      ['input', 'group'],
      ['input', 'addon'],
      ['input', 'search'],
      ['input', 'search-input-loading'],
      ['input', 'status'],
      ['input-number', 'component-token'],
      ['input-number', 'variant-size-status'],
      ['segmented', 'size-consistent'],
      ['rate', 'clear'],
      ['color-picker', 'pure-panel'],
    ]) {
      await go(component, demo, theme);
      check(
        `${theme}: ${component}/${demo} fits a narrow canvas`,
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      );
    }
  }
  await page.setViewportSize({ width: 324, height: 900 });
  for (const theme of themes) {
    for (const demo of ['basic', 'component-token', 'dynamic']) {
      await go('segmented', demo, theme);
      if (demo === 'dynamic') {
        await page.getByRole('button', { name: 'Load more options', exact: true }).click();
      }
      await page.getByRole('radio').first().focus();
      for (let index = 0; index < 4; index++) await page.keyboard.press('ArrowRight');
      const keyboard = await page.locator('.apollo-segmented').evaluate((root) => {
        const active = document.activeElement;
        const label = active?.closest('label');
        const target = label?.getBoundingClientRect();
        const bounds = root.getBoundingClientRect();
        return {
          selected:
            active instanceof HTMLInputElement && active.checked && active.value === 'Yearly',
          visible: Boolean(
            target && target.left >= bounds.left - 1 && target.right <= bounds.right + 1,
          ),
          pageFits: document.documentElement.scrollWidth <= innerWidth,
        };
      });
      check(`${theme}: ${demo} keeps the keyboard selection visible in 300px`, keyboard, {
        selected: true,
        visible: true,
        pageFits: true,
      });
    }
  }
  check('No runtime errors', errors, []);
} finally {
  fs.writeFileSync(report, JSON.stringify({ checks, errors }, null, 2));
  await browser.close();
}
console.log(`PASS ${checks.length} Issue #86 controls checks; ${report}`);
