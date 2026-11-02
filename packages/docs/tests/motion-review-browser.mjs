/**
 * 002 复审：真实 rAF/MutationObserver 取证与同机 React 行为对照。
 * node packages/docs/tests/motion-review-browser.mjs
 * 不注入动效 CSS；采样完整数据写入 docs/audit/evidence/review-002-motion.json。
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vue from '@vitejs/plugin-vue';
import { build, preview } from 'vite';
import { launchBrowser } from '../../../tests/visual/stabilize.mjs';
import { assessDisplacement, assessSampling, motionCheck } from './motion-sampling.mjs';

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
// Compile once before launching Chrome. Dev transforms and dependency discovery
// must not compete with the renderer while its real animation is being sampled.
const fixtureDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'apollo-motion-fixture-'));
const fixtureSourceRoot = fs.realpathSync(path.join(root, 'tests/compat/motion-review'));
await build({
  configFile: false,
  root: fixtureSourceRoot,
  plugins: [vue()],
  resolve: {
    alias: {
      '@apollo-design/ui/style.css': path.join(root, 'packages/ui/dist/index.css'),
      '@apollo-design/theme/tokens.css': path.join(root, 'packages/theme/dist/tokens.css'),
      ...aliases,
    },
  },
  build: {
    outDir: fixtureDirectory,
    emptyOutDir: true,
    minify: false,
    rollupOptions: { input: path.join(fixtureSourceRoot, 'index.html') },
  },
  logLevel: 'error',
});
const server = await preview({
  root,
  configFile: false,
  build: { outDir: fixtureDirectory },
  preview: { host: '127.0.0.1', port: 0, strictPort: true },
  logLevel: 'error',
});
const { browser, channel, executablePath } = await launchBrowser();
const browserSession = await browser.newBrowserCDPSession();
const { arguments: browserArguments } = await browserSession.send('Browser.getBrowserCommandLine');
await browserSession.detach();
const report = {
  generatedAt: new Date().toISOString(),
  browserVersion: browser.version(),
  browserChannel: channel,
  browserExecutablePath: executablePath ?? null,
  browserArguments,
  fixture: { mode: 'compiled-current-source', directory: fixtureDirectory },
  nodeVersion: process.version,
  platform: process.platform,
  scenarios: {},
  expected: 60,
  passed: false,
  checks: [],
};
const check = (name, ok, detail = '', quality, options) => {
  const result = quality
    ? motionCheck(ok, quality, options)
    : { ok, status: ok ? 'passed' : 'failed' };
  report.checks.push({ name, ...result, observedAssertion: ok, detail });
  console.log(`${result.status.toUpperCase()} ${name} ${detail} ${result.reason ?? ''}`);
};

async function sample(page, selector, action, duration = 650) {
  await page.evaluate(
    ({ selector, duration }) => {
      const frames = [];
      const mutations = [];
      const events = [];
      const diagnostics = {
        environment: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          visibilityState: document.visibilityState,
          hidden: document.hidden,
          hasFocus: document.hasFocus(),
          reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
        },
        visibilityChanges: [],
        mutationCallbacks: [],
        motionDefinitions: [],
      };
      const capturedClasses = new WeakMap();
      const start = performance.now();
      const capture = (node) => {
        const style = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        const matrix = new DOMMatrixReadOnly(
          style.transform === 'none' ? undefined : style.transform,
        );
        if (capturedClasses.get(node) !== node.className) {
          capturedClasses.set(node, node.className);
          diagnostics.motionDefinitions.push({
            t: performance.now() - start,
            text: node.textContent,
            className: node.className,
            animationName: style.animationName,
            animationDuration: style.animationDuration,
            animationDelay: style.animationDelay,
            animationTimingFunction: style.animationTimingFunction,
            animationPlayState: style.animationPlayState,
            transitionProperty: style.transitionProperty,
            transitionDuration: style.transitionDuration,
            transitionDelay: style.transitionDelay,
            transitionTimingFunction: style.transitionTimingFunction,
            animations: node.getAnimations().map((animation) => ({
              type: animation.constructor.name,
              playState: animation.playState,
              currentTime: animation.currentTime,
              playbackRate: animation.playbackRate,
              timing: animation.effect?.getTiming(),
            })),
          });
        }
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
        const callbackStart = performance.now();
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
        diagnostics.mutationCallbacks.push({
          t: callbackStart - start,
          durationMs: performance.now() - callbackStart,
          recordCount: records.length,
        });
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
      const motionEvents = [
        'transitionrun',
        'transitionstart',
        'transitionend',
        'transitioncancel',
        'animationstart',
        'animationend',
        'animationcancel',
      ];
      for (const type of motionEvents) document.addEventListener(type, onEnd, true);
      const onVisibilityChange = () => {
        diagnostics.visibilityChanges.push({
          t: performance.now() - start,
          visibilityState: document.visibilityState,
          hidden: document.hidden,
        });
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      const initial = {
        t: performance.now() - start,
        nodes: [...document.querySelectorAll(selector)].map(capture),
      };
      window.reviewSampling = new Promise((resolve) => {
        function tick(rafTimestamp) {
          const callbackStart = performance.now();
          const frame = {
            t: callbackStart - start,
            rafT: rafTimestamp - start,
            callbackDelayMs: callbackStart - rafTimestamp,
            nodes: [...document.querySelectorAll(selector)].map(capture),
          };
          frame.callbackDurationMs = performance.now() - callbackStart;
          frames.push(frame);
          if (performance.now() - start < duration) requestAnimationFrame(tick);
          else {
            observer.disconnect();
            for (const type of motionEvents) document.removeEventListener(type, onEnd, true);
            document.removeEventListener('visibilitychange', onVisibilityChange);
            resolve({ initial, frames, mutations, events, diagnostics });
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

function recordScenario(name, data) {
  const summarize = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: sorted.length,
      median: sorted[Math.floor(sorted.length / 2)] ?? null,
      max: sorted.at(-1) ?? null,
    };
  };
  data.diagnostics.timing = {
    frameCount: data.frames.length,
    sampleIntervalMs: summarize(data.frames.slice(1).map((frame, i) => frame.t - data.frames[i].t)),
    rafIntervalMs: summarize(
      data.frames.slice(1).map((frame, i) => frame.rafT - data.frames[i].rafT),
    ),
    callbackDelayMs: summarize(data.frames.map((frame) => frame.callbackDelayMs)),
    callbackDurationMs: summarize(data.frames.map((frame) => frame.callbackDurationMs)),
    mutationCallbackDurationMs: summarize(
      data.diagnostics.mutationCallbacks.map((callback) => callback.durationMs),
    ),
  };
  report.scenarios[name] = data;
  console.log(`[motion-sampling] ${name} ${JSON.stringify(data.diagnostics.timing)}`);
}

function entrance(name, data, text) {
  const quality = assessSampling(data, { text, read: (node) => node.opacity });
  const nodes = data.frames.flatMap((frame) =>
    frame.nodes.filter((node) => node.text.includes(text)),
  );
  check(
    `${name}: 从透明初态进入`,
    nodes.some((node) => node.opacity < 0.05),
    '',
    quality,
  );
  check(
    `${name}: 多个过渡帧`,
    nodes.filter((node) => node.opacity > 0.05 && node.opacity < 0.95).length >= 2,
    '',
    quality,
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
  check(
    `${name}: 有真实结束事件`,
    data.events.some((event) => event.type.endsWith('end')),
  );
}

try {
  for (const side of ['react', 'vue']) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'zh-CN', timezoneId: 'Asia/Shanghai' });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(`${server.resolvedUrls.local[0]}index.html?side=${side}`);
    await page.waitForFunction(() => window.review);
    await page.evaluate(() => document.fonts.ready);
    const p = side === 'react' ? 'ant' : 'apollo';
    for (const kind of ['message', 'notice']) {
      const cls = kind === 'message' ? 'message' : 'notification';
      const selector = `.${p}-${cls}-notice`;
      await page.evaluate((kind) => window.review[kind]('Old'), kind);
      await page.waitForTimeout(500);
      const data = await sample(page, selector, () =>
        page.evaluate((kind) => window.review[kind]('New'), kind),
      );
      recordScenario(`${side}.${kind}`, data);
      entrance(`${side}.${kind}`, data, 'New');
      const old = data.frames
        .map((frame) => frame.nodes.find((node) => node.text.includes('Old')))
        .filter(Boolean);
      const ys = old.map((node) => node.rect.y);
      const direction = Math.sign(ys.at(-1) - ys[0]);
      const quality = assessSampling(data, { text: 'Old', read: (node) => node.rect.y });
      check(
        `${side}.${kind}: 旧条位置单调连续`,
        ys.every((y, i) => i === 0 || direction * (y - ys[i - 1]) >= -0.5),
        '',
        quality,
        { definiteFailure: true },
      );
      check(
        `${side}.${kind}: 旧条有中间位置`,
        new Set(ys.map((y) => y.toFixed(1))).size >= 4,
        '',
        quality,
      );
      const movement = assessDisplacement(data, { text: 'Old', read: (node) => node.rect.y });
      check(
        `${side}.${kind}: 单帧无位置突跳`,
        movement.observedAssertion,
        `distance=${movement.distance.toFixed(2)}px maxStep=${movement.maxStep.toFixed(2)}px`,
        movement.quality,
        { definiteFailure: movement.definiteFailure },
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
    recordScenario(`${side}.menu.open`, open);
    const heights = open.frames
      .map((frame) => frame.nodes[0]?.rect.height)
      .filter((height) => height !== undefined);
    const full = heights.at(-1);
    const openQuality = assessSampling(open, { read: (node) => node.rect.height });
    check(
      `${side}.menu: 展开高度从零起步`,
      heights.some((height) => height < 1),
      '',
      openQuality,
    );
    check(
      `${side}.menu: 展开有高度中间帧`,
      heights.filter((height) => height > 1 && height < full - 1).length >= 2,
      '',
      openQuality,
    );
    check(
      `${side}.menu: 嵌套无重复 appear`,
      open.frames.every((frame) => !frame.nodes[1]?.className.includes('-appear')),
    );
    check(
      `${side}.menu: 高度结束事件`,
      open.events.some((event) => event.property === 'height' && event.type.endsWith('end')),
    );
    const close = await sample(page, selector, () =>
      page.evaluate(() => window.review.menu({ openKeys: [] })),
    );
    recordScenario(`${side}.menu.close`, close);
    check(
      `${side}.menu: 收起保留过渡帧`,
      close.frames.some(
        (frame) => frame.nodes[0]?.rect.height > 1 && frame.nodes[0]?.rect.height < full - 1,
      ),
      '',
      assessSampling(close, { read: (node) => node.rect.height }),
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
      recordScenario(`${side}.menu.${key}`, change);
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
    recordScenario(`${side}.menu.rapid`, rapid);
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
  try {
    await browser.close();
  } finally {
    try {
      await new Promise((resolve, reject) =>
        server.httpServer.close((error) => (error ? reject(error) : resolve())),
      );
    } finally {
      report.finishedAt = new Date().toISOString();
      report.productFailures = report.checks.filter((item) => item.status === 'failed').length;
      report.invalidSamples = report.checks.filter(
        (item) => item.status === 'sampling-invalid',
      ).length;
      report.notRun = report.expected - report.checks.length;
      report.passed = report.notRun === 0 && report.checks.every((item) => item.ok);
      fs.mkdirSync('docs/audit/evidence', { recursive: true });
      fs.writeFileSync(
        'docs/audit/evidence/review-002-motion.json',
        `${JSON.stringify(report, null, 2)}\n`,
      );
    }
  }
}
const failures = report.checks.filter((item) => !item.ok);
console.log(
  `[motion-review-browser] ${report.checks.length - failures.length}/${report.checks.length} passed`,
);
assert.equal(report.checks.length, report.expected, 'All 60 motion assertions must execute');
assert.equal(
  failures.length,
  0,
  failures.map((item) => `${item.status}: ${item.name} ${item.reason ?? ''}`).join('\n'),
);
