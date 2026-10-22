/**
 * Message / Notification 入离场与堆叠动效门禁（2026-10-22 专项审计 MN-01～MN-06）。
 *
 * 覆盖 L6 静态截图看不到的事件流：
 *   · appear/enter/leave 的 class 时间线与 transitionend；
 *   · 4 条通知折叠 → hover 展开 → 移出恢复；
 *   · hover 展开时关闭最新一条，余条不卡死；
 *   · Message 默认不堆叠 / 显式 stack 的折叠行为；
 *   · 同 key 更新不产生重复通知或 0 高度。
 *
 * 运行：
 *   DOCS_URL=http://127.0.0.1:4477/apollo-design-ui node packages/docs/tests/notification-motion-browser.mjs
 */
import { chromium } from 'playwright';

const BASE = process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✅' : '❌'} ${name}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(20000);
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});

const notice = (index) =>
  page.locator(
    `.apollo-notification-list .apollo-notification-notice[data-notification-index="${index}"]`,
  );
const listState = () =>
  page.evaluate(() => {
    const list = document.querySelector('.apollo-notification-list');
    const content = list?.querySelector('.apollo-notification-list-content');
    const notices = [...(list?.querySelectorAll('.apollo-notification-notice') ?? [])];
    return {
      className: list?.className ?? '',
      contentHeight: content?.getBoundingClientRect().height ?? 0,
      notices: notices.map((node) => ({
        index: Number(node.getAttribute('data-notification-index')),
        opacity: getComputedStyle(node).opacity,
        y: getComputedStyle(node).getPropertyValue('--notification-y'),
        height: node.getBoundingClientRect().height,
      })),
    };
  });

