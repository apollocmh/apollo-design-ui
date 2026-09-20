/**
 * React 侧（antd 6.6.4）的 Button 视觉用例。
 *
 * 与 `render/cases/vue/button.js` **逐条对应**：同名、同 props 语义、同文案。
 * 比出来的差异只能是实现差异，不能是用例差异。
 *
 * ⚠️ 所有 `style` 值都写成**字符串**（`'8px'` 而不是 `8`）。React 的
 *    `dangerousStyleValue` 会给裸数字补 px、Vue 不会 —— 用字符串把这条平台差异
 *    从用例里排除掉，否则比出来的是「单位补全不同」而不是「组件不同」。
 *
 * 这里允许 import antd —— `TESTING.md` A9 的唯一例外是测试目录（`tests/`）。
 */

import { Button } from 'antd';

import {
  BUTTON_COLOR_VARIANTS,
  BUTTON_GHOST_BG_STYLE,
  BUTTON_ROW_STYLE,
  BUTTON_SEMANTIC_CLASSNAMES,
  BUTTON_SEMANTIC_STYLES,
  BUTTON_TEXT,
} from '../shared.mjs';

/** 一行 —— 两侧同形。 */
const Row = ({ style = BUTTON_ROW_STYLE, children }) => <div style={style}>{children}</div>;

export default {
  // ---- 1. type：五种旧版类型糖 -------------------------------------------
  type: () => (
    <Row>
      <Button type="primary">{BUTTON_TEXT.primary}</Button>
      <Button>{BUTTON_TEXT.default}</Button>
      <Button type="dashed">{BUTTON_TEXT.dashed}</Button>
      <Button type="text">{BUTTON_TEXT.text}</Button>
      <Button type="link">{BUTTON_TEXT.link}</Button>
      {/* 两个中文字：antd 会插空格，我们用 ::first-letter 的 letter-spacing（D7） */}
      <Button type="primary">{BUTTON_TEXT.twoCN}</Button>
    </Row>
  ),

  // ---- 2. size：三档 ------------------------------------------------------
  size: () => (
    <Row>
      <Button type="primary" size="large">
        {BUTTON_TEXT.primary}
      </Button>
      <Button type="primary">{BUTTON_TEXT.primary}</Button>
      <Button type="primary" size="small">
        {BUTTON_TEXT.primary}
      </Button>
    </Row>
  ),

  // ---- 3. loading ---------------------------------------------------------
  //
  // 只放**确定性**的形态：`loading` 布尔与 `{ delay: 0 }` 都是「立刻加载」
  // （antd `buttonHelpers.js:22-26` 的 `delay <= 0`）。`delay > 0` 是时间驱动的，
  // 截图时刻不确定 ⇒ 会 flaky，它的语义由 L2 在假定时器下钉住。
  loading: () => (
    <Row>
      <Button type="primary" loading>
        {BUTTON_TEXT.loading}
      </Button>
      <Button type="primary" loading={{ delay: 0 }}>
        {BUTTON_TEXT.loading}
      </Button>
      <Button type="primary">{BUTTON_TEXT.submit}</Button>
    </Row>
  ),

  // ---- 4. disabled（含 <a> 分支）-----------------------------------------
  disabled: () => (
    <Row>
      <Button type="primary">{BUTTON_TEXT.primary}</Button>
      <Button type="primary" disabled>
        {BUTTON_TEXT.primary}
      </Button>
      <Button type="text" disabled>
        {BUTTON_TEXT.text}
      </Button>
      <Button type="link" disabled>
        {BUTTON_TEXT.link}
      </Button>
      <Button type="primary" href="https://example.com" disabled>
        {BUTTON_TEXT.link}
      </Button>
    </Row>
  ),

  // ---- 5. danger ----------------------------------------------------------
  danger: () => (
    <Row>
      <Button type="primary" danger>
        {BUTTON_TEXT.danger}
      </Button>
      <Button danger>{BUTTON_TEXT.danger}</Button>
      <Button type="dashed" danger>
        {BUTTON_TEXT.danger}
      </Button>
      <Button type="text" danger>
        {BUTTON_TEXT.danger}
      </Button>
      <Button type="link" danger>
        {BUTTON_TEXT.danger}
      </Button>
    </Row>
  ),

  // ---- 6. ghost（放在有色背景上）------------------------------------------
  ghost: () => (
    <Row style={BUTTON_GHOST_BG_STYLE}>
      <Button type="primary" ghost>
        {BUTTON_TEXT.primary}
      </Button>
      <Button ghost>{BUTTON_TEXT.default}</Button>
      <Button type="dashed" ghost>
        {BUTTON_TEXT.dashed}
      </Button>
      <Button type="primary" danger ghost>
        {BUTTON_TEXT.danger}
      </Button>
    </Row>
  ),

  // ---- 7. icon：prop / 仅图标 / iconPlacement ------------------------------
  icon: () => (
    <Row>
      <Button type="primary" icon={<span>🔍</span>}>
        Search
      </Button>
      <Button type="primary" icon={<span>🔍</span>} iconPlacement="end">
        Search
      </Button>
      <Button type="primary" icon={<span>🔍</span>} />
      <Button icon={<span>🔍</span>} />
      <Button type="primary" shape="circle" icon={<span>🔍</span>} />
      <Button type="primary" shape="round">
        Round
      </Button>
    </Row>
  ),

  // ---- 8. color × variant -------------------------------------------------
  'color-variant': () => (
    <Row>
      {BUTTON_COLOR_VARIANTS.map(({ color, variant }) => (
        <Button key={`${color}-${variant}`} color={color} variant={variant}>
          {`${color} ${variant}`}
        </Button>
      ))}
    </Row>
  ),

  // ---- 9. 语义化 classNames / styles --------------------------------------
  semantic: () => (
    <Row>
      <Button
        type="primary"
        icon={<span>🔍</span>}
        classNames={BUTTON_SEMANTIC_CLASSNAMES}
        styles={BUTTON_SEMANTIC_STYLES}
      >
        {BUTTON_TEXT.semantic}
      </Button>
    </Row>
  ),
};
