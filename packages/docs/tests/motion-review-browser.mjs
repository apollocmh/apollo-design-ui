/**
 * 002 复审：真实 rAF/MutationObserver 取证与同机 React 行为对照。
 * node packages/docs/tests/motion-review-browser.mjs
 * 不注入动效 CSS；采样完整数据写入 docs/audit/evidence/review-002-motion.json。
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { chromium } from 'playwright';
import { createServer } from 'vite';

const root = process.cwd();
const aliases = Object.fromEntries(
  [
    'ui',
    'motion',
    'utils',
    'theme',
    'icons',
    'portal',
    'position',
    'overlay',
    'a11y',
    'virtual-list',
    'form-core',
    'picker',
    'locale',
  ].map((name) => [`@apollo-design/${name}`, path.join(root, `packages/${name}/src/index.ts`)]),
);
const server = await createServer({
  configFile: false,
  root,
  plugins: [vue()],
  resolve: {
    alias: {
      '@apollo-design/ui/style.css': path.join(root, 'packages/ui/dist/index.css'),
      '@apollo-design/theme/tokens.css': path.join(root, 'packages/theme/dist/tokens.css'),
      ...aliases,
    },
  },
  optimizeDeps: { entries: ['tests/compat/motion-review/index.html'] },
  server: { host: '127.0.0.1', port: 4483, strictPort: true },
  logLevel: 'error',
});
await server.listen();
const browser = await chromium.launch();
const report = {
  generatedAt: new Date().toISOString(),
  browserVersion: browser.version(),
  nodeVersion: process.version,
  platform: process.platform,
  scenarios: {},
  checks: [],
};
const check = (name, ok, detail = '') => {
  report.checks.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${detail}`);
};

async function sample(page, selector, action, duration = 650) {
  await page.evaluate(
    ({ selector, duration }) => {
      const frames = [];
      const mutations = [];
      const events = [];
      const start = performance.now();
      const capture = (node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const matrix = new DOMMatrixReadOnly(
          style.transform === 'none' ? undefined : style.transform,
        );
        return {
          text: node.textContent,
          className: node.className,
          style: node.getAttribute('style'),
          transform: style.transform,
          translateY: matrix.m42,
          opacity: Number(style.opacity),
          height: Number.parseFloat(style.height),
          display: style.display,
          y: style.getPropertyValue('--notification-y'),
          rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        };
      };
      const observer = new MutationObserver((records) => {
        for (const record of records) {
          for (const node of record.addedNodes) {
            if (node instanceof Element) {
              for (const match of [node, ...node.querySelectorAll(selector)]) {
                if (match.matches(selector))
                  mutations.push({ t: performance.now() - start, ...capture(match) });
              }
            }
          }
        }
      });
      observer.observe(document.body, { subtree: true, childList: true });
      const onEnd = (event) => {
        if (event.target instanceof Element && event.target.matches(selector)) {
          events.push({
            t: performance.now() - start,
            type: event.type,
            property: event.propertyName || event.animationName,
            className: event.target.className,
          });
        }
      };
      document.addEventListener('transitionend', onEnd, true);
      document.addEventListener('animationend', onEnd, true);
      window.reviewSampling = new Promise((resolve) => {
        function tick() {
          frames.push({
            t: performance.now() - start,
            nodes: [...document.querySelectorAll(selector)].map(capture),
          });
          if (performance.now() - start < duration) requestAnimationFrame(tick);
          else {
            observer.disconnect();
            document.removeEventListener('transitionend', onEnd, true);
            document.removeEventListener('animationend', onEnd, true);
            resolve({ frames, mutations, events });
          }
        }
        requestAnimationFrame(tick);
      });
    },
    { selector, duration },
  );
  await action();
  return page.evaluate(() => window.reviewSampling);
}

function entrance(name, data, text) {
  const nodes = data.frames.flatMap((frame) =>
    frame.nodes.filter((node) => node.text.includes(text)),
  );
  check(
    `${name}: 从透明初态进入`,
    nodes.some((node) => node.opacity < 0.05),
  );
  check(
    `${name}: 多个过渡帧`,
    nodes.filter((node) => node.opacity > 0.05 && node.opacity < 0.95).length >= 2,
  );
  check(
    `${name}: 最终可见且高度非零`,
    nodes.at(-1)?.opacity === 1 && nodes.at(-1)?.rect.height > 0,
  );
  check(
    `${name}: 插入时没有裸节点`,
    data.mutations
      .filter((node) => node.text.includes(text))
      .every((node) => /-(appear|enter)-/.test(node.className)),
  );
  check(`${name}: 有真实结束事件`, data.events.length > 0);
}

try {
  for (const side of ['react', 'vue']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:4483/tests/compat/motion-review/index.html?side=${side}`);
    await page.waitForFunction(() => window.review);
    const p = side === 'react' ? 'ant' : 'apollo';
    for (const kind of ['message', 'notice']) {
      const cls = kind === 'message' ? 'message' : 'notification';
      const selector = `.${p}-${cls}-notice`;
      await page.evaluate((kind) => window.review[kind]('Old'), kind);
      await page.waitForTimeout(500);
      const data = await sample(page, selector, () =>
        page.evaluate((kind) => window.review[kind]('New'), kind),
      );
      report.scenarios[`${side}.${kind}`] = data;
      entrance(`${side}.${kind}`, data, 'New');
      const old = data.frames
        .map((frame) => frame.nodes.find((node) => node.text.includes('Old')))
        .filter(Boolean);
      const ys = old.map((node) => node.rect.y);
      const direction = Math.sign(ys.at(-1) - ys[0]);
      check(
        `${side}.${kind}: 旧条位置单调连续`,
        ys.every((y, i) => i === 0 || direction * (y - ys[i - 1]) >= -0.5),
      );
      check(`${side}.${kind}: 旧条有中间位置`, new Set(ys.map((y) => y.toFixed(1))).size >= 4);
      const distance = Math.abs(ys.at(-1) - ys[0]);
      const maxStep = Math.max(...ys.slice(1).map((y, i) => Math.abs(y - ys[i])));
      check(
        `${side}.${kind}: 单帧无位置突跳`,
        distance > 0 && maxStep < distance / 2,
        `distance=${distance.toFixed(2)}px maxStep=${maxStep.toFixed(2)}px`,
      );
      check(
        `${side}.${kind}: 每帧测量高度非零`,
        old.every((node) => node.rect.height > 0),
      );
      await page.evaluate(() => window.review.clear());
      await page.waitForTimeout(600);
    }
    const selector = `.${p}-menu-sub.${p}-menu-inline`;
    const open = await sample(page, selector, () =>
      page.evaluate(() => window.review.menu({ openKeys: ['outer', 'inner'] })),
    );
    report.scenarios[`${side}.menu.open`] = open;
    const heights = open.frames
      .map((frame) => frame.nodes[0]?.rect.height)
      .filter((height) => height !== undefined);
    const full = heights.at(-1);
    check(
      `${side}.menu: 展开高度从零起步`,
      heights.some((height) => height < 1),
    );
    check(
      `${side}.menu: 展开有高度中间帧`,
      heights.filter((height) => height > 1 && height < full - 1).length >= 2,
    );
    check(
      `${side}.menu: 嵌套无重复 appear`,
      open.frames.every((frame) => !frame.nodes[1]?.className.includes('-appear')),
    );
    check(
      `${side}.menu: 高度结束事件`,
      open.events.some((event) => event.property === 'height'),
    );
    const close = await sample(page, selector, () =>
      page.evaluate(() => window.review.menu({ openKeys: [] })),
    );
    report.scenarios[`${side}.menu.close`] = close;
    check(
      `${side}.menu: 收起保留过渡帧`,
      close.frames.some(
        (frame) => frame.nodes[0]?.rect.height > 1 && frame.nodes[0]?.rect.height < full - 1,
      ),
    );
    check(`${side}.menu: 结束后保留 hidden`, close.frames.at(-1).nodes[0]?.display === 'none');

    for (const patch of [{ mode: 'vertical' }, { inlineCollapsed: true }]) {
      await page.evaluate(() =>
        window.review.menu({
          mode: 'inline',
          inlineCollapsed: false,
          openKeys: ['outer', 'inner'],
        }),
      );
      await page.waitForTimeout(450);
      const change = await sample(page, selector, () =>
        page.evaluate((patch) => window.review.menu(patch), patch),
      );
      const key = Object.keys(patch)[0];
      report.scenarios[`${side}.menu.${key}`] = change;
      check(
        `${side}.menu.${key}: 离场后才销毁`,
        change.frames.some((frame) => frame.nodes[0]?.rect.height > 1) &&
          change.frames.at(-1).nodes.length === 0,
      );
    }
    await page.evaluate(() =>
      window.review.menu({ mode: 'inline', inlineCollapsed: false, openKeys: [] }),
    );
    const rapid = await sample(
      page,
      selector,
      () =>
        page.evaluate(async () => {
          window.review.menu({ openKeys: ['outer'] });
          await new Promise((resolve) => setTimeout(resolve, 80));
          window.review.menu({ openKeys: [] });
          await new Promise((resolve) => setTimeout(resolve, 80));
          window.review.menu({ openKeys: ['outer'] });
        }),
      850,
    );
    report.scenarios[`${side}.menu.rapid`] = rapid;
    check(
      `${side}.menu: 快速反向最终展开`,
      rapid.frames.at(-1).nodes[0]?.display !== 'none' &&
        rapid.frames.at(-1).nodes[0]?.rect.height > 1,
    );
    await page.locator(`.${p}-menu-submenu-title`).first().hover();
    await page.mouse.move(450, 300);
    await page.waitForTimeout(250);
    check(
      `${side}.menu: hover 不改变展开`,
      (await page.locator(`.${p}-menu-submenu-title`).first().getAttribute('aria-expanded')) ===
        'true',
    );
    check(`${side}: 无浏览器错误`, errors.length === 0, errors.join('; '));
    await page.close();
  }
  for (const kind of ['message', 'notice']) {
    const trajectory = (side) => {
      const frames = report.scenarios[`${side}.${kind}`].frames;
      return ['Old', 'New'].map((text) => {
        const nodes = frames.flatMap((frame) =>
          frame.nodes.filter((node) => node.text.includes(text)),
        );
        return { start: nodes[0]?.rect, end: nodes.at(-1)?.rect };
      });
    };
    const oracle = trajectory('react');
    const actual = trajectory('vue');
    check(
      `${kind}: 起终位置与 React 一致`,
      actual.every(
        (node, i) =>
          Math.abs(node.start.y - oracle[i].start.y) < 1 &&
          Math.abs(node.end.y - oracle[i].end.y) < 1 &&
          Math.abs(node.end.height - oracle[i].end.height) < 1,
      ),
    );
  }
} finally {
  await browser.close();
  await server.close();
  fs.mkdirSync('docs/audit/evidence', { recursive: true });
  fs.writeFileSync(
    'docs/audit/evidence/review-002-motion.json',
    `${JSON.stringify(report, null, 2)}\n`,
  );
}
const failures = report.checks.filter((item) => !item.ok);
console.log(
  `[motion-review-browser] ${report.checks.length - failures.length}/${report.checks.length} passed`,
);
assert.equal(failures.length, 0, failures.map((item) => item.name).join('\n'));
