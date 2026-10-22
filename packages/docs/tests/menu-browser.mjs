/**
 * Menu 真实浏览器行为门禁（2026-10-22 专项审计 M-01～M-10）。
 *
 * 与 L6 静态截图互补：L6 看不到 hover 开合、弹层翻转、离场动画、iframe 隔离与
 * 横向 overflow 的运行时状态。本脚本在 Chromium 里逐项驱动鼠标/键盘并断言
 * **可观察的 DOM/几何/类名**，失败即非零退出（供 Docs CI 阻塞门禁使用）。
 *
 * 运行：
 *   DOCS_URL=http://127.0.0.1:4477/apollo-design-ui node packages/docs/tests/menu-browser.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const demo = (id) => `.demo-renderer[data-demo="menu-${id}"]`;
const near = (a, b, tolerance = 3) => Math.abs(a - b) <= tolerance;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(20000);
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});

async function gotoMenu() {
  await page.goto(`${BASE}/components/menu`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(`${demo('horizontal')} .apollo-menu`, { timeout: 30000 });
  await page.waitForTimeout(800);
}

async function hoverTitle(scope, index = 0) {
  const title = page.locator(`${scope} .apollo-menu-submenu-title`).nth(index);
  await title.scrollIntoViewIfNeeded();
  const box = await title.boundingBox();
  if (!box) throw new Error(`找不到 ${scope} 的第 ${index} 个 submenu title`);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
  await page.waitForTimeout(250);
  return { title, box, controls: await title.getAttribute('aria-controls') };
}

try {
  await gotoMenu();

  // ── M-02 / M-04：水平菜单一行、图标在前、group 只在 popup 内 ─────────────
  const horizontal = await page.$$eval(`${demo('horizontal')} .apollo-menu > li`, (items) =>
    items
      .filter((li) => !li.classList.contains('apollo-menu-overflow-item-rest'))
      .map((li) => {
        const rect = li.getBoundingClientRect();
        return {
          text: li.textContent.trim().slice(0, 24),
          y: Math.round(rect.y),
          height: Math.round(rect.height),
          opacity: getComputedStyle(li).opacity,
          cls: li.className,
          firstChild: (li.classList.contains('apollo-menu-submenu')
            ? li.querySelector(':scope > .apollo-menu-submenu-title')
            : li
          )?.firstElementChild?.className,
        };
      }),
  );
  check('M-02 水平顶层 4 项全部可见', horizontal.length === 4, `${horizontal.length} 项`);
  check(
    'M-02 顶层同一行',
    new Set(horizontal.map((item) => item.y)).size === 1 &&
      horizontal.every((item) => item.height === 46),
    JSON.stringify(horizontal.map((item) => [item.y, item.height])),
  );
  check(
    'M-02 顶层没有 group',
    (await page
      .locator(`${demo('horizontal')} .apollo-menu > li.apollo-menu-item-group`)
      .count()) === 0,
  );
  check(
    'M-04 顶层图标在文字之前（前 3 项有图标，链接项无图标）',
    horizontal.slice(0, 3).every((item) => item.firstChild?.includes('apollo-menu-item-icon')) &&
      !horizontal[3]?.firstChild?.includes('apollo-menu-item-icon'),
    JSON.stringify(horizontal.map((item) => item.firstChild)),
  );

  const horizontalHover = await hoverTitle(`${demo('horizontal')}`, 0);
  const horizontalPopup = page.locator(
    `.apollo-menu-submenu-popup:has(ul[id="${horizontalHover.controls}"])`,
  );
  const hPopupBox = await horizontalPopup.boundingBox();
  check('M-06 水平弹层存在', hPopupBox !== null);
  check(
    'M-06 水平弹层 placement=bottomLeft 且贴标题下方',
    hPopupBox !== null &&
      (await horizontalPopup.getAttribute('class')).includes(
        'apollo-menu-submenu-placement-bottomLeft',
      ) &&
      near(hPopupBox.x, horizontalHover.box.x) &&
      near(hPopupBox.y, horizontalHover.box.y + horizontalHover.box.height),
    hPopupBox
      ? `popup=(${Math.round(hPopupBox.x)},${Math.round(hPopupBox.y)}) title=(${Math.round(horizontalHover.box.x)},${Math.round(horizontalHover.box.y + horizontalHover.box.height)})`
      : 'null',
  );
  check(
    'M-02 group 只在弹层内（2 组 / 4 项）',
    (await horizontalPopup.locator('.apollo-menu-item-group').count()) === 2 &&
      (await horizontalPopup.locator('.apollo-menu-item').count()) === 4,
  );
  await page.mouse.move(5, 5);

  // ── M-03：inline 的 hover 不改 openKeys，指针移到子项后仍可点击 ──────────
  const inlineTitle = page
    .locator(`${demo('inline')} .apollo-menu-submenu > .apollo-menu-submenu-title`)
    .first();
  await inlineTitle.scrollIntoViewIfNeeded();
  const inlineTitleBox = await inlineTitle.boundingBox();
  const inlineChild = page
    .locator(`${demo('inline')} .apollo-menu-submenu-open .apollo-menu-item`)
    .first();
  const inlineChildBox = await inlineChild.boundingBox();
  await page.mouse.move(
    inlineTitleBox.x + inlineTitleBox.width / 2,
    inlineTitleBox.y + inlineTitleBox.height / 2,
    { steps: 5 },
  );
  await page.mouse.move(
    inlineChildBox.x + inlineChildBox.width / 2,
    inlineChildBox.y + inlineChildBox.height / 2,
    { steps: 8 },
  );
  await page.waitForTimeout(300);
  check(
    'M-03 inline 移到子项后仍展开',
    (await inlineTitle.getAttribute('aria-expanded')) === 'true',
  );
  await inlineChild.click();
  await page.waitForTimeout(100);
  check(
    'M-03 子项可点击并选中',
    (await inlineChild.getAttribute('class')).includes('apollo-menu-item-selected'),
  );
  await inlineTitle.click();
  await page.waitForTimeout(200);
  check('M-03 再次点击父标题才收起', (await inlineTitle.getAttribute('aria-expanded')) === 'false');

  // ── M-06 / M-07：垂直弹层几何、移入保活、离场动画 ──────────────────────
  const verticalHover = await hoverTitle(`${demo('vertical')}`, 0);
  const verticalPopup = page.locator(
    `.apollo-menu-submenu-popup:has(ul[id="${verticalHover.controls}"])`,
  );
  const vPopupBox = await verticalPopup.boundingBox();
  check('M-06 垂直弹层存在', vPopupBox !== null);
  check(
    'M-06 垂直弹层 placement=rightTop 且贴标题右侧',
    vPopupBox !== null &&
      (await verticalPopup.getAttribute('class')).includes(
        'apollo-menu-submenu-placement-rightTop',
      ) &&
      near(vPopupBox.x, verticalHover.box.x + verticalHover.box.width) &&
      near(vPopupBox.y, verticalHover.box.y),
    vPopupBox
      ? `popup=(${Math.round(vPopupBox.x)},${Math.round(vPopupBox.y)}) titleRight=${Math.round(verticalHover.box.x + verticalHover.box.width)}`
      : 'null',
  );
  await page.mouse.move(vPopupBox.x + vPopupBox.width / 2, vPopupBox.y + vPopupBox.height / 2, {
    steps: 8,
  });
  await page.waitForTimeout(250);
  check(
    'M-03/M-06 移入弹层后保持展开',
    (await verticalHover.title.getAttribute('aria-expanded')) === 'true',
  );
  // 滚动跟随：弹层与标题一起位移
  const beforeScroll = {
    title: await verticalHover.title.boundingBox(),
    popup: await verticalPopup.boundingBox(),
  };
  await page.mouse.move(5, 5);
  await page.waitForTimeout(150);
  const leaveClass = (await verticalPopup.getAttribute('class')) ?? '';
  check(
    'M-07 离场先出现 zoom-big-leave（不是同帧删除）',
    leaveClass.includes('apollo-zoom-big-leave') ||
      leaveClass.includes('apollo-menu-submenu-hidden'),
    leaveClass,
  );
  await page.waitForTimeout(500);
  check(
    'M-07 动画结束后隐藏（-hidden）或卸载',
    (await verticalPopup.count()) === 0 ||
      ((await verticalPopup.getAttribute('class')) ?? '').includes('apollo-menu-submenu-hidden'),
  );
  // 重开
  await hoverTitle(`${demo('vertical')}`, 0);
  check('M-07 离场后可再次打开', (await verticalPopup.count()) === 1);

  // 滚动跟随
  await page.evaluate(() => window.scrollBy(0, 120));
  await page.waitForTimeout(200);
  const afterScroll = {
    title: await verticalHover.title.boundingBox(),
    popup: await verticalPopup.boundingBox(),
  };
  check(
    'M-06 滚动后弹层跟随标题',
    beforeScroll.title &&
      beforeScroll.popup &&
      afterScroll.title &&
      afterScroll.popup &&
      near(afterScroll.title.y - beforeScroll.title.y, -120, 5) &&
      near(afterScroll.popup.y - beforeScroll.popup.y, -120, 5),
    `${Math.round(afterScroll.popup?.y ?? 0) - Math.round(beforeScroll.popup?.y ?? 0)}`,
  );
  await page.evaluate(() => window.scrollTo(0, 0));

  // ── M-05 / M-09：getPopupContainer + 子菜单独立主题 ────────────────────
  const subTheme = `${demo('submenu-theme')}`;
  await page.locator(subTheme).scrollIntoViewIfNeeded();
  const popupInsideDemo = await page.evaluate((selector) => {
    const root = document.querySelector(selector);
    const popup = root?.querySelector('.apollo-menu-submenu-popup');
    return !!popup;
  }, subTheme);
  check('M-05 getPopupContainer 把弹层挂回 demo 容器', popupInsideDemo);
  const beforeTheme = await page.$eval(
    `${subTheme} .apollo-menu-submenu-popup`,
    (el) => el.className,
  );
  await page.locator(`${subTheme} .apollo-switch`).click();
  await page.waitForTimeout(300);
  const afterTheme = await page.$eval(
    `${subTheme} .apollo-menu-submenu-popup`,
    (el) => el.className,
  );
  check(
    'M-09 子菜单主题独立切换',
    beforeTheme.includes('apollo-menu-light') && afterTheme.includes('apollo-menu-dark'),
    `${beforeTheme} → ${afterTheme}`,
  );

  // ── M-01：Sider demo 必须进 iframe，父页面不得出现固定 trigger ──────────
  const siderFrame = page.locator('iframe[src*="menu/demo/sider-current"]');
  check('M-01 sider-current 使用独立视口 iframe', (await siderFrame.count()) === 1);
  check(
    'M-01 父页面无 Sider fixed trigger',
    (await page.locator('.apollo-layout-sider-trigger').count()) === 0,
  );
  if ((await siderFrame.count()) === 1) {
    const frame = page.frameLocator('iframe[src*="menu/demo/sider-current"]');
    await frame.locator('.apollo-layout-sider-trigger').waitFor({ timeout: 15000 });
    check(
      'M-01 iframe 内有且仅有一个 Sider trigger',
      (await frame.locator('.apollo-layout-sider-trigger').count()) === 1,
    );
  }

  // ── M-08：横向 overflow 在 390/768/1440 之间往返不丢项 ─────────────────
  const visibleTopItems = async () =>
    page.$$eval(`${demo('horizontal')} .apollo-menu > li`, (items) =>
      items
        .filter((li) => !li.classList.contains('apollo-menu-overflow-item-rest'))
        .map((li) => ({
          text: li.textContent.trim().slice(0, 20),
          opacity: getComputedStyle(li).opacity,
        })),
    );
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(500);
  const narrow = await visibleTopItems();
  check(
    'M-08 390 只有首项可见且四项仍在 DOM',
    narrow.length === 4 && narrow.filter((item) => item.opacity === '1').length === 1,
    JSON.stringify(narrow.map((item) => item.opacity)),
  );
  const restTitle = page.locator(
    `${demo('horizontal')} .apollo-menu-overflow-item-rest > .apollo-menu-submenu-title`,
  );
  await restTitle.scrollIntoViewIfNeeded();
  const restBox = await restTitle.boundingBox();
  await page.mouse.move(restBox.x + restBox.width / 2, restBox.y + restBox.height / 2, {
    steps: 5,
  });
  await page.waitForTimeout(350);
  const restPopup = page.locator(
    `.apollo-menu-submenu-popup:has(ul[id="${await restTitle.getAttribute('aria-controls')}"])`,
  );
  const restText = (await restPopup.innerText().catch(() => '')) ?? '';
  check(
    'M-08 更多菜单包含被省略项（且顺序一致）',
    restText.includes('Navigation Two') &&
      restText.indexOf('Navigation Two') < restText.indexOf('Navigation Three') &&
      restText.indexOf('Navigation Three') < restText.indexOf('Navigation Four'),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(600);
  const wide = await visibleTopItems();
  check(
    'M-08 回到 1440 四项全部恢复且无重复',
    wide.length === 4 && wide.every((item) => item.opacity === '1'),
    JSON.stringify(wide.map((item) => item.opacity)),
  );

  // ── M-10：中英文 demo 标题/描述同步 ────────────────────────────────────
  await page.locator('.site-lang-toggle').click();
  await page
    .waitForFunction(
      () => document.body.innerText.includes('Horizontal top navigation menu.'),
      null,
      {
        timeout: 10000,
      },
    )
    .catch(() => {});
  const enTitle = (await page.locator('#demo-horizontal-title').innerText()).trim();
  check('M-10 en-US 标题正确', enTitle.startsWith('Horizontal'), enTitle);
  check(
    'M-10 en-US 描述正确',
    (await page.locator('#demo-horizontal').innerText()).includes(
      'Horizontal top navigation menu.',
    ),
  );
  await page.locator('.site-lang-toggle').click();
  await page
    .waitForFunction(() => document.body.innerText.includes('水平的顶部导航菜单。'), null, {
      timeout: 10000,
    })
    .catch(() => {});
  check(
    'M-10 zh-CN 标题/描述正确',
    (await page.locator('#demo-horizontal-title').innerText()).includes('水平导航') &&
      (await page.locator('#demo-horizontal').innerText()).includes('水平的顶部导航菜单。'),
  );
} catch (error) {
  check('脚本执行', false, error instanceof Error ? error.message : String(error));
} finally {
  if (consoleErrors.length > 0) {
    check('控制台无错误', false, consoleErrors.slice(0, 3).join(' | '));
  }
  await browser.close();
}

const failed = results.filter((result) => !result.ok);
console.log(`\n[menu-browser] ${results.length - failed.length}/${results.length} 通过`);
if (failed.length > 0) {
  process.exitCode = 1;
}
