/**
 * DatePicker 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的
 *   - `es/date-picker/style/token.js`（`initPickerPanelToken` / `initPanelComponentToken` /
 *     `prepareComponentToken`）
 *   - `es/input/style/token.js` 的 `initComponentToken`（本组件把它整份并入）
 *   - `es/select/style/token.js` 的 `MultipleSelectorToken`（经 `PanelComponentToken extends` 并入）
 *   - `es/style/roundedArrow.js` 的 `getArrowToken`（浮层小箭头）
 *
 * ── 实测的变量面：**45 个** `--ant-date-picker-*`（含 1 个规则内声明）────────────
 *
 * 取证命令（可复现）：
 * `node tests/visual/debug/extract-date-picker-css.mjs --tokens`
 *
 * | 来源 | 个数 | 键 |
 * |---|---|---|
 * | 本组件自有 | 3 | `presetsWidth` / `presetsMaxWidth` / `zIndexPopup` |
 * | `initComponentToken`（input） | **18** | `lineWidthFocus` + 6 个 padding 系 + `addonBg` + 3 个 border/shadow 色 + `hoverBg`/`activeBg` + 3 个 `inputFontSize` |
 * | `initPanelComponentToken` | 20 | 12 个自有（cell 系 / time 系 / textHeight / withoutTimeCellHeight）+ 8 个 `MultipleSelectorToken` |
 * | `getArrowToken` | 3 | `arrowShadowWidth` / `arrowPath` / `arrowPolygon` |
 * | 规则内声明（**不属于上面任何一个**） | 1 | `affixColor`（默认 `inherit`） |
 *
 * ⚠️ 计数要对上（**2026-09-30 实测纠正**）：`prepareComponentToken` 返回 **45** 个键，
 * 而这 **45 个键全部落成 CSS 变量** —— 包括 `INTERNAL_FIXED_ITEM_MARGIN`
 * （变量名是 **`internal_fixed_item_margin`**，带**下划线**，值 `2px`），
 * 它**被 `multiple` 的规则引用**（`margin-block:var(…)`）。
 * 再加规则内声明的 `affixColor` ⇒ 观测到的 **46 个变量**。
 *
 * 🚨 这里**曾经写错**（「`INTERNAL_FIXED_ITEM_MARGIN` 是内部量、不落变量 ⇒ 44 个变量」）——
 * 那次错误的根因是**探针正则的字符类不含下划线**（`[a-z0-9-]`），这个变量压根没被扫出来，
 * 于是把 45 误读成 44。正则已修为 `[a-z0-9_-]`（PITFALLS 229）。
 *
 * ⚠️ **`affixColor` 的来源**（读产物确认，不是推测）：它**不在** `prepareComponentToken`
 * 的返回值里，而是被声明在 **`.ant-picker` 规则内部**（不是 `-css-var` 块）：
 *
 * ```css
 * .ant-picker { --ant-date-picker-affix-color: inherit; … }
 * .ant-picker-status-error   { --ant-date-picker-affix-color: var(--ant-color-error-affix); }
 * .ant-picker-status-warning { --ant-date-picker-affix-color: var(--ant-color-warning-affix); }
 * ```
 *
 * 即它是**状态变体用的作用域变量**（上游 `input/style/variants.js` 的
 * `options.affixColor`，取值 `token.colorErrorAffix` / `colorWarningAffix`）。
 * 本仓的 `theme/src/alias.ts` 已有这两个别名（→ `colorError` / `colorWarning`）。
 * ⇒ G4 移植时它应当落在 `.apollo-picker` / `-status-*` 的规则里，**不进声明块**。
 *
 * registry 数据：该组件 `tokenCount = 3` —— **实测口径**是
 * `registry/source/antd-6.6.4.raw.json` 的 `componentTokens['date-picker']`：
 *
 * ```json
 * ["presetsWidth", "presetsMaxWidth", "zIndexPopup"]
 * ```
 *
 * 即**该组件自己声明的那 3 个用户面 token**（继承 input / select / roundedArrow 的不计）。
 * 本文件把三处继承面**整份并入**（`ComponentToken` 是它们的并集减 `addonBg`），
 * 因为静态 CSS 没有运行时 cssinjs 的 `mergeToken`（双轨制判据同 input / collapse / tabs）：
 *
 *   - **别名派生**（`activeBorderColor` / `hoverBorderColor` / `hoverBg` / `activeBg` /
 *     `cellHoverBg` / `cellActiveWithRangeBg` / `cellBgDisabled` / `multipleItemBg` 等）
 *     ⇒ 落 `var(--apollo-*)`，随主题自适应（B7 可校验）。
 *   - **构建期解析值**（padding 系算式、`activeShadow` 模板串、`cellHoverWithRangeBg` 的
 *     `lighten(35)`、`timeColumnHeight` 的 `28*8`）⇒ 构建期算成常量。
 *     ⚠️ 这些常量在**静态 CSS** 里会被内联成字面值 ⇒ **不随主色变化**（上游 cssinjs
 *     会在运行时重算）。这是本仓「静态 CSS + CSS 变量」架构的**已知固有差异**，
 *     不是 bug；对主题切换的影响面由 L6 的 dark/compact 矩阵钉住。
 *
 * ── ⚠️ 本文件与 `input/style/token.ts` 的同名算式是**同式复刻** ──────────────────
 *
 * 上游 `initComponentToken` 是 input 导出的**共享函数**，date-picker / input /
 * input-number / select / cascader / tree-select 都各自调它。本仓的约定是
 * 「按组件隔离同构复刻，不做跨组件 import」（见 `input/style/token.ts` 的说明与 H11），
 * ⇒ 这里重写一遍算式，**不 import input 的实现**。
 * 判定值可以逐字对拍，改一处要同步改所有同族组件（`theme.test.ts` 钉住）。
 *
 * ── `cellHoverWithRangeBg` / `cellRangeBorderColor` 用哪个颜色工具 ───────────────
 *
 * 上游是 `FastColor` 的 **`lighten`**：
 * ```js
 * cellHoverWithRangeBg: new FastColor(token.colorPrimary).lighten(35).toHexString(),
 * cellRangeBorderColor: new FastColor(token.colorPrimary).lighten(20).toHexString(),
 * ```
 *
 * ⚠️ **不是** `_internal/color-composite.ts` 的 `onBackground`（那是「半透明前景合成到
 * 背景」，是 tour / input-number / slider 用的那个运算）。两者不可互换。
 * 正确对应物是 **`@apollo-design/utils` 的 `Color#lighten`** —— 实测逐位一致：
 *
 * | 调用 | FastColor | 本仓 `Color` |
 * |---|---|---|
 * | `lighten(35)` from `#1677ff` | `#cbe0fd` | `#cbe0fd` |
 * | `lighten(20)` from `#1677ff` | `#82b4f9` | `#82b4f9` |
 *
 * （验证命令：`node -e "const{Color}=require('@apollo-design/utils');…"` 与对 FastColor 同跑。）
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { Color } from '@apollo-design/utils';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

const px = (value: number | string): string => (typeof value === 'number' ? `${value}px` : value);

// ---------------------------------------------------------------------------
// ① 面板自有 token（上游 `PanelComponentToken` 的 12 个 + `MultipleSelectorToken` 的 8 个）
// ---------------------------------------------------------------------------

/**
 * 面板侧的用户面 token。
 *
 * 上游 `PanelComponentToken extends MultipleSelectorToken` —— 即 `multiple` 模式的
 * 标签样式**与 Select 同源**（8 个键）。这 8 个键名见 `select/style/token.ts` 的
 * `MultipleSelectorToken`（本文件按 H11 的约定自己再声明一份）。
 */
