/**
 * Space / Compact / Addon 的样式生成。
 *
 * 契约来源：antd 6.6.4 的 `es/space/style/index.js`（Space）、`style/compact.js`
 * （Compact）、`style/addon.js`（Addon）。选择器结构、属性、取值来源**逐条对齐**。
 *
 * ── 选择器结构是从 antd 的**真实产物**提取的，不是推演的 ─────────────────────────
 *
 * 用 `@ant-design/cssinjs` 的 `extractStyle` 渲染 antd 6.6.4 的 Space / Space.Compact /
 * Space.Addon 并提取 CSS（去掉 CSS-in-JS 的 hash 包裹层后），得到的就是下面这份。
 * 实测得到 **Space 16 条 + Compact 4 条 + Addon 34 条**。
 *
 * ⚠️ 三处最容易写错的地方：
 *
 *   1. **`.{prefix}-space .{prefix}-space-item:empty{display:none}` 是后代选择器**，
 *      不是顶级。写成顶级会让「所有 `-item` 都隐藏」—— 因为它丢掉了
 *      「必须位于 space 内部」这个约束。
 *   2. **`.{prefix}-space-align{flex-direction:column}` 这条看着像笔误但不是**：
 *      antd 的 `&-align` 上确实写了 `flexDirection: column`（`style/index.ts:29`），
 *      然后 `&-align-center` 等再覆盖 `align-items`。逐字保留。
 *   3. **Addon 的组件级 CSS 自定义属性必须内联**（见下）。
 *
 * ── ⚠️ Addon：`--apollo-space-addon-*` 不能照抄（差异 D7）──────────────────────
 *
 * antd 用 `genCssVar(antCls, 'space-addon')` 在规则**内部**声明了一批组件级自定义属性
 * （`--apollo-space-addon-addon-border-color` 等），再用 `var()` 引用它们 ——
 * 靠「自定义属性在同元素上被更具体的选择器覆盖」实现 variant / status 的优先级。
 *
 * 我们不能照抄，因为 `tests/build/run.mjs` 的 **B7** 要求 ui 的每份 CSS 里出现的
 * 每个 `var(--apollo-*)` 都能在 `packages/theme/dist/tokens.css` 的 `:root` 里找到声明
 * —— 这些变量是组件内局部声明的，B7 看不到它们（它只解析 theme 的 `:root` 块）。
 *
 * 所以这里把「自定义属性间接层」**展开成等价的选择器**。展开的规则是：
 * 某个属性在元素上的最终取值 = 所有匹配规则中特异性最高（同特异性取最后）的那条。
 * 逐条对照见下表（左边是 antd 的机制，右边是本文件的写法）：
 *
 * | antd | 本文件 |
 * |---|---|
 * | 基座 `border-color:var(--bc)`，`--bc:colorBorder` | `.addon{border-color:var(--apollo-color-border)}` |
 * | `-variant-outlined` 把 `--bc` 指向 `--bc-outlined` | `.addon-variant-outlined{border-color:var(--apollo-color-border)}` |
 * | `-variant-filled`：`--bc:transparent`、`--bg:var(--bg-filled)` | `.addon-variant-filled{border-color:transparent;background:var(--apollo-color-bg-container-disabled)}` |
 * | `-status-error` 改 `--bc-outlined` / `--bg-filled` | `.addon-status-error.addon-variant-outlined{border-color:var(--apollo-color-error)}` + `.addon-status-error.addon-variant-filled{background:var(--apollo-color-error-bg)}` |
 * | `-variant-filled.addon-disabled`（特异性 0,2,0）压过 `-variant-filled`（0,1,0） | 同选择器（0,2,0），但**必须排在 status 规则之后** |
 *
 * 最后一行是唯一有陷阱的一条：展开后 `-variant-filled.addon-disabled` 与
 * `-status-error.addon-variant-filled` 的**特异性相同**（都是 0,2,0），只能靠
 * 声明顺序决胜 —— 而 antd 那边靠的是特异性差。所以这里把 disabled 那条**放到
 * status 之后**（见下方 `⚠️ 顺序即契约` 标记）。
 * 反例：「filled + error + disabled」的 Addon 背景应当是 disabled 色，
 * 顺序写反会变成 error 背景。
 *
 * ── 这个函数没有证明什么 ──────────────────────────────────────────────────────
 *   - 没证明**视觉**正确（L6 的逐像素比对负责）。
 *   - 没证明变量名存在（B7 负责）。
 *   - 没证明 Addon 的**层叠**与 antd 等价 —— 上面那张表是推导，不是实测。
 *     实测成本很高（要构造 4 变体 × 4 状态 × 禁用 的组合并逐元素比对 computed style），
 *     已登记为 `docs/analysis/space.md` §12 的待验证问题。
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
    // Addon（antd `style/addon.ts`，34 条）
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
    // `border-color` / `background` 是展开后的结果（见文件头的 D7 说明）：
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
    `${addonCls}-compact-last-item{`,
    `  border-end-start-radius:0;`,
    `  border-start-start-radius:0;`,
    `}`,
    `${addonCls}-compact-first-item{`,
    `  border-end-end-radius:0;`,
    `  border-start-end-radius:0;`,
    `}`,
    `${addonCls}-compact-item:not(:first-child):not(:last-child){`,
    `  border-radius:0;`,
    `}`,
    `${addonCls}-compact-item:not(:last-child){`,
    `  border-inline-end-width:0;`,
    `}`,
    `${addonCls}-compact-item:not(:first-child){`,
    `  border-inline-start-width:0;`,
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
    `  background:transparent;`,
    `}`,
    '',
    // ---- Status（展开自 `--addon-border-color-outlined` / `--addon-background-filled`）----
    // ⚠️ status 只改「被 variant 引用的那个中间变量」，所以展开后必须写成
    //    「status + variant」的复合选择器，而不是给 `-status-error` 直接设 border-color
    //    （后者会让 `variant="filled"` + `status="error"` 的边框从 transparent 变成 error 色）。
    `${addonCls}-status-error{`,
    `  color:${v('colorError')};`,
    `}`,
    `${addonCls}-status-warning{`,
    `  color:${v('colorWarning')};`,
    `}`,
    `${addonCls}-status-error${addonCls}-variant-outlined{`,
    `  border-color:${v('colorError')};`,
    `}`,
    `${addonCls}-status-warning${addonCls}-variant-outlined{`,
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
    `${addonCompact}-item:not(${addonCls}-status-success){`,
    `  z-index:2;`,
    `}`,
    `${addonCompact}-item:active{`,
    `  z-index:3;`,
    `}`,
    `${addonCompact}-item:hover{`,
    `  z-index:4;`,
    `}`,
    `${addonCompact}-item[disabled]{`,
    `  z-index:0;`,
    `}`,
    `${addonCompact}-item:not(${addonCompact}-first-item):not(${addonCompact}-last-item){`,
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
    '',
  ].join('\n');
}
