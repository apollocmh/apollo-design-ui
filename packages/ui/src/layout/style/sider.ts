/**
 * Sider 的样式生成（genSiderStyle）。
 *
 * 契约来源：antd 6.6.4 `es/layout/style/sider.js` 的 `genSiderStyle` +
 * extractStyle 实测产物（cssVar 模式，hash 已去掉）。
 *
 * ⚠️ 与 Layout 共用同一份 `prepareComponentToken` —— 所以这里也要声明那 19 个
 *    token（antd 的 `genStyleHooks(['Layout','Sider'], …)` 同样是各声明一份）。
 * ⚠️ `margin-top:-0.1px`：antd 源码写 `-0.1`，cssinjs 的 `unit()` 补 px。
 * ⚠️ `inset-inline-end: calc(var(--…-zero-trigger-width) * -1)`：antd 用
 *    `token.calc(x).mul(-1)`，产物就是这个 calc。
 */

import { token2CSSVar } from '@apollo-design/theme';
import { genTokenDecls } from './index';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名。 */
const cv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-layout-${name})`;

/**
 * 生成 Sider 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genSiderStyle(rootPrefixCls: string): string {
  const cls = `.${rootPrefixCls}-layout-sider`;
  const menuCls = `.${rootPrefixCls}-menu`;
  const t = (name: string) => cv(rootPrefixCls, name);

  // Sider 需要自己的一份 token 声明（与 Layout 块内容一致）
  const tokenDecls = genTokenDecls(rootPrefixCls).join('');

  const rules: string[] = [
    // ---- Component Token 声明 ----
    `${cls}{`,
    tokenDecls,
    // resetComponent（同 Layout；漏了它两侧字体就不同）
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  box-sizing:border-box;`,
    // ---- genSiderStyle ----
    `  position:relative;`,
    `  min-width:0;`,
    `  background:${t('sider-bg')};`,
    `  transition:all ${v('motionDurationMid')},background 0s;`,
    `}`,
    `${cls}::before,${cls}::after{`,
    `  box-sizing:border-box;`,
    `}`,
    `${cls}-has-trigger{`,
    `  padding-bottom:${t('trigger-height')};`,
    `}`,
    `${cls}-right{`,
    `  order:1;`,
    `}`,
    `${cls} ${cls}-children{`,
    `  height:100%;`,
    `  margin-top:-0.1px;`,
    `  padding-top:0.1px;`,
    `}`,
    `${cls} ${cls}-children ${menuCls}${menuCls}-inline-collapsed{`,
    `  width:auto;`,
    `}`,
    `${cls}-zero-width ${cls}-children{`,
    `  overflow:hidden;`,
    `}`,
    `${cls} ${cls}-trigger{`,
    `  position:fixed;`,
    `  bottom:0;`,
    `  z-index:1;`,
    `  height:${t('trigger-height')};`,
    `  color:${t('trigger-color')};`,
    `  line-height:${t('trigger-height')};`,
    `  text-align:center;`,
    `  background:${t('trigger-bg')};`,
    `  cursor:pointer;`,
    `  transition:all ${v('motionDurationMid')};`,
    `}`,
    `${cls} ${cls}-zero-width-trigger{`,
    `  position:absolute;`,
    `  top:${t('header-height')};`,
    `  inset-inline-end:calc(${t('zero-trigger-width')} * -1);`,
    `  z-index:1;`,
    `  width:${t('zero-trigger-width')};`,
    `  height:${t('zero-trigger-height')};`,
    `  color:${t('trigger-color')};`,
    `  font-size:${v('fontSizeXL')};`,
    `  display:flex;`,
    `  align-items:center;`,
    `  justify-content:center;`,
    `  background:${t('sider-bg')};`,
    `  border-radius:0 ${v('borderRadiusLG')} ${v('borderRadiusLG')} 0;`,
    `  cursor:pointer;`,
    `  transition:background-color ${v('motionDurationSlow')} ease;`,
    `}`,
    `${cls} ${cls}-zero-width-trigger::after{`,
    `  position:absolute;`,
    `  inset:0;`,
    `  background:transparent;`,
    `  transition:all ${v('motionDurationSlow')};`,
    `  content:"";`,
    `}`,
    `${cls} ${cls}-zero-width-trigger:hover::after{`,
    `  background:rgba(255, 255, 255, 0.2);`,
    `}`,
    `${cls} ${cls}-zero-width-trigger-right{`,
    `  inset-inline-start:calc(${t('zero-trigger-width')} * -1);`,
    `  border-radius:${v('borderRadiusLG')} 0 0 ${v('borderRadiusLG')};`,
    `}`,
    // ==================== Light ====================
    `${cls}-light{`,
    `  background:${t('light-sider-bg')};`,
    `}`,
    `${cls}-light ${cls}-trigger{`,
    `  color:${t('light-trigger-color')};`,
    `  background:${t('light-trigger-bg')};`,
    `}`,
    `${cls}-light ${cls}-zero-width-trigger{`,
    `  color:${t('light-trigger-color')};`,
    `  background:${t('light-trigger-bg')};`,
    `  border:${v('lineWidth')} ${v('lineType')} ${t('body-bg')};`,
    `  border-inline-start:0;`,
    `}`,
  ];

  return rules.join('');
}
