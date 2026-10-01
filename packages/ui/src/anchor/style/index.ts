/**
 * Anchor 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/anchor/style/index.js`（204 行，两段：
 * `genSharedAnchorStyle` + `genSharedAnchorHorizontalStyle`）。
 * 选择器结构**从 cssinjs 的嵌套语义展开**，与 antd 真实产物逐条对齐。
 *
 * ```css
 * .{p}-wrapper                                     marginBlockStart:-h; paddingBlockStart:h
 * .{p}-wrapper .{p}                                resetComponent + position:relative + paddingInlineStart
 * .{p}-wrapper .{p}-link                           paddingBlock / paddingInline
 * .{p}-wrapper .{p}-link-title                     textEllipsis + marginBlockEnd + color + transition
 * .{p}-wrapper .{p}-link-title:only-child
 * .{p}-wrapper .{p}-link-active > .{p}-link-title  colorPrimary
 * .{p}-wrapper .{p}-link .{p}-link                 paddingBlock（**嵌套层**）
 * .{p}-wrapper:not(.-wrapper-horizontal) .{p}::before          左侧竖线
 * .{p}-wrapper:not(.-wrapper-horizontal) .{p}-ink              竖条（display:none）
 * .{p}-wrapper:not(.-wrapper-horizontal) .{p}-ink.…-ink-visible  才显示
 * .{p}-wrapper .{p}-fixed .{p}-ink .{p}-ink                     display:none
 * .{p}-wrapper-horizontal                          position:relative + ::before 底部横线
 * .{p}-wrapper-horizontal .{p}                     overflowX:scroll + display:flex
 * .{p}-wrapper-horizontal .{p}-link:first-of-type  paddingInline:0
 * .{p}-wrapper-horizontal .{p}-ink                 底部横条
 * ```
 *
 * 🚨 **四条最容易写错的选择器结构**（都靠 cssinjs 的 `&` 语义推出）：
 * 1. `&-title` 展开在 `.{p}-link` **之内** ⇒ `.apollo-anchor-wrapper .apollo-anchor-link-title`；
 * 2. `&-active > .{p}-link-title` ⇒ `.apollo-anchor-link-active > .apollo-anchor-link-title`（**子**选择器）；
 * 3. 嵌套的 `[{p}-link]` 在 `.{p}-link` 之内 ⇒ `.apollo-anchor-link .apollo-anchor-link`（**后代**，不是同级）；
 * 4. `.{p}-fixed .{p}-ink .{p}-ink` —— **`.{p}-ink` 写了两遍**（上游用重复提高特异性，照抄）。
 *
 * ── 与 antd 的两处**有意**差异 ────────────────────────────────────────────────
 *
 * 1. 无 cssinjs 的 hash 包裹（D2）；Component Token 的声明块**落在 `.{p}` 上**
 *    （上游挂在 `.css-var-root.{prefix}-css-var` —— 语义等价，`splitter` / `badge` 同判）。
 * 2. 两个派生值（`anchorPaddingBlockSecondary` / `anchorTitleBlock`）输出 `calc(var(--apollo-*))`
 *    而不是解析后的定值 —— 零运行时的必然结果（D7 家族）。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（L6 逐像素负责）；
 *   - 没证明变量名存在（`test:build` 的 B7 校验）。
 */

import { getDesignToken, token2CSSVar } from '@apollo-design/theme';
import { type ComponentToken, prepareComponentToken } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/** Component Token 的 CSS 变量名（组件内消费用）。 */
const cv = (rootPrefixCls: string, name: string): string =>
  `var(--${rootPrefixCls}-anchor-${name})`;

let tokenCache: ComponentToken | null = null;

function anchorTokenValues(): ComponentToken {
  if (!tokenCache) {
    tokenCache = prepareComponentToken(getDesignToken()) as ComponentToken;
  }
  return tokenCache;
}

/** Component Token 声明块（2 个字段，构建期解析值）。 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  const t = anchorTokenValues();
  return [
    `  --${p}-anchor-link-padding-block:${t.linkPaddingBlock}px;`,
    `  --${p}-anchor-link-padding-inline-start:${t.linkPaddingInlineStart}px;`,
  ];
}

/** antd 的 `textEllipsis`（三件套）。 */
const TEXT_ELLIPSIS = ['  overflow:hidden;', '  text-overflow:ellipsis;', '  white-space:nowrap;'];

