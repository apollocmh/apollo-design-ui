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
import { launchBrowser } from '../../../tests/visual/stabilize.mjs';

const BASE = process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const demo = (id) => `.demo-renderer[data-demo="menu-${id}"]`;
const near = (a, b, tolerance = 3) => Math.abs(a - b) <= tolerance;

const { browser } = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(20000);
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});

async function gotoMenu() {
  await page.goto(`${BASE}/components/menu`, { waitUntil: 'networkidle' });
  await page.locator(demo('horizontal')).scrollIntoViewIfNeeded();
  await page.waitForSelector(`${demo('horizontal')} .apollo-menu`, { timeout: 30000 });
  await page.waitForTimeout(800);
}

async function hoverTitle(scope, index = 0) {
  // 屏外示例尚未挂载，先激活卡片，再定位其菜单内容。
  await page.locator(scope).scrollIntoViewIfNeeded();
  const title = page.locator(`${scope} .apollo-menu-submenu-title`).nth(index);
  // hover 的 actionability 等待真实标题布局稳定，避免懒挂载/滚动锚定后的旧坐标。
  await title.hover();
  return { title, controls: await title.getAttribute('aria-controls') };
}

async function waitForPopupLayout(title, popup) {
  const state = await page.evaluateHandle(
    ({ title, popup }) => ({ title, popup, previous: null }),
    { title: await title.elementHandle(), popup: await popup.elementHandle() },
  );
  try {
    await page.waitForFunction((state) => {
      const { title, popup } = state;
      if (
        !title.isConnected ||
        !popup.isConnected ||
        title.getAttribute('aria-expanded') !== 'true' ||
        /apollo-(?:zoom-big|slide-up)-(?:appear|enter|leave)(?:\s|-|$)/.test(popup.className) ||
        popup
          .getAnimations()
          .some((animation) => animation.playState === 'running' || animation.pending)
      ) {
        state.previous = null;
        return false;
      }
      const popupRect = popup.getBoundingClientRect();
      const current =
        popupRect.width && popupRect.height
          ? JSON.stringify([title.getBoundingClientRect().toJSON(), popupRect.toJSON(), scrollY])
          : null;
      const stable = current !== null && current === state.previous;
      state.previous = current;
      return stable;
    }, state);
  } finally {
    await state.dispose();
  }
}

// Read both rectangles in one layout snapshot after hover/lazy Demo updates.
async function popupGeometry(title, popup) {
  return title.evaluate(
    (title, popup) => ({
      title: title.getBoundingClientRect().toJSON(),
      popup: popup?.getBoundingClientRect().toJSON() ?? null,
      popupClass: popup?.getAttribute('class') ?? '',
    }),
    await popup.elementHandle(),
  );
}

const popupContainsPoint = (popup, point) =>
  popup.evaluate(
    (node, { x, y }) => node.contains(node.ownerDocument.elementFromPoint(x, y)),
    point,
  );

async function observeExpansionDuring(title, action) {
  const observation = await title.evaluateHandle((title) => {
    let stayedOpen = title.getAttribute('aria-expanded') === 'true';
    const inspect = (records) => {
      // oldValue 捕获同一批次内 false → true，最终值不能抹掉中途关闭。
      if (
        title.getAttribute('aria-expanded') !== 'true' ||
        records.some((record) => record.oldValue === 'false')
      ) {
        stayedOpen = false;
      }
    };
    const observer = new MutationObserver(inspect);
    observer.observe(title, {
      attributes: true,
      attributeFilter: ['aria-expanded'],
      attributeOldValue: true,
    });
    return () => {
      inspect(observer.takeRecords());
      observer.disconnect();
      return stayedOpen;
    };
  });
  let result;
  let stayedOpen;
  try {
    result = await action();
  } finally {
    stayedOpen = await observation.evaluate((stop) => stop());
    await observation.dispose();
  }
  return { result, stayedOpen };
}

