#!/usr/bin/env node
/**
 * tests/compat/baseline/tabs.mjs — 生成 antd 6.6.4 Tabs 的 DOM 基线（机械 oracle）。
 *
 * ── 判据（基线只钉「参数驱动的确定形态」）──────────────────────────────────────
 *
 *   - 值：`items` 的 key / label（含 icon 的**包 span** 分支）/ disabled / closable
 *   - 模式：`type`（line / card / editable-card）/ `centered` / `size` 三档
 *   - 方位：`tabPlacement` 四值 `top` / `bottom` / `start` / `end`
 *     ⚠️ 只认这四个 —— 上游 `TabPlacement = 'top' | 'end' | 'bottom' | 'start'`
 *     （`es/tabs/index.d.ts:10`）。
 *     本轮修正：原先的 `tabs:left` / `tabs:right` 两个用例已删除，改成只留
 *     `start` / `end`。**判据（读上游源码确认，不是推测）** —— `es/tabs/index.js:101-114`：
 *     ```js
 *     const placement = tabPlacement ?? tabPosition ?? undefined;
 *     const isRTL = direction === 'rtl';
 *     switch (placement) {
 *       case 'start': return isRTL ? 'right' : 'left';
 *       case 'end':   return isRTL ? 'left'  : 'right';
 *       default:      return placement;   // ← 'left' / 'right' 原样直通
 *     }
 *     ```
 *     ⇒ `'left'` / `'right'` 走的是 **`default` 直通分支**，在 **LTR 下与
 *     `start` / `end` 渲染完全相同**（rc-tabs 的 `tabPosition` 本来就收这两个值），
 *     所以那两个用例是**冗余的**、而且用的是**未声明的值**。
 *     在 **RTL 下**它们才是真的不一样：`start`/`end` 会镜像，`left`/`right` 不会
 *     —— 这正是必须换掉的第二个理由（本仓的基线与 L6 用例都只跑 LTR，
 *     留着它们等于把「只在 LTR 侥幸正确」的写法固化成规格）。
 *   - 装饰：`tabBarGutter` / `tabBarExtraContent`（单节点与 `{left,right}`）/
 *     `indicator`（align / size）/ `animated`（`tabPane` 开时的 `-animated` 类）
 *   - 面板：`forceRender` / `destroyOnHidden` / 无 `children`
 *   - id 关联：**显式传 `id`** ⇒ `aria-controls` / `id` / `aria-labelledby` 都渲染
 *
 * ── 🚨 为什么必须显式传 `id` ───────────────────────────────────────────────────
 *
 * rc 的 `id` 是**异步生成**的（`useEffect` 里 `setMergedId(...)`）⇒ **SSR 首帧 `id` 是 `null`**，
 * 于是 `aria-controls` / `aria-labelledby` / `id` 全都不渲染。而本仓的 L4 是
 * 「客户端挂载后的 DOM vs antd 的 SSR DOM」⇒ 两边会**系统性错位**（我们多出三个属性）。
 * 显式传 `id` 让两侧都确定（`mergedId = id`），这是**唯一**能对齐的口径。
 * 「不传 id 时首帧没有 aria、挂载后有」这条语义由 L2 的用例单独钉。
 *
 * ⚠️ **导航区的溢出（`-nav-more` 真的出现）不在基线里**：它由 DOM 实测驱动
 *    （`ResizeObserver` + `getBoundingClientRect`），SSR 恒判定为「没有隐藏页签」⇒
 *    基线里只有 `-nav-operations` 的空壳。那条线由 L6 视觉（真浏览器 + 窄容器）钉。
 *
 * 运行：node tests/compat/baseline/tabs.mjs [--check]
 */

import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../baselines/tabs.dom.json');
const check = process.argv.includes('--check');

const require = createRequire(import.meta.url);
const antdPkg = require('antd/package.json');
const { Tabs, ConfigProvider } = require('antd');

// ⚠️ `iconPrefixCls` 必须一起传：antd 的图标前缀默认是 `anticon`，本仓是 `apollo-icon`
//    （差异 **D14**），不传会让每条用例多出图标类名噪音（与 pagination / result.mjs 同判）。
const wrap = (node) =>
  h(ConfigProvider, { prefixCls: 'apollo', iconPrefixCls: 'apollo-icon' }, node);

/** 固定的 id（见文件头：不传时两侧对不上）。 */
const ID = 'tabs-test';

const items = () => [
  { key: '1', label: 'Tab 1', children: 'Pane 1' },
  { key: '2', label: 'Tab 2', children: 'Pane 2' },
  { key: '3', label: 'Tab 3', children: 'Pane 3', disabled: true },
];

const cases = [];
const push = (id, node) => {
  cases.push({ id, html: renderToStaticMarkup(wrap(node)) });
};

// ── 基础 ──
push('tabs:basic', h(Tabs, { id: ID, defaultActiveKey: '1', items: items() }));
push('tabs:active-second', h(Tabs, { id: ID, defaultActiveKey: '2', items: items() }));
push('tabs:no-items', h(Tabs, { id: ID, items: [] }));
push('tabs:no-children', h(Tabs, { id: ID, items: [{ key: '1', label: 'Only' }] }));

