/**
 * React 侧（antd 6.6.4）的 Space 视觉用例。
 *
 * 与 `render/cases/vue/space.js` **逐条对应**：同名、同 props 语义、同文案、同替身样式。
 * 比出来的差异只能是实现差异，不能是用例差异。
 *
 * 这里允许 import antd —— `TESTING.md` A9 的唯一例外是测试目录（`tests/`）。
 * 发布包仍然零 React 依赖（门禁 E19）。
 *
 * ── ⚠️ 为什么全部用原生 `<button>` / `<input>` 替身 ──────────────────────────────
 *
 * antd 的官方 demo 用 `Button` / `Input` / `Select` / `Card`，但它们在本仓库
 * **尚未实现**（Space 在 DAG 上先于它们）。若 React 侧用 antd 的 Button、
 * Vue 侧用原生 button，比出来的差异会是「Button 的实现差异」—— 那是假阳性。
 * 所以两侧都用**同一份**替身样式（`shared.mjs` 的 `SPACE_*_STYLE`），
 * 差异才只可能来自 Space 自己。
 * 代价：这些用例**没有**覆盖「真实的 Button / Input 被 Space / Space.Compact 驱动」
 * 这条路径。缺口登记在 `matrix.mjs` 的 `LIMITATIONS` 与 `README.md` §7。
 *
 * ── ⚠️ 为什么每个用例都套一层 `SPACE_CONTEXT_STYLE` ─────────────────────────────
 *
 * `Space` 的根上**没有任何文字样式**（`resetStyle: false`），`-item` 里的裸文本
 * 字体完全继承自页面，而两侧的页面 reset 不同。理由详见 `shared.mjs`。
 */

import { Divider, Space } from 'antd';

import {
  SPACE_ALIGN_BOX_STYLE,
  SPACE_BUTTON_PRIMARY_STYLE,
  SPACE_BUTTON_STYLE,
  SPACE_CARD_BODY_STYLE,
  SPACE_CARD_HEAD_STYLE,
  SPACE_CARD_STYLE,
  SPACE_CONTEXT_STYLE,
  SPACE_INPUT_STYLE,
  SPACE_LINK_STYLE,
  SPACE_MOCK_BOX_STYLE,
  SPACE_ROW_STYLE,
  SPACE_SEMANTIC_CLASSNAMES,
  SPACE_SEMANTIC_STYLES,
  SPACE_TEXT,
} from '../shared.mjs';

/** 替身按钮（避免每处重复写同一串 props）。 */
const Btn = ({ primary, children }) => (
  <button type="button" style={primary ? SPACE_BUTTON_PRIMARY_STYLE : SPACE_BUTTON_STYLE}>
    {children}
  </button>
);

/** `vertical` 用例里的替身卡片。 */
const Card = () => (
  <div style={SPACE_CARD_STYLE}>
    <div style={SPACE_CARD_HEAD_STYLE}>{SPACE_TEXT.card}</div>
    <div style={SPACE_CARD_BODY_STYLE}>
      <p style={{ margin: '0 0 8px' }}>Card content</p>
      <p style={{ margin: 0 }}>Card content</p>
    </div>
  </div>
);

/** 把用例包进钉死上下文的外层（两侧同形）。 */
const Stage = ({ children }) => <div style={SPACE_CONTEXT_STYLE}>{children}</div>;

