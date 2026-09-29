#!/usr/bin/env node
/**
 * tests/compat/baseline/pagination-pagers.mjs — 用 antd（真实现）生成**页码列表判定表**。
 *
 * ── 为什么需要它 ──────────────────────────────────────────────────────────────
 *
 * 页码列表算法有 6 处边界（`pageBufferSize` / 两个魔数 / 挤位 / ±5 与 ±3 / 补类位置），
 * 靠读源码逐行翻译很容易「看起来对」。这里用 antd 的 SSR 产物**穷举**出一个矩阵，
 * 让 L1 用数据表断言 —— 判定值不再来自我的转述，而来自上游本身（AGENTS §5 第 4 层）。
 *
 * 做法：SSR 渲染 `Pagination`，从 HTML 里按顺序抽出：
 *   - `-item-{n}` 的页码（含 `-active`）
 *   - 是否出现 `-jump-prev` / `-jump-next`
 *   - 首/末页码上是否有 `-item-after-jump-prev` / `-item-before-jump-next`
 *   - 是否渲染了 `-disabled` 的占位项（`allPages === 0`）
 *
 * 运行：node tests/compat/baseline/pagination-pagers.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/pagination.pagers.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const { Pagination, ConfigProvider } = require('antd');

/**
 * 从 SSR HTML 里抽出结构摘要。
 *
 * ⚠️ 必须**逐 `<li>` 标签**解析再取该标签自己的 `class`：直接全局抓 `class="..."` 会把
 *    父子节点的类名混在一起（第一版就踩了，跳页项全部漏掉）。
 */
function extract(html) {
  // 只看页码区（`-options` 之前），避免把尺寸切换器的 li 也算进来
  const optionsAt = html.indexOf('pagination-options');
  const body = optionsAt > 0 ? html.slice(0, optionsAt) : html;
  const items = [];
  const tagRe = /<li\b[^>]*>/g;
  let m;
  while ((m = tagRe.exec(body)) !== null) {
    const tag = m[0];
    const cls = /class="([^"]*)"/.exec(tag)?.[1] ?? '';
    if (cls.includes('-total-text')) continue;
    // 🚨 必须**先**判页码：`-item-after-jump-prev` / `-item-before-jump-next` 里含有
    //    子串 `-jump-prev` / `-jump-next`，先判跳页会把这两个页码整项误分类（第一版实测踩到）。
    const pageMatch = /-item-(\d+)/.exec(cls);
    if (!pageMatch) {
      if (cls.includes('-jump-prev')) {
        items.push({ kind: 'jump-prev' });
        continue;
      }
      if (cls.includes('-jump-next')) {
        items.push({ kind: 'jump-next' });
        continue;
      }
      continue;
    }
    items.push({
      kind: 'page',
      page: Number(pageMatch[1]),
      ...(cls.includes('-item-active') ? { active: true } : {}),
      ...(cls.includes('-item-disabled') ? { disabled: true } : {}),
      ...(cls.includes('-item-after-jump-prev') ? { afterJumpPrev: true } : {}),
      ...(cls.includes('-item-before-jump-next') ? { beforeJumpNext: true } : {}),
    });
  }
  return items;
}

const cases = [];
for (const total of [0, 10, 30, 50, 100, 500, 1000]) {
  for (const current of [1, 2, 3, 4, 5, 6, 10, 50]) {
    for (const showLessItems of [false, true]) {
      for (const showPrevNextJumpers of [false, true]) {
        const html = renderToStaticMarkup(
          h(
            ConfigProvider,
            { prefixCls: 'apollo' },
            h(Pagination, { total, current, showLessItems, showPrevNextJumpers, pageSize: 10 }),
          ),
        );
        const allPages = Math.floor((total - 1) / 10) + 1;
        cases.push({
          total,
          /** 传进去的**原始** prop（可能越界）。 */
          current,
          /**
           * 组件**钳制后**的有效页（rc：`max(1, min(current, allPages))`）——
           * `getPagerList` 的入参是这个值（纯函数不做钳制，钳制在状态机里）。
           */
          effectiveCurrent: Math.max(1, Math.min(current, allPages)),
          showLessItems,
          showPrevNextJumpers,
          allPages,
          items: extract(html),
        });
      }
    }
  }
}

const result = {
  $schema: '../schema.json',
  component: 'pagination',
  what: '页码列表算法的判定表（机械 oracle：antd 6.6.4 SSR 产物摘要）',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] pagination.pagers.json 与当前 antd 不一致');
    process.exit(1);
  }
  console.log(`[baseline] pagination.pagers.json 最新（${cases.length} 行判定表）`);
  process.exit(0);
}

fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
console.log(`[baseline] 写入 pagination.pagers.json（${cases.length} 行判定表）`);
console.log('样例：', JSON.stringify(cases.find((c) => c.total === 500 && c.current === 10)?.items));
