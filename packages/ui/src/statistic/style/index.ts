/**
 * Statistic 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/statistic/style/index.js`（genStatisticStyle），
 * 取值逐条对齐 extract 产物（cssVar 模式，全 var() 化）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash/css-var 包裹类（D5）；2 个 Component Token 变量声明在根类（badge 范式），
 *    变量名 `--{root}-statistic-title-font-size` / `--{root}-statistic-content-font-size`。
 * 2. resetComponent 的 box-sizing 等已由 BASE_CSS 覆盖，不重复产出（spin 范式）——
 *    margin/padding/color/font-size/line-height/list-style/font-family 逐条保留。
 * 3. cssinjs 的 `&` 复合选择器（`-content-value` 等）在静态 CSS 里展开为后代选择器。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Statistic 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genStatisticStyle(rootPrefixCls: string): string {
  const cls = `.${rootPrefixCls}-statistic`;

  return [
    // ---- 根（Component Token + resetComponent 全套）----
    `${cls}{`,
    `  --${rootPrefixCls}-statistic-title-font-size:${v('fontSize')};`,
    `  --${rootPrefixCls}-statistic-content-font-size:${v('fontSizeHeading3')};`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `}`,

    // ---- header / title ----
    `${cls} ${cls}-header{`,
    `  padding-bottom:${v('marginXXS')};`,
    `}`,
    `${cls} ${cls}-title{`,
    `  color:${v('colorTextDescription')};`,
    `  font-size:var(--${rootPrefixCls}-statistic-title-font-size);`,
    `}`,

    // ---- skeleton 包裹层 ----
    `${cls} ${cls}-skeleton{`,
    `  padding-top:${v('padding')};`,
    `}`,

    // ---- content / value / prefix / suffix ----
    `${cls} ${cls}-content{`,
    `  color:${v('colorTextHeading')};`,
    `  font-size:var(--${rootPrefixCls}-statistic-content-font-size);`,
    `  font-family:${v('fontFamily')};`,
    `}`,
    `${cls} ${cls}-content ${cls}-content-value{`,
    `  display:inline-block;`,
    `  direction:ltr;`,
    `}`,
    `${cls} ${cls}-content ${cls}-content-prefix,${cls} ${cls}-content ${cls}-content-suffix{`,
    `  display:inline-block;`,
    `}`,
    `${cls} ${cls}-content ${cls}-content-prefix{`,
    `  margin-inline-end:${v('marginXXS')};`,
    `}`,
    `${cls} ${cls}-content ${cls}-content-suffix{`,
    `  margin-inline-start:${v('marginXXS')};`,
    `}`,
  ].join('\n');
}
