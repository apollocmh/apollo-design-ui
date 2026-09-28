/**
 * Popconfirm 的样式生成（genBaseStyle）。
 *
 * 契约来源：antd 6.6.4 的 `es/popconfirm/style/index.js`（产物实测）。
 *
 * ── 与 antd 产物的有意差异（与 radio / segmented 同判）───────────────────────
 *
 * 1. 无 hash / `-css-var` 包裹类（D5）；Token 落 var() 派生，随主题自适应。
 * 2. `genStyleHooks(..., { resetStyle: false })` ⇒ **不套 resetComponent**
 *    （上游逐字），所以本文件没有 reset 段；`fontSize` 由
 *    `.apollo-popconfirm.apollo-popover{font-size:…}` 这条单独给。
 * 3. `iconCls` 从 `.anticon` 换成 `.apollo-icon`（D15 的同侧判据）。
 * 4. `zIndexPopup` 是**唯一**的 Component Token（`zIndexPopupBase + 60`），
 *    其余全部走 alias token。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名。 */
const cv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-popconfirm-${name})`;

/**
 * Component Token 声明块（`prepareComponentToken` 的 **1** 个字段）。
 * 与 modal / popover 同范式：z-index 走 calc 派生。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  return [`  --${rootPrefixCls}-popconfirm-z-index-popup:calc(${v('zIndexPopupBase')} + 60);`];
}

/**
 * 生成 Popconfirm 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genPopconfirmStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const root = `.${p}-popconfirm`;
  const message = `${root}-message`;
  const icon = `${root}-message-icon`;
  const title = `${root}-title`;
  const description = `${root}-description`;
  const buttons = `${root}-buttons`;

  return [
    // ⚠️ resetStyle: false —— 上游没有 resetComponent 段，逐字保留
    `${root}{`,
    // Component Token 声明（antd 的 cssVar 根块等价物）
    ...genTokenDecls(p),
    `  z-index:${cv(p, 'z-index-popup')};`,
    `}`,
    // 浮层容器上的字号（antd 的 `&${antCls}-popover`）
    `${root}.${p}-popover{`,
    `  font-size:${v('fontSize')};`,
    `}`,
    `${message}{`,
    `  margin-bottom:${v('marginXS')};`,
    `  display:flex;`,
    `  flex-wrap:nowrap;`,
    `  align-items:start;`,
    `}`,
    `${message}>${icon}{`,
    `  color:${v('colorWarning')};`,
    `}`,
    `${message}>${icon} .${p}-icon{`,
    `  font-size:${v('fontSize')};`,
    `  line-height:1;`,
    `  margin-inline-end:${v('marginXS')};`,
    `}`,
    `${title}{`,
    `  font-weight:${v('fontWeightStrong')};`,
    `  color:${v('colorTextHeading')};`,
    `}`,
    // antd：`'&:only-child'` —— 只有 title 没有 description 时不加粗
    `${title}:only-child{`,
    `  font-weight:normal;`,
    `}`,
    `${description}{`,
    `  margin-top:${v('marginXXS')};`,
    `  color:${v('colorText')};`,
    `}`,
    `${buttons}{`,
    `  text-align:end;`,
    `  white-space:nowrap;`,
    `}`,
    `${buttons} button{`,
    `  margin-inline-start:${v('marginXS')};`,
    `}`,
  ].join('\n');
}