export interface PanelComponentToken extends MultipleSelectorToken {
  /** 单元格悬浮态背景色。别名 → `controlItemBgHover`。 */
  cellHoverBg: string;
  /** 区间内的单元格背景色。别名 → `controlItemBgActive`。 */
  cellActiveWithRangeBg: string;
  /** 区间内且悬浮的单元格背景色。**构建期** `lighten(colorPrimary, 35%)`。 */
  cellHoverWithRangeBg: string;
  /** 禁用单元格背景色。别名 → `colorBgContainerDisabled`。 */
  cellBgDisabled: string;
  /** 选择区间时的单元格边框色。**构建期** `lighten(colorPrimary, 20%)`。 */
  cellRangeBorderColor: string;
  /** 时间列宽度。`controlHeightLG * 1.4`。 */
  timeColumnWidth: number;
  /** 时间列高度。**固定值** `28 * 8`。 */
  timeColumnHeight: number;
  /** 时间单元格高度。**固定值** `28`。 */
  timeCellHeight: number;
  /** 单元格宽度。`controlHeightSM * 1.5`。 */
  cellWidth: number;
  /** 单元格高度。`controlHeightSM`。 */
  cellHeight: number;
  /** 单元格文本高度。`controlHeightLG`。 */
  textHeight: number;
  /** 十年/年/季/月/周单元格高度。`controlHeightLG * 1.65`。 */
  withoutTimeCellHeight: number;
}

