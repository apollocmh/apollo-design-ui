/**
 * Vue 侧（@apollo-design/ui）的 Button 视觉用例。
 *
 * 与 `render/cases/react/button.jsx` **逐条对应**。用 `h()` 而不是 SFC —— 理由同
 * `vue/divider.js`：用例是「一份 props 组合」，写成函数调用才能与 React 侧一一对照。
 *
 * ⚠️ `style` 值全部写成字符串，理由见 React 侧的文件头（单位补全的平台差异）。
 */

import { Button } from '@apollo-design/ui';
import { h } from 'vue';

import {
  BUTTON_COLOR_VARIANTS,
  BUTTON_GHOST_BG_STYLE,
  BUTTON_ROW_STYLE,
  BUTTON_SEMANTIC_CLASSNAMES,
  BUTTON_SEMANTIC_STYLES,
  BUTTON_TEXT,
} from '../shared.mjs';

/** 一行 —— 与 React 侧同形。 */
const Row = (style, children) => h('div', { style }, children);

/** 图标 —— 两侧同一份 DOM（`🔍` 的墨迹由同一个 Chromium 渲染，跨平台一致）。 */
const iconNode = () => h('span', '🔍');

/**
 * **组件形态**的图标 —— Vue 侧的对应物是**组件对象**（差异 D42）。
 *
 * antd 写 `icon={<SearchIcon />}`（React 元素）；Vue 没有「元素」形态，写
 * `icon: SearchIconComponent`。两者渲染出的 DOM 完全相同
 * （都是 `<span class="…-btn-icon"><span>🔍</span></span>`）。
 * 这一行用来钉住「组件形态的 icon 真的渲染出图标，而不是字面量 `[object Object]`」——
 * 后者是「只放宽类型、不做渲染归一化」时的实际表现（PITFALLS 135）。
 */
const SearchIconComponent = { name: 'SearchIcon', setup: () => () => h('span', '🔍') };

