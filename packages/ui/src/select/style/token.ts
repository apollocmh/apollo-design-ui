/**
 * Select 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 `components/select/style/token.ts`
 * （`prepareComponentToken` + `MultipleSelectorToken` + `ComponentToken`）。
 * registry 数据：组 token 数 = **16**（= `ComponentToken` 自有键；antd 的
 * `ComponentToken extends MultipleSelectorToken`，再加多选 9 键 ⇒ 公开面 25）。
 *
 * ── 双轨制（input / dropdown 范本）─────────────────────────────────────────
 *
 * - **别名派生**（selectorBg / optionSelectedColor / hoverBorderColor …）：
 *   声明落 `var(--apollo-*)`，随主题自适应（B7 可校验）。
 * - **构建期解析值**（optionPadding 算式、multipleItemHeight 的 `min()`、
 *   `showArrowPaddingInlineEnd` 的 `ceil()`）：静态 CSS 没有运行时 cssinjs 的
 *   mergeToken，构建期算成常量（collapse D46 / input 同判）。
 *
 * ⚠️ `clearBg` 上游**只声明不引用**（与 modal 的 `--ant-modal-xs-width` 同判）：
 * 本仓照样声明，保证 ConfigProvider 覆盖面与 antd 一致。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

const px = (value: number | string): string => (typeof value === 'number' ? `${value}px` : value);

/** 多选专用 9 键（antd `MultipleSelectorToken`）。 */
export interface MultipleSelectorToken {
  multipleItemBg: string;
  multipleItemBorderColor: string;
  multipleItemHeight: string;
  multipleItemHeightSM: string;
  multipleItemHeightLG: string;
  multipleSelectorBgDisabled: string;
  multipleItemColorDisabled: string;
  multipleItemBorderColorDisabled: string;
  /** @internal 构建期解析：多选标签的纵向外边距 `floor(paddingXXS / 2)`。 */
  INTERNAL_FIXED_ITEM_MARGIN: string;
}

/** 公开 Component Token 面（16 键 + 继承的 9 键 + 3 个 internal 派生）。 */
export interface ComponentToken extends MultipleSelectorToken {
  zIndexPopup: number;
  optionSelectedColor: string;
  optionSelectedFontWeight: string;
  optionSelectedBg: string;
  optionActiveBg: string;
  optionPadding: string;
  optionFontSize: string;
  optionLineHeight: string;
  optionHeight: string;
  selectorBg: string;
  /** @internal 上游只声明不引用（见文件头）。 */
  clearBg: string;
  singleItemHeightLG: string;
  showArrowPaddingInlineEnd: string;
  hoverBorderColor: string;
  activeBorderColor: string;
  activeOutlineColor: string;
  /** @internal `lineWidthFocus === 0 ? 0 : lineWidth`。 */
  lineWidthFocus: string;
  /** @internal `paddingXXS`（prefix / suffix 的内边距）。 */
  selectAffixPadding: string;
  /** @internal `paddingSM - lineWidth`（clear 的 insetInlineEnd）。 */
  inputPaddingHorizontalBase: string;
  /** @internal `controlHeight`（style/index.ts 的算式用）。 */
  selectHeight: string;
}

/** prepareComponentToken 的入参面（AliasToken 的子集）。 */
export interface SelectSeedToken {
  fontSize: number;
  lineHeight: number;
  lineWidth: number;
  lineWidthFocus: number;
  controlHeight: number;
  controlHeightSM: number;
  controlHeightLG: number;
  paddingXXS: number;
  paddingSM: number;
  controlPaddingHorizontal: number;
  zIndexPopupBase: number;
  fontWeightStrong: number;
}

/**
 * 构建期算好全部值（逐条对拍 antd `prepareComponentToken`）。
 *
 * 两处与上游「看起来像但不同」的细节，都按上游原样：
 * 1. `optionPadding` 用 `(controlHeight - fontSize * lineHeight) / 2`，**不取整**
 *    （默认主题 ⇒ `5.5px 12px`）；
 * 2. `multipleItemHeight` 是 `min(controlHeight - 2*paddingXXS, controlHeight - 2*lineWidth)`
 *    —— 上游注释写得很清楚：paddingXXS 可能为 0，故取小者兜底。
 */
export function prepareComponentToken(token: SelectSeedToken): ComponentToken {
  const dblPaddingXXS = token.paddingXXS * 2;
  const dblLineWidth = token.lineWidth * 2;

  const multipleItemHeight = Math.min(
    token.controlHeight - dblPaddingXXS,
    token.controlHeight - dblLineWidth,
  );
  const multipleItemHeightSM = Math.min(
    token.controlHeightSM - dblPaddingXXS,
    token.controlHeightSM - dblLineWidth,
  );
  const multipleItemHeightLG = Math.min(
    token.controlHeightLG - dblPaddingXXS,
    token.controlHeightLG - dblLineWidth,
  );

  // FIXED_ITEM_MARGIN 硬编码取整（上游注释：calc 不支持 rounding）
  const INTERNAL_FIXED_ITEM_MARGIN = Math.floor(token.paddingXXS / 2);

  return {
    lineWidthFocus: px(token.lineWidthFocus === 0 ? 0 : token.lineWidth),
    INTERNAL_FIXED_ITEM_MARGIN: px(INTERNAL_FIXED_ITEM_MARGIN),

    zIndexPopup: token.zIndexPopupBase + 50,
    optionSelectedColor: v('colorText'),
    optionSelectedFontWeight: String(token.fontWeightStrong),
    optionSelectedBg: v('controlItemBgActive'),
    optionActiveBg: v('controlItemBgHover'),
    optionPadding: `${(token.controlHeight - token.fontSize * token.lineHeight) / 2}px ${
      token.controlPaddingHorizontal
    }px`,
    optionFontSize: px(token.fontSize),
    optionLineHeight: String(token.lineHeight),
    optionHeight: px(token.controlHeight),
    selectorBg: v('colorBgContainer'),
    clearBg: v('colorBgContainer'),
    singleItemHeightLG: px(token.controlHeightLG),
    multipleItemBg: v('colorFillSecondary'),
    multipleItemBorderColor: 'transparent',
    multipleItemHeight: px(multipleItemHeight),
    multipleItemHeightSM: px(multipleItemHeightSM),
    multipleItemHeightLG: px(multipleItemHeightLG),
    multipleSelectorBgDisabled: v('colorBgContainerDisabled'),
    multipleItemColorDisabled: v('colorTextDisabled'),
    multipleItemBorderColorDisabled: 'transparent',
    showArrowPaddingInlineEnd: px(Math.ceil(token.fontSize * 1.25)),
    hoverBorderColor: v('colorPrimaryHover'),
    activeBorderColor: v('colorPrimary'),
    activeOutlineColor: v('controlOutline'),
    selectAffixPadding: px(token.paddingXXS),
    inputPaddingHorizontalBase: px(token.paddingSM - token.lineWidth),
    selectHeight: px(token.controlHeight),
  };
}

let tokenCache: ComponentToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function selectTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken() as unknown as SelectSeedToken);
  }
  return tokenCache;
}