/** 面板侧**不在用户面**的内部键（上游把它与 20 个用户面键放在同一个对象里返回）。 */
export interface PanelInternalToken {
  /** `Math.floor(paddingXXS / 2)`。 */
  INTERNAL_FIXED_ITEM_MARGIN: number;
}

/** `select/style/token.ts` 的同名接口（H11：同层隔离复刻，不跨组件 import）。 */
export interface MultipleSelectorToken {
  /** 多选标签背景。别名 → `colorFillSecondary`。 */
  multipleItemBg: string;
  /** 多选标签边框色。**固定值** `'transparent'`。 */
  multipleItemBorderColor: string;
  /** 多选标签高度。`min(controlHeight - 2*paddingXXS, controlHeight - 2*lineWidth)`。 */
  multipleItemHeight: number;
  multipleItemHeightSM: number;
  multipleItemHeightLG: number;
  /** 多选禁用时的标签背景。别名 → `colorBgContainerDisabled`。 */
  multipleSelectorBgDisabled: string;
  /** 多选禁用时的标签文字色。别名 → `colorTextDisabled`。 */
  multipleItemColorDisabled: string;
  /** 多选禁用时的标签边框色。**固定值** `'transparent'`。 */
  multipleItemBorderColorDisabled: string;
}

// ---------------------------------------------------------------------------
// ② 输入框侧 token（上游 `input/style/token.js` 的 `initComponentToken`，17 个）
// ---------------------------------------------------------------------------

/**
 * 输入框侧的共享 token（上游 `SharedComponentToken`）。
 *
 * ⚠️ `ComponentToken` 里把它 `Exclude<…, 'addonBg'>` 掉了，但**运行时对象仍含 `addonBg`**
 * （`...initComponentToken(token)` 的 spread 不会触发 TS 的多余属性检查）。
 * 本文件照上游：**类型面排除、实现面保留** —— `Object.keys` 的对拍会看到它。
 */
export interface SharedComponentToken {
  /**
   * `lineWidthFocus === 0 ? 0 : lineWidth`。
   *
   * 🚨 **上游的接口里没有这个键**（`SharedComponentToken` 只声明 17 个），
   * 但 `initComponentToken` **返回 18 个**（它返回值里带了 `lineWidthFocus`）。
   * 产物侧实测它**确实成了一个变量**：`--ant-date-picker-line-width-focus: 1px`。
   * ⇒ 本仓的类型如实声明 18 个（否则 TS 会对那个对象字面量报多余属性，
   * 而按接口删掉它又会让产物少一个变量）。
   */
  lineWidthFocus: number;
  paddingInline: number;
  paddingInlineSM: number;
  paddingInlineLG: number;
  paddingBlock: number;
  paddingBlockSM: number;
  paddingBlockLG: number;
  /** ⚠️ 类型面被 `Exclude` 掉（见上），实现面保留。 */
  addonBg: string;
  hoverBorderColor: string;
  activeBorderColor: string;
  activeShadow: string;
  errorActiveShadow: string;
  warningActiveShadow: string;
  hoverBg: string;
  activeBg: string;
  inputFontSize: number;
  inputFontSizeLG: number;
  inputFontSizeSM: number;
}

