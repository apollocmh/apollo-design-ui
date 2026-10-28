/**
 * Static Space / Compact / Addon CSS, using existing Alias tokens.
 * Historical source: Ant Design 6.6.4 space/style (see docs/analysis/space.md).
 * Current rules: Space 16, Compact 4, Addon 31. The 2026-10-28 audit replaces
 * five positional/duplicate edge rules with context-based horizontal/vertical
 * joining, retaining all singleton corners and the actual shared border.
 * Underlined draws a straight bottom border; other variants retain their paint.
 * Variant/status/disabled selector order preserves the established paint cascade.
 * Browser evidence verifies actual theme colors and geometry; rule counts alone do not.
 */

import { token2CSSVar } from '@apollo-design/theme';
import { SPACE_GAP_ALIASES } from './token';

/** token 名 → `var(--apollo-*)`。变量名由 theme 包的命名函数给出，不手写字面量。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * 生成 Space 全家桶的静态 CSS（Space + Compact + Addon）。
 *
 * @param prefixCls 类名前缀（`apollo` 或 `ant`）。
 *   ⚠️ 它是**完整前缀**：`getPrefixCls('space')` 在不传 customizePrefixCls 时返回
 *   `${prefixCls}-space`，传了则**直接返回**该值（不加后缀）。
 */
