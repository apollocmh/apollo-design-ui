/** Static Layout styles. Property fallbacks preserve inherited and native CSS variables. */

import { token2CSSVar } from '@apollo-design/theme';
import { layoutTokenValue } from './defaults';

export { genTokenDecls } from './defaults';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Layout 的静态 CSS（Layout / Header / Footer / Content）。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genLayoutStyle(rootPrefixCls: string): string {
  const cls = `.${rootPrefixCls}-layout`;
  const menuCls = `.${rootPrefixCls}-menu`;
  const t = (name: Parameters<typeof layoutTokenValue>[1]) => layoutTokenValue(rootPrefixCls, name);

  const rules: string[] = [
    `${cls}{`,
    // Structural font reset also applies to independent Header/Footer/Content below.
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  box-sizing:border-box;`,
    // ---- genLayoutStyle ----
    `  display:flex;`,
    `  flex:auto;`,
    `  flex-direction:column;`,
    `  min-height:0;`,
    `  background:${t('body-bg')};`,
    `}`,
    `${cls}::before,${cls}::after{`,
    `  box-sizing:border-box;`,
    `}`,
    // '&, *': { box-sizing: border-box }
    `${cls},${cls} *{`,
    `  box-sizing:border-box;`,
    `}`,
    `${cls}${cls}-has-sider{`,
    `  flex-direction:row;`,
    `}`,
    `${cls}${cls}-has-sider >${cls},${cls}${cls}-has-sider >${cls}-content{`,
    `  width:0;`,
    `}`,
    `${cls}-header,${cls}-footer{`,
    `  flex:0 0 auto;`,
    `}`,
    `${cls}-header,${cls}-footer,${cls}-content{`,
    `  box-sizing:border-box;`,
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `}`,
    // RTL
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    // ==================== Header ====================
    `${cls}-header{`,
    `  height:${t('header-height')};`,
    `  padding:${t('header-padding')};`,
    `  color:${t('header-color')};`,
    `  line-height:${t('header-height')};`,
    `  background:${t('header-bg')};`,
    `}`,
    `${cls}-header ${menuCls}{`,
    `  line-height:inherit;`,
    `}`,
    // ==================== Footer ====================
    `${cls}-footer{`,
    `  padding:${t('footer-padding')};`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  background:${t('footer-bg')};`,
    `}`,
    // =================== Content ====================
    `${cls}-content{`,
    `  flex:auto;`,
    `  color:${v('colorText')};`,
    `  min-height:0;`,
    `}`,
  ];

  return rules.join('');
}

/** Sider 的样式（同属 Layout 家族，故从这里一并导出）。 */
export { genSiderStyle } from './sider';