// ---------------------------------------------------------------------------
// ③ 浮层小箭头 token（上游 `getArrowToken`，3 个）
// ---------------------------------------------------------------------------

/** 上游 `style/roundedArrow.js` 的 `ArrowToken`（3 个几何量）。 */
export interface ArrowToken {
  arrowShadowWidth: number;
  arrowPath: string;
  arrowPolygon: string;
}

// ---------------------------------------------------------------------------
// ④ 用户面 ComponentToken（三处继承 + 3 个自有）
// ---------------------------------------------------------------------------

/** 用户可覆盖的 ComponentToken。 */
export interface ComponentToken
  extends Omit<SharedComponentToken, 'addonBg'>,
    PanelComponentToken,
    ArrowToken {
  /** 预设区宽度。**固定值** `120`。 */
  presetsWidth: number;
  /** 预设区最大宽度。**固定值** `200`。 */
  presetsMaxWidth: number;
  /** 浮层 z-index。`zIndexPopupBase + 50`。 */
  zIndexPopup: number;
}

/** 内部 token（上游 `PickerPanelToken`，10 个）—— 不是用户面，不进 `ComponentToken`。 */
export interface PickerPanelToken {
  pickerCellCls: string;
  pickerCellInnerCls: string;
  pickerDatePanelPaddingHorizontal: number | string;
  pickerYearMonthCellWidth: number | string;
  pickerCellPaddingVertical: number | string;
  pickerQuarterPanelContentHeight: number | string;
  pickerCellBorderGap: number;
  pickerControlIconSize: number;
  pickerControlIconMargin: number;
  pickerControlIconBorderWidth: number;
}

/**
 * `prepareComponentToken` 的入参面。
 *
 * 是 `AliasToken` 的子集，但**含三个可被用户覆盖的 Component Token**：
 * `inputFontSize` / `inputFontSizeLG` / `inputFontSizeSM`（上游用 `||` 做回退 ⇒
 * 用户覆盖生效）—— 与 tabs 的 `cardHeight` 家族同一条「合并后回写」通道。
 */
export interface DatePickerSeedToken {
  // ---- controlHeight / fontSize 家族（padding 系算式的输入）----
  controlHeight: number;
  controlHeightSM: number;
  controlHeightLG: number;
  fontSize: number;
  fontSizeLG: number;
  lineHeight: number;
  lineHeightLG: number;
  /** ⚠️ `initComponentToken` 用它算 paddingBlock 系，但**只出现一次**（不是 LG 的）。 */
  lineWidth: number;
  lineWidthFocus: number;
  paddingSM: number;
  paddingXXS: number;
  padding: number;
  controlPaddingHorizontal: number;
  controlPaddingHorizontalSM: number;
  // ---- 焦点环 ----
  controlOutlineWidth: number;
  controlOutline: string;
  colorErrorOutline: string;
  colorWarningOutline: string;
  // ---- 别名（落 var()）----
  colorFillAlter: string;
  colorFillSecondary: string;
  colorPrimary: string;
  colorPrimaryHover: string;
  colorBgContainer: string;
  colorBgContainerDisabled: string;
  colorTextDisabled: string;
  controlItemBgHover: string;
  controlItemBgActive: string;
  // ---- 箭头几何 ----
  sizePopupArrow: number;
  borderRadiusXS: number;
  borderRadiusOuter: number;
  // ---- z-index ----
  zIndexPopupBase: number;
  // ---- 可被用户覆盖的三个（上游 `||` 回退）----
  inputFontSize?: number;
  inputFontSizeLG?: number;
  inputFontSizeSM?: number;
}

// ---------------------------------------------------------------------------
// ⑤ 三个默认值推导（逐条对齐上游）
// ---------------------------------------------------------------------------

