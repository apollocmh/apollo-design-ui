/**
 * React 侧（antd 6.6.4）的 Avatar 视觉用例。与 `vue/avatar.js` 逐条对应。
 *
 * ── 与其它组件的差异 ─────────────────────────────────────────────────────────
 *
 * Avatar **没有浮层**（`group-max` 的溢出 Popover 在静态帧里不展开）
 * ⇒ 不需要 `getPopupContainer`。它的视觉面是**几何**：宽高、圆角、字号、字符缩放。
 *
 * ── 两条必须钉住的东西 ───────────────────────────────────────────────────────
 *
 * 1. **字体**（`AVATAR_BOX_STYLE`）：字符头像的 `fontSize` 与 `scale` 都由测量决定
 *    ⇒ 字体一变，「多长算超宽」就变 ⇒ 截图全红。
 * 2. **容器宽度 320px**：三个视口下容器一致（唯一该变的是 `responsive` 变体）。
 *
 * ── 每个变体命中的「非显然」样式面 ───────────────────────────────────────────
 *
 * | 变体 | 命中的规则 |
 * |---|---|
 * | `square` | `.{p}.{p}-square` 的 `border-radius`（三个尺寸档各一条） |
 * | `overflow` | `setScaleParam` 产出的**内联** `transform: scale(n)`（真浏览器里 offsetWidth 有效） |
 * | `icon` | `.{p}.{p}-icon` 的 `font-size` + `> .apollo-icon { margin:0 }` |
 * | `numeric` | 内联 `width` / `height` / `fontSize`（`size={n}` 分支） |
 * | `group` | `.{p}-group` 的 `inline-flex` + `> *:not(:first-child)` 的负 margin + `border-color` |
 * | `group-max` | 溢出项 `+N` 与 `.{p}-group-popover` 的间距 |
 * | `responsive` | `useBreakpoint` 按断点解析出的尺寸（**三个视口不同**） |
 * | `rtl` | `.{p}-group-rtl`（`Avatar` 自己**没有** `-rtl`） |
 *
 * ⚠️ **图标用「两侧同一份内联 `<span>` 替身」**：视觉层只链接 `theme` + `ui` 两个 workspace 包
 * ⇒ 用例文件里 import `@apollo-design/icons` 解析不到，而 `@ant-design/icons` 与我们的
 * 图标形状不同 ⇒ 用**纯色方块**当替身（命中 `.apollo-icon` 的 `> .anticon` 那条规则）。
 */

import { Avatar, Badge, ConfigProvider } from 'antd';
import {
  AVATAR_BOX_STYLE,
  AVATAR_RESPONSIVE_SIZE,
  AVATAR_ROW_STYLE,
  AVATAR_SRC,
  AVATAR_TEXT_LONG,
  AVATAR_TEXT_OVERFLOW,
  AVATAR_TEXT_SHORT,
} from '../shared.mjs';

const box = (children) => <div style={AVATAR_BOX_STYLE}>{children}</div>;
const row = (children) => <div style={AVATAR_ROW_STYLE}>{children}</div>;

/** 图标替身：两侧同一份纯色方块。 */
const icon = (size = '1em') => (
  <span style={{ display: 'inline-block', width: size, height: size, background: '#999' }} />
);

const SIZES = [64, 'large', 'medium', 'small', 14];

