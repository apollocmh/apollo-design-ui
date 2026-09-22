/**
 * Checkbox 的样式生成（genCheckboxStyle）。
 *
 * 契约来源：antd 6.6.4 `es/checkbox/style/index.js` 的 `genCheckboxStyle` +
 * `@ant-design/cssinjs` extractStyle 的**实测产物**（cssVar 模式，hash 已去掉）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash / css-var 包裹类（D5）；**Component Token 0 个** —— 全部 alias token。
 * 2. `checkboxSize = controlInteractiveSize`（antd 的 mergeToken 注入）—— 直接用
 *    `var(--apollo-control-interactive-size)`。
 * 3. 勾（`:after`）与半选条的 `calc()` 全部按实测产物转写
 *    （`calc(var(--x) / 14 * 5)` 形态，与 antd 的 `token.calc(x).div(14).mul(5)` 同构）。
 * 4. hover 全部包在 `@media (hover: hover) and (pointer: fine)`；动效关闭段
 *    （`prefers-reduced-motion`）按 genNoMotionStyle 逐条落地。
 * 5. `:has(input:focus-visible)` 的 focus outline（genFocusOutline）实测产物形态。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Checkbox 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genCheckboxStyle(rootPrefixCls: string): string {
  const checkboxCls = `.${rootPrefixCls}-checkbox`;
  const wrapperCls = `${checkboxCls}-wrapper`;
  const size = v('controlInteractiveSize');
  const lw = v('lineWidth');
  const rowCls = `.${rootPrefixCls}-row`;

  // resetComponent 全套（checklist #14）
  const reset = (selector: string, extra: string[] = []): string[] => [
    `${selector}{`,
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:var(--apollo-line-height);`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    ...extra,
  ];

  const rules: string[] = [
    // ===================== Group =====================
    ...reset(`${checkboxCls}-group`, [
      `  display:inline-flex;`,
      `  flex-wrap:wrap;`,
      `  column-gap:${v('marginXS')};`,
    ]),
    `}`,
    `${checkboxCls}-group >${rowCls}{`,
    `  flex:1;`,
    `}`,
    // ===================== Wrapper =====================
    ...reset(wrapperCls, [
      `  display:inline-flex;`,
      `  align-items:baseline;`,
      `  cursor:pointer;`,
    ]),
    `}`,
    `${wrapperCls}:after{`,
    `  display:inline-block;`,
    `  width:0;`,
    `  overflow:hidden;`,
    `  content:'\\a0';`,
    `}`,
    `${wrapperCls}+${wrapperCls}{`,
    `  margin-inline-start:0;`,
    `}`,
    // ===================== Checkbox span =====================
    ...reset(checkboxCls, [
      `  position:relative;`,
      `  white-space:nowrap;`,
      `  line-height:1;`,
      `  cursor:pointer;`,
      `  align-self:center;`,
      `  display:block;`,
      `  width:${size};`,
      `  height:${size};`,
      `  direction:ltr;`,
      `  background-color:${v('colorBgContainer')};`,
      `  border:${lw} ${v('lineType')} ${v('colorBorder')};`,
      `  border-radius:${v('borderRadiusSM')};`,
      `  border-collapse:separate;`,
      `  transition:all ${v('motionDurationSlow')};`,
      `  flex:none;`,
    ]),
    `}`,
    // prefers-reduced-motion（genNoMotionStyle）
    `@media (prefers-reduced-motion: reduce){${checkboxCls},${checkboxCls}::before,${checkboxCls}::after{transition:none;animation:none;}}`,
    // Checkmark（:after）
    `${checkboxCls}:after{`,
    `  box-sizing:border-box;`,
    `  position:absolute;`,
    `  top:calc(${size} / 2 - ${lw});`,
    `  inset-inline-start:calc(${size} / 4 - ${lw});`,
    `  display:table;`,
    `  width:calc(${size} / 14 * 5);`,
    `  height:calc(${size} / 14 * 8);`,
    `  border:${v('lineWidthBold')} solid ${v('colorWhite')};`,
    `  border-top:0;`,
    `  border-inline-start:0;`,
    `  transform:rotate(45deg) scale(0) translate(-50%,-50%);`,
    `  opacity:0;`,
    `  content:"";`,
    `  transition:all ${v('motionDurationFast')} ${v('motionEaseInBack')},opacity ${v('motionDurationFast')};`,
    `}`,
    `@media (prefers-reduced-motion: reduce){${checkboxCls}:after{transition:none;animation:none;}}`,
    // input
    `${checkboxCls} ${checkboxCls}-input{`,
    `  position:absolute;`,
    `  inset:calc(-1 * (${lw}));`,
    `  z-index:1;`,
    `  cursor:pointer;`,
    `  opacity:0;`,
    `  margin:0;`,
    `}`,
    // focus outline（:has）
    `${checkboxCls}:has(${checkboxCls}-input:focus-visible){`,
    `  outline:${v('lineWidthFocus')} solid ${v('colorPrimaryBorder')};`,
    `  outline-offset:1px;`,
    `  transition:outline-offset 0s,outline 0s;`,
    `}`,
    // + span（文字）
    `${checkboxCls}+span{`,
    `  padding-inline-start:${v('paddingXS')};`,
    `  padding-inline-end:${v('paddingXS')};`,
    `}`,
    // ===================== Hover（pointer 精细设备）=====================
    `@media (hover: hover) and (pointer: fine){${wrapperCls}:not(${wrapperCls}-disabled):hover ${checkboxCls},${checkboxCls}:not(${checkboxCls}-disabled):hover ${checkboxCls}{border-color:${v('colorPrimary')};}}`,
    `@media (hover: hover) and (pointer: fine){${wrapperCls}:not(${wrapperCls}-disabled):hover ${checkboxCls}-checked:not(${checkboxCls}-disabled){background-color:${v('colorPrimaryHover')};border-color:transparent;}}`,
    // ===================== Checked =====================
    `${checkboxCls}-checked{`,
    `  background-color:${v('colorPrimary')};`,
    `  border-color:${v('colorPrimary')};`,
    `}`,
    `${checkboxCls}-checked:after{`,
    `  opacity:1;`,
    `  transform:rotate(45deg) scale(1) translate(-50%,-50%);`,
    `  transition:all ${v('motionDurationMid')} ${v('motionEaseOutBack')} ${v('motionDurationFast')};`,
    `}`,
    `@media (prefers-reduced-motion: reduce){${checkboxCls}-checked:after{transition:none;animation:none;}}`,
    `@media (hover: hover) and (pointer: fine){${checkboxCls}-checked:not(${checkboxCls}-disabled):hover{background-color:${v('colorPrimaryHover')};border-color:transparent;}}`,
    // ===================== Indeterminate =====================
    `${checkboxCls}-indeterminate{`,
    `  background-color:${v('colorBgContainer')};`,
    `  border-color:${v('colorBorder')};`,
    `}`,
    `${checkboxCls}-indeterminate:after{`,
    `  top:50%;`,
    `  inset-inline-start:50%;`,
    `  width:calc(${v('fontSizeLG')} / 2);`,
    `  height:calc(${v('fontSizeLG')} / 2);`,
    `  background-color:${v('colorPrimary')};`,
    `  border:0;`,
    `  transform:translate(-50%, -50%) scale(1);`,
    `  opacity:1;`,
    `  content:"";`,
    `}`,
    `@media (hover: hover) and (pointer: fine){${checkboxCls}-indeterminate:not(${checkboxCls}-disabled):hover{background-color:${v('colorBgContainer')};border-color:${v('colorPrimary')};}}`,
    // ===================== Disabled =====================
    `${wrapperCls}-disabled{`,
    `  cursor:not-allowed;`,
    `}`,
    `${checkboxCls}-disabled,${checkboxCls}-disabled ${checkboxCls}-input{`,
    `  cursor:not-allowed;`,
    `  pointer-events:none;`,
    `}`,
    `${checkboxCls}-disabled{`,
    `  background:${v('colorBgContainerDisabled')};`,
    `  border-color:${v('colorBorder')};`,
    `}`,
    `${checkboxCls}-disabled:after{`,
    `  border-color:${v('colorTextDisabled')};`,
    `}`,
    `${checkboxCls}-disabled+span{`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${checkboxCls}-disabled${checkboxCls}-indeterminate::after{`,
    `  background:${v('colorTextDisabled')};`,
    `}`,
  ];

  return rules.join('');
}