async function moveIntoVerticalPopup(popup, geometry) {
  const sharedTop = Math.max(geometry.title.top, geometry.popup.top);
  const sharedBottom = Math.min(geometry.title.bottom, geometry.popup.bottom);
  if (sharedBottom <= sharedTop)
    throw new Error(`标题与垂直弹层没有可移入的共同边界：${JSON.stringify(geometry)}`);
  const y = (sharedTop + sharedBottom) / 2;
  // 先留在当前标题内横移，再跨过相邻边界；直奔弹层中心会先 hover 到兄弟标题。
  await page.mouse.move(geometry.title.right - 4, y, { steps: 4 });
  await page.mouse.move(geometry.popup.left + 16, y, { steps: 4 });
  const point = {
    x: geometry.popup.x + geometry.popup.width / 2,
    y: geometry.popup.y + geometry.popup.height / 2,
  };
  await page.mouse.move(point.x, point.y, { steps: 4 });
  return popupContainsPoint(popup, point);
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
  await waitForPopupLayout(horizontalHover.title, horizontalPopup);
  const {
    title: hTitleBox,
    popup: hPopupBox,
    popupClass: hPopupClass,
  } = await popupGeometry(horizontalHover.title, horizontalPopup);
  check('M-06 水平弹层存在', hPopupBox !== null);
  check(
    'M-06 水平弹层 placement=bottomLeft 且贴标题下方',
    hPopupBox !== null &&
      hPopupClass.includes('apollo-menu-submenu-placement-bottomLeft') &&
      near(hPopupBox.x, hTitleBox.x) &&
      near(hPopupBox.y, hTitleBox.y + hTitleBox.height),
    hPopupBox
      ? `popup=(${Math.round(hPopupBox.x)},${Math.round(hPopupBox.y)}) title=(${Math.round(hTitleBox.x)},${Math.round(hTitleBox.y + hTitleBox.height)})`
      : 'null',
  );
  check(
    'M-02 group 只在弹层内（2 组 / 4 项）',
    (await horizontalPopup.locator('.apollo-menu-item-group').count()) === 2 &&
      (await horizontalPopup.locator('.apollo-menu-item').count()) === 4,
  );
  await page.mouse.move(5, 5);

  // ── M-03：inline 的 hover 不改 openKeys，指针移到子项后仍可点击 ──────────
  await page.locator(demo('inline')).scrollIntoViewIfNeeded();
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
  await waitForPopupLayout(verticalHover.title, verticalPopup);
  const initialGeometry = await popupGeometry(verticalHover.title, verticalPopup);
  const initialPopupBox = initialGeometry.popup;
  check('M-06 垂直弹层存在', initialPopupBox !== null);
  // Demo 默认已打开，首次可能保留近视口边缘时的合法翻转；rightTop 在下方新会话验证。
  const { result: enteredPopup, stayedOpen: stayedOpenEntering } = await observeExpansionDuring(
    verticalHover.title,
    async () => {
      const enteredPopup = await moveIntoVerticalPopup(verticalPopup, initialGeometry);
      await page.waitForTimeout(250);
      return enteredPopup;
    },
  );
  check(
    'M-03/M-06 移入弹层后保持展开',
    enteredPopup &&
      stayedOpenEntering &&
      (await verticalHover.title.getAttribute('aria-expanded')) === 'true',
  );
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
  const reopenedHover = await hoverTitle(`${demo('vertical')}`, 0);
  await waitForPopupLayout(reopenedHover.title, verticalPopup);
  check('M-07 离场后可再次打开', (await verticalPopup.count()) === 1);
  const {
    title: vTitleBox,
    popup: vPopupBox,
    popupClass: vPopupClass,
  } = await popupGeometry(reopenedHover.title, verticalPopup);
  check(
    'M-06 垂直弹层 placement=rightTop 且贴标题右侧',
    vPopupBox !== null &&
      vPopupClass.includes('apollo-menu-submenu-placement-rightTop') &&
      near(vPopupBox.x, vTitleBox.x + vTitleBox.width) &&
      near(vPopupBox.y, vTitleBox.y),
    vPopupBox
      ? `popup=(${Math.round(vPopupBox.x)},${Math.round(vPopupBox.y)}) titleRight=${Math.round(vTitleBox.x + vTitleBox.width)} titleY=${Math.round(vTitleBox.y)}`
      : 'null',
  );

  // 末尾示例可能已在页面下边界，按真实余量选择可发生位移的方向。
  const scrollPlan = await page.evaluate(() => {
    const max = Math.max(0, document.scrollingElement.scrollHeight - innerHeight);
    const down = Math.min(120, max - scrollY);
    const up = Math.min(120, scrollY);
    return { y: scrollY, max, delta: down >= up ? down : -up };
  });
  // 入场缩放会改变 bbox，必须在完成后求前后弹层的交集，才能验证滚动保活。
  const sharedTop = Math.max(vPopupBox.top, vPopupBox.top - scrollPlan.delta);
  const sharedBottom = Math.min(vPopupBox.bottom, vPopupBox.bottom - scrollPlan.delta);
  if (sharedBottom - sharedTop <= 16) throw new Error('滚动前后弹层没有足够的指针交集');
  const scrollPointer = { x: vPopupBox.x + 16, y: (sharedTop + sharedBottom) / 2 };
  await moveIntoVerticalPopup(verticalPopup, { title: vTitleBox, popup: vPopupBox });
  await page.mouse.move(scrollPointer.x, scrollPointer.y, { steps: 4 });
  const insideBeforeScroll = await popupContainsPoint(verticalPopup, scrollPointer);
  const beforeScroll = await popupGeometry(reopenedHover.title, verticalPopup);
  const { stayedOpen: stayedOpenScrolling } = await observeExpansionDuring(
    reopenedHover.title,
    async () => {
      await page.evaluate((top) => window.scrollBy({ top, behavior: 'instant' }), scrollPlan.delta);
      await waitForPopupLayout(reopenedHover.title, verticalPopup);
    },
  );
  const afterScroll = await popupGeometry(reopenedHover.title, verticalPopup);
  const afterScrollY = await page.evaluate(() => scrollY);
  const stillOpen = (await reopenedHover.title.getAttribute('aria-expanded')) === 'true';
  check(
    'M-06 滚动后弹层跟随标题',
    Math.abs(afterScrollY - scrollPlan.y) > 5 &&
      stillOpen &&
      stayedOpenScrolling &&
      insideBeforeScroll &&
      (await popupContainsPoint(verticalPopup, scrollPointer)) &&
      beforeScroll.title &&
      beforeScroll.popup &&
      afterScroll.title &&
      afterScroll.popup &&
      (scrollPlan.delta > 0
        ? afterScroll.title.y < beforeScroll.title.y - 5
        : afterScroll.title.y > beforeScroll.title.y + 5) &&
      // 邻近 Demo 挂载会触发滚动锚定；跟随量应等于标题的实际位移。
      near(
        afterScroll.popup.y - beforeScroll.popup.y,
        afterScroll.title.y - beforeScroll.title.y,
        5,
      ),
    JSON.stringify({
      scrollPlan,
      afterScrollY,
      stillOpen,
      stayedOpenScrolling,
      scrollPointer,
      before: beforeScroll,
      after: afterScroll,
    }),
  );
  await page.evaluate(() => window.scrollTo(0, 0));

  // ── M-05 / M-09：getPopupContainer + 子菜单独立主题 ────────────────────
  const subTheme = `${demo('submenu-theme')}`;
  await page.locator(subTheme).scrollIntoViewIfNeeded();
  await page.locator(`${subTheme} .apollo-menu-submenu-popup`).waitFor();
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
  await siderFrame.scrollIntoViewIfNeeded();
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
  await page.locator(demo('horizontal')).scrollIntoViewIfNeeded();
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
