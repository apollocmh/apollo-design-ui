/**
 * Rate 的样式生成（genRateStyle）。
 *
 * 契约来源：antd 6.6.4 `components/rate/style/index.ts`（171 行）+
 * `@ant-design/cssinjs` 2.1.2 的 `extractStyle(cache, { plain: true })` **实测产物**
 * （cssVar 模式，hash 已去掉，提取脚本 `tests/visual/debug/extract-rate.mjs`，
 * 见 `docs/analysis/rate.md`）。
 *
 * ── 与 antd 产物的有意差异 ────────────────────────────────────────────────────
 *
 * 1. 无 hash / `:where(.css-dev-only-…)` 包裹层（D5）；无 `-css-var` 死选择器 ——
 *    Component Token 声明（`.css-var-_R_0_.ant-rate` 块，D69）等价落到根形态
 *    `.apollo-rate` 上（原序字面量）。
 * 2. Token 落 **var() 别名派生**（本仓约定；antd cssVar 产物是实值）—— 随主题自适应：
 *    `star-color` = yellow6、`star-size` = calc(controlHeight * 0.625) 等。
 *    `line-width-focus` 在 antd 产物里是 `1px`（prepareComponentToken 把它设成
 *    **lineWidth**，非 alias 的 lineWidthFocus=3）—— 用 `var(--apollo-line-width)` 派生。
 *    `star-hover-scale` 是常量 `scale(1.1)`（字面量，唯一真源在 style/token.ts）。
 * 3. `@keyframes loadingCircle`（icons/spin 的共享动效）不是 rate 的样式 —— 不复制
 *    （motion 基线职责，dropdown 的 slide-* 同判）。
 * 4. `.data-ant-cssinjs-cache-path` 是 cssinjs 调试产物 —— 不复制。
 */

import { token2CSSVar } from '@apollo-design/theme';

/** token 名 → `var(--apollo-*)`。 */
const v = (token: string): string => `var(${token2CSSVar(token)})`;

/**
 * Component Token 声明块（antd 产物 `.css-var-_R_0_.ant-rate` 块的 **7** 条，原序）。
 *
 * ⚠️ `line-width-focus` 是 antd 产物里就在组件块里的第 7 条（别名派生值），与
 *    `style/token.ts` 的 6 个 ComponentToken 字段是两回事 —— 按产物逐字保留。
 */
export function genTokenDecls(rootPrefixCls: string): string[] {
  const p = rootPrefixCls;
  return [
    `  --${p}-rate-line-width-focus:${v('lineWidth')};`,
    `  --${p}-rate-star-color:${v('yellow-6')};`,
    `  --${p}-rate-star-size:calc(${v('controlHeight')} * 0.625);`,
    `  --${p}-rate-star-size-sm:calc(${v('controlHeightSM')} * 0.625);`,
    `  --${p}-rate-star-size-lg:calc(${v('controlHeightLG')} * 0.625);`,
    `  --${p}-rate-star-hover-scale:scale(1.1);`,
    `  --${p}-rate-star-bg:${v('colorFillContent')};`,
  ];
}

/** cv —— Component Token 的 CSS 变量引用（组件内消费用）。 */
const cv = (rootPrefixCls: string, name: string): string => `var(--${rootPrefixCls}-rate-${name})`;

/**
 * 生成 Rate 的静态 CSS。
 *
 * @param rootPrefixCls 根前缀（`apollo` 或 `ant`）
 */
export function genRateStyle(rootPrefixCls: string): string {
  const p = rootPrefixCls;
  const cls = `.${p}-rate`;
  const star = `${cls} ${cls}-star`;

  const lines: string[] = [
    // ---- Component Token 声明（antd 的 `.css-var-_R_0_.ant-rate` 块，D69）----
    `${cls}{`,
    ...genTokenDecls(p),
    `}`,

    // ---- resetComponent（antd 产物第一个 `.ant-rate` 块 + ::before/::after + [class^] 段）----
    `${cls}{`,
    `  font-family:${v('fontFamily')};`,
    `  font-size:${v('fontSize')};`,
    `  box-sizing:border-box;`,
    `}`,
    `${cls}::before,${cls}::after{`,
    `  box-sizing:border-box;`,
    `}`,
    `${cls} [class^="${p}-rate"],${cls} [class*=" ${p}-rate"]{`,
    `  box-sizing:border-box;`,
    `}`,
    `${cls} [class^="${p}-rate"]::before,${cls} [class*=" ${p}-rate"]::before,${cls} [class^="${p}-rate"]::after,${cls} [class*=" ${p}-rate"]::after{`,
    `  box-sizing:border-box;`,
    `}`,

    // ---- 主块（antd 产物第二个 `.ant-rate` 块）----
    `${cls}{`,
    `  box-sizing:border-box;`,
    `  margin:0;`,
    `  padding:0;`,
    `  color:${cv(p, 'star-color')};`,
    `  font-size:${cv(p, 'star-size')};`,
    `  line-height:1;`,
    `  list-style:none;`,
    `  font-family:${v('fontFamily')};`,
    `  display:inline-block;`,
    `  outline:none;`,
    `}`,

    // ---- 尺寸 ----
    `${cls}-small{`,
    `  font-size:${cv(p, 'star-size-sm')};`,
    `}`,
    `${cls}-large{`,
    `  font-size:${cv(p, 'star-size-lg')};`,
    `}`,

    // ---- disabled ----
    `${cls}-disabled${cls} ${cls}-star{`,
    `  cursor:default;`,
    `}`,
    `${cls}-disabled${cls} ${cls}-star >div:hover{`,
    `  transform:scale(1);`,
    `}`,

    // ---- star ----
    `${star}{`,
    `  position:relative;`,
    `  display:inline-block;`,
    `  color:inherit;`,
    `  cursor:pointer;`,
    `}`,
    `${star}:not(:last-child){`,
    `  margin-inline-end:${v('marginXS')};`,
    `}`,
    `${star} >div{`,
    `  transition:all ${v('motionDurationMid')},outline 0s;`,
    `}`,
    `${star} >div:hover{`,
    `  transform:${cv(p, 'star-hover-scale')};`,
    `}`,
    `${star} >div:focus{`,
    `  outline:0;`,
    `}`,
    `${star} >div:focus-visible{`,
    `  outline:${cv(p, 'line-width-focus')} dashed ${cv(p, 'star-color')};`,
    `  transform:${cv(p, 'star-hover-scale')};`,
    `}`,
    `${cls} ${cls}-star-first,${cls} ${cls}-star-second{`,
    `  color:${cv(p, 'star-bg')};`,
    `  transition:all ${v('motionDurationMid')};`,
    `  user-select:none;`,
    `}`,
    `${cls} ${cls}-star-first{`,
    `  position:absolute;`,
    `  top:0;`,
    `  inset-inline-start:0;`,
    `  width:50%;`,
    `  height:100%;`,
    `  overflow:hidden;`,
    `  opacity:0;`,
    `}`,
    `${cls} ${cls}-star-half ${cls}-star-first,${cls} ${cls}-star-half ${cls}-star-second{`,
    `  opacity:1;`,
    `}`,
    `${cls} ${cls}-star-half ${cls}-star-first,${cls} ${cls}-star-full ${cls}-star-second{`,
    `  color:inherit;`,
    `}`,

    // ---- rtl ----
    `${cls}-rtl${cls}{`,
    `  direction:rtl;`,
    `}`,
  ];

  return lines.join('\n');
}
