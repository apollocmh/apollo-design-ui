/**
 * React 侧（antd 6.6.4）的 Typography 视觉用例。
 *
 * 与 `render/cases/vue/typography.js` **逐条对应**：同名、同 props 语义、同文案。
 * 比出来的差异只能是实现差异，不能是用例差异。
 *
 * ── 两条与 Divider / Spin 不同的约定 ─────────────────────────────────────────
 *
 * 1. antd **只**从顶层导出 `Typography`（`es/index.js` 里没有 `Text` / `Title` /
 *    `Paragraph` / `Link`），所以这里必须 `Typography.Text` 这样取子组件。
 *    我们那边两者都导出 —— 这里取子组件形态，顺便把「复合组件挂载」这条路径
 *    也纳入比对（Vue 侧对应 `Typography.Text`）。
 *
 * 2. 用例里**不渲染任何 Typography 之外的文字**。理由见 `shared.mjs` 的
 *    「没有 `TYPOGRAPHY_CONTEXT_FONT`」：两侧页面的**非组件文字**字体栈确实不同
 *    （React 页 `antd/dist/reset.css` 的 `html{font-family:sans-serif}`，
 *    Vue 页是我们 token 字体栈），渲染进去比的就是字体栈而不是组件。
 *    需要排布时只用**没有文字**的 `div` + 内联样式。
 *
 * ⚠️ 所有 `style` 值都写成**字符串**（`'8px'` 而不是 `8`）。React 的
 *    `dangerousStyleValue` 会给裸数字补 px、Vue 不会 —— 用字符串把这条平台差异
 *    从用例里排除掉，否则比出来的是「单位补全不同」而不是「组件不同」。
 *
 * 这里允许 import antd —— `TESTING.md` A9 的唯一例外是测试目录（`tests/`）。
 */

import { Typography } from 'antd';

import {
  TYPOGRAPHY_COLUMN_STYLE,
  TYPOGRAPHY_ELLIPSIS_BOX_STYLE,
  TYPOGRAPHY_ROW_STYLE,
  TYPOGRAPHY_SEMANTIC_CLASSNAMES,
  TYPOGRAPHY_SEMANTIC_STYLES,
  TYPOGRAPHY_TEXT,
} from '../shared.mjs';

const { Text, Title, Paragraph, Link } = Typography;

const T = TYPOGRAPHY_TEXT;
/**
 * 七个装饰标签共用同一段文案。
 *
 * 文案本身不是被比对面（两侧逐字相同），被比的是**标签名与嵌套顺序**：
 * `code → <code>`、`mark → <mark>`、`strong → <strong>` ……
 * 用同一段文案还能让「七个装饰的横向排布」在两侧完全可比。
 */
const D = T.decoration;