/**
 * 面板侧的默认值（上游 `initPanelComponentToken`，**21** 个键）。
 *
 * ⚠️ 返回对象里有一个**不在用户面**的 `INTERNAL_FIXED_ITEM_MARGIN`（上游注释：
 * `FIXED_ITEM_MARGIN is a hardcode calculation since calc not support rounding`，
 * 值 = `Math.floor(paddingXXS / 2)`）。上游把它和 20 个用户面键**一起**放进
 * `filledToken` 返回 —— 而它的类型 `PanelComponentToken` **不声明**这个键
 * （JS 不检查，TS 检查）⇒ 本仓用一个交叉类型如实表达：
 * 运行时键集与上游逐字一致，类型面把它标成内部。
 * ⚠️ **不能省略它**：省略会让 `Object.keys` 的对拍少一个键（theme.test 钉住）。
 */
export function initPanelComponentToken(
  token: DatePickerSeedToken,
): PanelComponentToken & PanelInternalToken {
  const dblPaddingXXS = token.paddingXXS * 2;
  const dblLineWidth = token.lineWidth * 2;
  // Item height default use `controlHeight - 2 * paddingXXS`, but some case `paddingXXS=0`.
  // Let's fallback it.
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

  // FIXED_ITEM_MARGIN is a hardcode calculation since calc not support rounding.
  const fixedItemMargin = Math.floor(token.paddingXXS / 2);

  return {
    INTERNAL_FIXED_ITEM_MARGIN: fixedItemMargin,
    cellHoverBg: v('controlItemBgHover'),
    cellActiveWithRangeBg: v('controlItemBgActive'),
    // ⚠️ 上游 `new FastColor(colorPrimary).lighten(35).toHexString()` ——
    //    本仓 `Color#lighten` 与之逐位一致（见文件头表格），**不是** onBackground。
    cellHoverWithRangeBg: new Color(token.colorPrimary).lighten(35).toHexString(),
    cellRangeBorderColor: new Color(token.colorPrimary).lighten(20).toHexString(),
    cellBgDisabled: v('colorBgContainerDisabled'),
    timeColumnWidth: token.controlHeightLG * 1.4,
    // Magic number：上游注释没解释，产物里就是 224。
    timeColumnHeight: 28 * 8,
    timeCellHeight: 28,
    cellWidth: token.controlHeightSM * 1.5,
    cellHeight: token.controlHeightSM,
    textHeight: token.controlHeightLG,
    withoutTimeCellHeight: token.controlHeightLG * 1.65,
    multipleItemBg: v('colorFillSecondary'),
    multipleItemBorderColor: 'transparent',
    multipleItemHeight,
    multipleItemHeightSM,
    multipleItemHeightLG,
    multipleSelectorBgDisabled: v('colorBgContainerDisabled'),
    multipleItemColorDisabled: v('colorTextDisabled'),
    multipleItemBorderColorDisabled: 'transparent',
  };
}

