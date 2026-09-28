/**
 * Vue 侧（@apollo-design/ui）的 Cascader 视觉用例。与 react/cascader.jsx 逐条对应。
 */

import { Cascader, CascaderPanel } from '@apollo-design/ui';
import { h } from 'vue';

const OPTIONS = [
  {
    value: 'zhejiang',
    label: '浙江',
    children: [
      { value: 'hangzhou', label: '杭州', children: [{ value: 'xihu', label: '西湖' }] },
      { value: 'ningbo', label: '宁波' },
    ],
  },
  { value: 'jiangsu', label: '江苏', children: [{ value: 'nanjing', label: '南京' }] },
];

/**
 * ⚠️ 上下文字体**必须钉成具体值**（与 divider / space / spin / typography 同判）：
 *   React 页 → antd `reset.css` 的 `html{font-family:sans-serif}`（泛型）
 *   Vue 页   → 本仓 `BASE_CSS` 的 `html{font-family:var(--apollo-font-family)}`（具体栈）
 * cascader 的**面板与列**在 antd 里没有 font-family（`style/panel.js` +
 * `style/index.js` 都是 `resetFont: false`）⇒ 靠继承，这处页面基座差异会直接显形
 * （差异像素全落在文字与 1px 边框上）。裁决见 `docs/COMPONENT-CHECKLIST.md` 第 15 条：
 * **用例内钉字体，不动全局 BASE_CSS**（COMPATIBILITY.md D114）。
 */
const CONTEXT_FONT = 'sans-serif';

const box = (children) =>
  h(
    'div',
    {
      style: {
        minHeight: '260px',
        padding: '24px',
        display: 'flex',
        alignItems: 'flex-end',
        fontFamily: CONTEXT_FONT,
      },
    },
    children,
  );

export default {
  basic: () =>
    box(
      h('div', { style: { position: 'relative' } }, [
        h(Cascader, {
          options: OPTIONS,
          open: true,
          placement: 'bottomLeft',
          defaultValue: ['zhejiang', 'hangzhou'],
        }),
        h('div', { style: { position: 'absolute', top: '100%', left: 0, minWidth: '480px' } }, [
          h(CascaderPanel, { options: OPTIONS }),
        ]),
      ]),
    ),

  multiple: () =>
    box(
      h('div', { style: { position: 'relative' } }, [
        h(Cascader, { multiple: true, options: OPTIONS, open: true, placement: 'bottomLeft' }),
        h('div', { style: { position: 'absolute', top: '100%', left: 0, minWidth: '480px' } }, [
          h(CascaderPanel, { options: OPTIONS, multiple: true }),
        ]),
      ]),
    ),

  panel: () => box(h(CascaderPanel, { options: OPTIONS })),
};