export function genSpaceStyle(prefixCls: string): string {
  // Space 的根类名：`getPrefixCls('space')` → `${prefixCls}-space`
  const cls = `.${prefixCls}-space`;
  // Compact / Addon 用的是**独立的** suffixCls，所以是 `${prefixCls}-space-compact` /
  // `${prefixCls}-space-addon`（不是 `${cls}-compact`）。
  const compactCls = `.${prefixCls}-space-compact`;
  const addonCls = `.${prefixCls}-space-addon`;

  // Addon 的「紧凑项」类名由 `useCompactItemContext` 拼出来，前缀是 addon 自己的
  // prefixCls —— 所以 `genCompactItemStyle` 的产物落在 `-space-addon` 上。
  const addonCompact = `${addonCls}-compact`;

  const item = `${cls}-item`;
  // `antCls` 在 antd 里是根前缀（默认 `ant`，我们传 `apollo`）——
  // 所以这条选择器里的 badge 类是 `.apollo-badge-not-a-wrapper`。
  const badge = `.${prefixCls}-badge-not-a-wrapper`;

  const lineWidth = v('lineWidth');

  return [
    // =======================================================================
    // Space 基座（antd `genSpaceStyle`，16 条）
    // =======================================================================
    `${cls}{`,
    `  display:inline-flex;`,
    `}`,
    `${cls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    `${cls}-vertical{`,
    `  flex-direction:column;`,
    `}`,
    // ⚠️ `-align` 上的 `flex-direction:column` 不是笔误 —— 逐字来自 antd
    //    `style/index.ts:29`。真正决定对齐方向的是下面四条 `align-items`。
    `${cls}-align{`,
    `  flex-direction:column;`,
    `}`,
    `${cls}-align-center{`,
    `  align-items:center;`,
    `}`,
    `${cls}-align-start{`,
    `  align-items:flex-start;`,
    `}`,
    `${cls}-align-end{`,
    `  align-items:flex-end;`,
    `}`,
    `${cls}-align-baseline{`,
    `  align-items:baseline;`,
    `}`,
    // ⚠️ 后代选择器（不是顶级）：空 item 只在 space 内部才隐藏。
    `${cls} ${item}:empty{`,
    `  display:none;`,
    `}`,
    // https://github.com/ant-design/ant-design/issues/47875
    `${cls} ${item}>${badge}:only-child{`,
    `  display:block;`,
    `}`,
    '',
    // ---- genSpaceGapStyle：六条 gap 规则（预设串走类名，数字走内联）--------
    `${cls}-gap-row-small{`,
    `  row-gap:${v(SPACE_GAP_ALIASES.small)};`,
    `}`,
    `${cls}-gap-row-medium,${cls}-gap-row-middle{`,
    `  row-gap:${v(SPACE_GAP_ALIASES.middle)};`,
    `}`,
    `${cls}-gap-row-large{`,
    `  row-gap:${v(SPACE_GAP_ALIASES.large)};`,
    `}`,
    `${cls}-gap-col-small{`,
    `  column-gap:${v(SPACE_GAP_ALIASES.small)};`,
    `}`,
    `${cls}-gap-col-medium,${cls}-gap-col-middle{`,
    `  column-gap:${v(SPACE_GAP_ALIASES.middle)};`,
    `}`,
    `${cls}-gap-col-large{`,
    `  column-gap:${v(SPACE_GAP_ALIASES.large)};`,
    `}`,
    '',
    // =======================================================================
    // Compact（antd `style/compact.ts`，4 条）
    //
    // ⚠️ 它**没有** resetComponent —— 上游 `genStyleHooks(['Space','Compact'], …,
    //    { resetStyle: false })` 显式关掉了（Space 的注释：
    //    "Space component don't apply extra font style"）。
    // =======================================================================
    `${compactCls}{`,
    `  display:inline-flex;`,
    `}`,
    `${compactCls}-block{`,
    `  display:flex;`,
    `  width:100%;`,
    `}`,
    `${compactCls}-vertical{`,
    `  flex-direction:column;`,
    `}`,
    `${compactCls}-rtl{`,
    `  direction:rtl;`,
    `}`,
    '',
    // =======================================================================
    // Addon（历史来源为 antd `style/addon.ts`，当前 31 条）
    // =======================================================================
    // ---- resetComponent(token) 的前半段（antd `components/style/index.tsx`）----
    `${addonCls}{`,
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  box-sizing:border-box;`,
    `}`,
    `${addonCls}::before,${addonCls}::after{`,
    `  box-sizing:border-box;`,
    `}`,
    `${addonCls} [class^="${prefixCls}-space-addon"],${addonCls} [class*=" ${prefixCls}-space-addon"]{`,
    `  box-sizing:border-box;`,
    `}`,
    `${addonCls} [class^="${prefixCls}-space-addon"]::before,${addonCls} [class*=" ${prefixCls}-space-addon"]::before,${addonCls} [class^="${prefixCls}-space-addon"]::after,${addonCls} [class*=" ${prefixCls}-space-addon"]::after{`,
    `  box-sizing:border-box;`,
    `}`,
    // ---- 基座（resetComponent 后半段 + 布局 + 边框 + variant/status 的默认值）----
    // `border-color` / `background` 是展开后的结果（见文件头的 D38 说明）：
    //   antd: border-color:var(--addon-border-color) 且 --addon-border-color 默认 = colorBorder
    //   antd: background:var(--addon-background)     且 --addon-background 默认 = colorBgContainerDisabled
    `${addonCls}{`,
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${v('colorText')};`,
    `  font-size:${v('fontSize')};`,
    `  line-height:${v('lineHeight')};`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  display:inline-flex;`,
    `  align-items:center;`,
    `  gap:0;`,
    `  white-space:nowrap;`,
    `  padding-inline:${v('paddingSM')};`,
    `  border-width:${lineWidth};`,
    `  border-style:${v('lineType')};`,
    `  border-radius:${v('borderRadius')};`,
    `  border-color:${v('colorBorder')};`,
    `  background:${v('colorBgContainerDisabled')};`,
    `}`,
    `${addonCls}:hover{`,
    `  z-index:0;`,
    `}`,
    `${addonCls}${addonCls}-disabled{`,
    `  color:${v('colorTextDisabled')};`,
    `}`,
    `${addonCls}-large{`,
    `  font-size:${v('fontSizeLG')};`,
    `  border-radius:${v('borderRadiusLG')};`,
    `}`,
    `${addonCls}-small{`,
    `  padding-inline:${v('paddingXS')};`,
    `  border-radius:${v('borderRadiusSM')};`,
    `  font-size:${v('fontSizeSM')};`,
    `}`,
    '',
    // ---- Variants（展开自 `--addon-border-color` / `--addon-background`）----
    `${addonCls}-variant-outlined{`,
    `  border-color:${v('colorBorder')};`,
    `}`,
    `${addonCls}-variant-filled{`,
    `  border-color:transparent;`,
    `  background:${v('colorBgContainerDisabled')};`,
    `}`,
    `${addonCls}-variant-borderless{`,
    `  border:none;`,
    `  background:transparent;`,
    `}`,
    `${addonCls}-variant-underlined{`,
    `  border:none;`,
    `  border-bottom:${lineWidth} ${v('lineType')} ${v('colorBorder')};`,
    `  border-radius:0;`,
    `  background:transparent;`,
    `}`,
    '',
    // ---- Status（展开自 `--addon-border-color-outlined` / `--addon-background-filled`）----
    // ⚠️ status 只改「被 variant 引用的那个中间变量」，所以展开后必须写成
    //    「status + variant」的复合选择器，而不是给 `-status-error` 直接设 border-color
    //    （后者会让 `variant="filled"` + `status="error"` 的边框从 transparent 变成 error 色）。
    `${addonCls}-status-error{`,
    `  color:color-mix(in srgb,${v('colorErrorText')} 50%,${v('colorText')});`,
    `}`,
    `${addonCls}-status-warning{`,
    `  color:color-mix(in srgb,${v('colorWarningText')} 50%,${v('colorText')});`,
    `}`,
    `${addonCls}-status-error${addonCls}-variant-outlined,${addonCls}-status-error${addonCls}-variant-underlined{`,
    `  border-color:${v('colorError')};`,
    `}`,
    `${addonCls}-status-warning${addonCls}-variant-outlined,${addonCls}-status-warning${addonCls}-variant-underlined{`,
    `  border-color:${v('colorWarning')};`,
    `}`,
    `${addonCls}-status-error${addonCls}-variant-filled{`,
    `  background:${v('colorErrorBg')};`,
    `}`,
    `${addonCls}-status-warning${addonCls}-variant-filled{`,
    `  background:${v('colorWarningBg')};`,
    `}`,
    '',
    // ---- ⚠️ 顺序即契约：这一条**必须**排在 status 之后 ----
    // 展开前，`-variant-filled.addon-disabled`（0,2,0）靠特异性压过 `-variant-filled`（0,1,0），
    // 而 `-status-error` 改的是另一个变量，所以「filled + error + disabled」得到的是
    // **disabled 色**。展开后两者特异性相同（都是 0,2,0），只能靠顺序。
    `${addonCls}-variant-filled${addonCls}-disabled{`,
    `  border-color:${v('colorBorder')};`,
    `  background:${v('colorBgContainerDisabled')};`,
    `}`,
    '',
    // ---- genCompactItemStyle(token, { focus: false }) --------------------
    `${addonCompact}-item:not(${addonCompact}-last-item){`,
    `  margin-inline-end:calc(${lineWidth} * -1);`,
    `}`,
    `${addonCompact}-vertical-item:not(${addonCompact}-vertical-last-item){`,
    `  margin-bottom:calc(${lineWidth} * -1);`,
    `}`,
    `${addonCompact}-item:not(${addonCls}-status-success),${addonCompact}-vertical-item:not(${addonCls}-status-success){`,
    `  z-index:2;`,
    `}`,
    `${addonCompact}-item:active,${addonCompact}-vertical-item:active{`,
    `  z-index:3;`,
    `}`,
    `${addonCompact}-item:hover,${addonCompact}-vertical-item:hover{`,
    `  z-index:4;`,
    `}`,
    `${addonCompact}-item[disabled],${addonCompact}-vertical-item[disabled],${addonCompact}-item${addonCls}-disabled,${addonCompact}-vertical-item${addonCls}-disabled{`,
    `  z-index:0;`,
    `}`,
    `${addonCompact}-item:not(${addonCompact}-first-item):not(${addonCompact}-last-item),${addonCompact}-vertical-item:not(${addonCompact}-vertical-first-item):not(${addonCompact}-vertical-last-item){`,
    `  border-radius:0;`,
    `}`,
    `${addonCompact}-item:not(${addonCompact}-last-item)${addonCompact}-first-item,${addonCompact}-item:not(${addonCompact}-last-item)${addonCompact}-first-item${addonCls}-sm,${addonCompact}-item:not(${addonCompact}-last-item)${addonCompact}-first-item${addonCls}-lg{`,
    `  border-start-end-radius:0;`,
    `  border-end-end-radius:0;`,
    `}`,
    `${addonCompact}-item:not(${addonCompact}-first-item)${addonCompact}-last-item,${addonCompact}-item:not(${addonCompact}-first-item)${addonCompact}-last-item${addonCls}-sm,${addonCompact}-item:not(${addonCompact}-first-item)${addonCompact}-last-item${addonCls}-lg{`,
    `  border-start-start-radius:0;`,
    `  border-end-start-radius:0;`,
    `}`,
    `${addonCompact}-vertical-item:not(${addonCompact}-vertical-last-item)${addonCompact}-vertical-first-item{`,
    `  border-end-start-radius:0;`,
    `  border-end-end-radius:0;`,
    `}`,
    `${addonCompact}-vertical-item:not(${addonCompact}-vertical-first-item)${addonCompact}-vertical-last-item{`,
    `  border-start-start-radius:0;`,
    `  border-start-end-radius:0;`,
    `}`,
    '',
  ].join('\n');
}
