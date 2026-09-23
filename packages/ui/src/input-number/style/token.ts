/**
 * InputNumber 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/input-number/style/token.js`（19 行）+ 它继承的
 * `es/input/style/token.js` 的 `initComponentToken`（input 族基础尺寸 token）。
 * registry 数据：InputNumber 组 token 数 = 9。
 *
 * ── 双轨制（divider / collapse 范本）─────────────────────────────────────────
 *
 * - **别名派生**（handleActiveBg / handleBg / handleHoverColor / handleBorderColor）：
 *   声明落 `var(--apollo-*)`，随主题自适应（B7 可校验）。
 * - **构建期解析值**（controlWidth=90 固定、handleWidth/handleFontSize 的算式、
 *   padding 系算式、filledHandleBg 的色彩合成）：静态 CSS 没有运行时 cssinjs 的
 *   mergeToken，这些值在构建期算成常量（collapse D46/D50 同判）。
 *
 * `handleOpacity` / `handleVisibleWidth` 是 antd prepareComponentToken 的**派生**
 * 字段：`handleVisible === true` ⇒ `1 / handleWidth`，否则 `0 / 0px`（`'auto'`
 * 为默认 ⇒ hover/focus 才展开）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

const px = (value: number | string): string => (typeof value === 'number' ? `${value}px` : value);

/** initComponentToken（input 族基础）+ InputNumber 自有的 9 个 Component Token。 */
export interface ComponentToken {
  // ---- input 族基础（initComponentToken，InputNumber 样式直接消费）----
  /** `max(round((controlHeight-fontSize*lineHeight)/2*10)/10 - lineWidth, 0)`。 */
  paddingBlock: string;
  paddingBlockSM: string;
  /** LG 用 ceil（上游 round/round/ceil 三个取整各不同）。 */
  paddingBlockLG: string;
  /** `paddingSM - lineWidth`。 */
  paddingInline: string;
  /** `controlPaddingHorizontalSM - lineWidth`。 */
  paddingInlineSM: string;
  /** `controlPaddingHorizontal - lineWidth`。 */
  paddingInlineLG: string;
  /** `inputFontSize ?? fontSize`（本仓 alias 无 inputFontSize 键，恒走 fontSize）。 */
  inputFontSize: string;
  inputFontSizeLG: string;
  inputFontSizeSM: string;
  /** `paddingXXS`。 */
  inputAffixPadding: string;

  // ---- InputNumber 的 9 个 ----
  /** 固定 90（antd 的 controlWidth 字面量）。 */
  controlWidth: string;
  /** `controlHeightSM - lineWidth*2`。 */
  handleWidth: string;
  /** `fontSize / 2`。 */
  handleFontSize: string;
  /** `'auto'`（antd 默认；`true` ⇒ 常显）。 */
  handleVisible: 'auto' | boolean;
  /** `colorFillAlter`（别名 → var()）。 */
  handleActiveBg: string;
  /** `colorBgContainer`（别名 → var()）。 */
  handleBg: string;
  /** `FastColor(colorFillSecondary).onBackground(colorBgContainer)`（构建期合成）。 */
  filledHandleBg: string;
  /** `colorPrimary`（别名 → var()）。 */
  handleHoverColor: string;
  /** `colorBorder`（别名 → var()）。 */
  handleBorderColor: string;

  // ---- 派生（antd prepareComponentToken 同式）----
  /** `handleVisible === true ? 1 : 0`（unitless，antd 的 unitless 配置项）。 */
  handleOpacity: number;
  /** `handleVisible === true ? handleWidth : 0`。 */
  handleVisibleWidth: string;
}

/** prepareComponentToken 的入参面（AliasToken 的子集）。 */
export interface InputNumberSeedToken {
  lineWidth: number;
  fontSize: number;
  lineHeight: number;
  lineHeightLG: number;
  controlHeight: number;
  controlHeightSM: number;
  controlHeightLG: number;
  fontSizeLG: number;
  paddingSM: number;
  paddingXXS: number;
  controlPaddingHorizontal: number;
  controlPaddingHorizontalSM: number;
  colorFillSecondary: string;
  colorBgContainer: string;
}

/** 构建期算好全部值（对拍 antd `prepareComponentToken` + `initComponentToken`）。 */
export function prepareComponentToken(
  token: InputNumberSeedToken,
  /** 主题覆盖 handleVisible 的入口（antd 从 Component Token 表读）。 */
  handleVisibleOverride: 'auto' | boolean = 'auto',
): ComponentToken {
  const fontSize = token.fontSize;
  const fontSizeSM = fontSize;
  const fontSizeLG = token.fontSizeLG;

  const paddingBlock =
    Math.round(((token.controlHeight - fontSize * token.lineHeight) / 2) * 10) / 10 -
    token.lineWidth;
  const paddingBlockSM =
    Math.round(((token.controlHeightSM - fontSizeSM * token.lineHeight) / 2) * 10) / 10 -
    token.lineWidth;
  const paddingBlockLG =
    Math.ceil(((token.controlHeightLG - fontSizeLG * token.lineHeightLG) / 2) * 10) / 10 -
    token.lineWidth;

  const handleWidth = token.controlHeightSM - token.lineWidth * 2;
  const constantHandle = handleVisibleOverride === true;

  return {
    // ---- input 族基础 ----
    paddingBlock: px(Math.max(paddingBlock, 0)),
    paddingBlockSM: px(Math.max(paddingBlockSM, 0)),
    paddingBlockLG: px(Math.max(paddingBlockLG, 0)),
    paddingInline: px(token.paddingSM - token.lineWidth),
    paddingInlineSM: px(token.controlPaddingHorizontalSM - token.lineWidth),
    paddingInlineLG: px(token.controlPaddingHorizontal - token.lineWidth),
    inputFontSize: px(fontSize),
    inputFontSizeLG: px(fontSizeLG),
    inputFontSizeSM: px(fontSizeSM),
    inputAffixPadding: px(token.paddingXXS),

    // ---- InputNumber 的 9 个 ----
    controlWidth: px(90),
    handleWidth: px(handleWidth),
    handleFontSize: px(token.fontSize / 2),
    handleVisible: handleVisibleOverride,
    handleActiveBg: v('colorFillAlter'),
    handleBg: v('colorBgContainer'),
    // FastColor.onBackground：把半透明填充色合成到容器底色上的不透明结果
    filledHandleBg: compositeOnBackground(token.colorFillSecondary, token.colorBgContainer),
    handleHoverColor: v('colorPrimary'),
    handleBorderColor: v('colorBorder'),

    // ---- 派生 ----
    handleOpacity: constantHandle ? 1 : 0,
    handleVisibleWidth: px(constantHandle ? handleWidth : 0),
  };
}

/**
 * FastColor.onBackground 的等价物：把 `front`（可能带 alpha）合成到 `background`
 * 上的不透明色。`out = front*α + bg*(1-α)`。
 */
function compositeOnBackground(front: string, background: string): string {
  const f = new Color(front).toRgb();
  const b = new Color(background).toRgb();
  const a = f.a;
  const mix = (x: number, y: number): number => Math.round(x * a + y * (1 - a));
  return new Color({
    r: mix(f.r, b.r),
    g: mix(f.g, b.g),
    b: mix(f.b, b.b),
    a: 1,
  }).toHexString();
}

let tokenCache: ComponentToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function inputNumberTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken() as unknown as InputNumberSeedToken);
  }
  return tokenCache;
}
