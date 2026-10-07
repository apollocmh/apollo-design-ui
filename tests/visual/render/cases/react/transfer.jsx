/**
 * React 侧（antd 6.6.4）的 Transfer 视觉用例。与 vue/transfer.js **逐条对应**。
 *
 * ── 为什么这个组件此前没有 L6 覆盖 ────────────────────────────────────────────
 *
 * 2026-10-07 审计发现：72 个组件里 **71 个**在 `matrix.mjs` 与 `baselines/react/` 两边齐备，
 * **只有 transfer 两边都没有** ⇒ 它是全仓唯一的 L6 盲区（没有查到「有意跳过」的记载，判为遗漏）。
 *
 * ── 静态帧的两条纪律 ──────────────────────────────────────────────────────────
 *
 * 1. **数据静态、不绑 change 回调** —— L6 只拍静态帧，交互态归 L1/L4。
 * 2. **上下文字体钉成具体值**（与 cascader / select 同判）：
 *      React 页 → antd `reset.css` 的 `html{font-family:sans-serif}`（泛型）
 *      Vue 页   → 本仓 `BASE_CSS` 的 `html{font-family:var(--apollo-font-family)}`（具体栈）
 *    Transfer 的列表项文字靠继承 ⇒ 这处页面基座差异会直接显形（差异像素全落在文字上）。
 *    裁决见 `docs/COMPONENT-CHECKLIST.md` 第 15 条：**用例内钉字体，不动全局 BASE_CSS**。
 *
 * 🚨 **必须传 `render`**（每条都用）—— antd 6.6.4 的 `transfer/Section.js:14` 是
 *    `const defaultRender = () => null;` ⇒ 不传时列表项**内容为空**（`item.title`
 *    只会落到原生 `title` 属性与过滤逻辑上，不进 DOM 文本）。实测踩过：
 *    首版没传 `render`，9 张基线里每行只有 checkbox，而 `md5` 查重与「体积正常」
 *    都发现不了（9 个哈希互不相同、5–8 KB）—— **肉眼比对才看得出来**。
 *    ⚠️ 本仓 Vue 侧与 antd 行为一致（同为空），所以 L6 照样 exact —— 不传 `render`
 *    的假基线是「两侧一致地错」，L6 抓不到，只有人看得出来。
 */

import { Transfer } from 'antd';

const MOCK = Array.from({ length: 20 }, (_, i) => ({
  key: i.toString(),
  title: `content${i + 1}`,
  description: `description of content${i + 1}`,
  disabled: i % 4 === 0,
}));

/** 与 Vue 侧同一份派生（key % 3 > 1）⇒ 两侧初始目标列完全一致。 */
const TARGET = MOCK.filter((item) => Number(item.key) % 3 > 1).map((item) => item.key);
const SELECTED = ['1', '4'];

const CONTEXT_FONT = 'sans-serif';

const box = (children) => (
  <div style={{ padding: 24, fontFamily: CONTEXT_FONT, minHeight: 340 }}>{children}</div>
);

export default {
  basic: () =>
    box(
      <Transfer
        dataSource={MOCK}
        targetKeys={TARGET}
        selectedKeys={SELECTED}
        render={(item) => item.title}
      />,
    ),

  search: () =>
    box(<Transfer dataSource={MOCK} targetKeys={TARGET} showSearch render={(item) => item.title} />),

  oneway: () =>
    box(
      <Transfer
        dataSource={MOCK}
        targetKeys={TARGET}
        oneWay
        render={(item) => item.title}
      />,
    ),
};
