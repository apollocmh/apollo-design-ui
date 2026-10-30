/**
 * Switch 的 Component Token（antd `prepareComponentToken` 全 **13 个字段**）。
 *
 * 契约来源：antd 6.6.4 的 `components/switch/style/index.ts`（445 行）的
 * `ComponentToken` 接口与 `prepareComponentToken`。
 *
 * `prepareComponentToken` 是纯函数：静态 CSS 用默认主题生成兜底声明，
 * `use-switch-theme.ts` 则基于当前主题派生并合并 components.Switch 覆盖，
 * 将解析值写到实际根元素。旧 D50 的固定主题限制已修正，默认数值和公式保留。
 *
 * ⚠️ `handleShadow` 的 `#00230b` 是 antd 的**硬编码色**（不是 token）：antd 用
 *    `new FastColor('#00230b').setA(0.2).toRgbString()`，本仓用 `utils` 的 `Color`
 *    算出**逐字节相同**的 `rgba(0,35,11,0.2)`（实测确认，格式与 FastColor 一致）。
 *
 * ── 两个「不是 Component Token」的字面量（E10 豁免区）──────────────────────────
 *
 * `border-radius:100px` 与 loading 图标色 `rgba(0, 0, 0, opacityLoading)` 在 antd 里
 * 都是**字面量**（没有 token、用户不可覆盖）。E10（无硬编码视觉值）会把它们判红，
 * 处理方式与 skeleton 的 `CAPSULE_RADIUS_DECL` / typography 的
 * `RESET_BORDER_RADIUS_DECL` **完全同形**：字面量收敛到本文件（E10 对 `token.ts`
 * 豁免），由 `style/index.ts` 消费 —— 「字面量出现在 CSS 里」不等于 H9 的硬编码，
 * 它的唯一真源在这里，且与 antd 逐字相同。
 */

import type { AliasToken } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';

export interface ComponentToken {
  /** 开关高度（= `fontSize * lineHeight`）。 */
  trackHeight: number | string;
  /** 小号开关高度（= `controlHeight / 2`）。 */
  trackHeightSM: number | string;
  /** 开关最小宽度（= `handleSize * 2 + padding * 4`）。 */
  trackMinWidth: number | string;
  /** 小号开关最小宽度（= `handleSizeSM * 2 + padding * 2`）。 */
  trackMinWidthSM: number | string;
  /** 开关内边距（固定值 2）。 */
  trackPadding: number;
  /** 开关把手背景色（= `colorWhite`）。 */
  handleBg: string;
  /** 开关把手阴影（antd 硬编码 `#00230b` + alpha 0.2）。 */
  handleShadow: string;
  /** 开关把手大小（= `trackHeight - padding * 2`）。 */
  handleSize: number;
  /** 小号开关把手大小（= `trackHeightSM - padding * 2`）。 */
  handleSizeSM: number;
  /** 内容区域最小边距（= `handleSize / 2`）。 */
  innerMinMargin: number;
  /** 内容区域最大边距（= `handleSize + padding * 3`）。 */
  innerMaxMargin: number;
  /** 小号内容区域最小边距（= `handleSizeSM / 2`）。 */
  innerMinMarginSM: number;
  /** 小号内容区域最大边距（= `handleSizeSM + padding * 3`）。 */
  innerMaxMarginSM: number;
}

/** antd 的 `const padding = 2; // Fixed value`。 */
export const SWITCH_TRACK_PADDING = 2;

/** antd 的 `switchHandleActiveInset: '-30%'`（`mergeToken` 注入的字面量）。 */
export const SWITCH_HANDLE_ACTIVE_INSET = '-30%';

/** antd 的 `switchLoadingIconSize = calc(fontSizeIcon).mul(0.75)` 的系数。 */
export const SWITCH_LOADING_ICON_SIZE_SCALE = 0.75;

/** antd 的 `handleShadow` 里的硬编码色（`FastColor('#00230b')`）。 */
export const SWITCH_HANDLE_SHADOW_BASE = '#00230b';

/** antd 的 `handleShadow` 的 alpha。 */
export const SWITCH_HANDLE_SHADOW_ALPHA = 0.2;

/**
 * 胶囊圆角声明。
 *
 * antd 的根规则与 `-inner` 都是 `borderRadius: 100`（`Large number to make capsule shape`），
 * cssinjs 产物是 `100px`。不是 Component Token —— 用户无法覆盖，我们也不提供入口。
 * （与 `skeleton/style/token.ts` 的同名常量**逐字相同**；两个组件各自持有，
 * 因为它是「组件自己的字面量」而不是共享设计值。）
 */
export const CAPSULE_RADIUS_DECL = 'border-radius:100px';

/**
 * loading 图标色声明。
 *
 * antd 的 `switchLoadingIconColor: \`rgba(0, 0, 0, ${token.opacityLoading})\`` ——
 * 黑色 + `opacityLoading` 的 alpha。本仓没有「带 alpha 的黑色」token，
 * 而 alpha 部分走 `var(--apollo-opacity-loading)`（可随主题变）。
 */
export const LOADING_ICON_COLOR_DECL = 'color:rgba(0, 0, 0, var(--apollo-opacity-loading))';

export const prepareComponentToken = (token: AliasToken): ComponentToken => {
  const { fontSize, lineHeight, controlHeight, colorWhite } = token;

  const height = fontSize * lineHeight;
  const heightSM = controlHeight / 2;
  const padding = SWITCH_TRACK_PADDING;
  const handleSize = height - padding * 2;
  const handleSizeSM = heightSM - padding * 2;

  const shadowBase = new Color(SWITCH_HANDLE_SHADOW_BASE).toRgb();
  const handleShadow = `0 2px 4px 0 ${new Color({
    r: shadowBase.r,
    g: shadowBase.g,
    b: shadowBase.b,
    a: SWITCH_HANDLE_SHADOW_ALPHA,
  }).toRgbString()}`;

  return {
    trackHeight: height,
    trackHeightSM: heightSM,
    trackMinWidth: handleSize * 2 + padding * 4,
    trackMinWidthSM: handleSizeSM * 2 + padding * 2,
    trackPadding: padding,
    handleBg: colorWhite,
    handleShadow,
    handleSize,
    handleSizeSM,
    innerMinMargin: handleSize / 2,
    innerMaxMargin: handleSize + padding + padding * 2,
    innerMinMarginSM: handleSizeSM / 2,
    innerMaxMarginSM: handleSizeSM + padding + padding * 2,
  };
};

export default prepareComponentToken;
