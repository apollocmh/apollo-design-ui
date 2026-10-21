/**
 * 阶段 0 动效复现探针（只读，不改组件源码）。
 *
 * 用法：
 *   pnpm --filter @apollo-design/docs exec vite preview --host 127.0.0.1 --port 4477
 *   node docs/audit/tools/stage0-motion-probe.mjs
 *
 * 输出：docs/audit/evidence/stage0-motion.json（每个组件开/关/重开的时间线）。
 * 说明：本脚本只观测真实 DOM / computedStyle / animation，不注入任何测试专用样式。
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE = process.env.DOCS_URL ?? 'http://127.0.0.1:4477/apollo-design-ui';
const OUT = path.resolve('docs/audit/evidence/stage0-motion.json');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(20000);
const report = {};

function snap(selector) {
  return page.evaluate((sel) => {
    return [...document.querySelectorAll(sel)].slice(0, 4).map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        cls: el.className,
        style: el.getAttribute('style'),
        rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)],
        display: cs.display,
        opacity: Number(cs.opacity).toFixed(3),
        transform: cs.transform,
        transformOrigin: cs.transformOrigin,
        animationName: cs.animationName,
        animationPlayState: cs.animationPlayState,
      };
    });
  }, selector);
}

async function timeline(name, selector, steps = [0, 50, 150, 350, 700]) {
  const list = [];
  for (const ms of steps) {
    if (ms) await page.waitForTimeout(ms);
    list.push({ t: ms, nodes: await snap(selector) });
  }
  report[name] = list;
}

async function standalone(component) {
  await page.goto(`${BASE}/components/${component}/demo/basic`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.standalone-body .demo-renderer');
  await page.waitForTimeout(300);
}

try {
  // ── Select / DatePicker / Popconfirm：共享 Trigger 的离场 ────────────────
  await standalone('select');
  await page.locator('.apollo-select').first().click();
  await timeline('select.open', '.apollo-select-dropdown', [0, 50, 150, 350]);
  await page.keyboard.press('Escape');
  await timeline('select.close', '.apollo-select-dropdown');

  await standalone('date-picker');
  await page.locator('.apollo-picker input').first().click();
  await timeline('date-picker.open', '.apollo-picker-dropdown', [0, 50, 150, 350]);
  await page.keyboard.press('Escape');
  await timeline('date-picker.close', '.apollo-picker-dropdown');

  await standalone('popconfirm');
  await page.locator('.apollo-btn').first().click();
  await timeline('popconfirm.open', '.apollo-popover', [0, 50, 150, 350]);
  const no = page.getByRole('button', { name: 'No' }).first();
  if (await no.count()) await no.click();
  else await page.keyboard.press('Escape');
  await timeline('popconfirm.close', '.apollo-popover');

  // ── Notification：关闭是否进入 leave（MutationObserver）──────────────────
  await standalone('notification');
  await page.locator('.apollo-btn').first().click();
  await page.waitForTimeout(400);
  report['notification.open'] = await snap('.apollo-notification-notice');
  await page.evaluate(() => {
    window.__ev = [];
    const t0 = performance.now();
    const isNotice = (n) =>
      n instanceof Element && n.classList?.contains('apollo-notification-notice');
    const isContainer = (n) => n instanceof Element && n.classList?.contains('apollo-notification');
    const rec = (type, target, extra = {}) =>
      window.__ev.push({
        t: Math.round(performance.now() - t0),
        type,
        cls: typeof target?.className === 'string' ? target.className : '',
        ...extra,
      });
    new MutationObserver((records) => {
      for (const r of records) {
        if (r.type === 'attributes') {
          if (isNotice(r.target)) rec('attr', r.target, { attr: r.attributeName });
          continue;
        }
        for (const n of r.removedNodes) {
          if (isNotice(n) || isContainer(n)) rec('removed', n);
        }
      }
    }).observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    });
  });
  await page.locator('.apollo-notification-notice-close').first().click();
  await page.waitForTimeout(500);
  report['notification.close'] = await page.evaluate(() => window.__ev);

  // ── Tree：收起 + 再次展开 ────────────────────────────────────────────────
  await standalone('tree');
  const switcher = page.locator('.apollo-tree-switcher').nth(0);
  await switcher.click();
  await timeline('tree.collapse', '.apollo-tree-treenode-motion', [0, 50, 150, 350]);
  await page.waitForTimeout(300);
  await switcher.click();
  // ⚠️ 必须在 appear 进行中采样：等 300ms 再数时 0.2s 的入场已经收尾，
  //    容器被摘掉是「动效正常结束」，不是「没有动效」（2026-10-21 修正判据）。
  await timeline('tree.reopen', '.apollo-tree-treenode-motion', [0, 50, 100, 200, 400]);
  report['tree.reopen.result'] = {
    nodes: await page.locator('.apollo-tree-treenode').count(),
    motionSeen: report['tree.reopen'].some((step) => step.nodes.length > 0),
  };

  // ── Modal：点击打开的原点与入场曲线 ──────────────────────────────────────
  await standalone('modal');
  await page.locator('.apollo-btn').first().click();
  await page.waitForTimeout(50);
  report['modal.open'] = await snap(
    '.apollo-modal-root .apollo-modal, .apollo-modal-root .apollo-modal-mask',
  );
  await timeline('modal.open.timeline', '.apollo-modal-root .apollo-modal', [0, 50, 100, 200]);
  await page.keyboard.press('Escape');
  await timeline(
    'modal.close',
    '.apollo-modal-root .apollo-modal, .apollo-modal-root .apollo-modal-mask',
    [0, 50, 150, 350],
  );

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`✅ 阶段 0 探针完成：${OUT}`);
  for (const [key, value] of Object.entries(report)) {
    if (Array.isArray(value)) console.log(`  ${key}: ${value.length} samples`);
    else console.log(`  ${key}: ${JSON.stringify(value).slice(0, 160)}`);
  }
} finally {
  await browser.close();
}
