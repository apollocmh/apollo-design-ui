/**
 * Timeline 的**横向**样式（对应上游 `es/timeline/style/horizontal.ts`，120 行）。
 *
 * 产物交叉验证：`extract-timeline-css.mjs` 的 **29-42** 号规则（14 条）。
 *
 * ── 这个文件为什么单独存在（与上游一致）─────────────────────────────────────
 *
 * 横向模式是一整套**独立的定位体系**（`position:absolute` + `left:50%` +
 * `translateX(-50%)` + `-alternate-content-offset`），与纵向的「按 `head-span` 分栏」
 * 完全不同 —— 上游把它拆成独立文件，本仓照做（便于与产物逐段对拍）。
 *
 * ── 三处**非显然**结构 ───────────────────────────────────────────────────────
 *
 * 1. **`-horizontal` 会覆盖 Steps 的 `title-vertical-row-gap`**
 *    （`--{p}-cmp-steps-title-vertical-row-gap: var(--apollo-padding-xs)`）——
 *    横向时间轴把标题的纵向间距当成「一行内容的高度」来用。
 * 2. **`-layout-alternate` 与 `:not(-layout-alternate)` 是两套完全不同的布局**
 *    （前者上下交错、后者单侧靠齐），且选择器用 `:not()` 而不是叠加类。
 * 3. **`-item-wrapper` 的高度是算出来的**（`calc(content-height * 2 + row-gap * 2 + icon-size-max)`）
 *    ⇒ 横向交错布局要求两侧内容区等高。
 */

import type { TimelineStyleContext } from './context';

export function genHorizontalStyle(ctx: TimelineStyleContext): string[] {
  // ⚠️ 横向的 14 条规则只消费**全局 token**（`v`）与 **Steps 的内部变量**（`sv`）——
  //    不用 Component Token（`tv`），所以不解构它。
  const { cls, v, sv } = ctx;
  const item = `${cls}-item`;
  const icon = `${item}-icon`;
  const rail = `${item}-rail`;
  const title = `${item}-title`;
  const subtitle = `${item}-subtitle`;
  const content = `${item}-content`;
  const wrapper = `${item}-wrapper`;

  /** `-horizontal` 的两套布局前缀。 */
  const alt = `${cls}-horizontal${cls}-layout-alternate`;
  const single = `${cls}-horizontal:not(${cls}-layout-alternate)`;

  return [
    // ---- 29 根：覆盖 Steps 的纵向行距 + 自己的 content-height ----
    `${cls}-horizontal{`,
    // ⚠️ **声明**的是 Steps 的变量 ⇒ 必须用它的**固定 `apollo`** 前缀（见文件头 / `index.ts` 的 `sv`）
    `  --apollo-cmp-steps-title-vertical-row-gap:${v('paddingXS')};`,
    `  --${ctx.p}-timeline-content-height:${v('fontHeight')};`,
    `  align-items:stretch;`,
    `}`,

    // ---- 30 wrapper：交错布局的等高 + 偏移量 ----
    `${alt} ${item} ${wrapper}{`,
    `  --${ctx.p}-timeline-alternate-content-offset:calc(var(--${ctx.p}-timeline-content-height) + ${sv('title-vertical-row-gap')} * 2 + ${sv('icon-size-max')});`,
    `  height:calc(var(--${ctx.p}-timeline-content-height) * 2 + ${sv('title-vertical-row-gap')} * 2 + ${sv('icon-size-max')});`,
    `}`,

    // ---- 31-32 icon / rail 的绝对定位 ----
    `${alt} ${item} ${icon}{`,
    `  position:absolute;`,
    `}`,
    `${alt} ${item} ${icon},${alt} ${item} ${rail}{`,
    `  position:absolute;`,
    `  top:50%;`,
    `  transform:translateY(-50%);`,
    `  margin:0;`,
    `}`,

    // ---- 33 三个文本槽都不换行 ----
    `${alt} ${item} ${title},${alt} ${item} ${subtitle},${alt} ${item} ${content}{`,
    `  white-space:nowrap;`,
    `  max-width:unset;`,
    `}`,

    // ---- 34-35 title / content 水平居中 ----
    `${alt} ${item} ${title}{`,
    `  position:absolute;`,
    `  left:50%;`,
    `  transform:translateX(-50%);`,
    `}`,
    `${alt} ${item} ${content}{`,
    `  position:absolute;`,
    `  left:50%;`,
    `  transform:translateX(-50%);`,
    `}`,

    // ---- 36-39 placement 决定 title / content 在轴的哪一侧 ----
    `${alt} ${item}-placement-start ${title}{`,
    `  bottom:var(--${ctx.p}-timeline-alternate-content-offset);`,
    `}`,
    `${alt} ${item}-placement-start ${content}{`,
    `  top:var(--${ctx.p}-timeline-alternate-content-offset);`,
    `}`,
    `${alt} ${item}-placement-end ${title}{`,
    `  top:var(--${ctx.p}-timeline-alternate-content-offset);`,
    `}`,
    `${alt} ${item}-placement-end ${content}{`,
    `  bottom:var(--${ctx.p}-timeline-alternate-content-offset);`,
    `}`,

    // ---- 40-42 非交错的横向：单侧靠齐 + rail 翻转 ----
    `${single} ${item}-placement-end{`,
    `  display:flex;`,
    `  align-items:flex-end;`,
    `}`,
    `${single} ${item}-placement-end ${wrapper}{`,
    `  flex:auto;`,
    `  flex-direction:column-reverse;`,
    `}`,
    `${single} ${item}-placement-end ${rail}{`,
    `  top:auto;`,
    `  bottom:${sv('horizontal-rail-margin')};`,
    `  transform:translateY(50%);`,
    `}`,
  ];
}