export default {
  basic: () => (
    <Stage>
      <Space>
        {SPACE_TEXT.base}
        <Btn primary>{SPACE_TEXT.button}</Btn>
        <Btn>{SPACE_TEXT.button}</Btn>
        <Btn>{SPACE_TEXT.button}</Btn>
      </Space>
    </Stage>
  ),

  size: () => (
    <Stage>
      <Space size="small">
        <Btn primary>small</Btn>
        <Btn>small</Btn>
        <Btn>small</Btn>
      </Space>
      <br />
      <Space size="medium">
        <Btn primary>medium</Btn>
        <Btn>medium</Btn>
        <Btn>medium</Btn>
      </Space>
      <br />
      <Space size="large">
        <Btn primary>large</Btn>
        <Btn>large</Btn>
        <Btn>large</Btn>
      </Space>
      <br />
      <Space size={24}>
        <Btn primary>24</Btn>
        <Btn>24</Btn>
        <Btn>24</Btn>
      </Space>
    </Stage>
  ),

  align: () => (
    <Stage>
      <div style={SPACE_ROW_STYLE}>
        <div style={SPACE_ALIGN_BOX_STYLE}>
          <Space align="center">
            center
            <Btn primary>{SPACE_TEXT.primary}</Btn>
            <span style={SPACE_MOCK_BOX_STYLE}>{SPACE_TEXT.block}</span>
          </Space>
        </div>
        <div style={SPACE_ALIGN_BOX_STYLE}>
          <Space align="start">
            start
            <Btn primary>{SPACE_TEXT.primary}</Btn>
            <span style={SPACE_MOCK_BOX_STYLE}>{SPACE_TEXT.block}</span>
          </Space>
        </div>
        <div style={SPACE_ALIGN_BOX_STYLE}>
          <Space align="end">
            end
            <Btn primary>{SPACE_TEXT.primary}</Btn>
            <span style={SPACE_MOCK_BOX_STYLE}>{SPACE_TEXT.block}</span>
          </Space>
        </div>
        <div style={SPACE_ALIGN_BOX_STYLE}>
          <Space align="baseline">
            baseline
            <Btn primary>{SPACE_TEXT.primary}</Btn>
            <span style={SPACE_MOCK_BOX_STYLE}>{SPACE_TEXT.block}</span>
          </Space>
        </div>
      </div>
    </Stage>
  ),

  vertical: () => (
    <Stage>
      <Space orientation="vertical" size="medium" style={{ display: 'flex' }}>
        <Card />
        <Card />
        <Card />
      </Space>
    </Stage>
  ),

  wrap: () => (
    <Stage>
      <Space size={[8, 16]} wrap>
        {Array.from({ length: 12 }).map((_, index) => (
          // eslint-disable-next-line react/no-array-index-key
          <Btn key={index}>{SPACE_TEXT.cell}</Btn>
        ))}
      </Space>
    </Stage>
  ),

  separator: () => (
    <Stage>
      <Space separator={<Divider orientation="vertical" />}>
        <a href="#separator" style={SPACE_LINK_STYLE}>
          {SPACE_TEXT.link}
        </a>
        <a href="#separator" style={SPACE_LINK_STYLE}>
          {SPACE_TEXT.link}
        </a>
        <a href="#separator" style={SPACE_LINK_STYLE}>
          {SPACE_TEXT.link}
        </a>
      </Space>
      <br />
      <Space separator={SPACE_TEXT.pipe}>
        <Btn>1</Btn>
        <Btn>2</Btn>
        <Btn>3</Btn>
      </Space>
    </Stage>
  ),

  compact: () => (
    <Stage>
      <Space.Compact block>
        <input style={{ ...SPACE_INPUT_STYLE, width: '20%' }} defaultValue="0571" readOnly />
        <input style={{ ...SPACE_INPUT_STYLE, width: '30%' }} defaultValue="26888888" readOnly />
      </Space.Compact>
      <br />
      <Space.Compact block>
        <input
          style={{ ...SPACE_INPUT_STYLE, width: 'calc(100% - 200px)' }}
          defaultValue="https://ant.design"
          readOnly
        />
        <Btn primary>{SPACE_TEXT.button}</Btn>
      </Space.Compact>
      <br />
      <Space.Compact>
        <input style={SPACE_INPUT_STYLE} defaultValue="input content" readOnly />
        <Btn>{SPACE_TEXT.button}</Btn>
        <Btn primary>{SPACE_TEXT.button}</Btn>
      </Space.Compact>
    </Stage>
  ),

  'compact-vertical': () => (
    <Stage>
      <Space>
        <Space.Compact orientation="vertical">
          <Btn>Button 1</Btn>
          <Btn>Button 2</Btn>
          <Btn>Button 3</Btn>
        </Space.Compact>
        <Space.Compact orientation="vertical">
          <Btn primary>Button 1</Btn>
          <Btn primary>Button 2</Btn>
          <Btn primary>Button 3</Btn>
        </Space.Compact>
      </Space>
    </Stage>
  ),

  semantic: () => (
    <Stage>
      <Space
        separator={SPACE_TEXT.pipe}
        classNames={SPACE_SEMANTIC_CLASSNAMES}
        styles={SPACE_SEMANTIC_STYLES}
      >
        <Btn>{SPACE_TEXT.button}</Btn>
        <Btn>{SPACE_TEXT.button}</Btn>
        <Btn>{SPACE_TEXT.button}</Btn>
      </Space>
    </Stage>
  ),
};
