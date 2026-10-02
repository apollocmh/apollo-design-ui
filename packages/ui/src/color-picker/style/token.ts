/**
 * ColorPicker 的 Component Token（G3 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/color-picker/style/index.js`。
 *
 * ── 用户面 Component Token：**0 个**（实测确认，不是推测）───────────────────────
 *
 * ```ts
 * // biome-ignore lint/suspicious/noEmptyInterface: ComponentToken need to be empty by default
 * export interface ComponentToken {}
 * ```
 *
 * 取证命令（可复现）：`node tests/visual/debug/extract-color-picker-css.mjs --tokens`
 * ⇒ 产物里 `--ant-color-picker-*` 的**声明是 0 条**，`.ant-color-picker-css-var` 块里
 * 只有全局 reset（`font-family` / `font-size` / `box-sizing`）。
 * 这与 calendar（27 条声明）**根本不同**：color-picker 零自有变量。
 *
 * ── 🚨 9 个 `mergeToken` 派生值：上游**内联成字面量**，本仓**声明成变量** ──────────
 *
 * 上游的 9 个派生（`colorPickerWidth: 234` …）在产物里是**内联字面量**
 * （`width:234px` / `flex:0 0 44px` / `inset 0 0 1px 0 var(--ant-color-text-quaternary)`），
 * 只有 `colorPickerPreviewSize` 保持算式形态（`calc(8px * 2 + var(--ant-margin-sm))`）。
 *
 * 本仓**改成声明 `--apollo-color-picker-*`**（比 antd 多 9 条声明），理由三条：
 *
 * 1. **H9**：`234px` / `44px` / `inset 0 0 1px 0 …` 都是「高度 / 间距 / 阴影」类的
 *    视觉量，直接内联在规则里就是硬编码。
 * 2. **E10**：门禁的 `box-shadow` 正则只放行 `var(` / `${` / `none` / `0` 开头
 *    ⇒ `box-shadow:inset 0 0 1px 0 …` 会被判「硬编码阴影」。声明成变量是唯一正解。
 * 3. **主题自适应**：`insetShadow` 引用 `colorTextQuaternary`、`previewSize` 引用
 *    `marginSM` —— 声明成变量后它们随主题走，内联字面量不会。
 *
 * ⚠️ 与 calendar 的判据一致：**声明出来 ≠ 用得上**（`width` 等 6 个字面量派生在本组件
 * 里全部被规则引用；`inset-shadow` / `preview-size` / `slider-height` 同理）。
 * 计算值逐位相同 ⇒ L6 无差异。
 *
 * ── 变量名必须**跟着前缀走**（`--${p}-color-picker-*`）────────────────────────────
 *
 * `STATIC_PREFIX_CLS = ['apollo', 'ant']` ⇒ `gen(p)` 被调两次，两份都进产物。
 * 组件自有变量**跟着前缀换**（全局别名变量 `--apollo-*` 不动）——
 * 所以 `previewSize` 的算式里引用的是 `--${p}-color-picker-slider-height`，
 * 于是派生集必须是**前缀的函数**，不能是模块级常量。
 */

import type { AliasToken } from '@apollo-design/theme';
import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`（全局别名变量**不随前缀变**）。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * ColorPicker 的 Component Token。与 antd 逐字对齐：**空类型**。
 *
 * （antd 用空接口 + 9 个 `mergeToken` 派生表达「该组件无用户可覆盖的 token」；
 * 这里用同构的空类型，避免引入无意义的占位字段。）
 */
export type ComponentToken = Record<string, never>;

/** 与 antd 的 `prepareComponentToken` 逐字对应：无组件级 token。 */
export const prepareComponentToken = (_token?: AliasToken): Partial<ComponentToken> => ({});

/**
 * 9 个 `mergeToken` 派生的**表达式**（唯一真源）。
 *
 * ⚠️ 键序 = 上游 `mergeToken` 的书写顺序，也就是产物里……不对，上游产物里它们
 * **没有声明顺序**（全内联）。这里的键序只用于**声明块的顺序**，与上游源码的
 * 书写顺序逐字一致，便于对账。
 *
 * @param prefix 根前缀（`apollo` / `ant`）—— 只有 `previewSize` 依赖它
 *   （它引用同族的 `slider-height`）。
 */
export function colorPickerDerived(prefix: string) {
  const n = `--${prefix}-color-picker`;
  return {
    /** 面板宽度。字面量 `234`。 */
    width: '234px',
    /** 取色手柄尺寸。字面量 `16`。 */
    handlerSize: '16px',
    /** 小号手柄尺寸（滑块手柄）。字面量 `12`。 */
    handlerSizeSM: '12px',
    /** alpha 输入框宽度。字面量 `44`。 */
    alphaInputWidth: '44px',
    /** 数字输入的步进器宽度。字面量 `16`。 */
    inputNumberHandleWidth: '16px',
    /** 预设色块尺寸。字面量 `24`。 */
    presetColorSize: '24px',
    /** 内嵌阴影。**引用全局 token** `colorTextQuaternary`。 */
    insetShadow: `inset 0 0 1px 0 ${v('colorTextQuaternary')}`,
    /** 滑块高度。上游是 `genStyleHooks` 里的**局部常量** `8`（不是 token）。 */
    sliderHeight: '8px',
    /**
     * 预览色块尺寸。上游算式：`token.calc(sliderHeight).mul(2).add(marginSM).equal()`
     * ⇒ 产物 `calc(8px * 2 + var(--ant-margin-sm))`。
     * 本仓把 `8px` 换成同族变量（计算值相同）。
     */
    previewSize: `calc(var(${n}-slider-height) * 2 + ${v('marginSM')})`,
  } as const;
}

/** 9 个派生的**变量名后缀**（kebab，与 `colorPickerDerived` 的键一一对应）。 */
export const COLOR_PICKER_DERIVED_KEYS = [
  'width',
  'handler-size',
  'handler-size-sm',
  'alpha-input-width',
  'input-number-handle-width',
  'preset-color-size',
  'inset-shadow',
  'slider-height',
  'preview-size',
] as const;

/**
 * Component Token 的声明块（**9** 条派生值）。
 *
 * ⚠️ 顺序 = `colorPickerDerived` 的键序（= 上游 `mergeToken` 的书写顺序）。
 */
export function genColorPickerTokenDecls(rootPrefixCls: string): string[] {
  const d = colorPickerDerived(rootPrefixCls);
  const n = `--${rootPrefixCls}-color-picker`;

  return [
    `  ${n}-width:${d.width};`,
    `  ${n}-handler-size:${d.handlerSize};`,
    `  ${n}-handler-size-sm:${d.handlerSizeSM};`,
    `  ${n}-alpha-input-width:${d.alphaInputWidth};`,
    `  ${n}-input-number-handle-width:${d.inputNumberHandleWidth};`,
    `  ${n}-preset-color-size:${d.presetColorSize};`,
    `  ${n}-inset-shadow:${d.insetShadow};`,
    `  ${n}-slider-height:${d.sliderHeight};`,
    `  ${n}-preview-size:${d.previewSize};`,
  ];
}