export default {
  // ---- 1. type：五种旧版类型糖 -------------------------------------------
  type: () =>
    Row(BUTTON_ROW_STYLE, [
      h(Button, { type: 'primary' }, { default: () => BUTTON_TEXT.primary }),
      h(Button, null, { default: () => BUTTON_TEXT.default }),
      h(Button, { type: 'dashed' }, { default: () => BUTTON_TEXT.dashed }),
      h(Button, { type: 'text' }, { default: () => BUTTON_TEXT.text }),
      h(Button, { type: 'link' }, { default: () => BUTTON_TEXT.link }),
      // 两个中文字：antd 拼 `确 定`，我们用 `::first-letter` 的 letter-spacing（D7）。
      // 这是**已知形态差异**：视觉层就是用来裁决它是否与像素等价的。
      h(Button, { type: 'primary' }, { default: () => BUTTON_TEXT.twoCN }),
    ]),

  // ---- 2. size：三档 ------------------------------------------------------
  size: () =>
    Row(BUTTON_ROW_STYLE, [
      h(Button, { type: 'primary', size: 'large' }, { default: () => BUTTON_TEXT.primary }),
      h(Button, { type: 'primary' }, { default: () => BUTTON_TEXT.primary }),
      h(Button, { type: 'primary', size: 'small' }, { default: () => BUTTON_TEXT.primary }),
    ]),

  // ---- 3. loading ---------------------------------------------------------
  //
  // 只放**确定性**的形态：`loading` 布尔与 `{ delay: 0 }` 都是「立刻加载」
  // （antd `buttonHelpers.js:22-26` 的 `delay <= 0`）。`delay > 0` 是时间驱动的，
  // 截图时刻不确定 ⇒ 会 flaky，它的语义由 L2 在假定时器下钉住。
  loading: () =>
    Row(BUTTON_ROW_STYLE, [
      h(Button, { type: 'primary', loading: true }, { default: () => BUTTON_TEXT.loading }),
      h(Button, { type: 'primary', loading: { delay: 0 } }, { default: () => BUTTON_TEXT.loading }),
      h(Button, { type: 'primary' }, { default: () => BUTTON_TEXT.submit }),
    ]),

  // ---- 4. disabled（含 <a> 分支）-----------------------------------------
  disabled: () =>
    Row(BUTTON_ROW_STYLE, [
      h(Button, { type: 'primary' }, { default: () => BUTTON_TEXT.primary }),
      h(Button, { type: 'primary', disabled: true }, { default: () => BUTTON_TEXT.primary }),
      h(Button, { type: 'text', disabled: true }, { default: () => BUTTON_TEXT.text }),
      h(Button, { type: 'link', disabled: true }, { default: () => BUTTON_TEXT.link }),
      h(
        Button,
        { type: 'primary', href: 'https://example.com', disabled: true },
        { default: () => BUTTON_TEXT.link },
      ),
    ]),

  // ---- 5. danger ----------------------------------------------------------
  danger: () =>
    Row(BUTTON_ROW_STYLE, [
      h(Button, { type: 'primary', danger: true }, { default: () => BUTTON_TEXT.danger }),
      h(Button, { danger: true }, { default: () => BUTTON_TEXT.danger }),
      h(Button, { type: 'dashed', danger: true }, { default: () => BUTTON_TEXT.danger }),
      h(Button, { type: 'text', danger: true }, { default: () => BUTTON_TEXT.danger }),
      h(Button, { type: 'link', danger: true }, { default: () => BUTTON_TEXT.danger }),
    ]),

  // ---- 6. ghost（放在有色背景上）------------------------------------------
  ghost: () =>
    Row(BUTTON_GHOST_BG_STYLE, [
      h(Button, { type: 'primary', ghost: true }, { default: () => BUTTON_TEXT.primary }),
      h(Button, { ghost: true }, { default: () => BUTTON_TEXT.default }),
      h(Button, { type: 'dashed', ghost: true }, { default: () => BUTTON_TEXT.dashed }),
      h(
        Button,
        { type: 'primary', danger: true, ghost: true },
        { default: () => BUTTON_TEXT.danger },
      ),
    ]),

  // ---- 7. icon：prop / 仅图标 / iconPlacement / shape ----------------------
  icon: () =>
    Row(BUTTON_ROW_STYLE, [
      h(Button, { type: 'primary', icon: iconNode() }, { default: () => 'Search' }),
      h(
        Button,
        { type: 'primary', icon: iconNode(), iconPlacement: 'end' },
        { default: () => 'Search' },
      ),
      h(Button, { type: 'primary', icon: iconNode() }),
      h(Button, { icon: iconNode() }),
      h(Button, { type: 'primary', shape: 'circle', icon: iconNode() }),
      // 组件形态（差异 D42）：`icon` 收到的是**组件**，不是 VNode
      h(Button, { type: 'primary', icon: SearchIconComponent }, { default: () => 'Search' }),
      h(Button, { type: 'primary', shape: 'round' }, { default: () => 'Round' }),
    ]),

  // ---- 8. color × variant -------------------------------------------------
  'color-variant': () =>
    Row(
      BUTTON_ROW_STYLE,
      BUTTON_COLOR_VARIANTS.map(({ color, variant }) =>
        h(
          Button,
          { key: `${color}-${variant}`, color, variant },
          {
            default: () => `${color} ${variant}`,
          },
        ),
      ),
    ),

  // ---- 9. 语义化 classNames / styles --------------------------------------
  semantic: () =>
    Row(BUTTON_ROW_STYLE, [
      h(
        Button,
        {
          type: 'primary',
          icon: iconNode(),
          classNames: BUTTON_SEMANTIC_CLASSNAMES,
          styles: BUTTON_SEMANTIC_STYLES,
        },
        { default: () => BUTTON_TEXT.semantic },
      ),
    ]),
};
