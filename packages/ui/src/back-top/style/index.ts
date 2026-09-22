/**
 * BackTop 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/back-top/style/index.js`（genSharedBackTopStyle +
 * genMediaBackTopStyle），取值逐条对齐 extract 产物（cssVar 模式，全 var() 化）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash/css-var 包裹类（D5）；Component Token 的 1 个变量声明在根类
 *    （badge 范式）。
 * 2. resetComponent 的 box-sizing 等已由 BASE_CSS 覆盖，不重复产出（spin 范式）。
 * 3. **没有 `-fade` keyframes** —— antd 的产物同样没有（G1 §2.8：initFadeMotion
 *      只有 tooltip 等局部使用），fade 类挂在 DOM 上但无动画 CSS，逐字保留。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 BackTop 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genBackTopStyle(rootPrefixCls: string): string {
  const cls = `.${rootPrefixCls}-back-top`;

  const rules: string[] = [
    // ---- Component Token（antd 的 prepareComponentToken：zIndexBase + 10）----
    `${cls}{`,
    `  --${rootPrefixCls}-back-top-z-index-popup:calc(${v('zIndexBase')} + 10);`,
    // resetComponent（antd 的组件根 reset 全套 —— L6 实测 line-height 缺失让
    //   按钮行高 16.1 vs 22；color 也来自它，不是 genCommonStyle 的子集）
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  position:fixed;`,
    `  inset-inline-end:calc(${v('controlHeightLG')} * 2.5);`,
    `  inset-block-end:calc(${v('controlHeightLG')} * 1.25);`,
    `  z-index:var(--${rootPrefixCls}-back-top-z-index-popup);`,
    `  width:40px;`,
    `  height:40px;`,
    `  cursor:pointer;`,
    `}`,

    // ---- :empty 兜底（children 为空时隐藏）----
    `${cls}:empty{`,
    `  display:none;`,
    `}`,

    // ---- content ----
    `${cls} ${cls}-content{`,
    `  width:${v('controlHeightLG')};`,
    `  height:${v('controlHeightLG')};`,
    `  overflow:hidden;`,
    `  color:${v('colorTextLightSolid')};`,
    `  text-align:center;`,
    `  background-color:${v('colorTextDescription')};`,
    `  border-radius:${v('controlHeightLG')};`,
    `  transition:all ${v('motionDurationMid')};`,
    `}`,
    `${cls} ${cls}-content:hover{`,
    `  background-color:${v('colorText')};`,
    `  transition:all ${v('motionDurationMid')};`,
    `}`,

    // ---- icon ----
    `${cls} ${cls}-icon{`,
    `  font-size:${v('fontSizeHeading3')};`,
    `  line-height:${v('controlHeightLG')};`,
    `}`,
  ];

  // ---- 响应式（genMediaBackTopStyle）----
  // ⚠️ 断点必须用**字面量**（768/480 = theme 的 screenMD/screenXS 默认值）：
  //    CSS 变量在 @media 的 media feature 里**非法**（浏览器整条忽略）——
  //    L6 实测 back-top 在 375px 视口没走到 screenXS 档。与 badge 的派生
  //    常量同理：主题覆盖 alias token 不改变断点（已知边界，README §7）。
  rules.push(
    `@media (max-width: 768px){`,
    `  ${cls}{`,
    `    inset-inline-end:calc(${v('controlHeightLG')} * 1.5);`,
    `  }`,
    `}`,
    `@media (max-width: 480px){`,
    `  ${cls}{`,
    `    inset-inline-end:calc(${v('controlHeightLG')} * 0.5);`,
    `  }`,
    `}`,
  );

  return rules.join('\n');
}