async function gotoTab(tab) {
  await page.goto(`${BASE}/components/${tab}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector(`.demo-renderer[data-demo="${tab}-stack"] .apollo-btn`, {
    timeout: 30000,
  });
  await page.waitForTimeout(600);
}

async function openStackDemo(count) {
  const button = page.locator('.demo-renderer[data-demo="notification-stack"] .apollo-btn').first();
  await button.scrollIntoViewIfNeeded();
  for (let i = 0; i < count; i += 1) {
    await button.click();
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(500);
}

try {
  // ── MN-04 / MN-05：单条通知的 appear → leave 时间线 ────────────────────
  await gotoTab('notification');
  await page.evaluate(() => {
    window.__motionEnds = [];
    for (const type of ['transitionend', 'animationend']) {
      document.addEventListener(
        type,
        (event) => {
          const target = event.target;
          if (
            target instanceof HTMLElement &&
            target.classList.contains('apollo-notification-notice')
          ) {
            window.__motionEnds.push({
              type,
              prop: event.propertyName || event.animationName,
              className: target.className,
              at: performance.now(),
            });
          }
        },
        true,
      );
    }
  });
  const basicButton = page
    .locator('.demo-renderer[data-demo="notification-basic"] .apollo-btn')
    .first();
  await basicButton.scrollIntoViewIfNeeded();
  // 入场 class 只有 200ms；Playwright 的 click actionability 可能就花掉这段时间。
  // 用 rAF 逐帧记录「曾经出现过」，不要用 click 后的单点采样。
  await page.evaluate(() => {
    window.__classLog = [];
    const deadline = performance.now() + 800;
    const tick = () => {
      const node = document.querySelector('.apollo-notification-list .apollo-notification-notice');
      if (node) window.__classLog.push(node.className);
      if (performance.now() < deadline) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await basicButton.click();
  await page.waitForTimeout(300);
  const classLog = await page.evaluate(() => window.__classLog);
  const appearSeen = classLog.some((className) => /fade-(appear|enter)/.test(className));
  const settledClass = (await notice(0).getAttribute('class')) ?? '';
  check('MN-04 入场存在 appear/enter class', appearSeen, settledClass);
  check('MN-04 入场动画结束后移除 fade class', !/fade-(appear|enter)/.test(settledClass));

  const closeButton = notice(0).locator('.apollo-notification-notice-close');
  await closeButton.click();
  // ⚠️ 时长必须从「leave class 出现」量到「节点移除」，不能用 Date.now() 包住
  //    Playwright 的 click（actionability / hit-test 本身可能花 100–300ms，
  //    会把测量污染成接近 500ms 的假象）。
  await page.waitForFunction(
    () => {
      const node = document.querySelector('.apollo-notification-list .apollo-notification-notice');
      if (!(node instanceof HTMLElement) || !node.className.includes('fade-leave')) {
        return false;
      }
      window.__leaveAt = performance.now();
      return true;
    },
    null,
    { timeout: 1000 },
  );
  const leaveClass = (await notice(0).getAttribute('class')) ?? '';
  check('MN-04 离场存在 fade-leave class', leaveClass.includes('fade-leave'), leaveClass);
  await page.waitForFunction(
    () =>
      document.querySelectorAll('.apollo-notification-list .apollo-notification-notice').length ===
      0,
    null,
    { timeout: 1000 },
  );
  const removedAfter = await page.evaluate(() => performance.now() - window.__leaveAt);
  check(
    'MN-05 离场在 transition 时间线内完成（非 500ms 兜底）',
    removedAfter < 400,
    `${Math.round(removedAfter)}ms`,
  );
  const motionEnds = await page.evaluate(() => window.__motionEnds);
  check(
    'MN-05 离场收到真实 transitionend（不是只靠 deadline）',
    motionEnds.some(
      (event) => event.type === 'transitionend' && event.className.includes('fade-leave'),
    ),
    JSON.stringify(motionEnds.map((event) => `${event.type}:${event.prop}`)),
  );

  // ── MN-01：4 条折叠 → hover 展开 → 移出恢复折叠 ──────────────────────
  await gotoTab('notification');
  await openStackDemo(4);
  const collapsed = await listState();
  check(
    'MN-01 第 4 条触发折叠（stack 且非 expanded）',
    collapsed.className.includes('apollo-notification-stack') &&
      !collapsed.className.includes('apollo-notification-stack-expanded'),
    collapsed.className,
  );
  check(
    'MN-01 折叠态仅 3 条可见',
    collapsed.notices.filter((item) => item.opacity === '1').length === 3,
    JSON.stringify(collapsed.notices.map((item) => item.opacity)),
  );
  const newest = page
    .locator('.apollo-notification-list .apollo-notification-notice[data-notification-index="0"]')
    .last();
  const newestBox = await newest.boundingBox();
  await page.mouse.move(newestBox.x + newestBox.width / 2, newestBox.y + 20, { steps: 5 });
  await page.waitForTimeout(350);
  const expanded = await listState();
  check(
    'MN-01 hover 展开（stack-expanded + hovered）',
    expanded.className.includes('apollo-notification-stack-expanded') &&
      expanded.className.includes('apollo-notification-list-hovered'),
    expanded.className,
  );
  check(
    'MN-01 展开后内容高度增大',
    expanded.contentHeight > collapsed.contentHeight + 40,
    `${collapsed.contentHeight} → ${expanded.contentHeight}`,
  );
  await page.mouse.move(120, 450, { steps: 8 });
  await page.waitForTimeout(450);
  const recollapsed = await listState();
  check(
    'MN-01 移出内容区域后恢复折叠',
    !recollapsed.className.includes('apollo-notification-stack-expanded'),
    recollapsed.className,
  );

  // ── MN-02：hover 展开时关闭最新一条，指针不动，余条最终可收拢 ───────
  await gotoTab('notification');
  await openStackDemo(5);
  const five = await listState();
  check('MN-02 5 条通知已创建', five.notices.length === 5, `${five.notices.length}`);
  const topNotice = page
    .locator('.apollo-notification-list .apollo-notification-notice[data-notification-index="0"]')
    .last();
  const topBox = await topNotice.boundingBox();
  await page.mouse.move(topBox.x + topBox.width / 2, topBox.y + 20, { steps: 5 });
  await page.waitForTimeout(350);
  await topNotice.locator('.apollo-notification-notice-close').click();
  await page.waitForTimeout(500);
  const afterClose = await listState();
  check(
    'MN-02 hover 下关闭后余 4 条且未误删',
    afterClose.notices.length === 4,
    `${afterClose.notices.length}`,
  );
  await page.mouse.move(120, 450, { steps: 8 });
  await page.waitForTimeout(450);
  const afterLeave = await listState();
  check(
    'MN-02 移出后恢复折叠（无 hover 卡死）',
    !afterLeave.className.includes('apollo-notification-stack-expanded'),
    afterLeave.className,
  );
  check(
    'MN-02 余条位置连续（无重复 index / 无 0 高度）',
    new Set(afterLeave.notices.map((item) => item.index)).size === afterLeave.notices.length &&
      afterLeave.notices.every((item) => item.height > 0),
    JSON.stringify(afterLeave.notices.map((item) => [item.index, item.height])),
  );

  // ── MN-03：同 key 更新只保留一条，且不出现 0 高度 ─────────────────────
  await gotoTab('notification');
  const updateButton = page
    .locator('.demo-renderer[data-demo="notification-update"] .apollo-btn')
    .first();
  await updateButton.scrollIntoViewIfNeeded();
  await updateButton.click();
  await page.waitForTimeout(250);
  const updatedBefore = await listState();
  check('MN-03 同 key 更新前只有一条', updatedBefore.notices.length === 1);
  await page.waitForTimeout(1200);
  const updatedAfter = await listState();
  check(
    'MN-03 同 key 更新后仍只有一条且高度正常',
    updatedAfter.notices.length === 1 && updatedAfter.notices[0].height > 0,
    JSON.stringify(updatedAfter.notices),
  );
  check('MN-03 更新后的标题已生效', (await notice(0).innerText()).includes('New Title'));

  // ── Message：默认不堆叠 / 显式 stack 折叠 ─────────────────────────────
  await page.goto(`${BASE}/components/message`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.demo-renderer[data-demo="message-hooks"] .apollo-btn', {
    timeout: 30000,
  });
  await page.waitForTimeout(500);
  const messageButton = page
    .locator('.demo-renderer[data-demo="message-hooks"] .apollo-btn')
    .first();
  await messageButton.scrollIntoViewIfNeeded();
  await messageButton.click();
  await page.waitForTimeout(300);
  const messageDefault = await page.evaluate(() => {
    const list = document.querySelector('.apollo-message-list');
    return {
      className: list?.className ?? '',
      count: list?.querySelectorAll('.apollo-message-notice').length ?? 0,
    };
  });
  check(
    'Message 默认不启用堆叠',
    messageDefault.count > 0 && !messageDefault.className.includes('apollo-message-stack'),
    messageDefault.className,
  );

  await page.goto(`${BASE}/components/message`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.demo-renderer[data-demo="message-stack"] .apollo-btn', {
    timeout: 30000,
  });
  await page.waitForTimeout(500);
  const messageStackButton = page
    .locator('.demo-renderer[data-demo="message-stack"] .apollo-btn')
    .first();
  await messageStackButton.scrollIntoViewIfNeeded();
  for (let i = 0; i < 4; i += 1) {
    await messageStackButton.click();
    await page.waitForTimeout(90);
  }
  await page.waitForTimeout(500);
  const messageCollapsed = await page.evaluate(() => {
    const list = document.querySelector('.apollo-message-list');
    return {
      className: list?.className ?? '',
      count: list?.querySelectorAll('.apollo-message-notice').length ?? 0,
    };
  });
  check(
    'Message 显式 stack=true 时第 4 条触发折叠',
    messageCollapsed.count === 4 &&
      messageCollapsed.className.includes('apollo-message-stack') &&
      !messageCollapsed.className.includes('apollo-message-stack-expanded'),
    `${messageCollapsed.count} / ${messageCollapsed.className}`,
  );
  const newestMessage = page.locator('.apollo-message-list .apollo-message-notice').last();
  const newestMessageBox = await newestMessage.boundingBox();
  await page.mouse.move(newestMessageBox.x + newestMessageBox.width / 2, newestMessageBox.y + 10, {
    steps: 5,
  });
  await page.waitForTimeout(300);
  check(
    'Message hover 展开堆叠',
    ((await page.locator('.apollo-message-list').getAttribute('class')) ?? '').includes(
      'apollo-message-stack-expanded',
    ),
  );
  await page.mouse.move(100, 450, { steps: 8 });
  await page.waitForTimeout(350);
  check(
    'Message 移出后恢复折叠',
    !((await page.locator('.apollo-message-list').getAttribute('class')) ?? '').includes(
      'apollo-message-stack-expanded',
    ),
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
console.log(
  `\n[notification-motion-browser] ${results.length - failed.length}/${results.length} 通过`,
);
if (failed.length > 0) {
  process.exitCode = 1;
}
