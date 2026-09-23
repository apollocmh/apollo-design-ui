#!/usr/bin/env node
/**
 * tests/compat/baseline/carousel.mjs — 生成 antd 6.6.4 Carousel 的 DOM 基线（机械 oracle）
 *
 * 关键取舍（docs/analysis/carousel.md §3）：
 * - **DOM 的真正生产者是 @ant-design/react-slick@2.0.0**：`.slick-*` 类名是 slick 的
 *   命名空间（不随 prefixCls 变）；`.apollo-carousel` 只出现在根节点。
 * - **infinite 默认 true ⇒ SSR 就渲染 clone**（data-index=-1 / n，`slick-cloned`）；
 *   fade 分支不渲染 clone。
 * - slide 三层结构：`.slick-slide`（tabindex/aria-hidden/width 内联）> div >
 *   div[tabindex=-1, style width:100%] > child。
 * - dots 非激活 li 的 class 是**空字符串**；ul 带 `style="display:block"`。
 * - 箭头：`type="button"`、`data-role="none"`、`aria-label` 来自 locale（en 默认），
 *   rtl 时 prev/next 文案互换。
 *
 * 运行：node tests/compat/baseline/carousel.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/carousel.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const antd = require('antd');
const { ConfigProvider, Carousel } = antd;

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(node) });
};

const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

/** 3 张标准 slide（antd demo 同款 h3）。 */
const kids = () =>
  [1, 2, 3].map((i) =>
    h(
      'div',
      { key: i },
      h('h3', { style: { height: '160px', lineHeight: '160px', textAlign: 'center' } }, `${i}`),
    ),
  );

// ---- 基本形态 ----

push('carousel:basic', wrap(h(Carousel, null, kids())));
push('carousel:dots-false', wrap(h(Carousel, { dots: false }, kids())));
push('carousel:dots-object', wrap(h(Carousel, { dots: { className: 'custom-dots' } }, kids())));

// ---- 箭头 ----

push('carousel:arrows', wrap(h(Carousel, { arrows: true }, kids())));
push(
  'carousel:arrows-infinite-false',
  wrap(h(Carousel, { arrows: true, infinite: false }, kids())),
);

// ---- 拖拽 / 滑动 ----

push('carousel:draggable', wrap(h(Carousel, { draggable: true }, kids())));

// ---- 位置 / 纵向 ----

push('carousel:dot-placement-start', wrap(h(Carousel, { dotPlacement: 'start' }, kids())));
push('carousel:dot-placement-end', wrap(h(Carousel, { dotPlacement: 'end' }, kids())));
push('carousel:dot-placement-top', wrap(h(Carousel, { dotPlacement: 'top' }, kids())));
push('carousel:dot-position-left-deprecated', wrap(h(Carousel, { dotPosition: 'left' }, kids())));

// ---- fade（无 clone + opacity/z-index 内联） ----

push('carousel:fade', wrap(h(Carousel, { effect: 'fade' }, kids())));

// ---- autoplay（对象形态 dotDuration → --dot-duration） ----

push(
  'carousel:autoplay-dot-duration',
  wrap(h(Carousel, { autoplay: { dotDuration: true }, autoplaySpeed: 4000 }, kids())),
);

// ---- infinite ----

push('carousel:infinite-false', wrap(h(Carousel, { infinite: false }, kids())));

// ---- initialSlide ----

push('carousel:initial-slide', wrap(h(Carousel, { initialSlide: 1 }, kids())));
push(
  'carousel:initial-slide-infinite-false',
  wrap(h(Carousel, { initialSlide: 1, infinite: false }, kids())),
);

// ---- rtl ----

push('carousel:rtl', wrap(h(Carousel, { rtl: true }, kids())));

// ---- 单张 / 双张（childrenCount<=slidesToShow 的边界） ----

push(
  'carousel:single-child',
  wrap(h(Carousel, null, h('div', { key: 1 }, h('h3', { style: { height: '160px' } }, '1')))),
);

// ---- speed / cssEase（fade 的 transition 内联） ----

push(
  'carousel:fade-speed-css',
  wrap(h(Carousel, { effect: 'fade', speed: 800, cssEase: 'linear' }, kids())),
);

// ---- attrs 透传（id / data-*） ----

push('carousel:attrs', wrap(h(Carousel, { id: 'x', 'data-x': '1' }, kids())));

const payload = {
  $comment:
    'DOM 基线：由 tests/compat/baseline/carousel.mjs 从 antd 6.6.4 的 Carousel（react-slick）真实渲染生成。机械 oracle，禁止手改。翻页/拖拽/自动播放等运行时行为由 L1 覆盖（contract 档不投影它们）。',
  antdVersion: antdPkg.version,
  renderer: 'react-dom/server.renderToStaticMarkup',
  prefixCls: 'apollo',
  caseCount: cases.length,
  cases,
};

const serialized = `${JSON.stringify(payload, null, 2)}\n`;

if (check) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
  if (current !== serialized) {
    console.error('[compat:carousel] ❌ 基线不是最新的');
    console.error('  运行: node tests/compat/baseline/carousel.mjs');
    process.exit(1);
  }
  console.log(`[compat:carousel] ✅ 基线最新（${cases.length} 个用例）`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, serialized);
console.log(`[compat:carousel] 用例 ${cases.length} 个`);
console.log(`写出 ${path.relative(process.cwd(), OUT_FILE)}`);
