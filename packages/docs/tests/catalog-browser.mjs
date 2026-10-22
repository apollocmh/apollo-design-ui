/** Production-page checks for the handwritten Overview and window-virtualized icon catalog. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const base = process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui';
const evidence = process.env.DOCS_EVIDENCE_DIR ?? '/tmp/apollo-docs-catalog';
fs.mkdirSync(evidence, { recursive: true });
const manifest = JSON.parse(
  fs.readFileSync(new URL('../.generated/manifest.json', import.meta.url), 'utf8'),
);
const results = [];
function check(name, actual, expected = true) {
  assert.deepEqual(actual, expected, name);
  results.push({ name, actual });
  console.log(
    `PASS ${name}: ${JSON.stringify(Array.isArray(actual) && actual.length > 12 ? { length: actual.length } : actual)}`,
  );
}
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error' || /hydration/i.test(message.text())) errors.push(message.text());
});
async function go(route) {
  await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
}
async function noOverflow(name) {
  check(name, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
}
async function settle() {
  await page.waitForTimeout(120);
}
try {
  await go('/components');
  check(
    'All 72 UI links plus the independent icon resource',
    await page.locator('.overview-card').count(),
    73,
  );
  const links = await page
    .locator('.overview-card')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href').split('/').pop()).sort());
  check(
    'Overview links match the manifest',
    links,
    [...manifest.components.map((item) => item.name), 'icon'].sort(),
  );
  check(
    'Every card has a code-drawn preview',
    await page.locator('.component-preview').count(),
    73,
  );
  const heights = await page
    .locator('.component-preview')
    .evaluateAll((nodes) => [...new Set(nodes.map((node) => node.getBoundingClientRect().height))]);
  check('Uniform preview height', heights, [176]);
  check(
    'Desktop uses four columns',
    await page
      .locator('.overview-grid')
      .first()
      .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length),
    4,
  );
  await noOverflow('Desktop overview does not overflow');
  check(
    'Desktop sidebar width',
    Math.round((await page.locator('.site-sidebar').boundingBox()).width),
    300,
  );
  check(
    'Desktop article starts at x=348',
    Math.round((await page.locator('.overview-page').boundingBox()).x),
    348,
  );
  check(
    'Page title size',
    await page.locator('h1').evaluate((node) => getComputedStyle(node).fontSize),
    '32px',
  );
  await page.screenshot({ path: path.join(evidence, 'overview-desktop.png') });
  await page.getByRole('searchbox', { name: '搜索组件', exact: true }).fill('排版');
  check('Chinese component search', await page.locator('.overview-card').count(), 1);
  check(
    'Search selects Typography',
    await page.locator('.overview-card').getAttribute('href'),
    '/apollo-design-ui/components/typography',
  );
  await page.getByRole('searchbox', { name: '搜索组件', exact: true }).fill('no-component-exists');
  check('Overview empty state', await page.locator('.overview-empty').isVisible());
  await page.getByRole('searchbox', { name: '搜索组件', exact: true }).fill('');
  await page.locator('.overview-card[href$="/icon"]').click();
  await page.waitForSelector('.virtual-icon-grid');
  await settle();
  check(
    'Overview icon opens the independent page',
    await page.locator('h1').innerText(),
    'Icon 图标',
  );
  check('Full icon count', (await page.locator('.icon-count').innerText()).includes('848'));
  check(
    'No load-more pagination',
    await page.getByRole('button', { name: /加载更多|Load more/ }).count(),
    0,
  );
  const grid = page.getByRole('grid', { name: '图标目录', exact: true });
  check(
    'All icon rows occupy the scroll extent',
    Number(await grid.getAttribute('aria-rowcount')),
    Math.ceil(848 / Number(await grid.getAttribute('aria-colcount'))),
  );
  const names = new Set();
  let maxTiles = 0;
  const bounds = await grid.boundingBox();
  for (let offset = 0; offset <= bounds.height + 650; offset += 650) {
    await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), bounds.y + offset);
    await settle();
    const visible = await page
      .locator('.icon-tile')
      .evaluateAll((nodes) => nodes.map((node) => node.title));
    for (const name of visible) names.add(name);
    maxTiles = Math.max(maxTiles, visible.length);
  }
  check(
    'Window scrolling reaches every icon',
    [...names].sort(),
    manifest.icons.items.map((icon) => icon.name).sort(),
  );
  check('Mounted tile count stays below 150', maxTiles < 150);
  results.at(-1).peakMountedTiles = maxTiles;
  const last = manifest.icons.items.at(-1).name;
  check('Last icon is reachable', await page.locator(`.icon-tile[title="${last}"]`).count(), 1);
  await page.locator('.site-toc-link[href="#icon-catalog"]').click();
  await page.waitForTimeout(700);
  const first = page.locator('.icon-tile').first();
  await first.focus();
  await first.press('Control+End');
  check(
    'Ctrl+End focuses the final icon',
    await page.evaluate(() => document.activeElement.title),
    last,
  );
  await page.keyboard.press('Control+Home');
  check(
    'Ctrl+Home returns to the first icon',
    await page.evaluate(() => document.activeElement.title),
    manifest.icons.items[0].name,
  );
  await page.keyboard.press('ArrowRight');
  check(
    'Arrow navigation changes focus',
    await page.evaluate(() => document.activeElement.title),
    manifest.icons.items[1].name,
  );
  await page.locator('#icon-search').fill('SearchOutlined');
  await settle();
  check(
    'Name substring search includes FileSearchOutlined and SearchOutlined',
    await page.locator('.icon-tile').evaluateAll((nodes) => nodes.map((node) => node.title)),
    ['FileSearchOutlined', 'SearchOutlined'],
  );
  await page.locator('.icon-tile[title="SearchOutlined"]').click();
  check(
    'Click copies a valid Vue import',
    await page.evaluate(() => navigator.clipboard.readText()),
    "import { SearchOutlined } from '@apollo-design/icons';",
  );
  await page.locator('.icon-copy-mode .apollo-select').click();
  await page.locator('.apollo-select-item-option[title="Vue 标签"]').click();
  await page.locator('.icon-tile[title="SearchOutlined"]').click();
  check(
    'Copy mode changes the snippet',
    await page.evaluate(() => navigator.clipboard.readText()),
    '<SearchOutlined />',
  );
  await page.locator('#icon-search').fill('');
  for (const [label, count] of [
    ['线框风格', 447],
    ['实底风格', 251],
    ['双色风格', 150],
  ]) {
    await page.getByRole('button', { name: new RegExp(label) }).click();
    check(
      `${label} filters the entire dataset`,
      await page.locator('.icon-count').innerText(),
      `共 ${count} 个`,
    );
  }
  await page.getByRole('button', { name: /全部/ }).click();
  await page.locator('#icon-search').fill('no-icon-exists');
  check('Icon empty state', await page.locator('.icon-empty').isVisible());
  await page.locator('#icon-search').fill('');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await settle();
  await page.screenshot({ path: path.join(evidence, 'icon-desktop.png') });
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await go('/components');
    await noOverflow(`${width}px overview does not overflow`);
    check(
      `${width}px overview columns`,
      await page
        .locator('.overview-grid')
        .first()
        .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length),
      width === 390 ? 2 : 3,
    );
    await page.screenshot({ path: path.join(evidence, `overview-${width}.png`) });
    await page.locator('.site-mobile-toggle').click();
    check(`${width}px navigation drawer`, await page.locator('#site-mobile-drawer').isVisible());
    await page.keyboard.press('Escape');
    await go('/components/icon');
    await page.locator('.site-toc').isHidden();
    await noOverflow(`${width}px icon page does not overflow`);
    await page.locator('#icon-search').fill(last);
    await settle();
    check(
      `${width}px last-icon search`,
      await page.locator('.icon-tile').getAttribute('title'),
      last,
    );
    await page.locator('#icon-search').fill('');
    const mobileGrid = page.locator('.virtual-icon-grid');
    const box = await mobileGrid.boundingBox();
    await page.evaluate(
      (y) => window.scrollTo({ top: y, behavior: 'instant' }),
      box.y + box.height - 500,
    );
    await settle();
    check(
      `${width}px virtual last row`,
      await page.locator(`.icon-tile[title="${last}"]`).count(),
      1,
    );
    await page.evaluate(() => window.scrollTo({ top: 650, behavior: 'instant' }));
    await settle();
    await page.screenshot({ path: path.join(evidence, `icon-${width}.png`) });
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await go('/components?lang=en-US');
  check('Overview English title', await page.locator('h1').innerText(), 'Components Overview');
  await go('/components/icon?lang=en-US');
  check('Icon English title', await page.locator('h1').innerText(), 'Icon');
  await page.evaluate(() => localStorage.setItem('apollo-site-theme', 'dark'));
  await go('/components/icon?lang=en-US');
  check('Dark theme', await page.locator('html').getAttribute('data-apollo-theme'), 'dark');
  await page.screenshot({ path: path.join(evidence, 'icon-dark-en.png') });
  await go('/components?lang=en-US');
  await page.screenshot({ path: path.join(evidence, 'overview-dark-en.png') });
  await page.evaluate(() => localStorage.setItem('apollo-site-theme', 'light'));
  await go('/components/button?lang=zh-CN');
  await page.waitForSelector('.demo-canvas .apollo-btn');
  check(
    'Ordinary component demos still render',
    (await page.locator('.demo-canvas .apollo-btn').count()) > 0,
  );
  await page.screenshot({ path: path.join(evidence, 'button-desktop.png') });
  check('No runtime or hydration errors', errors, []);
} finally {
  fs.writeFileSync(path.join(evidence, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(`PASS ${results.length} catalog checks; evidence: ${evidence}`);
