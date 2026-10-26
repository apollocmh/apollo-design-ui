/** Static Result CSS with scoped aliases and four overridable component variables. */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Result 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genResultStyle(rootPrefixCls: string): string {
  const cls = `.${rootPrefixCls}-result`;

  // ---- Component Token 声明（antd 的 prepareComponentToken 产物）----
  const tokenDecls = [
    `  --${rootPrefixCls}-result-title-font-size:${v('fontSizeHeading3')};`,
    `  --${rootPrefixCls}-result-subtitle-font-size:${v('fontSize')};`,
    `  --${rootPrefixCls}-result-icon-font-size:calc(${v('fontSizeHeading3')} * 3);`,
    `  --${rootPrefixCls}-result-extra-margin:${v('paddingLG')} 0 0 0;`,
  ];

  const t = (name: string): string => `var(--${rootPrefixCls}-result-${name})`;

  const rules: string[] = [
    // ---- Component Token（antd 的 .css-var-root 块）----
    `${cls}{`,
    ...tokenDecls,
    // genCommonStyle（genStyleHooks 注入，清单 §六.6）
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  padding:calc(${v('paddingLG')} * 2) ${v('paddingXL')};`,
    `}`,

    // ---- -rtl（antd 的 `&-rtl` 嵌套 → 单一后缀类）----
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,

    // ---- 异常插画 ----
    `${cls} ${cls}-image{`,
    `  width:250px;`,
    `  height:295px;`,
    `  margin:auto;`,
    `}`,

    // ---- 图标 ----
    `${cls} ${cls}-icon{`,
    `  margin-bottom:${v('paddingLG')};`,
    `  text-align:center;`,
    `}`,
    // `& > ${iconCls}`（iconCls = .anticon → 我们 .apollo-icon）
    `${cls} ${cls}-icon>.apollo-icon{`,
    `  font-size:${t('icon-font-size')};`,
    `}`,

    // ---- 标题 ----
    `${cls} ${cls}-title{`,
    `  color:${v('colorTextHeading')};`,
    `  font-size:${t('title-font-size')};`,
    `  line-height:${v('lineHeightHeading3')};`,
    `  margin-block:${v('marginXS')};`,
    `  text-align:center;`,
    `}`,

    // ---- 副标题 ----
    `${cls} ${cls}-subtitle{`,
    `  color:${v('colorTextSecondary')};`,
    `  font-size:${t('subtitle-font-size')};`,
    `  line-height:${v('lineHeight')};`,
    `  text-align:center;`,
    `}`,

    // ---- body ----
    `${cls} ${cls}-body{`,
    `  margin-top:${v('paddingLG')};`,
    `  padding:${v('paddingLG')} calc(${v('padding')} * 2.5);`,
    `  background-color:${v('colorFillAlter')};`,
    `}`,

    // ---- extra ----
    `${cls} ${cls}-extra{`,
    `  margin:${t('extra-margin')};`,
    `  text-align:center;`,
    `}`,
    `${cls} ${cls}-extra>*{`,
    `  margin-inline-end:${v('paddingXS')};`,
    `}`,
    `${cls} ${cls}-extra>*:last-child{`,
    `  margin-inline-end:0;`,
    `}`,

    // ---- 状态图标色（genStatusIconStyle）----
    `${cls}-success ${cls}-icon>.apollo-icon{`,
    `  color:${v('colorSuccess')};`,
    `}`,
    `${cls}-error ${cls}-icon>.apollo-icon{`,
    `  color:${v('colorError')};`,
    `}`,
    `${cls}-info ${cls}-icon>.apollo-icon{`,
    `  color:${v('colorInfo')};`,
    `}`,
    `${cls}-warning ${cls}-icon>.apollo-icon{`,
    `  color:${v('colorWarning')};`,
    `}`,
  ];

  return rules.join('\n');
}