export default {
  /** 五种尺寸 × circle + icon。 */
  basic: () => box(row(SIZES.map((s) => <Avatar key={String(s)} size={s} icon={icon()} />))),

  /** 五种尺寸 × square（圆角走 `-square` 分支）。 */
  square: () =>
    box(row(SIZES.map((s) => <Avatar key={String(s)} size={s} shape="square" icon={icon()} />))),

  /** 字符头像：单字符 / 多字符 / 长文本（都走 `-string` span）。 */
  text: () =>
    box(
      row([
        <Avatar key="a">{AVATAR_TEXT_SHORT}</Avatar>,
        <Avatar key="b">{AVATAR_TEXT_LONG}</Avatar>,
        <Avatar key="c" size={40}>
          {AVATAR_TEXT_LONG}
        </Avatar>,
        <Avatar key="d" size="large">
          {AVATAR_TEXT_LONG}
        </Avatar>,
      ]),
    ),

  /** 长文本 + 默认 `gap=4` ⇒ 触发**字符缩放**（内联 transform）。 */
  overflow: () =>
    box(
      row([
        <Avatar key="a" size="large">
          {AVATAR_TEXT_OVERFLOW}
        </Avatar>,
        <Avatar key="b">{AVATAR_TEXT_OVERFLOW}</Avatar>,
        <Avatar key="c" size="small">
          {AVATAR_TEXT_OVERFLOW}
        </Avatar>,
      ]),
    ),

  /** 只有 icon（`-icon` 的字号分支）。 */
  icon: () =>
    box(
      row([
        <Avatar key="a" icon={icon()} />,
        <Avatar key="b" size="large" icon={icon()} />,
        <Avatar key="c" size="small" icon={icon()} />,
      ]),
    ),

  /** 图片头像：字符串 `src`（data URI）与 `src` 是元素两种形态。 */
  src: () =>
    box(
      row([
        <Avatar key="a" src={AVATAR_SRC} alt="a" />,
        <Avatar key="b" size="large" src={AVATAR_SRC} alt="b" />,
        <Avatar key="c" src={<img draggable={false} src={AVATAR_SRC} alt="c" />} />,
        <Avatar key="d" shape="square" size={40} src={AVATAR_SRC} alt="d" />,
      ]),
    ),

  /** 数字尺寸 ⇒ 内联 width/height/fontSize。 */
  numeric: () =>
    box(
      row([
        <Avatar key="a" size={14} icon={icon()} />,
        <Avatar key="b" size={40} icon={icon()} />,
        <Avatar key="c" size={64} icon={icon()} />,
        <Avatar key="d" size={40}>
          {AVATAR_TEXT_LONG}
        </Avatar>,
      ]),
    ),

  /** 带徽标。 */
  badge: () =>
    box(
      row([
        <Badge key="a" count={1}>
          <Avatar shape="square" icon={icon()} />
        </Badge>,
        <Badge key="b" dot>
          <Avatar shape="square" icon={icon()} />
        </Badge>,
      ]),
    ),

  /** Avatar.Group：四个子头像（重叠 + 边框色）。 */
  group: () =>
    box(
      <Avatar.Group>
        <Avatar icon={icon()} />
        <Avatar style={{ backgroundColor: '#f56a00' }}>{AVATAR_TEXT_SHORT}</Avatar>
        <Avatar style={{ backgroundColor: '#87d068' }} icon={icon()} />
        <Avatar style={{ backgroundColor: '#1677ff' }}>{AVATAR_TEXT_SHORT}</Avatar>
      </Avatar.Group>,
    ),

  /** `max.count` 截断 + `+N` 溢出项。 */
  'group-max': () =>
    box(
      <>
        <Avatar.Group max={{ count: 2 }}>
          <Avatar icon={icon()} />
          <Avatar style={{ backgroundColor: '#f56a00' }}>{AVATAR_TEXT_SHORT}</Avatar>
          <Avatar style={{ backgroundColor: '#87d068' }} icon={icon()} />
          <Avatar style={{ backgroundColor: '#1677ff' }}>{AVATAR_TEXT_SHORT}</Avatar>
        </Avatar.Group>
        <Avatar.Group max={{ count: 2, style: { color: '#f56a00', backgroundColor: '#fde3cf' } }}>
          <Avatar icon={icon()} />
          <Avatar style={{ backgroundColor: '#f56a00' }}>{AVATAR_TEXT_SHORT}</Avatar>
          <Avatar style={{ backgroundColor: '#87d068' }} icon={icon()} />
        </Avatar.Group>
      </>,
    ),

  /** 响应式尺寸 ⇒ **三个视口下尺寸不同**。 */
  responsive: () =>
    box(
      row([
        <Avatar key="a" size={AVATAR_RESPONSIVE_SIZE} icon={icon()} />,
        <Avatar key="b" size={AVATAR_RESPONSIVE_SIZE}>
          {AVATAR_TEXT_SHORT}
        </Avatar>,
      ]),
    ),

  /** RTL：`-group-rtl` 落在 group 根上（`Avatar` 自己**没有** `-rtl`）。 */
  rtl: () => (
    <ConfigProvider direction="rtl">
      {box(
        <Avatar.Group>
          <Avatar icon={icon()} />
          <Avatar style={{ backgroundColor: '#f56a00' }}>{AVATAR_TEXT_SHORT}</Avatar>
          <Avatar style={{ backgroundColor: '#87d068' }} icon={icon()} />
        </Avatar.Group>,
      )}
    </ConfigProvider>
  ),
};
