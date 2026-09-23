/**
 * InputNumber 的样式生成（G4 产物）。
 *
 * 契约来源：antd 6.6.4 的 `es/input-number/style/index.js` + input/variants
 * （genOutlined/Filled/Underlined/BorderlessStyle）+ `style/compact-item` ——
 * **逐条对拍 extractStyle 真实产物**（126 条规则，见本文件每段的注释锚点），
 * 不是照源码推演（CHECKLIST #2/#71）。
 *
 * ── 与 antd 产物的结构性差异 ──────────────────────────────────────────────────
 *
 * 1. 无 hash / css-var 包裹类（D5）；全部 `--ant-*` 前缀换成
 *    `--{rootPrefixCls}-input-number-*`（组件 token，声明落在根规则）与
 *    `--apollo-*`（全局 alias token，随主题自适应）。构建期算式值
 *    （activeShadow 组合串、filledHandleBg 色彩合成）落常量（collapse D46/D50 同判）。
 * 2. 上游产物里有两条**死规则**照抄与否不影响渲染：`.ant-input-number:hover
 *    .-handler-wrap`（v6 DOM 已无 handler-wrap，共享 input 样式的遗留）与
 *    `-textarea-rtl`（textarea 不属于本组件）。按「产物 > 源码」原则**保留**
 *    handler-wrap 规则（对拍时少一条差异）、**丢弃** textarea 相关选择器
 *    （它属于 Input/Affix 的共享段，本组件 DOM 不可达）。
 * 3. `:has(input:focus-visible)` 等现代选择器照抄（目标浏览器为现代引擎）。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { inputNumberTokenValues } from './token';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** 组件 token 引用：`--{p}-input-number-*`。 */
const sv = (p: string, name: string): string => `var(--${p}-input-number-${name})`;

