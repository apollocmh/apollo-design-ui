/**
 * React 侧（antd 6.6.4）的 Divider 视觉用例。
 *
 * 与 `render/cases/vue/divider.js` **逐条对应**：同名、同 props 语义、同文案。
 * 比出来的差异只能是实现差异，不能是用例差异。
 *
 * ⚠️ 所有 `style` 值都写成**字符串**（`'2px'` 而不是 `2`）。React 的
 *    `dangerousStyleValue` 会给裸数字补 px、Vue 不会 —— 用字符串把这条平台差异
 *    从用例里排除掉，否则比出来的是「单位补全不同」而不是「组件不同」。
 *
 * 这里允许 import antd —— `TESTING.md` A9 的唯一例外是测试目录（`tests/`）。
 */

import { Divider } from 'antd';

import {
  DIVIDER_CUSTOM_BORDER,
  DIVIDER_INLINE_STYLE,
  DIVIDER_LINK_STYLE,
  DIVIDER_PARAGRAPH_STYLE,
  DIVIDER_SEMANTIC_CLASSNAMES,
  DIVIDER_SEMANTIC_STYLES,
  DIVIDER_TEXT,
} from '../shared.mjs';

/** 段落 —— 两侧同形。 */
const P = ({ children }) => <p style={DIVIDER_PARAGRAPH_STYLE}>{children}</p>;

export default {
  // ---- 1. 基本形态：水平 + 虚线 -------------------------------------------
  horizontal: () => (
    <>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider />
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider dashed />
      <P>{DIVIDER_TEXT.lorem}</P>
    </>
  ),

  // ---- 2. 带文字：center / start / end + styles.content.margin ------------
  'with-text': () => (
    <>
      <Divider>{DIVIDER_TEXT.center}</Divider>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider titlePlacement="start">{DIVIDER_TEXT.start}</Divider>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider titlePlacement="end">{DIVIDER_TEXT.end}</Divider>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider titlePlacement="start" styles={{ content: { margin: '0' } }}>
        {DIVIDER_TEXT.start}
      </Divider>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider titlePlacement="end" styles={{ content: { margin: '0 50px' } }}>
        {DIVIDER_TEXT.end}
      </Divider>
    </>
  ),

  // ---- 3. 垂直：orientation 与 vertical 两条路径 --------------------------
  vertical: () => (
    <div style={DIVIDER_INLINE_STYLE}>
      {DIVIDER_TEXT.inline}
      <Divider orientation="vertical" />
      <a href="#demo" style={DIVIDER_LINK_STYLE}>
        {DIVIDER_TEXT.link}
      </a>
      <Divider vertical />
      <a href="#demo" style={DIVIDER_LINK_STYLE}>
        {DIVIDER_TEXT.link}
      </a>
    </div>
  ),

  // ---- 4. 变体：solid / dotted / dashed ----------------------------------
  variant: () => (
    <>
      <Divider style={{ borderColor: DIVIDER_CUSTOM_BORDER }}>{DIVIDER_TEXT.solid}</Divider>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider variant="dotted" style={{ borderColor: DIVIDER_CUSTOM_BORDER }}>
        {DIVIDER_TEXT.dotted}
      </Divider>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider variant="dashed" dashed style={{ borderColor: DIVIDER_CUSTOM_BORDER }}>
        {DIVIDER_TEXT.dashed}
      </Divider>
    </>
  ),

  // ---- 5. 间距大小：small / medium / large --------------------------------
  size: () => (
    <>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider size="small" />
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider size="medium" />
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider size="large" />
      <P>{DIVIDER_TEXT.lorem}</P>
    </>
  ),

  // ---- 6. plain：正文样式的标题 ------------------------------------------
  plain: () => (
    <>
      <Divider plain>{DIVIDER_TEXT.center}</Divider>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider titlePlacement="start" plain>
        {DIVIDER_TEXT.start}
      </Divider>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider titlePlacement="end" plain>
        {DIVIDER_TEXT.end}
      </Divider>
    </>
  ),

  // ---- 7. 样式自定义：`style` 覆盖 borderColor / borderWidth -------------
  'customize-style': () => (
    <>
      <Divider style={{ borderWidth: '2px', borderColor: DIVIDER_CUSTOM_BORDER }} />
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider style={{ borderColor: DIVIDER_CUSTOM_BORDER }} dashed />
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider style={{ borderColor: DIVIDER_CUSTOM_BORDER }} dashed>
        {DIVIDER_TEXT.center}
      </Divider>
    </>
  ),

  // ---- 8. 语义化 classNames / styles -------------------------------------
  semantic: () => (
    <>
      <Divider classNames={DIVIDER_SEMANTIC_CLASSNAMES} styles={DIVIDER_SEMANTIC_STYLES}>
        {DIVIDER_TEXT.center}
      </Divider>
      <P>{DIVIDER_TEXT.lorem}</P>
      <Divider
        titlePlacement="start"
        classNames={DIVIDER_SEMANTIC_CLASSNAMES}
        styles={DIVIDER_SEMANTIC_STYLES}
      >
        {DIVIDER_TEXT.start}
      </Divider>
    </>
  ),
};