/** 输入框侧的默认值（上游 `input` 的 `initComponentToken`，17 个键）。 */
export function initInputComponentToken(token: DatePickerSeedToken): SharedComponentToken {
  const mergedFontSize = token.inputFontSize || token.fontSize;
  const mergedFontSizeSM = token.inputFontSizeSM || mergedFontSize;
  const mergedFontSizeLG = token.inputFontSizeLG || token.fontSizeLG;
  const paddingBlock =
    Math.round(((token.controlHeight - mergedFontSize * token.lineHeight) / 2) * 10) / 10 -
    token.lineWidth;
  const paddingBlockSM =
    Math.round(((token.controlHeightSM - mergedFontSizeSM * token.lineHeight) / 2) * 10) / 10 -
    token.lineWidth;
  // ⚠️ LG 用 `lineHeightLG` 且是 `Math.ceil`（三个取整各不同：round / round / ceil）。
  const paddingBlockLG =
    Math.ceil(((token.controlHeightLG - mergedFontSizeLG * token.lineHeightLG) / 2) * 10) / 10 -
    token.lineWidth;

  return {
    lineWidthFocus: token.lineWidthFocus === 0 ? 0 : token.lineWidth,
    paddingBlock: Math.max(paddingBlock, 0),
    paddingBlockSM: Math.max(paddingBlockSM, 0),
    paddingBlockLG: Math.max(paddingBlockLG, 0),
    paddingInline: token.paddingSM - token.lineWidth,
    paddingInlineSM: token.controlPaddingHorizontalSM - token.lineWidth,
    paddingInlineLG: token.controlPaddingHorizontal - token.lineWidth,
    addonBg: v('colorFillAlter'),
    activeBorderColor: v('colorPrimary'),
    hoverBorderColor: v('colorPrimaryHover'),
    activeShadow: `0 0 0 ${token.controlOutlineWidth}px ${token.controlOutline}`,
    errorActiveShadow: `0 0 0 ${token.controlOutlineWidth}px ${token.colorErrorOutline}`,
    warningActiveShadow: `0 0 0 ${token.controlOutlineWidth}px ${token.colorWarningOutline}`,
    hoverBg: v('colorBgContainer'),
    activeBg: v('colorBgContainer'),
    inputFontSize: mergedFontSize,
    inputFontSizeLG: mergedFontSizeLG,
    inputFontSizeSM: mergedFontSizeSM,
  };
}

/**
 * 浮层小箭头的几何量（上游 `getArrowToken`，3 个）。
 *
 * 全是纯几何推导，逐字复刻：`√2` 出现在 `bx` / `cx` / `cy` / `shadowWidth` 四处，
 * **不能近似成 1.414**（L6 逐像素会发现）。
 */
export function getArrowToken(token: DatePickerSeedToken): ArrowToken {
  const unitWidth = token.sizePopupArrow / 2;
  const ax = 0;
  const ay = unitWidth;
  const bx = (token.borderRadiusOuter * 1) / Math.SQRT2;
  const by = unitWidth - token.borderRadiusOuter * (1 - 1 / Math.SQRT2);
  const cx = unitWidth - token.borderRadiusXS * (1 / Math.SQRT2);
  const cy = token.borderRadiusOuter * (Math.SQRT2 - 1) + token.borderRadiusXS * (1 / Math.SQRT2);
  const dx = 2 * unitWidth - cx;
  const dy = cy;
  const ex = 2 * unitWidth - bx;
  const ey = by;
  const fx = 2 * unitWidth - ax;
  const fy = ay;
  const shadowWidth = unitWidth * Math.SQRT2 + token.borderRadiusOuter * (Math.SQRT2 - 2);
  const polygonOffset = token.borderRadiusOuter * (Math.SQRT2 - 1);

  return {
    arrowShadowWidth: shadowWidth,
    arrowPolygon: `polygon(${polygonOffset}px 100%, 50% ${polygonOffset}px, ${
      2 * unitWidth - polygonOffset
    }px 100%, ${polygonOffset}px 100%)`,
    arrowPath: `path('M ${ax} ${ay} A ${token.borderRadiusOuter} ${token.borderRadiusOuter} 0 0 0 ${bx} ${by} L ${cx} ${cy} A ${token.borderRadiusXS} ${token.borderRadiusXS} 0 0 1 ${dx} ${dy} L ${ex} ${ey} A ${token.borderRadiusOuter} ${token.borderRadiusOuter} 0 0 0 ${fx} ${fy} Z')`,
  };
}

/**
 * 用户面 ComponentToken 的默认值（上游 `prepareComponentToken`）。
 *
 * 上游顺序：`{ ...initComponentToken, ...initPanelComponentToken, ...getArrowToken,
 * presetsWidth, presetsMaxWidth, zIndexPopup }`。
 *
 * ⚠️ 返回类型必须是 `ComponentToken & { addonBg } & PanelInternalToken`：
 *   - `addonBg`：类型面被 `Exclude` 掉、实现面保留（见 `SharedComponentToken` 说明）；
 *   - `INTERNAL_FIXED_ITEM_MARGIN`：`initPanelComponentToken` 返回的内部量。
 *
 * 只有类型如实（**不减键**），运行时的 `Object.keys` 才能与上游的 45 个逐字一致
 * —— 这是 `theme.test.ts` 的第一条断言。
 */
