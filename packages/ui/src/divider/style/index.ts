/** Static Divider CSS; local component variables keep defaults and current scoped overrides. */
import { token2CSSVar } from '@apollo-design/theme';
import { ORIENTATION_MARGIN, TEXT_PADDING_INLINE, TITLE_FONT_WEIGHT } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Divider 的静态 CSS。
 *
 * @param prefixCls CSS namespace, e.g. apollo or my-app (DOM prefix my-app-divider).
 */
export function genDividerStyle(prefixCls: string): string {
  // ⚠️ 带 `-divider` 后缀：`getPrefixCls('divider')` 在**不传** customizePrefixCls 时
  // 返回 `${defaultPrefixCls}-divider`（即 `apollo-divider`）。传了 customizePrefixCls
  // 时它直接返回完整组件前缀；例如 my-app-divider 对应本函数的 my-app。
  const cls = `.${prefixCls}-divider`;
  const variable = (name: string) => token2CSSVar(name, `${prefixCls}-divider`);
  const component = (name: string) => `var(${variable(name)})`;
  const rail = `${cls}-rail`;
  const innerText = `${cls}-inner-text`;
  const horizontalWithText = `${cls}-horizontal${cls}-with-text`;

  // 组件级 token 的取值来源（见 style/token.ts）：
  //   - defaults are declared on the root
  //   - current ThemeContext values are assigned inline by useDividerTheme
  const textPaddingInline = component('textPaddingInline');
  const orientationMargin = component('orientationMargin');
  const verticalMarginInline = component('verticalMarginInline');

  const line = v('lineWidth');
  const split = v('colorSplit');

  return [
    // ---- genSharedDividerStyle -------------------------------------------
    // resetComponent(token) 的展开（antd `components/style/index.tsx`）：
    // box-sizing / margin / padding / color / font-size / line-height / list-style / font-family
    `${cls}{`,
    `  ${variable('textPaddingInline')}:${TEXT_PADDING_INLINE};`,
    `  ${variable('orientationMargin')}:${ORIENTATION_MARGIN};`,
    `  ${variable('verticalMarginInline')}:${v('marginXS')};`,
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  border-block-start:${line} solid ${split};`,
    `}`,
    // 无 children 时根元素同时带 `-rail` 类名，这条为它提供同一条上边框。
    `${cls} ${rail}{`,
    `  border-block-start:${line} solid ${split};`,
    `}`,
    '',
    // ---- vertical --------------------------------------------------------
    `${cls}-vertical{`,
    `  position:relative;`,
    `  top:-0.06em;`,
    `  display:inline-block;`,
    `  height:0.9em;`,
    `  margin-inline:${verticalMarginInline};`,
    `  margin-block:0;`,
    `  vertical-align:middle;`,
    `  border-top:0;`,
    `  border-inline-start:${line} solid ${split};`,
    `}`,
    '',
    // ---- horizontal ------------------------------------------------------
    `${cls}-horizontal{`,
    `  display:flex;`,
    `  clear:both;`,
    `  width:100%;`,
    // Fix https://github.com/ant-design/ant-design/issues/10914
    `  min-width:100%;`,
    `  margin:${v('marginLG')} 0;`,
    `}`,
    `${horizontalWithText}{`,
    `  display:flex;`,
    `  align-items:center;`,
    `  margin:${v('margin')} 0;`,
    `  color:${v('colorTextHeading')};`,
    `  font-weight:${TITLE_FONT_WEIGHT};`,
    `  font-size:${v('fontSizeLG')};`,
    `  white-space:nowrap;`,
    `  text-align:center;`,
    `  border-block-start:0 ${split};`,
    `}`,
    `${horizontalWithText} ${rail}-start,${horizontalWithText} ${rail}-end{`,
    `  width:50%;`,
    // Chrome not accept `inherit` in `border-top`
    `  border-block-start-color:inherit;`,
    `  border-block-end:0;`,
    `  content:'';`,
    `}`,
    `${cls}-horizontal${cls}-with-text-start ${rail}-start{`,
    `  width:calc(${orientationMargin} * 100%);`,
    `}`,
    `${cls}-horizontal${cls}-with-text-start ${rail}-end{`,
    `  width:calc(100% - ${orientationMargin} * 100%);`,
    `}`,
    `${cls}-horizontal${cls}-with-text-end ${rail}-start{`,
    `  width:calc(100% - ${orientationMargin} * 100%);`,
    `}`,
    `${cls}-horizontal${cls}-with-text-end ${rail}-end{`,
    `  width:calc(${orientationMargin} * 100%);`,
    `}`,
    `${cls} ${innerText}{`,
    `  display:inline-block;`,
    `  padding-block:0;`,
    `  padding-inline:${textPaddingInline};`,
    `}`,
    '',
    // ---- dashed ----------------------------------------------------------
    `${cls}-dashed{`,
    `  background:none;`,
    `  border-color:${split};`,
    `  border-style:dashed;`,
    `  border-width:${line} 0 0;`,
    `}`,
    `${cls}-dashed ${rail}{`,
    `  border-block-start:${line} dashed ${split};`,
    `}`,
    `${horizontalWithText}${cls}-dashed ${rail}-start,${horizontalWithText}${cls}-dashed ${rail}-end{`,
    `  border-style:dashed none none;`,
    `}`,
    `${cls}-vertical${cls}-dashed{`,
    `  border-inline-start-width:${line};`,
    `  border-inline-end:0;`,
    `  border-block-start:0;`,
    `  border-block-end:0;`,
    `}`,
    '',
    // ---- dotted ----------------------------------------------------------
    `${cls}-dotted{`,
    `  background:none;`,
    `  border-color:${split};`,
    `  border-style:dotted;`,
    `  border-width:${line} 0 0;`,
    `}`,
    `${cls}-dotted ${rail}{`,
    `  border-block-start:${line} dotted ${split};`,
    `}`,
    // The real titled rails use dotted even when the legacy dashed flag is also set.
    `${horizontalWithText}${cls}-dotted ${rail}-start,${horizontalWithText}${cls}-dotted ${rail}-end{`,
    `  border-style:dotted none none;`,
    `}`,
    `${cls}-vertical${cls}-dotted{`,
    `  border-inline-start-width:${line};`,
    `  border-inline-end:0;`,
    `  border-block-start:0;`,
    `  border-block-end:0;`,
    `}`,
    '',
    // ---- plain -----------------------------------------------------------
    `${cls}-plain${cls}-with-text{`,
    `  color:${v('colorText')};`,
    `  font-weight:normal;`,
    `  font-size:${v('fontSize')};`,
    `}`,
    '',
    // ---- orientationMargin 的「去默认边距」变体 ----------------------------
    // 传了 orientationMargin 且位置为 start / end 时，最近的那条 rail 宽度归零，
    // 改由 inner-text 的 padding 顶开（padding 值 = sizePaddingEdgeHorizontal = 0）。
    `${cls}-horizontal${cls}-with-text-start${cls}-no-default-orientation-margin-start ${rail}-start{`,
    `  width:0;`,
    `}`,
    `${cls}-horizontal${cls}-with-text-start${cls}-no-default-orientation-margin-start ${rail}-end{`,
    `  width:100%;`,
    `}`,
    `${cls}-horizontal${cls}-with-text-start${cls}-no-default-orientation-margin-start ${innerText}{`,
    `  padding-inline-start:0;`,
    `}`,
    `${cls}-horizontal${cls}-with-text-end${cls}-no-default-orientation-margin-end ${rail}-start{`,
    `  width:100%;`,
    `}`,
    `${cls}-horizontal${cls}-with-text-end${cls}-no-default-orientation-margin-end ${rail}-end{`,
    `  width:0;`,
    `}`,
    `${cls}-horizontal${cls}-with-text-end${cls}-no-default-orientation-margin-end ${innerText}{`,
    `  padding-inline-end:0;`,
    `}`,
    '',
    // ---- genSizeDividerStyle ---------------------------------------------
    // ⚠️ 选择器是 `.apollo-divider-horizontal.apollo-divider-sm`（`&${componentCls}` 复合），
    // 不是后代 —— 逐字来自 antd 的 `genSizeDividerStyle`。
    `${cls}-horizontal${cls}-sm{`,
    `  margin-block:${v('marginXS')};`,
    `}`,
    `${cls}-horizontal${cls}-md{`,
    `  margin-block:${v('margin')};`,
    `}`,
    '',
  ].join('\n');
}