export default {
  // ---- 1. Text：基础 + 四种语义色 + disabled -----------------------------
  text: () => (
    <div style={TYPOGRAPHY_COLUMN_STYLE}>
      <div style={TYPOGRAPHY_ROW_STYLE}>
        <Text>{T.base}</Text>
        <Text type="secondary">{T.secondary}</Text>
        <Text type="success">{T.success}</Text>
        <Text type="warning">{T.warning}</Text>
        <Text type="danger">{T.danger}</Text>
      </div>
      {/* `disabled` 只加一个类名，不产 `aria-disabled` —— 并排放一个正常态做对照 */}
      <div style={TYPOGRAPHY_ROW_STYLE}>
        <Text>{T.base}</Text>
        <Text disabled>{T.disabled}</Text>
      </div>
    </div>
  ),

  // ---- 2. Title：h1 ~ h5 五级 ---------------------------------------------
  // 不套排布容器：五级标题的 `margin-top` / `margin-bottom` 本身就是被比对面
  // （我们的 `BASE_CSS` 里 h1~h6 的 margin 重置不完整，靠 `getHeadingMarginReset` 补偿）。
  title: () => (
    <>
      <Title level={1}>{T.title}</Title>
      <Title level={2}>{T.title}</Title>
      <Title level={3}>{T.title}</Title>
      <Title level={4}>{T.title}</Title>
      <Title level={5}>{T.title}</Title>
    </>
  ),

  // ---- 3. Paragraph：默认 + 多段（`div&` 的 margin-bottom）-----------------
  // 同上：不套容器，让 `div.ant-typography{margin-bottom}` 的堆叠行为可见。
  paragraph: () => (
    <>
      <Paragraph>{T.lorem}</Paragraph>
      <Paragraph>{T.lorem}</Paragraph>
      <Paragraph type="secondary">{T.lorem}</Paragraph>
    </>
  ),

  // ---- 4. 七个装饰标签 + 一次全叠加 --------------------------------------
  decorations: () => (
    <div style={TYPOGRAPHY_COLUMN_STYLE}>
      <div style={TYPOGRAPHY_ROW_STYLE}>
        <Text code>{D}</Text>
        <Text mark>{D}</Text>
        <Text underline>{D}</Text>
        <Text delete>{D}</Text>
        <Text strong>{D}</Text>
        <Text keyboard>{D}</Text>
        <Text italic>{D}</Text>
      </div>
      {/*
        全叠加：钉住嵌套顺序契约 `strong → u → del → code → mark → kbd → i`
        （最内 → 最外）。顺序错了 DOM 契约层也会红（`__tests__/semantic.test.ts`），
        这里再钉一次「顺序错 → 像素也变」。
      */}
      <div style={TYPOGRAPHY_ROW_STYLE}>
        <Text strong underline delete code mark keyboard italic>
          {D}
        </Text>
      </div>
    </div>
  ),

  // ---- 5. Link：默认 / 语义色 / disabled / target=_blank ------------------
  link: () => (
    <div style={TYPOGRAPHY_COLUMN_STYLE}>
      <div style={TYPOGRAPHY_ROW_STYLE}>
        <Link href="#demo">{T.link}</Link>
        <Link href="#demo" type="secondary">
          {T.secondary}
        </Link>
        <Link href="#demo" type="danger">
          {T.danger}
        </Link>
      </div>
      <div style={TYPOGRAPHY_ROW_STYLE}>
        <Link href="#demo" disabled>
          {T.disabled}
        </Link>
        {/* `target="_blank"` 且未给 `rel` 时自动补 `noopener noreferrer` */}
        <Link href="#demo" target="_blank">
          {T.link}
        </Link>
      </div>
    </div>
  ),

  // ---- 6. ellipsis：单行 / 多行 / 可展开 ----------------------------------
  // 定宽盒子 + 超长文案 ⇒ 两侧都必须**真实测量**后决定截断位置。
  // 单行与 `rows:2` 走 CSS 路径（`-webkit-line-clamp`），
  // `expandable` 会走 JS 二分裁剪路径（这是我们与 antd 最容易分叉的地方）。
  ellipsis: () => (
    <div style={TYPOGRAPHY_ELLIPSIS_BOX_STYLE}>
      <Paragraph ellipsis>{T.ellipsis}</Paragraph>
      <Paragraph ellipsis={{ rows: 2 }}>{T.ellipsis}</Paragraph>
      <Paragraph ellipsis={{ rows: 2, expandable: 'collapsible' }}>{T.ellipsis}</Paragraph>
    </div>
  ),

  // ---- 7. copyable：复制按钮（未复制态）-----------------------------------
  // 悬浮提示（Tooltip）尚未落地，所以这里只比「按钮本身」。
  // `iconOnly` 的判据是「有没有内容」—— 两个用例都有内容，按钮都是带 `-copy` 的图标按钮。
  copyable: () => (
    <div style={TYPOGRAPHY_COLUMN_STYLE}>
      <Paragraph copyable>{T.copyable}</Paragraph>
      <Text copyable>{T.copyable}</Text>
    </div>
  ),

  // ---- 8. 语义化 classNames / styles -------------------------------------
  // 用 `expandable: 'collapsible'` 造出操作区：展开按钮不带图标，
  // 于是 `root` / `actions` / `action` 三个槽位都能被比到，且不引入图标差异。
  semantic: () => (
    <div style={TYPOGRAPHY_ELLIPSIS_BOX_STYLE}>
      <Paragraph
        classNames={TYPOGRAPHY_SEMANTIC_CLASSNAMES}
        styles={TYPOGRAPHY_SEMANTIC_STYLES}
        ellipsis={{ rows: 2, expandable: 'collapsible' }}
      >
        {T.ellipsis}
      </Paragraph>
    </div>
  ),
};