export function genAnchorStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-anchor`;
  const wrapper = `${cls}-wrapper`;
  const link = `${cls}-link`;
  const title = `${link}-title`;
  const ink = `${cls}-ink`;

  const lineWidthBold = v('lineWidthBold');
  const colorPrimary = v('colorPrimary');
  const lineType = v('lineType');
  const colorSplit = v('colorSplit');
  const colorText = v('colorText');
  const motionDurationSlow = v('motionDurationSlow');
  // 派生值：`paddingXXS` / 2 与 `fontSize` / 14 * 3（见 style/token.ts 的说明）
  const holderOffsetBlock = v('paddingXXS');
  const anchorPaddingBlockSecondary = `calc(${v('paddingXXS')} / 2)`;
  const anchorTitleBlock = `calc(${v('fontSize')} / 14 * 3)`;

  return [
    // ---- genSharedAnchorStyle -------------------------------------------------
    `${wrapper}{`,
    `  margin-block-start:calc(${holderOffsetBlock} * -1);`,
    `  padding-block-start:${holderOffsetBlock};`,
    `}`,
    `${wrapper} ${cls}{`,
    ...genTokenDecls(p),
    // resetComponent 全套（本仓惯例：内联在组件根规则里，见 menu / splitter）
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${colorText};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  position:relative;`,
    `  padding-inline-start:${lineWidthBold};`,
    `}`,
    `${wrapper} ${link}{`,
    `  padding-block:${cv(p, 'link-padding-block')};`,
    `  padding-inline:${cv(p, 'link-padding-inline-start')} 0;`,
    `}`,
    `${wrapper} ${title}{`,
    ...TEXT_ELLIPSIS,
    `  position:relative;`,
    `  display:block;`,
    `  margin-block-end:${anchorTitleBlock};`,
    `  color:${colorText};`,
    `  transition:all ${motionDurationSlow};`,
    `}`,
    `${wrapper} ${title}:only-child{`,
    `  margin-block-end:0;`,
    `}`,
    `${wrapper} ${link}-active > ${title}{`,
    `  color:${colorPrimary};`,
    `}`,
    // 嵌套层（`[{p}-link]` 在 `.{p}-link` 之内 ⇒ 后代选择器）
    `${wrapper} ${link} ${link}{`,
    `  padding-block:${anchorPaddingBlockSecondary};`,
    `}`,
    '',
    // ---- 垂直专属（`&:not(${wrapper}-horizontal)`）----------------------------
    `${wrapper}:not(${wrapper}-horizontal) ${cls}::before{`,
    `  position:absolute;`,
    `  inset-inline-start:0;`,
    `  top:0;`,
    `  height:100%;`,
    `  border-inline-start:${lineWidthBold} ${lineType} ${colorSplit};`,
    `  content:" ";`,
    `}`,
    `${wrapper}:not(${wrapper}-horizontal) ${ink}{`,
    `  position:absolute;`,
    `  inset-inline-start:0;`,
    `  display:none;`,
    `  transform:translateY(-50%);`,
    `  transition:top ${motionDurationSlow} ease-in-out;`,
    `  width:${lineWidthBold};`,
    `  background-color:${colorPrimary};`,
    `}`,
    `${wrapper}:not(${wrapper}-horizontal) ${ink}${ink}-visible{`,
    `  display:inline-block;`,
    `}`,
    // 🚨 上游把 `.{p}-ink` 写了两遍（提高特异性）—— 照抄
    `${wrapper} ${cls}-fixed ${ink} ${ink}{`,
    `  display:none;`,
    `}`,
    '',
    // ---- genSharedAnchorHorizontalStyle --------------------------------------
    `${wrapper}-horizontal{`,
    `  position:relative;`,
    `}`,
    `${wrapper}-horizontal::before{`,
    `  position:absolute;`,
    `  left:0;`,
    `  right:0;`,
    `  bottom:0;`,
    `  border-bottom:${v('lineWidth')} ${lineType} ${colorSplit};`,
    `  content:" ";`,
    `}`,
    `${wrapper}-horizontal ${cls}{`,
    `  overflow-x:scroll;`,
    `  position:relative;`,
    `  display:flex;`,
    `  scrollbar-width:none;`,
    `}`,
    `${wrapper}-horizontal ${cls}::-webkit-scrollbar{`,
    `  display:none;`,
    `}`,
    `${wrapper}-horizontal ${link}:first-of-type{`,
    `  padding-inline:0;`,
    `}`,
    `${wrapper}-horizontal ${ink}{`,
    `  position:absolute;`,
    `  bottom:0;`,
    `  transition:left ${motionDurationSlow} ease-in-out,width ${motionDurationSlow} ease-in-out;`,
    `  height:${lineWidthBold};`,
    `  background-color:${colorPrimary};`,
    `}`,
  ].join('\n');
}
