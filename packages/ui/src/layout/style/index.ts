/**
 * Layout 的样式生成（genLayoutStyle）。
 *
 * 契约来源：antd 6.6.4 `es/layout/style/index.js` 的 `genLayoutStyle` +
 * `@ant-design/cssinjs` extractStyle 的**实测产物**（cssVar 模式，hash 已去掉）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash / css-var 包裹类（D5）；19 个 Component Token 声明在 `.apollo-layout`
 *    与 `.apollo-layout-sider` 两块（与 antd 的两个 useStyle 对应）。
 * 2. Token 落 **var() 别名派生**（本仓约定；antd cssVar 产物是实值）—— 随主题自适应。
 * 3. `.ant-menu` 选择器用我们的 `.apollo-menu`（iconPrefixCls / 组件前缀对齐，
 *    result 与 tag 同范式）。
 * 4. antd 的 `'&, *': { box-sizing }` 展开为两条规则（本仓 CSS 生成器不做嵌套）。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名（组件内消费用）。 */
const cv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-layout-${name})`;

/**
 * Component Token 声明块（prepareComponentToken 的 19 个 token）。
 *
 * ⚠️ 三个字面常量（#001529 / #002140）是 antd 的硬编码值 —— E10 对「声明行」豁免。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  return [
    `  --${p}-layout-body-bg:${v('colorBgLayout')};`,
    `  --${p}-layout-color-bg-body:${v('colorBgLayout')};`,
    `  --${p}-layout-color-bg-header:#001529;`,
    `  --${p}-layout-color-bg-trigger:#002140;`,
    `  --${p}-layout-header-bg:#001529;`,
    `  --${p}-layout-header-height:calc(${v('controlHeight')} * 2);`,
    `  --${p}-layout-header-padding:0 calc(${v('controlHeightLG')} * 1.25);`,
    `  --${p}-layout-header-color:${v('colorText')};`,
    `  --${p}-layout-footer-padding:${v('controlHeightSM')} calc(${v('controlHeightLG')} * 1.25);`,
    `  --${p}-layout-footer-bg:${v('colorBgLayout')};`,
    `  --${p}-layout-sider-bg:#001529;`,
    `  --${p}-layout-trigger-height:calc(${v('controlHeightLG')} + ${v('marginXXS')} * 2);`,
    `  --${p}-layout-trigger-bg:#002140;`,
    `  --${p}-layout-trigger-color:${v('colorTextLightSolid')};`,
    `  --${p}-layout-zero-trigger-width:${v('controlHeightLG')};`,
    `  --${p}-layout-zero-trigger-height:${v('controlHeightLG')};`,
    `  --${p}-layout-light-sider-bg:${v('colorBgContainer')};`,
    `  --${p}-layout-light-trigger-bg:${v('colorBgContainer')};`,
    `  --${p}-layout-light-trigger-color:${v('colorText')};`,
  ];
}

/**
 * 生成 Layout 的静态 CSS（Layout / Header / Footer / Content）。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genLayoutStyle(rootPrefixCls: string): string {
  const cls = `.${rootPrefixCls}-layout`;
  const menuCls = `.${rootPrefixCls}-menu`;
  const t = (name: string) => cv(rootPrefixCls, name);

  const rules: string[] = [
    // ---- Component Token 声明（antd 的 .css-var-root 块）----
    `${cls}{`,
    ...genTokenDecls(rootPrefixCls),
    // resetComponent（antd 的 genStyleHooks 自动带的一段；漏了它两侧字体就不同）
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
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
    `${cls} ${cls}-header,${cls}${cls}-footer{`,
    `  flex:0 0 auto;`,
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
