/** Issue #86/#87: production navigation, independent Demo columns, iframe and theme gallery. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser } from '../../../tests/visual/stabilize.mjs';

const base = (process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui').replace(/\/$/, '');
const evidenceDir = process.env.DOCS_EVIDENCE_DIR ?? '/tmp/apollo-issue86-site';
fs.mkdirSync(evidenceDir, { recursive: true });
const manifest = JSON.parse(
  fs.readFileSync(new URL('../.generated/manifest.json', import.meta.url), 'utf8'),
);
const results = [];
const pages = [];
const errors = [];
const { browser } = await launchBrowser();
function check(name, value, expected = true) {
  assert.deepEqual(value, expected, name);
  results.push({ name, value });
  console.log(`PASS ${name}`);
}
async function settle(page) {
  await page.waitForTimeout(160);
}
async function geometry(page) {
  return page.locator('.demo-preview').evaluateAll((cards) =>
    cards.slice(0, 6).map((card) => {
      const box = card.getBoundingClientRect();
      return {
        id: card.id,
        x: box.x,
        y: box.y + scrollY,
        h: box.height,
        bottom: box.bottom + scrollY,
      };
    }),
  );
}
async function noOverflow(page, label) {
  check(label, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
}

try {
  for (const mode of ['light', 'dark']) {
    const context = await browser.newContext({
      viewport: { width: 1600, height: 1000 },
      reducedMotion: 'reduce',
    });
    await context.addInitScript(
      ({ mode }) => {
        localStorage.setItem('apollo-site-theme', mode);
        localStorage.setItem('apollo-site-locale', 'zh-CN');
      },
      { mode },
    );
    const page = await context.newPage();
    page.on('pageerror', (error) => errors.push(error.message));
    const routes = [
      '/',
      '/components',
      ...manifest.guides.map((guide) => `/guide/${guide.slug}`),
      '/components/icon',
      '/changelog',
    ];
    for (const width of [1600, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of routes) {
        await page.goto(`${base}${route}`, { waitUntil: 'networkidle' });
        await page.locator('h1').first().waitFor();
        await settle(page);
        check(`${mode}/${width}${route}: one page title`, await page.locator('h1').count(), 1);
        await noOverflow(page, `${mode}/${width}${route}: no page overflow`);
        check(
          `${mode}/${width}${route}: no error state`,
          await page.locator('.page-error, .demo-renderer-error').count(),
          0,
        );
        pages.push({
          route,
          mode,
          width,
          checked: ['title', 'render', 'overflow', 'navigation context'],
        });
      }
    }

    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto(`${base}/components/button`, { waitUntil: 'networkidle' });
    await page.locator('.demo-canvas .apollo-btn').first().waitFor();
    await settle(page);
    check(
      `${mode}: top navigation`,
      await page
        .locator('.site-topbar-nav a')
        .allTextContents()
        .then((items) => items.map((text) => text.trim())),
      ['文档', '组件', '图标'],
    );
    check(
      `${mode}: component sidebar excludes guides`,
      await page.locator('.site-sidebar a[href$="/guide/getting-started"]').count(),
      0,
    );
    check(
      `${mode}: every Demo is a TOC child`,
      await page.locator('.site-toc-link.l3[href^="#demo-"]').count(),
      await page.locator('.demo-preview').count(),
    );
    await page.evaluate(() => {
      window.issue86Card = document.querySelector('.demo-preview');
    });
    const before = await geometry(page);
    check(
      `${mode}: two independent columns`,
      before[0].x !== before[1].x &&
        Math.abs(before[2].y - before[0].bottom - 24) < 2 &&
        Math.abs(before[3].y - before[1].bottom - 24) < 2,
    );
    await page.locator('#demo-basic .demo-tool-btn').filter({ hasText: '展开代码' }).click();
    await page.locator('#demo-basic .demo-source-code').waitFor();
    await settle(page);
    const expanded = await geometry(page);
    check(
      `${mode}: source expansion only moves its own column`,
      expanded[2].y > before[2].y && Math.abs(expanded[3].y - before[3].y) < 2,
    );
    check(
      `${mode}: displayed source uses public package`,
      (await page.locator('#demo-basic .demo-source-code').innerText()).includes(
        '@apollo-design/ui',
      ),
    );
    await page.locator('#demo-basic .demo-tool-btn').filter({ hasText: '收起代码' }).click();
    await settle(page);
    await page.locator('.site-toc-link[href="#demo-disabled"]').click();
    await settle(page);
    check(`${mode}: old Demo hash`, new URL(page.url()).hash, '#demo-disabled');
    check(
      `${mode}: Demo anchor visible`,
      await page.locator('#demo-disabled').evaluate((card) => {
        const box = card.getBoundingClientRect();
        return box.top >= 60 && box.top < innerHeight;
      }),
    );
    await page.goto(`${base}/components/button#demo-multiple`, { waitUntil: 'networkidle' });
    await page.locator('#demo-multiple .apollo-btn').first().waitFor();
    await page.reload({ waitUntil: 'networkidle' });
    await page.locator('#demo-multiple .apollo-btn').first().waitFor();
    await settle(page);
    check(
      `${mode}: refreshed Demo deep link remains visible`,
      await page.locator('#demo-multiple').evaluate((card) => {
        const box = card.getBoundingClientRect();
        return box.top >= 60 && box.top < innerHeight;
      }),
    );
    await page.evaluate(() => {
      window.issue86Card = document.querySelector('.demo-preview');
    });
    await page.screenshot({ path: path.join(evidenceDir, `button-${mode}.png`) });
    await page.setViewportSize({ width: 390, height: 1000 });
    await settle(page);
    check(
      `${mode}: narrow screen has one column`,
      await page
        .locator('.demos-grid')
        .evaluate((grid) => getComputedStyle(grid).gridTemplateColumns.split(' ').length),
      1,
    );
    check(
      `${mode}: responsive change preserves card instance`,
      await page.evaluate(() => window.issue86Card === document.querySelector('.demo-preview')),
    );
    await noOverflow(page, `${mode}: narrow Demo page stays inside viewport`);
    await page.getByRole('button', { name: '导航菜单', exact: true }).click();
    await page.locator('#site-mobile-drawer').waitFor();
    check(
      `${mode}: mobile sections`,
      await page.locator('#site-mobile-drawer .site-mobile-sections a').count(),
      3,
    );
    await page
      .locator('#site-mobile-drawer .site-mobile-sections a')
      .filter({ hasText: '文档' })
      .click();
    await page.locator('.guide-title').waitFor();
    await page.getByRole('button', { name: '导航菜单', exact: true }).click();
    check(
      `${mode}: docs drawer excludes component catalog`,
      await page.locator('#site-mobile-drawer a[href$="/components/button"]').count(),
      0,
    );
    check(
      `${mode}: docs drawer links themes`,
      await page.locator('#site-mobile-drawer a[href$="/guide/themes"]').count(),
      1,
    );
    await page.keyboard.press('Escape');
    check(
      `${mode}: Escape closes drawer and restores focus`,
      (await page.locator('#site-mobile-drawer').count()) === 0 &&
        (await page
          .locator('.site-mobile-toggle')
          .evaluate((button) => button === document.activeElement)),
    );
    await page.setViewportSize({ width: 1600, height: 1000 });
    await page.goto(`${base}/guide/icons.html?lang=en-US`, { waitUntil: 'networkidle' });
    check(
      `${mode}: legacy html path redirects`,
      new URL(page.url()).pathname.endsWith('/guide/icons'),
    );
    check(
      `${mode}: icon section active in English`,
      (await page.locator('.site-topbar-nav [aria-current="page"]').innerText()).trim(),
      'Icons',
    );
    check(
      `${mode}: icon guide and API mutually linked`,
      await page.locator('.site-sidebar a[href$="/components/icon"]').count(),
      1,
    );
    await page.locator('.site-topbar-nav a').filter({ hasText: 'Docs' }).click();
    await page.locator('.guide-title').waitFor();
    await page.goBack({ waitUntil: 'networkidle' });
    check(
      `${mode}: history restores icon section`,
      (await page.locator('.site-topbar-nav [aria-current="page"]').innerText()).trim(),
      'Icons',
    );
    await page.goForward({ waitUntil: 'networkidle' });
    check(
      `${mode}: history restores docs section`,
      (await page.locator('.site-topbar-nav [aria-current="page"]').innerText()).trim(),
      'Docs',
    );

    await page.goto(`${base}/guide/themes`, { waitUntil: 'networkidle' });
    await page.locator('.theme-preview').first().waitFor();
    check(`${mode}: six theme scopes`, await page.locator('.theme-preview').count(), 6);
    check(
      `${mode}: gallery is three by two`,
      await page.locator('.theme-preview').evaluateAll((cards) => {
        const boxes = cards.map((card) => card.getBoundingClientRect());
        return (
          boxes.slice(0, 3).every((box) => Math.abs(box.y - boxes[0].y) < 1) &&
          boxes.slice(3).every((box) => box.y > boxes[0].y)
        );
      }),
    );
    for (const card of await page.locator('.theme-preview').all()) {
      await card.locator('input').fill('Theme interaction');
      const switchControl = card.getByRole('switch');
      const original = await switchControl.getAttribute('aria-checked');
      await switchControl.click();
      await card.getByRole('button').first().click();
      check(
        `${mode}: theme primary action updates progress`,
        await card.getByRole('progressbar').getAttribute('aria-valuenow'),
        '76',
      );
      await card.getByRole('button').nth(1).click();
      check(
        `${mode}: theme reset restores progress`,
        await card.getByRole('progressbar').getAttribute('aria-valuenow'),
        '64',
      );
      check(
        `${mode}: isolated ${await card.getAttribute('data-preview-preset')}/${await card.getAttribute('data-preview-appearance')} controls`,
        (await switchControl.getAttribute('aria-checked')) !== original,
      );
    }
    await page.screenshot({ path: path.join(evidenceDir, `themes-${mode}.png`), fullPage: true });
    await page.goto(`${base}/components/input`, { waitUntil: 'networkidle' });
    const input = page.locator('#demo-basic input').first();
    await input.fill('state survives layout');
    await input.focus();
    await page.evaluate(() => {
      window.issue86Input = document.activeElement;
    });
    await page.setViewportSize({ width: 390, height: 1000 });
    await settle(page);
    check(
      `${mode}: resize preserves input and focus`,
      (await input.inputValue()) === 'state survives layout' &&
        (await page.evaluate(() => window.issue86Input === document.activeElement)),
    );
    await page.setViewportSize({ width: 1600, height: 1000 });
    await settle(page);
    await page.locator('.demos-toolbar .apollo-segmented-item').filter({ hasText: '单列' }).click();
    await settle(page);
    check(
      `${mode}: single-column mode preserves input`,
      await input.inputValue(),
      'state survives layout',
    );
    check(
      `${mode}: no responsive card recreation`,
      await input.evaluate((element) => element === window.issue86Input),
    );

    await page.goto(`${base}/components/collapse`, { waitUntil: 'networkidle' });
    await page.locator('#demo-basic .apollo-collapse-header').first().waitFor();
    await settle(page);
    const collapseBefore = await geometry(page);
    await page.locator('#demo-basic .apollo-collapse-header').first().click();
    await page.waitForTimeout(400);
    const collapseAfter = await geometry(page);
    check(
      `${mode}: dynamic content updates its independent column`,
      Math.abs(collapseAfter[0].h - collapseBefore[0].h) > 2 &&
        Math.abs(collapseAfter[2].y - collapseAfter[0].bottom - 24) < 2,
    );

    await page.goto(`${base}/components/layout#demo-basic`, { waitUntil: 'networkidle' });
    await page.locator('#demo-basic iframe').waitFor();
    const frame = page.frameLocator('#demo-basic iframe');
    await frame.locator('.apollo-layout').first().waitFor();
    check(
      `${mode}: Layout uses a Mac window`,
      await page.locator('#demo-basic .demo-viewport-dots i').count(),
      3,
    );
    check(
      `${mode}: Layout has its own document`,
      await page.locator('#demo-basic .demo-canvas .apollo-layout').count(),
      0,
    );
    await page.locator('#demo-basic').scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(evidenceDir, `layout-${mode}.png`) });
    await noOverflow(page, `${mode}: iframe Layout stays within documentation`);

    // Issue #86: a positive global transition duration animated temporary
    // measurement coordinates and left popups thousands of pixels offscreen.
    await page.setViewportSize({ width: 390, height: 960 });
    for (const [component, demo, selector] of [
      ['cascader', 'style-class', '.apollo-cascader-dropdown'],
      ['select', 'basic', '.apollo-select-dropdown'],
      ['tree-select', 'basic', '.apollo-tree-select-dropdown'],
    ]) {
      await page.goto(`${base}/components/${component}/demo/${demo}?theme=${mode}`, {
        waitUntil: 'networkidle',
      });
      await page.getByRole('combobox').first().click();
      const popup = page.locator(selector).first();
      await popup.waitFor({ state: 'visible' });
      await page.waitForTimeout(240);
      check(
        `${mode}: reduced-motion ${component} popup remains in its viewport`,
        await popup.evaluate((element) => {
          const rect = element.getBoundingClientRect();
          return rect.left >= 0 && rect.right <= innerWidth + 1 && rect.top >= 0;
        }),
      );
      await noOverflow(page, `${mode}: reduced-motion ${component} has no page overflow`);
      await page.keyboard.press('Escape');
    }
    await context.close();
  }
  const noJsContext = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1600, height: 1000 },
  });
  const noJsPage = await noJsContext.newPage();
  await noJsPage.goto(`${base}/components/button`, { waitUntil: 'networkidle' });
  check('SSR without JavaScript keeps document content', await noJsPage.locator('h1').count(), 1);
  check(
    'SSR without JavaScript keeps all Demo cards',
    await noJsPage.locator('.demo-preview').count(),
    20,
  );
  check(
    'SSR without JavaScript keeps readable grid fallback',
    await noJsPage.locator('.demos-grid').evaluate((grid) => {
      const style = getComputedStyle(grid);
      return (
        style.display === 'grid' &&
        style.rowGap === '24px' &&
        getComputedStyle(grid.children[0]).position !== 'absolute'
      );
    }),
  );
  await noJsPage.screenshot({ path: path.join(evidenceDir, 'button-no-js.png') });
  await noJsContext.close();
  check('No browser page errors', errors, []);
} finally {
  fs.writeFileSync(
    path.join(evidenceDir, 'site-coverage.json'),
    JSON.stringify({ base, pages, results, errors }, null, 2),
  );
  await browser.close();
}