/**
 * Component Token 声明块（antd 6.6.4 css-var 产物在根上声明的全部变量，
 * 值逐条对拍：padding-block 4px / handle-width 22px / filled-handle-bg #f0f0f0…）。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = inputNumberTokenValues();
  return [
    // input 族基础（initComponentToken）
    `  --${p}-input-number-padding-block:${t.paddingBlock};`,
    `  --${p}-input-number-padding-block-sm:${t.paddingBlockSM};`,
    `  --${p}-input-number-padding-block-lg:${t.paddingBlockLG};`,
    `  --${p}-input-number-padding-inline:${t.paddingInline};`,
    `  --${p}-input-number-padding-inline-sm:${t.paddingInlineSM};`,
    `  --${p}-input-number-padding-inline-lg:${t.paddingInlineLG};`,
    `  --${p}-input-number-input-font-size:${t.inputFontSize};`,
    `  --${p}-input-number-input-font-size-sm:${t.inputFontSizeSM};`,
    `  --${p}-input-number-input-font-size-lg:${t.inputFontSizeLG};`,
    `  --${p}-input-number-addon-bg:${v('colorFillAlter')};`,
    `  --${p}-input-number-hover-bg:${v('colorBgContainer')};`,
    `  --${p}-input-number-active-bg:${v('colorBgContainer')};`,
    `  --${p}-input-number-hover-border-color:${v('colorPrimaryHover')};`,
    `  --${p}-input-number-active-border-color:${v('colorPrimary')};`,
    `  --${p}-input-number-active-shadow:0 0 0 ${v('controlOutlineWidth')}px ${v('controlOutline')};`,
    `  --${p}-input-number-error-active-shadow:0 0 0 ${v('controlOutlineWidth')}px ${v('colorErrorOutline')};`,
    `  --${p}-input-number-warning-active-shadow:0 0 0 ${v('controlOutlineWidth')}px ${v('colorWarningOutline')};`,
    `  --${p}-input-number-line-width-focus:${v('lineWidthFocus')};`,
    // genCssVar('input-number') 的 input-padding 对（默认档 = 基础值）
    `  --${p}-input-number-input-padding-block:${sv(p, 'padding-block')};`,
    `  --${p}-input-number-input-padding-inline:${sv(p, 'padding-inline')};`,
    // InputNumber 的 9 个 Component Token
    `  --${p}-input-number-control-width:${t.controlWidth};`,
    `  --${p}-input-number-handle-width:${t.handleWidth};`,
    `  --${p}-input-number-handle-font-size:${t.handleFontSize};`,
    `  --${p}-input-number-handle-visible:${t.handleVisible === true ? 'true' : 'auto'};`,
    `  --${p}-input-number-handle-opacity:${t.handleOpacity};`,
    `  --${p}-input-number-handle-visible-width:${t.handleVisibleWidth};`,
    `  --${p}-input-number-handle-bg:${t.handleBg};`,
    `  --${p}-input-number-handle-active-bg:${t.handleActiveBg};`,
    `  --${p}-input-number-handle-hover-color:${t.handleHoverColor};`,
    `  --${p}-input-number-handle-border-color:${t.handleBorderColor};`,
    `  --${p}-input-number-filled-handle-bg:${t.filledHandleBg};`,
    // 供下游对拍参照（未消费但产物存在）：lineWidth 组合串频繁出现，本地变量仅注释提示
    `  /* lineWidth 组合串在下方以内联 var(--apollo-line-width) 形式出现 */`.replace(
      '  /*',
      '  /*',
    ),
  ].slice(0, -1); // 最后一行只是注释占位，不落盘
}

/** status（error/warning）扩展段：`genStatusColor` 产物，variant 各自的体。 */
function genStatusBlocks(
  p: string,
  variant: 'outlined' | 'filled' | 'underlined' | 'borderless',
  cls: string,
): string[] {
  const lw = v('lineWidth');
  const lt = v('lineType');
  const statusColor = (s: 'error' | 'warning'): string =>
    s === 'error' ? v('colorError') : v('colorWarning');
  const bgHover = (s: 'error' | 'warning'): string =>
    s === 'error' ? v('colorErrorBgHover') : v('colorWarningBgHover');
  const bgBase = (s: 'error' | 'warning'): string =>
    s === 'error' ? v('colorErrorBg') : v('colorWarningBg');
  const text = (s: 'error' | 'warning'): string =>
    s === 'error' ? v('colorErrorText') : v('colorWarningText');
  const affix = (s: 'error' | 'warning'): string =>
    s === 'error' ? v('colorErrorAffix') : v('colorWarningAffix');
  const shadow = (s: 'error' | 'warning'): string =>
    sv(p, s === 'error' ? 'error-active-shadow' : 'warning-active-shadow');
  const input = `.${p}-input-number-input`;
  const out: string[] = [];

  for (const s of ['error', 'warning'] as const) {
    if (variant === 'outlined') {
      out.push(
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled){background:${v('colorBgContainer')};border-width:${v('lineWidth')};border-style:${v('lineType')};border-color:${statusColor(s)};}`,
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled):hover{border-color:${v(s === 'error' ? 'colorErrorBorderHover' : 'colorWarningBorderHover')};background-color:${sv(p, 'hover-bg')};}`,
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled):focus,${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled):focus-within{border-color:${statusColor(s)};box-shadow:${shadow(s)};outline:0;background-color:${sv(p, 'active-bg')};}`,
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled) .${p}-input-number-prefix,${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled) .${p}-input-number-suffix{color:${affix(s)};}`,
        `${cls}-${variant}${cls}-status-${s}${cls}-disabled{border-color:${statusColor(s)};}`,
      );
    } else if (variant === 'filled') {
      out.push(
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled){background:${bgBase(s)};border-width:${lw};border-style:${lt};border-color:transparent;}`,
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled) ${input}{color:${text(s)};}`,
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled):hover{background:${bgHover(s)};}`,
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled):focus,${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled):focus-within{outline:0;border-color:${statusColor(s)};background-color:${sv(p, 'active-bg')};}`,
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled) .${p}-input-number-prefix,${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled) .${p}-input-number-suffix{color:${affix(s)};}`,
      );
    } else if (variant === 'underlined') {
      out.push(
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled){background:${v('colorBgContainer')};border-width:${v('lineWidth')} 0;border-style:${v('lineType')} none;border-color:transparent transparent ${statusColor(s)} transparent;border-radius:0;}`,
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled):hover{border-color:transparent transparent ${v(s === 'error' ? 'colorErrorBorderHover' : 'colorWarningBorderHover')} transparent;background-color:${sv(p, 'hover-bg')};}`,
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled):focus,${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled):focus-within{border-color:transparent transparent ${statusColor(s)} transparent;outline:0;background-color:${sv(p, 'active-bg')};}`,
        `${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled) .${p}-input-number-prefix,${cls}-${variant}${cls}-status-${s}:not(${cls}-disabled) .${p}-input-number-suffix{color:${affix(s)};}`,
        `${cls}-${variant}${cls}-status-${s}${cls}-disabled{border-color:transparent transparent ${statusColor(s)} transparent;border-radius:0;}`,
      );
    } else {
      out.push(
        `${cls}-${variant}${cls}-status-${s},${cls}-${variant}${cls}-status-${s} input,${cls}-${variant}${cls}-status-${s} textarea{color:${statusColor(s)};}`,
        `${cls}-${variant}${cls}-status-${s}:focus-visible,${cls}-${variant}${cls}-status-${s}:has(input:focus-visible),${cls}-${variant}${cls}-status-${s}:has(textarea:focus-visible){outline:${sv(p, 'line-width-focus')} ${v('lineType')} ${statusColor(s)};outline-offset:calc(${v('lineWidth')} * -1);transition:outline-offset 0s,outline 0s;}`,
        `${cls}-${variant}${cls}-status-${s} .${p}-input-number-prefix,${cls}-${variant}${cls}-status-${s} .${p}-input-number-suffix{color:${affix(s)};}`,
      );
    }
  }
  return out;
}

export function genInputNumberStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-input-number`;
  const lw = v('lineWidth');
  const lt = v('lineType');
  const borderStyle = `${lw} ${lt} ${sv(p, 'handle-border-color')}`;
  const input = `.${p}-input-number-input`;
  const action = `.${p}-input-number-action`;
  const actions = `.${p}-input-number-actions`;

  const lines: string[] = [];

  // ============ 根（reset + genBasicInputStyle + token 声明）============
  lines.push(
    `${cls}{`,
    ...genTokenDecls(p),
    `box-sizing:border-box;`,
    `margin:0;`,
    `padding:${sv(p, 'padding-block')} ${sv(p, 'padding-inline')};`,
    `color:${v('colorText')};`,
    `font-size:${sv(p, 'input-font-size')};`,
    `line-height:${v('lineHeight')};`,
    `list-style:none;`,
    `font-family:${v('fontFamily')};`,
    `position:relative;`,
    `display:inline-flex;`,
    `width:${sv(p, 'control-width')};`,
    `min-width:0;`,
    `border-radius:${v('borderRadius')};`,
    `transition:all ${v('motionDurationMid')};`,
    `padding-block:0;`,
    `}`,
  );

  // 根上的 placeholder（genPlaceholderStyle；input 共享段的产物）
  lines.push(
    `${cls}::-moz-placeholder{opacity:1;}`,
    `${cls}::placeholder{color:${v('colorTextPlaceholder')};user-select:none;}`,
    `${cls}:placeholder-shown{text-overflow:ellipsis;}`,
  );

  // ============ Size ============
  lines.push(
    `${cls}-lg{padding:${sv(p, 'padding-block-lg')} ${sv(p, 'padding-inline-lg')};font-size:${sv(p, 'input-font-size-lg')};line-height:${v('lineHeightLG')};border-radius:${v('borderRadiusLG')};}`,
    `${cls}-sm{padding:${sv(p, 'padding-block-sm')} ${sv(p, 'padding-inline-sm')};font-size:${sv(p, 'input-font-size-sm')};border-radius:${v('borderRadiusSM')};}`,
  );

  // RTL（textarea-rtl 共享选择器不入本组件）
  lines.push(`${cls}-rtl{direction:rtl;}`);

  // ============ Variants ============
  // ---- outlined ----
  lines.push(
    `${cls}-outlined{background:${v('colorBgContainer')};border-width:${lw};border-style:${lt};border-color:${v('colorBorder')};}`,
    `${cls}-outlined:hover{border-color:${sv(p, 'hover-border-color')};background-color:${sv(p, 'hover-bg')};}`,
    `${cls}-outlined:focus,.${p}-input-number-outlined:focus-within{border-color:${sv(p, 'active-border-color')};box-shadow:${sv(p, 'active-shadow')};outline:0;background-color:${sv(p, 'active-bg')};}`,
    `${cls}-outlined${cls}-disabled,.${p}-input-number-outlined[disabled]{color:${v('colorTextDisabled')};background-color:${v('colorBgContainerDisabled')};border-color:${v('colorBorderDisabled')};box-shadow:none;cursor:not-allowed;opacity:1;}`,
    `${cls}-outlined${cls}-disabled ${input}[disabled],.${p}-input-number-outlined[disabled] ${input}[disabled]{cursor:not-allowed;}`,
    `${cls}-outlined${cls}-disabled:hover:not([disabled]),.${p}-input-number-outlined[disabled]:hover:not([disabled]){border-color:${v('colorBorderDisabled')};background-color:${v('colorBgContainerDisabled')};}`,
    `${cls}-outlined ${actions}{background:${sv(p, 'handle-bg')};}`,
    `${cls}-outlined ${actions} ${action}-down{border-block-start:${borderStyle};}`,
  );

  // ---- filled ----
  lines.push(
    `${cls}-filled{background:${v('colorFillTertiary')};border-width:${lw};border-style:${lt};border-color:transparent;}`,
    `${cls}-filled:hover{background:${v('colorFillSecondary')};}`,
    `${cls}-filled:focus,.${p}-input-number-filled:focus-within{outline:0;border-color:${sv(p, 'active-border-color')};background-color:${sv(p, 'active-bg')};}`,
    `${cls}-filled${cls}-disabled,.${p}-input-number-filled[disabled]{color:${v('colorTextDisabled')};background-color:${v('colorBgContainerDisabled')};border-color:${v('colorBorderDisabled')};box-shadow:none;cursor:not-allowed;opacity:1;}`,
    `${cls}-filled${cls}-disabled ${input}[disabled],.${p}-input-number-filled[disabled] ${input}[disabled]{cursor:not-allowed;}`,
    `${cls}-filled${cls}-disabled:hover:not([disabled]),.${p}-input-number-filled[disabled]:hover:not([disabled]){border-color:${v('colorBorderDisabled')};background-color:${v('colorBgContainerDisabled')};}`,
    `${cls}-filled ${actions}{background:${sv(p, 'filled-handle-bg')};}`,
    `${cls}-filled ${actions} ${action}-down{border-block-start:${borderStyle};}`,
    `${cls}-filled:focus-within ${actions}{background:${sv(p, 'handle-bg')};}`,
  );

  // ---- underlined ----
  lines.push(
    `${cls}-underlined{background:${v('colorBgContainer')};border-width:${lw} 0;border-style:${lt} none;border-color:transparent transparent ${v('colorBorder')} transparent;border-radius:0;}`,
    `${cls}-underlined:hover{border-color:transparent transparent ${sv(p, 'hover-border-color')} transparent;background-color:${sv(p, 'hover-bg')};}`,
    `${cls}-underlined:focus,.${p}-input-number-underlined:focus-within{border-color:transparent transparent ${sv(p, 'active-border-color')} transparent;outline:0;background-color:${sv(p, 'active-bg')};}`,
    `${cls}-underlined${cls}-disabled,.${p}-input-number-underlined[disabled]{color:${v('colorTextDisabled')};box-shadow:none;cursor:not-allowed;}`,
    `${cls}-underlined ${input}[disabled]{cursor:not-allowed;}`,
    `${cls}-underlined${cls}-disabled:hover,.${p}-input-number-underlined[disabled]:hover{border-color:transparent transparent ${v('colorBorder')} transparent;}`,
    `${cls}-underlined ${actions}{background:${sv(p, 'handle-bg')};}`,
    `${cls}-underlined ${actions} ${action}-down{border-block-start:${borderStyle};}`,
  );

  // ---- borderless ----
  lines.push(
    `${cls}-borderless{background:transparent;border:none;}`,
    `${cls}-borderless:focus,.${p}-input-number-borderless:focus-within{outline:none;}`,
    `${cls}-borderless:focus-visible,.${p}-input-number-borderless:has(input:focus-visible),.${p}-input-number-borderless:has(textarea:focus-visible){outline:${sv(p, 'line-width-focus')} ${lt} ${sv(p, 'active-border-color')};outline-offset:calc(${lw} * -1);transition:outline-offset 0s,outline 0s;}`,
    `${cls}-borderless${cls}-disabled,.${p}-input-number-borderless[disabled]{color:${v('colorTextDisabled')};cursor:not-allowed;}`,
    // 高度补偿（padding-block:0 + 内层变量加回 lineWidth）
    `${cls}${cls}-borderless{padding-block:0;--${p}-input-number-input-padding-block:calc(${sv(p, 'padding-block')} + ${lw});}`,
    `${cls}${cls}-borderless${cls}-sm{padding-block:0;--${p}-input-number-input-padding-block:calc(${sv(p, 'padding-block-sm')} + ${lw});}`,
    `${cls}${cls}-borderless${cls}-lg{padding-block:0;--${p}-input-number-input-padding-block:calc(${sv(p, 'padding-block-lg')} + ${lw});}`,
  );

  // status 扩展段（四 variant × error/warning）
  lines.push(
    ...genStatusBlocks(p, 'outlined', cls),
    ...genStatusBlocks(p, 'filled', cls),
    ...genStatusBlocks(p, 'underlined', cls),
    ...genStatusBlocks(p, 'borderless', cls),
  );

  // ============ RTL 内层 ============
  lines.push(`${cls}-rtl ${input}{direction:rtl;}`);

  // ============ Out of range ============
  lines.push(`${cls}${cls}-out-of-range ${input}{color:${v('colorError')};}`);

  // ============ Input 内层 ============
  lines.push(
    `${cls} ${input}{box-sizing:border-box;margin:0;padding:0;color:${v('colorText')};font-size:inherit;line-height:inherit;list-style:none;font-family:${v('fontFamily')};width:100%;padding-block:${sv(p, 'input-padding-block')};text-align:start;background-color:transparent;border:0;border-radius:0;outline:0;transition:all ${v('motionDurationMid')} linear;appearance:textfield;}`,
    `${cls} ${input}::-moz-placeholder{opacity:1;}`,
    `${cls} ${input}::placeholder{color:${v('colorTextPlaceholder')};user-select:none;}`,
    `${cls} ${input}:placeholder-shown{text-overflow:ellipsis;}`,
    `${cls} ${input}[type="number"]::-webkit-inner-spin-button,.${p}-input-number ${input}[type="number"]::-webkit-outer-spin-button{margin:0;appearance:none;}`,
    // 遗留 handler-wrap 规则（v6 DOM 无此节点，产物保留 ⇒ 对拍保留）
    `${cls}:hover .${p}-input-number-handler-wrap,.${p}-input-number-focused .${p}-input-number-handler-wrap{width:${sv(p, 'handle-width')};opacity:1;}`,
    `${cls}-disabled ${input}{cursor:not-allowed;color:${v('colorTextDisabled')};}`,
  );

  // ============ Action ============
  lines.push(
    // resetIcon 基座（产物第一段）
    `${cls} ${action}{display:inline-flex;align-items:center;color:inherit;font-style:normal;line-height:0;text-align:center;text-transform:none;vertical-align:-0.125em;text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;user-select:none;overflow:hidden;font-weight:bold;cursor:pointer;transition:all ${v('motionDurationMid')} linear;}`,
    `${cls} ${action} >*{line-height:1;}`,
    `${cls} ${action} svg{display:inline-block;vertical-align:inherit;}`,
    `${cls} ${action}:active:not(.${p}-input-number-action-up-disabled):not(.${p}-input-number-action-down-disabled){background:${sv(p, 'handle-active-bg')};}`,
    `${cls} ${action}:hover:not(.${p}-input-number-action-up-disabled):not(.${p}-input-number-action-down-disabled){color:${sv(p, 'handle-hover-color')};}`,
    `${cls} ${action}.${p}-input-number-action-up-disabled,.${p}-input-number ${action}.${p}-input-number-action-down-disabled{cursor:not-allowed;color:${v('colorTextDisabled')};}`,
  );

  // ============ mode-input ============
  lines.push(
    `${cls}-mode-input{overflow:hidden;}`,
    `${cls}-mode-input ${actions}{position:absolute;inset-block-start:0;inset-inline-end:0;width:${sv(p, 'handle-visible-width')};opacity:${sv(p, 'handle-opacity')};height:100%;border-radius:0;display:flex;flex-direction:column;align-items:stretch;transition:all ${v('motionDurationMid')};overflow:hidden;}`,
    `${cls}-mode-input ${actions} ${action}{display:flex;align-items:center;justify-content:center;flex:auto;height:40%;margin-inline-end:0;font-size:${sv(p, 'handle-font-size')};}`,
    `${cls}-mode-input:hover ${actions},.${p}-input-number-mode-input-focused ${actions}{width:${sv(p, 'handle-width')};opacity:1;}`,
    `${cls}-mode-input ${action}{color:${v('colorIcon')};height:50%;border-inline-start:${borderStyle};}`,
    `${cls}-mode-input ${action}:hover:not(.${p}-input-number-action-up-disabled):not(.${p}-input-number-action-down-disabled){height:60%;}`,
    `${cls}-mode-input${cls}-disabled ${actions},.${p}-input-number-mode-input.${p}-input-number-readonly ${actions}{display:none;}`,
  );

  // ============ mode-spinner ============
  lines.push(
    `${cls}${cls}-mode-spinner{padding:0;width:auto;}`,
    `${cls}${cls}-mode-spinner ${action}{flex:none;padding-inline:${sv(p, 'input-padding-inline')};}`,
    `${cls}${cls}-mode-spinner ${action}-up{border-inline-start:${borderStyle};}`,
    `${cls}${cls}-mode-spinner ${action}-down{border-inline-end:${borderStyle};}`,
    `${cls}${cls}-mode-spinner ${input}{text-align:center;padding-inline:${sv(p, 'input-padding-inline')};}`,
  );

  // ============ Size 的内层变量档 ============
  lines.push(
    `${cls}-lg{--${p}-input-number-input-padding-block:${sv(p, 'padding-block-lg')};--${p}-input-number-input-padding-inline:${sv(p, 'padding-inline-lg')};padding-block:0;font-size:${sv(p, 'input-font-size-lg')};line-height:${v('lineHeightLG')};}`,
    `${cls}-sm{--${p}-input-number-input-padding-block:${sv(p, 'padding-block-sm')};--${p}-input-number-input-padding-inline:${sv(p, 'padding-inline-sm')};padding-block:0;font-size:${sv(p, 'input-font-size-sm')};border-radius:${v('borderRadiusSM')};}`,
  );

  // ============ Prefix / Suffix ============
  lines.push(
    `${cls} .${p}-input-number-prefix,.${p}-input-number .${p}-input-number-suffix{display:flex;flex:none;align-items:center;align-self:center;pointer-events:none;}`,
    `${cls} .${p}-input-number-prefix{margin-inline-end:${v('paddingXXS')};}`,
    `${cls} .${p}-input-number-suffix{height:100%;margin-inline-start:${v('paddingXXS')};transition:margin ${v('motionDurationMid')};}`,
    `${cls}:hover:not(.${p}-input-number-without-controls) .${p}-input-number-suffix{margin-inline-end:${sv(p, 'handle-width')};}`,
  );

  // ============ Addon（Space.Compact 兼容段）============
  lines.push(`${cls}-addon:has(.${p}-select){border:0;padding:0;}`);

  // ============ Compact item（genCompactItemStyle 产物）============
  lines.push(
    `${cls}-compact-item:not(.${p}-input-number-compact-last-item){margin-inline-end:calc(${lw} * -1);}`,
    `${cls}-compact-item:not(.${p}-input-number-status-success){z-index:2;}`,
    `${cls}-compact-item:focus,.${p}-input-number-compact-item:active{z-index:3;}`,
    `${cls}-compact-item:hover{z-index:4;}`,
    `${cls}-compact-item[disabled]{z-index:0;}`,
    `${cls}-compact-item:not(.${p}-input-number-compact-first-item):not(.${p}-input-number-compact-last-item){border-radius:0;}`,
    `${cls}-compact-item:not(.${p}-input-number-compact-last-item).${p}-input-number-compact-first-item,.${p}-input-number-compact-item:not(.${p}-input-number-compact-last-item).${p}-input-number-compact-first-item${cls}-sm,.${p}-input-number-compact-item:not(.${p}-input-number-compact-last-item).${p}-input-number-compact-first-item${cls}-lg{border-start-end-radius:0;border-end-end-radius:0;}`,
    `${cls}-compact-item:not(.${p}-input-number-compact-first-item).${p}-input-number-compact-last-item,.${p}-input-number-compact-item:not(.${p}-input-number-compact-first-item).${p}-input-number-compact-last-item${cls}-sm,.${p}-input-number-compact-item:not(.${p}-input-number-compact-first-item).${p}-input-number-compact-last-item${cls}-lg{border-start-start-radius:0;border-end-start-radius:0;}`,
  );

  return lines.join('\n');
}