export type PreparedToken = ComponentToken & { addonBg: string } & PanelInternalToken;

/** 见上 */
export function prepareComponentToken(token: DatePickerSeedToken): PreparedToken {
  return {
    ...initInputComponentToken(token),
    ...initPanelComponentToken(token),
    ...getArrowToken(token),
    presetsWidth: 120,
    presetsMaxWidth: 200,
    zIndexPopup: token.zIndexPopupBase + 50,
  };
}

/**
 * 内部 token 的默认值（上游 `initPickerPanelToken`，**10** 个键）。
 *
 * ⚠️ 上游前两个键是**拼出来的类名**（`\`${componentCls}-cell\`` /
 * `\`${componentCls}-cell-inner\``），所以本函数必须收 `prefixCls`
 * —— 上游的 `componentCls` 正是 `FullToken<'DatePicker'>` 里的那个前缀。
 * 本仓的 DatePicker 前缀是 **`${rootPrefixCls}-picker`**（不是 `-date-picker`，
 * 见 `docs/analysis/date-picker.md` §3 与 G2 注释）。
 *
 * ⚠️ 这三个 `token.calc(...).equal()` 在上游返回的是**字符串**（如 `'48px'`），
 * 而本仓按构建期常量算（数字）。类型面因此声明成 `number | string`（上游 .d.ts 同）。
 *
 * ⚠️ 上游第 4 个键的注释写着 `// 18 in normal`，算式是 `padding + paddingXXS/2`。
 *
 * ⚠️ **`INTERNAL_FIXED_ITEM_MARGIN` 会进 CSS 变量声明块**（2026-09-30 实测纠正）——
 * 它落成 `--apollo-date-picker-internal_fixed_item_margin: 2px`，且被 `multiple` 的
 * 规则引用。本文件此前写的「本组 token 大概率不会进声明块」是**错的**。
 * 其余 9 个键（`pickerCellCls` 等拼出来的类名与几何常量）确实只用于构建期算式。
 * 它存在的意义是「10 个键的判定值可对拍」+「G4 移植时不必反推算式」。
 */
export function initPickerPanelToken(
  token: DatePickerSeedToken,
  prefixCls: string,
): PickerPanelToken {
  return {
    pickerCellCls: `${prefixCls}-cell`,
    pickerCellInnerCls: `${prefixCls}-cell-inner`,
    pickerYearMonthCellWidth: token.controlHeightLG * 1.5,
    pickerQuarterPanelContentHeight: token.controlHeightLG * 1.4,
    pickerCellPaddingVertical: token.paddingXXS + token.paddingXXS / 2,
    // Magic for gap between cells.
    pickerCellBorderGap: 2,
    pickerControlIconSize: 7,
    pickerControlIconMargin: 4,
    pickerControlIconBorderWidth: 1.5,
    pickerDatePanelPaddingHorizontal: token.padding + token.paddingXXS / 2,
  };
}

// ---------------------------------------------------------------------------
// ⑥ 构建期取值（缓存）
// ---------------------------------------------------------------------------

let tokenCache: PreparedToken | null = null;
let panelTokenCache: PickerPanelToken | null = null;

/** 构建期 token 值（缓存；首次调用时读主题默认 seed）。 */
export function datePickerTokenValues(): PreparedToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken() as unknown as DatePickerSeedToken);
  }
  return tokenCache;
}

/** 内部 token 的构建期值（缓存）。 */
export function datePickerPanelTokenValues(prefixCls: string): PickerPanelToken {
  if (!panelTokenCache) {
    panelTokenCache = initPickerPanelToken(
      getDesignToken() as unknown as DatePickerSeedToken,
      prefixCls,
    );
  }
  return panelTokenCache;
}

/** 供 `style/index.ts` 内联时用的 `px()` 包装（导出以便测试与样式复用同一实现）。 */
export { px };