// ── type ──
push('tabs:card', h(Tabs, { id: ID, defaultActiveKey: '1', type: 'card', items: items() }));
push(
  'tabs:editable-card',
  h(Tabs, {
    id: ID,
    defaultActiveKey: '1',
    type: 'editable-card',
    items: items(),
    // `onEdit` 必须有，否则 rc 的 AddButton 仍然渲染（rc 只看 `showAdd`），
    // 但 antd 的 `editable` 只有在 `type==='editable-card'` 时才组装 ⇒ 给个空函数更稳
    onEdit: () => {},
  }),
);
push(
  'tabs:editable-hide-add',
  h(Tabs, {
    id: ID,
    defaultActiveKey: '1',
    type: 'editable-card',
    hideAdd: true,
    items: items(),
    onEdit: () => {},
  }),
);
push(
  'tabs:editable-closable-false',
  h(Tabs, {
    id: ID,
    defaultActiveKey: '1',
    type: 'editable-card',
    items: [
      { key: '1', label: 'A', children: 'a', closable: false },
      { key: '2', label: 'B', children: 'b' },
    ],
    onEdit: () => {},
  }),
);
push(
  'tabs:centered-card',
  h(Tabs, { id: ID, defaultActiveKey: '1', type: 'card', centered: true, items: items() }),
);

// ── 方位 ──
push(
  'tabs:bottom',
  h(Tabs, { id: ID, defaultActiveKey: '1', tabPlacement: 'bottom', items: items() }),
);
push(
  'tabs:start',
  h(Tabs, { id: ID, defaultActiveKey: '1', tabPlacement: 'start', items: items() }),
);
push('tabs:end', h(Tabs, { id: ID, defaultActiveKey: '1', tabPlacement: 'end', items: items() }));

// ── 尺寸 ──
push('tabs:small', h(Tabs, { id: ID, defaultActiveKey: '1', size: 'small', items: items() }));
push('tabs:large', h(Tabs, { id: ID, defaultActiveKey: '1', size: 'large', items: items() }));

// ── 装饰 ──
push('tabs:gutter', h(Tabs, { id: ID, defaultActiveKey: '1', tabBarGutter: 24, items: items() }));
push(
  'tabs:animated-true',
  h(Tabs, { id: ID, defaultActiveKey: '1', animated: true, items: items() }),
);
push(
  'tabs:animated-false',
  h(Tabs, { id: ID, defaultActiveKey: '1', animated: false, items: items() }),
);
push(
  'tabs:extra-right',
  h(Tabs, {
    id: ID,
    defaultActiveKey: '1',
    items: items(),
    tabBarExtraContent: h('span', { className: 'extra-node' }, 'extra'),
  }),
);
push(
  'tabs:extra-both',
  h(Tabs, {
    id: ID,
    defaultActiveKey: '1',
    items: items(),
    tabBarExtraContent: {
      left: h('span', { className: 'extra-left-node' }, 'L'),
      right: h('span', { className: 'extra-right-node' }, 'R'),
    },
  }),
);
push(
  'tabs:indicator-start',
  h(Tabs, { id: ID, defaultActiveKey: '1', items: items(), indicator: { align: 'start' } }),
);
push(
  'tabs:indicator-size',
  h(Tabs, { id: ID, defaultActiveKey: '1', items: items(), indicator: { size: 20 } }),
);

// ── 面板 ──
push(
  'tabs:force-render',
  h(Tabs, {
    id: ID,
    defaultActiveKey: '1',
    items: [
      { key: '1', label: 'Tab 1', children: 'Pane 1' },
      { key: '2', label: 'Tab 2', children: 'Pane 2', forceRender: true },
    ],
  }),
);
push(
  'tabs:destroy-on-hidden',
  h(Tabs, { id: ID, defaultActiveKey: '1', destroyOnHidden: true, items: items() }),
);

// ── 语义槽 ──
push(
  'tabs:semantic',
  h(Tabs, {
    id: ID,
    defaultActiveKey: '1',
    items: items(),
    classNames: { root: 'c-root', item: 'c-item', indicator: 'c-indicator' },
  }),
);

const result = {
  $schema: '../schema.json',
  component: 'tabs',
  antdVersion: antdPkg.version,
  generatedAt: new Date().toISOString(),
  cases,
};

if (check) {
  const existing = JSON.parse(fs.readFileSync(OUT_FILE, 'utf8'));
  const same = JSON.stringify(existing.cases) === JSON.stringify(cases);
  if (!same) {
    console.error('[baseline] tabs.dom.json 与当前 antd 产物不一致');
    process.exit(1);
  }
  console.log(`[baseline] tabs.dom.json 最新（${cases.length} 用例）`);
  process.exit(0);
}

fs.writeFileSync(OUT_FILE, `${JSON.stringify(result, null, 2)}\n`);
console.log(`[baseline] tabs.dom.json 已写入（${cases.length} 用例）`);
